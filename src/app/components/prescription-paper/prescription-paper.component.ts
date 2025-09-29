import { Component, Inject, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';
// import { AMIRI_FONT_BASE64 } from '../../..assets/fonts/amiri-font-base64';

@Component({
  selector: 'app-prescription-paper',
  templateUrl: './prescription-paper.component.html',
  styleUrls: ['./prescription-paper.component.css']
})
export class PrescriptionPaperComponent implements OnInit {
  @Input() cardNumber?: string;
  logoPath = ASSETS.LOGO;
  prescriptionForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<PrescriptionPaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cardNumber: string; medicationDetails: string; prescription: any; dialogTitle: string }
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.data.cardNumber) {
      this.loadPrescriptionData(this.data.cardNumber);
    }
  }

  initializeForm(): void {
    this.prescriptionForm = this.fb.group({
      FullName: [{ value: '', disabled: true }, Validators.required],
      gender: [{ value: '', disabled: true }, Validators.required],
      age: [{ value: null, disabled: true }, Validators.min(0)],
      Weight: [{ value: null, disabled: false }, Validators.min(0)],
      CardNumber: [{ value: '', disabled: true }, Validators.required],
      woreda: [{ value: '', disabled: false }],
      houseNo: [{ value: '', disabled: false }],
      phone: [{ value: '', disabled: false }, Validators.pattern('^[0-9+\\- ]*$')],
      MedicalHistory: [{ value: '', disabled: true }, Validators.required],
      MedicationDetails: [{ value: '', disabled: true }, Validators.required],
      MedicationName: [{ value: '', disabled: true }],
      PrescriberName: [{ value: '', disabled: true }, Validators.required],
      Status: [{ value: '', disabled: true }],
      PharmacistName: [{ value: '', disabled: true }],
      PrescriptionDate: [{ value: '', disabled: true }],
      TotalAmount: [{ value: null, disabled: true }, Validators.min(0)]
    });
  }

  loadPrescriptionData(cardNumber: string): void {
    if (!cardNumber) {
      this.errorMessage = 'No Card Number provided.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Try getPrescriptionsByCardNumber first
    this.medicalService.getPrescriptionsByCardNumber(cardNumber).subscribe(
      (response: any) => {
        console.log('Prescriptions response from getPrescriptionsByCardNumber:', response);
        this.processPrescriptionResponse(response);
      },
      error => {
        console.error('Error from getPrescriptionsByCardNumber:', error);
        // Fallback to getPrescriptionspayrollID
        this.medicalService.getPrescriptionspayrollID(cardNumber).subscribe(
          (payrollResponse: any) => {
            console.log('Prescriptions response from getPrescriptionspayrollID:', payrollResponse);
            this.processPrescriptionResponse(payrollResponse);
          },
          payrollError => {
            console.error('Error from getPrescriptionspayrollID:', payrollError);
            this.errorMessage = 'Failed to load prescription data: ' + (payrollError.error?.message || 'Please try again.');
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        );
      }
    );
  }

  private processPrescriptionResponse(response: any): void {
    let data: any;

    // Handle different response structures
    if (Array.isArray(response)) {
      // If response is an array, find matching prescription or use first
      data = response.find(p => p.prescriptionID === this.data.prescription?.prescriptionID) || response[0] || {};
    } else if (response?.data) {
      data = response.data;
    } else {
      // Assume single object response (e.g., from getPrescriptionspayrollID)
      data = response || {};
    }

    console.log('Processed prescription data:', data);

    // Normalize field names and ensure all fields are mapped
    const formData = {
      FullName: data.FullName || data.fullName || '',
      gender: data.gender || data.Gender || '',
      age: data.age || data.Age || null,
      Weight: data.Weight || data.weight || null,
      CardNumber: data.CardNumber || data.cardNumber || '',
      woreda: data.woreda || data.Woreda || '',
      houseNo: data.houseNo || data.HouseNo || '',
      phone: data.phone || data.Phone || '',
      MedicalHistory: data.MedicalHistory || data.medicalHistory || '',
      MedicationDetails: this.data.medicationDetails || data.MedicationDetails || data.medicationDetails || '',
      MedicationName: data.MedicationName || data.medicationName || '',
      PrescriberName: data.PrescriberName || data.prescriberName || '',
      Status: data.Status || data.status || '',
      PharmacistName: data.PharmacistName || data.pharmacistName || '',
      PrescriptionDate: data.PrescriptionDate ? new Date(data.PrescriptionDate).toISOString().split('T')[0] : '',
      TotalAmount: data.TotalAmount || data.totalAmount || null
    };

    console.log('Form data to patch:', formData);

    this.prescriptionForm.patchValue(formData);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    const fieldsToToggle = ['Weight', 'woreda', 'houseNo', 'phone'];
    fieldsToToggle.forEach(field => {
      if (this.isEditing) {
        this.prescriptionForm.get(field)?.enable();
      } else {
        this.prescriptionForm.get(field)?.disable();
      }
    });
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.prescriptionForm.valid) {
      this.isLoading = true;
      const formValue = this.prescriptionForm.getRawValue();
      const updateData = {
        CardNumber: this.data.cardNumber,
        Weight: formValue.Weight || null,
        woreda: formValue.woreda || null,
        houseNo: formValue.houseNo || null,
        phone: formValue.phone || null
      };

      this.medicalService.updatePrescription(updateData).subscribe(
        () => {
          this.isLoading = false;
          this.isEditing = false;
          this.toggleEditMode();
          this.errorMessage = 'Prescription updated successfully!';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.errorMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error => {
          this.errorMessage = 'Failed to update prescription: ' + (error.error?.message || 'Please try again.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
    } else {
      this.errorMessage = 'Please fill all required fields correctly.';
      this.cdr.detectChanges();
    }
  }

  printPrescription(): void {
    window.print();
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const formValue = this.prescriptionForm.getRawValue();
    const medicationDisplay = `${formValue.MedicationName ? formValue.MedicationName + ', ' : ''}${formValue.MedicationDetails || ''}`;

       // Add Amiri font to VFS
      //  doc.addFileToVFS('Amiri-Regular.ttf', AMIRI_FONT_BASE64);
      //  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      //  doc.setFont('Amiri', 'normal');

    doc.setFont('Amiri', 'normal');
    doc.setFontSize(14);
    doc.text('FEDERAL HOUSING CORPORATION MEDIUM CLINIC', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('TEL. 0118 553615', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(this.data.dialogTitle, 105, 40, { align: 'center' });

    doc.setFontSize(10);
    let y = 50;
    doc.text(`Patient's Full Name: ${formValue.FullName || ''}`, 20, y);
    doc.text(`Town/Region: ${formValue.woreda || ''}`, 20, y + 10);
    doc.text(`Woreda: ${formValue.woreda || ''}`, 80, y + 10);
    doc.text(`Kebele/House No: ${formValue.houseNo || ''}`, 20, y + 20);
    doc.text(`Tel No: ${formValue.phone || ''}`, 80, y + 20);
    doc.text(`Sex: ${formValue.gender || ''}`, 20, y + 30);
    doc.text(`Age: ${formValue.age || ''}`, 60, y + 30);
    doc.text(`Weight: ${formValue.Weight || ''}`, 90, y + 30);
    doc.text(`Card No: ${formValue.CardNumber || ''}`, 130, y + 30);
    doc.text(`Diagnosis: ${formValue.MedicalHistory || ''}`, 20, y + 40);

    y += 50;
    autoTable(doc, {
      startY: y,
      head: [['Rx', 'Medicine name, Strength, Dosage form, Dose, Frequency, Duration, Quality, How to use and other information', 'Price']],
      body: [
        ['', medicationDisplay, formValue.TotalAmount || ''],
        ['', '', ''],
        ['', '', ''],
        ['Total price', '', formValue.TotalAmount || '']
      ],
      theme: 'grid',
      styles: { fontSize: 8, font: 'Amiri' },
      headStyles: { fillColor: [200, 200, 200] },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 120 }, 2: { cellWidth: 30 } }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Prescriber's", 20, y);
    doc.text(`Full Name: ${formValue.PrescriberName || ''}`, 20, y + 10);
    doc.text('Qualification: ', 20, y + 20);
    doc.text('Registration: ', 20, y + 30);
    doc.text('Signature: ', 20, y + 40);
    doc.text(`Date: ${formValue.PrescriptionDate || ''}`, 20, y + 50);

    doc.text("Dispenser's", 110, y);
    doc.text(`Full Name: ${formValue.PharmacistName || ''}`, 110, y + 10);
    doc.text('Qualification: ', 110, y + 20);
    doc.text('Registration: ', 110, y + 30);
    doc.text('Signature: ', 110, y + 40);
    doc.text(`Date: ${formValue.PrescriptionDate || ''}`, 110, y + 50);

    doc.save(`${this.data.dialogTitle.toLowerCase().replace(' ', '-')}.pdf`);
  }
}