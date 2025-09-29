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
    @Inject(MAT_DIALOG_DATA) public data: { cardNumber: string; prescription: any; inStockMedications: string[]; outOfStockMedications: string[] },
    private dialog: MatDialog
  ) {}

  openPrescriptionDialog(medications: string[], title: string): void {
    this.dialog.open(PrescriptionPaperComponent, {
      width: '800px',
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