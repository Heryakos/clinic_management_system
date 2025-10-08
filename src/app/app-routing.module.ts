import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './role.guard';
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

export const routes: Routes = [
  { path: '', redirectTo: '/medical-request', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '5b574f73-d45d-416d-a029-67f9fc0de049' },
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '5b574f73-d45d-416d-a029-67f9fc0de049' },
  },
  {
    path: 'supervisor-medical-requests',
    component: SupervisorMedicalRequestsComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '96c1ab25-d15c-42cf-92ff-9f041ae6ae10' },
  },
  {
    path: 'supervisor-dashboard',
    component: SupervisorDashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7' },
  },
  {
    path: 'medical-request',
    component: MedicalRequestComponent,
  },
  {
    path: 'reimbursement-document-upload',
    component: ReimbursementDocumentUploadComponent,
  },
  {
    path: 'patient-history-card',
    component: PatientHistoryCardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'cc1afad4-4cd7-435a-b100-fc6b62f264d1' },
  },
  {
    path: 'patient-assignment',
    component: PatientAssignmentComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '27aaf22f-40c3-444f-a17a-364b8b2abafc' },
  },
  {
    path: 'doctor',
    component: DoctorComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7' },
  },
  {
    path: 'laboratory',
    component: LaboratoryComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '2c27c2f5-f0af-4e88-8e93-d09bcbc77731' },
  },
  {
    path: 'pharmacy',
    component: PharmacyComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'injection',
    component: InjectionComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '095e17ff-4497-4fa0-8be9-74dc4979de58' },
  },
  {
    path: 'expense-reimbursement',
    component: ExpenseReimbursementComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7' }, // Updated to doctor role
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'inventory-request',
    component: InventoryRequestComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'inventory-management',
    component: InventoryManagementComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'item-receiving',
    component: ItemReceivingComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'supervisor-inventory',
    component: SupervisorInventoryComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8' },
  },
  {
    path: 'sick-leave',
    component: SickLeaveComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'unknown' },
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: 'ef06de41-276b-496f-b966-16849fe629f5' },
  },
  {
    path: 'notifications',
    component: NotificationCardComponent,
    canActivate: [RoleGuard],
    data: { expectedRole: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7' },
  },
  { path: '**', redirectTo: '/medical-request' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}