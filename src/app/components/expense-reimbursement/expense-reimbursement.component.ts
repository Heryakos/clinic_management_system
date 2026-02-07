import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement, ExpenseReimbursementDetail } from 'src/app/models/medical.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-expense-reimbursement',
  templateUrl: './expense-reimbursement.component.html',
  styleUrls: ['./expense-reimbursement.component.css']
})
export class ExpenseReimbursementComponent implements OnInit {
  expenseReimbursements: ExpenseReimbursement[] = [];
  filteredReimbursements: ExpenseReimbursement[] = [];
  searchTerm: string = '';
  showDetailsModal: boolean = false;
  selectedReimbursement: ExpenseReimbursement | null = null;
  investigations: ExpenseReimbursementDetail[] = [];
  documents: any[] = [];
  pendingStatusUpdate: { id: number, detailId?: number, status: string } | null = null;
  showCommentDialog: boolean = false;
  statusComment: string = '';
  isLoading: boolean = true;

  // Document preview properties
  pdfPreviewUrls: { [documentId: number]: SafeResourceUrl } = {};
  pdfLoadErrors: { [documentId: number]: string } = {};
  pdfLoading: { [documentId: number]: boolean } = {};
  pdfRetryCount: { [documentId: number]: number } = {};

  constructor(
    public medicalService: MedicalService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadExpenseReimbursements();
  }

  loadExpenseReimbursements(): void {
    this.isLoading = true;
    this.medicalService.getExpenseReimbursements().subscribe(
      (reimbursements) => {
        console.log('Raw API Response:', reimbursements);

        // Map and normalize
        const mapped = (reimbursements as any[]).map((r: any) => ({
          reimbursementID: r.reimbursementID || r.ReimbursementID,
          reimbursementNumber: r.reimbursementNumber || r.ReimbursementNumber,
          patientName: r.patientName || r.PatientName,
          employeeID: r.employeeID || r.EmployeeID,
          payrollNo: r.payrollNumber || r.PayrollNumber,
          payrollNumber: r.payrollNumber || r.PayrollNumber,
          department: r.department || r.Department,
          totalAmount: r.totalAmount || r.TotalAmount || 0,
          approvedAmount: r.approvedAmount || r.ApprovedAmount || 0,
          status: r.status || r.Status || 'Pending',
          submissionDate: this.parseDate(r.submissionDate || r.SubmissionDate),
          approvedBy: r.approvedBy || r.ApprovedBy,
          approvedDate: this.parseDate(r.approvedDate || r.ApprovedDate),
          paidDate: this.parseDate(r.paidDate || r.PaidDate),
          comments: r.comments || r.Comments,
          createdBy: r.createdBy || r.CreatedBy,
          orderedFrom: r.orderedFrom || r.OrderedFrom || null,
          doneAt: r.doneAt || r.DoneAt || null,
          investigation: r.investigation || r.Investigation || null,
          formType: r.formType || r.FormType || null,
          investigations: []
        }));

        // DE-DUPLICATE by reimbursementID
        const uniqueMap = new Map<number, any>();
        mapped.forEach(item => {
          if (item.reimbursementID) {
            uniqueMap.set(item.reimbursementID, item);
          }
        });

        this.expenseReimbursements = Array.from(uniqueMap.values());
        this.filteredReimbursements = [...this.expenseReimbursements];

        console.log('De-duplicated reimbursements:', this.expenseReimbursements);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading reimbursements:', error);
        this.showErrorMessage('Failed to load reimbursements');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  filterReimbursements(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredReimbursements = [...this.expenseReimbursements];
      return;
    }

    this.filteredReimbursements = this.expenseReimbursements.filter(
      (r) =>
        (r.payrollNo?.toLowerCase().includes(term) ?? false) ||
        (r.patientName?.toLowerCase().includes(term) ?? false)
    );
  }

  viewDetails(reimbursement: ExpenseReimbursement): void {
    this.isLoading = true;
    if (!reimbursement || !reimbursement.reimbursementID || reimbursement.reimbursementID <= 0) {
      console.error('Invalid reimbursement');
      return;
    }

    this.selectedReimbursement = reimbursement;

    // Load REAL investigation details from ExpenseReimbursementDetails table
    this.medicalService.getInvestigationDetails(reimbursement.reimbursementID).subscribe(
      (details) => {
        this.investigations = details;
        console.log('Loaded investigations:', this.investigations);
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading investigations:', error);
        this.investigations = [];
      }
    );

    // Load documents separately (already working)
    this.fetchDocumentsForReimbursement(reimbursement.reimbursementID);

    this.showDetailsModal = true;
    this.isLoading = false;
    this.cdr.detectChanges();
  }
  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Fetch documents for the reimbursement
  private fetchDocumentsForReimbursement(reimbursementId: number): void {
    console.log('Fetching documents for reimbursement ID:', reimbursementId);
    this.medicalService.getDocumentsByReimbursementId(reimbursementId).subscribe({
      next: (documents: any[]) => {
        console.log('Documents loaded:', JSON.stringify(documents, null, 2));

        this.documents = documents.map(doc => ({
          DocumentID: doc.documentID || doc.DocumentID,
          DocumentDescription: doc.description || doc.Description || 'Document',
          FileName: doc.fileName || doc.FileName,
          FileType: doc.fileType || doc.FileType,
          FileSize: doc.fileSize || 0,  // ← Make sure it's FileSize (capital S)
          uploadDate: this.parseDate(doc.uploadDate || doc.UploadDate),
          UploadedBy: doc.uploadedBy || 'Unknown',
          previewType: this.getPreviewType(doc.fileType || doc.FileType, doc.fileName || doc.FileName),
          // ...
        }));

        // Load PDF previews asynchronously
        this.documents.forEach(doc => {
          if (doc.previewType === 'pdf') {
            this.pdfLoading[doc.DocumentID] = true;
            this.pdfRetryCount[doc.DocumentID] = 0;
            this.loadPdfPreview(doc);
          }
        });

        // Force layout recalculation
        this.forceScrollRecalculation();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.showErrorMessage('Error loading documents for this reimbursement.');
        this.documents = [];
      }
    });
  }
  retryPdfLoad(doc: any): void {
    const docId = doc.DocumentID;
    const retryCount = (this.pdfRetryCount[docId] || 0) + 1;
  
    if (retryCount > 3) {
      this.pdfLoadErrors[docId] = 'Max retry attempts reached';
      this.pdfLoading[docId] = false;
      this.cdr.detectChanges();
      return;
    }
  
    this.pdfRetryCount[docId] = retryCount;
    this.pdfLoading[docId] = true;
    this.pdfLoadErrors[docId] = '';
    this.cdr.detectChanges();
  
    this.loadPdfPreview(doc);
  }
  getPdfPreviewUrl(doc: any): SafeResourceUrl {
    const url = this.pdfPreviewUrls[doc.DocumentID];
    console.log(`Getting PDF preview URL for document ${doc.DocumentID}:`, url ? 'URL exists' : 'No URL found');
    return url || this.sanitizer.bypassSecurityTrustResourceUrl('');
  }
  // NEW: Load PDF preview for documents
  private async loadPdfPreview(doc: any): Promise<void> {
    try {
      const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.DocumentID);
      console.log('Fetching PDF from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Document is empty');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfPreviewUrls[doc.DocumentID] = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#view=FitH&toolbar=0&navpanes=0');
      this.pdfLoadErrors[doc.DocumentID] = '';
      console.log(`Successfully loaded PDF preview for document ${doc.DocumentID}`);
    } catch (error: any) {
      console.error(`Error loading PDF preview for document ${doc.DocumentID}:`, error);
      this.pdfLoadErrors[doc.DocumentID] = `Failed to load PDF: ${error.message}`;
    } finally {
      setTimeout(() => {
        this.pdfLoading[doc.DocumentID] = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  // NEW: Get investigation count by status
  getInvestigationCountByStatus(status: string): number {
    return this.investigations.filter(inv =>
      (inv.status || 'pending').toLowerCase() === status.toLowerCase()
    ).length;
  }

  // NEW: Get total approved amount
  getTotalApprovedAmount(): number {
    return this.investigations
      .filter(inv => (inv.status || 'pending').toLowerCase() === 'approved')
      .reduce((sum, inv) => sum + (inv.Amount || 0), 0);
  }

  get clinicForms(): any[] {
    return this.documents.filter(doc =>
      (doc.DocumentDescription || '').toLowerCase().includes('clinic') &&
      (doc.DocumentDescription || '').toLowerCase().includes('form')
    );
  }

  get supportingDocuments(): any[] {
    return this.documents.filter(doc => !this.isClinicForm(doc));
  }

  // Group supporting documents by Invoice Number (extracted from description)
  get groupedSupportingDocuments(): Map<string, any[]> {
    const map = new Map<string, any[]>();

    this.supportingDocuments.forEach(doc => {
      // Extract invoice number from description like "testservice - Invoice #testinvoice (123 ETB)"
      const match = (doc.DocumentDescription || '').match(/Invoice #([^ ]+)/i);
      const key = match ? match[1] : 'Other';

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(doc);
    });

    return map;
  }

  isClinicForm(doc: any): boolean {
    const desc = (doc.DocumentDescription || '').toLowerCase();
    return desc.includes('clinic') && desc.includes('form');
  }

  getPreviewType(fileType?: string, fileName?: string): 'pdf' | 'image' | 'office' | 'none' {
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lowerName)) return 'image';
    const isOfficeMime =
      lowerType.includes('officedocument') ||
      lowerType.includes('msword') ||
      lowerType.includes('vnd.ms-') ||
      lowerType.includes('word') ||
      lowerType.includes('excel') ||
      lowerType.includes('powerpoint');
    const isOfficeExt = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);
    if (isOfficeMime || isOfficeExt) return 'office';
    return 'none';
  }

  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReimbursement = null;
    this.investigations = [];
    this.documents = [];

    // Clean up blob URLs
    Object.values(this.pdfPreviewUrls).forEach(url => {
      if (typeof url === 'string') {
        window.URL.revokeObjectURL(url);
      }
    });

    this.pdfPreviewUrls = {};
    this.pdfLoadErrors = {};
    this.pdfLoading = {};
    this.pdfRetryCount = {};

    this.closeCommentDialog();
  }

  openStatusUpdateDialog(id: number, detailId: number | undefined, status: string): void {
    this.pendingStatusUpdate = { id, detailId, status };
    this.statusComment = '';
    this.showCommentDialog = true;
  }

  closeCommentDialog(): void {
    this.showCommentDialog = false;
    this.pendingStatusUpdate = null;
    this.statusComment = '';
  }
  getStatusClass(status: string | null | undefined): string {
    return (status || 'pending').toLowerCase();
  }

  getStatusDisplay(status: string | null | undefined): string {
    return status || 'Pending';
  }

  isPending(status: string | null | undefined): boolean {
    return (status || 'pending').toLowerCase() === 'pending';
  }

  updateReimbursementStatus(): void {
    if (!this.pendingStatusUpdate) {
      this.showErrorMessage('No status update pending.');
      return;
    }

    const { id, detailId, status } = this.pendingStatusUpdate;
    const commentToSend = this.statusComment.trim(); // Allow empty

    // Optional: You can still warn if empty, but don't block
    // if (!commentToSend) {
    //   this.showErrorMessage('Please provide a comment.');
    //   return;
    // }

    this.medicalService.updateReimbursementStatus(id, detailId, status, commentToSend).subscribe({
      next: () => {
        this.showSuccessMessage(
          detailId
            ? `Investigation ${status === 'approved' ? 'approved' : 'rejected'} successfully.`
            : `Reimbursement request ${status === 'approved' ? 'approved' : 'rejected'}.`
        );
        this.loadExpenseReimbursements();
        if (this.showDetailsModal && this.selectedReimbursement) {
          this.viewDetails(this.selectedReimbursement);
        }
        this.closeCommentDialog();
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        const msg = error.error?.Message || error.message || 'Update failed';
        this.showErrorMessage(`Failed: ${msg}`);
      }
    });
  }

  downloadDocument(doc: any): void {
    const documentId = doc?.DocumentID;
    const fileName = doc?.FileName || `Document_${documentId}`;

    if (!documentId) {
      console.error('No document ID found for document:', doc);
      this.showErrorMessage('No document found.');
      return;
    }

    console.log('Downloading document:', documentId, fileName);

    this.medicalService.downloadReimbursementDocument(documentId).subscribe(
      (blob: Blob) => {
        console.log('Blob received:', { size: blob.size, type: blob.type });

        if (blob.size === 0) {
          this.showErrorMessage('Downloaded file is empty. Please try again.');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);

        setTimeout(() => {
          a.click();
          console.log('Download link clicked');
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);

        this.showSuccessMessage(`Document downloaded: ${fileName}`);
      },
      (error) => {
        console.error('Error downloading document:', error);
        this.showErrorMessage('Error downloading document. Please try again.');
      }
    );
  }

  onReimbursementSubmitted(reimbursement: ExpenseReimbursement): void {
    this.medicalService.createExpenseReimbursement(reimbursement).subscribe(
      (response: any) => {
        this.loadExpenseReimbursements();
        this.showSuccessMessage(`Expense reimbursement created with ID ${response.ReimbursementID}`);
      },
      (error) => {
        console.error('Error submitting reimbursement:', error);
        this.showErrorMessage('Error submitting reimbursement. Please try again.');
      }
    );
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

  // NEW: Force scroll recalculation for modal
  private forceScrollRecalculation(): void {
    const modalBody = document.querySelector('.modal-body') as HTMLElement;
    if (modalBody) {
      modalBody.style.overflowY = 'hidden';
      void modalBody.offsetHeight;
      modalBody.style.overflowY = 'auto';
      modalBody.scrollTop = 0;
      console.log('Forced scroll recalculation for modal-body');
    } else {
      console.warn('Modal body not found for scroll recalculation');
    }
  }
}