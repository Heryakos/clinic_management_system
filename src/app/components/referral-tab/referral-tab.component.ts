import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { PatientSummary } from '../../models/medical.model';
import { Referral, ReferralFormData, ReferralStatusUpdate } from '../interfaces/patient.interface';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    this.loadPatientReferrals();
  }

  ngOnChanges(): void {
    this.loadPatientReferrals();
  }

  private loadPatientReferrals(): void {
    if (!this.patient?.CardNumber) {
      this.referrals$ = of([]);
      return;
    }
    
    this.referrals$ = this.medicalService.getPatientReferrals(this.patient.CardNumber).pipe(
      map((referrals: Referral[]) => {
        return referrals.filter(referral => referral.referralID && referral.referralID > 0);
      }),
      catchError(error => {
        console.error('Error loading referrals:', error);
        this.snackBar.open('Error loading referrals', 'Close', { duration: 5000 });
        return of([]);
      })
    );
  }

  onReferralRequest(): void {
    this.showReferralModal = true;
  }

  onReferralSubmit(referralData: ReferralFormData): void {
    this.isRequestingReferral = true;
  
    this.medicalService.createReferral(referralData).subscribe({
      next: (response: any) => {
        // Show success with real number
        this.snackBar.open(
          `Referral created successfully! Ref. No: ${response.ReferralNumber}`,
          'Close',
          { duration: 6000 }
        );
  
        // IMPORTANT: Update the modal with the real number before closing
        // But since modal is a child component, we can't directly update its form
        // So instead, we just reload the list and close
        this.loadPatientReferrals();
        this.isRequestingReferral = false;
        this.showReferralModal = false;
      },
      error: (error) => {
        this.isRequestingReferral = false;
        this.snackBar.open(`Error: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }

  onCloseModal(): void {
    this.showReferralModal = false;
  }

  viewReferralDetails(referralID: number): void {
    this.referrals$?.subscribe(referrals => {
      const referral = referrals.find(r => r.referralID === referralID);
      if (referral) {
        this.selectedReferral = referral;
        this.showReferralDetails = true;
      } else {
        this.snackBar.open('Referral not found', 'Close', { duration: 3000 });
      }
    });
  }

  closeReferralDetails(): void {
    this.showReferralDetails = false;
    this.selectedReferral = null;
  }

  updateReferralStatus(referralId: number, status: string): void {
    const statusUpdate: ReferralStatusUpdate = {
      Status: status,
      CompletedDate: status === 'Completed' ? new Date() : null
    };
  
    this.medicalService.updateReferralStatus(referralId, statusUpdate).subscribe({
      next: () => {
        this.loadPatientReferrals();
        this.snackBar.open(`Referral status updated to ${status}`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Error updating status', 'Close', { duration: 5000 });
        console.error(err);
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }
}