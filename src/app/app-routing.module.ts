import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './role.guard';
import { FinanceRoleGuard } from './finance-role.guard';
import { CashierRoleGuard } from './cashier-role.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MedicalRequestComponent } from './components/medical-request/medical-request.component';
import { DoctorComponent } from './components/Doctor/Doctor.component';
import { LaboratoryComponent } from './components/laboratory/laboratory.component';
import { PharmacyComponent } from './components/pharmacy/pharmacy.component';
import { ExpenseReimbursementComponent } from './components/expense-reimbursement/expense-reimbursement.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { SickLeaveComponent } from './components/sick-leave/sick-leave.component';
import { ReportsComponent } from './components/reports/reports.component';
import { UsersComponent } from './components/users/users.component';
import { PatientHistoryCardComponent } from './components/patient-history-card/patient-history-card.component';
import { InjectionComponent } from './components/injection/injection.component';
import { PatientAssignmentComponent } from './components/patient-assignment/patient-assignment.component';
import { SupervisorMedicalRequestsComponent } from './components/supervisor-medical-requests/supervisor-medical-requests.component';
import { NotificationCardComponent } from './components/notification-card/notification-card.component';
import { SupervisorDashboardComponent } from './components/supervisor-dashboard/supervisor-dashboard.component';
import { InventoryRequestComponent } from './components/inventory-request/inventory-request.component';
import { InventoryManagementComponent } from './components/inventory-management/inventory-management.component';
import { ItemReceivingComponent } from './components/item-receiving/item-receiving.component';
import { SupervisorInventoryComponent } from './components/supervisor-inventory/supervisor-inventory.component';
import { ReimbursementDocumentUploadComponent } from './components/reimbursement-document-upload/reimbursement-document-upload.component';
import { FinanceApprovalComponent } from './components/finance-approval/finance-approval.component';
import { CashierPaymentComponent } from './components/cashier-payment/cashier-payment.component';
import { CashierReportsComponent } from './components/cashier-reports/cashier-reports.component';
import { PatientHistoryComponent } from './components/patient-history/patient-history.component'; // Add this import
import { ClinicHistoryComponent } from './components/clinic-history/clinic-history.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';

// import { RedirectFhcerpComponent } from './redirect-fhcerp';

const routes: Routes = [
  // { path: '**', component: RedirectFhcerpComponent, pathMatch: 'full' },
  // PUBLIC (DNN-hosted)
  { path: 'clinic_request', component: MedicalRequestComponent },
  { path: 'reimbursement-document-upload', component: ReimbursementDocumentUploadComponent },
  {
    path: 'finance-approval',
    component: FinanceApprovalComponent,
    canActivate: [FinanceRoleGuard]   
  },
  {
    path: 'cashier-payment',
    component: CashierPaymentComponent,
    canActivate: [CashierRoleGuard]   
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  },  

  // PROTECTED (Angular App)
  {
    path: '',
    canActivate: [RoleGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'supervisor-medical-requests', component: SupervisorMedicalRequestsComponent },
      { path: 'supervisor-dashboard', component: SupervisorDashboardComponent },
      { path: 'patient-history-card', component: PatientHistoryCardComponent },
      { path: 'patient-assignment', component: PatientAssignmentComponent },
      { path: 'doctor', component: DoctorComponent },
      { path: 'laboratory', component: LaboratoryComponent },
      { path: 'pharmacy', component: PharmacyComponent },
      { path: 'injection', component: InjectionComponent },
      { path: 'patient-history', component: PatientHistoryComponent },

      // ← ADD THESE MISSING ONES
      { path: 'inventory', component: InventoryComponent },
      { path: 'supervisor-inventory', component: SupervisorInventoryComponent },
      { path: 'expense-reimbursement', component: ExpenseReimbursementComponent },  // Fixes Expenses
      { path: 'sick-leave', component: SickLeaveComponent },                        // Fixes Sick Leave
      { path: 'cashier-reports', component: CashierReportsComponent },              // Fixes Cashier Reports
      { path: 'notifications', component: NotificationCardComponent },              // Optional – if you want a full page

      // existing ones continue...
      { path: 'inventory-request', component: InventoryRequestComponent },
      { path: 'inventory-management', component: InventoryManagementComponent },
      { path: 'item-receiving', component: ItemReceivingComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'users', component: UsersComponent },
      // { path: 'finance-approval', component: FinanceApprovalComponent },
      // { path: 'cashier-payment', component: CashierPaymentComponent },
      { path: 'clinic-history', component: ClinicHistoryComponent }
    ]
  },

  { path: '**', redirectTo: 'clinic_request' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }