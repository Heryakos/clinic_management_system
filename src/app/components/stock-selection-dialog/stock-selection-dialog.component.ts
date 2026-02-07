import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PrescriptionPaperComponent } from '../prescription-paper/prescription-paper.component';

@Component({
  selector: 'app-stock-selection-dialog',
  templateUrl: './stock-selection-dialog.component.html',
  styleUrls: ['./stock-selection-dialog.component.css']
})
export class StockSelectionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StockSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      cardNumber: string; 
      prescription: any; 
      inStockMedications: string[]; 
      outOfStockMedications: string[] 
    },
    private dialog: MatDialog
  ) {
    // Ensure arrays are initialized
    if (!this.data.inStockMedications) {
      this.data.inStockMedications = [];
    }
    if (!this.data.outOfStockMedications) {
      this.data.outOfStockMedications = [];
    }
  }

  getMedicationName(medicationEntry: string): string {
    if (!medicationEntry) return '';
    const parts = medicationEntry.split(' - ');
    return parts[0]?.trim() || medicationEntry;
  }

  openPrescriptionDialog(medications: string[], title: string): void {
    if (!medications || medications.length === 0) {
      return;
    }

    this.dialog.open(PrescriptionPaperComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        cardNumber: this.data.cardNumber,
        medicationDetails: medications.join(', '),
        prescription: {
          ...this.data.prescription,
          MedicationDetails: medications.join(', ')
        },
        dialogTitle: title
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}