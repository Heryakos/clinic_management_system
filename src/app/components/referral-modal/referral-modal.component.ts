import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientSummary } from '../../models/medical.model';
import jsPDF from 'jspdf';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';

interface ReferralFormData {
  PatientID: number;
  CardNumber: string;
  ReferringPhysician: string;
  CreatedBy: string;
  ReferredTo: string;
  ReferredToAddress?: string;
  ReferredToPhone?: string;
  ReasonForReferral: string;
  ClinicalFindings?: string;
  Diagnosis?: string;
  InvestigationResult?: string;
  RxGiven?: string;
}

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

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPhysicianData();
  }

  private initializeForm(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    const referralNumber = `REF-${Date.now().toString().slice(-8)}`;
  
    this.referralForm = this.fb.group({
      patientName: [this.patient?.FullName || '', Validators.required],
      patientId: [this.patient?.PatientID || ''],
      cardNumber: [this.patient?.CardNumber || ''],
      age: [this.patient?.Age?.toString() || ''],
      gender: [this.patient?.gender || ''],
      address: [this.patient?.Address || ''],
      occupation: [''],
      woreda: [''],
      kebele: [''],
      houseNo: [''],
  
      referralDate: [currentDate],
      referralNumber: [referralNumber],
  
      referredTo: ['', Validators.required],
      referredToAddress: [''],
      referredToPhone: [''],
  
      clinicalFindings: [''],
      diagnosis: [''],
      investigationResult: [''],
      rxGiven: [''],
      reasonForReferral: ['', Validators.required],
  
      physicianName: [''],
      physicianSignature: [''],
  
      referringPhysician: [this.createdBy || ''],
      createdBy: [this.createdBy || '']
    });
  }

  private loadPhysicianData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe({
      next: (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.physicianName = `${employee.fName || ''} ${employee.mName || ''} ${employee.lName || ''}`.trim();
          const physicianGuid = employee.user_ID;

          this.referralForm.patchValue({
            physicianName: this.physicianName,
            referringPhysician: physicianGuid,
            createdBy: physicianGuid
          });
        }
      },
      error: () => {
        this.snackBar.open('Could not load physician name', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.referralForm.valid && this.patient) {
      const formValue = this.referralForm.value;

      const data: ReferralFormData = {
        PatientID: this.patient.PatientID,
        CardNumber: this.patient.CardNumber,
        ReferringPhysician: formValue.referringPhysician,
        CreatedBy: formValue.createdBy,
        ReferredTo: formValue.referredTo,
        ReferredToAddress: formValue.referredToAddress || undefined,
        ReferredToPhone: formValue.referredToPhone || undefined,
        ReasonForReferral: formValue.reasonForReferral,
        ClinicalFindings: formValue.clinicalFindings || undefined,
        Diagnosis: formValue.diagnosis || undefined,
        InvestigationResult: formValue.investigationResult || undefined,
        RxGiven: formValue.rxGiven || undefined
      };

      this.submitReferral.emit(data);
    } else {
      this.markFormTouched();
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 4000 });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onExportPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const form = this.referralForm.value;

    let y = 15;

    // Header
    doc.setFontSize(18);
    doc.text('Federal Housing corporation Medium Clinic', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(16);
    doc.text('Patient Referral Slip', 105, y, { align: 'center' });
    y += 10;

    doc.setFontSize(11);
    doc.text(`Ref. No: ${form.referralNumber}`, 20, y);
    doc.text(`Date: ${new Date(form.referralDate).toLocaleDateString()}`, 140, y);
    y += 12;

    // To
    doc.setFontSize(12);
    doc.text('To:', 20, y);
    doc.setFontSize(11);
    doc.text(form.referredTo || '', 50, y);
    y += 7;
    if (form.referredToAddress) doc.text(form.referredToAddress, 50, y), y += 6;
    if (form.referredToPhone) doc.text(`Phone: ${form.referredToPhone}`, 50, y), y += 10;

    // Patient Info
    doc.setFontSize(12);
    doc.text('Patient Information', 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Name: ${form.patientName}`, 20, y); y += 6;
    doc.text(`Age: ${form.age}   Sex: ${form.gender}`, 20, y); y += 6;
    doc.text(`Occupation: ${form.occupation || 'N/A'}`, 20, y); y += 6;
    doc.text(`Address: ${form.address || 'N/A'}`, 20, y); y += 6;
    doc.text(`Woreda: ${form.woreda || 'N/A'}   Kebele: ${form.kebele || 'N/A'}   House No: ${form.houseNo || 'N/A'}`, 20, y);
    y += 12;

    // Clinical
    const addText = (label: string, value: string) => {
      if (value) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${label}:`, 20, y);
        const lines = doc.splitTextToSize(value, 170);
        doc.text(lines, 25, y + 6);
        y += lines.length * 6 + 10;
      }
    };

    addText('Clinical Findings', form.clinicalFindings);
    addText('Diagnosis', form.diagnosis);
    addText('Investigation Result', form.investigationResult);
    addText('Rx. Given', form.rxGiven);
    addText('Reason for Referral', form.reasonForReferral);

    // Physician
    doc.text(`Referred by: ${form.physicianName}`, 20, y);
    y += 8;
    doc.text(`Signature: ___________________________`, 20, y);

    // Save
    doc.save(`Referral_${form.cardNumber}_${form.referralNumber}.pdf`);
    this.snackBar.open('Referral slip exported as PDF!', 'Close', { duration: 3000 });
  }

  private markFormTouched(): void {
    Object.keys(this.referralForm.controls).forEach(key => {
      this.referralForm.get(key)?.markAsTouched();
    });
  }
}