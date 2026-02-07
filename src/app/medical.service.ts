import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MedicalRequest, MedicalRequestView, SickLeave, InventoryItem, InventoryRequest, ExpenseReimbursement, ExpenseReimbursementDetail, PatientMedicalHistory } from './models/medical.model';
import { environment } from '../environments/environment';
import { MedicationCategory, MedicationSelection } from './components/medication-tree-dropdown/medication-tree-dropdown.component';
import { ReasonCategory, ReasonSelection } from './components/reason-tree-dropdown/reason-tree-dropdown.component';
import { Referral, ReferralFormData, ReferralStatusUpdate } from './components/interfaces/patient.interface';
import { PurchaseRequest, ItemRegistration, RoomCategory, InventoryCategory, InventoryItemenhanced, InventoryPurchaseRequest, InventoryRequestEnhanced, InventoryRequestDetail, SupervisorRequest } from './models/inventory-enhanced.model';
import { AdministerInjectionRequest } from './models/injection.model';
import { WoundCare, Suturing, EarIrrigation, WoundCareRequest, SuturingRequest, EarIrrigationRequest, ProcedureStatusUpdate, AdministerProcedureRequest } from './models/procedure.models';

// Interface definitions to resolve errors and support components
interface ItemCategory {
  categoryID: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  items: InventoryItemenhanced[];
}

interface ItemSelection {
  itemId: number | string; // Allow both number and string to resolve type mismatch
  itemName: string;
  categoryName: string;
  unit: string;
  currentStock: number;
}

export interface ReimbursementDocument {
  documentID: number;
  reimbursementId: number;
  description: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  uploadedBy: string;
}
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
// interface InventoryRequestDetail {
//   itemID: string;
//   itemName: string;
//   unit: string;
//   quantity: number;
//   jobOrderNo?: string;
//   currentStock?: number; // Added to resolve SupervisorDashboard errors
// }

@Injectable({
  providedIn: 'root'
})
export class MedicalService {
  // private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private chmsMedicalRequestsBase = environment.rootPath2 + 'CHMS_MedicalRequests/';
  private chmsDashboardBase = environment.rootPath2 + 'CHMS_Dashboard/';
  private chmsEmployeesBase = environment.rootPath2 + 'CHMS_Employees/';
  private chmsExpenseReimbursementBase = environment.rootPath2 + 'CHMS_ExpenseReimbursement/';
  private chmsInventoryBase = environment.rootPath2 + 'CHMS_Inventory/';
  private chmsLaboratoryBase = environment.rootPath2 + 'CHMS_Laboratory/';
  private chmsPatientsBase = environment.rootPath2 + 'CHMS_Patients/';
  private chmsPharmacyBase = environment.rootPath2 + 'CHMS_Pharmacy/';
  private chmsReportsBase = environment.rootPath2 + 'CHMS_Reports/';
  private chmsSickLeaveBase = environment.rootPath2 + 'CHMS_SickLeave/';
  private chmsUsersBase = environment.rootPath2 + 'CHMS_Users/';
  private chmsNotificationsBase = environment.rootPath2 + 'CHMS_Notifications/';
  private CHMSInjectionBase = environment.rootPath2 + 'CHMS_Injection/';
  private CEmployee = environment.rootPath2 + 'HRA/CEmployee/';
  private chmsPatientAssignmentsBase = environment.rootPath2 + 'CHMS_PatientAssignments/';
  private chmsCHMSPatientMedicalHistoryBase = environment.rootPath2 + 'CHMS_PatientMedicalHistory/';
  private chmsCHMSRoomInventoryBase = environment.rootPath2 + 'CHMS_RoomInventory/';
  private chmsReferralBase = environment.rootPath2 + 'CHMS_Referral/';
  private chmsReferralsBase = environment.rootPath2 + 'CHMS_Referrals/';
  private roleBase = environment.rootPath2 + 'CHMS_RoleidByUserName/';
  private bonusPaymentBase = environment.rootPath2 + 'BonusPayment/';
  private chmsReimbursementDocumentsBase = environment.rootPath2 + 'CHMS_ReimbursementDocuments/';
  private chmsWoundCareBase = environment.rootPath2 + 'CHMS_Procedures/wound-care/';
  private chmsSuturingBase = environment.rootPath2 + 'CHMS_Procedures/suturing/';
  private chmsEarIrrigationBase = environment.rootPath2 + 'CHMS_Procedures/ear-irrigation/';
  private chmsProceduresBase = environment.rootPath2 + 'CHMS_Procedures/';
  private chmsFinanceBase = environment.rootPath2 + 'CHMS_Finance/';
  private chmsCashierBase = environment.rootPath2 + 'CHMS_Cashier/';
  private EmployeeProfile = environment.rootPath2 + 'EmployeeProfile';
  private CHMSPatientHistory = environment.rootPath2 + 'CHMS_PatientHistory/';
  private userRoleIdsSubject = new BehaviorSubject<string[]>([]);
  userRoleIds$ = this.userRoleIdsSubject.asObservable();

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  getClinicHistory(params: {
    employeeIdOrCard?: string;
    fromDate?: string;
    toDate?: string;
    mode?: 'DETAIL' | 'DEPARTMENT' | 'MONTHLY' | 'SUMMARY';
    includePending?: boolean;
    includeCompleted?: boolean;
    organizationCode?: string;     // ← add this
    departmentCode?: string;       // ← add this
  }): Observable<any[]> {
    let httpParams = new HttpParams();
  
    if (params.employeeIdOrCard) {
      httpParams = httpParams.set('employeeIdOrCard', params.employeeIdOrCard.trim());
    }
    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate);
    }
    if (params.mode) {
      httpParams = httpParams.set('mode', params.mode);
    }
    if (params.organizationCode) {
      httpParams = httpParams.set('organizationCode', params.organizationCode);
    }
    if (params.departmentCode) {
      httpParams = httpParams.set('departmentCode', params.departmentCode);
    }
    httpParams = httpParams.set('includePending', (params.includePending ?? true).toString());
    httpParams = httpParams.set('includeCompleted', (params.includeCompleted ?? true).toString());
  
    const url = `${environment.rootPath2}clinic-history`;
  
    return this.http.get<any[]>(url, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Clinic history fetch error:', error);
        let msg = 'Failed to load clinic history';
        if (error.status === 404) msg = 'No records found';
        else if (error.status === 400) msg = error.error?.message || 'Invalid parameters';
        return throwError(() => new Error(msg));
      })
    );
  }
  // Get all organizations
getOrganizations(): Observable<any[]> {
  const url = `${environment.rootPath2}clinic-history/organizations`;
  return this.http.get<any[]>(url).pipe(
    catchError(err => {
      console.error('Failed to load organizations', err);
      return throwError(() => new Error('Could not load organizations'));
    })
  );
}

// Get departments for a specific organization
getDepartments(organizationCode: string): Observable<any[]> {
  const url = `${environment.rootPath2}clinic-history/departments`;
  let params = new HttpParams().set('organizationCode', organizationCode);
  return this.http.get<any[]>(url, { params }).pipe(
    catchError(err => {
      console.error('Failed to load departments', err);
      return throwError(() => new Error('Could not load departments'));
    })
  );
}

  constructor(private http: HttpClient) { }

  // private handleError(error: any): Observable<never> {
  //   let errorMessage = 'An error occurred';
  //   if (error.error instanceof ErrorEvent) {
  //     errorMessage = `Error: ${error.error.message}`;
  //   } else {
  //     errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
  //   }
  //   console.error('Service Error:', errorMessage);
  //   return throwError(() => new Error(errorMessage));
  // }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
  getUserIdFromUsername(): Observable<string | null> {
    if (!environment.username) {
      console.error('No username defined in environment');
      return from([null]);
    }
    return this.getEmployeeById(environment.username).pipe(
      map((response: any) => {
        const employee = response?.c_Employees?.[0] || response?.[0];
        return employee?.user_ID ?? null;
      }),
      catchError((error) => {
        console.error('Error fetching user ID:', error);
        return from([null]);
      })
    );
  }

  // Helper method for mock data (add this private method to MedicalService)
  private generateMockTrends(): any[] {
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.floor(Math.random() * 8000) + 2000
      });
    }

    return trends;
  }

  getMyProfiles(employeeid: string) {
    return this.http.get(this.EmployeeProfile + '/get/employee/my/Profiles/' + employeeid)
  }

  // Existing methods from original MedicalService
  getBonusPaymentEmployeesList(code: string): Observable<any> {
    return this.http.get<any>(`${this.bonusPaymentBase}EmployeesLists/${code}`).pipe(
      catchError(this.handleError)
    );
  }

  getEmployeeById(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.CEmployee}EmployeeId/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  getUserRoleByUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.roleBase}getbyusername/${username}`);
  }

  setUserRoleIds(roleIds: string[]) {
    console.log('MedicalService: Setting userRoleIds:', roleIds);
    this.userRoleIdsSubject.next(roleIds.map(id => id.toLowerCase()));
  }

  getPatientInjections(patientID: number): Observable<any> {
    return this.http.get(`${this.CHMSInjectionBase}patient/${patientID}`).pipe(
      catchError(this.handleError)
    );
  }

  createInjection(injection: any): Observable<any> {
    return this.http.post(`${this.CHMSInjectionBase}injections`, injection).pipe(
      catchError(this.handleError)
    );
  }
  getTodayPendingSchedules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.CHMSInjectionBase}schedules/today/pending`).pipe(
      // map(schedules => schedules.map(sch => this.mapSchedule(sch))),
      catchError(this.handleError)
    );
  }
  administerInjectionSchedules(request: AdministerInjectionRequest): Observable<any> {
    return this.http.put(
      `${this.CHMSInjectionBase}schedules/${request.scheduleID}/administer`,
      request,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }
  // Add to MedicalService
  // getInjectionDetails(injectionID: number): Observable<any> {
  //   return this.http.get(`${this.CHMSInjectionBase}injections/${injectionID}`).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  updateInjection(data: any): Observable<any> {
    return this.http.put(`${this.CHMSInjectionBase}injections/${data.injectionID}`, data).pipe(
      catchError(this.handleError)
    );
  }

  administerInjection(injectionID: number, nurseID: string): Observable<any> {
    return this.http.put(`${this.CHMSInjectionBase}injections/${injectionID}/administer`, { nurseID }).pipe(
      catchError(this.handleError)
    );
  }

  getActiveInjections(): Observable<any[]> {
    return this.http.get<any[]>(`${this.CHMSInjectionBase}injections/active`).pipe(
      catchError(this.handleError)
    );
  }

  getInjectionDetails(injectionID: number): Observable<any> {
    return this.http.get(`${this.CHMSInjectionBase}injections/${injectionID}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(this.chmsUsersBase).pipe(
      catchError(this.handleError)
    );
  }

  getUserByUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.chmsUsersBase}${username}`).pipe(
      catchError(this.handleError)
    );
  }

  createUser(user: any): Observable<any> {
    return this.http.post<any>(this.chmsUsersBase, user, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(userId: string, user: any): Observable<void> {
    return this.http.put<void>(`${this.chmsUsersBase}${userId}`, user, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.chmsUsersBase}${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllMedicalRequests(): Observable<any> {
    return this.http.get<any[]>(this.chmsMedicalRequestsBase).pipe(
      catchError(this.handleError)
    );
  }

  getAllMedicalRequestsTeamleader(payrolId: string): Observable<MedicalRequestView[]> {
    return this.http.get<MedicalRequestView[]>(`${this.chmsMedicalRequestsBase}Payrol_ID?payrolId=${payrolId}`).pipe(
      catchError(this.handleError)
    );
  }

  getMedicalRequestsByEmployeeCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.chmsMedicalRequestsBase}by-employee-code/${code}`).pipe(
      catchError(this.handleError)
    );
  }

  getMedicalRequest(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsMedicalRequestsBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createMedicalRequest(request: any): Observable<any> {
    return this.http.post<any>(this.chmsMedicalRequestsBase, request, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  approveMedicalRequest(id: number, approval: any): Observable<void> {
    return this.http.put<void>(`${this.chmsMedicalRequestsBase}${id}/approve`, approval, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  createNotification(notification: any): Observable<any> {
    return this.http.post<any>(`${this.chmsNotificationsBase}`, notification).pipe(
      catchError(this.handleError)
    );
  }

  getNotificationsByEmployeeId(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsNotificationsBase}by-employee/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  getUnreadNotificationsCount(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.chmsNotificationsBase}unread-count/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.chmsNotificationsBase}mark-read/${notificationId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  getNotificationsByRecipientUserName(recipientUserName: string, includeArchived: boolean = false): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsNotificationsBase}by-recipient-username/${recipientUserName}?includeArchived=${includeArchived}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getDashboardOverview(): Observable<any> {
    return this.http.get<any>(`${this.chmsDashboardBase}overview`).pipe(
      catchError(this.handleError)
    );
  }

  getMonthlyStatistics(): Observable<any> {
    return this.http.get<any>(`${this.chmsDashboardBase}monthly-statistics`).pipe(
      catchError(this.handleError)
    );
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this.chmsEmployeesBase).pipe(
      catchError(this.handleError)
    );
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsEmployeesBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createEmployee(employee: any): Observable<any> {
    return this.http.post<any>(this.chmsEmployeesBase, employee, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getExpenseReimbursements(): Observable<ExpenseReimbursement[]> {
    return this.http.get<any[]>(this.chmsExpenseReimbursementBase).pipe(
      map((apiReimbursements) => {
        // Accept both PascalCase and camelCase payloads
        const normalized = (apiReimbursements || []).filter((r) => {
          const id = r.ReimbursementID ?? r.reimbursementID;
          return typeof id === 'number' && id > 0;
        });

        return normalized.map((r) => ({
          reimbursementID: r.ReimbursementID ?? r.reimbursementID,
          reimbursementNumber: r.ReimbursementNumber ?? r.reimbursementNumber,
          patientName: r.PatientName ?? r.patientName,
          employeeID: (r.EmployeeID ?? r.employeeID) || null,
          payrollNo: (r.PayrollNumber ?? r.payrollNumber) || null,
          payrollNumber: (r.PayrollNumber ?? r.payrollNumber) || null,
          department: (r.Department ?? r.department) || null,
          totalAmount: (r.TotalAmount ?? r.totalAmount) || 0,
          approvedAmount: (r.ApprovedAmount ?? r.approvedAmount) || 0,
          status: (r.Status ?? r.status) || 'Pending',
          submissionDate: (r.SubmissionDate ?? r.submissionDate) ? new Date(r.SubmissionDate ?? r.submissionDate) : undefined,
          approvedBy: (r.ApprovedBy ?? r.approvedBy) || null,
          approvedDate: (r.ApprovedDate ?? r.approvedDate) ? new Date(r.ApprovedDate ?? r.approvedDate) : undefined,
          paidDate: (r.PaidDate ?? r.paidDate) ? new Date(r.PaidDate ?? r.paidDate) : undefined,
          comments: (r.Comments ?? r.comments) || null,
          createdBy: (r.CreatedBy ?? r.createdBy) || null,
          orderedFrom: (r.OrderedFrom ?? r.orderedFrom) || null,
          doneAt: (r.DoneAt ?? r.doneAt) || null,
          investigation: (r.Investigation ?? r.investigation) || null,
          formType: (r.FormType ?? r.formType) || null,
          investigations: []
        }));
      }),
      catchError(this.handleError)
    );
  }
  addReimbursementDetail(reimbursementId: number, detail: any): Observable<any> {
    return this.http.post<any>(
      `${this.chmsExpenseReimbursementBase}${reimbursementId}/details`,
      detail,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  uploadReimbursementDocument(formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.chmsReimbursementDocumentsBase}upload`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  getExpenseReimbursement(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsExpenseReimbursementBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getReimbursementDetails(reimbursementId: number): Observable<ExpenseReimbursementDetail[]> {
    if (!reimbursementId || reimbursementId <= 0) {
      console.warn('Invalid reimbursementId:', reimbursementId, '- Returning empty details.');
      return from([[]]);
    }
    return this.http.get<any[]>(`${this.chmsExpenseReimbursementBase}${reimbursementId}/details`).pipe(
      map((details) =>
        details.map((d) => ({
          DetailID: d.DetailID,
          ReimbursementID: d.ReimbursementID || reimbursementId,
          InvestigationType: d.InvestigationType,
          Location: d.Location,
          OrderedFrom: d.OrderedFrom,
          InvoiceNumber: d.InvoiceNumber,
          Amount: d.DetailAmount || d.Amount,
          InvestigationDate: d.InvestigationDate ? new Date(d.InvestigationDate) : undefined,
          status: d.DetailStatus || d.status,
          comments: d.DetailComments || d.comments,
          approvedBy: d.DetailApprovedBy || d.approvedBy,
          approvedDate: d.DetailApprovedDate ? new Date(d.DetailApprovedDate) : undefined
        }))
      ),
      catchError(this.handleError)
    );
  }

  createExpenseReimbursement(data: ExpenseReimbursement): Observable<any> {
    return this.getUserIdFromUsername().pipe(
      switchMap((userId) => {
        const payload = {
          ...data,
          createdBy: userId || data.createdBy
        };
        return this.http.post<any>(this.chmsExpenseReimbursementBase, payload, { headers: this.headers });
      }),
      catchError(this.handleError)
    );
  }

  updateReimbursementDetailStatus(detailId: number, status: string, comment: string): Observable<any> {
    return this.getUserIdFromUsername().pipe(
      switchMap((userId) => {
        const payload = {
          Status: status,
          Comment: comment,
          approvedBy: userId
        };
        return this.http.put<any>(
          `${this.chmsExpenseReimbursementBase}details/${detailId}/status`,
          payload,
          { headers: this.headers }
        );
      }),
      catchError(this.handleError)
    );
  }

  // NEW: Unified method for status updates (both reimbursement and individual investigations)
  updateReimbursementStatus(id: number, detailId: number | undefined, status: string, comment: string): Observable<any> {
    if (detailId) {
      // Update individual investigation status
      return this.updateReimbursementDetailStatus(detailId, status, comment);
    } else {
      // Update main reimbursement status
      return this.updateExpenseReimbursementStatus(id, status, comment);
    }
  }

  markReimbursementAsPaid(id: number, request: { comment?: string }): Observable<void> {
    return this.getUserIdFromUsername().pipe(
      switchMap((userId) => {
        const payload = {
          ...request,
          paidBy: userId
        };
        return this.http.put<void>(
          `${this.chmsExpenseReimbursementBase}${id}/pay`,
          payload,
          { headers: this.headers }
        );
      }),
      catchError(this.handleError)
    );
  }

  updateExpenseReimbursementStatus(id: number, status: string, comment?: string): Observable<any> {
    return this.getUserIdFromUsername().pipe(
      switchMap((userId) => {
        const payload = {
          Status: status,
          Comment: comment || null,
          approvedBy: userId
        };
        return this.http.put(`${this.chmsExpenseReimbursementBase}${id}/status`, payload, { headers: this.headers });
      }),
      catchError(this.handleError)
    );
  }

  downloadReimbursementDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.chmsReimbursementDocumentsBase}download/${documentId}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  getReimbursementDocumentDownloadUrl(documentId: number): string {
    return `${this.chmsReimbursementDocumentsBase}download/${documentId}`;
  }
  getInvestigationDetails(reimbursementId: number): Observable<ExpenseReimbursementDetail[]> {
    return this.http.get<any[]>(`${this.chmsExpenseReimbursementBase}${reimbursementId}/details`).pipe(
      map(details => details.map(d => ({
        DetailID: d.DetailID,
        InvestigationType: d.InvestigationType || 'N/A',
        Location: d.Location || 'N/A',
        OrderedFrom: d.OrderedFrom || 'N/A',
        InvoiceNumber: d.InvoiceNumber || 'N/A',
        Amount: d.Amount || 0,
        InvestigationDate: d.InvestigationDate ? new Date(d.InvestigationDate) : undefined,
        status: d.Status || 'pending',
        comments: d.Comments || '',
        approvedBy: d.ApprovedBy,
        approvedDate: d.ApprovedDate ? new Date(d.ApprovedDate) : undefined
      }))),
      catchError(this.handleError)
    );
  }
  //Get documents by reimbursement ID
  getDocumentsByReimbursementId(reimbursementId: number): Observable<ReimbursementDocument[]> {
    return this.http.get<any[]>(`${this.chmsReimbursementDocumentsBase}by-reimbursement/${reimbursementId}`).pipe(
      map(documents => documents.map(doc => ({
        documentID: doc.documentID ?? doc.DocumentID,
        reimbursementID: doc.reimbursementID ?? doc.ReimbursementID ?? doc.reimbursementId ?? doc.ReimbursementId,
        reimbursementId: doc.reimbursementID ?? doc.ReimbursementID ?? doc.reimbursementId ?? doc.ReimbursementId,
        description: doc.description ?? doc.Description ?? null,
        fileName: doc.fileName ?? doc.FileName,
        filePath: doc.filePath ?? doc.FilePath ?? null,
        fileType: doc.fileType ?? doc.FileType,
        fileSize: doc.fileSize ?? doc.FileSize ?? 0,
        uploadDate: doc.uploadDate ? new Date(doc.uploadDate) : new Date(), // Ensure default date
        uploadedBy: doc.uploadedBy ?? doc.UploadedBy ?? null,
        isActive: doc.isActive ?? doc.IsActive ?? true,
        createdBy: doc.createdBy ?? doc.CreatedBy ?? null
      }))),
      catchError(this.handleError)
    );
  }

  uploadSupportingDocument(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.chmsReimbursementDocumentsBase}upload-supporting-document`,
      formData
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} - ${error.error?.message || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  approveReimbursement(id: number, approval: any): Observable<void> {
    return this.http.put<void>(`${this.chmsExpenseReimbursementBase}${id}/approve`, approval, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getExpenseReimbursementsByPayrollNumber(employeeID: string): Observable<ExpenseReimbursement[]> {
    return this.http.get<any[]>(`${this.chmsExpenseReimbursementBase}by-payroll/${employeeID}`).pipe(
      map(reimbursements =>
        reimbursements.map(r => ({
          reimbursementID: r.ReimbursementID ?? r.reimbursementID,
          reimbursementNumber: r.ReimbursementNumber ?? r.reimbursementNumber,
          patientName: r.PatientName ?? r.patientName,
          employeeID: r.EmployeeID ?? r.employeeID ?? null,
          payrollNo: r.PayrollNumber ?? r.payrollNumber ?? null,
          payrollNumber: r.PayrollNumber ?? r.payrollNumber ?? null,
          department: r.Department ?? r.department ?? null,
          totalAmount: r.TotalAmount ?? r.totalAmount ?? 0,
          approvedAmount: r.ApprovedAmount ?? r.approvedAmount ?? 0,
          status: r.Status ?? r.status ?? 'pending',
          submissionDate: r.SubmissionDate ? new Date(r.SubmissionDate) : undefined,
          approvedBy: r.ApprovedBy ?? r.approvedBy ?? null,
          approvedDate: r.ApprovedDate ? new Date(r.ApprovedDate) : undefined,
          paidDate: r.PaidDate ? new Date(r.PaidDate) : undefined,
          comments: r.Comments ?? r.comments ?? null,
          createdBy: r.CreatedBy ?? r.createdBy ?? null,
          orderedFrom: r.OrderedFrom ?? r.orderedFrom ?? null,
          doneAt: r.DoneAt ?? r.doneAt ?? null,
          investigation: r.Investigation ?? r.investigation ?? null,
          formType: r.FormType ?? r.formType ?? null,
          investigations: r.investigations ?? []
        }))
      ),
      catchError(this.handleError)
    );
  }

  getInventoryItems(): Observable<InventoryItem[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}items`).pipe(
      map(items =>
        items.map(item => ({
          id: item.ItemID.toString(),
          itemName: item.ItemName,
          category: item.CategoryID.toString(),
          unit: item.Unit,
          currentStock: item.CurrentStock,
          minimumStock: item.MinStockLevel,
          price: item.CurrentUnitPrice,
          expiryDate: item.HasExpiry ? new Date() : undefined // or handle properly if you have actual expiry date
        }))
      ),
      catchError(this.handleError)
    );
  }


  getInventoryCategories(): Observable<InventoryCategory[]> {
    return this.http.get<InventoryCategory[]>(`${this.chmsInventoryBase}categories`).pipe(
      catchError(this.handleError)
    );
  }

  getInventoryRequests(): Observable<InventoryRequest[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}requests`).pipe(
      map(requests =>
        requests.map(request => ({
          id: request.requestID.toString(),
          requestNumber: request.requestNumber,
          requestedFrom: request.requestedFrom,
          reasonForRequest: request.reasonForRequest,
          items: request.items || [],
          requestedBy: request.requestedBy,
          requestDate: new Date(request.requestDate),
          status: request.status.toLowerCase() as 'pending' | 'approved' | 'issued'
        }))
      ),
      catchError(this.handleError)
    );
  }

  getInventorysuperRequests(): Observable<SupervisorRequest[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}requests`).pipe(
      map(requests =>
        requests.map(request => ({
          requestID: request.requestID,
          requestNumber: request.requestNumber,
          requestedFrom: request.requestedFrom,
          roomID: request.roomID,
          roomName: request.roomName,
          requestDate: new Date(request.requestDate),
          reasonForRequest: request.reasonForRequest,
          status: request.status,
          requestedByName: request.requestedByName,
          itemCount: request.itemCount,
          estimatedValue: request.estimatedValue,
          items: request.items
        }))
      ),
      catchError(this.handleError)
    );
  }

  createInventoryRequest(request: SupervisorRequest): Observable<any> {
    const payload = {
      requestID: request.requestID,
      requestNumber: request.requestNumber,
      requestedFrom: request.requestedFrom,
      reasonForRequest: request.reasonForRequest,
      items: request.items || [],
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName,
      requestDate: request.requestDate.toISOString(),
      status: request.status,
      roomID: request.roomID,
      roomName: request.roomName,
      itemCount: request.itemCount,
      estimatedValue: request.estimatedValue
    };

    return this.http.post(`${this.chmsInventoryBase}requests`, payload, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }



  // getInventoryRequestDetails(requestId: number): Observable<InventoryRequestDetail[]> {
  //   return this.http.get<any[]>(`${this.chmsInventoryBase}requests/${requestId}/details`).pipe(
  //     map(details =>
  //       details.map(detail => ({
  //         itemID: detail.itemID.toString(),
  //         itemName: detail.itemName,
  //         unit: detail.unit,
  //         quantity: detail.quantity,
  //         jobOrderNo: detail.jobOrderNo,
  //         currentStock: detail.currentStock // Include currentStock for SupervisorDashboard
  //       }))
  //     ),
  //     catchError(this.handleError)
  //   );
  // }
  getInventoryRequestDetails(requestId: number): Observable<InventoryRequestDetail[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}requests/${requestId}/details`).pipe(
      map(details =>
        details.map(detail => ({
          detailID: detail.detailID,
          requestID: detail.requestID || requestId, // Ensure requestID is always present
          itemID: detail.itemID,
          itemName: detail.itemName,
          requestedQuantity: detail.requestedQuantity || detail.quantity, // Handle both property names
          approvedQuantity: detail.approvedQuantity,
          issuedQuantity: detail.issuedQuantity,
          jobOrderNumber: detail.jobOrderNumber || detail.jobOrderNo, // Handle both property names
          unit: detail.unit,
          unitPrice: detail.unitPrice,
          currentStock: detail.currentStock,
          itemCode: detail.itemCode
        }))
      ),
      catchError(this.handleError)
    );
  }



  addInventoryRequestDetail(requestId: number, detail: any): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}requests/${requestId}/details`, detail, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getLowStockItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.chmsInventoryBase}low-stock`).pipe(
      catchError(this.handleError)
    );
  }

  getNearExpiryItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.chmsInventoryBase}near-expiry`).pipe(
      catchError(this.handleError)
    );
  }

  getInventoryItemForMedication(medicationId: number): Observable<{ ItemID: number | null }> {
    return this.http.get<{ ItemID: number | null }>(
      `${this.chmsInventoryBase}medication/${medicationId}/inventory-link`
    ).pipe(catchError(() => of({ ItemID: null })));
  }

  getPatientLaboratoryTestscardNumber(cardNumber: string): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}tests/card/${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientLaboratoryTests(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}tests/patient/${patientId}`).pipe(
      catchError(this.handleError)
    );
  }

  getLaboratoryTests(cardNumber?: string): Observable<any> {
    const url = cardNumber != null
      ? `${this.chmsLaboratoryBase}tests?cardNumber=${cardNumber}`
      : `${this.chmsLaboratoryBase}tests`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getLaboratoryTest(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}tests/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createLaboratoryTest(test: any): Observable<any> {
    return this.http.post<any>(`${this.chmsLaboratoryBase}tests`, test, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getLaboratoryTestDetails(testId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}tests/${testId}/details`).pipe(
      catchError(this.handleError)
    );
  }

  addLaboratoryTestDetail(testId: number, detail: any): Observable<any> {
    return this.http.post<any>(`${this.chmsLaboratoryBase}tests/${testId}/details`, detail, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateLaboratoryTestStatus(testId: number, status: string, reportedBy?: string): Observable<any> {
    const body: any = { status };
    if (reportedBy) body.reportedBy = reportedBy;
    return this.http.put<any>(`${this.chmsLaboratoryBase}tests/${testId}/status`, body, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getLaboratoryTestDetailsByPatientID(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}tests/patient/${patientId}/details`).pipe(
      catchError(this.handleError)
    );
  }

  updateLaboratoryTestDetails(testId: number, detail: any): Observable<any> {
    return this.http.put<any>(`${this.chmsLaboratoryBase}tests/${testId}/details`, detail, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }
  // recordLaboratoryResults(testId: number, model: any): Observable<any> {
  //   return this.http.put<any>(
  //     `${this.chmsLaboratoryBase}tests/${testId}/record-results`,
  //     model,
  //     { headers: this.headers }
  //   ).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  recordLaboratoryResults(testId: number, reportedBy: string): Observable<any> {
    const payload = { ReportedBy: reportedBy };
    return this.http.put<any>(
      `${this.chmsLaboratoryBase}tests/${testId}/record-results`,
      payload,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // getLabTestCategories(): Observable<any> {
  //   return this.http.get<any>(`${this.chmsLaboratoryBase}categories-with-tests`);
  //   catchError(this.handleError)
  // }
  getLabTests(): Observable<any> {
    return this.http.get<any>(`${this.chmsLaboratoryBase}lab-tests`).pipe(
      catchError(this.handleError)
    );
  }


  addLabCategory(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.chmsLaboratoryBase}lab-categories`,
      data,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  addLabTest(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.chmsLaboratoryBase}lab-tests`,
      data,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteLabTest(testId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.chmsLaboratoryBase}lab-tests/${testId}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteLabCategory(categoryId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.chmsLaboratoryBase}lab-categories/${categoryId}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }


  getPatients(cardNumber?: string): Observable<any> {
    let url = this.chmsPatientsBase;
    if (cardNumber) {
      url += `?cardNumber=${cardNumber}`;
    }
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  // getPatient(cardNumber: string): Observable<any> {
  //   return this.http.get<any>(`${this.chmsPatientsBase}${cardNumber}`).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  getPatient(cardNumber: string): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientsBase}card/${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientByCardNumber(cardNumber: string): Observable<any> {
    return this.http.get<any[]>(`${this.chmsPatientsBase}?cardNumber=${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  createPatient(patient: any): Observable<any> {
    return this.http.post<any>(this.chmsPatientsBase, patient, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updatePatient(id: number, patient: any): Observable<void> {
    return this.http.put<void>(`${this.chmsPatientsBase}${id}`, patient, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.chmsPatientsBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllActivePatients(): Observable<any> {
    return this.http.get<any[]>(`${this.chmsPatientsBase}active`).pipe(
      catchError(this.handleError)
    );
  }

  // getAllDoctorActivePatients(): Observable<any> {
  //   return this.http.get<any[]>(`${this.chmsPatientsBase}doctoractivepatients`).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  getAllDoctorActivePatients(doctorID: string): Observable<any> {
    return this.http.get<any[]>(`${this.chmsPatientsBase}doctoractivepatients/${doctorID}`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientCard(cardId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientsBase}cards/${cardId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Add this method to your medical.service.ts
  getPatientCardByPatientId(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientsBase}cards/patient/${patientId}`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientCardsByPatient(patientId: number): Observable<any> {
    return this.http.get<any[]>(`${this.chmsPatientsBase}cards/patient/${patientId}`).pipe(
      catchError(this.handleError)
    );
  }

  updatePatientCard(cardId: number, card: any): Observable<void> {
    return this.http.put<void>(`${this.chmsPatientsBase}cards/${cardId}`, card, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  rejectWrongAssignment(
    cardId: number,
    payload: {
      rejectionReason: string;
      rejectedBy: string;
    }
  ): Observable<any> {
    return this.http
      .put<any>(
        `${this.chmsPatientsBase}cards/${cardId}/reject-assignment`,
        payload,
        { headers: this.headers }
      )
      .pipe(
        catchError(this.handleError)
      );
  }


  addMedication(data: any): Observable<any> {
    return this.http.post(`${this.chmsPharmacyBase}medications`, data).pipe(
      catchError(this.handleError)
    );
  }
  updateMedication(data: any): Observable<any> {
    const id = data.MedicationID || data.medicationID;
    if (!id) {
      throw new Error('MedicationID is missing for update');
    }
    return this.http.put(`${this.chmsPharmacyBase}medications/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  getPharmacyRequestReasons(): Observable<ReasonCategory[]> {
    return this.http.get<any>(`${this.chmsPharmacyBase}request-reasons`).pipe(
      map(response => (Array.isArray(response) ? response : response?.reasons || []).map((category: any) => ({
        category: category.category,
        reasons: category.reasons.map((r: any) => ({
          reasonId: r.reasonID.toString(),
          reasonName: r.reasonText
        }))
      }))),
      catchError(this.handleError)
    );
  }

  addPharmacyRequestReason(reason: { category: string; reasonText: string; displayOrder: number; createdBy: string; }): Observable<any> {
    return this.http.post<any>(`${this.chmsPharmacyBase}request-reasons`, reason).pipe(
      catchError(this.handleError)
    );
  }

  getPatientPrescriptions(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/patient/${patientId}`).pipe(
      catchError(this.handleError)
    );
  }

  updatePrescription(data: any): Observable<any> {
    return this.http.put(`${this.chmsPharmacyBase}prescriptions/${data.CardNumber}`, data).pipe(
      catchError(this.handleError)
    );
  }

  getPrescriptionsByCardNumber(cardNumber: string): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/cardnumber/${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  getPrescriptionIDDetails(prescriptionId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/${prescriptionId}/details`).pipe(
      catchError(this.handleError)
    );
  }

  getPrescriptionspayrollID(payrole: string): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/payrole/${payrole}`).pipe(
      catchError(this.handleError)
    );
  }

  getPrescriptions(): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions`).pipe(
      catchError(this.handleError)
    );
  }

  getPrescription(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createPrescription(prescription: any): Observable<any> {
    return this.http.post<any>(`${this.chmsPharmacyBase}prescriptions`, prescription, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPrescriptionDetails(prescriptionId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPharmacyBase}prescriptions/${prescriptionId}/details`).pipe(
      catchError(this.handleError)
    );
  }


  addPrescriptionDetail(prescriptionId: number, detail: any): Observable<any> {
    return this.http.post<any>(`${this.chmsPharmacyBase}prescriptions/${prescriptionId}/details`, detail, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getMedications(): Observable<MedicationCategory[]> {
    const url = `${this.chmsPharmacyBase.replace(/\/+$/, '')}/medications`;
    return this.http.get<MedicationCategory[]>(url, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getHierarchicalMedications(): Observable<MedicationCategory[]> {
    return this.http.get<MedicationCategory[]>(`${this.chmsPharmacyBase}/medications/hierarchical`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // dispensePrescription(id: number, pharmacistId: string): Observable<void> {
  //   const request = { PharmacistID: pharmacistId };
  //   return this.http.put<void>(`${this.chmsPharmacyBase}prescriptions/${id}/dispense`, request, { headers: this.headers }).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  dispensePrescription(prescriptionID: number, model: any) {
    return this.http.put(`${this.chmsPharmacyBase}${prescriptionID}/dispense`, model);
    // return this.http.put(`${this.chmsPharmacyBase}prescriptions/${prescriptionID}/dispense`, model);
  }
  acknowledgeOutOfStock(prescriptionID: number, model: any) {
    return this.http.put(`${this.chmsPharmacyBase}prescriptions/${prescriptionID}/acknowledge-out-of-stock`, model);
  }
  getDosageForms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsPharmacyBase}dosage-forms`).pipe(
      catchError(this.handleError)
    );
  }

  getTherapeuticCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsPharmacyBase}therapeutic-categories`).pipe(
      catchError(this.handleError)
    );
  }

  addTherapeuticCategory(data: {
    categoryName: string;
    description?: string | null;
    sortOrder?: number;
    createdBy?: string | null;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.chmsPharmacyBase}therapeutic-categories`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getMonthlyReport(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.chmsReportsBase}monthly/${year}/${month}`).pipe(
      catchError(this.handleError)
    );
  }

  getDepartmentStatistics(): Observable<any> {
    return this.http.get<any>(`${this.chmsReportsBase}department-statistics`).pipe(
      catchError(this.handleError)
    );
  }

  getFinancialSummary(): Observable<any> {
    return this.http.get<any>(`${this.chmsReportsBase}financial-summary`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientStatistics(): Observable<any> {
    return this.http.get<any>(`${this.chmsReportsBase}patient-statistics`).pipe(
      catchError(this.handleError)
    );
  }

  getSickLeaveCertificates(): Observable<any> {
    return this.http.get<any>(this.chmsSickLeaveBase).pipe(
      catchError(this.handleError)
    );
  }

  getSickLeaveByEmployeeCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.chmsSickLeaveBase}sickleave/${code}`).pipe(
      catchError(this.handleError)
    );
  }

  getSickLeaveCertificate(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsSickLeaveBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getSickLeaveCertificatebyemployee(id: string): Observable<SickLeave[]> {
    return this.http.get<any[]>(`${this.chmsSickLeaveBase}employee/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any[]) => response.map(item => ({
        certificateID: item.CertificateID,
        employeeID: item.EmployeeID,
        employeeName: item.PatientName,
        address: item.Address,
        startDate: new Date(item.StartDate),
        endDate: new Date(item.EndDate),
        totalDays: Math.ceil((new Date(item.EndDate).getTime() - new Date(item.StartDate).getTime()) / (1000 * 3600 * 24)) + 1,
        diagnosis: item.Diagnosis,
        recommendations: item.Recommendations,
        doctorName: item.DoctorName,
        doctorID: item.DoctorID,
        status: item.Status,
        issueDate: item.IssueDate ? new Date(item.IssueDate) : null,
        createdBy: item.CreatedBy,
        age: item.Age,
        sex: item.Sex,
        examinedOn: item.ExaminedOn ? new Date(item.ExaminedOn) : null,
        signature: item.Signature,
        patientID: item.PatientID
      }))),
      catchError(this.handleError)
    );
  }

  createSickLeaveCertificate(certificate: SickLeave): Observable<any> {
    return this.http.post<any>(this.chmsSickLeaveBase, {
      EmployeeID: certificate.employeeID,
      PatientName: certificate.employeeName,
      Address: certificate.address,
      StartDate: certificate.startDate.toISOString(),
      EndDate: certificate.endDate.toISOString(),
      Diagnosis: certificate.diagnosis,
      Recommendations: certificate.recommendations,
      DoctorID: certificate.doctorID,
      DoctorName: certificate.doctorName,
      Status: certificate.status || 'Active',
      IssueDate: certificate.issueDate ? certificate.issueDate.toISOString() : null,
      CreatedBy: certificate.createdBy,
      Age: certificate.age,
      Sex: certificate.sex,
      ExaminedOn: certificate.examinedOn ? certificate.examinedOn.toISOString() : null,
      Signature: certificate.signature,
      PatientID: certificate.patientID
    }, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateSickLeaveCertificateStatus(id: number, statusUpdate: any): Observable<void> {
    return this.http.put<void>(`${this.chmsSickLeaveBase}${id}/status`, statusUpdate, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPatientAssignments(): Observable<any> {
    return this.http.get<any[]>(this.chmsPatientAssignmentsBase).pipe(
      catchError(this.handleError)
    );
  }

  getPatientAssignment(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientAssignmentsBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  assignPatient(assignment: any): Observable<void> {
    return this.http.post<void>(this.chmsPatientAssignmentsBase, assignment, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsPatientAssignmentsBase}rooms`).pipe(
      catchError(this.handleError)
    );
  }

  getPatientHistory(cardNumber: string | number): Observable<any> {
    return this.http.get<any[]>(`${this.chmsPatientAssignmentsBase}history/${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  updateAssignmentStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`${this.chmsPatientAssignmentsBase}${id}/status`, `"${status}"`, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // getPatientByCardNumberHistory(cardNumber: string): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.chmsCHMSPatientMedicalHistoryBase}${cardNumber}`).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  getPatientByCardNumberHistory(cardNumber: string): Observable<PatientMedicalHistory[]> {
    if (!cardNumber) return of([]);
    return this.http.get<PatientMedicalHistory[]>(
      `${this.chmsCHMSPatientMedicalHistoryBase}${cardNumber}`
    ).pipe(
      catchError(err => {
        console.error('History load error:', err);
        return of([]); // return empty array on error
      })
    );
  }

  updatePatientHistory(data: any): Observable<void> {
    return this.http.post<void>(this.chmsCHMSPatientMedicalHistoryBase, data, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getDoctorByUserId(userId: string): Observable<any> {
    return this.http.get<any>(`${this.chmsUsersBase}${userId}`).pipe(
      catchError(this.handleError)
    );
  }


  getPatientReferrals(cardNumber: string): Observable<Referral[]> {
    return this.http.get<any[]>(`${this.chmsReferralBase}${cardNumber}`).pipe(
      map(referrals =>
        referrals.map(r => ({
          referralID: r.referralID,
          patientID: r.patientID,
          cardNumber: r.cardNumber,
          referringPhysician: r.referringPhysician,
          referredTo: r.referredTo || 'Not specified',
          referredToAddress: r.referredToAddress,
          referredToPhone: r.referredToPhone,
          reasonForReferral: r.reasonForReferral || '',
          clinicalFindings: r.clinicalFindings,
          diagnosis: r.diagnosis,
          investigationResult: r.investigationResult,
          rxGiven: r.rxGiven,
          referralDate: r.referralDate,
          status: r.status || 'Pending',
          createdBy: r.createdBy,
          completedDate: r.completedDate,
          feedbackFinding: r.feedbackFinding,
          feedbackDiagnosis: r.feedbackDiagnosis,
          feedbackRxGiven: r.feedbackRxGiven,
          feedbackPhysician: r.feedbackPhysician,
          feedbackDate: r.feedbackDate,
          feedbackSignature: r.feedbackSignature,
          referralNumber: r.ReferralNumber || 'N/A'
        } as Referral))
      ),
      catchError(this.handleError)
    );
  }
  checkHasPendingReferral(cardNumber: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.chmsReferralBase}${cardNumber}/has-pending`);
  }

  createReferral(referralData: ReferralFormData): Observable<any> {
    // New simplified payload matching our updated external referral system
    const apiData = {
      PatientID: referralData.PatientID,
      CardNumber: referralData.CardNumber,
      ReferringPhysician: referralData.ReferringPhysician,
      CreatedBy: referralData.CreatedBy,
      ReferredTo: referralData.ReferredTo,
      ReferredToAddress: referralData.ReferredToAddress || null,
      ReferredToPhone: referralData.ReferredToPhone || null,
      ReasonForReferral: referralData.ReasonForReferral,
      ClinicalFindings: referralData.ClinicalFindings || null,
      Diagnosis: referralData.Diagnosis || null,
      InvestigationResult: referralData.InvestigationResult || null,
      RxGiven: referralData.RxGiven || null
    };

    return this.http.post(`${this.chmsReferralBase}referral`, apiData, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateReferralStatus(referralId: number, statusUpdate: ReferralStatusUpdate): Observable<any> {
    return this.http.put(`${this.chmsReferralsBase}${referralId}/status`, statusUpdate).pipe(
      catchError(this.handleError)
    );
  }


  // New and enhanced methods from EnhancedMedicalService
  getRoomCategories(roomId: string): Observable<RoomCategory[]> {
    return this.http.get<any>(`${this.chmsInventoryBase}room-categories/${roomId}`).pipe(
      map(response => {
        console.log('Raw room categories response:', JSON.stringify(response, null, 2));

        // Normalize response to an array
        const categories = Array.isArray(response) ? response : [response];

        if (!categories || categories.length === 0) {
          console.warn('No room categories returned for roomId:', roomId);
          return [];
        }

        const mappedCategories = categories.map(category => ({
          roomCategoryID: (category.CategoryID || category.categoryID).toString(),
          categoryID: (category.CategoryID || category.categoryID).toString(),
          roomID: roomId,
          roomName: category.RoomName || category.roomName,
          createdDate: new Date(),
          isActive: category.IsActive !== false
        }));

        console.log('Mapped room categories:', JSON.stringify(mappedCategories, null, 2));
        return mappedCategories;
      }),
      catchError(error => {
        console.error('API error in getRoomCategories:', error);
        return this.handleError(error);
      })
    );
  }


  getIssueItems(): Observable<InventoryItemenhanced[]> {
    const url = `${this.chmsInventoryBase}items`;
    console.log('Calling endpoint:', url);
    console.log('Full URL would be:', environment.rootPath2 + 'CHMS_Inventory/items');
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Raw API response:', JSON.stringify(response, null, 2));

        // Handle the grouped API response structure
        let items: any[] = [];

        if (Array.isArray(response)) {
          // If response is an array of category objects
          response.forEach(category => {
            if (category.items && Array.isArray(category.items)) {
              items = items.concat(category.items);
            }
          });
        } else if (response && response.items && Array.isArray(response.items)) {
          // If response is a single category object with items
          items = response.items;
        } else if (response && Array.isArray(response)) {
          // If response is directly an array of items (fallback)
          items = response;
        }

        console.log('Extracted items array:', items);
        console.log('Items array length:', items.length);

        if (!items || items.length === 0) {
          console.warn('No items returned from API');
          return [];
        }

        return items.map((item: any) => {
          console.log('Processing item:', item);
          let stockStatus: 'Low Stock' | 'Normal' | 'Overstock' = 'Normal';
          if (item.CurrentStock <= item.MinimumStock) {
            stockStatus = 'Low Stock';
          } else if (item.MaximumStock && item.CurrentStock > item.MaximumStock) {
            stockStatus = 'Overstock';
          }

          const mappedItem = {
            itemID: item.ItemID || 0,
            itemCode: item.ItemCode || item.ItemID?.toString() || '',
            itemName: item.ItemName || '',
            categoryID: item.CategoryID || item.categoryID || 0,
            categoryName: item.CategoryName || item.categoryName || '',
            unit: item.Unit || '',
            currentStock: item.CurrentStock || 0,
            minimumStock: item.MinimumStock || 0,
            maximumStock: item.MaximumStock || undefined,
            unitPrice: item.UnitPrice || 0,
            expiryDate: item.ExpiryDate ? new Date(item.ExpiryDate) : undefined,
            manufacturer: item.Manufacturer || '',
            batchNumber: item.BatchNumber || '',
            isActive: item.IsActive !== undefined ? item.IsActive : true,
            createdDate: item.CreatedDate ? new Date(item.CreatedDate) : new Date(),
            updatedDate: item.UpdatedDate ? new Date(item.UpdatedDate) : new Date(),
            maxQuantityAllowed: item.MaxQuantityAllowed || undefined,
            stockStatus: stockStatus,
            RoomID: item.RoomID || undefined
          } as InventoryItemenhanced;
          console.log('Mapped item result:', mappedItem);
          return mappedItem;
        });
      }),
      catchError(error => {
        console.error('API error:', error);
        return this.handleError(error);
      })
    );
  }




  getInventoryItemsByRoom(roomId: string): Observable<ItemCategory[]> {
    return this.http.get<any>(`${this.chmsInventoryBase}items/room/${roomId}`).pipe(
      map(response => {
        console.log('Raw API response:', JSON.stringify(response, null, 2));

        // Handle both array and object responses
        let items = Array.isArray(response) ? response : response.items || [];
        if (!items || items.length === 0) {
          console.warn('No items returned from API for roomId:', roomId);
          return [];
        }

        const categoriesMap = new Map<string, InventoryItemenhanced[]>();
        items.forEach((category: any) => {
          const categoryId = (category.categoryID || category.CategoryID || 'unknown').toString();
          if (!categoriesMap.has(categoryId)) {
            categoriesMap.set(categoryId, []);
          }
          const categoryItems = Array.isArray(category.items) ? category.items : [];
          categoryItems.forEach((item: any) => {
            let stockStatus: 'Low Stock' | 'Normal' | 'Overstock' = 'Normal';
            if (item.CurrentStock <= item.MinimumStock) {
              stockStatus = 'Low Stock';
            } else if (item.MaximumStock && item.CurrentStock > item.MaximumStock) {
              stockStatus = 'Overstock';
            }
            categoriesMap.get(categoryId)!.push({
              itemID: item.ItemID,
              itemCode: item.ItemCode || item.ItemID.toString(),
              itemName: item.ItemName,
              categoryID: parseInt(category.CategoryID || category.categoryID),
              categoryName: item.CategoryName || category.categoryName,
              unit: item.Unit,
              currentStock: item.CurrentStock,
              minimumStock: item.MinimumStock,
              maximumStock: item.MaximumStock || item.MinimumStock,
              unitPrice: item.UnitPrice,
              expiryDate: item.ExpiryDate ? new Date(item.ExpiryDate) : undefined,
              manufacturer: item.Manufacturer,
              batchNumber: item.BatchNumber,
              isActive: item.IsActive !== undefined ? item.IsActive : true,
              createdDate: item.CreatedDate ? new Date(item.CreatedDate) : new Date(),
              updatedDate: item.UpdatedDate ? new Date(item.UpdatedDate) : new Date(),
              maxQuantityAllowed: item.MaxQuantityAllowed,
              stockStatus: stockStatus,
              RoomID: item.RoomID
            });
          });
        });

        const result = Array.from(categoriesMap.entries()).map(([categoryID, items]) => ({
          categoryID,
          categoryName: items[0]?.categoryName || `Category ${categoryID}`,
          description: '',
          isActive: true,
          items
        }));
        console.log('Mapped categories:', JSON.stringify(result, null, 2));
        return result;
      }),
      catchError(error => {
        console.error('API error:', error);
        return this.handleError(error);
      })
    );
  }


  getPendingRequestsForSupervisor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsCHMSRoomInventoryBase}supervisor/pending-requests`).pipe(
      catchError(this.handleError)
    );
  }
  updatesuperRequestStatus(requestId: string | number, status: string, approvedBy: string, comments?: string): Observable<any> {
    const body = { status, approvedBy, comments };
    return this.http.put<any>(`${this.chmsCHMSRoomInventoryBase}requests/${requestId}/status`, body, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateRequestStatus(requestId: number, status: string, approvedBy: string, comments?: string): Observable<any> {
    const body = { status, approvedBy, comments };
    return this.http.put<any>(`${this.chmsCHMSRoomInventoryBase}requests/${requestId}/status`, body, { headers: this.headers }
    ).pipe(catchError(this.handleError));
  }
  setSupervisorMonitoring(requestId: number, monitored: boolean): Observable<any> {
    return this.http.put(`${this.chmsCHMSRoomInventoryBase}requests/${requestId}/monitor`, { monitored }, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // getRequestDetails(requestId: number): Observable<InventoryRequestDetail[]> {
  //   return this.http.get<any[]>(`${this.chmsInventoryBase}requests/${requestId}/details`).pipe(
  //     map(details =>
  //       details.map(detail => ({
  //         itemID: detail.itemID.toString(),
  //         itemName: detail.itemName,
  //         unit: detail.unit,
  //         quantity: detail.quantity,
  //         jobOrderNo: detail.jobOrderNo,
  //         currentStock: detail.currentStock
  //       }))
  //     ),
  //     catchError(this.handleError)
  //   );
  // }



  getRequestDetails(requestId: number): Observable<InventoryRequestDetail[]> {
    return this.http.get<InventoryRequestDetail[]>(`${this.chmsInventoryBase}requests/${requestId}/details`).pipe(
      catchError(this.handleError)
    );
  }

  // =============================================
  // Procedure Room Services
  // =============================================

  // Wound Care Services
  createWoundCare(woundCare: WoundCareRequest): Observable<any> {
    return this.http.post<any>(`${this.chmsWoundCareBase}`, woundCare, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPatientWoundCare(patientID: number): Observable<WoundCare[]> {
    return this.http.get<WoundCare[]>(`${this.chmsWoundCareBase}patient/${patientID}`).pipe(
      catchError(this.handleError)
    );
  }

  getWoundCareDetails(woundCareID: number): Observable<WoundCare> {
    return this.http.get<WoundCare>(`${this.chmsWoundCareBase}${woundCareID}`).pipe(
      catchError(this.handleError)
    );
  }

  updateWoundCareStatus(woundCareID: number, statusUpdate: ProcedureStatusUpdate): Observable<any> {
    return this.http.put<any>(`${this.chmsWoundCareBase}${woundCareID}/status`, statusUpdate, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Suturing Services
  createSuturing(suturing: SuturingRequest): Observable<any> {
    return this.http.post<any>(`${this.chmsSuturingBase}`, suturing, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPatientSuturing(patientID: number): Observable<Suturing[]> {
    return this.http.get<Suturing[]>(`${this.chmsSuturingBase}patient/${patientID}`).pipe(
      catchError(this.handleError)
    );
  }

  getSuturingDetails(suturingID: number): Observable<Suturing> {
    return this.http.get<Suturing>(`${this.chmsSuturingBase}${suturingID}`).pipe(
      catchError(this.handleError)
    );
  }

  updateSuturingStatus(suturingID: number, statusUpdate: ProcedureStatusUpdate): Observable<any> {
    return this.http.put<any>(`${this.chmsSuturingBase}${suturingID}/status`, statusUpdate, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Ear Irrigation Services
  createEarIrrigation(earIrrigation: EarIrrigationRequest): Observable<any> {
    return this.http.post<any>(`${this.chmsEarIrrigationBase}`, earIrrigation, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPatientEarIrrigation(patientID: number): Observable<EarIrrigation[]> {
    return this.http.get<EarIrrigation[]>(`${this.chmsEarIrrigationBase}patient/${patientID}`).pipe(
      catchError(this.handleError)
    );
  }

  getEarIrrigationDetails(earIrrigationID: number): Observable<EarIrrigation> {
    return this.http.get<EarIrrigation>(`${this.chmsEarIrrigationBase}${earIrrigationID}`).pipe(
      catchError(this.handleError)
    );
  }

  updateEarIrrigationStatus(earIrrigationID: number, statusUpdate: ProcedureStatusUpdate): Observable<any> {
    return this.http.put<any>(`${this.chmsEarIrrigationBase}${earIrrigationID}/status`, statusUpdate, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Generic Procedure Services
  getTodayPendingProcedures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsProceduresBase}today/pending`).pipe(
      catchError(this.handleError)
    );
  }

  administerProcedure(request: AdministerProcedureRequest): Observable<any> {
    return this.http.put<any>(`${this.CHMSInjectionBase}procedures/${request.procedureID}/administer`, request, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // getPurchaseRequests(): Observable<PurchaseRequest[]> {
  //   return this.http.get<PurchaseRequest[]>(`${this.chmsCHMSRoomInventoryBase}purchase-requests`).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  getPurchaseRequests(): Observable<InventoryPurchaseRequest[]> {
    return this.http.get<any[]>(`${this.chmsCHMSRoomInventoryBase}purchase-requests`).pipe(
      map(purchases =>
        purchases.map(p => ({
          purchaseRequestID: p.purchaseRequestID,
          requestNumber: p.requestNumber,
          originalRequestID: p.originalRequestID,
          itemID: p.itemID,
          itemName: p.itemName || 'Unknown Item',
          itemCode: p.itemCode || '',
          quantity: p.quantity,
          estimatedUnitPrice: p.estimatedUnitPrice,
          totalEstimatedCost: p.totalEstimatedCost || 0,
          requestedBy: p.requestedBy,
          requestedByName: p.requestedByName || 'Unknown',
          requestDate: p.requestDate || new Date(),
          status: p.status as 'Pending' | 'Purchased' | 'Received',
          purchasedBy: p.purchasedBy,
          purchaseDate: p.purchaseDate,
          actualUnitPrice: p.actualUnitPrice,
          supplier: p.supplier,
          comments: p.comments
        }))
      ),
      catchError(this.handleError)
    );
  }



  getItemRegistrations(purchaseRequestId: string): Observable<ItemRegistration> {
    return this.http.get<ItemRegistration>(`${this.chmsCHMSRoomInventoryBase}item-registrations/${purchaseRequestId}`).pipe(
      catchError(this.handleError)
    );
  }

  createPurchaseRequest(purchase: InventoryPurchaseRequest): Observable<any> {
    return this.http.post(`${this.chmsCHMSRoomInventoryBase}purchase-requests`, purchase, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  registerReceivedItems(registration: ItemRegistration): Observable<any> {
    return this.http.post(`${this.chmsCHMSRoomInventoryBase}register-received-item`, registration, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  checkBatchNumber(batchNumber: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.chmsCHMSRoomInventoryBase}/items/check-batch/${batchNumber}`);
  }

  updatePurchaseRequestStatus(purchaseRequestId: number, status: string, userId: string): Observable<any> {
    const body = { purchaseRequestId, status, userId };
    return this.http.put(`${this.chmsInventoryBase}purchase-requests/status`, body, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  registerReceivedItem(registration: ItemRegistration): Observable<any> {
    return this.http.post(`${this.chmsInventoryBase}register-item`, registration, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  createInventoryRequestEnhanced(request: InventoryRequestEnhanced): Observable<any> {
    return this.http.post(`${this.chmsInventoryBase}requests/enhanced`, request, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getRequestsByUser(userId: string): Observable<InventoryRequest[]> {
    return this.http.get<InventoryRequest[]>(`${this.chmsInventoryBase}requests/by-user/${userId}`).pipe(
      map(requests =>
        requests.map(request => ({
          id: request.id.toString(),
          requestNumber: request.requestNumber,
          requestedFrom: request.requestedFrom,
          reasonForRequest: request.reasonForRequest,
          items: request.items || [],
          requestedBy: request.requestedBy,
          requestDate: new Date(request.requestDate),
          status: request.status.toLowerCase() as 'pending' | 'approved' | 'issued'
        }))
      ),
      catchError(this.handleError)
    );
  }
  issueItems(requestId: number, issuedBy: string, comments?: string): Observable<any> {
    const body = { issuedBy, comments };
    return this.http.put(`${this.chmsInventoryBase}requests/${requestId}/issue`, body, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  receiveItems(model: any): Observable<any> {
    return this.http.post(`${this.chmsInventoryBase}receive-items`, model, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  confirmReceipt(requestId: number, receivedBy: string, comments?: string): Observable<any> {
    const body = { receivedBy, comments };
    return this.http.put(`${this.chmsInventoryBase}requests/${requestId}/receive`, body, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getInventoryReports(type: string): Observable<any> {
    return this.http.get(`${this.chmsInventoryBase}reports/${type}`, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getRoomStock(roomId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}room-stock/${roomId}`).pipe(
      catchError(this.handleError)
    );
  }
  getSupervisorMonitoring(requestId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsInventoryBase}requests/${requestId}/monitoring`).pipe(
      catchError(this.handleError)
    );
  }

  createInventoryCategory(category: { categoryName: string; description?: string; isActive?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}categories`, category, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  createInventoryItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}items`, item, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  addRoomCategory(roomCategory: RoomCategory): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}room-categories`, roomCategory, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }
  getAllInventoryItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}items`);
  }
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}categories`);
  }

  createCategory(category: { categoryName: string; description?: string; isActive?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}categories`, category, { headers: this.headers });
  }
  receiveStock(data: any): Observable<any> {
    return this.http.post(`${this.chmsInventoryBase}stock/receive`, data, { headers: this.headers });
  }
  updateItem(itemId: number, data: any): Observable<any> {
    return this.http.put(`${this.chmsInventoryBase}items/${itemId}`, data, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }
  getMedicationDetails(itemId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsInventoryBase}items/${itemId}/medication`, { headers: this.headers });
  }

  addLabTestCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.chmsInventoryBase}lab-test-categories`, data, { headers: this.headers });
  }

  getLabTestCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}lab-test-categories`).pipe(
      catchError(this.handleError)
    );
  }

  // =============================================
  // Finance Services
  // =============================================
  getPendingFinanceApprovals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsFinanceBase}pending-approvals`).pipe(
      catchError(this.handleError)
    );
  }

  approveFinanceApproval(financeApprovalID: number, approvedBy: string): Observable<any> {
    const payload = { approvedBy };
    return this.http.post<any>(`${this.chmsFinanceBase}approve-approval/${financeApprovalID}`, payload, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  rejectFinanceApproval(data: { FinanceApprovalID: number, Comments?: string, RejectedBy: string }): Observable<any> {
    return this.http.post(`${this.chmsFinanceBase}reject-approval/${data.FinanceApprovalID}`, {
      RejectedBy: data.RejectedBy,
      Comments: data.Comments
    });
  }

  approveBatchFinanceApprovals(financeApprovalIDs: number[], approvedBy: string): Observable<any> {
    const payload = { financeApprovalIDs, approvedBy };
    return this.http.post<any>(`${this.chmsFinanceBase}approve-batch-approvals`, payload, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getFinanceApprovedReimbursements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsFinanceBase}approved-reimbursements`).pipe(
      catchError(this.handleError)
    );
  }

  createFinanceApproval(approvalData: any): Observable<any> {
    return this.http.post<any>(`${this.chmsFinanceBase}create-approval`, approvalData, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  createBatchFinanceApproval(batchData: any): Observable<any> {
    return this.http.post<any>(`${this.chmsFinanceBase}create-batch-approval`, batchData, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getFinanceApprovalDetails(approvalId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsFinanceBase}approval-details/${approvalId}`).pipe(
      catchError(this.handleError)
    );
  }

  getFinanceApprovalsForCashier(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsFinanceBase}approvals-for-cashier`).pipe(
      catchError(this.handleError)
    );
  }

  // =============================================
  // Cashier Services
  // =============================================

  getCashierApprovalsForPayment(): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsCashierBase}approvals-for-payment`).pipe(
      catchError(this.handleError)
    );
  }

  createCashierPayment(paymentData: any): Observable<any> {
    return this.http.post<any>(`${this.chmsCashierBase}create-payment`, paymentData, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  createBatchCashierPayment(batchData: any): Observable<any> {
    return this.http.post<any>(`${this.chmsCashierBase}create-batch-payment`, batchData, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getPaymentHistory(startDate?: Date, endDate?: Date, status?: string): Observable<any[]> {
    let url = `${this.chmsCashierBase}payment-history`;
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getPaymentSummary(): Observable<any> {
    return this.http.get(`${this.chmsCashierBase}payment-summary`).pipe(
      catchError(error => {
        console.error('Error fetching enhanced payment summary:', error);
        return of({
          pendingPayments: { count: 0, amount: 0 },
          todayPayments: { count: 0, amount: 0 },
          monthlySummary: []
        });
      })
    );
  }
  getPaymentReports(startDate?: Date, endDate?: Date): Observable<any> {
    const params: any = {};

    if (startDate) {
      params.startDate = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.endDate = endDate.toISOString().split('T')[0];
    }

    return this.http.get(`${this.chmsCashierBase}reports`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching payment reports:', error);
        // Return empty structure if API fails
        return of({
          summary: { totalPayments: 0, totalAmount: 0, averagePayment: 0 },
          trends: [],
          departmentBreakdown: [],
          paymentMethodStats: []
        });
      })
    );
  }

  updatePvNumber(paymentId: number, pvNumber: string) {
    return this.http.put(`${this.chmsCashierBase}update-pvnumber/${paymentId}`, 
      { pvNumber });
  }
  // this is from CHMSPatientHistory the history okay
  getPatientFullHistory(cardNumber: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.CHMSPatientHistory}${cardNumber}`).pipe(
      catchError(this.handleError)
    );
  }

}