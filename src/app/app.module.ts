import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NgxEchartsModule } from 'ngx-echarts';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module'; // ← Import the MODULE, not 'routes'
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
import { ClinicFormComponent } from './components/clinic-form/clinic-form.component';
import { ReasonTreeDropdownComponent } from './components/reason-tree-dropdown/reason-tree-dropdown.component';
import { ReferralModalComponent } from './components/referral-modal/referral-modal.component';
import { ReferralTabComponent } from './components/referral-tab/referral-tab.component';
import { NotificationCardComponent } from './components/notification-card/notification-card.component';
import { NotificationDialogComponent } from './components/notification-dialog/notification-dialog.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { NotificationComposeComponent } from './components/notification-compose/notification-compose.component';
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
import { StockRequestFormComponent } from './components/stock-request-form/stock-request-form.component';
import { InjectionPaperComponent } from './components/injection-paper/injection-paper.component';
import { LucyCalendarDirective } from 'lucy-calendar';
import { EthiopianDatePickerComponent } from './components/ethiopian-date-picker/ethiopian-date-picker.component';
import { EthiopianDateAdapter } from './directive/ethiopian-date-adapter';
import { ClinicMedicalExpenseFormComponent } from './components/clinic-medical-expense-form/clinic-medical-expense-form.component';
import { InjectionManagementComponent } from './components/injection-management/injection-management.component';
import { WoundCarePaperComponent } from './components/wound-care-paper/wound-care-paper.component';
import { SuturingPaperComponent } from './components/suturing-paper/suturing-paper.component';
import { EarIrrigationPaperComponent } from './components/ear-irrigation-paper/ear-irrigation-paper.component';
import { FinanceApprovalComponent } from './components/finance-approval/finance-approval.component';
import { CashierPaymentComponent } from './components/cashier-payment/cashier-payment.component';
import { CashierReportsComponent } from './components/cashier-reports/cashier-reports.component';
import { SickLeaveViewerComponent } from './components/sick-leave-viewer/sick-leave-viewer.component';
import { EthiopianDatePipe } from './Pipe/ethiopian-date.pipe';
import { EthiopianTimePipe } from './Pipe/ethiopian-time.pipe';
import { PatientHistoryTimelineComponent } from './components/patient-history-timeline/patient-history-timeline.component';
import { PatientHistoryComponent } from './components/patient-history/patient-history.component';
import { InventoryRequestFormComponent } from './components/inventory-request-form/inventory-request-form.component';
import { AddTherapeuticCategoryDialogComponent } from './components/add-therapeutic-category-dialog/add-therapeutic-category-dialog.component';
import { ConfirmDispenseDialogComponent } from './components/confirm-dispense-dialog/confirm-dispense-dialog.component';
import { RejectAssignmentDialogComponent } from './components/reject-assignment-dialog/reject-assignment-dialog.component';
import { ReimbursementDocumentsViewerComponent } from './components/reimbursement-documents-viewer/reimbursement-documents-viewer.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';


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
    NotificationBellComponent,
    NotificationComposeComponent,
    ImagePreviewDialogComponent,
    StockSelectionDialogComponent,
    SupervisorDashboardComponent,
    ItemTreeDropdownComponent,
    InventoryRequestComponent,
    SupervisorInventoryComponent,
    InventoryManagementComponent,
    ItemReceivingComponent,
    InjectionDetailsDialogComponent,
    InjectionPaperComponent,
    ClinicMedicalExpenseFormComponent,
    InjectionManagementComponent,
    WoundCarePaperComponent,
    SuturingPaperComponent,
    EarIrrigationPaperComponent,
    FinanceApprovalComponent,
    CashierPaymentComponent,
    CashierReportsComponent,
    SickLeaveViewerComponent,
    EthiopianDatePipe,
    EthiopianTimePipe,
    ReimbursementDocumentUploadComponent,
    PatientHistoryTimelineComponent,
    PatientHistoryComponent,
    InventoryRequestFormComponent,
    AddTherapeuticCategoryDialogComponent,
    RejectAssignmentDialogComponent,
    ReimbursementDocumentsViewerComponent,
    AccessDeniedComponent,
    // ConfirmDispenseDialogComponent,
    // Add any other non-standalone components here
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    AppRoutingModule, // ← This imports the routes correctly

    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),

    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,                    
    MatProgressSpinnerModule,

    // Standalone components / directives
    PatientHistoryCardComponent,
    PatientInfoCardComponent,
    PatientMedicalHistoryComponent,
    StockRequestFormComponent,
    LucyCalendarDirective,
    EthiopianDatePickerComponent,
  ],
  providers: [
    MedicalService,
    EthiopianDateAdapter
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }