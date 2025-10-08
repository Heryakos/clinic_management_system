import { Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  constructor(public medicalService: MedicalService, private sanitizer: DomSanitizer) {}

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
      details => this.investigations = (Array.isArray(details) ? details : [details]).map((d: any) => ({
        InvestigationType: d.InvestigationType || d.investigationType,
        Location: d.Location || d.location,
        OrderedFrom: d.OrderedFrom || d.orderedFrom,
        Amount: d.Amount ?? d.amount,
        InvestigationDate: this.parseDate(d.InvestigationDate ?? d.investigationDate)
      })),
      error => console.error('Error loading investigations:', error)
    );
    this.medicalService.getDocumentsByReimbursementId(reimbursement.reimbursementID).subscribe(
      docs => this.documents = docs.map(doc => {
        const documentId = (doc as any).documentID ?? (doc as any).DocumentID ?? (doc as any).documentId;
        const downloadUrl = typeof documentId === 'number' && !isNaN(documentId)
          ? this.medicalService.getReimbursementDocumentDownloadUrl(documentId)
          : '';
        const previewType = this.getPreviewType(doc.fileType, doc.fileName);
        let previewUrl: SafeResourceUrl | null = null;
        if (downloadUrl && (previewType === 'pdf' || previewType === 'image')) {
          previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(downloadUrl);
        } else if (downloadUrl && previewType === 'office') {
          const officeViewer = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(downloadUrl);
          previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(officeViewer);
        }
        return {
          ...doc,
          downloadUrl,
          previewType,
          previewUrl,
          uploadDate: this.parseDate(doc.uploadDate)
        };
      }),
      error => console.error('Error loading documents:', error)
    );
    this.showDetailsModal = true;
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
  }

  updateReimbursementStatus(id: number, status: string): void {
    const reimbursement = this.expenseReimbursements.find(r => r.reimbursementID === id);
    if (reimbursement) {
      reimbursement.status = status as 'pending' | 'approved' | 'rejected' | 'paid';
      this.medicalService.updateExpenseReimbursementStatus(id, status).subscribe(
        () => {
          this.loadExpenseReimbursements();
          alert(`Reimbursement ${id} status updated to ${status}.`);
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
            this.medicalService.createNotification(notification).subscribe({ next: () => {}, error: () => {} });
          } catch {}
        },
        error => {
          console.error('Error updating reimbursement status:', error);
          alert('Error updating reimbursement status. Please try again.');
        }
      );
    }
  }

  // Handle form submission from ClinicMedicalExpenseFormComponent
  onReimbursementSubmitted(reimbursement: ExpenseReimbursement): void {
    this.medicalService.createExpenseReimbursement(reimbursement).subscribe(
      (response: any) => {
        this.loadExpenseReimbursements();
        alert(`Expense reimbursement created with ID ${response.ReimbursementID}`);
      },
      error => {
        console.error('Error submitting reimbursement:', error);
        alert('Error submitting reimbursement. Please try again.');
      }
    );
  }
}