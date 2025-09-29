import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { PatientMedicalHistory } from 'src/app/models/medical.model';

@Component({
  selector: 'app-patient-medical-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-medical-history.component.html',
  styleUrls: ['./patient-medical-history.component.css']
})
export class PatientMedicalHistoryComponent implements OnInit {
  @Input() cardNumber: string = '';
  @Input() showSearch: boolean = true;
  @Output() closeDialog = new EventEmitter<void>();
  
  patientData: PatientMedicalHistory | null = null;
  editMode: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Should come from auth service ideally
  private createdBy = '00000000-0000-0000-0000-000000000000';

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    // If cardNumber is provided and search is hidden, automatically search
    if (this.cardNumber && !this.showSearch) {
      this.searchPatient();
    }
  }

  searchPatient(): void {
    const searchCardNumber = this.cardNumber || this.cardNumber;
    if (!searchCardNumber.trim()) {
      this.errorMessage = 'Please enter a card number';
      return;
    }

    this.resetMessages();
    this.loading = true;

    this.medicalService.getPatientByCardNumberHistory(searchCardNumber).subscribe({
      next: (response) => {
        this.loading = false;

        if (Array.isArray(response) && response.length > 0) {
          this.patientData = response[0];
          this.editMode = false;
        } else {
          this.patientData = null;
          this.errorMessage = 'No patient medical history found for this card number';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching patient history:', err);
        this.errorMessage = err.error?.message || 'Failed to fetch patient history';
        this.patientData = null;
      }
    });
  }

  saveChanges(): void {
    if (!this.patientData) return;

    this.resetMessages();
    this.loading = true;

    const updateData = {
      CardNumber: this.patientData.CardNumber,
      FirstName: this.patientData.FirstName,
      LastName: this.patientData.LastName,
      FatherName: this.patientData.FatherName,
      DateOfBirth: this.patientData.DateOfBirth,
      Age: this.patientData.Age,
      BloodType: this.patientData.BloodType,
      Allergies: this.patientData.Allergies,
      MedicalHistory: this.patientData.MedicalHistory,
      ClinicalFindings: this.patientData.ClinicalFindings,
      ChiefComplaint: this.patientData.ChiefComplaint,
      PulseRate: this.patientData.PulseRate,
      Temperature: this.patientData.Temperature,
      BloodPressure: this.patientData.BloodPressure,
      BMI: this.patientData.BMI,
      Height: this.patientData.Height,
      Weight: this.patientData.Weight,
      VisitDate: this.patientData.VisitDate,
      NextAppointment: this.patientData.NextAppointment,
      TreatmentPlan: this.patientData.TreatmentPlan,
      CreatedBy: this.createdBy
    };

    this.medicalService.updatePatientHistory(updateData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Patient medical history saved successfully.';
        this.editMode = false;
        this.searchPatient(); // reload latest data
      },
      error: (err) => {
        this.loading = false;
        console.error('Error saving medical history:', err);
        this.errorMessage = err.error?.message || 'Failed to save medical history.';
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.resetMessages();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.resetMessages();
    this.searchPatient(); // reload original data
  }

  closeDialogHandler(): void {
    this.closeDialog.emit();
  }

  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  isFieldEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
