import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, interval } from 'rxjs';
import { map, takeUntil, switchMap, catchError } from 'rxjs/operators';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';

// Interface to match the API response structure for patient data
interface ExtendedPatientDoctorCard {
  PatientID?: number;
  CardNumber?: string;
  FullName?: string;
  FirstName?: string;
  LastName?: string;
  FatherName?: string;
  GrandFatherName?: string;
  DateOfBirth?: string;
  Age?: number;
  Gender?: string;
  Phone?: string;
  Address?: string;
  Region?: string;
  SubCity?: string;
  Woreda?: string;
  HouseNumber?: string;
  EmergencyContact?: string;
  EmergencyPhone?: string;
  BloodType?: string;
  Allergies?: string;
  MedicalHistory?: string;
  IsActive?: boolean;
  RegistrationDate?: string;
  CreatedBy?: string;
  RoomName?: string;
  RoomType?: string;
  RoomNumber?: string;
  SupervisorApproval?: boolean;
  EmployeeID?: string;
  Photo?: string;
  RequestType?: string;
  RequestNumber?: string;
  StaffUserID?: string;
  TotalVisits?: number;
  LastVisitDate?: string;
  LastDiagnosis?: string;
  ClinicalFindings?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Observable properties for dashboard statistics
  pendingRequests$!: Observable<number>;
  totalPatients$!: Observable<number>;
  nearExpiryItems$!: Observable<number>;
  activeSickLeaves$!: Observable<number>;

  // Current user and patient data
  currentUser: any = null;
  currentUserPatientData: ExtendedPatientDoctorCard | null = null;
  loading = true;
  currentDateTime = new Date();

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    // Initialize dashboard statistics
    this.initializeDashboardStats();
    
    // Load current user data
    this.loadCurrentUserData();

    // Update current time every minute
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentDateTime = new Date();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDashboardStats(): void {
    // Initialize pending requests observable
    this.pendingRequests$ = this.medicalService.getAllMedicalRequests().pipe(
      map(requests => {
        if (!requests || !Array.isArray(requests)) return 0;
        return requests.filter((r: { status: string; }) => 
          r.status && r.status.toLowerCase() === 'pending'
        ).length;
      }),
      catchError(() => [0]),
      takeUntil(this.destroy$)
    );

    // Initialize total patients observable
    this.totalPatients$ = this.medicalService.getPatients().pipe(
      map(patients => {
        if (!patients || !Array.isArray(patients)) return 0;
        return patients.length;
      }),
      catchError(() => [0]),
      takeUntil(this.destroy$)
    );

    // Initialize near expiry items observable
    this.nearExpiryItems$ = this.medicalService.getNearExpiryItems().pipe(
      map(items => {
        if (!items || !Array.isArray(items)) return 0;
        return items.length;
      }),
      catchError(() => [0]),
      takeUntil(this.destroy$)
    );

    // Initialize active sick leaves observable
    this.activeSickLeaves$ = this.medicalService.getSickLeaveCertificates().pipe(
      map(leaves => {
        if (!leaves || !Array.isArray(leaves)) return 0;
        return leaves.filter((l: { status: string; }) => 
          l.status && l.status.toLowerCase() === 'active'
        ).length;
      }),
      catchError(() => [0]),
      takeUntil(this.destroy$)
    );
  }

  private loadCurrentUserData(): void {
    this.loading = true;

    // First, get employee data from environment.username
    this.medicalService.getEmployeeById(environment.username)
      .pipe(
        switchMap((employee: any) => {
          console.log('Employee data:', employee);
          this.currentUser = employee;

          // If employee has a card number or patient ID, get patient data
          if (employee?.CardNumber) {
            return this.medicalService.getPatient(employee.CardNumber);
          } else if (employee?.EmployeeID) {
            // Try to get patient data using employee ID as card number
            return this.medicalService.getPatient(employee.EmployeeID);
          } else {
            // If no card number, try to get user data by username
            return this.medicalService.getDoctorByUserId(environment.username);
          }
        }),
        catchError((error) => {
          console.error('Error loading user data:', error);
          // If patient data fails, try to get user data
          return this.medicalService.getDoctorByUserId(environment.username);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (patientData: any) => {
          console.log('Patient/User data:', patientData);
          
          if (patientData) {
            // Transform the data to match the expected interface
            this.currentUserPatientData = this.transformPatientData(patientData);
          } else {
            // If no patient data, create a basic profile from employee data
            this.currentUserPatientData = this.createBasicProfile();
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading current user patient data:', error);
          // Create a basic profile from employee data if available
          this.currentUserPatientData = this.createBasicProfile();
          this.loading = false;
        }
      });
  }

  private transformPatientData(data: any): ExtendedPatientDoctorCard {
    // Handle both single object and array responses
    const patientData = Array.isArray(data) ? data[0] : data;
    
    if (!patientData) {
      const basicProfile = this.createBasicProfile();
      return basicProfile || {} as ExtendedPatientDoctorCard;
    }
    

    return {
      PatientID: patientData.PatientID || patientData.patientID,
      CardNumber: patientData.CardNumber || patientData.cardNumber || this.currentUser?.CardNumber,
      FullName: patientData.FullName || patientData.fullName || 
                `${patientData.FirstName || patientData.firstName || ''} ${patientData.LastName || patientData.lastName || ''}`.trim(),
      FirstName: patientData.FirstName || patientData.firstName || this.currentUser?.FirstName,
      LastName: patientData.LastName || patientData.lastName || this.currentUser?.LastName,
      FatherName: patientData.FatherName || patientData.fatherName,
      GrandFatherName: patientData.GrandFatherName || patientData.grandFatherName,
      DateOfBirth: patientData.DateOfBirth || patientData.dateOfBirth,
      Age: patientData.Age || patientData.age,
      Gender: patientData.Gender || patientData.gender,
      Phone: patientData.Phone || patientData.phone,
      Address: patientData.Address || patientData.address,
      Region: patientData.Region || patientData.region,
      SubCity: patientData.SubCity || patientData.subCity,
      Woreda: patientData.Woreda || patientData.woreda,
      HouseNumber: patientData.HouseNumber || patientData.houseNumber,
      EmergencyContact: patientData.EmergencyContact || patientData.emergencyContact,
      EmergencyPhone: patientData.EmergencyPhone || patientData.emergencyPhone,
      BloodType: patientData.BloodType || patientData.bloodType,
      Allergies: patientData.Allergies || patientData.allergies,
      MedicalHistory: patientData.MedicalHistory || patientData.medicalHistory,
      IsActive: patientData.IsActive !== undefined ? patientData.IsActive : patientData.isActive !== undefined ? patientData.isActive : true,
      RegistrationDate: patientData.RegistrationDate || patientData.registrationDate,
      CreatedBy: patientData.CreatedBy || patientData.createdBy,
      RoomName: patientData.RoomName || patientData.roomName,
      RoomType: patientData.RoomType || patientData.roomType,
      RoomNumber: patientData.RoomNumber || patientData.roomNumber,
      SupervisorApproval: patientData.SupervisorApproval !== undefined ? patientData.SupervisorApproval : patientData.supervisorApproval,
      EmployeeID: patientData.EmployeeID || patientData.employeeID || this.currentUser?.EmployeeID,
      Photo: patientData.Photo || patientData.photo,
      RequestType: patientData.RequestType || patientData.requestType,
      RequestNumber: patientData.RequestNumber || patientData.requestNumber,
      StaffUserID: patientData.StaffUserID || patientData.staffUserID,
      TotalVisits: patientData.TotalVisits || patientData.totalVisits,
      LastVisitDate: patientData.LastVisitDate || patientData.lastVisitDate,
      LastDiagnosis: patientData.LastDiagnosis || patientData.lastDiagnosis,
      ClinicalFindings: patientData.ClinicalFindings || patientData.clinicalFindings
    };
  }

  private createBasicProfile(): ExtendedPatientDoctorCard | null {
    if (!this.currentUser) {
      return null;
    }

    return {
      PatientID: this.currentUser.EmployeeID ? parseInt(this.currentUser.EmployeeID) : undefined,
      CardNumber: this.currentUser.CardNumber || this.currentUser.EmployeeID,
      FullName: `${this.currentUser.FirstName || ''} ${this.currentUser.LastName || ''}`.trim() || 'Unknown User',
      FirstName: this.currentUser.FirstName,
      LastName: this.currentUser.LastName,
      EmployeeID: this.currentUser.EmployeeID,
      IsActive: true,
      RegistrationDate: new Date().toISOString(),
      RoomName: 'Staff Area',
      RoomType: 'Administrative'
    };
  }
}