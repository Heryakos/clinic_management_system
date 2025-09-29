import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MedicalRequestView } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';

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

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

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
      preferredDate: ['', [Validators.required, this.futureDateValidator()]],
      preferredTime: ['', [Validators.required, this.workingHoursValidator()]]
    });
  }

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(control.value);
      return inputDate >= today ? null : { pastDate: true };
    };
  }

  workingHoursValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const time = control.value;
      if (!time) return null;
      const [hours, minutes] = time.split(':').map(Number);
      const isValid = hours >= 9 && hours <= 17 && minutes >= 0 && minutes <= 59;
      return isValid ? null : { invalidTime: true };
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
      },
      error => {
        console.error('Error loading medical requests:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.medicalRequestForm.valid) {
      this.isSubmitting = true;

      const request = {
        requestNumber: this.medicalRequestForm.value.requestNumber,
        employeeID: this.employeeId,
        requestType: this.medicalRequestForm.value.requestType,
        reason: this.medicalRequestForm.value.reason,
        createdBy: this.createdBy,
        preferredDate: this.medicalRequestForm.value.preferredDate,
        preferredTime: this.medicalRequestForm.value.preferredTime
      };

      this.medicalService.createMedicalRequest(request).subscribe(
        (response) => {
          this.isSubmitting = false;
          this.medicalRequestForm.reset();
          this.loadMedicalRequests(environment.username);
        },
        error => {
          this.isSubmitting = false;
        }
      );
    }
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