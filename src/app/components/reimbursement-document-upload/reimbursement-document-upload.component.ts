import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService, ReimbursementDocument } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ExpenseReimbursement } from 'src/app/models/medical.model';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-reimbursement-document-upload',
  templateUrl: './reimbursement-document-upload.component.html',
  styleUrls: ['./reimbursement-document-upload.component.css'],
})
export class ReimbursementDocumentUploadComponent implements OnInit {
  isPrivilegedUser = false;
  isLookingUpEmployee = false;
  hasPendingReferral: boolean = false;
  isCheckingReferral: boolean = true;
  referralCheckMessage: string = '';
  uploadForm!: FormGroup;
  reimbursements: ExpenseReimbursement[] = [];
  uploadedDocuments: ReimbursementDocument[] = [];
  selectedFiles: File[] = [];
  isSubmitting = false;
  showDocumentsModal = false;
  createdBy: string | null = null;
  employeeName: string | null = null;
  payrollNo: string | null = null;
  departmentName: string | null = null;
  currentEmployeeRoleName: string = ''; // To check privilege

  formTypes = [
    { value: 'ClinicMedicalExpenseRefund', label: 'Clinic Medical Expense Refund' }
  ];

  investigations: {
    investigation: string;
    invoiceNumber: string;
    amount: number;
    file?: File;
    fileName?: string;
  }[] = [];

  pdfFile: File | null = null;
  reimbursementId: number | null = null;
  selectedReimbursementId: number | null = null;

  pdfPreviewUrls: { [documentId: number]: SafeResourceUrl } = {};
  pdfLoadErrors: { [documentId: number]: string } = {};
  pdfLoading: { [documentId: number]: boolean } = {};
  pdfRetryCount: { [documentId: number]: number } = {};

  @ViewChild('pdfTemplate') pdfTemplate!: ElementRef;

  constructor(
    private fb: FormBuilder,
    public medicalService: MedicalService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.addInvestigation();

    // Subscribe to roles
    this.medicalService.userRoleIds$.subscribe(roleIds => {
      const PRIVILEGED_ROLES = [
        '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7',     // doctorOPD1
      ];

      this.isPrivilegedUser = (roleIds || []).some(id =>
        PRIVILEGED_ROLES.includes(id.trim().toLowerCase())
      );

      console.log('Is privileged user?', this.isPrivilegedUser);

      // Apply field access rules
      this.updatePersonalFieldAccess();

      // Setup auto-search only for privileged users
      if (this.isPrivilegedUser) {
        this.uploadForm.get('payrollNo')?.valueChanges
          .pipe(
            debounceTime(800),
            distinctUntilChanged()
          )
          .subscribe(value => {
            const trimmed = value?.trim();
            if (trimmed && trimmed.length >= 3) {
              this.lookupEmployeeByPayrollNo(trimmed);
            }
          });
      }
    });
  }

  initializeForm(): void {
    this.uploadForm = this.fb.group({
      formType: ['', Validators.required],
      description: ['', Validators.required],
      files: [null],
      patientName: ['', Validators.required],
      payrollNo: ['', Validators.required],
      department: ['', Validators.required],
      doneAt: [''],
      orderedFrom: ['']
    });

    this.uploadForm.get('formType')?.valueChanges.subscribe(formType => {
      if (formType === 'ClinicMedicalExpenseRefund') {
        this.uploadForm.get('description')?.setValue('Clinic Medical Expense Refund Form');
        this.uploadForm.get('description')?.disable();
        this.uploadForm.get('files')?.clearValidators();
        this.uploadForm.get('doneAt')?.enable();
        this.uploadForm.get('orderedFrom')?.enable();
      } else {
        this.uploadForm.get('description')?.enable();
        this.uploadForm.get('description')?.setValue('');
        this.uploadForm.get('files')?.setValidators([Validators.required]);
      }
      this.uploadForm.get('files')?.updateValueAndValidity();
    });

    this.uploadForm.get('formType')?.setValue('ClinicMedicalExpenseRefund');
  }

  loadUserData(): void {
    this.medicalService.getMyProfiles(environment.username).subscribe({
      next: (response: any) => {
        const employee = response?.[0];
        if (employee) {
          this.createdBy = employee.user_ID ?? null;
          this.employeeName = employee.en_name ?? 'Unknown';
          this.payrollNo = employee.payrole_No ?? null;
          this.departmentName = employee.department_name ?? null;
          this.currentEmployeeRoleName = employee.roleName ?? '';

          // === DETERMINE IF USER IS PRIVILEGED BASED ON roleName ===
          const privilegedKeywords = [
            'መሪ', 'Team Leader', 'Supervisor', 'Doctor', 'Head', 'Manager', 'Finance', 'የህክምና'
          ];
          this.isPrivilegedUser = privilegedKeywords.some(keyword =>
            this.currentEmployeeRoleName.includes(keyword)
          );

          console.log('Current role:', this.currentEmployeeRoleName);
          console.log('Is privileged?', this.isPrivilegedUser);

          const cardNumber = environment.username;

          this.uploadForm.patchValue({
            payrollNo: this.payrollNo,
            patientName: this.employeeName,
            department: this.departmentName
          });

          // Apply field access rules
          this.updatePersonalFieldAccess();

          // Setup auto-lookup if privileged
          if (this.isPrivilegedUser) {
            this.setupPayrollAutoLookup();
          }

          if (this.payrollNo) {
            this.loadUserReimbursements(true);
          }

          if (cardNumber) {
            this.checkPendingReferral(cardNumber);
          } else {
            this.hasPendingReferral = false;
            this.uploadForm.disable();
            this.cdr.detectChanges();
          }
        } else {
          this.showErrorMessage('Employee profile not found.');
          this.uploadForm.disable();
        }
      },
      error: (error) => {
        console.error('Error loading employee data:', error);
        this.showErrorMessage('Failed to load your profile.');
        this.uploadForm.disable();
      }
    });
  }

  checkPendingReferral(cardNumber: string): void {
    this.isCheckingReferral = true;
    this.medicalService.checkHasPendingReferral(cardNumber).subscribe({
      next: (hasPending: boolean) => {
        this.hasPendingReferral = hasPending;
        this.isCheckingReferral = false;

        if (!hasPending) {
          this.uploadForm.disable();
          this.referralCheckMessage = 'No active referral found.';
        } else {
          this.uploadForm.enable();
          this.updatePersonalFieldAccess(); // Role-based field control
          this.referralCheckMessage = 'Active referral found.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isCheckingReferral = false;
        this.hasPendingReferral = false;
        this.uploadForm.disable();
        this.cdr.detectChanges();
      }
    });
  }

  private updatePersonalFieldAccess(): void {
    const payrollCtrl = this.uploadForm.get('payrollNo');
    const nameCtrl = this.uploadForm.get('patientName');
    const deptCtrl = this.uploadForm.get('department');

    if (this.isPrivilegedUser) {
      // Only Payroll Number is editable for privileged users
      payrollCtrl?.enable();
      nameCtrl?.disable();
      deptCtrl?.disable();
    } else {
      // Regular users: all fields locked
      payrollCtrl?.disable();
      nameCtrl?.disable();
      deptCtrl?.disable();
    }
  }

  private setupPayrollAutoLookup(): void {
    this.uploadForm.get('payrollNo')?.valueChanges
      .pipe(
        debounceTime(800),
        distinctUntilChanged()
      )
      .subscribe(value => {
        const trimmed = value?.trim();
        if (trimmed && trimmed.length >= 3) {
          this.lookupEmployeeByPayrollNo(trimmed);
        }
      });
  }

  private lookupEmployeeByPayrollNo(payrollNo: string): void {
    if (!payrollNo || payrollNo.trim() === '') {
      return;
    }

    this.isLookingUpEmployee = true;

    // Use the rich profile API that includes department_name and roleName
    this.medicalService.getMyProfiles(payrollNo.trim()).subscribe({
      next: (response: any) => {
        // This API returns a single object (not wrapped in array or c_Employees)
        const employee = response?.[0] || response;

        if (employee) {
          // Build fallback local name
          const fullLocalName = [employee.fName, employee.mName, employee.lName]
            .filter(Boolean)
            .join(' ')
            .trim();

          // Prefer English name
          const patientName = (employee.en_name || fullLocalName || 'Unknown').trim();

          // Department comes directly from department_name
          const department = (employee.department_name || 'Department Not Specified').trim();

          this.uploadForm.patchValue({
            patientName: patientName,
            department: department,
            payrollNo: payrollNo.trim()
          });

          this.snackBar.open(`Employee found: ${patientName}`, 'Close', { duration: 4000 });
        } else {
          this.snackBar.open('Employee not found', 'Close', { duration: 5000 });
          this.uploadForm.patchValue({
            patientName: '',
            department: ''
          });
        }
        this.isLookingUpEmployee = false;
      },
      error: (err) => {
        console.error('Error looking up employee profile:', err);
        this.snackBar.open('Error loading employee data', 'Close', { duration: 5000 });
        this.isLookingUpEmployee = false;
      }
    });
  }
  loadUserReimbursements(autoSelectLatest: boolean = false): void {
    if (!this.payrollNo) {
      console.error('Payroll number is not set');
      this.showErrorMessage('Payroll number not available. Please try again.');
      return;
    }

    this.medicalService.getExpenseReimbursementsByPayrollNumber(this.payrollNo).subscribe({
      next: (reimbursements) => {
        this.reimbursements = reimbursements.filter(r => r.reimbursementID && r.reimbursementID > 0);
        console.log('Reimbursements loaded:', this.reimbursements);

        if (autoSelectLatest && this.reimbursements.length > 0) {
          const latest = [...this.reimbursements].sort((a, b) => (b.reimbursementID || 0) - (a.reimbursementID || 0))[0];
          this.selectedReimbursementId = latest.reimbursementID;
          this.fetchDocumentsForSelected();
        }
      },
      error: (error) => {
        console.error('Error loading reimbursements:', error);
        this.showErrorMessage('Error loading your reimbursement requests.');
      }
    });
  }
  loadDocumentsForReimbursement(event: any): void {
    const reimbursementId = Number(event.target.value);
    if (reimbursementId) {
      this.selectedReimbursementId = reimbursementId;
      this.fetchDocumentsForSelected();
    } else {
      this.uploadedDocuments = [];
      this.selectedReimbursementId = null;
      this.pdfPreviewUrls = {};
      this.pdfLoadErrors = {};
      this.pdfLoading = {};
      this.pdfRetryCount = {};
      this.cdr.detectChanges();
    }
  }


  private fetchDocumentsForSelected(): void {
    if (!this.selectedReimbursementId) return;

    this.medicalService.getDocumentsByReimbursementId(this.selectedReimbursementId).subscribe({
      next: (documents: ReimbursementDocument[]) => {
        setTimeout(() => {
          this.uploadedDocuments = documents.sort((a, b) => {
            const aIsForm = (a.description || '').toLowerCase().includes('clinic') || (a.description || '').toLowerCase().includes('form');
            const bIsForm = (b.description || '').toLowerCase().includes('clinic') || (b.description || '').toLowerCase().includes('form');
            if (aIsForm && !bIsForm) return -1;
            if (!aIsForm && bIsForm) return 1;
            return 0;
          });

          this.pdfPreviewUrls = {};
          this.pdfLoadErrors = {};
          this.pdfLoading = {};
          this.pdfRetryCount = {};

          this.uploadedDocuments.forEach(doc => {
            if (this.getPreviewType(doc.fileType, doc.fileName) === 'pdf') {
              this.pdfLoading[doc.documentID] = true;
              this.pdfRetryCount[doc.documentID] = 0;
              this.loadPdfPreview(doc);
            }
          });

          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.showErrorMessage('Error loading documents.');
      }
    });
  }

  onInvestigationFileChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;

    const file = input.files[0];
    const inv = this.investigations[index];

    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.showErrorMessage('File must be smaller than 10MB');
      input.value = '';
      return;
    }

    // Store the file locally for upload on submit
    inv.file = file;
    inv.fileName = file.name;

    // Trigger change detection to update UI
    this.cdr.detectChanges();

    // Clear the input so user can select the same file again if needed
    input.value = '';
  }

  removeInvestigationFile(index: number): void {
    const inv = this.investigations[index];
    inv.file = undefined;
    inv.fileName = '';
    this.cdr.detectChanges();
  }

  addInvestigation(): void {
    this.investigations.push({
      investigation: '',
      invoiceNumber: '',
      amount: 0,
      file: undefined,
      fileName: ''
    });
  }

  removeInvestigation(index: number): void {
    if (this.investigations.length > 1) {
      this.investigations.splice(index, 1);
    }
  }

  get totalAmount(): number {
    return this.investigations.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      this.uploadForm.patchValue({ files: this.selectedFiles });
      this.uploadForm.get('files')?.updateValueAndValidity();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid) {
      this.markFormGroupTouched();
      this.showErrorMessage('Please fill all required fields correctly.');
      return;
    }

    this.isSubmitting = true;

    try {
      const formType = this.uploadForm.get('formType')?.value;
      const totalAmount = this.totalAmount;

      // Validation for Clinic form
      if (formType === 'ClinicMedicalExpenseRefund') {
        if (this.hasDuplicateInvoiceNumbers()) {
          this.showErrorMessage('Duplicate invoice numbers are not allowed within the same request.');
          this.isSubmitting = false;
          return;
        }

        const hasValidInvestigations = this.investigations.some(inv =>
          // inv.investigation?.trim() &&
          inv.invoiceNumber?.trim() &&
          inv.amount > 0
        );

        if (!hasValidInvestigations) {
          this.showErrorMessage('Please add at least one valid investigation.');
          this.isSubmitting = false;
          return;
        }
      }

      // Create reimbursement record
      const reimbursementPayload: ExpenseReimbursement = {
        reimbursementID: 0,
        reimbursementNumber: `REIMB-${Date.now()}-${Math.floor(Math.random() * 1000)}`.substring(0, 50),
        patientName: this.uploadForm.get('patientName')?.value || this.employeeName || 'Unknown',
        employeeID: this.payrollNo || null,
        payrollNo: this.uploadForm.get('payrollNo')?.value || this.payrollNo || null,
        payrollNumber: this.uploadForm.get('payrollNo')?.value || this.payrollNo || null,
        department: this.uploadForm.get('department')?.value || this.departmentName || null,
        totalAmount: totalAmount,
        status: 'pending',
        submissionDate: new Date(),
        createdBy: this.createdBy || null,
        approvedBy: null,
        investigations: [],
        orderedFrom: this.uploadForm.get('orderedFrom')?.value || 'Not specified',
        doneAt: this.uploadForm.get('doneAt')?.value || 'Not specified',
        investigation: this.investigations.map(inv => inv.investigation).join(', '),
        formType: formType,
        approvedAmount: 0
      };

      const created = await firstValueFrom(this.medicalService.createExpenseReimbursement(reimbursementPayload));
      this.reimbursementId = created.reimbursementID;

      if (!this.reimbursementId) {
        throw new Error('Failed to create reimbursement: reimbursement ID is null');
      }

      // Save investigation details
      if (formType === 'ClinicMedicalExpenseRefund') {
        for (const inv of this.investigations) {
          if (inv.investigation?.trim() && inv.invoiceNumber?.trim() && inv.amount > 0) {
            const detail = {
              InvestigationType: inv.investigation.trim(),
              Location: this.uploadForm.get('doneAt')?.value || 'Not specified',
              OrderedFrom: this.uploadForm.get('orderedFrom')?.value || 'Not specified',
              InvoiceNumber: inv.invoiceNumber.trim(),
              Amount: inv.amount,
              InvestigationDate: new Date()
            };
            await firstValueFrom(this.medicalService.addReimbursementDetail(this.reimbursementId, detail));
          }
        }
      }

      // === UPLOAD DOCUMENTS ===
      try {
        // 1. Generate the PDF form (THIS WAS MISSING BEFORE!)
        this.pdfFile = await this.generatePDF();

        // 2. Upload generated Clinic PDF Form using /upload endpoint
        const pdfFormData = new FormData();
        pdfFormData.append('reimbursementId', this.reimbursementId!.toString());
        pdfFormData.append('uploadedBy', this.employeeName || 'Unknown');
        pdfFormData.append('createdBy', this.createdBy || '');
        pdfFormData.append('file', this.pdfFile, this.pdfFile.name);
        pdfFormData.append('description', 'Clinic Medical Expense Refund Form');

        await firstValueFrom(this.medicalService.uploadReimbursementDocument(pdfFormData));

        // 3. Upload each supporting document (invoice/receipt) individually
        for (const inv of this.investigations) {
          if (inv.file) {
            const desc = inv.investigation?.trim()
              ? `${inv.investigation.trim()} - Invoice #${inv.invoiceNumber || 'N/A'} (${inv.amount || 0} ETB)`
              : `Supporting Document - Invoice #${inv.invoiceNumber || 'N/A'}`;

            const supportingFormData = new FormData();
            supportingFormData.append('file', inv.file, inv.fileName!);
            supportingFormData.append('reimbursementId', this.reimbursementId!.toString());
            supportingFormData.append('description', desc);
            supportingFormData.append('uploadedBy', this.employeeName || 'Unknown');
            if (this.createdBy) {
              supportingFormData.append('createdBy', this.createdBy);
            }

            await firstValueFrom(this.medicalService.uploadSupportingDocument(supportingFormData));
          }
        }

        // Success!
        this.showSuccessMessage('Reimbursement request created and all documents uploaded successfully!');
        this.loadUserReimbursements(true);
        this.showDocumentsModal = true;
        this.selectedReimbursementId = this.reimbursementId;
        this.fetchDocumentsForSelected();
        this.resetForm();

      } catch (uploadError: any) {
        console.error('Error uploading documents:', uploadError);
        this.showErrorMessage(`Document upload failed: ${uploadError.message || uploadError || 'Please try again.'}`);
      }

    } catch (error: any) {
      console.error('Error during submission:', error);
      this.showErrorMessage(`Error: ${error.message || 'Submission failed. Please try again.'}`);
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.uploadForm.controls).forEach(key => {
      const control = this.uploadForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.uploadForm.reset();
    this.selectedFiles = [];
    this.investigations = [{ investigation: '', invoiceNumber: '', amount: 0 }];
    this.reimbursementId = null;
    this.uploadForm.patchValue({
      payrollNo: this.payrollNo,
      patientName: this.employeeName,
      department: this.departmentName,
      formType: 'ClinicMedicalExpenseRefund'
    });
  }

  showDocuments(): void {
    this.showDocumentsModal = true;
    this.loadUserReimbursements(true);
  }

  closeDocuments(): void {
    this.showDocumentsModal = false;
    this.uploadedDocuments = [];
    this.selectedReimbursementId = null;
    Object.values(this.pdfPreviewUrls).forEach(url => {
      if (typeof url === 'string') {
        window.URL.revokeObjectURL(url);
      }
    });
    this.pdfPreviewUrls = {};
    this.pdfLoadErrors = {};
    this.pdfLoading = {};
    this.pdfRetryCount = {};
  }

  getPreviewType(fileType: string, fileName: string): 'pdf' | 'image' | 'office' | 'none' {
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lowerName)) return 'image';
    const isOfficeMime = lowerType.includes('officedocument') ||
      lowerType.includes('msword') ||
      lowerType.includes('vnd.ms-') ||
      lowerType.includes('word') ||
      lowerType.includes('excel') ||
      lowerType.includes('powerpoint');
    const isOfficeExt = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(lowerName);
    if (isOfficeMime || isOfficeExt) return 'office';
    return 'none';
  }

  downloadDocument(doc: ReimbursementDocument): void {
    console.log('Downloading document:', doc.documentID);
    this.medicalService.downloadReimbursementDocument(doc.documentID).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showSuccessMessage(`Document downloaded: ${doc.fileName}`);
      },
      (error) => {
        console.error('Error downloading document:', error);
        this.showErrorMessage('Error downloading document. Please try again.');
      }
    );
  }

  getDocumentPreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getOfficePreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const documentUrl = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
    const officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(officeOnlineUrl);
  }

  getPdfPreviewUrl(doc: ReimbursementDocument): SafeResourceUrl {
    const url = this.pdfPreviewUrls[doc.documentID];
    return url || this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  onPdfLoad(doc: ReimbursementDocument): void {
    console.log(`PDF loaded for document ${doc.documentID}`);
    setTimeout(() => {
      this.pdfLoadErrors[doc.documentID] = '';
      this.pdfLoading[doc.documentID] = false;
      this.cdr.detectChanges();
    }, 0);
  }

  onPdfError(doc: ReimbursementDocument, event: Event): void {
    console.error(`Error loading PDF for document ${doc.documentID}:`, event);
    setTimeout(() => {
      this.pdfLoadErrors[doc.documentID] = 'Unable to load PDF preview';
      this.pdfLoading[doc.documentID] = false;
      this.cdr.detectChanges();
    }, 0);
  }

  private async loadPdfPreview(doc: ReimbursementDocument): Promise<void> {
    try {
      const url = this.medicalService.getReimbursementDocumentDownloadUrl(doc.documentID);
      console.log('Fetching PDF from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status >= 500) {
          throw new Error('Server error');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Document is empty');
      }
      if (!blob.type.includes('pdf') && !doc.fileName.toLowerCase().endsWith('.pdf')) {
        console.warn(`Unexpected content type: ${blob.type} for document ${doc.fileName}`);
      }
      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfPreviewUrls[doc.documentID] = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#view=FitH&toolbar=0&navpanes=0');
      this.pdfLoadErrors[doc.documentID] = '';
      console.log(`Successfully loaded PDF preview for document ${doc.documentID}`);
    } catch (error: any) {
      console.error(`Error loading PDF preview for document ${doc.documentID}:`, error);
      let errorMessage = 'Failed to load PDF preview';
      if (error.message.includes('CORS')) {
        errorMessage = 'Unable to load PDF due to security restrictions';
      } else if (error.message.includes('404')) {
        errorMessage = 'Document not found';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied to document';
      } else if (error.message.includes('Server error')) {
        errorMessage = 'Server error while loading document';
      } else if (error.message.includes('empty')) {
        errorMessage = 'Document appears to be empty';
      } else {
        errorMessage = `Failed to load PDF: ${error.message}`;
      }
      this.pdfLoadErrors[doc.documentID] = errorMessage;
    } finally {
      setTimeout(() => {
        this.pdfLoading[doc.documentID] = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  retryPdfLoad(doc: ReimbursementDocument): void {
    const retryCount = this.pdfRetryCount[doc.documentID] || 0;
    if (retryCount < 3) {
      setTimeout(() => {
        this.pdfRetryCount[doc.documentID] = retryCount + 1;
        this.pdfLoading[doc.documentID] = true;
        this.pdfLoadErrors[doc.documentID] = '';
        this.cdr.detectChanges();
        this.loadPdfPreview(doc);
      }, 0);
    } else {
      this.showErrorMessage('Maximum retry attempts reached for this document.');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generatePDF(): Promise<File> {
    const element = this.pdfTemplate.nativeElement;
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.backgroundColor = '#ffffff';
    await new Promise(resolve => setTimeout(resolve, 500));
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      windowHeight: 1123
    });
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], `Clinic_Medical_Expense_Form_${this.reimbursementId || 'temp'}.pdf`, {
      type: 'application/pdf'
    });
  }

  onImageLoad(event: Event): void {
    console.log('Image loaded successfully');
  }

  onImageError(event: Event): void {
    console.error('Error loading image');
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const container = img.parentElement;
    if (container) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'image-error';
      errorMessage.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #6c757d;">
          <p>⚠️ Unable to load image preview</p>
          <button class="download-btn" onclick="this.closest('.document-card').querySelector('.download-btn').click()">
            <span class="download-icon">↓</span> Download Instead
          </button>
        </div>
      `;
      container.appendChild(errorMessage);
    }
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private hasDuplicateInvoiceNumbers(): boolean {
    const seen = new Set<string>();
    for (const inv of this.investigations) {
      const normalized = (inv.invoiceNumber || '').toString().trim().toUpperCase();
      if (!normalized) continue;
      if (seen.has(normalized)) return true;
      seen.add(normalized);
    }
    return false;
  }
}