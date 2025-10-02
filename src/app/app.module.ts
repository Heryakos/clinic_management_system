import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MedicalRequestComponent } from './components/medical-request/medical-request.component';
import { DoctorComponent } from './components/Doctor/Doctor.component';
import { LaboratoryComponent } from './components/laboratory/laboratory.component';
import { PharmacyComponent } from './components/pharmacy/pharmacy.component';
import { ExpenseReimbursementComponent } from './components/expense-reimbursement/expense-reimbursement.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { SickLeaveComponent } from './components/sick-leave/sick-leave.component';
import { ReportsComponent } from './components/reports/reports.component';
import { MedicalService } from './medical.service';
import { routes } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { NgxEchartsModule } from 'ngx-echarts';
import { UsersComponent } from './components/users/users.component';
import { PatientHistoryCardComponent } from './components/patient-history-card/patient-history-card.component';
import { InjectionComponent } from './components/injection/injection.component';
import { PatientAssignmentComponent } from './components/patient-assignment/patient-assignment.component';
import { PatientCardComponent } from './components/patient-card/patient-card.component';
import { PatientInfoCardComponent } from './components/patient-info-card/patient-info-card.component';
import { PatientMedicalHistoryComponent } from './components/patient-medical-history/patient-medical-history.component';
import { FilterByCategoryPipe } from './Pipe/filter-by-category.pipe';
import { MedicationTreeDropdownComponent } from './components/medication-tree-dropdown/medication-tree-dropdown.component';
import { LaboratoryReportDialogComponent } from './components/laboratory-report-dialog/laboratory-report-dialog.component';
import { SupervisorMedicalRequestsComponent } from './components/supervisor-medical-requests/supervisor-medical-requests.component';
import { PrescriptionPaperComponent } from './components/prescription-paper/prescription-paper.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClinicFormComponent } from './components/clinic-form/clinic-form.component';
import { ReasonTreeDropdownComponent } from './components/reason-tree-dropdown/reason-tree-dropdown.component';
import { ReferralModalComponent } from './components/referral-modal/referral-modal.component';
import { ReferralTabComponent } from './components/referral-tab/referral-tab.component';
import { NotificationCardComponent } from './components/notification-card/notification-card.component';
import { NotificationDialogComponent } from './components/notification-dialog/notification-dialog.component';
import { ImagePreviewDialogComponent } from './components/image-preview-dialog/image-preview-dialog.component';
import { StockSelectionDialogComponent } from './components/stock-selection-dialog/stock-selection-dialog.component';
import { SupervisorDashboardComponent } from './components/supervisor-dashboard/supervisor-dashboard.component';
import { ItemTreeDropdownComponent } from './components/item-tree-dropdown/item-tree-dropdown.component';
import { InventoryRequestComponent } from './components/inventory-request/inventory-request.component';
import { SupervisorInventoryComponent } from './components/supervisor-inventory/supervisor-inventory.component';
import { InventoryManagementComponent } from './components/inventory-management/inventory-management.component';
import { ItemReceivingComponent } from './components/item-receiving/item-receiving.component';
import { InjectionDetailsDialogComponent } from './components/injection-details-dialog/injection-details-dialog.component';
import { ReimbursementDocumentUploadComponent } from './components/reimbursement-document-upload/reimbursement-document-upload.component';
// import { StockRequestFormComponent } from './components/stock-request-form/stock-request-form.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    MedicalRequestComponent,
    DoctorComponent,
    LaboratoryComponent,
    PharmacyComponent,
    ExpenseReimbursementComponent,
    InventoryComponent,
    SickLeaveComponent,
    ReportsComponent,
    UsersComponent,
    // PatientHistoryCardComponent,
    InjectionComponent,
    PatientAssignmentComponent,
    PatientCardComponent,
    FilterByCategoryPipe,
    MedicationTreeDropdownComponent,
    LaboratoryReportDialogComponent,
    SupervisorMedicalRequestsComponent,
    PrescriptionPaperComponent,
    ClinicFormComponent,
    ReasonTreeDropdownComponent,
    ReferralModalComponent,
    ReferralTabComponent,
    NotificationCardComponent,
    NotificationDialogComponent,
    ImagePreviewDialogComponent,
    StockSelectionDialogComponent,
    SupervisorDashboardComponent,
    ItemTreeDropdownComponent,
    InventoryRequestComponent,
    SupervisorInventoryComponent,
    InventoryManagementComponent,
    ItemReceivingComponent,
    InjectionDetailsDialogComponent,
    ReimbursementDocumentUploadComponent,
    // StockRequestFormComponent
    // PatientMedicalHistoryComponent
    // PatientInfoCardComponent
  ],
  imports: [
    MatSnackBarModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    CommonModule,
    PatientHistoryCardComponent, // Moved to imports
    PatientInfoCardComponent, // Moved to imports
    PatientMedicalHistoryComponent, BrowserAnimationsModule
  ],
  providers: [
    MedicalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }