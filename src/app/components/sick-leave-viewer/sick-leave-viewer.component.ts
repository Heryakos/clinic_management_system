import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { SickLeave } from 'src/app/models/medical.model';
import { ASSETS } from '../../assets.config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FontService } from 'src/app/services/FontService.service';

@Component({
  selector: 'app-sick-leave-viewer',
  templateUrl: './sick-leave-viewer.component.html',
  styleUrls: ['./sick-leave-viewer.component.css']
})
export class SickLeaveViewerComponent implements OnInit, OnChanges {
  @Input() patientID: string | null = null;

  logoPath = ASSETS.LOGO;
  sickLeaves: SickLeave[] = [];
  selectedLeave: SickLeave | null = null;
  showPrintModal = false;

  constructor(private medicalService: MedicalService, private snackBar: MatSnackBar,private fontService: FontService) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.patientID) {
      this.loadSickLeaves();
    }
  }

  loadSickLeaves(): void {
    if (!this.patientID) return;

    this.medicalService.getSickLeaveCertificatebyemployee(this.patientID).subscribe(
      (leaves: SickLeave[]) => {
        this.sickLeaves = leaves || [];
      },
      error => {
        console.error('Error loading sick leaves:', error);
        this.sickLeaves = [];
      }
    );
  }

  openPrintPreview(leave: SickLeave): void {
    this.selectedLeave = leave;
    this.showPrintModal = true;
  }

  closePrintModal(): void {
    this.showPrintModal = false;
    this.selectedLeave = null;
  }

  // ──────────────────────────────────────────────────────────────
// SHARED: Generate PDF from the actual HTML preview
// ──────────────────────────────────────────────────────────────
private async generatePDF(fromPrint: boolean = false): Promise<void> {
  if (!this.selectedLeave) return;

  const element = document.getElementById('printable-certificate');
  if (!element) {
    console.error('Certificate element not found');
    this.snackBar.open('Error: Certificate preview not found', 'Close', { duration: 4000 });
    return;
  }

  try {
    // Optional: temporarily make sure it's visible & correctly sized
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    const canvas = await html2canvas(element, {
      scale: 2,                    // better quality
      useCORS: true,               // if logo is external
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Restore if needed
    element.style.display = originalDisplay;

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;           // A4 width in mm
    const pageHeight = 297;         // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    // Optional: Add Amharic font support anyway (for metadata/fallback text)
    // (you can keep your font loading logic here if needed)

    // Add the rendered certificate image
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // If content is longer than 1 page (unlikely for certificate) → add more pages
    if (imgHeight > pageHeight) {
      // simple multi-page support (rarely needed here)
      let position = pageHeight;
      while (position < imgHeight) {
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pageHeight;
      }
    }

    const fileName = `medical-certificate-${this.selectedLeave.certificateID || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;

    if (fromPrint) {
      // Print flow
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => printWindow.print(), 800); // small delay helps
        };
      } else {
        this.snackBar.open('Popup blocked. Please allow popups or use Download.', 'Close', { duration: 6000 });
      }
    } else {
      // Download flow
      doc.save(fileName);
    }

  } catch (err) {
    console.error('PDF generation failed:', err);
    this.snackBar.open('Failed to generate certificate PDF', 'Close', { duration: 5000 });
  }
}

// Update your public methods:
printCertificate(): void {
  this.generatePDF(true);
}

downloadCertificate(): void {
  this.generatePDF(false);
}
// ──────────────────────────────────────────────────────────────
// DOWNLOAD: Generate PDF with font + safe logo handling
// ──────────────────────────────────────────────────────────────
// downloadCertificate(): void {
//   if (!this.selectedLeave) return;

//   this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
//     const doc = new jsPDF();

//     // Add Amharic font (your existing logic – keep it!)
//     if (fontBase64) {
//       const fontName = 'AbyssinicaSIL-Regular.ttf';
//       const fontFamily = 'AbyssinicaSIL';
//       doc.addFileToVFS(fontName, fontBase64);
//       doc.addFont(fontName, fontFamily, 'normal');
//       doc.setFont(fontFamily);
//     } else {
//       console.warn('Amharic font failed to load – using default');
//     }

//     this.addCertificateContentToPDF(doc);
//     doc.save(`medical-certificate-${this.selectedLeave!.certificateID || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`);
//   });
// }

// ──────────────────────────────────────────────────────────────
// PRINT: Generate PDF → open in new tab → auto print
// ──────────────────────────────────────────────────────────────
// printCertificate(): void {
//   if (!this.selectedLeave) return;

//   this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
//     const doc = new jsPDF();

//     if (fontBase64) {
//       const fontName = 'AbyssinicaSIL-Regular.ttf';
//       const fontFamily = 'AbyssinicaSIL';
//       doc.addFileToVFS(fontName, fontBase64);
//       doc.addFont(fontName, fontFamily, 'normal');
//       doc.setFont(fontFamily);
//     }

//     this.addCertificateContentToPDF(doc);

//     // Open PDF in new window and trigger print
//     const pdfBlob = doc.output('blob');
//     const pdfUrl = URL.createObjectURL(pdfBlob);

//     const printWindow = window.open(pdfUrl, '_blank');
//     if (printWindow) {
//       printWindow.onload = () => {
//         printWindow.focus();
//         printWindow.print();
//         // Optional: auto-close after printing (uncomment if desired)
//         // printWindow.onafterprint = () => printWindow.close();
//       };
//     } else {
//       console.warn('Popup blocked – please allow popups or download instead');
//       this.snackBar.open('Popup blocked. Try downloading the PDF instead.', 'Close', { duration: 5000 });
//     }
//   });
// }

// ──────────────────────────────────────────────────────────────
// SHARED: Add certificate content (same layout as your HTML)
// ──────────────────────────────────────────────────────────────
private addCertificateContentToPDF(doc: jsPDF): void {
  if (!this.selectedLeave) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // ─── Logo (safe – skip if fails) ───
  const logoUrl = ASSETS.LOGO; // keep using your config
  try {
    doc.addImage(logoUrl, 'JPEG', margin, y, 30, 30);
    y += 35;
  } catch (err) {
    console.warn('Logo image failed to load:', err);
    // Optional placeholder rectangle
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, 30, 30, 'F');
    y += 35;
  }

  // Clinic title
  doc.setFontSize(16);
  doc.text('FEDERAL HOUSING COOPERATION MEDIUM CLINIC', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.text('TEL. 011-855-3615', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Card No (right)
  doc.text(`Card No: ${this.selectedLeave.employeeID || ''}`, pageWidth - margin, y - 20, { align: 'right' });

  // Date
  doc.setFontSize(11);
  doc.text('Date:', margin, y);
  doc.text(this.selectedLeave.issueDate ? new Date(this.selectedLeave.issueDate).toLocaleDateString('en-GB') : '', margin + 20, y);
  y += 15;

  // Title
  doc.setFontSize(14);
  doc.text('Medical Certificate', pageWidth / 2, y, { align: 'center' });
  y += 20;

  // ─── Form Fields (Amharic + English) ───
  const addField = (am: string, en: string, value: string) => {
    doc.setFontSize(11);
    doc.text(`${am} / ${en}`, margin, y);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    doc.text(value || '—', margin, y + 10);
    y += 18;
  };

  addField('ስም', 'Name', this.selectedLeave.employeeName || '');
  addField('ዕድሜ', 'Age', this.selectedLeave.age?.toString() || '');
  addField('ፆታ', 'Sex', this.selectedLeave.sex || '');

  addField('አድራሻ', 'Address', this.selectedLeave.address || '');
  addField('ተመረመሩበት ቀን', 'Examined on', this.selectedLeave.examinedOn ? new Date(this.selectedLeave.examinedOn).toLocaleDateString('en-GB') : '');
  addField('የምርመራ ውጤት', 'Diagnosis', this.selectedLeave.diagnosis || '');
  addField('የሐኪም አስተያየት', "Doctor's recommendation", this.selectedLeave.recommendations || '');

  // Rest required
  if (this.selectedLeave.status !== 'FitToWork') {
    addField('የሚያስፈልገው ዕረፍት', 'Rest required',
      `${this.selectedLeave.totalDays || 0} days (${this.selectedLeave.startDate ? new Date(this.selectedLeave.startDate).toLocaleDateString('en-GB') : ''} - ${this.selectedLeave.endDate ? new Date(this.selectedLeave.endDate).toLocaleDateString('en-GB') : ''})`);
  } else {
    addField('የሚያስፈልገው ዕረፍት', 'Rest required', 'No rest required - Patient is fit to work');
  }

  addField('የሐኪሙ ስም', "Doctor's name", this.selectedLeave.doctorName || '');

  // Signature
  y += 10;
  doc.text('ፊርማ / Signature:', margin, y);
  if (this.selectedLeave.signature) {
    try {
      doc.addImage(`data:image/png;base64,${this.selectedLeave.signature}`, 'PNG', margin + 30, y - 5, 60, 20);
    } catch (err) {
      console.warn('Signature image failed:', err);
    }
  }
  y += 25;

  addField('ቀን', 'Date', this.selectedLeave.issueDate ? new Date(this.selectedLeave.issueDate).toLocaleDateString('en-GB') : '');
}
}