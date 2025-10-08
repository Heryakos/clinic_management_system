import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService, ReimbursementDocument } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ExpenseReimbursement } from 'src/app/models/medical.model';

@Component({
  selector: 'app-reimbursement-document-upload',
  templateUrl: './reimbursement-document-upload.component.html',
  styleUrls: ['./reimbursement-document-upload.component.css']
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
  investigations: { investigation: string, doneAt: string, orderedFrom: string, amount: number }[] = [];
  existingInvestigations: any[] = [];

  constructor(
    private fb: FormBuilder,
    public medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm(): void {
    this.uploadForm = this.fb.group({
      // reimbursementId: [''],
      formType: ['', Validators.required],
      description: ['', Validators.required],
      files: [null, Validators.required]
    });

    this.uploadForm.get('reimbursementId')?.valueChanges.subscribe(reimbursementId => {
      if (reimbursementId) {
        const idNum = parseInt(reimbursementId, 10);
        this.loadDocuments(idNum);
        this.loadInvestigations(idNum);
        this.checkReimbursementStatus(reimbursementId);
      }
    });

    this.uploadForm.get('formType')?.valueChanges.subscribe(formType => {
      if (formType === 'ClinicMedicalExpenseRefund') {
        this.uploadForm.get('description')?.setValue('Clinic Medical Expense Refund Form');
        this.uploadForm.get('description')?.disable();
      } else {
        this.uploadForm.get('description')?.enable();
        this.uploadForm.get('description')?.setValue('');
      }
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
          // this.loadReimbursements();
        } else {
          console.warn('No employee data found');
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
      }
    );
  }

  // loadReimbursements(): void {
  //   if (this.payrollNumber) {
  //     this.medicalService.getExpenseReimbursementsByPayrollNumber(this.payrollNumber).subscribe(
  //       (reimbursements: ExpenseReimbursement[]) => {
  //         this.reimbursements = reimbursements.filter(r => r.status !== 'paid');
  //         console.log('Loaded reimbursements:', this.reimbursements);
  //         // Auto-select the latest reimbursement (highest ID) for convenience
  //         if (this.reimbursements.length > 0) {
  //           const latest = this.reimbursements.reduce((a, b) => a.reimbursementID > b.reimbursementID ? a : b);
  //           this.uploadForm.patchValue({ reimbursementId: latest.reimbursementID.toString() });
  //         }
  //       },
  //       error => {
  //         console.error('Error loading reimbursements:', error);
  //       }
  //     );
  //   }
  // }

  loadInvestigations(reimbursementId: number): void {
    this.medicalService.getReimbursementDetails(reimbursementId).subscribe(
      details => {
        this.existingInvestigations = details;
      },
      error => console.error('Error loading investigations:', error)
    );
  }

  addInvestigation(): void {
    this.investigations.push({ investigation: '', doneAt: '', orderedFrom: '', amount: 0 });
  }

  removeInvestigation(index: number): void {
    if (this.investigations.length > 1) {
      this.investigations.splice(index, 1);
    }
  }

  checkReimbursementStatus(reimbursementId: string): void {
    const reimbursement = this.reimbursements.find(r => r.reimbursementID.toString() === reimbursementId);
    if (reimbursement && reimbursement.status === 'paid') {
      this.uploadForm.get('files')?.disable();
      alert('Cannot upload documents for a Paid reimbursement.');
    } else {
      this.uploadForm.get('files')?.enable();
    }
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
    if (this.uploadForm.valid && (this.uploadForm.get('formType')?.value === 'ClinicMedicalExpenseRefund' || this.selectedFiles.length > 0)) {
      this.isSubmitting = true;
      const formData = new FormData();
      let reimbursementIdStr = this.uploadForm.get('reimbursementId')?.value;
      let reimbursementId = reimbursementIdStr ? parseInt(reimbursementIdStr, 10) : NaN;

      // If no reimbursement selected, create a new one first
      if (!reimbursementIdStr || isNaN(reimbursementId)) {
        try {
          const totalAmount = this.investigations.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
          const reimbursementPayload: ExpenseReimbursement = {
            reimbursementID: 0,
            reimbursementNumber: `REIMB-${Date.now()}-${Math.floor(Math.random() * 1000)}`.substring(0, 50),
            patientName: this.employeeName || 'Unknown',
            employeeID: this.payrollNumber || null,
            payrollNumber: this.payrollNumber || null,
            payrollNo: this.payrollNumber || null,
            department: null,
            totalAmount: totalAmount,
            status: 'pending',
            submissionDate: new Date(),
            createdBy: this.createdBy || null,
            approvedBy: null,
            investigations: []
          };
          const created = await (await import('rxjs')).firstValueFrom(this.medicalService.createExpenseReimbursement(reimbursementPayload));
          reimbursementId = created.reimbursementID;
          reimbursementIdStr = String(reimbursementId);
          // Persist newly created ID into form so subsequent handlers use it
          this.uploadForm.patchValue({ reimbursementId: reimbursementIdStr });
        } catch (e) {
          this.isSubmitting = false;
          console.error('Error creating reimbursement:', e);
          alert('Error creating reimbursement before upload. Please try again.');
          return;
        }
      }

      formData.append('reimbursementId', reimbursementIdStr);
      formData.append('formType', this.uploadForm.get('formType')?.value);
      formData.append('description', this.uploadForm.get('description')?.value);
      formData.append('uploadedBy', this.createdBy || 'Unknown');

      if (this.uploadForm.get('formType')?.value === 'ClinicMedicalExpenseRefund') {
        try {
          const documents = await this.medicalService.getDocumentsByReimbursementId(reimbursementId).toPromise();
          if (!documents) {
            this.isSubmitting = false;
            alert('No documents found for this reimbursement.');
            return;
          }
          const defaultDoc = documents.find(doc => doc.description === 'Clinic Medical Expense Refund Form');
          if (defaultDoc) {
            this.selectedFiles = [new File([], defaultDoc.fileName, { type: defaultDoc.fileType })];
            formData.append('file', this.selectedFiles[0], defaultDoc.fileName);
          } else {
            this.isSubmitting = false;
            alert('No default Clinic Medical Expense Refund Form found for this reimbursement.');
            return;
          }
        } catch (error) {
          this.isSubmitting = false;
          console.error('Error fetching documents:', error);
          alert('Error fetching default document. Please try again.');
          return;
        }
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
          alert('Error uploading document. Please try again.');
        }
      );
    }
  }

  private addNewInvestigations(reimbursementId: number): void {
    if (this.investigations.length > 0) {
      this.investigations.forEach(async (inv) => {
        if (inv.investigation && inv.doneAt && inv.orderedFrom && inv.amount > 0) {
          const detail = {
            InvestigationType: inv.investigation,
            Location: inv.doneAt,
            OrderedFrom: inv.orderedFrom,
            InvoiceNumber: this.uploadForm.get('description')?.value || 'N/A',
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
    this.loadInvestigations(reimbursementId);
    alert('Document uploaded and investigations added successfully!');
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
    }
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
  }
}