import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  activeTab: 'pending' | 'history' = 'pending';

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
    private cdr: ChangeDetectorRef
  ) {}

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
    console.log('Opening dialog for approval:', approval);
    
    if (!approval) {
      console.error('No approval provided to dialog');
      this.showErrorMessage('No approval data found');
      return;
    }
  
    this.selectedApproval = approval;
    this.individualPaymentAmount = approval.ApprovedAmount;
    this.individualPaidBy = this.employeeName;
    this.individualPaymentMethod = 'Cash';
    this.individualReferenceNumber = '';
    this.individualComments = '';
    this.individualAmountTendered = approval.ApprovedAmount;
    this.individualChangeGiven = 0;
    this.showPaymentDialog = true;
    
    console.log('Dialog data set:', {
      selectedApproval: this.selectedApproval,
      paymentAmount: this.individualPaymentAmount
    });
  }

  openBatchPaymentDialog(): void {
    if (this.selectedApprovals.length === 0) {
      this.showErrorMessage('Please select at least one approval for batch payment.');
      return;
    }
    
    this.batchPaidBy = this.employeeName;
    this.batchPaymentMethod = 'Cash';
    this.batchComments = '';
    this.batchAmountTendered = this.getSelectedTotalAmount();
    this.batchChangeGiven = 0;
    this.showBatchPaymentDialog = true;
  }

  openVoucherForm(): void {
    // Auto-fill with available data
    this.voucherFormData = {
      voucherNo: this.generateVoucherNumber(),
      date: new Date().toLocaleDateString('en-GB'),
      payee: this.selectedApproval?.PatientName || 
             (this.selectedApprovals.length === 1 ? this.selectedApprovals[0]?.PatientName : 'Multiple Payees'),
      amountWords: this.selectedApproval ? 
        this.convertAmountToWords(this.selectedApproval.ApprovedAmount) : 
        this.convertAmountToWords(this.getSelectedTotalAmount()),
      amountFigure: this.selectedApproval ? 
        this.selectedApproval.ApprovedAmount : 
        this.getSelectedTotalAmount(),
      reason: this.selectedApproval ? 
        `Medical Expense Reimbursement - ${this.selectedApproval.ReimbursementNumber}` :
        `Batch Medical Expense Reimbursement - ${this.getSelectedCount()} payments`,
      account: 'MED-EXP-001',
      budget: 'Medical Budget 2024',
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
    // Simple number to words conversion for Ethiopian Birr
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero Birr Only';
    
    let words = '';
    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);
    
    // Convert whole part
    if (wholePart >= 1000) {
      words += units[Math.floor(wholePart / 1000)] + ' Thousand ';
      amount %= 1000;
    }
    
    if (wholePart >= 100) {
      words += units[Math.floor(wholePart / 100)] + ' Hundred ';
      amount %= 100;
    }
    
    if (wholePart >= 20) {
      words += tens[Math.floor(wholePart / 10)] + ' ';
      amount %= 10;
    } else if (wholePart >= 10) {
      words += teens[wholePart - 10] + ' ';
      amount = 0;
    }
    
    if (wholePart > 0 && wholePart < 10) {
      words += units[wholePart] + ' ';
    }
    
    words += 'Birr';
    
    // Convert decimal part
    if (decimalPart > 0) {
      words += ' and ';
      if (decimalPart >= 20) {
        words += tens[Math.floor(decimalPart / 10)] + ' ';
        words += units[decimalPart % 10] + ' ';
      } else if (decimalPart >= 10) {
        words += teens[decimalPart - 10] + ' ';
      } else {
        words += units[decimalPart] + ' ';
      }
      words += 'Cents';
    }
    
    return words + ' Only';
  }

  printVoucherForm(): void {
    const voucherElement = document.getElementById('voucher-form-print');
    if (voucherElement) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Petty Cash Payment Voucher - ${this.voucherFormData.voucherNo}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  background: #f8f9fa; 
                  margin: 40px; 
                }
                .voucher { 
                  background: #fff; 
                  border: 2px solid #000; 
                  padding: 20px 30px; 
                  max-width: 800px; 
                  margin: auto; 
                }
                h2 { 
                  text-align: center; 
                  text-transform: uppercase; 
                  margin-bottom: 5px; 
                }
                .sub-header { 
                  text-align: center; 
                  font-weight: bold; 
                  margin-bottom: 20px; 
                }
                .row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 10px; 
                }
                label { 
                  font-weight: bold; 
                  width: 180px; 
                  display: inline-block; 
                }
                .value { 
                  border-bottom: 1px solid #999; 
                  padding: 4px; 
                  flex: 1; 
                  margin-left: 10px; 
                  min-height: 20px;
                }
                .col { 
                  width: 48%; 
                }
                .footer { 
                  margin-top: 25px; 
                  border-top: 1px solid #000; 
                  padding-top: 10px; 
                  font-size: 14px; 
                }
                .signature { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-top: 25px; 
                }
                .signature div { 
                  width: 30%; 
                  text-align: center; 
                }
                .signature div p { 
                  border-top: 1px solid #000; 
                  margin-top: 50px; 
                  padding-top: 5px; 
                }
                @media print { 
                  body { margin: 0; background: white; }
                  .no-print { display: none; }
                  .voucher { border: 2px solid #000; box-shadow: none; }
                }
              </style>
            </head>
            <body>
              ${voucherElement.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  }

  saveAsPDF(): void {
    // For now, use print functionality
    // You can implement proper PDF generation here using libraries like html2pdf.js or jspdf
    this.printVoucherForm();
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

  switchTab(tab: 'pending' | 'history'): void {
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