import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { Injection, InjectionSchedule, AdministerInjectionRequest } from '../../models/injection.model';
import { InjectionPaperComponent } from '../injection-paper/injection-paper.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-injection-management',
  templateUrl: './injection-management.component.html',
  styleUrls: ['./injection-management.component.css']
})
export class InjectionManagementComponent implements OnInit {
  activeInjections: Injection[] = [];
  todaySchedules: InjectionSchedule[] = [];
  selectedInjection: Injection | null = null;
  isLoading = false;
  currentUserID: string | null = null;
  selectedTab: 'today' | 'all' = 'today';

  constructor(
    private medicalService: MedicalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserID = environment.username; // Or get from auth service
    this.loadTodaySchedules();
    this.loadActiveInjections();
  }

  selectTab(tab: 'today' | 'all'): void {
    this.selectedTab = tab;
    if (tab === 'today') {
      this.loadTodaySchedules();
    } else {
      this.loadActiveInjections();
    }
  }

  loadTodaySchedules(): void {
    this.isLoading = true;
    this.medicalService.getTodayPendingSchedules().subscribe({
      next: (schedules) => {
        this.todaySchedules = schedules;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading today schedules:', error);
        this.showSnackBar('Error loading today\'s schedules', 'error-snackbar');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadActiveInjections(): void {
    this.isLoading = true;
    this.medicalService.getActiveInjections().subscribe({
      next: (injections) => {
        this.activeInjections = injections;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading active injections:', error);
        this.showSnackBar('Error loading active injections', 'error-snackbar');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewInjectionDetails(injectionID: number): void {
    if (!injectionID) return;

    this.isLoading = true;
    this.medicalService.getInjectionDetails(injectionID).subscribe({
      next: (injection) => {
        this.openInjectionDialog(injection);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading injection details:', error);
        this.showSnackBar('Error loading injection details', 'error-snackbar');
        this.isLoading = false;
      }
    });
  }

  openInjectionDialog(injection: Injection): void {
    const dialogRef = this.dialog.open(InjectionPaperComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',
      data: {
        injectionID: injection.injectionID,
        patientID: injection.patientID,
        dialogTitle: 'Injection Details',
        injection: injection
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.refresh) {
        this.refreshData();
      }
    });
  }

  administerScheduledInjection(schedule: InjectionSchedule): void {
    if (!this.currentUserID) {
      this.showSnackBar('User not authenticated', 'error-snackbar');
      return;
    }

    if (confirm(`Confirm administering injection for schedule #${schedule.scheduleID}?`)) {
      const request: AdministerInjectionRequest = {
        scheduleID: schedule.scheduleID!,
        administeredBy: this.currentUserID,
        administeredDate: new Date(),
        notes: ''
      };

      this.isLoading = true;
      this.medicalService.administerInjectionSchedules(request).subscribe({
        next: () => {
          this.showSnackBar('Injection administered successfully', 'success-snackbar');
          this.refreshData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error administering injection:', error);
          this.showSnackBar('Error administering injection', 'error-snackbar');
          this.isLoading = false;
        }
      });
    }
  }

  getScheduleStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'status-pending',
      'Administered': 'status-administered',
      'Missed': 'status-missed',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getScheduleProgress(injection: Injection): number {
    if (!injection.totalDoses || injection.totalDoses === 0) return 0;
    return Math.round((injection.administeredDoses || 0) / injection.totalDoses * 100);
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 75) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    if (progress >= 25) return 'progress-low';
    return 'progress-very-low';
  }

  refreshData(): void {
    if (this.selectedTab === 'today') {
      this.loadTodaySchedules();
    } else {
      this.loadActiveInjections();
    }
  }

  private showSnackBar(message: string, panelClass: string = 'info-snackbar'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}
