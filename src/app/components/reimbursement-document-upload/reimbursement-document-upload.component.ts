import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicalService, ReimbursementDocument } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
    { value: 'ClinicMedicalExpenseRefund', label: 'Clinic Medical Expense Refund' }
  ];
  investigations: { investigation: string, invoiceNumber: string, amount: number }[] = [];
  pdfFile: File | null = null;
  reimbursementId: number | null = null;
  selectedReimbursementId: number | null = null;
  pdfPreviewUrls: { [documentId: number]: SafeResourceUrl } = {};
  pdfLoadErrors: { [documentId: number]: string } = {};
  pdfLoading: { [documentId: number]: boolean } = {};
  pdfRetryCount: { [documentId: number]: number } = {};

  @ViewChild('pdfTemplate') pdfTemplate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    public medicalService: MedicalService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
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
      doneAt: [''],
      orderedFrom: ['']
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

    this.uploadForm.get('formType')?.setValue('ClinicMedicalExpenseRefund');
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe({
      next: (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.createdBy = employee.user_ID ?? null;
          this.employeeName = employee.en_name ?? 'Unknown';
          this.payrollNumber = employee.employee_Id ?? null;
          console.log('Loaded employee data:', { createdBy: this.createdBy, employeeName: this.employeeName, payrollNumber: this.payrollNumber });
          this.uploadForm.patchValue({
            payrollNumber: this.payrollNumber,
            patientName: this.employeeName
          });
          if (this.payrollNumber) {
            this.loadUserReimbursements(true);
          } else {
            console.error('No payroll number found for employee');
            this.showErrorMessage('Unable to load employee data.');
          }
        } else {
          console.warn('No employee data found for username:', environment.username);
          this.showErrorMessage('No employee data found.');
        }
      },
      error: (error) => {
        console.error('Error fetching employee data:', error);
        this.showErrorMessage('Failed to load employee data.');
      }
    });
  }

  loadUserReimbursements(autoSelectLatest: boolean = false): void {
    if (!this.payrollNumber) {
      console.error('Payroll number is not set');
      this.showErrorMessage('Payroll number not available. Please try again.');
      return;
    }
  
    this.medicalService.getExpenseReimbursementsByPayrollNumber(this.payrollNumber).subscribe({
      next: (reimbursements) => {
        this.reimbursements = reimbursements.filter(r => r.reimbursementID && r.reimbursementID > 0);
        console.log('Reimbursements loaded:', this.reimbursements);
        if (this.reimbursements.length === 0) {
          console.warn('No valid reimbursements found for payroll:', this.payrollNumber);
          this.showErrorMessage('No reimbursement requests found.');
          return;
        }
  
        if (autoSelectLatest) {
          const latest = [...this.reimbursements].sort((a, b) => (b.reimbursementID || 0) - (a.reimbursementID || 0))[0];
          this.selectedReimbursementId = latest.reimbursementID;
          console.log('Auto-selected reimbursement:', this.selectedReimbursementId);
          this.fetchDocumentsForSelected();
        }
      },
      error: (error) => {
        console.error('Error loading reimbursements:', error);
        this.showErrorMessage('Error loading your reimbursement requests.');
      }
    });
  }

  loadDocumentsForReimbursement(event: any): void {
    const reimbursementId = Number(event.target.value);
    console.log('Selected reimbursement ID:', reimbursementId); // Debug log
    if (reimbursementId) {
      this.selectedReimbursementId = reimbursementId;
      this.fetchDocumentsForSelected();
    } else {
      // Defer state updates to avoid change detection issues
      setTimeout(() => {
        this.uploadedDocuments = [];
        this.selectedReimbursementId = null;
        this.pdfPreviewUrls = {};
        this.pdfLoadErrors = {};
        this.pdfLoading = {};
        this.pdfRetryCount = {};
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private fetchDocumentsForSelected(): void {
    if (!this.selectedReimbursementId) {
      console.warn('No reimbursement selected for document fetch');
      return;
    }
    console.log('Fetching documents for reimbursement ID:', this.selectedReimbursementId);
    this.medicalService.getDocumentsByReimbursementId(this.selectedReimbursementId).subscribe({
      next: (documents: ReimbursementDocument[]) => {
        console.log('Documents loaded:', JSON.stringify(documents, null, 2)); // Log full object
        
        // Defer all state updates to avoid change detection issues
        setTimeout(() => {
          this.uploadedDocuments = documents;
          this.pdfPreviewUrls = {};
          this.pdfLoadErrors = {};
          this.pdfLoading = {};
          this.pdfRetryCount = {};
          
          // Load PDF previews asynchronously
          documents.forEach(doc => {
            console.log(`Processing document ${doc.documentID}: ${doc.fileName} (${doc.fileType})`);
            if (this.getPreviewType(doc.fileType, doc.fileName) === 'pdf') {
              console.log(`Loading PDF preview for document ${doc.documentID}`);
              this.pdfLoading[doc.documentID] = true;
              this.pdfRetryCount[doc.documentID] = 0;
              this.loadPdfPreview(doc);
            } else {
              console.log(`Document ${doc.documentID} is not a PDF, preview type: ${this.getPreviewType(doc.fileType, doc.fileName)}`);
            }
          });
          
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.showErrorMessage('Error loading documents for this reimbursement.');
      }
    });
  }

  private async loadPdfPreview(doc: ReimbursementDocument): Promise<void> {
    try {
      const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
      console.log('Fetching PDF from:', url); // Debug log
      
      // Remove credentials to avoid CORS issues with wildcard Access-Control-Allow-Origin
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
        // Removed credentials: 'include' to fix CORS issue
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status >= 500) {
          throw new Error('Server error');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const blob = await response.blob();
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('Document is empty');
      }
      
      // More flexible content type checking
      if (!blob.type.includes('pdf') && !doc.fileName.toLowerCase().endsWith('.pdf')) {
        console.warn(`Unexpected content type: ${blob.type} for document ${doc.fileName}`);
        // Don't throw error, just log warning as some servers might not set correct content type
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfPreviewUrls[doc.documentID] = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#view=FitH&toolbar=0&navpanes=0');
      this.pdfLoadErrors[doc.documentID] = '';
      
      console.log(`Successfully loaded PDF preview for document ${doc.documentID}`);
    } catch (error: any) {
      console.error(`Error loading PDF preview for document ${doc.documentID}:`, error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to load PDF preview';
      if (error.message.includes('CORS')) {
        errorMessage = 'Unable to load PDF due to security restrictions';
      } else if (error.message.includes('404')) {
        errorMessage = 'Document not found';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied to document';
      } else if (error.message.includes('Server error')) {
        errorMessage = 'Server error while loading document';
      } else if (error.message.includes('empty')) {
        errorMessage = 'Document appears to be empty';
      } else {
        errorMessage = `Failed to load PDF: ${error.message}`;
      }
      
      this.pdfLoadErrors[doc.documentID] = errorMessage;
    } finally {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.pdfLoading[doc.documentID] = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  retryPdfLoad(doc: ReimbursementDocument): void {
    const retryCount = this.pdfRetryCount[doc.documentID] || 0;
    if (retryCount < 3) {
      // Defer state updates to avoid change detection issues
      setTimeout(() => {
        this.pdfRetryCount[doc.documentID] = retryCount + 1;
        this.pdfLoading[doc.documentID] = true;
        this.pdfLoadErrors[doc.documentID] = '';
        this.cdr.detectChanges();
        this.loadPdfPreview(doc);
      }, 0);
    } else {
      this.showErrorMessage('Maximum retry attempts reached for this document.');
    }
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
    return this.investigations.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
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
      try {
        const formType = this.uploadForm.get('formType')?.value;
        const totalAmount = this.totalAmount;
  
        if (formType === 'ClinicMedicalExpenseRefund') {
          if (this.hasDuplicateInvoiceNumbers()) {
            this.showErrorMessage('Duplicate invoice numbers are not allowed within the same request.');
            this.isSubmitting = false;
            return;
          }
          const hasValidInvestigations = this.investigations.some(inv => 
            inv.investigation && inv.invoiceNumber && inv.amount > 0
          );
          if (!hasValidInvestigations) {
            this.showErrorMessage('Please add at least one valid investigation.');
            this.isSubmitting = false;
            return;
          }
        }
  
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
          formType: formType,
          approvedAmount: 0
        };
  
        const created = await firstValueFrom(this.medicalService.createExpenseReimbursement(reimbursementPayload));
        this.reimbursementId = created.reimbursementID;
  
        if (this.reimbursementId === null) {
          throw new Error('Failed to create reimbursement: reimbursement ID is null');
        }
  
        if (formType === 'ClinicMedicalExpenseRefund' && this.investigations.length > 0) {
          for (const inv of this.investigations) {
            if (inv.investigation && inv.invoiceNumber && inv.amount > 0) {
              const detail = {
                InvestigationType: inv.investigation,
                Location: this.uploadForm.get('doneAt')?.value,
                OrderedFrom: this.uploadForm.get('orderedFrom')?.value,
                InvoiceNumber: inv.invoiceNumber,
                Amount: inv.amount,
                InvestigationDate: new Date()
              };
              await firstValueFrom(this.medicalService.addReimbursementDetail(this.reimbursementId, detail));
            }
          }
        }
  
        const formData = new FormData();
        formData.append('reimbursementId', this.reimbursementId.toString());
        formData.append('description', this.uploadForm.get('description')?.value);
        formData.append('uploadedBy', this.employeeName || 'Unknown');
        formData.append('createdBy', this.createdBy || '');
  
        if (formType === 'ClinicMedicalExpenseRefund') {
          this.pdfFile = await this.generatePDF();
          formData.append('file', this.pdfFile, this.pdfFile.name);
        } else {
          this.selectedFiles.forEach(file => {
            formData.append('file', file, file.name);
          });
        }
  
        await firstValueFrom(this.medicalService.uploadReimbursementDocument(formData));
  
        this.showSuccessMessage('Reimbursement request created successfully!');
        this.loadUserReimbursements(true);
        this.showDocumentsModal = true;
        this.selectedReimbursementId = this.reimbursementId;
        this.fetchDocumentsForSelected();
        this.resetForm();
      } catch (error: any) {
        console.error('Error submitting reimbursement:', error);
        this.showErrorMessage(`Error creating reimbursement: ${error.message || 'Please try again.'}`);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      this.showErrorMessage('Please fill all required fields correctly.');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.uploadForm.controls).forEach(key => {
      const control = this.uploadForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.uploadForm.reset();
    this.selectedFiles = [];
    this.investigations = [{ investigation: '', invoiceNumber: '', amount: 0 }];
    this.reimbursementId = null;
    this.uploadForm.patchValue({
      payrollNumber: this.payrollNumber,
      patientName: this.employeeName,
      formType: 'ClinicMedicalExpenseRefund'
    });
  }

  showDocuments(): void {
    this.showDocumentsModal = true;
    this.loadUserReimbursements(true);
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
    this.uploadedDocuments = [];
    this.selectedReimbursementId = null;
    
    // Clean up blob URLs before clearing
    Object.values(this.pdfPreviewUrls).forEach(url => {
      if (typeof url === 'string') {
        window.URL.revokeObjectURL(url);
      }
    });
    
    this.pdfPreviewUrls = {};
    this.pdfLoadErrors = {};
    this.pdfLoading = {};
    this.pdfRetryCount = {};
  }

  getPreviewType(fileType: string, fileName: string): 'pdf' | 'image' | 'office' | 'none' {
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lowerName)) return 'image';
    const isOfficeMime = lowerType.includes('officedocument') || 
                        lowerType.includes('msword') || 
                        lowerType.includes('vnd.ms-') ||
                        lowerType.includes('word') ||
                        lowerType.includes('excel') ||
                        lowerType.includes('powerpoint');
    const isOfficeExt = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);
    if (isOfficeMime || isOfficeExt) return 'office';
    return 'none';
  }

  downloadDocument(doc: ReimbursementDocument): void {
    console.log('Downloading document:', doc.documentID); // Debug log
    this.medicalService.downloadReimbursementDocument(doc.documentID).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showSuccessMessage(`Document downloaded: ${doc.fileName}`);
      },
      (error) => {
        console.error('Error downloading document:', error);
        this.showErrorMessage('Error downloading document. Please try again.');
      }
    );
  }

  getDocumentPreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getOfficePreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const documentUrl = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
    const officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(officeOnlineUrl);
  }

  getPdfPreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const url = this.pdfPreviewUrls[doc.documentID];
    console.log(`Getting PDF preview URL for document ${doc.documentID}:`, url ? 'URL exists' : 'No URL found');
    return url || this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  onPdfLoad(doc: ReimbursementDocument): void {
    console.log(`PDF loaded for document ${doc.documentID}`); // Debug log
    // Defer state updates to avoid change detection issues
    setTimeout(() => {
      this.pdfLoadErrors[doc.documentID] = '';
      this.pdfLoading[doc.documentID] = false;
      this.cdr.detectChanges();
    }, 0);
  }

  onPdfError(doc: ReimbursementDocument, event: Event): void {
    console.error(`Error loading PDF for document ${doc.documentID}:`, event); // Debug log
    // Defer state updates to avoid change detection issues
    setTimeout(() => {
      this.pdfLoadErrors[doc.documentID] = 'Unable to load PDF preview';
      this.pdfLoading[doc.documentID] = false;
      this.cdr.detectChanges();
    }, 0);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generatePDF(): Promise<File> {
    const element = this.pdfTemplate.nativeElement;
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.backgroundColor = '#ffffff';
    await new Promise(resolve => setTimeout(resolve, 500));
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      windowHeight: 1123
    });
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

  onImageLoad(event: Event): void {
    console.log('Image loaded successfully'); // Debug log
  }

  onImageError(event: Event): void {
    console.error('Error loading image'); // Debug log
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const container = img.parentElement;
    if (container) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'image-error';
      errorMessage.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #6c757d;">
          <p>⚠️ Unable to load image preview</p>
          <button class="download-btn" onclick="this.closest('.document-card').querySelector('.download-btn').click()">
            <span class="download-icon">↓</span> Download Instead
          </button>
        </div>
      `;
      container.appendChild(errorMessage);
    }
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

  private hasDuplicateInvoiceNumbers(): boolean {
    const seen = new Set<string>();
    for (const inv of this.investigations) {
      const normalized = (inv.invoiceNumber || '').toString().trim().toUpperCase();
      if (!normalized) continue;
      if (seen.has(normalized)) return true;
      seen.add(normalized);
    }
    return false;
  }
}
