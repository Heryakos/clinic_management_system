import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { FontService } from '../../services/FontService.service';

@Component({
  selector: 'app-laboratory-report-dialog',
  templateUrl: './laboratory-report-dialog.component.html',
  styleUrls: ['./laboratory-report-dialog.component.css']
})
export class LaboratoryReportDialogComponent {
  @Input() showDialog: boolean = false;
  @Input() testNumber: string = '';
  @Input() testData: any = null;
  @Input() testDetails: any[] = [];
  @Output() close = new EventEmitter<void>();

  constructor(private medicalService: MedicalService,
    private fontService: FontService
  ) {}

  hasComments(): boolean {
    return this.testDetails.some(detail => detail.comments && detail.comments.trim() !== '');
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString();
  }

  printReport(): void {
    const printContent = document.getElementById('labReport');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      const printArea = printContent.outerHTML;

      document.body.innerHTML = printArea;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  }

  exportToPDF(): void {
    // Load font async
    this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').subscribe(fontBase64 => {
      if (!fontBase64) {
        console.error('Font loading failed; falling back to default font.');
        this.generatePDFWithoutCustomFont();
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add custom font for Amharic (Ethiopic script) support
      const fontName = 'AbyssinicaSIL-Regular.ttf'; // Matches your font file name
      const fontFamily = 'AbyssinicaSIL'; // Custom family name

      doc.addFileToVFS(fontName, fontBase64);
      doc.addFont(fontName, fontFamily, 'normal');
      doc.setFont(fontFamily); // Set the custom font for the entire document to handle Amharic/Unicode

      // Header
      doc.setFontSize(20);
      doc.text('LABORATORY REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text('Federal Housing Corporation Medium Clinic', pageWidth / 2, 30, { align: 'center' });

      // Patient Information
      let yPosition = 50;
      doc.setFontSize(14);
      doc.text('Patient Information', 20, yPosition);

      yPosition += 10;
      doc.setFontSize(10);

      const patientInfo = [
        `Patient Name: ${this.testData?.patientName || 'N/A'}`,
        `Patient ID: ${this.testData?.patientID || 'N/A'}`,
        `Card Number: ${this.testData?.cardNumber || 'N/A'}`,
        `Test Number: ${this.testNumber}`,
        `Test Category: ${this.testData?.testCategory || 'N/A'}`,
        `Ordering Physician: ${this.testData?.orderingPhysicianName || 'N/A'}`,
        `Test Date: ${this.testData?.testDate ? new Date(this.testData.testDate).toLocaleDateString() : 'N/A'}`,
        `Reported By: ${this.testData?.reportedBy || 'N/A'}`
      ];

      patientInfo.forEach(info => {
        doc.text(info, 20, yPosition);
        yPosition += 8;
      });

      // Test Results Table
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Laboratory Test Results', 20, yPosition);

      yPosition += 10;

      const tableData = this.testDetails.map(detail => [
        detail.testName,
        detail.result || 'N/A',
        detail.unit || '',
        detail.normalRange || 'N/A',
        detail.isAbnormal ? 'ABNORMAL' : 'NORMAL'
      ]);

      autoTable(doc, {
        head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: fontFamily  // Apply custom font to table
        },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        didParseCell: (data: any) => {
          if (data.column.index === 4 && data.cell.text[0] === 'ABNORMAL') {
            data.cell.styles.textColor = [231, 76, 60];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 4 && data.cell.text[0] === 'NORMAL') {
            data.cell.styles.textColor = [39, 174, 96];
          }
        }
      });

      // Comments section
      const comments = this.testDetails.filter(detail => detail.comments && detail.comments.trim() !== '');
      if (comments.length > 0) {
        yPosition = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('Comments & Observations:', 20, yPosition);

        yPosition += 10;
        doc.setFontSize(9);

        comments.forEach(detail => {
          const commentText = `${detail.testName}: ${detail.comments}`;
          const splitText = doc.splitTextToSize(commentText, pageWidth - 40);
          doc.text(splitText, 20, yPosition);
          yPosition += splitText.length * 5;
        });
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.text('Laboratory Contact: lab@hospital.com | Phone: (555) 123-4567', 20, footerY);
      doc.text(`Report Generated: ${this.getCurrentDateTime()}`, 20, footerY + 8);
      doc.text('This report contains confidential medical information. Unauthorized disclosure is prohibited.',
               pageWidth / 2, footerY + 16, { align: 'center' });

      // Save the PDF
      const fileName = `Lab_Report_${this.testNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    });
  }

  // Fallback method without custom font
  private generatePDFWithoutCustomFont(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LABORATORY REPORT', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Federal Housing Corporation Medium Clinic', pageWidth / 2, 30, { align: 'center' });

    // Patient Information
    let yPosition = 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const patientInfo = [
      `Patient Name: ${this.testData?.patientName || 'N/A'}`,
      `Patient ID: ${this.testData?.patientID || 'N/A'}`,
      `Card Number: ${this.testData?.cardNumber || 'N/A'}`,
      `Test Number: ${this.testNumber}`,
      `Test Category: ${this.testData?.testCategory || 'N/A'}`,
      `Ordering Physician: ${this.testData?.orderingPhysicianName || 'N/A'}`,
      `Test Date: ${this.testData?.testDate ? new Date(this.testData.testDate).toLocaleDateString() : 'N/A'}`,
      `Reported By: ${this.testData?.reportedBy || 'N/A'}`
    ];

    patientInfo.forEach(info => {
      doc.text(info, 20, yPosition);
      yPosition += 8;
    });

    // Test Results Table
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Laboratory Test Results', 20, yPosition);

    yPosition += 10;

    const tableData = this.testDetails.map(detail => [
      detail.testName,
      detail.result || 'N/A',
      detail.unit || '',
      detail.normalRange || 'N/A',
      detail.isAbnormal ? 'ABNORMAL' : 'NORMAL'
    ]);

    autoTable(doc, {
      head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      didParseCell: (data: any) => {
        if (data.column.index === 4 && data.cell.text[0] === 'ABNORMAL') {
          data.cell.styles.textColor = [231, 76, 60];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 4 && data.cell.text[0] === 'NORMAL') {
          data.cell.styles.textColor = [39, 174, 96];
        }
      }
    });

    // Comments section
    const comments = this.testDetails.filter(detail => detail.comments && detail.comments.trim() !== '');
    if (comments.length > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Comments & Observations:', 20, yPosition);

      yPosition += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      comments.forEach(detail => {
        const commentText = `${detail.testName}: ${detail.comments}`;
        const splitText = doc.splitTextToSize(commentText, pageWidth - 40);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 5;
      });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Laboratory Contact: lab@hospital.com | Phone: (555) 123-4567', 20, footerY);
    doc.text(`Report Generated: ${this.getCurrentDateTime()}`, 20, footerY + 8);
    doc.text('This report contains confidential medical information. Unauthorized disclosure is prohibited.',
             pageWidth / 2, footerY + 16, { align: 'center' });

    // Save the PDF
    const fileName = `Lab_Report_${this.testNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  closeDialog(): void {
    this.close.emit();
  }
}