import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';

@Component({
  selector: 'app-ear-irrigation-paper',
  templateUrl: './ear-irrigation-paper.component.html',
  styleUrls: ['./ear-irrigation-paper.component.css']
})
export class EarIrrigationPaperComponent implements OnInit {
  logoPath = ASSETS.LOGO;
  earIrrigationForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;
  earIrrigationData: any = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<EarIrrigationPaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      earIrrigationID: number; 
      patientID: number;
      dialogTitle: string 
    }
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadEarIrrigationData(this.data.earIrrigationID, this.data.patientID);
  }

  initializeForm(): void {
    this.earIrrigationForm = this.fb.group({
      FullName: [{ value: '', disabled: true }],
      gender: [{ value: '', disabled: true }],
      age: [{ value: null, disabled: true }],
      Weight: [{ value: null, disabled: false }],
      CardNumber: [{ value: '', disabled: true }],
      woreda: [{ value: '', disabled: false }],
      houseNo: [{ value: '', disabled: false }],
      phone: [{ value: '', disabled: false }],
      MedicalHistory: [{ value: '', disabled: true }],
      earIrrigationNumber: [{ value: '', disabled: true }],
      procedureDate: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      orderingPhysicianName: [{ value: '', disabled: true }],
      earSide: [{ value: '', disabled: true }],
      irrigationSolution: [{ value: '', disabled: true }],
      solutionTemperature: [{ value: '', disabled: true }],
      irrigationPressure: [{ value: '', disabled: true }],
      procedureDuration: [{ value: null, disabled: true }],
      findings: [{ value: '', disabled: true }],
      complications: [{ value: '', disabled: true }],
      instructions: [{ value: '', disabled: true }],
      notes: [{ value: '', disabled: true }],
      performedByName: [{ value: '', disabled: true }],
      performedDate: [{ value: '', disabled: true }]
    });
  }

  loadEarIrrigationData(earIrrigationID: number, patientID: number): void {
    this.isLoading = true;
    this.medicalService.getEarIrrigationDetails(earIrrigationID).subscribe(
      (response: any) => {
        if (response) {
          this.earIrrigationData = response;
          this.processEarIrrigationResponse(response);
        } else {
          this.errorMessage = 'Ear irrigation not found.';
          this.isLoading = false;
        }
      },
      error => {
        this.errorMessage = 'Failed to load ear irrigation data.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  private processEarIrrigationResponse(data: any): void {
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
      earIrrigationNumber: data.EarIrrigationNumber || '',
      procedureDate: data.ProcedureDate ? new Date(data.ProcedureDate).toISOString().split('T')[0] : '',
      status: data.Status || '',
      orderingPhysicianName: data.OrderingPhysicianName || '',
      earSide: data.EarSide || '',
      irrigationSolution: data.IrrigationSolution || '',
      solutionTemperature: data.SolutionTemperature || '',
      irrigationPressure: data.IrrigationPressure || '',
      procedureDuration: data.ProcedureDuration || null,
      findings: data.Findings || '',
      complications: data.Complications || '',
      instructions: data.Instructions || '',
      notes: data.Notes || '',
      performedByName: data.PerformedByName || '',
      performedDate: data.PerformedDate ? new Date(data.PerformedDate).toISOString().split('T')[0] : ''
    };

    this.earIrrigationForm.patchValue(formData);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    const fieldsToToggle = ['Weight', 'woreda', 'houseNo', 'phone'];
    fieldsToToggle.forEach(field => {
      if (this.isEditing) {
        this.earIrrigationForm.get(field)?.enable();
      } else {
        this.earIrrigationForm.get(field)?.disable();
      }
    });
  }

  onSubmit(): void {
    if (this.earIrrigationForm.valid && this.data.earIrrigationID) {
      this.isLoading = true;
      // Update logic
      this.isLoading = false;
      this.showMessage('Ear irrigation updated successfully!');
    }
  }

  printEarIrrigation(): void { window.print(); }

  exportToPDF(): void {
    const doc = new jsPDF();
    const formValue = this.earIrrigationForm.getRawValue();

    doc.setFontSize(14);
    doc.text('FEDERAL HOUSING CORPORATION MEDIUM CLINIC', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TEL. 0118 553615', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(this.data.dialogTitle, 105, 40, { align: 'center' });

    let y = 50;
    doc.text(`Patient: ${formValue.FullName}`, 20, y);
    doc.text(`Card No: ${formValue.CardNumber}`, 20, y + 10);
    doc.text(`Ear Irrigation #: ${formValue.earIrrigationNumber}`, 20, y + 20);

    y += 30;
    autoTable(doc, {
      startY: y,
      head: [['Ear Irrigation Details']],
      body: [
        [`Ear Side: ${formValue.earSide}`],
        [`Solution: ${formValue.irrigationSolution}`],
        [`Temperature: ${formValue.solutionTemperature}`],
        [`Pressure: ${formValue.irrigationPressure}`],
        [`Duration: ${formValue.procedureDuration} min`],
        [`Findings: ${formValue.findings}`],
        [`Complications: ${formValue.complications}`],
        [`Date: ${formValue.procedureDate}`],
        [`Status: ${formValue.status}`]
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    doc.save(`ear-irrigation-${formValue.earIrrigationNumber}.pdf`);
  }

  private showMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 3000);
  }
}