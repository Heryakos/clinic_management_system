import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MedicalRequest, MedicalRequestView, SickLeave, InventoryItem, InventoryRequest } from './models/medical.model';
import { environment } from '../environments/environment';
import { MedicationCategory, MedicationSelection } from './components/medication-tree-dropdown/medication-tree-dropdown.component';
import { ReasonCategory, ReasonSelection } from './components/reason-tree-dropdown/reason-tree-dropdown.component';
import { Referral, ReferralFormData, ReferralStatusUpdate } from './components/interfaces/patient.interface';
import { PurchaseRequest, ItemRegistration, RoomCategory, InventoryCategory, InventoryItemenhanced, InventoryPurchaseRequest, InventoryRequestEnhanced, InventoryRequestDetail, SupervisorRequest } from './models/inventory-enhanced.model';

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
  private userRoleIdsSubject = new BehaviorSubject<string[]>([]);
  userRoleIds$ = this.userRoleIdsSubject.asObservable();

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
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

  getExpenseReimbursements(): Observable<any> {
    return this.http.get<any>(this.chmsExpenseReimbursementBase).pipe(
      catchError(this.handleError)
    );
  }

  getExpenseReimbursement(id: number): Observable<any> {
    return this.http.get<any>(`${this.chmsExpenseReimbursementBase}${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createExpenseReimbursement(reimbursement: any): Observable<any> {
    return this.http.post<any>(this.chmsExpenseReimbursementBase, reimbursement, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getReimbursementDetails(reimbursementId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsExpenseReimbursementBase}${reimbursementId}/details`).pipe(
      catchError(this.handleError)
    );
  }

  addReimbursementDetail(reimbursementId: number, detail: any): Observable<any> {
    return this.http.post<any>(`${this.chmsExpenseReimbursementBase}${reimbursementId}/details`, detail, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  approveReimbursement(id: number, approval: any): Observable<void> {
    return this.http.put<void>(`${this.chmsExpenseReimbursementBase}${id}/approve`, approval, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  getInventoryItems(): Observable<InventoryItem[]> {
    return this.http.get<any[]>(`${this.chmsInventoryBase}items`).pipe(
      map(items =>
        items.map(item => ({
          id: item.itemID.toString(),
          itemName: item.itemName,
          category: item.categoryID.toString(),
          unit: item.unit,
          currentStock: item.currentStock,
          minimumStock: item.minimumStock,
          price: item.unitPrice,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
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


  getPatients(cardNumber?: string): Observable<any> {
    let url = this.chmsPatientsBase;
    if (cardNumber) {
      url += `?cardNumber=${cardNumber}`;
    }
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getPatient(cardNumber: string): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientsBase}${cardNumber}`).pipe(
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

  getPatientCard(cardId: number): Observable<any> {
    return this.http.get<any>(`${this.chmsPatientsBase}cards/${cardId}`).pipe(
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

  addMedication(data: any): Observable<any> {
    return this.http.post(`${this.chmsPharmacyBase}medications`, data).pipe(
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

  dispensePrescription(id: number, pharmacistId: string): Observable<void> {
    const request = { PharmacistID: pharmacistId };
    return this.http.put<void>(`${this.chmsPharmacyBase}prescriptions/${id}/dispense`, request, { headers: this.headers }).pipe(
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

  getPatientByCardNumberHistory(cardNumber: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.chmsCHMSPatientMedicalHistoryBase}${cardNumber}`).pipe(
      catchError(this.handleError)
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
    return this.http.get<any>(`${this.chmsReferralBase}${cardNumber}`).pipe(
      map(response => {
        console.log('Raw API response for referrals:', response);
        // Handle both single referral and array responses
        let referrals = Array.isArray(response) ? response : [response];

        // Create a map to ensure unique referral IDs
        const uniqueReferrals = new Map<number, Referral>();

        referrals.forEach((item: any) => {
          // Ensure ReferralID is properly mapped (support multiple casings from API)
          const referralID = item.ReferralID || item.referralID || item.referralId;

          if (!referralID || referralID <= 0) {
            console.error('Invalid referral ID in API response:', item);
            return;
          }

          // Skip if we already have a referral with this ID
          if (uniqueReferrals.has(referralID)) {
            console.warn('Duplicate referral ID found:', referralID);
            return;
          }

          // Extract vital signs properly
          const vitalSigns = item.VitalSigns || item.vitalSigns || {};

          const referral: Referral = {
            ReferralID: referralID,
            PatientID: item.PatientID || item.patientId,
            CardNumber: item.CardNumber || item.cardNumber,
            ReferringPhysician: item.ReferringPhysician || item.referringPhysician,
            Department: item.Department || item.department,
            ReferralDate: new Date(item.ReferralDate || item.referralDate),
            Status: item.Status || item.status || 'Pending',
            Notes: item.Notes || item.notes,
            ReferenceID: item.ReferenceID || item.referenceId,
            CreatedBy: item.CreatedBy || item.createdBy,
            CompletedDate: item.CompletedDate ? new Date(item.CompletedDate) : undefined,
            // Referral Details
            ClinicalHistory: item.ClinicalHistory || item.clinicalHistory,
            CurrentDiagnosis: item.CurrentDiagnosis || item.currentDiagnosis,
            VitalSignsBloodPressure: vitalSigns.BloodPressure || vitalSigns.bloodPressure,
            VitalSignsHeartRate: vitalSigns.HeartRate || vitalSigns.heartRate,
            VitalSignsTemperature: vitalSigns.Temperature || vitalSigns.temperature,
            VitalSignsWeight: vitalSigns.Weight || vitalSigns.weight,
            VitalSignsHeight: vitalSigns.Height || vitalSigns.height,
            CurrentMedications: item.CurrentMedications || item.currentMedications,
            Allergies: item.Allergies || item.allergies,
            LabResults: item.LabResults || item.labResults,
            InsuranceProvider: item.InsuranceProvider || item.insuranceProvider,
            PolicyNumber: item.PolicyNumber || item.policyNumber,
            GroupNumber: item.GroupNumber || item.groupNumber,
            UrgentFollowUp: item.UrgentFollowUp || item.urgentFollowUp || false,
            TransportationNeeded: item.TransportationNeeded || item.transportationNeeded || false,
            InterpreterNeeded: item.InterpreterNeeded || item.interpreterNeeded || false,
            AdditionalNotes: item.AdditionalNotes || item.additionalNotes,
            PhysicianName: item.PhysicianName || item.physicianName,
            PhysicianLicense: item.PhysicianLicense || item.physicianLicense,
            PhysicianPhone: item.PhysicianPhone || item.physicianPhone,
            PhysicianSignature: item.PhysicianSignature || item.physicianSignature,
            // Display fields
            referralNumber: item.referralNumber || `REF-${referralID}`,
            referredTo: item.Department || item.department,
            specialty: item.Department || item.department,
            priority: 'Normal' // Default priority
          };

          // Add to the map
          uniqueReferrals.set(referralID, referral);
        });

        // Convert the map values back to an array
        return Array.from(uniqueReferrals.values());
      }),
      catchError(error => {
        console.error('Error in getPatientReferrals:', error);
        this.handleError(error);
        return throwError(() => new Error('Error in getPatientReferrals'));
      })
    );
  }


  getReferralDetails(referralId: number): Observable<Referral> {
    if (!referralId || referralId <= 0) {
      return throwError(() => new Error('Invalid referral ID'));
    }

    return this.http.get<any>(`${this.chmsReferralsBase}${referralId}`).pipe(
      map(response => {
        console.log('Raw referral details response:', response);

        // Extract vital signs properly
        const vitalSigns = response.VitalSigns || response.vitalSigns || {};

        // Map the response to a Referral object with all details
        return {
          ReferralID: response.ReferralID || response.referralID,
          PatientID: response.PatientID || response.patientID,
          CardNumber: response.CardNumber || response.cardNumber,
          ReferringPhysician: response.ReferringPhysician || response.referringPhysician,
          Department: response.Department || response.department,
          ReferralDate: new Date(response.ReferralDate || response.referralDate),
          Status: response.Status || response.status || 'Pending',
          Notes: response.Notes || response.notes,
          ReferenceID: response.ReferenceID || response.referenceID,
          CreatedBy: response.CreatedBy || response.createdBy,
          CompletedDate: response.CompletedDate ? new Date(response.CompletedDate) : undefined,
          // Referral Details
          ClinicalHistory: response.ClinicalHistory || response.clinicalHistory,
          CurrentDiagnosis: response.CurrentDiagnosis || response.currentDiagnosis,
          VitalSignsBloodPressure: vitalSigns.BloodPressure || vitalSigns.bloodPressure,
          VitalSignsHeartRate: vitalSigns.HeartRate || vitalSigns.heartRate,
          VitalSignsTemperature: vitalSigns.Temperature || vitalSigns.temperature,
          VitalSignsWeight: vitalSigns.Weight || vitalSigns.weight,
          VitalSignsHeight: vitalSigns.Height || vitalSigns.height,
          CurrentMedications: response.CurrentMedications || response.currentMedications,
          Allergies: response.Allergies || response.allergies,
          LabResults: response.LabResults || response.labResults,
          InsuranceProvider: response.InsuranceProvider || response.insuranceProvider,
          PolicyNumber: response.PolicyNumber || response.policyNumber,
          GroupNumber: response.GroupNumber || response.groupNumber,
          UrgentFollowUp: response.UrgentFollowUp || response.urgentFollowUp || false,
          TransportationNeeded: response.TransportationNeeded || response.transportationNeeded || false,
          InterpreterNeeded: response.InterpreterNeeded || response.interpreterNeeded || false,
          AdditionalNotes: response.AdditionalNotes || response.additionalNotes,
          PhysicianName: response.PhysicianName || response.physicianName,
          PhysicianLicense: response.PhysicianLicense || response.physicianLicense,
          PhysicianPhone: response.PhysicianPhone || response.physicianPhone,
          PhysicianSignature: response.PhysicianSignature || response.physicianSignature,
          // Display fields
          referralNumber: response.referralNumber || `REF-${response.ReferralID}`,
          referredTo: response.Department || response.department,
          specialty: response.Department || response.department,
          priority: 'Normal'
        } as Referral;
      }),
      catchError(this.handleError)
    );
  }



  createReferral(referralData: ReferralFormData): Observable<any> {
    // Transform the form data to match API expectations
    const apiData = {
      PatientID: referralData.PatientID,
      CardNumber: referralData.CardNumber,
      ReferringPhysician: referralData.ReferringPhysician,
      Department: referralData.Department,
      Notes: referralData.Notes,
      ReferenceID: referralData.ReferenceID,
      CreatedBy: referralData.CreatedBy,
      // Referral Details
      ClinicalHistory: referralData.ClinicalHistory,
      CurrentDiagnosis: referralData.CurrentDiagnosis,
      VitalSignsBloodPressure: referralData.VitalSignsBloodPressure,
      VitalSignsHeartRate: referralData.VitalSignsHeartRate,
      VitalSignsTemperature: referralData.VitalSignsTemperature,
      VitalSignsWeight: referralData.VitalSignsWeight,
      VitalSignsHeight: referralData.VitalSignsHeight,
      CurrentMedications: referralData.CurrentMedications,
      Allergies: referralData.Allergies,
      LabResults: referralData.LabResults,
      InsuranceProvider: referralData.InsuranceProvider,
      PolicyNumber: referralData.PolicyNumber,
      GroupNumber: referralData.GroupNumber,
      UrgentFollowUp: referralData.UrgentFollowUp,
      TransportationNeeded: referralData.TransportationNeeded,
      InterpreterNeeded: referralData.InterpreterNeeded,
      AdditionalNotes: referralData.AdditionalNotes,
      PhysicianName: referralData.PhysicianName,
      PhysicianLicense: referralData.PhysicianLicense,
      PhysicianPhone: referralData.PhysicianPhone,
      PhysicianSignature: referralData.PhysicianSignature
    };

    return this.http.post(`${this.chmsReferralBase}referral`, apiData).pipe(
      catchError(this.handleError)
    );
  }

  updateReferralStatus(referralId: number, statusUpdate: ReferralStatusUpdate): Observable<any> {
    if (!referralId || referralId <= 0) {
      return throwError(() => new Error('Invalid referral ID'));
    }

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

//Reimbursement
uploadReimbursementDocument(formData: FormData): Observable<any> {
  return this.http.post<any>(`${this.chmsReimbursementDocumentsBase}upload`, formData).pipe(
    catchError(this.handleError)
  );
}

getDocumentsByReimbursementId(reimbursementId: string): Observable<ReimbursementDocument[]> {
  return this.http.get<any[]>(`${this.chmsReimbursementDocumentsBase}by-reimbursement/${reimbursementId}`).pipe(
    map(documents =>
      documents.map(doc => ({
        documentID: doc.DocumentID,
        reimbursementId: doc.ReimbursementID,
        description: doc.Description,
        fileName: doc.FileName,
        filePath: doc.FilePath,
        fileType: doc.FileType,
        fileSize: doc.FileSize,
        uploadDate: new Date(doc.UploadDate),
        uploadedBy: doc.UploadedBy
      }))
    ),
    catchError(this.handleError)
  );
}

}