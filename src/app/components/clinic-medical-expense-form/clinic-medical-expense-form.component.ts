import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs'; // Import firstValueFrom

// Define interface for server response
interface ReimbursementResponse {
  reimbursementID: number;
  reimbursementNumber: string;
  patientName: string;
  employeeID: string | null;
  payrollNumber: string | null;
  department: string | null;
  totalAmount: number;
  status: string;
  submissionDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
  paidDate: string | null;
  comments: string | null;
  createdBy: string;
  createdByGuid: string;
}

@Component({
  selector: 'app-clinic-medical-expense-form',
  templateUrl: './clinic-medical-expense-form.component.html',
  styleUrls: ['./clinic-medical-expense-form.component.css']
})
export class ClinicMedicalExpenseFormComponent implements OnInit {
  @Output() reimbursementSubmitted = new EventEmitter<ExpenseReimbursement>();
  expenseForm!: FormGroup;
  investigations: { investigation: string, doneAt: string, orderedFrom: string }[] = [];
  createdBy: string | null = null;
  employeeName: string | null = null;
  payrollNumber: string | null = null;
  isSubmitting = false;
  reimbursementId: number | null = null;
  pdfFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm(): void {
    this.expenseForm = this.fb.group({
      patientName: ['', Validators.required],
      payrollNumber: ['', Validators.required],
      department: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]]
    });
    this.addInvestigation();
  }

  isSubmitDisabled(): boolean {
    return (
      this.expenseForm.invalid ||
      this.isSubmitting ||
      this.investigations.some(inv => !inv.investigation || !inv.doneAt || !inv.orderedFrom)
    );
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee && employee.user_ID) {
          const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (guidRegex.test(employee.user_ID)) {
            this.createdBy = employee.user_ID;
            this.employeeName = employee.en_name ?? 'Unknown';
            this.payrollNumber = employee.employee_Id ?? 'Unknown';
            this.expenseForm.patchValue({ payrollNumber: this.payrollNumber });
          } else {
            console.error('Invalid user_ID format:', employee.user_ID);
            alert('Error: Invalid user ID format. Please contact support.');
            this.createdBy = null;
          }
        } else {
          console.warn('No employee data found');
          alert('Error: Employee data not found. Please contact support.');
          this.createdBy = null;
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
        alert('Error fetching employee data. Please try again.');
        this.createdBy = null;
      }
    );
  }

  async onSubmit(): Promise<void> {
    if (this.expenseForm.valid && this.investigations.every(inv => inv.investigation && inv.doneAt && inv.orderedFrom)) {
      this.isSubmitting = true;
      try {
        const patientName = this.expenseForm.get('patientName')?.value;
        const payrollNumber = this.expenseForm.get('payrollNumber')?.value;
        const department = this.expenseForm.get('department')?.value;

        // Validate string lengths
        if (patientName.length > 100) {
          alert('Error: Patient Name exceeds 100 characters.');
          return;
        }
        if (payrollNumber?.length > 50) {
          alert('Error: Payroll Number exceeds 50 characters.');
          return;
        }
        if (department?.length > 100) {
          alert('Error: Department exceeds 100 characters.');
          return;
        }

        const reimbursementData: ExpenseReimbursement = {
          reimbursementNumber: this.generateReimbursementNumber(),
          patientName: patientName,
          employeeID: this.payrollNumber,
          payrollNumber: payrollNumber,
          payrollNo: payrollNumber,
          department: department,
          totalAmount: this.expenseForm.get('totalAmount')?.value,
          status: 'pending',
          submissionDate: new Date(),
          createdBy: this.createdBy || '',
          investigations: this.investigations.map(inv => ({
            investigationType: inv.investigation,
            location: inv.doneAt,
            invoiceNumber: this.expenseForm.get('invoiceNumber')?.value,
            amount: this.expenseForm.get('totalAmount')?.value / this.investigations.length,
            investigationDate: new Date()
          })),
          reimbursementID: 0,
          approvedBy: null
        };

        if (reimbursementData.reimbursementNumber.length > 50) {
          alert('Error: Reimbursement Number exceeds 50 characters.');
          return;
        }

        const reimbursementResponse: ReimbursementResponse = await firstValueFrom(
          this.medicalService.createExpenseReimbursement(reimbursementData)
        );
        console.log('Reimbursement Response:', reimbursementResponse); // Debugging
        if (!reimbursementResponse.reimbursementID || isNaN(reimbursementResponse.reimbursementID)) {
          throw new Error('Invalid Reimbursement ID received from server: ' + JSON.stringify(reimbursementResponse));
        }
        this.reimbursementId = reimbursementResponse.reimbursementID;
        console.log('Reimbursement ID:', this.reimbursementId); // Debugging

        // Ensure reimbursementId is non-null for TypeScript
        if (this.reimbursementId === null) {
          throw new Error('Reimbursement ID is null after assignment.');
        }

        for (const inv of this.investigations) {
          const detail = {
            InvestigationType: inv.investigation,
            Location: inv.doneAt,
            OrderedFrom: inv.orderedFrom,
            InvoiceNumber: this.expenseForm.get('invoiceNumber')?.value,
            Amount: this.expenseForm.get('totalAmount')?.value / this.investigations.length,
            InvestigationDate: new Date()
          };

          // Validate detail fields
          if (!detail.InvestigationType || detail.InvestigationType.trim() === '') {
            throw new Error('Investigation Type is required.');
          }
          if (!detail.Location || detail.Location.trim() === '') {
            throw new Error('Location is required.');
          }
          if (!detail.InvoiceNumber || detail.InvoiceNumber.trim() === '') {
            throw new Error('Invoice Number is required.');
          }
          if (!detail.Amount || detail.Amount <= 0) {
            throw new Error('Amount must be greater than 0.');
          }

          await firstValueFrom(this.medicalService.addReimbursementDetail(this.reimbursementId, detail));
        }

        this.pdfFile = await this.generatePDF();

        const formData = new FormData();
        formData.append('reimbursementId', this.reimbursementId.toString());
        formData.append('description', 'Clinic Medical Expense Refund Form');
        formData.append('uploadedBy', this.employeeName || 'Unknown');
        formData.append('createdBy', this.createdBy || '');
        formData.append('file', this.pdfFile, this.pdfFile.name);

        await firstValueFrom(this.medicalService.uploadReimbursementDocument(formData));

        this.reimbursementSubmitted.emit(reimbursementData);
        alert('Reimbursement created and PDF uploaded successfully!');
        this.expenseForm.reset();
        this.investigations = [{ investigation: '', doneAt: '', orderedFrom: '' }];
        this.reimbursementId = null;
        this.pdfFile = null;
      } catch (error: unknown) {
        console.error('Error submitting form:', error);
        let errorMessage = 'Please try again.';
        if (error instanceof HttpErrorResponse) {
          errorMessage = error.error?.message || error.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        alert('Error submitting form: ' + errorMessage);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  addInvestigation(): void {
    this.investigations.push({ investigation: '', doneAt: '', orderedFrom: '' });
  }

  removeInvestigation(index: number): void {
    if (this.investigations.length > 1) {
      this.investigations.splice(index, 1);
    }
  }

  generateReimbursementNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const reimbursementNumber = `REIMB-${timestamp}-${random}`;
    if (reimbursementNumber.length > 50) {
      console.warn('Generated ReimbursementNumber too long, truncating to 50 characters');
      return reimbursementNumber.substring(0, 50);
    }
    return reimbursementNumber;
  }

  generatePDF(): Promise<File> {
    const doc = new jsPDF('p', 'mm', 'a4');
    (doc as any).autoTable = autoTable;
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const lineHeight = 7;

    doc.setFont('Times', 'bold');
    doc.setFontSize(24);
    doc.text('Federal Housing Corporation', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(20);
    doc.text('Clinic Medical Expense Refund Form', pageWidth / 2, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);

    doc.setFont('Times', 'normal');
    doc.setFontSize(18);
    let y = 50;
    const fields = [
      { label: '1. Name of patient', value: this.expenseForm.get('patientName')?.value || '' },
      { label: '2. Payroll no', value: this.expenseForm.get('payrollNumber')?.value || '' },
      { label: '3. Department', value: this.expenseForm.get('department')?.value || '' }
    ];
    fields.forEach(field => {
      doc.text(field.label, margin, y);
      doc.text(field.value, margin + 50, y);
      doc.line(margin + 50, y + 1, pageWidth - margin, y + 1);
      y += 10;
    });

    // Investigation section header
    y += 10;
    doc.text('4. Investigation', margin, y);
    y += 5;
    doc.setFontSize(14);
    doc.text('Done at', margin + 50, y);
    doc.text('Ordered from', pageWidth / 2, y);
    y += 5;
    doc.line(margin + 50, y, pageWidth - margin, y);
    doc.setFontSize(16);

    // Two-column grid 1..20 matching provided template
    const startY = y + 5;
    const rows = 10;
    const col1X = margin;
    const col2X = pageWidth / 2;
    let rowY = startY;
    for (let i = 0; i < rows; i++) {
      const idx1 = i + 1;
      const idx2 = i + 11;
      // Left column number and line
      doc.text(`${idx1}.`, col1X, rowY);
      doc.line(col1X + 10, rowY + 1, pageWidth / 2 - 10, rowY + 1);
      // Right column number and line
      doc.text(`${idx2}.`, col2X, rowY);
      doc.line(col2X + 10, rowY + 1, pageWidth - margin, rowY + 1);
      rowY += lineHeight + 3;
    }

    y += 15;
    doc.text(`As per invoice attached (number: ${this.expenseForm.get('invoiceNumber')?.value || ''})`, margin, y);

    y += 20;
    doc.text(`The medical expense should be paid to the patient`, margin, y);

    y += 30;
    doc.text('Stamp', margin, y);
    doc.line(margin, y - 2, margin + 50, y - 2);
    doc.text('sig of head of clinic', pageWidth - margin - 50, y);
    doc.line(pageWidth - margin - 50, y - 2, pageWidth - margin, y - 2);

    doc.setFontSize(14);
    doc.text('Page 1', pageWidth - margin - 20, pageHeight - margin);

    const pdfBlob = doc.output('blob');
    return Promise.resolve(new File([pdfBlob], `Clinic_Medical_Expense_Form_${this.reimbursementId || 'temp'}.pdf`, { type: 'application/pdf' }));
  }
}