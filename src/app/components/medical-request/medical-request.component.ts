import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MedicalRequestView } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import { EthiopianDateAdapter } from '../../directive/ethiopian-date-adapter';
import { EthiopianDate } from '../../models/ethiopian-date';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-medical-request',
  templateUrl: './medical-request.component.html',
  styleUrls: ['./medical-request.component.css']
})
export class MedicalRequestComponent implements OnInit {
  medicalRequestForm!: FormGroup;
  medicalRequests: MedicalRequestView[] = [];
  isSubmitting = false;
  createdBy: string | null = null;
  employeeId: string | null = null;
  employeeDisplayName: string = '';
  userRole: 'employee' | 'supervisor' = 'employee';
  showMessagesModal = false;
  hasPendingOrApprovedRequest = false;
  currentRequestStatus: string = ''; // Track the current request status

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private dateAdapter: EthiopianDateAdapter,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
    this.loadMedicalRequests(environment.username);
  }

  initializeForms(): void {
    this.medicalRequestForm = this.fb.group({
      requestNumber: [this.generateId(), Validators.required],
      employeeID: [''],
      requestType: ['', Validators.required],
      reason: [''],
      createdBy: [''],
      preferredDate: [null, [Validators.required, this.futureDateValidator()]],
      preferredTime: ['', [Validators.required, this.workingHoursValidator()]]
    });
  }

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const inputDate = control.value as EthiopianDate;
      if (!inputDate) return null;

      const today = this.dateAdapter.today();

      if (inputDate.year > today.year) return null;
      if (inputDate.year < today.year) return { pastDate: true };

      if (inputDate.month > today.month) return null;
      if (inputDate.month < today.month) return { pastDate: true };

      if (inputDate.day >= today.day) return null;

      return { pastDate: true };
    };
  }

  workingHoursValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const time = control.value;
      if (!time) return null;
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 8 || hours > 18) return { invalidTime: true };
      if (hours === 18 && minutes > 30) return { invalidTime: true };
      return null;
    };
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.createdBy = employee.user_ID ?? null;
          this.employeeId = employee.payrole_No ?? null;
          this.employeeDisplayName = employee.en_name ?? '';
          this.userRole = employee.isSupervisor ? 'supervisor' : 'employee';
          this.medicalRequestForm.patchValue({ employeeId: this.employeeDisplayName });
        } else {
          console.warn('No employee data found');
          this.medicalRequestForm.patchValue({ employeeId: '' });
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
        this.medicalRequestForm.patchValue({ employeeId: '' });
      }
    );
  }

  loadMedicalRequests(employeeCode: string): void {
    this.medicalService.getMedicalRequestsByEmployeeCode(employeeCode).subscribe(
      (requests: MedicalRequestView[]) => {
        this.medicalRequests = requests;
        // Check if any request is Pending or Approved
        this.hasPendingOrApprovedRequest = requests.some(
          request => request.status.toLowerCase() === 'pending' || request.status.toLowerCase() === 'approved'
        );
        
        // Set current request status for display
        if (this.hasPendingOrApprovedRequest) {
          const activeRequest = requests.find(
            request => request.status.toLowerCase() === 'pending' || request.status.toLowerCase() === 'approved'
          );
          this.currentRequestStatus = activeRequest?.status || '';
        }
      },
      error => {
        console.error('Error loading medical requests:', error);
        this.hasPendingOrApprovedRequest = false;
        this.currentRequestStatus = '';
      }
    );
  }

  getCurrentRequestStatus(): string {
    if (!this.currentRequestStatus) return 'pending or approved';
    return this.currentRequestStatus.toLowerCase();
  }

  onSubmit(): void {
    if (this.medicalRequestForm.valid && !this.hasPendingOrApprovedRequest) {
      this.isSubmitting = true;

      const ecDate = this.medicalRequestForm.value.preferredDate as EthiopianDate;
      const gcDate = this.dateAdapter.ecToGregorian(ecDate.year, ecDate.month, ecDate.day);
      const formattedPreferredDate = `${gcDate.getFullYear()}-${(gcDate.getMonth() + 1).toString().padStart(2, '0')}-${gcDate.getDate().toString().padStart(2, '0')}`;

      const request = {
        requestNumber: this.medicalRequestForm.value.requestNumber,
        employeeID: this.employeeId,
        requestType: this.medicalRequestForm.value.requestType,
        reason: this.medicalRequestForm.value.reason,
        createdBy: this.createdBy,
        preferredDate: formattedPreferredDate,
        preferredTime: this.medicalRequestForm.value.preferredTime
      };

      this.medicalService.createMedicalRequest(request).subscribe(
        (response) => {
          this.isSubmitting = false;
          this.medicalRequestForm.reset({ requestNumber: this.generateId() });
          this.loadMedicalRequests(environment.username);
          this.showSuccessMessage('Medical request submitted successfully!');
        },
        error => {
          this.isSubmitting = false;
          this.showErrorMessage('Failed to submit medical request. Please try again.');
          console.error('Error submitting medical request:', error);
        }
      );
    } else if (this.hasPendingOrApprovedRequest) {
      this.showWarningMessage('You already have an active medical request. Please wait until it is processed before submitting a new one.');
    } else {
      this.showWarningMessage('Please fill all required fields correctly.');
    }
  }

  displayECDate(gcDateStr?: string): string {
    if (!gcDateStr) return '';

    const datePart = gcDateStr.split('T')[0];
    if (!datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.warn('Invalid date format:', gcDateStr);
      return '';
    }

    const [year, month, day] = datePart.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.warn('Invalid date components:', year, month, day);
      return '';
    }

    try {
      const gcDate = new Date(year, month - 1, day);
      if (isNaN(gcDate.getTime())) {
        console.warn('Invalid Gregorian date:', gcDateStr);
        return '';
      }
      const ecDate = this.dateAdapter.gregorianToEC(gcDate);
      return this.dateAdapter.format(ecDate, null);
    } catch (error) {
      console.error('Error converting date:', error);
      return '';
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showMessages(): void {
    this.showMessagesModal = true;
  }

  closeMessages(): void {
    this.showMessagesModal = false;
  }

  private generateId(): string {
    return 'REQ' + Date.now().toString();
  }
}