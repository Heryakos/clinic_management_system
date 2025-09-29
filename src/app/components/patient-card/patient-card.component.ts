import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDoctorCard } from '../../models/medical.model';

// Interface to match the API response structure
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
    if (!this.patient?.Gender) return 'N/A';
    return this.patient.Gender === 'M' ? 'Male' : this.patient.Gender === 'F' ? 'Female' : this.patient.Gender;
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