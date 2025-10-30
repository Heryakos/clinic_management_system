import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

export interface CashierApproval {
  FinanceApprovalID: number;
  ReimbursementID: number;
  ReimbursementNumber: string;
  PatientName: string;
  PayrollNumber: string;
  Department: string;
  ApprovedAmount: number;
  PreparedBy: string;
  CheckedBy: string;
  PreparedDate: Date;
  CheckedDate?: Date;
  Status: string;
  Comments?: string;
  selected?: boolean;
}

export interface PaymentHistory {
  PaymentID: number;
  ReimbursementID: number;
  ReimbursementNumber: string;
  PatientName: string;
  PayrollNumber: string;
  Department: string;
  PaymentAmount: number;
  PaidBy: string;
  PaymentDate: Date;
  PaymentMethod: string;
  ReferenceNumber?: string;
  Status: string;
  Comments?: string;
  PreparedBy: string;
  CheckedBy: string;
}

export interface PaymentSummary {
  PendingPayments: { Count: number; Amount: number };
  TodayPayments: { Count: number; Amount: number };
}

@Component({
  selector: 'app-cashier-payment',
  templateUrl: './cashier-payment.component.html',
  styleUrls: ['./cashier-payment.component.css']
})
export class CashierPaymentComponent implements OnInit {
  // Voucher language
  voucherLang: 'en' | 'am' = 'en';

  // Company info (from DB or config)
  companyInfo = {
    nameEn: 'Federal Housing Corporation',
    nameAm: 'ፌደራል ቤቶች ኮርፖሬሽን',
    addressEn: 'Addis Ababa, Ethiopia',
    addressAm: 'አዲስ አበባ፣ ኢትዮጵያ',
    phone: '+251 11 551 2345',
    logoUrl: '/assets/images/logo.png'
  };
  voucherType: 'petty' | 'check' = 'petty';
  approvalsForPayment: CashierApproval[] = [];
  filteredApprovals: CashierApproval[] = [];
  paymentHistory: PaymentHistory[] = [];
  paymentSummary: PaymentSummary = {
    PendingPayments: { Count: 0, Amount: 0 },
    TodayPayments: { Count: 0, Amount: 0 }
  };
  searchTerm: string = '';
  showPaymentDialog: boolean = false;
  showBatchPaymentDialog: boolean = false;
  showVoucherForm: boolean = false;
  selectedApproval: CashierApproval | null = null;
  selectedApprovals: CashierApproval[] = [];
  isLoading: boolean = true;
  activeTab: 'pending' | 'history' | 'reports' = 'pending';

  // User data
  currentUserId: string | null = null;
  employeeName: string = 'Unknown';
  payrollNumber: string | null = null;

  // Individual payment form
  individualPaymentAmount: number = 0;
  individualPaidBy: string = '';
  individualPaymentMethod: string = 'Cash';
  individualReferenceNumber: string = '';
  individualComments: string = '';

  // Cash payment specific fields
  individualAmountTendered: number = 0;
  individualChangeGiven: number = 0;

  // Batch payment form
  batchPaidBy: string = '';
  batchPaymentMethod: string = 'Cash';
  batchComments: string = '';

  // Batch cash payment specific fields
  batchAmountTendered: number = 0;
  batchChangeGiven: number = 0;

  // Voucher form data
  voucherFormData: any = {
    voucherNo: '',
    date: '',
    payee: '',
    amountWords: '',
    amountFigure: '',
    reason: '',
    account: '',
    budget: '',
    preparedBy: '',
    checkedBy: '',
    approvedBy: '',
    cashier: '',
    accountant: ''
  };

  // Date filters for history
  startDate: string = '';
  endDate: string = '';
  statusFilter: string = '';

  constructor(
    public medicalService: MedicalService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadApprovalsForPayment();
    this.loadPaymentSummary();
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe({
      next: (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.currentUserId = employee.user_ID ?? null;
          this.employeeName = employee.en_name ?? 'Unknown';
          this.payrollNumber = employee.employee_Id ?? null;
          console.log('Loaded employee data:', {
            currentUserId: this.currentUserId,
            employeeName: this.employeeName,
            payrollNumber: this.payrollNumber
          });
          // Set default values for form fields
          this.individualPaidBy = this.employeeName;
          this.batchPaidBy = this.employeeName;
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

  loadApprovalsForPayment(): void {
    this.isLoading = true;
    this.medicalService.getCashierApprovalsForPayment().subscribe(
      (approvals) => {
        console.log('Raw approvals from API:', approvals);

        // Better mapping with fallbacks
        this.approvalsForPayment = (approvals as any[]).map((a: any) => {
          const mappedApproval: CashierApproval = {
            FinanceApprovalID: a.financeApprovalID ?? a.FinanceApprovalID ?? 0,
            ReimbursementID: a.reimbursementID ?? a.ReimbursementID ?? 0,
            ReimbursementNumber: a.reimbursementNumber ?? a.ReimbursementNumber ?? 'N/A',
            PatientName: a.patientName ?? a.PatientName ?? 'Unknown Patient',
            PayrollNumber: a.payrollNumber ?? a.PayrollNumber ?? 'N/A',
            Department: a.department ?? a.Department ?? 'Unknown Department',
            ApprovedAmount: a.approvedAmount ?? a.ApprovedAmount ?? 0,
            PreparedBy: a.preparedBy ?? a.PreparedBy ?? this.employeeName,
            CheckedBy: a.checkedBy ?? a.CheckedBy ?? this.employeeName,
            PreparedDate: this.parseDate(a.preparedDate ?? a.PreparedDate),
            CheckedDate: this.parseDate(a.checkedDate ?? a.CheckedDate),
            Status: a.status ?? a.Status ?? 'Approved',
            Comments: a.comments ?? a.Comments,
            selected: false
          };

          console.log('Mapped approval:', mappedApproval);
          return mappedApproval;
        });

        this.filteredApprovals = [...this.approvalsForPayment];
        console.log('All mapped approvals:', this.filteredApprovals);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading approvals for payment:', error);
        this.showErrorMessage('Failed to load approvals for payment');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // Calculate change for individual payment
  calculateIndividualChange(): void {
    if (this.individualAmountTendered >= this.individualPaymentAmount) {
      this.individualChangeGiven = this.individualAmountTendered - this.individualPaymentAmount;
    } else {
      this.individualChangeGiven = 0;
    }
  }

  // Calculate change for batch payment
  calculateBatchChange(): void {
    const totalAmount = this.getSelectedTotalAmount();
    if (this.batchAmountTendered >= totalAmount) {
      this.batchChangeGiven = this.batchAmountTendered - totalAmount;
    } else {
      this.batchChangeGiven = 0;
    }
  }

  // Check if cash payment is exact
  isIndividualExactPayment(): boolean {
    return this.individualAmountTendered === this.individualPaymentAmount;
  }

  isBatchExactPayment(): boolean {
    return this.batchAmountTendered === this.getSelectedTotalAmount();
  }

  trackByApproval(index: number, approval: CashierApproval): number {
    return approval.FinanceApprovalID;
  }

  trackByPayment(index: number, payment: PaymentHistory): number {
    return payment.PaymentID;
  }

  loadPaymentHistory(): void {
    this.medicalService.getPaymentHistory(
      this.startDate ? new Date(this.startDate) : undefined,
      this.endDate ? new Date(this.endDate) : undefined,
      this.statusFilter || undefined
    ).subscribe(
      (history) => {
        console.log('Payment History:', history);

        this.paymentHistory = (history as any[]).map((h: any) => ({
          PaymentID: h.paymentID || h.PaymentID,
          ReimbursementID: h.reimbursementID || h.ReimbursementID,
          ReimbursementNumber: h.reimbursementNumber || h.ReimbursementNumber,
          PatientName: h.patientName || h.PatientName,
          PayrollNumber: h.payrollNumber || h.PayrollNumber,
          Department: h.department || h.Department,
          PaymentAmount: h.paymentAmount || h.PaymentAmount || 0,
          PaidBy: h.paidBy || h.PaidBy || this.employeeName,
          PaymentDate: this.parseDate(h.paymentDate || h.PaymentDate),
          PaymentMethod: h.paymentMethod || h.PaymentMethod,
          ReferenceNumber: h.referenceNumber || h.ReferenceNumber,
          Status: h.status || h.Status,
          Comments: h.comments || h.Comments,
          PreparedBy: h.preparedBy || h.PreparedBy || this.employeeName,
          CheckedBy: h.checkedBy || h.CheckedBy || this.employeeName
        }));

        console.log('Mapped payment history:', this.paymentHistory);
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading payment history:', error);
        this.showErrorMessage('Failed to load payment history');
      }
    );
  }

  loadPaymentSummary(): void {
    this.medicalService.getPaymentSummary().subscribe(
      (summary) => {
        console.log('Payment Summary:', summary);
        this.paymentSummary = summary as PaymentSummary;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading payment summary:', error);
      }
    );
  }

  filterApprovals(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredApprovals = this.approvalsForPayment.filter(
      (a) =>
        a.PayrollNumber?.toLowerCase().includes(term) ||
        a.PatientName.toLowerCase().includes(term) ||
        a.ReimbursementNumber.toLowerCase().includes(term)
    );
  }

  toggleSelection(approval: CashierApproval): void {
    approval.selected = !approval.selected;
    this.updateSelectedApprovals();
  }

  toggleSelectAll(): void {
    const allSelected = this.filteredApprovals.every(a => a.selected);
    this.filteredApprovals.forEach(a => a.selected = !allSelected);
    this.updateSelectedApprovals();
  }

  updateSelectedApprovals(): void {
    this.selectedApprovals = this.filteredApprovals.filter(a => a.selected);
  }

  openIndividualPaymentDialog(approval: CashierApproval): void {
    this.selectedApproval = approval;
    this.individualPaymentAmount = approval.ApprovedAmount;
    this.individualPaidBy = this.employeeName;

    // Auto-select correct method
    const allowed = this.getAllowedPaymentMethods(this.individualPaymentAmount);
    this.individualPaymentMethod = allowed[0].value;

    // Reset cash fields
    this.individualAmountTendered = this.individualPaymentAmount;
    this.individualChangeGiven = 0;

    this.individualReferenceNumber = '';
    this.individualComments = '';
    this.showPaymentDialog = true;
  }

  openBatchPaymentDialog(): void {
    if (this.selectedApprovals.length === 0) {
      this.showErrorMessage('Please select at least one approval for batch payment.');
      return;
    }

    const total = this.getSelectedTotalAmount();
    const allowed = this.getAllowedPaymentMethods(total);

    this.batchPaidBy = this.employeeName;
    this.batchPaymentMethod = allowed[0].value;
    this.batchAmountTendered = total;
    this.batchChangeGiven = 0;
    this.batchComments = '';
    this.showBatchPaymentDialog = true;
  }

  openVoucherForm(): void {
    const total = this.selectedApproval
      ? this.selectedApproval.ApprovedAmount
      : this.getSelectedTotalAmount();

    this.voucherType = total <= 3000 ? 'petty' : 'check';

    // Auto-fill from DB (you can expand this later)
    const payeeName = this.selectedApproval?.PatientName ||
      (this.selectedApprovals.length === 1
        ? this.selectedApprovals[0].PatientName
        : 'Multiple Payees');

    this.voucherFormData = {
      voucherNo: this.generateVoucherNumber(),
      date: new Date().toLocaleDateString('en-GB'),
      payee: payeeName,
      amountWords: this.convertAmountToWords(total),
      amountFigure: total,
      reason: this.selectedApproval
        ? `Medical Reimbursement - ${this.selectedApproval.ReimbursementNumber}`
        : `Batch Medical Reimbursement (${this.getSelectedCount()} items)`,
      account: 'MED-EXP-001',
      budget: 'Medical Budget 2025',
      preparedBy: this.selectedApproval?.PreparedBy || this.employeeName,
      checkedBy: this.selectedApproval?.CheckedBy || this.employeeName,
      approvedBy: this.employeeName,
      cashier: this.employeeName,
      accountant: ''
    };

    this.showVoucherForm = true;
  }

  generateVoucherNumber(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `VC-${timestamp}-${random}`;
  }

  convertAmountToWords(amount: number): string {
    if (amount === 0) return 'Zero Birr Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    let words = '';
    let num = Math.floor(amount); // Work with whole number only
    let scaleIndex = 0;

    // Handle up to billions
    do {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkWords = this.convertChunkToWords(chunk, units, teens, tens);
        words = chunkWords + (scaleIndex > 0 ? ' ' + scales[scaleIndex] + ' ' : '') + words;
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    } while (num > 0);

    // Add decimal part (cents)
    const decimalPart = Math.round((amount - Math.floor(amount)) * 100);
    if (decimalPart > 0) {
      words += ' and ' + this.convertChunkToWords(decimalPart, units, teens, tens) + ' Cents';
    }

    return words.trim() + ' Birr Only';
  }

  // Helper: Convert numbers 1–999 to words
  private convertChunkToWords(num: number, units: string[], teens: string[], tens: string[]): string {
    let words = '';

    if (num >= 100) {
      words += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      words += teens[num - 10] + ' ';
      return words;
    }

    if (num > 0) {
      words += units[num] + ' ';
    }

    return words;
  }
  updateAmountWords(): void {
    const figure = parseFloat(this.voucherFormData.amountFigure.replace(/,/g, ''));
    if (!isNaN(figure)) {
      this.voucherFormData.amountWords = this.convertAmountToWords(figure);
    }
  }
  getAllowedPaymentMethods(amount: number): { value: string; label: string }[] {
    if (amount <= 3000) {
      return [{ value: 'Cash', label: 'Cash' }];
    } else {
      return [{ value: 'Check', label: 'Check' }];
    }
  }
  onPaymentMethodChange(type: 'individual' | 'batch'): void {
    const amount = type === 'individual'
      ? this.individualPaymentAmount
      : this.getSelectedTotalAmount();

    const allowed = this.getAllowedPaymentMethods(amount);
    const current = type === 'individual' ? this.individualPaymentMethod : this.batchPaymentMethod;

    // If current method is not allowed, auto-switch to the only valid one
    if (!allowed.some(m => m.value === current)) {
      const newMethod = allowed[0].value;
      if (type === 'individual') {
        this.individualPaymentMethod = newMethod;
        this.individualAmountTendered = this.individualPaymentAmount;
        this.calculateIndividualChange();
      } else {
        this.batchPaymentMethod = newMethod;
        this.batchAmountTendered = this.getSelectedTotalAmount();
        this.calculateBatchChange();
      }
    }
  }
  openReports(): void {
    this.router.navigate(['/xokaerp/en-us/cashier-reports']);
  }
  printVoucherForm(type: 'petty' | 'check'): void {
    const printId = type === 'petty' ? 'voucher-petty-print' : 'voucher-check-print';
    const element = document.getElementById(printId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type === 'petty' ? 'Petty Cash' : 'Check'} Voucher - ${this.voucherFormData.voucherNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          @media print { body { margin: 10mm; } }
          ${type === 'check' ? document.querySelector('style')?.innerHTML || '' : ''}
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  saveAsPDF(type: 'petty' | 'check'): void {
    const printId = type === 'petty' ? 'voucher-petty-print' : 'voucher-check-print';
    const element = document.getElementById(printId);
    if (!element) return;

    import('html2canvas').then(html2canvas => {
      import('jspdf').then(jsPDF => {
        const doc = new jsPDF.jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Add logo
        const logo = new Image();
        logo.src = this.companyInfo.logoUrl;
        logo.onload = () => {
          const logoWidth = 40;
          const logoHeight = 15;
          doc.addImage(logo, 'PNG', 10, 8, logoWidth, logoHeight);

          // Add company name (Amharic or English)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          const companyName = this.voucherLang === 'am' ? this.companyInfo.nameAm : this.companyInfo.nameEn;
          doc.text(companyName, pageWidth / 2, 15, { align: 'center' });

          doc.setFontSize(10);
          const address = this.voucherLang === 'am' ? this.companyInfo.addressAm : this.companyInfo.addressEn;
          doc.text(address, pageWidth / 2, 20, { align: 'center' });
          doc.text(this.companyInfo.phone, pageWidth / 2, 25, { align: 'center' });

          // Convert HTML to canvas
          html2canvas.default(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 35;

            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 45;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight + 35;
              doc.addPage();
              doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
              heightLeft -= pageHeight - 45;
            }

            doc.save(`${this.voucherFormData.voucherNo}_${type === 'petty' ? 'PettyCash' : 'Check'}.pdf`);
          });
        };
      });
    });
  }


  closePaymentDialog(): void {
    this.showPaymentDialog = false;
    this.selectedApproval = null;
    this.individualAmountTendered = 0;
    this.individualChangeGiven = 0;
  }

  closeBatchPaymentDialog(): void {
    this.showBatchPaymentDialog = false;
    this.selectedApprovals = [];
    this.filteredApprovals.forEach(a => a.selected = false);
    this.batchAmountTendered = 0;
    this.batchChangeGiven = 0;
  }

  closeVoucherForm(): void {
    this.showVoucherForm = false;
    this.voucherType = 'petty'; // Reset to default
    this.voucherFormData = {
      voucherNo: '',
      date: '',
      payee: '',
      amountWords: '',
      amountFigure: '',
      reason: '',
      account: '',
      budget: '',
      preparedBy: '',
      checkedBy: '',
      approvedBy: '',
      cashier: '',
      accountant: ''
    };
  }

  createIndividualPayment(): void {
    if (!this.selectedApproval || !this.individualPaidBy.trim()) {
      this.showErrorMessage('Please fill in all required fields.');
      return;
    }

    // Additional validation for cash payments
    if (this.individualPaymentMethod === 'Cash' && this.individualAmountTendered < this.individualPaymentAmount) {
      this.showErrorMessage('Amount tendered must be greater than or equal to payment amount for cash payments.');
      return;
    }

    const paymentData = {
      FinanceApprovalID: this.selectedApproval.FinanceApprovalID,
      ReimbursementID: this.selectedApproval.ReimbursementID,
      PaymentAmount: this.individualPaymentAmount,
      PaidBy: this.individualPaidBy,
      PaymentMethod: this.individualPaymentMethod,
      ReferenceNumber: this.individualReferenceNumber || null,
      Comments: this.individualComments || null,
      CreatedBy: this.currentUserId || 'Unknown',
      // Add cash-specific fields
      AmountTendered: this.individualPaymentMethod === 'Cash' ? this.individualAmountTendered : null,
      ChangeGiven: this.individualPaymentMethod === 'Cash' ? this.individualChangeGiven : null
    };

    this.medicalService.createCashierPayment(paymentData).subscribe(
      (response: any) => {
        this.showSuccessMessage('Payment created successfully');
        this.closePaymentDialog();
        this.loadApprovalsForPayment();
        this.loadPaymentSummary();
      },
      (error) => {
        console.error('Error creating payment:', error);
        this.showErrorMessage('Error creating payment. Please try again.');
      }
    );
  }

  createBatchPayment(): void {
    if (!this.batchPaidBy.trim()) {
      this.showErrorMessage('Please fill in all required fields.');
      return;
    }

    // Additional validation for cash payments
    const totalAmount = this.getSelectedTotalAmount();
    if (this.batchPaymentMethod === 'Cash' && this.batchAmountTendered < totalAmount) {
      this.showErrorMessage('Amount tendered must be greater than or equal to total payment amount for cash payments.');
      return;
    }

    const batchData = {
      FinanceApprovalIDs: this.selectedApprovals.map(a => a.FinanceApprovalID),
      PaidBy: this.batchPaidBy,
      PaymentMethod: this.batchPaymentMethod,
      Comments: this.batchComments || null,
      CreatedBy: this.currentUserId || 'Unknown',
      // Add cash-specific fields for batch
      AmountTendered: this.batchPaymentMethod === 'Cash' ? this.batchAmountTendered : null,
      ChangeGiven: this.batchPaymentMethod === 'Cash' ? this.batchChangeGiven : null
    };

    this.medicalService.createBatchCashierPayment(batchData).subscribe(
      (response: any) => {
        this.showSuccessMessage(`Batch payment created successfully for ${this.selectedApprovals.length} approvals`);
        this.closeBatchPaymentDialog();
        this.loadApprovalsForPayment();
        this.loadPaymentSummary();
      },
      (error) => {
        console.error('Error creating batch payment:', error);
        this.showErrorMessage('Error creating batch payment. Please try again.');
      }
    );
  }

  switchTab(tab: 'pending' | 'history' | 'reports'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadPaymentHistory();
    }
  }

  applyHistoryFilters(): void {
    this.loadPaymentHistory();
  }

  clearHistoryFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = '';
    this.loadPaymentHistory();
  }

  areAllSelected(): boolean {
    return this.filteredApprovals.length > 0 && this.filteredApprovals.every(a => a.selected);
  }

  getSelectedCount(): number {
    return this.filteredApprovals.filter(a => a.selected).length;
  }

  getSelectedTotalAmount(): number {
    return this.filteredApprovals
      .filter(a => a.selected)
      .reduce((sum, a) => sum + a.ApprovedAmount, 0);
  }

  isIndeterminate(): boolean {
    const selectedCount = this.getSelectedCount();
    return selectedCount > 0 && selectedCount < this.filteredApprovals.length;
  }

  private parseDate(value: any): Date {
    if (!value) return new Date();
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
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