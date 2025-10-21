import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';

@Component({
  selector: 'app-wound-care-paper',
  templateUrl: './wound-care-paper.component.html',
  styleUrls: ['./wound-care-paper.component.css']
})
export class WoundCarePaperComponent implements OnInit {
  logoPath = ASSETS.LOGO;
  woundCareForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;
  woundCareData: any = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<WoundCarePaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      woundCareID: number; 
      patientID: number;
      dialogTitle: string 
    }
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadWoundCareData(this.data.woundCareID, this.data.patientID);
  }

  initializeForm(): void {
    this.woundCareForm = this.fb.group({
      FullName: [{ value: '', disabled: true }],
      gender: [{ value: '', disabled: true }],
      age: [{ value: null, disabled: true }],
      Weight: [{ value: null, disabled: false }],
      CardNumber: [{ value: '', disabled: true }],
      woreda: [{ value: '', disabled: false }],
      houseNo: [{ value: '', disabled: false }],
      phone: [{ value: '', disabled: false }],
      MedicalHistory: [{ value: '', disabled: true }],
      woundCareNumber: [{ value: '', disabled: true }],
      procedureDate: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      orderingPhysicianName: [{ value: '', disabled: true }],
      woundType: [{ value: '', disabled: true }],
      woundLocation: [{ value: '', disabled: true }],
      woundSize: [{ value: '', disabled: true }],
      woundDepth: [{ value: '', disabled: true }],
      woundCondition: [{ value: '', disabled: true }],
      treatmentPlan: [{ value: '', disabled: true }],
      dressingType: [{ value: '', disabled: true }],
      cleaningSolution: [{ value: '', disabled: true }],
      instructions: [{ value: '', disabled: true }],
      notes: [{ value: '', disabled: true }],
      performedByName: [{ value: '', disabled: true }],
      performedDate: [{ value: '', disabled: true }]
    });
  }

  loadWoundCareData(woundCareID: number, patientID: number): void {
    this.isLoading = true;
    this.medicalService.getWoundCareDetails(woundCareID).subscribe(
      (response: any) => {
        if (response) {
          this.woundCareData = response;
          this.processWoundCareResponse(response);
        } else {
          this.errorMessage = 'Wound care not found.';
          this.isLoading = false;
        }
      },
      error => {
        this.errorMessage = 'Failed to load wound care data.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  private processWoundCareResponse(data: any): void {
    const formData = {
      FullName: data.PatientName || data.FullName || '',
      gender: data.Gender || '',
      age: data.Age || null,
      Weight: data.Weight || null,
      CardNumber: data.CardNumber || '',
      woreda: data.Woreda || '',
      houseNo: data.HouseNo || '',
      phone: data.Phone || '',
      MedicalHistory: data.MedicalHistory || '',
      woundCareNumber: data.WoundCareNumber || '',
      procedureDate: data.ProcedureDate ? new Date(data.ProcedureDate).toISOString().split('T')[0] : '',
      status: data.Status || '',
      orderingPhysicianName: data.OrderingPhysicianName || '',
      woundType: data.WoundType || '',
      woundLocation: data.WoundLocation || '',
      woundSize: data.WoundSize || '',
      woundDepth: data.WoundDepth || '',
      woundCondition: data.WoundCondition || '',
      treatmentPlan: data.TreatmentPlan || '',
      dressingType: data.DressingType || '',
      cleaningSolution: data.CleaningSolution || '',
      instructions: data.Instructions || '',
      notes: data.Notes || '',
      performedByName: data.PerformedByName || '',
      performedDate: data.PerformedDate ? new Date(data.PerformedDate).toISOString().split('T')[0] : ''
    };

    this.woundCareForm.patchValue(formData);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    const fieldsToToggle = ['Weight', 'woreda', 'houseNo', 'phone'];
    fieldsToToggle.forEach(field => {
      if (this.isEditing) {
        this.woundCareForm.get(field)?.enable();
      } else {
        this.woundCareForm.get(field)?.disable();
      }
    });
  }

  onSubmit(): void {
    if (this.woundCareForm.valid && this.data.woundCareID) {
      // Implementation for updating wound care
      this.isLoading = true;
      // ... update logic
      this.isLoading = false;
    }
  }

  printWoundCare(): void { window.print(); }

  exportToPDF(): void {
    const doc = new jsPDF();
    const formValue = this.woundCareForm.getRawValue();

    // Header
    doc.setFontSize(14);
    doc.text('FEDERAL HOUSING CORPORATION MEDIUM CLINIC', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TEL. 0118 553615', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(this.data.dialogTitle, 105, 40, { align: 'center' });

    // Patient Info
    let y = 50;
    doc.text(`Patient: ${formValue.FullName}`, 20, y);
    doc.text(`Card No: ${formValue.CardNumber}`, 20, y + 10);
    doc.text(`Wound Care #: ${formValue.woundCareNumber}`, 20, y + 20);

    // Wound Care Details Table
    y += 30;
    autoTable(doc, {
      startY: y,
      head: [['Wound Care Details']],
      body: [
        [`Wound Type: ${formValue.woundType}`],
        [`Location: ${formValue.woundLocation}`],
        [`Size: ${formValue.woundSize}`],
        [`Depth: ${formValue.woundDepth}`],
        [`Condition: ${formValue.woundCondition}`],
        [`Treatment Plan: ${formValue.treatmentPlan}`],
        [`Dressing: ${formValue.dressingType}`],
        [`Cleaning Solution: ${formValue.cleaningSolution}`],
        [`Date: ${formValue.procedureDate}`],
        [`Status: ${formValue.status}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    doc.save(`wound-care-${formValue.woundCareNumber}.pdf`);
  }
}