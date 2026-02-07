import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { ChangeDetectorRef } from '@angular/core';
interface HistoryItem {
  Section: string;
  CardNumber: string;
  FullName: string;
  FatherName: string;
  BirthDate: string;
  Age: number;
  gender: string;
  phone: string;
  Address: string;
  department_name: string;
  RegistrationDate: string;
  IsEmployeeActive: boolean;
  Photo: string;
  genderDisplay?: string;

  // Visit
  VisitCardID?: number;
  VisitDate?: string;
  VisitDiagnosis?: string;
  DoctorUserName?: string;
  DoctorFullName?: string;

  // Medical History
  HistoryID?: number;
  HistoryVisitDate?: string;
  ChiefComplaint?: string;
  ClinicalFindings?: string;
  Allergies?: string;
  MedicalHistory?: string;
  BloodType?: string;

  // Lab
  LabTestID?: number;
  LabTestNumber?: string;
  LabTestCategory?: string;
  LabTestDate?: string;
  LabDetailID?: number;
  LabTestName?: string;
  LabResult?: string;
  LabNormalRange?: string;
  LabUnit?: string;
  LabIsAbnormal?: boolean;

  // Injection
  InjectionID?: number;
  InjectionNumber?: string;
  InjectionDate?: string;
  InjectionDose?: string;
  InjectionRoute?: string;
  InjectionSite?: string;
  InjectionStatus?: string;

  SortDate?: string;
}

@Component({
  selector: 'app-patient-history-timeline',
  templateUrl: './patient-history-timeline.component.html',
  styleUrls: ['./patient-history-timeline.component.css']
})
export class PatientHistoryTimelineComponent implements OnChanges {
  @Input() cardNumber: string = '';
  @ViewChild('reportContent', { static: false }) reportContent!: ElementRef;

  patient: HistoryItem | null = null;
  history: HistoryItem[] = [];
  loading = false;
  error: string | null = null;
  searchedCardNumber: string = '';
  today = new Date();

  constructor(private medicalService: MedicalService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cardNumber'] && this.cardNumber && this.cardNumber.trim()) {
      const trimmed = this.cardNumber.trim().toUpperCase();
      if (trimmed !== this.searchedCardNumber) {
        this.loadPatientHistory(trimmed);
      }
    } else if (!this.cardNumber) {
      this.clearHistory();
    }
  }

  loadPatientHistory(cardNo: string) {
    this.loading = true;
    this.error = null;
    this.searchedCardNumber = cardNo;
  
    this.medicalService.getPatientFullHistory(cardNo).subscribe({
      next: (data: HistoryItem[]) => {
        if (data.length === 0) {
          this.error = 'No patient found with this card number.';
          this.patient = null;
          this.history = [];
        } else {
          this.history = data.filter(item => item.Section !== 'PatientInfo');
  
          // Find patient info
          const patientInfo = data.find(item => item.Section === 'PatientInfo') || data[0];
  
          // Normalize gender once
          if (patientInfo) {
            patientInfo.genderDisplay = this.normalizeGender(patientInfo.gender);
          }
  
          this.patient = patientInfo;
          this.cdr.detectChanges();
          console.log('RawgenderfromAPI:', patientInfo?.gender);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patient history:', err);
        this.error = 'Failed to load patient history. Please try again.';
        this.loading = false;
      }
    });
  }
  
  private normalizeGender(gender?: string): string {
    if (!gender) return '—';
  
    const text = gender.toLowerCase().trim();
  
    // Priority: check for female indicators first (since your data has "ሴት / Female")
    if (text.includes('ሴት') || text.includes('female')) {
      return 'Female';
    }
  
    if (text.includes('ወንድ') || text.includes('male')) {
      return 'Male';
    }
  
    // If nothing matches, show original value (good for debugging)
    return gender;
  }
  clearHistory() {
    this.patient = null;
    this.history = [];
    this.error = null;
    this.searchedCardNumber = '';
  }

  getTimelineIcon(section: string): string {
    switch (section) {
      case 'Visit': return '👨‍⚕️';
      case 'LabTest':
      case 'LabDetail': return '🧪';
      case 'Injection': return '💉';
      case 'MedicalHistory': return '📋';
      default: return '📌';
    }
  }

  getTimelineColor(section: string): string {
    switch (section) {
      case 'Visit': return '#2563eb';
      case 'LabTest':
      case 'LabDetail': return '#7c3aed';
      case 'Injection': return '#dc2626';
      case 'MedicalHistory': return '#0891b2';
      default: return '#6b7280';
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getGenderDisplay(gender: string | undefined): string {
    if (!gender) return '—';
  
    const lower = gender.toLowerCase();
  
    // Amharic + English cases
    if (lower.includes('ወንድ') || lower.includes('male')) {
      return 'Male';
    }
  
    if (lower.includes('ሴት') || lower.includes('female')) {
      return 'Female';
    }
  
    // Fallback - show what we got (useful for debugging)
    return gender;
  }

  // PDF Generation
  async generatePDF() {
    if (!this.reportContent) return;

    const element = this.reportContent.nativeElement;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgWidth = 208;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jspdf('p', 'mm', 'a4');
    let position = 10;

    pdf.setFontSize(18);
    pdf.text('FHC Clinic - Patient Medical History Report', 105, position, { align: 'center' });
    position += 10;

    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, position, { align: 'center' });
    position += 15;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 20;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Medical_History_${this.patient?.CardNumber || 'Patient'}_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  printReport() {
    window.print();
  }
}