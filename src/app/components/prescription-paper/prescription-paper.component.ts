import { Component, Inject, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';
import { FontService } from '../../services/FontService.service';

@Component({
  selector: 'app-prescription-paper',
  templateUrl: './prescription-paper.component.html',
  styleUrls: ['./prescription-paper.component.css']
})
export class PrescriptionPaperComponent implements OnInit {
  @Input() cardNumber?: string;
  logoPath = ASSETS.LOGO;
  prescriptionForm!: FormGroup;
  medications: any[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<PrescriptionPaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cardNumber: string; medicationDetails: string; prescription: any; dialogTitle: string },
    private fontService: FontService
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

    this.medicalService.getPrescriptionsByCardNumber(cardNumber).subscribe(
      (response: any) => {
        console.log('Prescriptions response from getPrescriptionsByCardNumber:', response);
        this.processPrescriptionResponse(response);
      },
      error => {
        console.error('Error from getPrescriptionsByCardNumber:', error);
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
    let prescriptions = Array.isArray(response) ? response : [response];
    
    if (this.data.prescription?.prescriptionID) {
      const responseHasIds = prescriptions.some(p => 'prescriptionID' in p || 'PrescriptionID' in p);
      if (responseHasIds) {
        const targetId = this.data.prescription.prescriptionID;
        const filteredById = prescriptions.filter(p => p.prescriptionID === targetId || p.PrescriptionID === targetId);
        if (filteredById.length > 0) {
          prescriptions = filteredById;
        }
      }
    }
    
    if (this.data.medicationDetails && typeof this.data.medicationDetails === 'string') {
      const selectedNames = new Set(
        this.data.medicationDetails
          .split(',')
          .map(entry => entry.trim())
          .filter(entry => entry.length > 0)
          .map(entry => (entry.includes(' - ') ? entry.split(' - ')[0]?.trim() : entry))
      );
      if (selectedNames.size > 0) {
        const filteredByMed = prescriptions.filter(p => {
          const medName = (p.MedicationName || p.medicationName || '').toString().trim();
          return medName && selectedNames.has(medName);
        });
        if (filteredByMed.length > 0) {
          prescriptions = filteredByMed;
        }
      }
    }

    if ((!prescriptions || prescriptions.length === 0) && response) {
      prescriptions = Array.isArray(response) ? response : [response];
    }

    this.medications = prescriptions;

    if (this.medications.length > 0) {
      const common = this.medications[0];
      
      const formData = {
        FullName: common.FullName || common.fullName || '',
        gender: common.gender || common.Gender || '',
        age: common.age || common.Age || null,
        Weight: common.Weight || common.weight || null,
        CardNumber: common.CardNumber || common.cardNumber || '',
        woreda: common.woreda || common.Woreda || '',
        houseNo: common.houseNo || common.HouseNo || '',
        phone: common.phone || common.Phone || '',
        MedicalHistory: common.MedicalHistory || common.medicalHistory || '',
        PrescriberName: common.PrescriberName || common.prescriberName || '',
        Status: common.Status || common.status || '',
        PharmacistName: common.PharmacistName || common.pharmacistName || '',
        PrescriptionDate: common.PrescriptionDate ? new Date(common.PrescriptionDate).toISOString().split('T')[0] : '',
        TotalAmount: common.TotalAmount || common.totalAmount || this.calculateTotal()
      };

      this.prescriptionForm.patchValue(formData);
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  calculateTotal(): number {
    return this.medications.reduce((sum, med) => {
      const price = (med.UnitPrice || med.unitPrice || 0);
      const qty = (med.Quantity || med.quantity || 1);
      return sum + (price * qty);
    }, 0);
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
    // Load font async - using the same pattern as your working injection component
    this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
      if (!fontBase64) {
        console.error('Font loading failed; falling back to default font.');
        this.generatePDFWithoutCustomFont();
        return;
      }
  
      const doc = new jsPDF();
      const formValue = this.prescriptionForm.getRawValue();
  
      // Add custom font for Amharic support - EXACTLY like your working injection component
      const fontName = 'AbyssinicaSIL-Regular.ttf';
      const fontFamily = 'AbyssinicaSIL';
  
      doc.addFileToVFS(fontName, fontBase64);
      doc.addFont(fontName, fontFamily, 'normal');
      doc.setFont(fontFamily);
  
      // Use the CORRECT text method format for your jsPDF version
      // For centered text, we'll use a different approach
      doc.setFontSize(14);
      const clinicText = 'FEDERAL HOUSING CORPORATION MEDIUM CLINIC';
      const clinicWidth = doc.getTextWidth(clinicText);
      doc.text(clinicText, (210 - clinicWidth) / 2, 20); // Center horizontally on A4 (210mm wide)
      
      doc.setFontSize(10);
      const telText = 'TEL. 0118 553615';
      const telWidth = doc.getTextWidth(telText);
      doc.text(telText, (210 - telWidth) / 2, 30);
      
      doc.setFontSize(12);
      const titleText = this.data.dialogTitle || 'Prescription';
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (210 - titleWidth) / 2, 40);
  
      // PATIENT INFORMATION - Use simple text calls
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
  
      // MEDICATIONS TABLE
      let tableBody: any[][] = this.medications.map(med => [
        'Rx',
        `${med.MedicationName || ''}`,
        `${med.Strength || ''}`,
        `${med.DosageForm || ''}`,
        `${med.Dose || ''}`,
        `${med.Frequency || ''}`,
        `${med.Duration || ''}`,
        `${med.Quantity || ''}`,
        `${med.Instructions || ''}`,
        med.UnitPrice != null ? `${(med.UnitPrice * (med.Quantity || 1))}` : ''
      ]);
  
      // Add empty rows if needed
      while (tableBody.length < 3) {
        tableBody.push(['', '', '', '', '', '', '', '', '', '']);
      }
  
      const total = formValue.TotalAmount || this.calculateTotal();
      tableBody.push(['Total price', '', '', '', '', '', '', '', '', `${total}`]);
  
      // Create table with custom font
      autoTable(doc, {
        startY: y,
        head: [[
          'Rx',
          'Medicine name',
          'Strength',
          'Dosage form',
          'Dose',
          'Frequency',
          'Duration',
          'Quantity',
          'How to use and other information',
          'Price'
        ]],
        body: tableBody,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          font: fontFamily // Apply custom font to table
        },
        headStyles: { 
          fillColor: [200, 200, 200],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 },
          8: { cellWidth: 40 },
          9: { cellWidth: 20, halign: 'center' }
        }
      });
  
      // SIGNATURES SECTION
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
  
      doc.save(`${this.data.dialogTitle?.toLowerCase().replace(' ', '-') || 'prescription'}.pdf`);
    });
  }
  
  // Fallback method without custom font
  private generatePDFWithoutCustomFont(): void {
    const doc = new jsPDF();
    const formValue = this.prescriptionForm.getRawValue();
  
    // Use standard font
    doc.setFont('helvetica');
  
    // HEADER - Manual centering
    doc.setFontSize(14);
    const clinicText = 'FEDERAL HOUSING CORPORATION MEDIUM CLINIC';
    const clinicWidth = doc.getTextWidth(clinicText);
    doc.text(clinicText, (210 - clinicWidth) / 2, 20);
    
    doc.setFontSize(10);
    const telText = 'TEL. 0118 553615';
    const telWidth = doc.getTextWidth(telText);
    doc.text(telText, (210 - telWidth) / 2, 30);
    
    doc.setFontSize(12);
    const titleText = this.data.dialogTitle || 'Prescription';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (210 - titleWidth) / 2, 40);
  
    // PATIENT INFORMATION
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
  
    // MEDICATIONS TABLE
    let tableBody: any[][] = this.medications.map(med => [
      'Rx',
      `${med.MedicationName || ''}`,
      `${med.Strength || ''}`,
      `${med.DosageForm || ''}`,
      `${med.Dose || ''}`,
      `${med.Frequency || ''}`,
      `${med.Duration || ''}`,
      `${med.Quantity || ''}`,
      `${med.Instructions || ''}`,
      med.UnitPrice != null ? `${(med.UnitPrice * (med.Quantity || 1))}` : ''
    ]);
  
    while (tableBody.length < 3) {
      tableBody.push(['', '', '', '', '', '', '', '', '', '']);
    }
  
    const total = formValue.TotalAmount || this.calculateTotal();
    tableBody.push(['Total price', '', '', '', '', '', '', '', '', `${total}`]);
  
    autoTable(doc, {
      startY: y,
      head: [[
        'Rx',
        'Medicine name',
        'Strength',
        'Dosage form',
        'Dose',
        'Frequency',
        'Duration',
        'Quantity',
        'How to use and other information',
        'Price'
      ]],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 200, 200] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 40 },
        9: { cellWidth: 20, halign: 'center' }
      }
    });
  
    // SIGNATURES SECTION
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
  
    doc.save(`${this.data.dialogTitle?.toLowerCase().replace(' ', '-') || 'prescription'}-standard.pdf`);
  }
}