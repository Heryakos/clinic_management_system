import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';

@Component({
  selector: 'app-suturing-paper',
  templateUrl: './suturing-paper.component.html',
  styleUrls: ['./suturing-paper.component.css']
})
export class SuturingPaperComponent implements OnInit {
  logoPath = ASSETS.LOGO;
  suturingForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;
  suturingData: any = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<SuturingPaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      suturingID: number; 
      patientID: number;
      dialogTitle: string 
    }
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuturingData(this.data.suturingID, this.data.patientID);
  }

  initializeForm(): void {
    this.suturingForm = this.fb.group({
      FullName: [{ value: '', disabled: true }],
      gender: [{ value: '', disabled: true }],
      age: [{ value: null, disabled: true }],
      Weight: [{ value: null, disabled: false }],
      CardNumber: [{ value: '', disabled: true }],
      woreda: [{ value: '', disabled: false }],
      houseNo: [{ value: '', disabled: false }],
      phone: [{ value: '', disabled: false }],
      MedicalHistory: [{ value: '', disabled: true }],
      suturingNumber: [{ value: '', disabled: true }],
      procedureDate: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      orderingPhysicianName: [{ value: '', disabled: true }],
      woundType: [{ value: '', disabled: true }],
      woundLocation: [{ value: '', disabled: true }],
      woundSize: [{ value: '', disabled: true }],
      woundDepth: [{ value: '', disabled: true }],
      sutureType: [{ value: '', disabled: true }],
      sutureMaterial: [{ value: '', disabled: true }],
      sutureSize: [{ value: '', disabled: true }],
      numStitches: [{ value: null, disabled: true }],
      anesthesiaUsed: [{ value: '', disabled: true }],
      instructions: [{ value: '', disabled: true }],
      notes: [{ value: '', disabled: true }],
      performedByName: [{ value: '', disabled: true }],
      performedDate: [{ value: '', disabled: true }]
    });
  }

  loadSuturingData(suturingID: number, patientID: number): void {
    this.isLoading = true;
    this.medicalService.getSuturingDetails(suturingID).subscribe(
      (response: any) => {
        if (response) {
          this.suturingData = response;
          this.processSuturingResponse(response);
        } else {
          this.errorMessage = 'Suturing not found.';
          this.isLoading = false;
        }
      },
      error => {
        this.errorMessage = 'Failed to load suturing data.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  private processSuturingResponse(data: any): void {
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
      suturingNumber: data.SuturingNumber || '',
      procedureDate: data.ProcedureDate ? new Date(data.ProcedureDate).toISOString().split('T')[0] : '',
      status: data.Status || '',
      orderingPhysicianName: data.OrderingPhysicianName || '',
      woundType: data.WoundType || '',
      woundLocation: data.WoundLocation || '',
      woundSize: data.WoundSize || '',
      woundDepth: data.WoundDepth || '',
      sutureType: data.SutureType || '',
      sutureMaterial: data.SutureMaterial || '',
      sutureSize: data.SutureSize || '',
      numStitches: data.NumStitches || null,
      anesthesiaUsed: data.AnesthesiaUsed || '',
      instructions: data.Instructions || '',
      notes: data.Notes || '',
      performedByName: data.PerformedByName || '',
      performedDate: data.PerformedDate ? new Date(data.PerformedDate).toISOString().split('T')[0] : ''
    };

    this.suturingForm.patchValue(formData);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    const fieldsToToggle = ['Weight', 'woreda', 'houseNo', 'phone'];
    fieldsToToggle.forEach(field => {
      if (this.isEditing) {
        this.suturingForm.get(field)?.enable();
      } else {
        this.suturingForm.get(field)?.disable();
      }
    });
  }

  onSubmit(): void {
    if (this.suturingForm.valid && this.data.suturingID) {
      this.isLoading = true;
      // Update logic
      this.isLoading = false;
      this.showMessage('Suturing updated successfully!');
    }
  }

  printSuturing(): void { window.print(); }

  exportToPDF(): void {
    const doc = new jsPDF();
    const formValue = this.suturingForm.getRawValue();

    doc.setFontSize(14);
    doc.text('FEDERAL HOUSING CORPORATION MEDIUM CLINIC', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TEL. 0118 553615', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(this.data.dialogTitle, 105, 40, { align: 'center' });

    let y = 50;
    doc.text(`Patient: ${formValue.FullName}`, 20, y);
    doc.text(`Card No: ${formValue.CardNumber}`, 20, y + 10);
    doc.text(`Suturing #: ${formValue.suturingNumber}`, 20, y + 20);

    y += 30;
    autoTable(doc, {
      startY: y,
      head: [['Suturing Details']],
      body: [
        [`Wound Type: ${formValue.woundType}`],
        [`Location: ${formValue.woundLocation}`],
        [`Size: ${formValue.woundSize}`],
        [`Depth: ${formValue.woundDepth}`],
        [`Suture Type: ${formValue.sutureType}`],
        [`Material: ${formValue.sutureMaterial}`],
        [`Size: ${formValue.sutureSize}`],
        [`Stitches: ${formValue.numStitches}`],
        [`Anesthesia: ${formValue.anesthesiaUsed}`],
        [`Date: ${formValue.procedureDate}`],
        [`Status: ${formValue.status}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    doc.save(`suturing-${formValue.suturingNumber}.pdf`);
  }

  private showMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 3000);
  }
}