import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { MedicalService } from 'src/app/medical.service'; // Adjust path if needed
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reimbursement-documents-viewer',
  templateUrl: './reimbursement-documents-viewer.component.html',
  styleUrls: ['./reimbursement-documents-viewer.component.css']
})
export class ReimbursementDocumentsViewerComponent implements OnInit, OnChanges {
  @Input() reimbursementId!: number;          // Required input
  @Input() title: string = 'Uploaded Documents'; // Optional header text

  documents: any[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Preview management
  pdfPreviewUrls: { [docId: number]: SafeResourceUrl } = {};
  pdfLoading: { [docId: number]: boolean } = {};
  pdfLoadErrors: { [docId: number]: string } = {};
  pdfRetryCount: { [docId: number]: number } = {};

  clinicForms: any[] = [];
  supportingDocuments: any[] = [];

  constructor(
    private medicalService: MedicalService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.reimbursementId > 0) {
      this.loadDocuments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reimbursementId'] && changes['reimbursementId'].currentValue > 0) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.hasError = false;
    this.documents = [];
    this.clinicForms = [];
    this.supportingDocuments = [];

    this.medicalService.getDocumentsByReimbursementId(this.reimbursementId).subscribe({
      next: (docs: any[]) => {
        // Map and sort documents (clinic form first)
        this.documents = docs.map(doc => ({
          DocumentID: doc.documentID || doc.DocumentID,
          DocumentDescription: doc.description || doc.Description || 'Document',
          FileName: doc.fileName || doc.FileName,
          FileType: doc.fileType || doc.FileType,
          FileSize: doc.fileSize || 0,
          uploadDate: this.parseDate(doc.uploadDate || doc.UploadDate),
          UploadedBy: doc.uploadedBy || 'Unknown',
          previewType: this.getPreviewType(doc.fileType || doc.FileType, doc.fileName || doc.FileName)
        })).sort((a, b) => {
          const aIsForm = a.DocumentDescription.toLowerCase().includes('clinic') && 
                          a.DocumentDescription.toLowerCase().includes('form');
          const bIsForm = b.DocumentDescription.toLowerCase().includes('clinic') && 
                          b.DocumentDescription.toLowerCase().includes('form');
          if (aIsForm && !bIsForm) return -1;
          if (!aIsForm && bIsForm) return 1;
          return 0;
        });

        this.clinicForms = this.documents.filter(d => 
          d.DocumentDescription.toLowerCase().includes('clinic') && 
          d.DocumentDescription.toLowerCase().includes('form')
        );

        this.supportingDocuments = this.documents.filter(d => !this.clinicForms.includes(d));

        // Load PDF previews
        this.documents.forEach(doc => {
          if (doc.previewType === 'pdf') {
            this.pdfLoading[doc.DocumentID] = true;
            this.pdfRetryCount[doc.DocumentID] = 0;
            this.loadPdfPreview(doc);
          }
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.hasError = true;
        this.errorMessage = 'Failed to load documents. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ────────────────────────────────────────────────
  // PDF Preview Logic (copied & adapted from your original)
  // ────────────────────────────────────────────────

  private async loadPdfPreview(doc: any): Promise<void> {
    try {
      const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.DocumentID);
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/pdf' } });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Document is empty');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfPreviewUrls[doc.DocumentID] = this.sanitizer.bypassSecurityTrustResourceUrl(
        blobUrl + '#view=FitH&toolbar=0&navpanes=0'
      );
      this.pdfLoadErrors[doc.DocumentID] = '';
    } catch (error: any) {
      console.error(`PDF preview failed for doc ${doc.DocumentID}:`, error);
      this.pdfLoadErrors[doc.DocumentID] = 'Failed to load PDF preview';
    } finally {
      this.pdfLoading[doc.DocumentID] = false;
      this.cdr.detectChanges();
    }
  }

  retryPdfLoad(doc: any): void {
    const docId = doc.DocumentID;
    const retryCount = (this.pdfRetryCount[docId] || 0) + 1;

    if (retryCount > 3) {
      this.pdfLoadErrors[docId] = 'Maximum retry attempts reached';
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
    return this.pdfPreviewUrls[doc.DocumentID] || this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  // ────────────────────────────────────────────────
  // Helper Methods (copied from your original)
  // ────────────────────────────────────────────────

  getPreviewType(fileType?: string, fileName?: string): 'pdf' | 'image' | 'office' | 'none' {
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();

    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(lowerName)) return 'image';

    const isOffice = lowerType.includes('officedocument') || 
                     lowerType.includes('msword') || 
                     lowerType.includes('vnd.ms-') ||
                     /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);

    return isOffice ? 'office' : 'none';
  }

  downloadDocument(doc: any): void {
    const docId = doc.DocumentID;
    const fileName = doc.FileName || `document_${docId}`;

    this.medicalService.downloadReimbursementDocument(docId).subscribe({
      next: (blob: Blob) => {
        if (blob.size === 0) {
          this.snackBar.open('Downloaded file is empty', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.snackBar.open(`Downloaded: ${fileName}`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.snackBar.open('Failed to download document', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
}