import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { PatientSummary } from '../../models/medical.model';
import { Referral, ReferralFormData, ReferralStatusUpdate } from '../interfaces/patient.interface';
import { Observable, of } from 'rxjs';
import {map, filter, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-referral-tab',
  templateUrl: './referral-tab.component.html',
  styleUrls: ['./referral-tab.component.css']
})
export class ReferralTabComponent implements OnInit, OnChanges {
  @Input() patient: PatientSummary | null = null;
  @Input() createdBy: string | null = null;
  
  showReferralModal: boolean = false;
  referrals$: Observable<Referral[]> | null = null;
  isRequestingReferral: boolean = false;
  selectedReferral: Referral | null = null;
  showReferralDetails: boolean = false;

  constructor(
    private medicalService: MedicalService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.patient?.CardNumber) {
      this.loadPatientReferrals();
    }
  }

  ngOnChanges(): void {
    if (this.patient?.CardNumber) {
      this.loadPatientReferrals();
    }
  }

  private loadPatientReferrals(): void {
    if (!this.patient?.CardNumber) return;
    
    this.referrals$ = this.medicalService.getPatientReferrals(this.patient.CardNumber).pipe(
      map((referrals: Referral[]) => {
        // Ensure each referral has a valid ReferralID
        return referrals.map((referral: Referral) => {
          if (!referral.ReferralID || referral.ReferralID <= 0) {
            console.error('Invalid referral ID found:', referral);
            return null;
          }
          return referral;
        }).filter((referral: Referral | null): referral is Referral => referral !== null); // Filter out invalid referrals
      }),
      catchError(error => {
        console.error('Error loading referrals:', error);
        this.snackBar.open(`Error loading referrals: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return of([]);
      })
    );
}



  onReferralRequest(): void {
    this.showReferralModal = true;
  }

  onReferralSubmit(referralData: ReferralFormData): void {
    this.isRequestingReferral = true;
    
    this.medicalService.createReferral(referralData).subscribe(
      (response: any) => {
        this.loadPatientReferrals(); // Reload referrals after creation
        this.isRequestingReferral = false;
        this.showReferralModal = false;
        this.snackBar.open('Referral created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        this.isRequestingReferral = false;
        console.error('Error creating referral:', error);
        this.snackBar.open(`Error creating referral: ${error.message}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }

  onCloseModal(): void {
    this.showReferralModal = false;
  }

  viewReferralDetails(referralID: number): void {
    console.log('Viewing referral details for ID:', referralID);
    
    if (!referralID || referralID <= 0) {
        console.error('Invalid referral ID:', referralID);
        this.snackBar.open('Invalid referral ID', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
        });
        return;
    }
    
    this.medicalService.getReferralDetails(referralID).subscribe(
        (referral: Referral) => {
            console.log('Referral details loaded:', referral);
            this.selectedReferral = referral;
            this.showReferralDetails = true;
        },
        (error) => {
            console.error('Error loading referral details:', error);
            this.snackBar.open(`Error loading referral details: ${error.message}`, 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
        }
    );
}

  closeReferralDetails(): void {
    this.showReferralDetails = false;
    this.selectedReferral = null;
  }

  updateReferralStatus(referralId: number, status: string): void {
    console.log('Updating referral status for ID:', referralId, 'to:', status);
    
    if (!referralId || referralId <= 0) {
        console.error('Invalid referral ID:', referralId);
        this.snackBar.open('Invalid referral ID', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
        });
        return;
    }
    
    const statusUpdate: ReferralStatusUpdate = {
        Status: status,
        CompletedDate: status === 'Completed' ? new Date() : undefined
    };

    this.medicalService.updateReferralStatus(referralId, statusUpdate).subscribe(
        () => {
            console.log('Referral status updated successfully');
            this.loadPatientReferrals();
            this.snackBar.open(`Referral status updated to ${status}`, 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
            });
        },
        (error) => {
            console.error('Error updating referral status:', error);
            this.snackBar.open(`Error updating referral status: ${error.message}`, 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
        }
    );
}

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'priority-urgent';
      case 'stat': return 'priority-stat';
      default: return 'priority-normal';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getDepartmentIcon(department: string): string {
    switch (department?.toLowerCase()) {
      case 'laboratory': return '🔬';
      case 'pharmacy': return '💊';
      case 'injection': return '💉';
      default: return '🏥';
    }
  }
}