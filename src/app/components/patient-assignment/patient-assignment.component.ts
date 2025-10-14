import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { PatientAssignment, Room, PatientSummary } from 'src/app/models/medical.model';

@Component({
  selector: 'app-patient-assignment',
  templateUrl: './patient-assignment.component.html',
  styleUrls: ['./patient-assignment.component.css']
})
export class PatientAssignmentComponent implements OnInit {
  assignmentForm!: FormGroup;
  patientSearchForm!: FormGroup;
  patients: PatientSummary[] = [];
  rooms: Room[] = [];
  assignments: PatientAssignment[] = [];
  selectedPatient: PatientSummary | null = null;
  isSubmitting = false;
  isSearching = false;
  searched = false;
  createdBy: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadRooms();
    this.loadAssignments();
    this.loadUserData();
  }

  initializeForms(): void {
    this.assignmentForm = this.fb.group({
      cardID: ['', Validators.required],
      assignedRoom: ['', Validators.required],
      doctorID: ['', Validators.required]
    });

    this.patientSearchForm = this.fb.group({
      cardNumber: ['', Validators.required]
    });
  }

  loadUserData(): void {
    // Load current user data - you may need to adjust this based on your authentication
    this.createdBy = 'current-user-id';
  }

  loadRooms(): void {
    this.medicalService.getRooms().subscribe(
      (rooms: Room[]) => {
        this.rooms = rooms;
      },
      error => {
        console.error('Error loading rooms:', error);
        this.showErrorMessage(`Error loading rooms. Please try again.`);
      }
    );
  }

  loadAssignments(): void {
    this.medicalService.getPatientAssignments().subscribe(
      (assignments: PatientAssignment[]) => {
        this.assignments = assignments;
      },
      error => {
        console.error('Error loading assignments:', error);
        this.showErrorMessage(`Error loading patient assignments. Please try again.`);
      }
    );
  }

  onPatientSearch(): void {
    if (this.patientSearchForm.valid) {
      this.isSearching = true;
      this.searched = true;
      
      const cardNumber = this.patientSearchForm.value.cardNumber;
      this.medicalService.getPatientByCardNumber(cardNumber).subscribe(
        (response: PatientSummary[]) => {
          this.selectedPatient = response.length > 0 ? response[0] : null;
          if (this.selectedPatient) {
            this.assignmentForm.patchValue({
              cardID: this.selectedPatient.PatientID
            });
          }
          this.isSearching = false;
        },
        error => {
          this.selectedPatient = null;
          this.isSearching = false;
          this.showErrorMessage(`No patient found or error occurred. Please try again.`);
        }
      );
    }
  }

  onSubmit(): void {
    if (this.assignmentForm.valid && this.selectedPatient) {
      this.isSubmitting = true;
      
      const assignment: PatientAssignment = {
        assignmentID: 0, // Will be set by the API
        cardID: this.assignmentForm.value.cardID,
        patientID: this.selectedPatient.PatientID,
        assignedRoom: this.assignmentForm.value.assignedRoom,
        doctorID: this.assignmentForm.value.doctorID,
        assignedBy: this.createdBy || '',
        assignmentDate: new Date(),
        status: 'Active',
        isActive: true
      };

      this.medicalService.assignPatient(assignment).subscribe(
        () => {
          this.isSubmitting = false;
          this.assignmentForm.reset();
          this.selectedPatient = null;
          this.searched = false;
          this.loadAssignments();
          this.showSuccessMessage(`Patient assigned successfully!`);
        },
        error => {
          this.isSubmitting = false;
          this.showErrorMessage(`Error assigning patient. Please try again.`);
        }
      );
    }
  }

  updateAssignmentStatus(assignmentId: number, status: string): void {
    this.medicalService.updateAssignmentStatus(assignmentId, status).subscribe(
      () => {
        this.loadAssignments();
        this.showSuccessMessage(`Assignment status updated successfully!`);
      },
      error => {
        this.showErrorMessage(`Error updating assignment status. Please try again.`);
      }
    );
  }

  // getRoomName(roomId: number): string {
  //   const room = this.rooms.find(r => r.roomID === roomId);
  //   return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
  // }
  
  getRoomName(roomId: string): string {
    const room = this.rooms.find(r => r.roomID === roomId);
    return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.PatientID === patientId);
    return patient ? patient.FullName : 'Unknown Patient';
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