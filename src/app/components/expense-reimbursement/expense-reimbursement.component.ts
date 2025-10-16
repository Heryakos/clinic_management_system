import { Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  investigations: any[] = [];
  documents: any[] = [];
  
  // New properties for comment functionality
  showCommentDialog: boolean = false;
  pendingStatusUpdate: { id: number, status: string } | null = null;
  statusComment: string = '';

  constructor(public medicalService: MedicalService, private sanitizer: DomSanitizer, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadExpenseReimbursements();
  }

  loadExpenseReimbursements(): void {
    this.medicalService.getExpenseReimbursements().subscribe(
      reimbursements => {
        this.expenseReimbursements = (reimbursements as any[]).map((r: any) => ({
          ...r,
          submissionDate: this.parseDate((r as any).submissionDate || (r as any).SubmissionDate)
        }));
        this.filteredReimbursements = [...this.expenseReimbursements];
      },
      error => console.error('Error loading reimbursements:', error)
    );
  }

  filterReimbursements(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReimbursements = this.expenseReimbursements.filter(r =>
      r.payrollNo?.toLowerCase().includes(term) ||
      r.patientName.toLowerCase().includes(term)
    );
  }

  viewDetails(reimbursement: ExpenseReimbursement): void {
    this.selectedReimbursement = reimbursement;
  
    this.medicalService.getReimbursementDetails(reimbursement.reimbursementID).subscribe(
      (details: any[]) => {
        if (!details || details.length === 0) return;
  
        // ✅ Merge the first item into selectedReimbursement (so we get all new fields)
        this.selectedReimbursement = {
          ...this.selectedReimbursement,
          ...details[0]
        };
  
        // ✅ Extract investigation rows
        this.investigations = details.map(d => ({
          InvestigationType: d.InvestigationType,
          Location: d.Location,
          OrderedFrom: d.OrderedFrom,
          Amount: d.DetailAmount,
          InvestigationDate: this.parseDate(d.InvestigationDate)
        }));
  
        // ✅ Extract documents (if multiple per reimbursement)
        this.documents = details
          .filter(d => d.DocumentID)
          .map(d => ({
            DocumentID: d.DocumentID,
            DocumentDescription: d.DocumentDescription,
            FileName: d.FileName,
            FileType: d.FileType,
            uploadDate: this.parseDate(d.UploadDate),
            previewType: this.getPreviewType(d.FileType, d.FileName),
            previewUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
              this.medicalService.getReimbursementDocumentDownloadUrl(d.DocumentID)
            )
          }));
  
        this.showDetailsModal = true;
      },
      error => console.error('Error loading details:', error)
    );
  }

  getPreviewType(fileType?: string, fileName?: string): 'pdf' | 'image' | 'office' | 'none' {
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lowerName)) return 'image';
    const isOfficeMime = lowerType.includes('officedocument') || lowerType.includes('msword') || lowerType.includes('vnd.ms-') || lowerType.includes('word') || lowerType.includes('excel') || lowerType.includes('powerpoint');
    const isOfficeExt = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);
    if (isOfficeMime || isOfficeExt) return 'office';
    return 'none';
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReimbursement = null;
    this.investigations = [];
    this.documents = [];
    this.closeCommentDialog();
  }

  // NEW: Open comment dialog for status updates
  openStatusUpdateDialog(id: number, status: string): void {
    this.pendingStatusUpdate = { id, status };
    this.statusComment = '';
    this.showCommentDialog = true;
  }

  // NEW: Close comment dialog
  closeCommentDialog(): void {
    this.showCommentDialog = false;
    this.pendingStatusUpdate = null;
    this.statusComment = '';
  }

  // UPDATED: Update reimbursement status with comment
  updateReimbursementStatus(): void {
    if (!this.pendingStatusUpdate || !this.statusComment.trim()) {
      this.showErrorMessage('Please provide a comment for the status update.');
      return;
    }

    const { id, status } = this.pendingStatusUpdate;
    const reimbursement = this.expenseReimbursements.find(r => r.reimbursementID === id);
    
    if (reimbursement) {
      reimbursement.status = status as 'pending' | 'approved' | 'rejected' | 'paid';
      
      // FIXED: Now calling with correct number of parameters
      this.medicalService.updateExpenseReimbursementStatus(id, status, this.statusComment).subscribe(
        () => {
          this.loadExpenseReimbursements();
          this.showSuccessMessage(`Reimbursement ${id} status updated to ${status}.`);
          this.closeCommentDialog();
          
          try {
            const notification = {
              title: 'Reimbursement Status Updated',
              message: `Your reimbursement #${id} has been ${status}.`,
              type: 'ExpenseReimbursement',
              referenceId: id,
              status: status,
              employeeId: reimbursement.employeeID || reimbursement.payrollNo || '',
              createdAt: new Date().toISOString()
            };
            this.medicalService.createNotification(notification).subscribe({ 
              next: () => {}, 
              error: () => {} 
            });
          } catch {}
        },
        error => {
          console.error('Error updating reimbursement status:', error);
          this.showErrorMessage('Error updating reimbursement status. Please try again.');
          // Revert the status change on error
          reimbursement.status = this.getPreviousStatus(status);
        }
      );
    }
  }

  // Helper to get previous status (for error handling)
  private getPreviousStatus(newStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'approved': 'pending',
      'rejected': 'pending', 
      'paid': 'approved'
    };
    return statusMap[newStatus] || 'pending';
  }

// FIXED: Download function - Move removeChild inside setTimeout to allow browser processing
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
      
      // Use setTimeout and move cleanup inside to give browser time to process
      setTimeout(() => {
        a.click(); // Use simple click() instead of dispatchEvent for better compatibility
        console.log('Download link clicked');
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      this.showSuccessMessage(`Document downloaded: ${fileName}`);
    },
    error => {
      console.error('Error downloading document:', error);
      this.showErrorMessage('Error downloading document. Please try again.');
    }
  );
}
  
  // Handle form submission from ClinicMedicalExpenseFormComponent
  onReimbursementSubmitted(reimbursement: ExpenseReimbursement): void {
    this.medicalService.createExpenseReimbursement(reimbursement).subscribe(
      (response: any) => {
        this.loadExpenseReimbursements();
        this.showSuccessMessage(`Expense reimbursement created with ID ${response.ReimbursementID}`)
      },
      error => {
        console.error('Error submitting reimbursement:', error);
        this.showErrorMessage('Error submitting reimbursement. Please try again.')
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
}