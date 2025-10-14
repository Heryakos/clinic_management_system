import { Component, OnInit, Input, ChangeDetectorRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { SickLeave } from 'src/app/models/medical.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}
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
      employeeId: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[A-Za-z0-9]+$')]],
      employeeName: [{ value: '', disabled: true }, Validators.required],
      address: [{ value: '', disabled: true }, Validators.required],
      diagnosis: [{ value: '', disabled: true }, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      totalDays: [{ value: '', disabled: true }],
      doctorName: [{ value: '', disabled: true }, Validators.required],
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

  calculateTotalDays(): void {
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
        this.cdr.detectChanges();

      }
    }
  }

  prefillForm(): void {
    if (this.patientID) {
      this.medicalService.getPatient(this.patientID).subscribe(
        (patient: any) => {
          console.log('Patient data:', patient);
          this.sickLeaveForm.patchValue({
            employeeId: patient.EmployeeID || '',
            employeeName: patient.FullName || '',
            address: patient.Address || '',
            diagnosis: patient.MedicalHistory || 'To be determined',
            age: patient.Age || null,
            sex: patient.Gender === 'ወንድ / Male' ? 'Male' : patient.Gender === 'ሴት / Female' ? 'Female' : patient.Gender || null,
            examinedOn: patient.LastVisitDate ? new Date(patient.LastVisitDate).toISOString().split('T')[0] : null
          });
  
          if (this.patientID) {
            this.medicalService.getPatientByCardNumberHistory(this.patientID).subscribe(
              (history: any[]) => {
                console.log('Patient history:', history);
                const latestRecord = history.length > 0 ? history[0] : null;
                
                if (latestRecord && latestRecord.Doctor_Name) {
                  // Create a patch value object
                  const patchValues: any = {
                    doctorName: latestRecord.Doctor_Name
                  };
                  
                  // Add signature text if it exists
                  if (latestRecord.SignatureText) {
                    console.log('SignatureText found:', latestRecord.SignatureText.substring(0, 50) + '...');
                    patchValues.SignatureText = latestRecord.SignatureText;
                  } else {
                    console.warn('No SignatureText found in patient history');
                    patchValues.SignatureText = '';
                  }
                  
                  // Patch the values
                  this.sickLeaveForm.patchValue(patchValues);
                  
                  // Verify the values were set correctly
                  setTimeout(() => {
                    console.log('Form doctorName value:', this.sickLeaveForm.get('doctorName')?.value);
                    console.log('Form SignatureText value:', this.sickLeaveForm.get('SignatureText')?.value);
                    console.log('Form SignatureText exists:', !!this.sickLeaveForm.get('SignatureText')?.value);
                  }, 100);
                } else {
                  console.warn('No Doctor_Name found in patient history for cardNumber:', this.patientID);
                  this.sickLeaveForm.patchValue({
                    doctorName: 'Unknown Doctor',
                    SignatureText: ''
                  });
                }
              },
              (error: any) => {
                console.error('Error fetching patient history for cardNumber:', this.patientID, error);
                this.sickLeaveForm.patchValue({
                  doctorName: 'Unknown Doctor',
                  SignatureText: ''
                });
              }
            );
          }
        },
        (error: any) => {
          console.error('Error fetching patient:', error);
          this.showErrorMessage(`Error fetching patient: ${error}`)
        }
      );
    } else {
      console.warn('No Patient ID provided.');
      this.showErrorMessage(`No Patient ID provided.`)
    }
  }
  
// Method to get the signature image source
getSignatureImageSrc(): string {
  const signature = this.sickLeaveForm.get('SignatureText')?.value;
  if (!signature) return '';
  
  // Try different approaches
  console.log('Getting signature image source');
  console.log('Signature value type:', typeof signature);
  console.log('Signature value length:', signature.length);
  
  // Return the data URI
  return `data:image/png;base64,${signature}`;
}

// Method to handle signature image errors
handleSignatureError(event: any): void {
  console.error('Signature image error:', event);
  const img = event.target;
  console.log('Image src length:', img.src.length);
  console.log('Image src starts with data:image/png;base64:', img.src.startsWith('data:image/png;base64,'));
}


  
  onSubmit(): void {
    if (this.sickLeaveForm.valid && this.createdBy) {
      this.isSubmitting = true;
      const formValue = this.sickLeaveForm.getRawValue();

      const newSickLeave: SickLeave = {
        certificateID: 0,
        employeeID: formValue.employeeId,
        employeeName: formValue.employeeName,
        address: formValue.address,
        diagnosis: formValue.diagnosis,
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate),
        totalDays: formValue.totalDays,
        doctorName: formValue.doctorName,
        status: 'Active',
        issueDate: new Date(),
        doctorID: this.createdBy,
        createdBy: this.createdBy,
        recommendations: formValue.recommendations || null,
        age: formValue.age || null,
        sex: formValue.sex || null,
        examinedOn: formValue.examinedOn ? new Date(formValue.examinedOn) : null,
        signature: formValue.SignatureText || null,
        patientID: formValue.patientId || null
      };

      this.medicalService.createSickLeaveCertificate(newSickLeave).subscribe(
        (response: any) => {
          this.isSubmitting = false;
          this.sickLeaveForm.reset();
          this.initializeForm();
          this.prefillForm();
          this.loadSickLeaves();
          this.showSuccessMessage(`Sick leave certificate issued successfully!`)
        },
        error => {
          this.isSubmitting = false;
          console.error('Error issuing sick leave:', error);
          this.showErrorMessage(`Error issuing sick leave: ${(error.error?.message || 'Please try again.')}`)
        }
      );
    } else {
      this.showErrorMessage('Please fill all required fields and ensure a valid Created By ID is provided.')
    }
  }

  loadSickLeaves(): void {
    if (this.patientID) {
      console.log('asde',this.patientID);
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
  

  updateLeaveStatus(certificateID: number, status: 'Active' | 'Completed' | 'Cancelled'): void {
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

    const doc = new jsPDF();
    const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

    doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

    doc.setFontSize(16);
    doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
    doc.setFontSize(10);
    doc.text('TEL. 011-855-3615', 60, 25);

    doc.setFontSize(12);
    doc.text('Medical Certificate', 85, 50, { align: 'center' });
    doc.text(`Date: ${this.selectedLeave.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

    doc.setFontSize(10);
    doc.text('Name:', 15, 70);
    doc.text(this.selectedLeave.employeeName || '', 30, 70);
    doc.text('Age:', 80, 70);
    doc.text(this.selectedLeave.age?.toString() || '', 90, 70);
    doc.text('Sex:', 110, 70);
    doc.text(this.selectedLeave.sex || '', 120, 70);

    doc.text('Address:', 15, 80);
    doc.text(this.selectedLeave.address || '', 30, 80);

    doc.text('Examined on:', 15, 90);
    doc.text(this.selectedLeave.examinedOn?.toLocaleDateString() || '', 40, 90);

    doc.text('Diagnosis:', 15, 100);
    doc.text(this.selectedLeave.diagnosis, 30, 100);

    doc.text("Doctor's Recommendation:", 15, 110);
    doc.text(this.selectedLeave.recommendations || 'Rest and follow-up as needed', 40, 110);

    doc.text('Rest Required:', 15, 120);
    doc.text(
      `${this.selectedLeave.totalDays} days (${this.selectedLeave.startDate?.toLocaleDateString()} - ${this.selectedLeave.endDate?.toLocaleDateString()})`,
      40,
      120
    );

    doc.text("Doctor's Name:", 15, 130);
    doc.text(this.selectedLeave.doctorName || '', 40, 130);
    doc.text('Signature:', 15, 140);
    if (this.selectedLeave.signature) {
      doc.addImage(`data:image/png;base64,${this.selectedLeave.signature}`, 'PNG', 40, 135, 60, 20);
    }
    doc.text('Date:', 15, 150);
    doc.text(this.selectedLeave.issueDate?.toLocaleDateString() || '', 30, 150);

    doc.save(`medical-certificate-${this.selectedLeave.certificateID}.pdf`);
  }

  printCertificate(): void {
    if (!this.selectedLeave) return;

    const doc = new jsPDF();
    const logoUrl = 'assets/photo_2025-07-21_14-48-47.jpg';

    doc.addImage(logoUrl, 'JPEG', 15, 10, 30, 30);

    doc.setFontSize(16);
    doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', 60, 20);
    doc.setFontSize(10);
    doc.text('TEL. 011-855-3615', 60, 25);

    doc.setFontSize(12);
    doc.text('Medical Certificate', 85, 50, { align: 'center' });
    doc.text(`Date: ${this.selectedLeave.issueDate?.toLocaleDateString() || new Date().toLocaleDateString()}`, 15, 60);

    doc.setFontSize(10);
    doc.text('Name:', 15, 70);
    doc.text(this.selectedLeave.employeeName || '', 30, 70);
    doc.text('Age:', 80, 70);
    doc.text(this.selectedLeave.age?.toString() || '', 90, 70);
    doc.text('Sex:', 110, 70);
    doc.text(this.selectedLeave.sex || '', 120, 70);

    doc.text('Address:', 15, 80);
    doc.text(this.selectedLeave.address || '', 30, 80);

    doc.text('Examined on:', 15, 90);
    doc.text(this.selectedLeave.examinedOn?.toLocaleDateString() || '', 40, 90);

    doc.text('Diagnosis:', 15, 100);
    doc.text(this.selectedLeave.diagnosis, 30, 100);

    doc.text("Doctor's Recommendation:", 15, 110);
    doc.text(this.selectedLeave.recommendations || 'Rest and follow-up as needed', 40, 110);

    doc.text('Rest Required:', 15, 120);
    doc.text(
      `${this.selectedLeave.totalDays} days (${this.selectedLeave.startDate?.toLocaleDateString()} - ${this.selectedLeave.endDate?.toLocaleDateString()})`,
      40,
      120
    );

    doc.text("Doctor's Name:", 15, 130);
    doc.text(this.selectedLeave.doctorName || '', 40, 130);
    doc.text('Signature:', 15, 140);
    if (this.selectedLeave.signature) {
      doc.addImage(`data:image/png;base64,${this.selectedLeave.signature}`, 'PNG', 40, 135, 60, 20);
    }
    doc.text('Date:', 15, 150);
    doc.text(this.selectedLeave.issueDate?.toLocaleDateString() || '', 30, 150);

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