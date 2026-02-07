import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDoctorCard } from '../../models/medical.model';

// Interface to match the API response structure (fixed casing to match API exactly)
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
  gender?: string; // Lowercase to match API
  phone?: string; // Lowercase to match API
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
  selector: 'app-patient-card',
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.css']
})
export class PatientCardComponent {
  @Input() patient: ExtendedPatientDoctorCard | null = null;
  @Input() className: string = '';
  @Input() showEditButton: boolean = false;
  @Output() editClick = new EventEmitter<void>();

  getFullName(): string {
    if (!this.patient) return '';
    return `${this.patient.FirstName || ''} ${this.patient.LastName || ''}`.trim();
  }

  getGenderDisplay(): string {
    if (!this.patient?.gender) return 'N/A';
    const g = this.patient.gender.toUpperCase();
    if (g.includes('MALE') || g.includes('ወንድ') || g === 'M') return 'Male';
    if (g.includes('FEMALE') || g.includes('ሴት') || g === 'F') return 'Female';
    return this.patient.gender; // Fallback to raw value if not matched
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  getRequestTypeClass(): string {
    if (!this.patient?.RequestType) return '';
    const type = this.patient.RequestType.toLowerCase();
    if (type.includes('follow')) return 'follow-up';
    if (type.includes('exam')) return 'examination';
    if (type.includes('emergency')) return 'emergency';
    return '';
  }

  onEditClick(): void {
    this.editClick.emit();
  }
}