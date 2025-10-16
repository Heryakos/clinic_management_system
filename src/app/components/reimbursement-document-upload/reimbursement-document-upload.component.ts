import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicalService, ReimbursementDocument } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reimbursement-document-upload',
  templateUrl: './reimbursement-document-upload.component.html',
  styleUrls: ['./reimbursement-document-upload.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ]
})
export class ReimbursementDocumentUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  reimbursements: ExpenseReimbursement[] = [];
  uploadedDocuments: ReimbursementDocument[] = [];
  selectedFiles: File[] = [];
  isSubmitting = false;
  showDocumentsModal = false;
  createdBy: string | null = null;
  employeeName: string | null = null;
  payrollNumber: string | null = null;
  formTypes = [
    { value: 'ClinicMedicalExpenseRefund', label: 'Clinic Medical Expense Refund' },
    { value: 'Other', label: 'Other' }
  ];
  investigations: { investigation: string, invoiceNumber: string, amount: number }[] = [];
  existingInvestigations: any[] = [];
  
  // Added missing properties
  pdfFile: File | null = null;
  reimbursementId: number | null = null;
  
  @ViewChild('pdfTemplate') pdfTemplate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    public medicalService: MedicalService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.addInvestigation();
  }

  initializeForm(): void {
    this.uploadForm = this.fb.group({
      formType: ['', Validators.required],
      description: ['', Validators.required],
      files: [null],
      patientName: ['', Validators.required],
      payrollNumber: ['', Validators.required],
      department: ['', Validators.required],
      doneAt: ['', Validators.required],
      orderedFrom: ['', Validators.required]
    });

    this.uploadForm.get('formType')?.valueChanges.subscribe(formType => {
      if (formType === 'ClinicMedicalExpenseRefund') {
        this.uploadForm.get('description')?.setValue('Clinic Medical Expense Refund Form');
        this.uploadForm.get('description')?.disable();
        this.uploadForm.get('files')?.clearValidators();
        this.uploadForm.get('patientName')?.enable();
        this.uploadForm.get('payrollNumber')?.enable();
        this.uploadForm.get('department')?.enable();
        this.uploadForm.get('doneAt')?.enable();
        this.uploadForm.get('orderedFrom')?.enable();
      } else {
        this.uploadForm.get('description')?.enable();
        this.uploadForm.get('description')?.setValue('');
        this.uploadForm.get('files')?.setValidators([Validators.required]);
        this.uploadForm.get('patientName')?.disable();
        this.uploadForm.get('payrollNumber')?.disable();
        this.uploadForm.get('department')?.disable();
        this.uploadForm.get('doneAt')?.disable();
        this.uploadForm.get('orderedFrom')?.disable();
      }
      this.uploadForm.get('files')?.updateValueAndValidity();
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.createdBy = employee.user_ID ?? null;
          this.employeeName = employee.en_name ?? 'Unknown';
          this.payrollNumber = employee.employee_Id ?? 'Unknown';
          this.uploadForm.patchValue({ payrollNumber: this.payrollNumber });
        } else {
          console.warn('No employee data found');
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
      }
    );
  }

  addInvestigation(): void {
    this.investigations.push({ investigation: '', invoiceNumber: '', amount: 0 });
  }

  removeInvestigation(index: number): void {
    if (this.investigations.length > 1) {
      this.investigations.splice(index, 1);
    }
  }

  get totalAmount(): number {
    return this.investigations.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      this.uploadForm.patchValue({ files: this.selectedFiles });
      this.uploadForm.get('files')?.updateValueAndValidity();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.uploadForm.valid) {
      this.isSubmitting = true;
      const formData = new FormData();
      let reimbursementIdStr = this.uploadForm.get('reimbursementId')?.value;
      let reimbursementId = reimbursementIdStr ? parseInt(reimbursementIdStr, 10) : NaN;

      const formType = this.uploadForm.get('formType')?.value;

      // If no reimbursement selected, create a new one first
      if (!reimbursementIdStr || isNaN(reimbursementId)) {
        try {
          const totalAmount = formType === 'ClinicMedicalExpenseRefund' ? this.totalAmount : this.investigations.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
          const reimbursementPayload: ExpenseReimbursement = {
            reimbursementID: 0,
            reimbursementNumber: `REIMB-${Date.now()}-${Math.floor(Math.random() * 1000)}`.substring(0, 50),
            patientName: this.uploadForm.get('patientName')?.value || this.employeeName || 'Unknown',
            employeeID: this.payrollNumber || null,
            payrollNumber: this.uploadForm.get('payrollNumber')?.value || this.payrollNumber || null,
            payrollNo: this.uploadForm.get('payrollNumber')?.value || this.payrollNumber || null,
            department: this.uploadForm.get('department')?.value || null,
            totalAmount: totalAmount,
            status: 'pending',
            submissionDate: new Date(),
            createdBy: this.createdBy || null,
            approvedBy: null,
            investigations: [],
            orderedFrom: this.uploadForm.get('orderedFrom')?.value,
            doneAt: this.uploadForm.get('doneAt')?.value,
            investigation: this.investigations.map(inv => inv.investigation).join(', '),
            formType: formType
          };
          const created = await firstValueFrom(this.medicalService.createExpenseReimbursement(reimbursementPayload));
          reimbursementId = created.reimbursementID;
          this.reimbursementId = reimbursementId; // Set the component property
          reimbursementIdStr = String(reimbursementId);
          this.uploadForm.patchValue({ reimbursementId: reimbursementIdStr });
        } catch (e) {
          this.isSubmitting = false;
          console.error('Error creating reimbursement:', e);
          this.showErrorMessage(`Error creating reimbursement before upload. Please try again.`);
          return;
        }
      }

      formData.append('reimbursementId', reimbursementIdStr);
      formData.append('description', this.uploadForm.get('description')?.value);
      formData.append('uploadedBy', this.createdBy || 'Unknown');

      if (formType === 'ClinicMedicalExpenseRefund') {
        // Generate PDF
        this.pdfFile = await this.generatePDF();
        formData.append('file', this.pdfFile, this.pdfFile.name);
      } else {
        this.selectedFiles.forEach(file => {
          formData.append('file', file, file.name);
        });
      }

      this.medicalService.uploadReimbursementDocument(formData).subscribe(
        response => {
          // After upload, add new investigations if any
          this.addNewInvestigations(reimbursementId);
        },
        error => {
          this.isSubmitting = false;
          console.error('Error uploading document:', error);
          this.showErrorMessage(`Error uploading document. Please try again.`);
        }
      );
    }
  }

  private addNewInvestigations(reimbursementId: number): void {
    if (this.investigations.length > 0) {
      this.investigations.forEach(async (inv) => {
        if (inv.investigation && inv.invoiceNumber && inv.amount > 0) {
          const detail = {
            InvestigationType: inv.investigation,
            Location: this.uploadForm.get('doneAt')?.value,
            OrderedFrom: this.uploadForm.get('orderedFrom')?.value,
            InvoiceNumber: inv.invoiceNumber,
            Amount: inv.amount,
            InvestigationDate: new Date()
          };
          await this.medicalService.addReimbursementDetail(reimbursementId, detail).toPromise();
        }
      });
    }
    this.isSubmitting = false;
    this.uploadForm.reset();
    this.selectedFiles = [];
    this.investigations = [];
    this.loadDocuments(reimbursementId);
    // Removed the non-existent loadInvestigations call
    this.showErrorMessage(`Document uploaded and investigations added successfully!`);
  }

  loadDocuments(reimbursementId: number): void {
    if (reimbursementId) {
      this.medicalService.getDocumentsByReimbursementId(reimbursementId).subscribe(
        (documents: ReimbursementDocument[]) => {
          this.uploadedDocuments = documents;
        },
        error => {
          console.error('Error loading documents:', error);
        }
      );
    }
  }

  showDocuments(): void {
    const reimbursementIdStr = this.uploadForm.get('reimbursementId')?.value;
    if (reimbursementIdStr) {
      const reimbursementId = parseInt(reimbursementIdStr, 10);
      this.loadDocuments(reimbursementId);
      this.showDocumentsModal = true;
    } else {
      this.showErrorMessage(`Please create a reimbursement first or select an existing one.`);
    }
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
  }

  async generatePDF(): Promise<File> {
    const element = this.pdfTemplate.nativeElement;
    
    // Make sure the element is visible for rendering
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    
    // Wait for styles to load
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Ensure styles are applied in the cloned document
        const clonedElement = clonedDoc.getElementById('pdf-template');
        if (clonedElement) {
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
        }
      }
    });
  
    // Hide the element again
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
  
    const imgData = canvas.toDataURL('image/png');
  
    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], `Clinic_Medical_Expense_Form_${this.reimbursementId || 'temp'}.pdf`, { 
      type: 'application/pdf' 
    });
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