import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

interface DispenseDialogData {
  prescription: any;          // or better: your Prescription type
  details: Array<{
    MedicationName?: string;
    Quantity?: number;
    isInStock?: boolean;
    // add other fields you use
  }>;
}

@Component({
  selector: 'app-confirm-dispense-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './confirm-dispense-dialog.component.html',
  styleUrls: ['./confirm-dispense-dialog.component.css']
})
export class ConfirmDispenseDialogComponent {
  notes: string = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDispenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DispenseDialogData
  ) { }

  get outOfStockCount(): number {
    return this.data.details?.filter(item => !item.isInStock)?.length || 0;
  }

  get hasAnyInStock(): boolean {
    return this.data.details?.some(item => item.isInStock) ?? false;
  }
  onAcknowledgeOutOfStock(): void {
    this.dialogRef.close({
      acknowledgeOutOfStock: true,
      notes: this.notes.trim() || null
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirm: true,
      notes: this.notes.trim() || null
    });
  }
}