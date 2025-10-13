// src/app/components/clinic-medical-expense-form/clinic-medical-expense-form.component.ts

import { Component, OnInit, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  @ViewChild('pdfTemplate') pdfTemplate!: ElementRef;
  expenseForm!: FormGroup;
  investigations: { investigation: string, invoiceNumber: string, amount: number }[] = [];
  createdBy: string | null = null;
  employeeName: string | null = null;
  payrollNumber: string | null = null;
  isSubmitting = false;
  reimbursementId: number | null = null;
  pdfFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private snackBar: MatSnackBar
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
      doneAt: ['', Validators.required],
      orderedFrom: ['', Validators.required]
    });
    this.addInvestigation();
  }

  get totalAmount(): number {
    return this.investigations.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }

  isSubmitDisabled(): boolean {
    return (
      this.expenseForm.invalid ||
      this.isSubmitting ||
      this.investigations.some(inv => !inv.investigation || !inv.invoiceNumber || inv.amount <= 0) ||
      this.totalAmount <= 0
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
            this.showErrorMessage('Error: Invalid user ID format. Please contact support.');
            this.createdBy = null;
          }
        } else {
          console.warn('No employee data found');
          this.showErrorMessage('Error: Employee data not found. Please contact support.');
          this.createdBy = null;
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
        this.showErrorMessage('Error fetching employee data. Please try again.');
        this.createdBy = null;
      }
    );
  }

  async onSubmit(): Promise<void> {
    if (this.expenseForm.valid && this.investigations.every(inv => inv.investigation && inv.invoiceNumber && inv.amount > 0)) {
      this.isSubmitting = true;
      try {
        const patientName = this.expenseForm.get('patientName')?.value;
        const payrollNumber = this.expenseForm.get('payrollNumber')?.value;
        const department = this.expenseForm.get('department')?.value;
        const doneAt = this.expenseForm.get('doneAt')?.value;
        const orderedFrom = this.expenseForm.get('orderedFrom')?.value;

        // Validate string lengths
        if (patientName.length > 100) {
          this.showErrorMessage('Error: Patient Name exceeds 100 characters.');
          return;
        }
        if (payrollNumber?.length > 50) {
          this.showErrorMessage('Error: Payroll Number exceeds 50 characters.');
          return;
        }
        if (department?.length > 100) {
          this.showErrorMessage('Error: Department exceeds 100 characters.');
          return;
        }
        if (doneAt.length > 255) {
          this.showErrorMessage('Error: Done At exceeds 255 characters.');
          return;
        }
        if (orderedFrom.length > 255) {
          this.showErrorMessage('Error: Ordered From exceeds 255 characters.');
          return;
        }

        const reimbursementData: ExpenseReimbursement = {
          reimbursementNumber: this.generateReimbursementNumber(),
          patientName: patientName,
          employeeID: this.payrollNumber,
          payrollNumber: payrollNumber,
          payrollNo: payrollNumber,
          department: department,
          totalAmount: this.totalAmount,
          status: 'pending',
          submissionDate: new Date(),
          createdBy: this.createdBy || '',
          investigations: [],
          reimbursementID: 0,
          approvedBy: null,
          orderedFrom: orderedFrom,
          doneAt: doneAt,
          investigation: this.investigations.map(inv => inv.investigation).join(', '),
          formType: 'ClinicMedicalExpenseRefund'
        };

        const reimbursementResponse: ReimbursementResponse = await firstValueFrom(
          this.medicalService.createExpenseReimbursement(reimbursementData)
        );
        this.reimbursementId = reimbursementResponse.reimbursementID;

        if (this.reimbursementId === null) {
          throw new Error('Reimbursement ID is null after assignment.');
        }

        for (const inv of this.investigations) {
          const detail = {
            InvestigationType: inv.investigation,
            Location: doneAt,
            OrderedFrom: orderedFrom,
            InvoiceNumber: inv.invoiceNumber,
            Amount: inv.amount,
            InvestigationDate: new Date()
          };

          if (!detail.InvestigationType || detail.InvestigationType.trim() === '') {
            throw new Error('Investigation Type is required.');
          }
          if (!detail.InvoiceNumber || detail.InvoiceNumber.trim() === '') {
            throw new Error('Invoice Number is required for each investigation.');
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
        this.showSuccessMessage('Reimbursement created and PDF uploaded successfully!');
        this.expenseForm.reset();
        this.investigations = [{ investigation: '', invoiceNumber: '', amount: 0 }];
        this.reimbursementId = null;
        this.pdfFile = null;
      } catch (error: unknown) {
        console.error('Error submitting form:', error);
        let errorMessage = 'Please try again.';
        if (error instanceof HttpErrorResponse) {
          errorMessage = error.error?.message || error.message || errorMessage;
          if (errorMessage.includes('Invoice number already used')) {
            errorMessage = 'Invoice number already used in another reimbursement. Please use a unique invoice number.';
          }
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        this.showErrorMessage('Error submitting form: ' + errorMessage);
      } finally {
        this.isSubmitting = false;
      }
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

  generateReimbursementNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    let reimbursementNumber = `REIMB-${timestamp}-${random}`;
    if (reimbursementNumber.length > 50) {
      reimbursementNumber = reimbursementNumber.substring(0, 50);
    }
    return reimbursementNumber;
  }

  async generatePDF(): Promise<File> {
    const element = this.pdfTemplate.nativeElement;
    element.style.display = 'block'; // Make visible for rendering
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      allowTaint: true
    });
    element.style.display = 'none'; // Hide again

    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF('p', 'mm', 'a4');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], `Clinic_Medical_Expense_Form_${this.reimbursementId || 'temp'}.pdf`, { type: 'application/pdf' });
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