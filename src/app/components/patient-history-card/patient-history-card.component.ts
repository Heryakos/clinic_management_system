import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';
import { PatientSummary, PatientHistory, Room } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import { PatientInfoCardComponent } from '../patient-info-card/patient-info-card.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-patient-history-card',
  templateUrl: './patient-history-card.component.html',
  styleUrls: ['./patient-history-card.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PatientInfoCardComponent, MatDialogModule]
})
export class PatientHistoryCardComponent implements OnInit {
  searchForm!: FormGroup;
  assignmentForm!: FormGroup;
  patient: PatientSummary | null = null;
  patientHistory: PatientHistory[] = [];
  rooms: Room[] = [];
  uniqueRoomTypes: string[] = [];
  availableDoctors: any[] = [];
  activePatients: PatientSummary[] = [];
  isSearching = false;
  isAssigning = false;
  searched = false;
  isSearchMode = false;
  showAssignmentForm = false;
  createdBy: string | null = null;
  employeeID: string | null = null;
  selectedDoctorUserName: string | null = null;
  pendingCount: number = 0;
  // Tabs for active vs history (sick-leave finished) patients
  selectedTab: 'current' | 'history' = 'current';
  currentActivePatients: PatientSummary[] = [];
  historyPatients: PatientSummary[] = [];
  // Tabs and data for patient history / assignments
  selectedHistoryTab: 'current' | 'completed' = 'current';
  currentAssignments: PatientHistory[] = [];
  completedAssignments: PatientHistory[] = [];
  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeSearchForm();
    this.initializeAssignmentForm();
    this.loadRooms();
    this.loadUserData();
    this.loadActivePatients();
    this.pendingCount = this.patientHistory.filter(history => history.assignmentStatus?.toLowerCase() === 'pending').length;
  }

  initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      cardNumber: ['', Validators.required]
    });
  }

  initializeAssignmentForm(): void {
    this.assignmentForm = this.fb.group({
      assignedRoom: ['', Validators.required],
      doctorID: ['', Validators.required]
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        if (response && response.c_Employees && response.c_Employees.length > 0) {
          const employee = response.c_Employees[0];
          this.createdBy = employee.user_ID ?? null;
          this.employeeID = employee.employee_Id ?? null;
        } else {
          console.error('No employee data found');
        }
      },
      error => {
        console.error('Error loading user data:', error);
      }
    );
  }

  loadRooms(): void {
    this.medicalService.getRooms().subscribe(
      (rooms: any[]) => {
        this.rooms = rooms.map(room => ({
          roomID: room.RoomID,
          userID: room.UserID,
          userName: room.UserName,
          fName: room.FName,
          mName: room.MName,
          roomType: room.RoomType,
          roleName: room.RoleName,
          roomNumber: room.RoomNumber,
          isActive: room.IsActive,
          department: room.Department,
          roomName: room.RoomName,
          createdDate: room.CreatedDate
        }));
        this.uniqueRoomTypes = [...new Set(this.rooms.map(room => room.roomType))].sort((a, b) => a.localeCompare(b));
      },
      error => {
        console.error('Error loading rooms:', error);
      }
    );
  }

  loadActivePatients(): void {
    this.isSearching = true;
    this.medicalService.getAllActivePatients().subscribe(
      (patients: any[]) => {
        // Deduplicate by RequestNumber (or by PatientID/CardNumber if no RequestNumber)
        const dedupMap = new Map<string, any>();
        (patients || []).forEach(p => {
          const key = p.RequestNumber || `${p.PatientID}_${p.CardNumber}`;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, p);
          } else {
            const existing = dedupMap.get(key);
            // Keep the latest by RequestDate if duplicates exist
            const existingDate = existing.RequestDate ? new Date(existing.RequestDate) : null;
            const currentDate = p.RequestDate ? new Date(p.RequestDate) : null;
            if (currentDate && (!existingDate || currentDate > existingDate)) {
              dedupMap.set(key, p);
            }
          }
        });

        const allPatients = Array.from(dedupMap.values());

        // Split into current vs history based on CurrentRequestSickLeave flag coming from the API.
        const currentRaw = allPatients.filter(p => !p.CurrentRequestSickLeave);
        const historyRaw = allPatients.filter(p => p.CurrentRequestSickLeave);

        const mapPatient = (patient: any): PatientSummary => ({
          PatientID: patient.PatientID,
          CardNumber: patient.CardNumber,
          FullName: patient.FullName,
          FatherName: patient.FatherName,
          DateOfBirth: new Date(patient.DateOfBirth),
          Age: patient.Age,
          gender: patient.gender,
          phone: patient.Phone,
          Address: patient.Address,
          BloodType: patient.BloodType,
          TotalVisits: patient.TotalVisits,
          LastVisitDate: patient.LastVisitDate ? new Date(patient.LastVisitDate) : undefined,
          RegistrationDate: patient.RegistrationDate,
          SupervisorApproval: patient.SupervisorApproval,
          EmployeeID: patient.EmployeeID,
          Photo: patient.Photo,
          RequestType: patient.RequestType,
          RequestNumber: patient.RequestNumber,
          RoomType: patient.RoomType,
          RoomNumber: patient.RoomNumber,
          StaffUserID: patient.StaffUserID,
          IsActive: patient.IS_Active
        });

        this.currentActivePatients = currentRaw.map(mapPatient);
        this.historyPatients = historyRaw.map(mapPatient);

        // Keep activePatients pointing at the currently-selected tab for backward compatibility
        this.activePatients = this.selectedTab === 'current'
          ? this.currentActivePatients
          : this.historyPatients;

        this.isSearching = false;
      },
      error => {
        console.error('Error loading active patients:', error);
        this.activePatients = [];
        this.isSearching = false;
      }
    );
  }

  openNotificationDialog(): void {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { employeeID: this.employeeID, selectedDoctorUserName: this.selectedDoctorUserName }
    });
    console.log('history', this.employeeID);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.success) {
          this.showSuccessMessage(result.success);
        } else if (result.error) {
          this.showErrorMessage(result.error);
        }
      }
    });
  }

  get hasPendingAssignment(): boolean {
    return this.patientHistory.some(history => 
      history.assignmentStatus?.toLowerCase() === 'pending'
    );
  }

  get canAssignPatient(): boolean {
    if (!this.patientHistory || this.patientHistory.length === 0) {
      return true;
    }
    
    const latestAssignment = this.patientHistory[0]; // Assuming sorted by date descending
    const status = latestAssignment.assignmentStatus?.toLowerCase();
    
    // Allow assignment only if the latest assignment is completed, rejected, or doesn't exist
    return !status || status === 'completed' || status === 'rejected' || status === 'cancelled';
  }

  onPatientRowClick(patient: PatientSummary): void {
    this.isSearchMode = false;
    this.patient = patient;
    this.searched = true;
    // When assigning, default the history tab to current assignments
    this.selectedHistoryTab = 'current';
    this.loadPatientHistory(patient.CardNumber);
  }

  onRoomChange(event: Event): void {
    const roomType = (event.target as HTMLSelectElement).value;
    this.availableDoctors = [];
    this.assignmentForm.get('doctorID')?.setValue('');

    if (roomType) {
      this.availableDoctors = this.rooms
        .filter(room => room.roomType === roomType && room.isActive)
        .map(room => ({
          userName: room.userName,
          fName: room.fName,
          mName: room.mName,
          userId: room.userID
        }))
        .filter((doctor, index, self) =>
          index === self.findIndex(d => d.userName === doctor.userName)
        );
      
      if (this.availableDoctors.length > 0) {
        this.assignmentForm.get('doctorID')?.enable();
        // Set the GUID value for the first doctor as default
        this.assignmentForm.get('doctorID')?.setValue(this.availableDoctors[0].userId);
        this.selectedDoctorUserName = this.availableDoctors[0].userName;
      } else {
        this.assignmentForm.get('doctorID')?.disable();
        this.selectedDoctorUserName = null;
      }
    } else {
      this.assignmentForm.get('doctorID')?.disable();
      this.selectedDoctorUserName = null;
    }
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      this.isSearchMode = true;
      this.isSearching = true;
      this.searched = true;
      this.showAssignmentForm = false;

      const cardNumber = this.searchForm.value.cardNumber;
      this.medicalService.getPatientByCardNumber(cardNumber).subscribe(
        (response: any[]) => {
          this.patient = response.length > 0 ? {
            PatientID: response[0].PatientID,
            CardNumber: response[0].CardNumber,
            FullName: response[0].FullName,
            FatherName: response[0].FatherName,
            DateOfBirth: new Date(response[0].DateOfBirth),
            Age: response[0].Age,
            Gender: response[0].Gender,
            phone: response[0].Phone,
            Address: response[0].Address,
            BloodType: response[0].BloodType,
            TotalVisits: response[0].TotalVisits,
            LastVisitDate: response[0].LastVisitDate ? new Date(response[0].LastVisitDate) : undefined,
            RegistrationDate: response[0].RegistrationDate ? new Date(response[0].RegistrationDate) : undefined,
            SupervisorApproval: response[0].SupervisorApproval,
            EmployeeID: response[0].EmployeeID,
            Photo: response[0].Photo,
            RequestType: response[0].RequestType,
            RequestNumber: response[0].RequestNumber,
            RoomType: response[0].RoomType,
            RoomNumber: response[0].RoomNumber,
            StaffUserID: response[0].StaffUserID,
            IsActive: response[0].IS_Active
          } : null;
          
          if (this.patient) {
            this.loadPatientHistory(cardNumber);
          } else {
            this.patientHistory = [];
          }
          this.isSearching = false;
        },
        error => {
          this.patient = null;
          this.patientHistory = [];
          this.isSearching = false;
          this.showErrorMessage(`No record found or error occurred. Please try again.`);
        }
      );
    }
  }

  loadPatientHistory(cardNumber: string | number): void {
    this.medicalService.getPatientHistory(cardNumber).subscribe(
      (history: any[]) => {
        // Map API results to PatientHistory model
        const mapped = (history || []).map(item => ({
          patientID: item.PatientID,
          cardNumber: item.CardNumber,
          firstName: item.FirstName,
          lastName: item.LastName,
          gender: item.gender,
          dateOfBirth: new Date(item.DateOfBirth),
          CardID: item.CardID,
          visitDate: item.VisitDate ? new Date(item.VisitDate) : undefined,
          requestType: item.RequestType,
          chiefComplaint: item.ChiefComplaint,
          diagnosis: item.Diagnosis,
          treatmentPlan: item.TreatmentPlan,
          roomID: item.RoomID,
          roomNumber: item.RoomNumber,
          roomName: item.RoomName,
          roomType: item.RoomType,
          assignmentID: item.AssignmentID,
          assignmentDate: item.AssignmentDate ? new Date(item.AssignmentDate) : undefined,
          assignmentStatus: item.AssignmentStatus,
          doctorName: item.DoctorName
        }));

        // Sort by visitDate (or assignmentDate) descending so index 0 is the latest
        this.patientHistory = mapped.sort((a, b) => {
          const aTime = a.visitDate ? a.visitDate.getTime() : (a.assignmentDate ? a.assignmentDate.getTime() : 0);
          const bTime = b.visitDate ? b.visitDate.getTime() : (b.assignmentDate ? b.assignmentDate.getTime() : 0);
          return bTime - aTime;
        });

        // Update pending count based on latest data
        this.pendingCount = this.patientHistory.filter(h => h.assignmentStatus?.toLowerCase() === 'pending').length;

        // Split history into current vs completed assignments
        this.currentAssignments = this.patientHistory.filter(h => {
          const status = (h.assignmentStatus || '').toLowerCase();
          // treat no status or pending/approved as "current"
          return !status || status === 'pending' || status === 'approved';
        });

        this.completedAssignments = this.patientHistory.filter(h => {
          const status = (h.assignmentStatus || '').toLowerCase();
          // completed / cancelled / rejected go to completed tab
          return status === 'completed' || status === 'cancelled' || status === 'rejected';
        });
      },
      error => {
        console.error('Error loading patient history:', error);
        this.patientHistory = [];
        this.currentAssignments = [];
        this.completedAssignments = [];
        this.pendingCount = 0;
      }
    );
  }
  onAssignmentSubmit(): void {
    if (this.assignmentForm.valid && this.patient) {
      this.isAssigning = true;
      this.medicalService.getEmployeeById(environment.username).subscribe(
        (response: any) => {
          const employee = response?.c_Employees?.[0];
          this.createdBy = employee.user_ID ?? null;
          
          // Find the selected doctor to get their UserID
          const selectedDoctor = this.availableDoctors.find(
            doctor => doctor.userId === this.assignmentForm.value.doctorID
          );
  
          if (!selectedDoctor) {
            this.showErrorMessage(`Selected doctor not found.`);
            this.isAssigning = false;
            return;
          }
  
          // Find the room to get RoomID
          const selectedRoom = this.rooms.find(
            room => room.roomType === this.assignmentForm.value.assignedRoom
          );
  
          if (!selectedRoom) {
            this.showErrorMessage(`Selected room not found.`);
            this.isAssigning = false;
            return;
          }
  
          // Use the latest "current" assignment (or latest history entry) for cardID
          const latestForAssignment = this.currentAssignments.length > 0
            ? this.currentAssignments[0]
            : this.patientHistory[0];

          if (!latestForAssignment || !latestForAssignment.CardID) {
            this.showErrorMessage(`No valid visit found to assign. Please refresh and try again.`);
            this.isAssigning = false;
            return;
          }

          const assignment = {
            cardID: latestForAssignment.CardID,
            assignedRoom: selectedRoom.roomID, // RoomID (GUID)
            doctorID: selectedDoctor.userId, // UserID (GUID)
            assignedBy: this.createdBy, // UserID of the current user
          };
  
          console.log('Assignment data:', assignment); // For debugging
          
          this.medicalService.assignPatient(assignment).subscribe(
            () => {
              this.isAssigning = false;
              this.assignmentForm.reset();
              this.showAssignmentForm = false;
              this.loadPatientHistory(this.patient!.CardNumber);
              this.showErrorMessage(`Patient assigned to room successfully!`);
            },
            error => {
              this.isAssigning = false;
              console.error('Assignment error:', error);
              this.showErrorMessage(`Error assigning patient to room. Please try again.`);
            }
          );
        },
        error => {
          this.isAssigning = false;
          console.error('Error loading employee data:', error);
          this.showErrorMessage(`Error loading user data. Please try again.`);
        }
      );
    }
  }
  // onAssignmentSubmit(): void {
  //   if (this.assignmentForm.valid && this.patient) {
  //     this.isAssigning = true;
  //     this.medicalService.getEmployeeById(environment.username).subscribe(
  //       (response: any) => {
  //         const employee = response?.c_Employees?.[0];
  //         this.createdBy = employee.user_ID ?? null;
  //         const assignment = {
  //           cardID: this.patientHistory[0]?.CardID,
  //           assignedRoom: this.rooms.find(r => r.roomType === this.assignmentForm.value.assignedRoom)?.roomID,
  //           doctorID: this.assignmentForm.value.doctorID,
  //           assignedBy: this.createdBy,
  //         };
          
  //         this.medicalService.assignPatient(assignment).subscribe(
  //           () => {
  //             this.isAssigning = false;
  //             this.assignmentForm.reset();
  //             this.showAssignmentForm = false;
  //             this.loadPatientHistory(this.patient!.CardNumber);
  //             alert('Patient assigned to room successfully!');
  //           },
  //           error => {
  //             this.isAssigning = false;
  //             alert('Error assigning patient to room. Please try again.');
  //           }
  //         );
  //       }
  //     );
  //   }
  // }

  toggleAssignmentForm(): void {
    this.showAssignmentForm = !this.showAssignmentForm;
    if (!this.showAssignmentForm) {
      this.assignmentForm.reset();
      this.availableDoctors = [];
      this.assignmentForm.get('doctorID')?.disable();
      this.selectedDoctorUserName = null;
    }
  }

  resetSearch(): void {
    this.isSearchMode = false;
    this.patient = null;
    this.patientHistory = [];
    this.searched = false;
    this.searchForm.reset();
    this.showAssignmentForm = false;
    this.selectedDoctorUserName = null;
    this.loadActivePatients();
  }

  getRoomName(roomId: string): string {
    const room = this.rooms.find(r => r.roomID === roomId);
    return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
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