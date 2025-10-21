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
  ) {}

  ngOnInit(): void {
    this.loadExpenseReimbursements();
  }

  loadExpenseReimbursements(): void {
    this.isLoading = true;
    this.medicalService.getExpenseReimbursements().subscribe(
      (reimbursements) => {
        console.log('API Response:', reimbursements);
        
        this.expenseReimbursements = (reimbursements as any[]).map((r: any) => ({
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
        
        this.filteredReimbursements = [...this.expenseReimbursements];
        console.log('Mapped reimbursements:', this.filteredReimbursements);

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
    const term = this.searchTerm.toLowerCase();
    this.filteredReimbursements = this.expenseReimbursements.filter(
      (r) =>
        r.payrollNo?.toLowerCase().includes(term) ||
        r.patientName.toLowerCase().includes(term)
    );
  }

  viewDetails(reimbursement: ExpenseReimbursement): void {
    if (!reimbursement || !reimbursement.reimbursementID || reimbursement.reimbursementID <= 0) {
      console.error('Invalid reimbursement object or missing reimbursementID:', reimbursement);
      this.showErrorMessage('Cannot view details: Invalid reimbursement ID.');
      return;
    }
  
    console.log('Viewing details for reimbursementID:', reimbursement.reimbursementID);
    this.selectedReimbursement = reimbursement;
  
    this.medicalService.getReimbursementDetails(reimbursement.reimbursementID).subscribe(
      (details: any[]) => {
        if (!details || details.length === 0) {
          console.warn('No details found for reimbursementID:', reimbursement.reimbursementID);
          this.showErrorMessage('No details found for this reimbursement.');
          return;
        }
  
        this.selectedReimbursement = {
          ...this.selectedReimbursement,
          ...details[0],
          approvedAmount: details[0].ApprovedAmount || 0
        };
  
        this.investigations = details.map((d) => ({
          DetailID: d.DetailID,
          InvestigationType: d.InvestigationType,
          Location: d.Location,
          OrderedFrom: d.OrderedFrom,
          InvoiceNumber: d.InvoiceNumber,
          Amount: d.DetailAmount || d.Amount,
          InvestigationDate: this.parseDate(d.InvestigationDate),
          status: d.DetailStatus || d.status,
          comments: d.DetailComments || d.comments,
          approvedBy: d.DetailApprovedBy || d.approvedBy,
          approvedDate: this.parseDate(d.DetailApprovedDate)
        }));
  
        // Fetch documents for the reimbursement
        this.fetchDocumentsForReimbursement(reimbursement.reimbursementID);
  
        this.showDetailsModal = true;
      },
      (error) => {
        console.error('Error loading details for reimbursementID:', reimbursement.reimbursementID, error);
        this.showErrorMessage('Error loading details. Please try again.');
      }
    );
  }

  // NEW: Fetch documents for the reimbursement
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
          uploadDate: this.parseDate(doc.uploadDate || doc.UploadDate),
          previewType: this.getPreviewType(doc.fileType || doc.FileType, doc.fileName || doc.FileName),
          previewUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
            `${this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID || doc.DocumentID)}#view=FitH&toolbar=0&navpanes=0`
          )
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

  // UPDATED: Enhanced status update method
  updateReimbursementStatus(): void {
    if (!this.pendingStatusUpdate || !this.statusComment.trim()) {
      this.showErrorMessage('Please provide a comment for the status update.');
      return;
    }

    const { id, detailId, status } = this.pendingStatusUpdate;
    
    this.medicalService.updateReimbursementStatus(id, detailId, status, this.statusComment).subscribe({
      next: () => {
        this.loadExpenseReimbursements();
        this.showSuccessMessage(`Status updated to ${status}.`);
        this.closeCommentDialog();
        
        // Refresh the details view if modal is open
        if (this.showDetailsModal && this.selectedReimbursement) {
          this.viewDetails(this.selectedReimbursement);
        }
      },
      error: (error: any) => {
        console.error('Error updating status:', error);
        this.showErrorMessage('Error updating status. Please try again.');
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