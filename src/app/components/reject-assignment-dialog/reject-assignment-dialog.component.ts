import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RejectAssignmentDialogData {
  patientName: string;
  cardNumber: string;
  patientID: string | number;
  doctorID: string | null;
}

@Component({
  selector: 'app-reject-assignment-dialog',
  templateUrl: './reject-assignment-dialog.component.html',
  styleUrls: ['./reject-assignment-dialog.component.css']
})
export class RejectAssignmentDialogComponent {
  reason: string = '';
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<RejectAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectAssignmentDialogData
  ) {}

  confirm(): void {
    if (!this.reason.trim()) return;

    this.isSubmitting = true;

    // Return the result to the parent component
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason.trim(),
      patientID: this.data.patientID,
      cardNumber: this.data.cardNumber
    });
  }

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}