import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientSummary } from '../../models/medical.model';

@Component({
  selector: 'app-patient-info-card',
  templateUrl: './patient-info-card.component.html',
  styleUrls: ['./patient-info-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PatientInfoCardComponent {
  @Input() patient: PatientSummary | null = null;
  @Input() className: string = '';

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
  getFullName(): string {
    if (!this.patient) return '';
    return `${this.patient.FullName || ''} ${this.patient.FatherName || ''}`.trim();
  }
}