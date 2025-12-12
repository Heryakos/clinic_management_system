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

@Component({
  selector: 'app-sick-leave',
  templateUrl: './sick-leave.component.html',
  styleUrls: ['./sick-leave.component.css']
})
export class SickLeaveComponent implements OnInit {
  logoPath = ASSETS.LOGO;

  @Input() patientID: string | null = null; // CardNumber
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
    private fontService: FontService  // ✅ Inject the new service
  ) { }
  ngOnInit(): void {
    console.log('SickLeaveComponent initialized with patientID:', this.patientID, 'createdBy:', this.createdBy);
    this.initializeForm();
    this.loadSickLeaves();
    if (this.patientID) {
      this.prefillForm();
    }
    this.subscribeToFormChanges();
  }
  subscribeToFormChanges(): void {
    // Subscribe to changes in startDate and endDate
    this.sickLeaveForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
    });

    this.sickLeaveForm.get('endDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
    });
  }



  initializeForm(): void {
    this.sickLeaveForm = this.fb.group({
      // Disabled fields don't need validators - they're auto-filled
      employeeId: [{ value: '', disabled: true }],
      employeeName: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      diagnosis: [{ value: '', disabled: true }],
      // Only validate startDate and endDate for sick leave (not fitToWork)
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

      // Disable and remove required validators for fitToWork
      this.sickLeaveForm.get('startDate')?.disable();
      this.sickLeaveForm.get('endDate')?.disable();
      this.sickLeaveForm.get('recommendations')?.disable();
      this.sickLeaveForm.get('startDate')?.clearValidators();
      this.sickLeaveForm.get('endDate')?.clearValidators();
      this.sickLeaveForm.get('startDate')?.updateValueAndValidity();
      this.sickLeaveForm.get('endDate')?.updateValueAndValidity();
    }
    else {
      // SWITCHING BACK TO SICK LEAVE — RE-FETCH LATEST HISTORY
      this.sickLeaveForm.get('startDate')?.enable();
      this.sickLeaveForm.get('endDate')?.enable();
      this.sickLeaveForm.get('recommendations')?.enable();
      // Re-add required validators for sick leave
      this.sickLeaveForm.get('startDate')?.setValidators([Validators.required]);
      this.sickLeaveForm.get('endDate')?.setValidators([Validators.required]);
      this.sickLeaveForm.get('startDate')?.updateValueAndValidity();
      this.sickLeaveForm.get('endDate')?.updateValueAndValidity();

      // Show loading state
      this.isSubmitting = true;

      // RE-FETCH LATEST MEDICAL HISTORY TO GET FRESH DIAGNOSIS
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
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      if (daysDiff > 0) {
        this.sickLeaveForm.get('totalDays')?.setValue(daysDiff);
      } else {
        this.sickLeaveForm.get('totalDays')?.setValue('');
      }
    }
  }

  prefillForm(): void {
    if (!this.patientID) {
      console.warn('No patientID provided for prefill');
      return;
    }

    // Wait for BOTH patient data AND medical history
    forkJoin({
      patient: this.medicalService.getPatient(this.patientID),
      history: this.medicalService.getPatientByCardNumberHistory(this.patientID)
    }).subscribe({
      next: ({ patient, history }) => {
        // Handle patient response (array or object)
        const p = Array.isArray(patient) ? patient[0] : patient;
        if (!p) {
          this.showErrorMessage('Patient not found.');
          return;
        }

        // Get latest medical history
        const latestHistory = history && history.length > 0 ? history[0] : null;

        // AUTO-FILL EVERYTHING
        this.sickLeaveForm.patchValue({
          // EMPLOYEE INFO
          employeeId: p.CardNumber || p.EmployeeID || '',
          employeeName: p.FullName || '',
          address: p.Address || 'Addis Ababa',

          // DEMOGRAPHICS
          age: p.Age || null,
          sex: p.Gender === 'M' ? 'Male' : p.Gender === 'F' ? 'Female' : 'Unknown',

          // EXAM DATE
          examinedOn: p.LastVisitDate
            ? new Date(p.LastVisitDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],

          // MEDICAL INFO — FROM LAST VISIT
          diagnosis: latestHistory?.MedicalHistory
            || p.MedicalHistory
            || 'Patient examined and stable',

          // DOCTOR INFO
          doctorName: latestHistory?.DoctorName || 'Dr. Unknown Doctor',

          // SIGNATURE — FROM HISTORY (IT WORKS!)
          SignatureText: latestHistory?.SignatureText || '',

          // HIDDEN - PatientID should be a GUID string or null
          patientId: p.PatientID ? (typeof p.PatientID === 'string' ? p.PatientID : null) : null
        });

        console.log('SICK LEAVE FORM AUTO-FILLED PERFECTLY:', this.sickLeaveForm.value);

        // Force UI update
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data for sick leave form:', err);
        this.showErrorMessage('Failed to load patient information.');
      }
    });
  }

  // Method to get the signature image source
  getSignatureImageSrc(): string {
    const signature = this.sickLeaveForm.get('SignatureText')?.value;
    if (!signature || signature === '' || typeof signature !== 'string') {
      return ''; // Return empty = no image
    }

    // Clean any possible prefix
    const cleanSig = signature.startsWith('data:') ? signature.split(',')[1] : signature;

    return `data:image/png;base64,${cleanSig}`;
  }

  // Method to handle signature image errors
  handleSignatureError(event: any): void {
    console.error('Signature image error:', event);
    const img = event.target;
    console.log('Image src length:', img.src.length);
    console.log('Image src starts with data:image/png;base64:', img.src.startsWith('data:image/png;base64,'));
  }



  onSubmit(): void {
    // Validate required fields manually since disabled fields don't affect form.valid
    const formValue = this.sickLeaveForm.getRawValue();
    
    // Check if createdBy is set
    if (!this.createdBy) {
      console.error('createdBy is not set!');
      this.showErrorMessage('Doctor information is missing. Please refresh the page.');
      return;
    }

    // Validate required fields based on type
    if (this.selectedType === 'sickLeave') {
      if (!formValue.startDate || !formValue.endDate) {
        this.showErrorMessage('Start date and end date are required for sick leave.');
        return;
      }
      
      // Validate date range
      const start = new Date(formValue.startDate);
      const end = new Date(formValue.endDate);
      if (end < start) {
        this.showErrorMessage('End date must be on or after start date.');
        return;
      }
    } else if (this.selectedType === 'fitToWork') {
      // For FitToWork, ensure dates are set to today
      const today = new Date().toISOString().split('T')[0];
      if (!formValue.startDate) {
        formValue.startDate = today;
      }
      if (!formValue.endDate) {
        formValue.endDate = today;
      }
    }

    // Validate required auto-filled fields
    if (!formValue.employeeId || !formValue.employeeName) {
      console.error('Missing required fields:', {
        employeeId: formValue.employeeId,
        employeeName: formValue.employeeName
      });
      this.showErrorMessage('Please wait for patient information to load, or refresh the page.');
      return;
    }

    // For FitToWork, diagnosis and doctorName can have defaults
    if (!formValue.diagnosis) {
      formValue.diagnosis = this.selectedType === 'fitToWork' 
        ? 'Patient is clinically stable and fit to resume regular work duties with no restrictions.'
        : 'To be examined';
    }
    if (!formValue.doctorName) {
      formValue.doctorName = 'Dr. Unknown';
    }

    this.isSubmitting = true;

    const status = this.selectedType === 'fitToWork' ? 'FitToWork' : 'Active';
    const today = new Date();

    // SAFE DATE HANDLING — Convert to Date objects for the service
    const getSafeDate = (value: any): Date => {
      if (!value || value === '') {
        return today;
      }
      // If it's already a Date object, return it
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? today : value;
      }
      // If it's a string, parse it
      if (typeof value === 'string') {
        const d = new Date(value + 'T00:00:00.000Z');
        return isNaN(d.getTime()) ? today : d;
      }
      return today;
    };

    // Convert createdBy to GUID string
    const doctorIDGuid = this.createdBy;

    // For FitToWork, ensure startDate and endDate are the same (today)
    let startDate = getSafeDate(formValue.startDate);
    let endDate = getSafeDate(formValue.endDate);
    
    if (this.selectedType === 'fitToWork') {
      // For FitToWork, both dates should be today
      startDate = today;
      endDate = today;
    }

    // Create payload matching SickLeave interface (with Date objects)
    const payload: any = {
      employeeID: formValue.employeeId || '',
      employeeName: formValue.employeeName || '',
      address: formValue.address || 'Addis Ababa',
      startDate: startDate,
      endDate: endDate,
      diagnosis: formValue.diagnosis || 'To be examined',
      recommendations: formValue.recommendations || null,
      doctorID: doctorIDGuid,
      doctorName: formValue.doctorName || 'Dr. Unknown',
      status: status,
      issueDate: today,
      createdBy: doctorIDGuid,
      age: formValue.age ? parseInt(formValue.age.toString()) : null,
      sex: formValue.sex || 'Unknown',
      examinedOn: formValue.examinedOn ? getSafeDate(formValue.examinedOn) : null,
      signature: formValue.SignatureText || null,
      // PatientID should be a GUID string or null, not an integer
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

  // Helper method to get form validation errors for debugging
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

  downloadCertificate(): void {
    if (!this.selectedLeave) return;

    // Load font async
    this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
      if (!fontBase64) {
        console.error('Font loading failed; falling back to default font.');
        this.generateDownloadPDFWithoutCustomFont();
        return;
      }

      const doc = new jsPDF();

      // Add custom font for Amharic (Ethiopic script) support
      const fontName = 'AbyssinicaSIL-Regular.ttf'; // Matches your font file name
      const fontFamily = 'AbyssinicaSIL'; // Custom family name

      doc.addFileToVFS(fontName, fontBase64);
      doc.addFont(fontName, fontFamily, 'normal');
      doc.setFont(fontFamily); // Set the custom font for the entire document to handle Amharic/Unicode

      const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

      doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

      doc.setFontSize(16);
      doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
      doc.setFontSize(10);
      doc.text('TEL. 011-855-3615', 60, 25);

      doc.setFontSize(12);
      doc.text('Medical Certificate', 85, 50, { align: 'center' });
      doc.text(`Date: ${this.selectedLeave!.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

      doc.setFontSize(10);
      doc.text('Name:', 15, 70);
      doc.text(this.selectedLeave!.employeeName || '', 30, 70);
      doc.text('Age:', 80, 70);
      doc.text(this.selectedLeave!.age?.toString() || '', 90, 70);
      doc.text('Sex:', 110, 70);
      doc.text(this.selectedLeave!.sex || '', 120, 70);

      doc.text('Address:', 15, 80);
      doc.text(this.selectedLeave!.address || '', 30, 80);

      doc.text('Examined on:', 15, 90);
      doc.text(this.selectedLeave!.examinedOn?.toLocaleDateString() || '', 40, 90);

      doc.text('Diagnosis:', 15, 100);
      doc.text(this.selectedLeave!.diagnosis, 30, 100);

      doc.text("Doctor's Recommendation:", 15, 110);
      doc.text(this.selectedLeave!.recommendations || 'Rest and follow-up as needed', 40, 110);

      if (this.selectedLeave!.status === 'FitToWork') {
        doc.text('Rest Required:', 15, 120);
        doc.text('No rest required - Patient is fit to work', 40, 120);
      } else {
        doc.text('Rest Required:', 15, 120);
        doc.text(
          `${this.selectedLeave!.totalDays} days (${this.selectedLeave!.startDate?.toLocaleDateString() || ''} - ${this.selectedLeave!.endDate?.toLocaleDateString() || ''})`,
          40,
          120
        );
      }

      doc.text("Doctor's Name:", 15, 130);
      doc.text(this.selectedLeave!.doctorName || '', 40, 130);
      doc.text('Signature:', 15, 140);
      if (this.selectedLeave!.signature) {
        doc.addImage(`data:image/png;base64,${this.selectedLeave!.signature}`, 'PNG', 40, 135, 60, 20);
      }
      doc.text('Date:', 15, 150);
      doc.text(this.selectedLeave!.issueDate?.toLocaleDateString() || '', 30, 150);

      doc.save(`medical-certificate-${this.selectedLeave!.certificateID}.pdf`);
    });
  }

  // Fallback download without custom font
  private generateDownloadPDFWithoutCustomFont(): void {
    const doc = new jsPDF();
    const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

    doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

    doc.setFontSize(16);
    doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
    doc.setFontSize(10);
    doc.text('TEL. 011-855-3615', 60, 25);

    doc.setFontSize(12);
    doc.text('Medical Certificate', 85, 50, { align: 'center' });
    doc.text(`Date: ${this.selectedLeave!.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

    doc.setFontSize(10);
    doc.text('Name:', 15, 70);
    doc.text(this.selectedLeave!.employeeName || '', 30, 70);
    doc.text('Age:', 80, 70);
    doc.text(this.selectedLeave!.age?.toString() || '', 90, 70);
    doc.text('Sex:', 110, 70);
    doc.text(this.selectedLeave!.sex || '', 120, 70);

    doc.text('Address:', 15, 80);
    doc.text(this.selectedLeave!.address || '', 30, 80);

    doc.text('Examined on:', 15, 90);
    doc.text(this.selectedLeave!.examinedOn?.toLocaleDateString() || '', 40, 90);

    doc.text('Diagnosis:', 15, 100);
    doc.text(this.selectedLeave!.diagnosis, 30, 100);

    doc.text("Doctor's Recommendation:", 15, 110);
    doc.text(this.selectedLeave!.recommendations || 'Rest and follow-up as needed', 40, 110);

    if (this.selectedLeave!.status === 'FitToWork') {
      doc.text('Rest Required:', 15, 120);
      doc.text('No rest required - Patient is fit to work', 40, 120);
    } else {
      doc.text('Rest Required:', 15, 120);
      doc.text(
        `${this.selectedLeave!.totalDays} days (${this.selectedLeave!.startDate?.toLocaleDateString() || ''} - ${this.selectedLeave!.endDate?.toLocaleDateString() || ''})`,
        40,
        120
      );
    }

    doc.text("Doctor's Name:", 15, 130);
    doc.text(this.selectedLeave!.doctorName || '', 40, 130);
    doc.text('Signature:', 15, 140);
    if (this.selectedLeave!.signature) {
      doc.addImage(`data:image/png;base64,${this.selectedLeave!.signature}`, 'PNG', 40, 135, 60, 20);
    }
    doc.text('Date:', 15, 150);
    doc.text(this.selectedLeave!.issueDate?.toLocaleDateString() || '', 30, 150);

    doc.save(`medical-certificate-${this.selectedLeave!.certificateID}.pdf`);
  }

  printCertificate(): void {
    if (!this.selectedLeave) return;

    // Load font async
    this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
      if (!fontBase64) {
        console.error('Font loading failed; falling back to default font.');
        this.generatePrintPDFWithoutCustomFont();
        return;
      }

      const doc = new jsPDF();

      // Add custom font for Amharic (Ethiopic script) support
      const fontName = 'AbyssinicaSIL-Regular.ttf'; // Matches your font file name
      const fontFamily = 'AbyssinicaSIL'; // Custom family name

      doc.addFileToVFS(fontName, fontBase64);
      doc.addFont(fontName, fontFamily, 'normal');
      doc.setFont(fontFamily); // Set the custom font for the entire document to handle Amharic/Unicode

      const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

      doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

      doc.setFontSize(16);
      doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
      doc.setFontSize(10);
      doc.text('TEL. 011-855-3615', 60, 25);

      doc.setFontSize(12);
      doc.text('Medical Certificate', 85, 50, { align: 'center' });
      doc.text(`Date: ${this.selectedLeave!.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

      doc.setFontSize(10);
      doc.text('Name:', 15, 70);
      doc.text(this.selectedLeave!.employeeName || '', 30, 70);
      doc.text('Age:', 80, 70);
      doc.text(this.selectedLeave!.age?.toString() || '', 90, 70);
      doc.text('Sex:', 110, 70);
      doc.text(this.selectedLeave!.sex || '', 120, 70);

      doc.text('Address:', 15, 80);
      doc.text(this.selectedLeave!.address || '', 30, 80);

      doc.text('Examined on:', 15, 90);
      doc.text(this.selectedLeave!.examinedOn?.toLocaleDateString() || '', 40, 90);

      doc.text('Diagnosis:', 15, 100);
      doc.text(this.selectedLeave!.diagnosis, 30, 100);

      doc.text("Doctor's Recommendation:", 15, 110);
      doc.text(this.selectedLeave!.recommendations || 'Rest and follow-up as needed', 40, 110);

      if (this.selectedLeave!.status === 'FitToWork') {
        doc.text('Rest Required:', 15, 120);
        doc.text('No rest required - Patient is fit to work', 40, 120);
      } else {
        doc.text('Rest Required:', 15, 120);
        doc.text(
          `${this.selectedLeave!.totalDays} days (${this.selectedLeave!.startDate?.toLocaleDateString() || ''} - ${this.selectedLeave!.endDate?.toLocaleDateString() || ''})`,
          40,
          120
        );
      }

      doc.text("Doctor's Name:", 15, 130);
      doc.text(this.selectedLeave!.doctorName || '', 40, 130);
      doc.text('Signature:', 15, 140);
      if (this.selectedLeave!.signature) {
        doc.addImage(`data:image/png;base64,${this.selectedLeave!.signature}`, 'PNG', 40, 135, 60, 20);
      }
      doc.text('Date:', 15, 150);
      doc.text(this.selectedLeave!.issueDate?.toLocaleDateString() || '', 30, 150);

      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    });
  }

  // Fallback print without custom font
  private generatePrintPDFWithoutCustomFont(): void {
    const doc = new jsPDF();
    const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

    doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

    doc.setFontSize(16);
    doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
    doc.setFontSize(10);
    doc.text('TEL. 011-855-3615', 60, 25);

    doc.setFontSize(12);
    doc.text('Medical Certificate', 85, 50, { align: 'center' });
    doc.text(`Date: ${this.selectedLeave!.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

    doc.setFontSize(10);
    doc.text('Name:', 15, 70);
    doc.text(this.selectedLeave!.employeeName || '', 30, 70);
    doc.text('Age:', 80, 70);
    doc.text(this.selectedLeave!.age?.toString() || '', 90, 70);
    doc.text('Sex:', 110, 70);
    doc.text(this.selectedLeave!.sex || '', 120, 70);

    doc.text('Address:', 15, 80);
    doc.text(this.selectedLeave!.address || '', 30, 80);

    doc.text('Examined on:', 15, 90);
    doc.text(this.selectedLeave!.examinedOn?.toLocaleDateString() || '', 40, 90);

    doc.text('Diagnosis:', 15, 100);
    doc.text(this.selectedLeave!.diagnosis, 30, 100);

    doc.text("Doctor's Recommendation:", 15, 110);
    doc.text(this.selectedLeave!.recommendations || 'Rest and follow-up as needed', 40, 110);

    if (this.selectedLeave!.status === 'FitToWork') {
      doc.text('Rest Required:', 15, 120);
      doc.text('No rest required - Patient is fit to work', 40, 120);
    } else {
      doc.text('Rest Required:', 15, 120);
      doc.text(
        `${this.selectedLeave!.totalDays} days (${this.selectedLeave!.startDate?.toLocaleDateString() || ''} - ${this.selectedLeave!.endDate?.toLocaleDateString() || ''})`,
        40,
        120
      );
    }

    doc.text("Doctor's Name:", 15, 130);
    doc.text(this.selectedLeave!.doctorName || '', 40, 130);
    doc.text('Signature:', 15, 140);
    if (this.selectedLeave!.signature) {
      doc.addImage(`data:image/png;base64,${this.selectedLeave!.signature}`, 'PNG', 40, 135, 60, 20);
    }
    doc.text('Date:', 15, 150);
    doc.text(this.selectedLeave!.issueDate?.toLocaleDateString() || '', 30, 150);

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
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