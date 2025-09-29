import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService, ReimbursementDocument } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import {ExpenseReimbursement} from 'src/app/models/medical.model'

@Component({
  selector: 'app-reimbursement-document-upload',
  templateUrl: './reimbursement-document-upload.component.html',
  styleUrls: ['./reimbursement-document-upload.component.css']
})
export class ReimbursementDocumentUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  reimbursements: ExpenseReimbursement[] = [];
  uploadedDocuments: ReimbursementDocument[] = [];
  selectedFiles: File[] = [];
  isSubmitting = false;
  showDocumentsModal = false;
  createdBy: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadReimbursements();
    this.loadUserData();
  }

  initializeForm(): void {
    this.uploadForm = this.fb.group({
      reimbursementId: ['', Validators.required],
      description: ['', Validators.required],
      files: [null, Validators.required]
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.createdBy = employee.user_ID ?? null;
        } else {
          console.warn('No employee data found');
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
      }
    );
  }

  loadReimbursements(): void {
    this.medicalService.getExpenseReimbursements().subscribe(
      (reimbursements: ExpenseReimbursement[]) => {
        this.reimbursements = reimbursements;
      },
      error => {
        console.error('Error loading reimbursements:', error);
      }
    );
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      this.uploadForm.patchValue({ files: this.selectedFiles });
      this.uploadForm.get('files')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFiles.length > 0) {
      this.isSubmitting = true;
      const formData = new FormData();
      formData.append('reimbursementId', this.uploadForm.get('reimbursementId')?.value);
      formData.append('description', this.uploadForm.get('description')?.value);
      formData.append('uploadedBy', this.createdBy || 'Unknown');
      this.selectedFiles.forEach(file => {
        formData.append('file', file, file.name);
      });

      this.medicalService.uploadReimbursementDocument(formData).subscribe(
        response => {
          this.isSubmitting = false;
          this.uploadForm.reset();
          this.selectedFiles = [];
          this.loadDocuments(this.uploadForm.get('reimbursementId')?.value);
        },
        error => {
          this.isSubmitting = false;
          console.error('Error uploading document:', error);
        }
      );
    }
  }

  loadDocuments(reimbursementId: string): void {
    if (reimbursementId) {
      this.medicalService.getDocumentsByReimbursementId(reimbursementId).subscribe(
        (documents: ReimbursementDocument[]) => {
          this.uploadedDocuments = documents;
        },
        error => {
          console.error('Error loading documents:', error);
        }
      );
    }
  }

  showDocuments(): void {
    const reimbursementId = this.uploadForm.get('reimbursementId')?.value;
    if (reimbursementId) {
      this.loadDocuments(reimbursementId);
      this.showDocumentsModal = true;
    }
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
  }
}