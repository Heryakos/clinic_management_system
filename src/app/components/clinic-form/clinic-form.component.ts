import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClinicSickLeave,MedicalRequestView,ApprovalRequest} from '../../models/medical.model';
import { ASSETS } from '../../assets.config';

@Component({
  selector: 'app-clinic-form',
  templateUrl: './clinic-form.component.html',
  styleUrls: ['./clinic-form.component.css']
})
export class ClinicFormComponent implements OnInit, OnChanges {
  logoPath = ASSETS.LOGO;

  clinicName: string = 'በፌዴራል ቤቶች ኮርፖሬሽን';
  formTitle: string = 'ለህክምና ወደ ክሊኒክ ለመሄድ ፈቃድ መጠየቂያ ቅጽ';
  
  @Input() 
  set employeeCode(value: string | null) {
    this._employeeCode = value || '';
    if (this._employeeCode && this.sickLeaveForm) {
      this.loadSickLeaveData(this._employeeCode);
    }
  }
  get employeeCode(): string {
    return this._employeeCode;
  }
  private _employeeCode: string = '';

  sickLeaveForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.employeeCode) {
      this.loadSickLeaveData(this.employeeCode);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeCode'] && changes['employeeCode'].currentValue && this.sickLeaveForm) {
      this.loadSickLeaveData(changes['employeeCode'].currentValue);
    }
  }

  initializeForm(): void {
    this.sickLeaveForm = this.fb.group({
      EmployeeID: [{ value: '', disabled: true }],
      FullName: [{ value: '', disabled: true }],
      department_name: [{ value: '', disabled: true }],
      RequestDate: [{ value: '', disabled: true }],
      StartDate: [{ value: '', disabled: true }],
      EndDate: [{ value: '', disabled: true }],
      TotalDays: [{ value: null, disabled: true }],
      DoctorName: [{ value: '', disabled: true }],
      UserName: [{ value: '', disabled: true }]
    });
    console.log('Form Value After Patch:', this.sickLeaveForm.value);
  }
  

  loadSickLeaveData(code: string): void {
    if (!code) {
      this.errorMessage = 'No Employee Code provided.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = null;
  
    this.medicalService.getSickLeaveByEmployeeCode(code).subscribe(
      (response: ClinicSickLeave | ClinicSickLeave[] | null) => {
        console.log('Raw API Response:', response);
        let data: ClinicSickLeave = response as ClinicSickLeave;
  
        // Handle array response
        if (Array.isArray(response)) {
          data = response[0] || {} as ClinicSickLeave;
        } else if (!response) {
          data = {} as ClinicSickLeave;
        }
  
        console.log('Processed Data:', data);
  
        // Ensure proper date handling
        const formatDate = (date: string | undefined): string => {
          if (!date) return '';
          const parsedDate = new Date(date);
          return isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleDateString('en-US');
        };
  
        const formData = {
          EmployeeID: data.EmployeeID || '', // Match form control name exactly
          FullName: data.FirstName && data.LastName ? `${data.FirstName} ${data.LastName}` : '',
          department_name: data.department_name || '',
          RequestDate: data.RequestDate ? new Date(data.RequestDate).toLocaleString('en-US') : '',
          StartDate: formatDate(data.StartDate), // Use consistent date formatting
          EndDate: formatDate(data.EndDate), // Use consistent date formatting
          TotalDays: data.TotalDays ?? null, // Use nullish coalescing to handle undefined
          DoctorName: data.DoctorName || '', // Match API field name exactly
          UserName: data.UserName || ''
        };
  
        console.log('Form Data to Patch:', formData);
        this.sickLeaveForm.patchValue(formData);
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('Form Value After Patch:', this.sickLeaveForm.value);
      },
      (error) => {
        console.error('Error fetching sick leave data:', error);
        this.errorMessage = 'Failed to load sick leave data: ' + (error.error?.message || 'Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  onPrintForm(): void {
    window.print();
  }
}