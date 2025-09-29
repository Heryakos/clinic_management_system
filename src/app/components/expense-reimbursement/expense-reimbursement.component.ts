import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { ExpenseReimbursement } from 'src/app/models/medical.model';


@Component({
  selector: 'app-expense-reimbursement',
  templateUrl: './expense-reimbursement.component.html',
  styleUrls: ['./expense-reimbursement.component.css']
})
export class ExpenseReimbursementComponent implements OnInit {
  expenseForm!: FormGroup;
  expenseReimbursements: ExpenseReimbursement[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadExpenseReimbursements();
  }

  initializeForm(): void {
    this.expenseForm = this.fb.group({
      patientName: ['', Validators.required],
      payrollNo: ['', Validators.required],
      department: ['', Validators.required],
      investigations: this.fb.array([this.createInvestigationGroup()])
    });
  }

  createInvestigationGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      location: ['', Validators.required],
      invoiceNo: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]]
    });
  }

  get investigationsFormArray(): FormArray {
    return this.expenseForm.get('investigations') as FormArray;
  }

  addInvestigation(): void {
    this.investigationsFormArray.push(this.createInvestigationGroup());
  }

  removeInvestigation(index: number): void {
    if (this.investigationsFormArray.length > 1) {
      this.investigationsFormArray.removeAt(index);
    }
  }

  calculateTotalAmount(): number {
    return this.investigationsFormArray.controls.reduce((total, control) => {
      const amount = control.get('amount')?.value || 0;
      return total + parseFloat(amount);
    }, 0);
  }

  loadExpenseReimbursements(): void {
    this.medicalService.getExpenseReimbursements().subscribe(
      reimbursements => this.expenseReimbursements = reimbursements
    );
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      this.isSubmitting = true;
      
      const newReimbursement: ExpenseReimbursement = {
        id: this.generateId(),
        patientName: this.expenseForm.value.patientName,
        payrollNo: this.expenseForm.value.payrollNo,
        department: this.expenseForm.value.department,
        investigations: this.expenseForm.value.investigations.map((inv: any) => ({
          description: inv.description,
          location: inv.location,
          invoiceNo: inv.invoiceNo
        })),
        totalAmount: this.calculateTotalAmount(),
        status: 'pending',
        submissionDate: new Date()
      };

      this.medicalService.createExpenseReimbursement(newReimbursement).subscribe(
        () => {
          this.isSubmitting = false;
          this.expenseForm.reset();
          this.initializeForm();
          this.loadExpenseReimbursements();
          alert('Expense reimbursement submitted successfully!');
        },
        error => {
          this.isSubmitting = false;
          alert('Error submitting reimbursement. Please try again.');
        }
      );
    }
  }

  updateReimbursementStatus(id: string, status: string): void {
    // This would typically call a service method to update the status
    const reimbursement = this.expenseReimbursements.find(r => r.id === id);
    if (reimbursement) {
      reimbursement.status = status as any;
    }
  }

  private generateId(): string {
    return 'EXP' + Date.now().toString();
  }
}