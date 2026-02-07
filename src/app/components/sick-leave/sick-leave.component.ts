import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { SickLeave } from 'src/app/models/medical.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FontService } from '../../services/FontService.service';
import { forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-sick-leave',
  templateUrl: './sick-leave.component.html',
  styleUrls: ['./sick-leave.component.css']
})
export class SickLeaveComponent implements OnInit {

  currentDoctorName: string = 'Unknown';
  currentDoctorID: string | null = null;
  currentEmployeeID: string | null = null;
  logoPath = ASSETS.LOGO;

  @Input() patientID: string | null = null;
  @Input() createdBy: string | null = null;
  sickLeaveForm!: FormGroup;
  activeSickLeaves: SickLeave[] = [];
  completedSickLeaves: SickLeave[] = [];
  isSubmitting = false;
  showPrintModal = false;
  selectedLeave: SickLeave | null = null;
  currentTab: 'pending' | 'completed' = 'pending';
  selectedType: 'sickLeave' | 'fitToWork' = 'sickLeave';

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private fontService: FontService
  ) { }
  ngOnInit(): void {
    this.loadCurrentDoctorInfo();
    console.log('SickLeaveComponent initialized with patientID:', this.patientID, 'createdBy:', this.createdBy);
    this.initializeForm();
    this.loadSickLeaves();
    if (this.patientID) {
      this.prefillForm();
    }
    this.subscribeToFormChanges();
  }
  subscribeToFormChanges(): void {
    this.sickLeaveForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
    });

    this.sickLeaveForm.get('endDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
    });
  }

  private loadCurrentDoctorInfo(): void {
    const username = environment.username;

    if (!username) {
      console.warn('No username in environment → cannot load doctor info');
      return;
    }

    this.medicalService.getEmployeeById(username).subscribe({
      next: (response: any) => {
        const employee = response?.c_Employees?.[0];

        if (employee) {
          this.currentDoctorName = employee.en_name?.trim()
            ? `${employee.en_name.trim()}`
            : 'Unknown';

          this.currentDoctorID = employee.user_ID ?? null;
          this.currentEmployeeID = employee.employee_Id ?? null;

          console.log('Current doctor loaded:', {
            name: this.currentDoctorName,
            userID: this.currentDoctorID,
            empID: this.currentEmployeeID
          });

          this.createdBy = this.currentDoctorID;
        } else {
          console.warn('No employee data found for current user');
        }
      },
      error: (err) => {
        console.error('Failed to load current doctor info:', err);
      }
    });
  }


  initializeForm(): void {
    this.sickLeaveForm = this.fb.group({
      employeeId: [{ value: '', disabled: true }],
      employeeName: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      diagnosis: [{ value: '', disabled: true }],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      totalDays: [{ value: '', disabled: true }],
      doctorName: [{ value: '', disabled: true }],
      recommendations: [''],
      age: [{ value: '', disabled: true }],
      sex: [{ value: '', disabled: true }],
      examinedOn: [{ value: '', disabled: true }],
      SignatureText: [{ value: '', disabled: true }],
      patientId: [{ value: '', disabled: true }]
    });

    this.sickLeaveForm.get('startDate')?.valueChanges.subscribe(() => this.calculateTotalDays());
    this.sickLeaveForm.get('endDate')?.valueChanges.subscribe(() => this.calculateTotalDays());
  }

  onTypeChange(type: 'sickLeave' | 'fitToWork'): void {
    const previousType = this.selectedType;
    this.selectedType = type;

    if (type === 'fitToWork') {
      const today = new Date().toISOString().split('T')[0];

      this.sickLeaveForm.patchValue({
        startDate: today,
        endDate: today,
        totalDays: 0,
        diagnosis: 'Patient is clinically stable and fit to resume regular work duties with no restrictions.',
        recommendations: 'Resume normal work duties immediately. No sick leave required.'
      });

      this.sickLeaveForm.get('startDate')?.disable();
      this.sickLeaveForm.get('endDate')?.disable();
      this.sickLeaveForm.get('recommendations')?.disable();
      this.sickLeaveForm.get('startDate')?.clearValidators();
      this.sickLeaveForm.get('endDate')?.clearValidators();
      this.sickLeaveForm.get('startDate')?.updateValueAndValidity();
      this.sickLeaveForm.get('endDate')?.updateValueAndValidity();
      this.sickLeaveForm.get('totalDays')?.setValue(0, { emitEvent: false });
    }
    else {
      this.sickLeaveForm.get('startDate')?.enable();
      this.sickLeaveForm.get('endDate')?.enable();
      this.sickLeaveForm.get('recommendations')?.enable();
      this.sickLeaveForm.get('startDate')?.setValidators([Validators.required]);
      this.sickLeaveForm.get('endDate')?.setValidators([Validators.required]);
      this.sickLeaveForm.get('startDate')?.updateValueAndValidity();
      this.sickLeaveForm.get('endDate')?.updateValueAndValidity();

      this.isSubmitting = true;

      this.medicalService.getPatientByCardNumberHistory(this.patientID!).subscribe({
        next: (historyResponse: any[]) => {
          const latestHistory = historyResponse.length > 0 ? historyResponse[0] : null;

          this.sickLeaveForm.patchValue({
            diagnosis: latestHistory?.MedicalHistory ||
              this.sickLeaveForm.getRawValue().diagnosis ||
              'To be examined',
            recommendations: '',
            startDate: '',
            endDate: '',
            totalDays: null
          });

          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to reload medical history:', err);
          this.sickLeaveForm.patchValue({
            diagnosis: 'To be examined',
            recommendations: '',
            startDate: '',
            endDate: '',
            totalDays: null
          });
          this.isSubmitting = false;
        }
      });
    }

    this.calculateTotalDays();
  }
  confirmCancel(leave: SickLeave): void {
    if (confirm(`Are you sure you want to CANCEL sick leave for ${leave.employeeName}?`)) {
      this.updateLeaveStatus(leave.certificateID, 'Cancelled');
    }
  }

  issueFitToWorkOverride(leave: SickLeave): void {
    if (confirm(`Issue a Fit to Work certificate to override the current sick leave for ${leave.employeeName}?`)) {
      // Option 1: Just update status
      // this.updateLeaveStatus(leave.certificateID, 'FitToWork');

      // BETTER Option 2: Create a NEW FitToWork certificate (cleaner history)
      this.selectedType = 'fitToWork';
      this.sickLeaveForm.patchValue({
        employeeId: leave.employeeID,
        employeeName: leave.employeeName,
        address: leave.address,
        age: leave.age,
        sex: leave.sex,
        examinedOn: new Date().toISOString().split('T')[0],
        doctorName: leave.doctorName,
        SignatureText: leave.signature,
        patientId: leave.patientID
      });
      this.onSubmit();
    }
  }
  calculateTotalDays(): void {
    if (this.selectedType === 'fitToWork') {
      this.sickLeaveForm.get('totalDays')?.setValue(0);
      return;
    }

    const startDate = this.sickLeaveForm.get('startDate')?.value;
    const endDate = this.sickLeaveForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      if (end < start) {
        daysDiff = 0;
      }
      this.sickLeaveForm.get('totalDays')?.setValue(daysDiff > 0 ? daysDiff : '');
    } else {
      this.sickLeaveForm.get('totalDays')?.setValue('');
    }
  }
  // calculateTotalDays(): void {
  //   if (this.selectedType === 'fitToWork') {
  //     this.sickLeaveForm.get('totalDays')?.setValue(0);
  //     return;
  //   }

  //   const startDate = this.sickLeaveForm.get('startDate')?.value;
  //   const endDate = this.sickLeaveForm.get('endDate')?.value;

  //   if (startDate && endDate) {
  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     const timeDiff = end.getTime() - start.getTime();
  //     const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

  //     if (daysDiff > 0) {
  //       this.sickLeaveForm.get('totalDays')?.setValue(daysDiff);
  //     } else {
  //       this.sickLeaveForm.get('totalDays')?.setValue('');
  //     }
  //   }
  // }

  prefillForm(): void {
    if (!this.patientID) {
      console.warn('No patientID provided for prefill');
      return;
    }
    forkJoin({
      patient: this.medicalService.getPatient(this.patientID),
      history: this.medicalService.getPatientByCardNumberHistory(this.patientID)
    }).subscribe({
      next: ({ patient, history }) => {
        const p = Array.isArray(patient) ? patient[0] : patient;
        if (!p) {
          this.showErrorMessage('Patient not found.');
          return;
        }
        const latestHistory = history && history.length > 0 ? history[0] : null;
        this.sickLeaveForm.patchValue({
          employeeId: p.CardNumber || p.EmployeeID || '',
          employeeName: p.FullName || '',
          address: p.Address || 'Addis Ababa',
          age: p.Age ? Number(p.Age) : null,
          // sex: p.Gender === 'M' ? 'Male' : p.Gender === 'F' ? 'Female' : 'Unknown',
          sex: this.normalizeGender(p.Gender),
          examinedOn: p.LastVisitDate
            ? new Date(p.LastVisitDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          diagnosis: latestHistory?.MedicalHistory
            || p.MedicalHistory
            || 'Patient examined and stable',

          // DOCTOR INFO
          // doctorName: latestHistory?.DoctorName || 'Unknown Doctor',
          doctorName: latestHistory?.DoctorName?.trim() && latestHistory.DoctorName.trim() !== ''
            ? latestHistory.DoctorName.trim()
            : this.currentDoctorName,

          SignatureText: latestHistory?.SignatureText || '',
          patientId: p.PatientID ? (typeof p.PatientID === 'string' ? p.PatientID : null) : null
        });

        console.log('SICK LEAVE FORM AUTO-FILLED PERFECTLY:', this.sickLeaveForm.value);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data for sick leave form:', err);
        this.showErrorMessage('Failed to load patient information.');
      }
    });
  }

  private normalizeGender(genderValue: string | null | undefined): string {
    if (!genderValue?.trim()) {
      console.warn('Gender value is empty or null');
      return 'Unknown';
    }

    const original = genderValue.trim();
    const upper = original.toUpperCase();

    console.log('Raw gender from API:', JSON.stringify(original));

    if (upper.includes('ሴት') || upper.includes('FEMALE') || upper.includes('/ FEMALE')) {
      return 'Female';
    }

    if (upper.includes('ወንድ') || upper.includes('MALE') || upper.includes('/ MALE')) {
      return 'Male';
    }
    console.warn('Unrecognized gender format:', original);
    return original;
  }
  getSignatureImageSrc(): string {
    const signature = this.sickLeaveForm.get('SignatureText')?.value;
    if (!signature || signature === '' || typeof signature !== 'string') {
      return '';
    }
    const cleanSig = signature.startsWith('data:') ? signature.split(',')[1] : signature;

    return `data:image/png;base64,${cleanSig}`;
  }

  handleSignatureError(event: any): void {
    console.error('Signature image error:', event);
    const img = event.target;
    console.log('Image src length:', img.src.length);
    console.log('Image src starts with data:image/png;base64:', img.src.startsWith('data:image/png;base64,'));
  }



  onSubmit(): void {
    const formValue = this.sickLeaveForm.getRawValue();
    if (!this.createdBy) {
      console.error('createdBy is not set!');
      this.showErrorMessage('Doctor information is missing. Please refresh the page.');
      return;
    }
    if (this.selectedType === 'sickLeave') {
      if (!formValue.startDate || !formValue.endDate) {
        this.showErrorMessage('Start date and end date are required for sick leave.');
        return;
      }
      const start = new Date(formValue.startDate);
      const end = new Date(formValue.endDate);
      if (end < start) {
        this.showErrorMessage('End date must be on or after start date.');
        return;
      }
    } else if (this.selectedType === 'fitToWork') {
      const today = new Date().toISOString().split('T')[0];
      if (!formValue.startDate) {
        formValue.startDate = today;
      }
      if (!formValue.endDate) {
        formValue.endDate = today;
      }
    }

    if (!formValue.employeeId || !formValue.employeeName) {
      console.error('Missing required fields:', {
        employeeId: formValue.employeeId,
        employeeName: formValue.employeeName
      });
      this.showErrorMessage('Please wait for patient information to load, or refresh the page.');
      return;
    }

    if (!formValue.diagnosis) {
      formValue.diagnosis = this.selectedType === 'fitToWork'
        ? 'Patient is clinically stable and fit to resume regular work duties with no restrictions.'
        : 'To be examined';
    }
    if (!formValue.doctorName) {
      formValue.doctorName = 'Unknown';
    }

    this.isSubmitting = true;

    const status = this.selectedType === 'fitToWork' ? 'FitToWork' : 'Active';
    const today = new Date();

    const getSafeDate = (value: any): Date => {
      if (!value || value === '') {
        return today;
      }
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? today : value;
      }
      if (typeof value === 'string') {
        const d = new Date(value + 'T00:00:00.000Z');
        return isNaN(d.getTime()) ? today : d;
      }
      return today;
    };

    const doctorIDGuid = this.createdBy;

    let startDate = getSafeDate(formValue.startDate);
    let endDate = getSafeDate(formValue.endDate);

    if (this.selectedType === 'fitToWork') {
      startDate = today;
      endDate = today;
    }
    const payload: any = {
      employeeID: formValue.employeeId || '',
      employeeName: formValue.employeeName || '',
      address: formValue.address || 'Addis Ababa',
      startDate: startDate,
      endDate: endDate,
      diagnosis: formValue.diagnosis || 'To be examined',
      recommendations: formValue.recommendations || null,
      // doctorID: doctorIDGuid,
      // doctorName: formValue.doctorName || 'Unknown',
      doctorName: this.sickLeaveForm.get('doctorName')?.value || this.currentDoctorName,
      doctorID: this.createdBy || this.currentDoctorID,
      status: status,
      issueDate: today,
      // createdBy: doctorIDGuid,
      createdBy: this.createdBy || this.currentDoctorID,
      age: formValue.age ? parseInt(formValue.age.toString()) : null,
      sex: formValue.sex || 'Unknown',
      examinedOn: formValue.examinedOn ? getSafeDate(formValue.examinedOn) : null,
      signature: formValue.SignatureText || null,
      patientID: formValue.patientId ? (typeof formValue.patientId === 'string' ? formValue.patientId : null) : null
    };

    console.log('FINAL BULLETPROOF PAYLOAD:', payload);
    console.log('Form valid:', this.sickLeaveForm.valid);
    console.log('Form errors:', this.getFormValidationErrors());

    this.medicalService.createSickLeaveCertificate(payload as any).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessMessage(
          this.selectedType === 'fitToWork'
            ? 'Fit to Work certificate issued!'
            : 'Sick leave certificate issued!'
        );
        this.loadSickLeaves();
        this.sickLeaveForm.markAsPristine();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('API ERROR:', error);
        console.error('Error details:', error.error);
        this.showErrorMessage('Failed: ' + (error.error?.message || error.message || 'Server error'));
      }
    });
  }
  private getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.sickLeaveForm.controls).forEach(key => {
      const control = this.sickLeaveForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }
  loadSickLeaves(): void {
    if (this.patientID) {
      console.log('asde', this.patientID);
      this.medicalService.getSickLeaveCertificatebyemployee(this.patientID).subscribe(
        (leaves: SickLeave[]) => {
          console.log('asdeedc', leaves);
          this.activeSickLeaves = leaves.filter(leave => leave.status === 'Active') || [];
          this.completedSickLeaves = leaves.filter(leave => leave.status !== 'Active') || [];
        },
        error => {
          console.error('Error loading sick leaves:', error);
          this.activeSickLeaves = [];
          this.completedSickLeaves = [];
        }
      );
    }
  }


  updateLeaveStatus(certificateID: number, status: 'Active' | 'Completed' | 'Cancelled' | 'FitToWork'): void {
    this.medicalService.updateSickLeaveCertificateStatus(certificateID, { status }).subscribe(
      () => this.loadSickLeaves(),
      error => console.error('Error updating status:', error)
    );
  }

  openPrintModal(leave: SickLeave): void {
    this.selectedLeave = leave;
    this.showPrintModal = true;
  }

  closePrintModal(): void {
    this.showPrintModal = false;
    this.selectedLeave = null;
  }

  async printCertificate(): Promise<void> {
    if (!this.selectedLeave || !this.showPrintModal) return;

    try {
      const element = document.getElementById('printable-certificate');
      if (!element) throw new Error('Certificate element not found');

      const actions = document.querySelector('.modal-actions');
      if (actions) (actions as HTMLElement).style.display = 'none';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      if (actions) (actions as HTMLElement).style.display = 'flex';
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        this.snackBar.open('Popup blocked. Try downloading instead.', 'Close', { duration: 5000 });
      }
    } catch (err) {
      console.error('Print failed:', err);
      this.snackBar.open('Failed to generate print view. Try again.', 'Close', { duration: 5000 });
    }
  }

  // ──────────────────────────────────────────────────────────────
  // DOWNLOAD: Capture HTML → PDF → save file
  // ──────────────────────────────────────────────────────────────
  async downloadCertificate(): Promise<void> {
    if (!this.selectedLeave || !this.showPrintModal) return;

    try {
      const element = document.getElementById('printable-certificate');
      if (!element) throw new Error('Certificate element not found');

      const actions = document.querySelector('.modal-actions');
      if (actions) (actions as HTMLElement).style.display = 'none';

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      if (actions) (actions as HTMLElement).style.display = 'flex';

      pdf.save(`medical-certificate-${this.selectedLeave.certificateID || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
      this.snackBar.open('Failed to generate PDF. Try again.', 'Close', { duration: 5000 });
    }
  }
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }
}