import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';

@Component({
  selector: 'app-add-therapeutic-category-dialog',
  template: `
    <h2 mat-dialog-title>Add New Therapeutic Category</h2>
    <mat-dialog-content>
      <form [formGroup]="categoryForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category Name</mat-label>
          <input matInput formControlName="categoryName" required>
          <mat-error *ngIf="categoryForm.get('categoryName')?.hasError('required')">
            Category name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sort Order (optional)</mat-label>
          <input matInput type="number" formControlName="sortOrder">
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="categoryForm.invalid || isLoading"
              (click)="onSubmit()">
        <span *ngIf="isLoading">Saving...</span>
        <span *ngIf="!isLoading">Add Category</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
  `]
})
export class AddTherapeuticCategoryDialogComponent {
  categoryForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    public dialogRef: MatDialogRef<AddTherapeuticCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { createdBy: string | null }
  ) {
    this.categoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      description: [''],
      sortOrder: [999]
    });
  }

  onSubmit() {
    if (this.categoryForm.invalid) return;

    this.isLoading = true;

    const payload = {
      categoryName: this.categoryForm.value.categoryName.trim(),
      description: this.categoryForm.value.description?.trim() || null,
      sortOrder: this.categoryForm.value.sortOrder || 999,
      createdBy: this.data.createdBy || null
    };

    this.medicalService.addTherapeuticCategory(payload).subscribe({
      next: (response: any) => {
        this.dialogRef.close({
          success: true,
          newCategory: {
            therapeuticCategoryID: response.therapeuticCategoryID,
            categoryName: payload.categoryName
          }
        });
      },
      error: (err: any) => {
        console.error('Failed to add category:', err);
        this.isLoading = false;
        // You can show error message here (snackbar/toast)
      }
    });
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }
}