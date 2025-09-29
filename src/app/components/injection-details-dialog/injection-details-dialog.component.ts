// src/app/injection-details-dialog/injection-details-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-injection-details-dialog',
  templateUrl: './injection-details-dialog.component.html',
  styleUrls: ['./injection-details-dialog.component.css']
})
export class InjectionDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InjectionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { injection: any }
  ) {}

  print(): void {
    window.print();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}