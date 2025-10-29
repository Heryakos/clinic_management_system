import { Component, Inject, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ASSETS } from '../../assets.config';
import { FontService } from '../../services/FontService.service';

@Component({
  selector: 'app-injection-paper',
  templateUrl: './injection-paper.component.html',
  styleUrls: ['./injection-paper.component.css']
})
export class InjectionPaperComponent implements OnInit {
  @Input() injectionID?: number;
  logoPath = ASSETS.LOGO;
  injectionForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isEditing: boolean = false;
  injectionData: any = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<InjectionPaperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      injectionID: number; 
      patientID: number;  // ✅ patientID is now required
      dialogTitle: string 
    },
    private fontService: FontService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.data.injectionID && this.data.patientID) {
      this.loadInjectionData(this.data.injectionID, this.data.patientID);
    }
  }

  initializeForm(): void {
    this.injectionForm = this.fb.group({
      FullName: [{ value: '', disabled: true }],
      gender: [{ value: '', disabled: true }],
      age: [{ value: null, disabled: true }],
      Weight: [{ value: null, disabled: false }],
      CardNumber: [{ value: '', disabled: true }],
      woreda: [{ value: '', disabled: false }],
      houseNo: [{ value: '', disabled: false }],
      phone: [{ value: '', disabled: false }],
      MedicalHistory: [{ value: '', disabled: true }],
      injectionNumber: [{ value: '', disabled: true }],
      injectionDate: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      orderingPhysicianName: [{ value: '', disabled: true }],
      medicationName: [{ value: '', disabled: true }],
      strength: [{ value: '', disabled: true }],
      dosageForm: [{ value: '', disabled: true }],
      dose: [{ value: '', disabled: true }],
      route: [{ value: '', disabled: true }],
      site: [{ value: '', disabled: true }],
      frequency: [{ value: '', disabled: true }],
      duration: [{ value: '', disabled: true }],
      instructions: [{ value: '', disabled: true }],
      administeredByName: [{ value: '', disabled: true }],
      administeredDate: [{ value: '', disabled: true }],
      notes: [{ value: '', disabled: true }]
    });
  }

  // ✅ FIXED: patientID is now required
  loadInjectionData(injectionID: number, patientID: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    // First, try to get the specific injection details
    this.medicalService.getInjectionDetails(injectionID).subscribe(
      (injectionDetails: any) => {
        if (injectionDetails) {
          this.injectionData = injectionDetails;
          this.processInjectionResponse(injectionDetails);
        } else {
          // If no specific injection details found, fall back to patient injections
          this.loadPatientInjectionsFallback(patientID, injectionID);
        }
      },
      error => {
        // If getting specific injection fails, fall back to patient injections
        console.warn('Could not load specific injection, falling back to patient injections:', error);
        this.loadPatientInjectionsFallback(patientID, injectionID);
      }
    );
  }

  // ✅ FIXED: patientID is now required (not optional)
  private loadPatientInjectionsFallback(patientID: number, injectionID: number): void {
    this.medicalService.getPatientInjections(patientID).subscribe(
      (response: any) => {
        let injectionData = null;
        
        if (Array.isArray(response)) {
          // Find the specific injection by injectionID
          injectionData = response.find((inj: any) => inj.injectionID === injectionID);
        } else if (response && response.injectionID === injectionID) {
          injectionData = response;
        }

        if (injectionData) {
          this.injectionData = injectionData;
          this.processInjectionResponse(injectionData);
        } else {
          this.errorMessage = 'Injection not found for this patient.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error => {
        this.errorMessage = 'Failed to load injection data: ' + (error.error?.message || 'Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  private processInjectionResponse(data: any): void {
    const formData = {
      FullName: data.PatientName || '',
      gender: data.Sex || '',
      age: data.Age || null,
      Weight: data.Weight || null,
      CardNumber: data.CardNumber || '',
      woreda: data.Woreda || '',
      houseNo: data.KebeleHouseNo || '',
      phone: data.TelNo || '',
      MedicalHistory: data.Diagnosis || '',
  
      injectionNumber: data.InjectionNumber || '',
      injectionDate: data.InjectionDate ? new Date(data.InjectionDate).toISOString().split('T')[0] : '',
      status: data.Status || '',
      orderingPhysicianName: data.OrderingPhysicianName || '',
  
      medicationName: data.MedicationName || '',
      strength: data.Strength || '',
      dosageForm: data.DosageForm || '',
      dose: data.Dose || '',
      route: data.Route || '',
      site: data.Site || '',
      frequency: data.Frequency || '',
      duration: data.Duration || '',
      instructions: data.Instructions || '',
      notes: data.Notes || '',
  
      administeredByName: data.AdministeredByName || '',
      administeredDate: data.AdministeredDate ? new Date(data.AdministeredDate).toISOString().split('T')[0] : ''
    };
  
    this.injectionForm.patchValue(formData);
    this.isLoading = false;
    this.cdr.detectChanges();
  }
  

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    const fieldsToToggle = ['Weight', 'woreda', 'houseNo', 'phone'];
    fieldsToToggle.forEach(field => {
      if (this.isEditing) {
        this.injectionForm.get(field)?.enable();
      } else {
        this.injectionForm.get(field)?.disable();
      }
    });
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.injectionForm.valid && this.data.injectionID) {
      this.isLoading = true;
      const formValue = this.injectionForm.getRawValue();
      const updateData = {
        injectionID: this.data.injectionID,
        Weight: formValue.Weight || null,
        woreda: formValue.woreda || null,
        houseNo: formValue.houseNo || null,
        phone: formValue.phone || null
      };

      this.medicalService.updateInjection(updateData).subscribe(
        () => {
          this.isLoading = false;
          this.isEditing = false;
          this.toggleEditMode();
          this.errorMessage = 'Injection updated successfully!';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.errorMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error => {
          this.errorMessage = 'Failed to update injection: ' + (error.error?.message || 'Please try again.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
    } else {
      this.errorMessage = 'Please fill all required fields correctly.';
      this.cdr.detectChanges();
    }
  }

  printInjection(): void {
    window.print();
  }

  exportToPDF(): void {
    // Load font async
    this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
      if (!fontBase64) {
        console.error('Font loading failed; falling back to default font.');
        // You could generate PDF without custom font here if needed
        return;
      }

      const doc = new jsPDF();

      // Add custom font for Amharic (Ethiopic script) support
      const fontName = 'AbyssinicaSIL-Regular.ttf'; // Matches your font file name
      const fontFamily = 'AbyssinicaSIL'; // Custom family name

      doc.addFileToVFS(fontName, fontBase64);
      doc.addFont(fontName, fontFamily, 'normal');
      doc.setFont(fontFamily); // Set the custom font for the entire document to handle Amharic/Unicode

      // ... (rest of the PDF generation code remains unchanged: get formValue, add text, autoTable, signatures, doc.save)
      
      const formValue = this.injectionForm.getRawValue();

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
      doc.text(`Woreda: ${formValue.woreda || ''}`, 20, y + 20);
      doc.text(`Kebele/House No: ${formValue.houseNo || ''}`, 20, y + 30);
      doc.text(`Tel No: ${formValue.phone || ''}`, 20, y + 40);
      doc.text(`Sex: ${formValue.gender || ''}`, 20, y + 50);
      doc.text(`Age: ${formValue.age || ''}`, 60, y + 50);
      doc.text(`Weight: ${formValue.Weight || ''}`, 90, y + 50);
      doc.text(`Card No: ${formValue.CardNumber || ''}`, 130, y + 50);
      doc.text(`Diagnosis: ${formValue.MedicalHistory || ''}`, 20, y + 60);

      y += 70;
      autoTable(doc, {
        startY: y,
        head: [['Injection Details']],
        body: [
          [`Injection Number: ${formValue.injectionNumber || ''}`],
          [`Date: ${formValue.injectionDate || ''}`],
          [`Status: ${formValue.status || ''}`],
          [`Physician: ${formValue.orderingPhysicianName || ''}`],
          [`Medication: ${formValue.medicationName || ''} (${formValue.strength || ''} ${formValue.dosageForm || ''})`],
          [`Dose: ${formValue.dose || ''}`],
          [`Route: ${formValue.route || ''}`],
          [`Site: ${formValue.site || ''}`],
          [`Frequency: ${formValue.frequency || ''}`],
          [`Duration: ${formValue.duration || ''}`],
          [`Instructions: ${formValue.instructions || ''}`],
          [`Notes: ${formValue.notes || ''}`],
          [`Administered By: ${formValue.administeredByName || 'N/A'}`],
          [`Administered Date: ${formValue.administeredDate || 'N/A'}`]
        ],
        theme: 'grid',
        styles: { fontSize: 10, font: fontFamily } // Apply custom font to the table
      });

      y = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Physician's Signature: ____________________", 20, y);
      doc.text(`Date: ${formValue.injectionDate || ''}`, 20, y + 10);

      doc.text("Administered By: ____________________", 110, y);
      doc.text(`Date: ${formValue.administeredDate || ''}`, 110, y + 10);

      doc.save(`injection-${formValue.injectionNumber}.pdf`);
    });
  }
}