import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaboratoryReportDialogComponent } from './laboratory-report-dialog.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [LaboratoryReportDialogComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [LaboratoryReportDialogComponent]
})
export class LaboratoryReportDialogModule { }