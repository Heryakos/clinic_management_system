import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReferralFormData } from '../interfaces/patient.interface';
import { PatientSummary } from '../../models/medical.model';
import jsPDF from 'jspdf';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { MedicalService } from 'src/app/medical.service';

@Component({
  selector: 'app-referral-modal',
  templateUrl: './referral-modal.component.html',
  styleUrls: ['./referral-modal.component.css']
})
export class ReferralModalComponent implements OnInit {
  @Input() patient: PatientSummary | null = null;
  @Input() isSubmitting: boolean = false;
  @Input() createdBy: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() submitReferral = new EventEmitter<ReferralFormData>();

  referralForm!: FormGroup;
  physicianName: string = '';
  physicianPhone: string = '';
  referredToOptions: string[] = ['Clinic/Hospital/HealthOffice'];

  // Updated departments to match API constraints
  departments: string[] = [
    'Doctor',
  ];

  priorities: string[] = ['Normal', 'Urgent', 'STAT'];

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, private medicalService: MedicalService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  private initializeForm(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    const referralNumber = `REF${Date.now().toString().slice(-6)}`;

    this.referralForm = this.fb.group({
      // Patient Information (read-only)
      patientName: [this.patient?.FullName || '', Validators.required],
      patientId: [this.patient?.PatientID || ''],
      cardNumber: [this.patient?.CardNumber || ''],
      age: [this.patient?.Age?.toString() || ''],
      gender: [this.patient?.Gender || ''],
      phoneNumber: [this.patient?.phone || ''],
      address: [this.patient?.Address || ''],

      // Referral Details
      referringPhysician: [this.createdBy || '', Validators.required],
      referralDate: [currentDate],
      referralNumber: [referralNumber],
      department: ['', Validators.required], // Must be Laboratory, Pharmacy, or Injection
      referredTo: ['Clinic/Hospital/HealthOffice', Validators.required],
      referredToAddress: [''],
      referredToPhone: [''],
      priority: ['Normal', Validators.required],
      notes: [''],
      referenceId: [''],

      // Clinical Information
      reasonForReferral: ['', Validators.required],
      clinicalHistory: [''],
      currentDiagnosis: [''],
      
      // Vital Signs
      bloodPressure: [''],
      heartRate: [''],
      temperature: [''],
      weight: [''],
      height: [''],
      
      currentMedications: [''],
      allergies: [''],
      labResults: [''],

      // Insurance Information
      insuranceProvider: [''],
      policyNumber: [''],
      groupNumber: [''],

      // Additional Information
      urgentFollowUp: [false],
      transportationNeeded: [false],
      interpreterNeeded: [false],
      additionalNotes: [''],

      // Physician Information
      physicianName: ['', Validators.required],
      physicianLicense: [''],
      physicianPhone: [''],
      physicianSignature: [''],
      
      // Created By
      createdBy: [this.createdBy || '', Validators.required]
    });
  }


  debugForm(): void {
    console.log('Form valid:', this.referralForm.valid);
    console.log('Form errors:', this.referralForm.errors);
    
    // Log each control's status
    Object.keys(this.referralForm.controls).forEach(key => {
      const control = this.referralForm.get(key);
      console.log(`${key}: valid=${control?.valid}, errors=${JSON.stringify(control?.errors)}, value=${control?.value}`);
      
      // If the field is invalid, log more details
      if (control && control.invalid) {
        console.log(`  - Dirty: ${control.dirty}, Touched: ${control.touched}`);
        if (control.errors) {
          Object.keys(control.errors).forEach(errorKey => {
            console.log(`  - Error: ${errorKey}, Value: ${control.errors?.[errorKey]}`);
          });
        }
      }
    });
  }
  
  

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          // Construct physician name from first, middle, and last names
          this.physicianName = `${employee.fName || ''} ${employee.mName || ''} ${employee.lName || ''}`.trim();
          this.physicianPhone = employee.workPhone || '';
          
          // Make sure you're getting the user_ID as a GUID
          const physicianGuid = employee.user_ID;
          
          // Update the form with the physician data
          if (this.referralForm) {
            this.referralForm.patchValue({
              physicianName: this.physicianName,
              physicianPhone: this.physicianPhone,
              referringPhysician: physicianGuid, // Use the GUID, not the name
              createdBy: physicianGuid
            });
          }
        }
      },
      error => {
        console.error('Error loading user data:', error);
        this.snackBar.open('Error loading physician information', 'Close', { duration: 3000 });
      }
    );
  }
  

  onSubmit(): void {
    if (this.referralForm.valid && this.patient) {
        // Get the values directly from the form
        const referringPhysician = this.referralForm.value.referringPhysician || '';
        const createdBy = this.referralForm.value.createdBy || '';
        
        // Validate that we have non-empty values
        if (!referringPhysician || !createdBy) {
            this.snackBar.open('Invalid physician or creator ID', 'Close', { duration: 3000 });
            return;
        }

        const formData: ReferralFormData = {
            PatientID: this.patient.PatientID,
            CardNumber: this.patient.CardNumber,
            ReferringPhysician: referringPhysician,
            Department: this.referralForm.value.department,
            Notes: this.referralForm.value.notes,
            ReferenceID: this.referralForm.value.referenceId ? parseInt(this.referralForm.value.referenceId) : undefined,
            CreatedBy: createdBy,
            
            // Clinical Details
            ClinicalHistory: this.referralForm.value.clinicalHistory,
            CurrentDiagnosis: this.referralForm.value.currentDiagnosis,
            VitalSignsBloodPressure: this.referralForm.value.bloodPressure,
            VitalSignsHeartRate: this.referralForm.value.heartRate,
            VitalSignsTemperature: this.referralForm.value.temperature,
            VitalSignsWeight: this.referralForm.value.weight,
            VitalSignsHeight: this.referralForm.value.height,
            CurrentMedications: this.referralForm.value.currentMedications,
            Allergies: this.referralForm.value.allergies,
            LabResults: this.referralForm.value.labResults,
            
            // Insurance
            InsuranceProvider: this.referralForm.value.insuranceProvider,
            PolicyNumber: this.referralForm.value.policyNumber,
            GroupNumber: this.referralForm.value.groupNumber,
            
            // Additional Info
            UrgentFollowUp: this.referralForm.value.urgentFollowUp,
            TransportationNeeded: this.referralForm.value.transportationNeeded,
            InterpreterNeeded: this.referralForm.value.interpreterNeeded,
            AdditionalNotes: this.referralForm.value.additionalNotes,
            
            // Physician Info
            PhysicianName: this.referralForm.value.physicianName,
            PhysicianLicense: this.referralForm.value.physicianLicense,
            PhysicianPhone: this.referralForm.value.physicianPhone,
            PhysicianSignature: this.referralForm.value.physicianSignature,
            
            referralDate: this.referralForm.value.referralDate
        };
        
        this.submitReferral.emit(formData);
    } else {
        this.markFormGroupTouched();
        this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
    }
}

  

  onClose(): void {
    this.closeModal.emit();
  }

  // Export methods
  onExportDetailedPDF(): void {
    this.generateDetailedPDF();
  }

  onExportSummaryPDF(): void {
    this.generateSummaryPDF();
  }

  onPrintDetailed(): void {
    this.printDetailed();
  }

  onPrintSummary(): void {
    this.printSummary();
  }

  private generateDetailedPDF(): void {
    const doc = new jsPDF();
    const formData = this.referralForm.value;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT REFERRAL FORM', 105, 20, { align: 'center' });
    
    // Patient Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', 20, 40);
    doc.setFont('helvetica', 'normal');
    
    let yPos = 50;
    doc.text(`Name: ${formData.patientName}`, 20, yPos);
    doc.text(`Card Number: ${formData.cardNumber}`, 120, yPos);
    yPos += 10;
    doc.text(`Age: ${formData.age}`, 20, yPos);
    doc.text(`Gender: ${formData.gender}`, 120, yPos);
    yPos += 10;
    doc.text(`Phone: ${formData.phoneNumber}`, 20, yPos);
    yPos += 15;

    // Referral Details
    doc.setFont('helvetica', 'bold');
    doc.text('REFERRAL DETAILS', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    doc.text(`Department: ${formData.department}`, 20, yPos);
    doc.text(`Priority: ${formData.priority}`, 120, yPos);
    yPos += 10;
    doc.text(`Referring Physician: ${formData.physicianName}`, 20, yPos);
    yPos += 10;
    doc.text(`Date: ${formData.referralDate}`, 20, yPos);
    yPos += 15;

    // Clinical Information
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL INFORMATION', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    if (formData.clinicalHistory) {
      doc.text('Clinical History:', 20, yPos);
      yPos += 5;
      const splitHistory = doc.splitTextToSize(formData.clinicalHistory, 170);
      doc.text(splitHistory, 20, yPos);
      yPos += splitHistory.length * 5 + 5;
    }
    
    if (formData.currentDiagnosis) {
      doc.text('Current Diagnosis:', 20, yPos);
      yPos += 5;
      const splitDiagnosis = doc.splitTextToSize(formData.currentDiagnosis, 170);
      doc.text(splitDiagnosis, 20, yPos);
      yPos += splitDiagnosis.length * 5 + 5;
    }

    // Vital Signs
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('VITAL SIGNS', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    doc.text(`Blood Pressure: ${formData.bloodPressure || 'N/A'}`, 20, yPos);
    doc.text(`Heart Rate: ${formData.heartRate || 'N/A'}`, 120, yPos);
    yPos += 10;
    doc.text(`Temperature: ${formData.temperature || 'N/A'}`, 20, yPos);
    doc.text(`Weight: ${formData.weight || 'N/A'}`, 120, yPos);
    yPos += 10;
    doc.text(`Height: ${formData.height || 'N/A'}`, 20, yPos);

    // Save the PDF
    doc.save(`referral_${formData.cardNumber}_detailed.pdf`);
    this.snackBar.open('Detailed referral exported as PDF!', 'Close', { duration: 3000 });
  }

  private generateSummaryPDF(): void {
    const doc = new jsPDF();
    const formData = this.referralForm.value;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Referral Summary', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${formData.patientName}`, 20, 40);
    doc.text(`Card Number: ${formData.cardNumber}`, 20, 50);
    doc.text(`Department: ${formData.department}`, 20, 60);
    doc.text(`Date: ${formData.referralDate}`, 20, 70);
    doc.text(`Referring Physician: ${formData.physicianName}`, 20, 80);
    doc.text(`Priority: ${formData.priority}`, 20, 90);

    doc.save(`referral_${formData.cardNumber}_summary.pdf`);
    this.snackBar.open('Summary referral exported as PDF!', 'Close', { duration: 3000 });
  }

  private printDetailed(): void {
    const printContent = document.querySelector('.referral-modal-content')?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Detailed Referral</title>
            <style>${this.getPrintStyles()}</style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.print();
    }
  }

  private printSummary(): void {
    const formData = this.referralForm.value;
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="text-align: center;">Referral Summary</h2>
        <p><strong>Patient:</strong> ${formData.patientName}</p>
        <p><strong>Card Number:</strong> ${formData.cardNumber}</p>
        <p><strong>Department:</strong> ${formData.department}</p>
        <p><strong>Date:</strong> ${formData.referralDate}</p>
        <p><strong>Referring Physician:</strong> ${formData.physicianName}</p>
        <p><strong>Priority:</strong> ${formData.priority}</p>
        <p><strong>Notes:</strong> ${formData.notes || 'N/A'}</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print Summary Referral</title>
          <style>body { font-family: Arial, sans-serif; }</style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  }

  private getPrintStyles(): string {
    return `
      body { font-family: Arial, sans-serif; padding: 20px; }
      .referral-modal-content { max-width: 800px; margin: 0 auto; }
      .form-section { margin-bottom: 20px; }
      .form-section h3 { font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
      .form-group { margin-bottom: 15px; }
      .form-group label { font-weight: bold; }
      .form-control { border: none; background: transparent; }
      .modal-actions { display: none; }
      .close-btn { display: none; }
    `;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.referralForm.controls).forEach(key => {
      const control = this.referralForm.get(key);
      if (control) control.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.referralForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getFieldErrors(fieldName: string): any {
    const field = this.referralForm.get(fieldName);
    return field ? field.errors : null;
  }

  isVitalSignFieldInvalid(fieldName: string): boolean {
    const field = this.referralForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
}