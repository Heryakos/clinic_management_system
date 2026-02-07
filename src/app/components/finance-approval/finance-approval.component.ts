import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface FinanceApproval {
  FinanceApprovalID: number;
  ReimbursementID: number;
  ReimbursementNumber: string;
  PatientName: string;
  PayrollNumber: string;
  Department: string;
  TotalAmount: number;
  ApprovedAmount: number;
  Status: string;
  SubmissionDate: Date;
  Comments?: string;
  CreatedBy: string;
  CreatedDate: Date;
  selected?: boolean;
}

export interface FinanceApprovalDetail {
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
}

@Component({
  selector: 'app-finance-approval',
  templateUrl: './finance-approval.component.html',
  styleUrls: ['./finance-approval.component.css']
})
export class FinanceApprovalComponent implements OnInit {
  showDocumentsModal: boolean = false;
  currentViewedReimbursementId: number = 0;
  currentViewedReimbursementNumber: string = '';
  approvedReimbursements: FinanceApproval[] = [];
  filteredReimbursements: FinanceApproval[] = [];
  pendingApprovals: any[] = [];
  filteredPendingApprovals: any[] = [];
  searchTerm: string = '';
  searchTermPending: string = '';
  showBatchApprovalDialog: boolean = false;
  showApprovalDialog: boolean = false;
  showPendingApprovalDialog: boolean = false;
  selectedReimbursement: FinanceApproval | null = null;
  selectedReimbursements: FinanceApproval[] = [];
  selectedPendingApproval: any = null;
  selectedPendingApprovals: any[] = [];
  isLoading: boolean = true;
  activeTab: 'new' | 'pending' = 'new';
  approvalApprovedBy: string = '';

  // User data
  currentUserId: string | null = null;
  employeeName: string = 'Unknown';
  payrollNumber: string | null = null;

  // Batch approval form
  batchName: string = '';
  preparedBy: string = '';
  checkedBy: string = '';
  batchComments: string = '';

  // Individual approval form
  individualApprovedAmount: number = 0;
  individualPreparedBy: string = '';
  individualCheckedBy: string = '';
  individualComments: string = '';

  constructor(
    public medicalService: MedicalService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadApprovedReimbursements();
    this.loadPendingApprovals();
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
          this.preparedBy = this.employeeName;
          this.checkedBy = this.employeeName;
          this.individualPreparedBy = '';
          this.individualCheckedBy = this.employeeName;
          this.approvalApprovedBy = this.employeeName;
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

  switchTab(tab: 'new' | 'pending'): void {
    this.activeTab = tab;
    if (tab === 'pending') {
      this.loadPendingApprovals();
    } else {
      this.loadApprovedReimbursements();
    }
  }

  loadPendingApprovals(): void {
    this.isLoading = true;
    this.medicalService.getPendingFinanceApprovals().subscribe(
      (approvals) => {
        console.log('Pending Finance Approvals:', approvals);
        this.pendingApprovals = (approvals as any[]).map((a: any) => ({
          FinanceApprovalID: a.financeApprovalID || a.FinanceApprovalID,
          ReimbursementID: a.reimbursementID || a.ReimbursementID,
          ReimbursementNumber: a.reimbursementNumber || a.ReimbursementNumber,
          PatientName: a.patientName || a.PatientName,
          PayrollNumber: a.payrollNumber || a.PayrollNumber,
          Department: a.department || a.Department,
          TotalAmount: a.totalAmount || a.TotalAmount || 0,
          ApprovedAmount: a.approvedAmount || a.TotalAmount || 0,
          PreparedBy: a.preparedBy || a.PreparedBy,
          CheckedBy: a.checkedBy || a.CheckedBy,
          PreparedDate: this.parseDate(a.preparedDate || a.PreparedDate),
          CheckedDate: this.parseDate(a.checkedDate || a.CheckedDate),
          Status: a.status || a.Status || 'Pending',
          Comments: a.comments || a.Comments,
          createdBy: a.createdBy || a.CreatedBy || this.currentUserId || 'Unknown',
          createdDate: this.parseDate(a.createdDate || a.CreatedDate),
          selected: false
        }));
        this.filteredPendingApprovals = [...this.pendingApprovals];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading pending approvals:', error);
        this.showErrorMessage('Failed to load pending approvals');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  filterPendingApprovals(): void {
    const term = this.searchTermPending.toLowerCase();
    this.filteredPendingApprovals = this.pendingApprovals.filter(
      (a) =>
        a.PayrollNumber?.toLowerCase().includes(term) ||
        a.PatientName.toLowerCase().includes(term) ||
        a.ReimbursementNumber.toLowerCase().includes(term)
    );
  }

  loadApprovedReimbursements(): void {
    this.isLoading = true;
    this.medicalService.getFinanceApprovedReimbursements().subscribe(
      (reimbursements) => {
        console.log('Finance Approved Reimbursements:', reimbursements);

        this.approvedReimbursements = (reimbursements as any[]).map((r: any) => ({
          FinanceApprovalID:r.financeApprovalID || r.FinanceApprovalID,
          ReimbursementID: r.reimbursementID || r.ReimbursementID,
          ReimbursementNumber: r.reimbursementNumber || r.ReimbursementNumber,
          PatientName: r.patientName || r.PatientName,
          PayrollNumber: r.payrollNumber || r.PayrollNumber,
          Department: r.department || r.Department,
          TotalAmount: r.totalAmount || r.TotalAmount || 0,
          ApprovedAmount: r.approvedAmount || r.TotalAmount || 0,
          Status: r.status || r.Status || 'Approved',
          SubmissionDate: this.parseDate(r.submissionDate || r.SubmissionDate),
          Comments: r.comments || r.Comments,
          CreatedBy: r.createdBy || r.CreatedBy || this.currentUserId || 'Unknown',
          CreatedDate: this.parseDate(r.createdDate || r.CreatedDate),
          selected: false
        }));

        this.filteredReimbursements = [...this.approvedReimbursements];
        console.log('Mapped reimbursements:', this.filteredReimbursements);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading approved reimbursements:', error);
        this.showErrorMessage('Failed to load approved reimbursements');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  openDocumentsModal(reimbursementId: number): void {
    // Optional: find the number for better title
    const found = this.approvedReimbursements.find(r => r.ReimbursementID === reimbursementId) ||
      this.pendingApprovals.find(a => a.ReimbursementID === reimbursementId);

    this.currentViewedReimbursementId = reimbursementId;
    this.currentViewedReimbursementNumber = found?.ReimbursementNumber || 'Unknown';

    this.showDocumentsModal = true;
  }

  // Close method
  closeDocumentsModal(): void {
    this.showDocumentsModal = false;
    this.currentViewedReimbursementId = 0;
    this.currentViewedReimbursementNumber = '';
  }

  filterReimbursements(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReimbursements = this.approvedReimbursements.filter(
      (r) =>
        r.PayrollNumber?.toLowerCase().includes(term) ||
        r.PatientName.toLowerCase().includes(term) ||
        r.ReimbursementNumber.toLowerCase().includes(term)
    );
  }

  toggleSelection(reimbursement: FinanceApproval): void {
    reimbursement.selected = !reimbursement.selected;
    this.updateSelectedReimbursements();
  }

  toggleSelectAll(): void {
    const allSelected = this.filteredReimbursements.every(r => r.selected);
    this.filteredReimbursements.forEach(r => r.selected = !allSelected);
    this.updateSelectedReimbursements();
  }

  updateSelectedReimbursements(): void {
    this.selectedReimbursements = this.filteredReimbursements.filter(r => r.selected);
  }

  openIndividualApprovalDialog(reimbursement: FinanceApproval): void {
    this.selectedReimbursement = reimbursement;
    this.individualApprovedAmount = reimbursement.ApprovedAmount || reimbursement.TotalAmount || 0;
    this.individualPreparedBy = this.employeeName;
    this.individualCheckedBy = this.employeeName;
    this.individualComments = '';
    this.showApprovalDialog = true;
  }

  trackByReimbursement(index: number, reimbursement: FinanceApproval): number {
    return reimbursement.ReimbursementID;
  }

  trackByPendingApproval(index: number, approval: any): number {
    return approval.FinanceApprovalID;
  }

  openBatchApprovalDialog(): void {
    if (this.selectedReimbursements.length === 0) {
      this.showErrorMessage('Please select at least one reimbursement for batch approval.');
      return;
    }

    this.batchName = `Batch Approval - ${new Date().toLocaleDateString()}`;
    this.preparedBy = this.employeeName;
    this.checkedBy = this.employeeName;
    this.batchComments = '';
    this.showBatchApprovalDialog = true;
  }

  closeApprovalDialog(): void {
    this.showApprovalDialog = false;
    this.selectedReimbursement = null;
  }

  closeBatchApprovalDialog(): void {
    this.showBatchApprovalDialog = false;
    this.selectedReimbursements = [];
    this.filteredReimbursements.forEach(r => r.selected = false);
  }

  createIndividualApproval(): void {
    if (!this.selectedReimbursement || this.individualApprovedAmount <=0) {
      this.showErrorMessage('Please enter a valid approved amount.')
      return;
    }
    // if (!this.selectedReimbursement || !this.individualPreparedBy.trim() || !this.individualCheckedBy.trim()) {
    //   this.showErrorMessage('Please fill in all required fields.');
    //   return;
    // }

    const approvalData = {
      ReimbursementID: this.selectedReimbursement.ReimbursementID,
      ApprovedAmount: this.individualApprovedAmount,
      PreparedBy: null,
      CheckedBy: this.individualCheckedBy,
      Comments: this.individualComments,
      CreatedBy: this.currentUserId || 'Unknown'
    };

    this.medicalService.createFinanceApproval(approvalData).subscribe(
      (response: any) => {
        console.log('doseresponse',response);
        this.showSuccessMessage('Finance approval created successfully');
        this.closeApprovalDialog();
        this.loadApprovedReimbursements();
      },
      (error) => {
        console.error('Error creating finance approval:', error);
        this.showErrorMessage('Error creating finance approval. Please try again.');
      }
    );
  }

  createBatchApproval(): void {
    if (!this.batchName.trim() || !this.preparedBy.trim() || !this.checkedBy.trim()) {
      this.showErrorMessage('Please fill in all required fields.');
      return;
    }

    const batchData = {
      ReimbursementIDs: this.selectedReimbursements.map(r => r.ReimbursementID),
      PreparedBy: null,
      CheckedBy: this.checkedBy,
      BatchName: this.batchName,
      CreatedBy: this.currentUserId || 'Unknown'
    };

    this.medicalService.createBatchFinanceApproval(batchData).subscribe(
      (response: any) => {
        this.showSuccessMessage(`Batch approval created successfully for ${this.selectedReimbursements.length} reimbursements`);
        this.closeBatchApprovalDialog();
        this.loadApprovedReimbursements();
      },
      (error) => {
        console.error('Error creating batch finance approval:', error);
        this.showErrorMessage('Error creating batch finance approval. Please try again.');
      }
    );
  }

  togglePendingSelection(approval: any): void {
    approval.selected = !approval.selected;
    this.updateSelectedPendingApprovals();
  }

  toggleSelectAllPending(): void {
    const allSelected = this.filteredPendingApprovals.every(a => a.selected);
    this.filteredPendingApprovals.forEach(a => a.selected = !allSelected);
    this.updateSelectedPendingApprovals();
  }

  updateSelectedPendingApprovals(): void {
    this.selectedPendingApprovals = this.filteredPendingApprovals.filter(a => a.selected);
  }

  areAllPendingSelected(): boolean {
    return this.filteredPendingApprovals.length > 0 && this.filteredPendingApprovals.every(a => a.selected);
  }

  getPendingSelectedCount(): number {
    return this.filteredPendingApprovals.filter(a => a.selected).length;
  }

  isPendingIndeterminate(): boolean {
    const selectedCount = this.getPendingSelectedCount();
    return selectedCount > 0 && selectedCount < this.filteredPendingApprovals.length;
  }

  openApprovePendingDialog(approval: any): void {
    this.selectedPendingApproval = approval;
    this.approvalApprovedBy = this.employeeName;
    this.showPendingApprovalDialog = true;
  }

  closeApprovePendingDialog(): void {
    this.showPendingApprovalDialog = false;
    this.selectedPendingApproval = null;
    this.approvalApprovedBy = this.employeeName;
  }

  approvePendingApproval(): void {
    if (!this.selectedPendingApproval || !this.approvalApprovedBy.trim()) {
      this.showErrorMessage('Please enter the approver name.');
      return;
    }

    this.medicalService.approveFinanceApproval(
      this.selectedPendingApproval.FinanceApprovalID,
      this.approvalApprovedBy
    ).subscribe(
      (response: any) => {
        this.showSuccessMessage('Finance approval approved successfully');
        this.closeApprovePendingDialog();
        this.loadPendingApprovals();
      },
      (error) => {
        console.error('Error approving finance approval:', error);
        this.showErrorMessage('Error approving finance approval. Please try again.');
      }
    );
  }
  rejectIndividualApproval(): void {
    if (!this.selectedReimbursement) {
      this.showErrorMessage('No reimbursement selected.');
      return;
    }

    const reason = this.individualComments.trim() || 'Rejected by finance -no reason provided'
    if (!confirm(`Reject this approval?\nReason: ${reason}`)){
      return;
    }

    // Call reject endpoint (we'll create it next)
    const rejectData = {
      FinanceApprovalID: this.selectedReimbursement.FinanceApprovalID || 0,
      ReimbursementID:this.selectedReimbursement.ReimbursementID,
      Status:'Rejected',
      Comments: this.individualComments || 'Rejected by finance',
      RejectedBy: this.employeeName
    };

    this.medicalService.rejectFinanceApproval(rejectData).subscribe(
      () => {
        this.showSuccessMessage('Finance approval rejected successfully');
        this.closeApprovalDialog();
        this.loadApprovedReimbursements(); // Refresh list
      },
      (error) => {
        console.error('Reject failed:', error);
        this.showErrorMessage('Failed to reject approval');
      }
    );
  }
  approveBatchPendingApprovals(): void {
    if (this.selectedPendingApprovals.length === 0) {
      this.showErrorMessage('Please select at least one approval to approve.');
      return;
    }

    if (!this.approvalApprovedBy.trim()) {
      this.showErrorMessage('Please enter the approver name.');
      return;
    }

    const financeApprovalIDs = this.selectedPendingApprovals.map(a => a.FinanceApprovalID);

    this.medicalService.approveBatchFinanceApprovals(
      financeApprovalIDs,
      this.approvalApprovedBy
    ).subscribe(
      (response: any) => {
        this.showSuccessMessage(`Successfully approved ${response.approvedCount || this.selectedPendingApprovals.length} finance approvals`);
        this.approvalApprovedBy = this.employeeName;
        this.selectedPendingApprovals = [];
        this.filteredPendingApprovals.forEach(a => a.selected = false);
        this.loadPendingApprovals();
      },
      (error) => {
        console.error('Error approving batch finance approvals:', error);
        this.showErrorMessage('Error approving batch finance approvals. Please try again.');
      }
    );
  }

  areAllSelected(): boolean {
    return this.filteredReimbursements.length > 0 && this.filteredReimbursements.every(r => r.selected);
  }

  getSelectedCount(): number {
    return this.filteredReimbursements.filter(r => r.selected).length;
  }

  getSelectedTotalAmount(): number {
    return this.filteredReimbursements
      .filter(r => r.selected)
      .reduce((sum, r) => sum + r.ApprovedAmount, 0);
  }

  isIndeterminate(): boolean {
    const selectedCount = this.getSelectedCount();
    return selectedCount > 0 && selectedCount < this.filteredReimbursements.length;
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