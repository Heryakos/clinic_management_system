export interface MedicalRequest {
  requestID: string;
  employeeCode: string;
  requestDate: Date;
  supervisorApproval: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestType: 'examination' | 'emergency' | 'follow-up';
  reason?: string;
  supervisorComments?: string; 
  createdBy:string;
  isSickLeave: boolean;
  preferredDate?: string; // New
  preferredTime?: string; // New
}

export interface PatientDoctorCard {
  patientID: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  fatherName?: string | null;
  grandFatherName?: string | null;
  dateOfBirth?: string;
  age: number;
  gender: 'M' | 'F';
  phone?: string | null;
  address?: string | null;
  region?: string | null;
  subCity?: string | null;
  woreda?: string | null;
  houseNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
  isActive?: boolean;
  RegistrationDate?: Date;
  createdBy?: string;
  lastDiagnosis?: string;
  clinicalFindings?: string;
  fullName?: string;
  roomName?: string;
  roomType?: string;
  roomNumber?: string;
  supervisorApproval?: boolean;
  employeeID?: string;
  photo?: string;
  requestType?: string;
  requestNumber?: string;
  staffUserID?: string;
  totalVisits?: number;
  lastVisitDate?: string;
  weight?: number | null;
  height?: number | null;
  bloodPressure?: string | null;
  pulseRate?: string | null;
  temperature?: string | null;
  chiefComplaint?: string | null;
  bmi?: string | null;
  nextAppointment?: string | null;
  treatmentPlan?: string | null;
}

export interface PatientMedicalHistory {
  HistoryID?: number;
  CardNumber: string;
  FirstName?: string;
  LastName?: string;
  FatherName?: string;
  DateOfBirth?: string;
  Age?: number;
  BloodType?: string;
  Allergies?: string;
  MedicalHistory?: string;
  AssignedRoom?: number;
  ClinicalFindings?: string;
  ChiefComplaint?: string;
  PulseRate?: string;
  Temperature?: string;
  BloodPressure?: string;
  BMI?: string;
  Height?: string;
  Weight?: string;
  VisitDate?: string;
  NextAppointment?: string;
  TreatmentPlan?: string;
  PatientID?: number;
  Patient_Name?: string;
  CreatedDate?:string;
}
// export interface PatientCard {
//   patientID: number;
//   cardNumber: string;
//   fullName: string;
//   fatherName?: string;
//   dateOfBirth?: string;
//   age: number;
//   gender: string;
//   phone?: string | null;
//   address?: string;
//   bloodType?: string | null;
//   registrationDate?: string;
//   totalVisits?: number;
//   lastVisitDate?: string;
//   lastDiagnosis?: string | null;
// }

export interface PatientSummary {
  PatientID: number;
  CardNumber: string;
  CardID?: number;
  FullName: string;
  FatherName?: string;
  DateOfBirth: Date;
  Age: number;
  gender?: string;
  Gender?: string;
  phone?: string;
  Address?: string;
  BloodType?: string;
  TotalVisits: number;
  LastVisitDate?: Date;
  LastDiagnosis?: string;
  RegistrationDate?: Date;
  // RegistrationDate?:string;
  SupervisorApproval?:string;
  EmployeeID?:string;
  Photo?:string;
  RequestType?:string;
  RequestNumber?:string;
  RoomType?:string;
  RoomNumber?:string;
  StaffUserID?:string;
  IsActive?: boolean;


}

export interface LaboratoryTest {
  cardNumber: string;
  testID: string; // Added for API compatibility
  testNumber: string;
  patientId: number | string;
  patientName: string;
  technicianName: string;
  orderingPhysicianName:string;
  testDate: Date;
  testCategory: 'chemistry' | 'bacteriology' | 'fluid_analysis';
  tests: {
    name: string;
    result: string;
    normalRange: string;
  }[];
  reportedBy: string;
  reportDate: Date;
  reportedByName:string
}

export interface Prescription {
  prescriptionID: string;
  patientId: string;
  patientName: string;
  age: number;
  sex: 'M' | 'F';
  weight: number;
  cardNo: string;
  diagnosis: string;
  medications: {
    name: string;
    strength: string;
    dosageForm: string;
    dose: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    price: number;
  }[];
  prescriber: {
    name: string;
    qualification: string;
    registrationNo: string;
  };
  totalPrice: number;
  date: Date;
}

// medical.model.ts - add fields

// medical.model.ts - update

export interface ExpenseReimbursement {
  reimbursementID: number;
  reimbursementNumber: string;
  patientName: string;
  employeeID: string | null;
  payrollNumber: string | null;
  payrollNo: string | null;
  department: string | null;
  totalAmount: number;
  status: string;
  submissionDate?: Date;  // <-- make optional
  createdBy: string | null;
  approvedBy: string | null;
  investigations: {
    investigationType: string;
    location: string;
    orderedFrom?: string;
    invoiceNumber: string;
    amount: number;
    investigationDate: Date;
  }[];
  orderedFrom?: string | null;
  doneAt?: string | null;
  investigation?: string | null;
  formType?: string | null;
  comments?: string;
  approvedAmount?: number;
}


export interface ExpenseReimbursementDetail {
  DetailID: number;
  ReimbursementID?: number;
  InvestigationType: string;
  Location: string;
  OrderedFrom?: string;
  Amount: number;
  InvestigationDate?: Date;
  status?: string;
  comments?: string;
  approvedBy?: string;
  approvedDate?: Date;
  InvoiceNumber: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  price: number;
  expiryDate?: Date;
}

export interface InventoryRequest {
  id: string;
  requestNumber: string;
  requestedFrom: string;
  reasonForRequest: string;
  roomID?: string;
  items: {
    name: string;
    unit: string;
    quantity: number;
    jobOrderNo?: string;
  }[];
  requestedBy: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'issued';
}

export interface SickLeave {
  certificateID: number;
  employeeID: string;
  employeeName: string | null;
  address: string | null;
  diagnosis: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  doctorName: string | null;
  status: 'Active' | 'Completed' | 'Cancelled' | 'FitToWork';
  issueDate: Date | null;
  doctorID: string;
  createdBy: string | null;
  recommendations: string | null;
  age: number | null;
  sex: string | null;
  examinedOn: Date | null;
  signature: string | null;
  patientID: string | null;
}
export interface ClinicSickLeave {
  EmployeeID: string;
  FirstName: string;
  LastName: string;
  department_name: string | null;
  RequestDate: string;
  UserName: string | null;
  Signature: string | null;
  StartDate: string;
  EndDate: string;
  TotalDays: number;
  DoctorName: string;
  startDate: Date;
  endDate: Date;
  employeeID: string;
  totalDays: number;
  doctorName: string | null;
}
export interface DiagnosticTest {
  id: string;
  patientName: string;
  age: number;
  sex: 'M' | 'F';
  cardNo: string;
  clinicalFindings: string;
  investigation: string;
  result: string;
  recommendation: string;
  physician: string;
  reportDate: Date;
}

export interface User {
  UserID: string;
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'Lab_Tech' | 'Receptionist';
  Department?: string;
  IsActive: boolean;
  CreatedDate: Date;
  LastLoginDate?: Date;
  CreatedBy?: string;
}

export interface PatientAssignment {
  assignmentID: number;
  cardID: number;
  patientID: number;
  assignedRoom: string;
  doctorID: string;
  assignedBy: string;
  assignmentDate: Date;
  status: string;
  isActive: boolean;
}

export interface Room {
  userID:string;
  fName:string;
  mName:string;
  roomID: string;
  roomNumber: string;
  roomName: string;
  roomType: string;
  department?: string;
  capacity?: number;
  isActive: boolean;
  createdDate: Date;
  createdBy?: string;
  userName?: string;
}

export interface PatientHistory {
  patientID: number;
  cardNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date;
  CardID?: number;
  visitDate?: Date;
  requestType?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  roomID?: string;
  roomNumber?: string;
  roomName?: string;
  roomType?: string;
  assignmentID?: number;
  assignmentDate?: Date;
  assignmentStatus?: string;
  doctorName?: string;
}

export interface MedicalRequestView {
  requestID: number;
  requestNumber: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  requestDate: Date;
  requestType: string;
  reason?: string;
  supervisorApproval: boolean;
  supervisorComments?: string;
  status: string;
  approvedByName?: string;
  approvedDate?: Date;
  createdByName?: string;
  isSickLeave: boolean;
  preferredDate?: string; // New
  preferredTime?: string; // New
}

export interface ApprovalRequest {
  approvedBy: string;
  status: string;
  comments?: string;
}

// ===== Reports models =====
export interface MonthlyReportItem {
  category: string;
  count: number;
  amount: number;
}

export interface DepartmentStatistics {
  department: string;
  totalEmployees: number;
  medicalRequests: number;
  sickLeaves: number;
  totalExpenseReimbursements: number;
  expenseReimbursementCount: number;
}

export interface FinancialSummaryDto {
  prescriptionRevenue: number;
  expenseReimbursements: number;
  inventoryValue: number;
  labTestRevenue: number;
}

export interface PatientStatisticsDto {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalVisitsThisMonth: number;
  genderDistribution: { gender: string; count: number }[];
}