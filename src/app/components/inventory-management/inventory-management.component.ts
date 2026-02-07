import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  currentUserId: string | null = null;
  currentUserName: string | null = null; // optional, nice for display
  labTestForm: FormGroup;
  labCategoryForm: FormGroup;
  therapeuticCategories: any[] = [];
  expandedItem: any = null;
  medicationDetailsLoading = false;
  activeTab: 'items' | 'receive' | 'requests' | 'stock' = 'items';
  editingItem: any = null;
  selectedCategoryId: number | null = null;

  adjustingItem: any = null;
  adjustmentForm: FormGroup;
  labTestCategories: any[] = [];
  normalRange: string = '';
  isLabCategory(categoryId: number | null): boolean {
    return [3].includes(categoryId!);
  }
  adjustmentReasons = [
    { value: 'physical_count', label: 'Physical Count Correction' },
    { value: 'expired_writeoff', label: 'Expired Items Write-off' },
    { value: 'lost_damaged', label: 'Lost or Damaged' },
    { value: 'initial_setup', label: 'Initial Setup / Correction' },
    { value: 'other', label: 'Other' }
  ];
  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Forms
  itemForm: FormGroup;
  categoryForm: FormGroup;
  receiveForm: FormGroup;
  editForm: FormGroup;
  therapeuticForm: FormGroup;

  lowStockItems: any[] = [];
  totalStockItems = 0;

  // Data
  categories: any[] = [];
  items: any[] = [];
  itemsDataSource = new MatTableDataSource<any>([]);
  displayedItemColumns: string[] = [
    'itemCode', 'itemName', 'categoryName', 'unit', 'hasExpiry',
    'minStockLevel', 'details', 'currentStock', 'actions'  // ← added currentStock column
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private snackBar: MatSnackBar
  ) {
    this.therapeuticForm = this.fb.group({
      categoryName: ['', Validators.required],
      description: ['']
    });
    this.itemForm = this.fb.group({
      itemCode: ['', [Validators.required, Validators.minLength(3)]],
      itemName: ['', Validators.required],
      categoryID: [null, Validators.required],           // Now required
      unit: ['', Validators.required],
      hasExpiry: [true],
      minStockLevel: [0, Validators.min(0)],
      currentUnitPrice: [null, Validators.min(0)],
      //lab
      normalRange: [''],
      labTestCategoryID: [null, Validators.required],

      // Medication-specific fields (only used when category is Medications)
      genericName: [''],
      strength: [''],
      dosageForm: [''],
      manufacturer: [''],
      therapeuticCategoryID: [null]
    });
    this.itemForm.get('categoryID')?.valueChanges.subscribe(value => {
      this.selectedCategoryId = value;
      const dosageCtrl = this.itemForm.get('dosageForm');
      const normalCtrl = this.itemForm.get('normalRange');
      const labCatCtrl = this.itemForm.get('labTestCategoryID');
      if (value === 1) {
        dosageCtrl?.setValidators([Validators.required]);
      }
      else {
        dosageCtrl?.clearValidators();
        labCatCtrl?.clearValidators();
        dosageCtrl?.clearValidators();
      }
      dosageCtrl?.updateValueAndValidity();
      normalCtrl?.updateValueAndValidity();
      labCatCtrl?.updateValueAndValidity();
    });

    this.labCategoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      description: ['']
    });

    this.labTestForm = this.fb.group({
      testName: ['', Validators.required],
      categoryID: [null, Validators.required],
      normalRange: [''],
      unit: ['']
    });

    this.adjustmentForm = this.fb.group({
      adjustmentQuantity: [null, Validators.required],
      reason: ['', Validators.required],
      comments: ['']
    });

    this.categoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      description: ['']
    });

    this.receiveForm = this.fb.group({
      itemID: [null, Validators.required],
      batchNumber: ['', Validators.required],
      manufacturer: [''],
      expiryDate: [null],
      quantityReceived: [null, [Validators.required, Validators.min(1)]],
      unitCost: [null, [Validators.required, Validators.min(0.01)]],
      comments: ['']
    });

    this.editForm = this.fb.group({
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      currentUnitPrice: [null, [Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCategories();
    this.loadAllItems();
    this.loadTherapeuticCategories();
    this.loadLabTestCategories();
    this.itemForm.get('categoryID')?.valueChanges.subscribe(value => {
      this.selectedCategoryId = value;
    });
  }

  private loadCurrentUser(): void {
    const username = environment.username;

    if (!username) {
      console.warn('No username in environment — cannot load current user');
      this.showError('Cannot load user information. Please log in again.');
      return;
    }

    this.medicalService.getEmployeeById(username).subscribe({
      next: (response: any) => {
        const employee = response?.c_Employees?.[0];

        if (employee) {
          this.currentUserId = employee.user_ID ?? null;
          this.currentUserName = employee.en_name?.trim()
            ? `${employee.en_name.trim()}`
            : `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown User';

          console.log('Current user loaded:', {
            userId: this.currentUserId,
            name: this.currentUserName
          });

          // Optional: show welcome message
          // if (this.currentUserName) {
          //   this.showSuccess(`Welcome, ${this.currentUserName}`);
          // }
        }
        // else {
        //   console.warn('No employee data found for current user');
        //   this.showError('User information not found.');
        // }
      },
      error: (err) => {
        console.error('Failed to load current user:', err);
        this.showError('Failed to load user information.');
      }
    });
  }

  ngAfterViewInit() {
    this.itemsDataSource.paginator = this.paginator;
  }

  loadCategories(): void {
    this.medicalService.getInventoryCategories().subscribe({
      next: (cats: any[]) => {
        this.categories = cats.map(cat => ({
          categoryID: cat.CategoryID,
          categoryName: cat.CategoryName || 'Unnamed',
          description: cat.Description,
          isActive: cat.IsActive
        }));
      },
      error: (err) => this.showError('Failed to load categories')
    });
  }
  loadTherapeuticCategories(): void {
    this.medicalService.getTherapeuticCategories().subscribe({
      next: (cats) => {
        this.therapeuticCategories = cats;
      },
      error: () => this.showError('Failed to load therapeutic categories')
    });
  }
  loadLabTestCategories(): void {
    this.medicalService.getLabTestCategories().subscribe({
      next: (cats) => {
        this.labTestCategories = cats;
        console.log('Loaded lab test categories:', this.labTestCategories);
      },
      error: (err) => {
        console.error('Failed to load lab test categories:', err);
        this.showError('Failed to load lab test categories');
      }
    });
  }

  loadAllItems(): void {
    this.medicalService.getAllInventoryItems().subscribe({
      next: (rawItems: any[]) => {
        this.items = rawItems; // For dropdowns

        const normalizedItems = rawItems.map((item: any) => ({
          itemID: item.ItemID, // Needed for edit
          itemCode: item.ItemCode || '',
          itemName: item.ItemName || '',
          categoryName: this.getCategoryName(item.CategoryID) || 'Uncategorized',
          unit: item.Unit || '',
          hasExpiry: item.HasExpiry === true,
          minStockLevel: item.MinStockLevel || 0,
          currentStock: item.CurrentStock || 0,
          currentUnitPrice: item.CurrentUnitPrice || null
        }));

        this.itemsDataSource.data = normalizedItems;

        // Low stock calculation
        this.lowStockItems = rawItems.filter(i =>
          i.MinStockLevel > 0 && (i.CurrentStock || 0) < i.MinStockLevel
        );

        this.totalStockItems = rawItems.length;
      },
      error: (err) => this.showError('Failed to load items')
    });
  }


  showMedicationDetails(item: any): void {
    // Toggle collapse
    if (this.expandedItem === item) {
      this.expandedItem = null;
      return;
    }

    this.expandedItem = item;

    // If already loaded, don’t fetch again
    if (item.medicationDetails) {
      return;
    }

    this.medicationDetailsLoading = true;

    this.medicalService.getMedicationDetails(item.itemID).subscribe({
      next: (details: any) => {
        item.medicationDetails = details;
        this.medicationDetailsLoading = false;
      },
      error: () => {
        item.medicationDetails = null;
        this.medicationDetailsLoading = false;
      }
    });
  }

  getCategoryName(categoryId: number | null): string {
    if (!categoryId) return 'Uncategorized';
    const cat = this.categories.find(c => c.categoryID === categoryId);
    return cat ? cat.categoryName : 'Unknown';
  }

  onAddLabCategory(): void {
    if (this.labCategoryForm.invalid) return;

    const payload = {
      categoryName: this.labCategoryForm.value.categoryName.trim(),
      description: this.labCategoryForm.value.description?.trim() || null,
      sortOrder: 999, // default
      createdBy: this.currentUserId
    };

    this.medicalService.addLabTestCategory(payload).subscribe({
      next: () => {
        this.showSuccess('Lab test category added');
        this.labCategoryForm.reset();
        this.loadLabTestCategories(); // Refresh dropdown
      },
      error: (err) => this.showError(err.error?.message || 'Failed to add lab category')
    });
  }

  onAddCategory(): void {
    if (this.categoryForm.invalid) return;

    const payload = {
      categoryName: this.categoryForm.value.categoryName.trim(),
      description: this.categoryForm.value.description?.trim() || null,
      isActive: true
    };

    this.medicalService.createCategory(payload).subscribe({
      next: () => {
        this.showSuccess('Category added');
        this.categoryForm.reset();
        this.loadCategories();
      },
      error: (err) => this.showError(err.error?.message || 'Failed to add category')
    });
  }

  onAddTherapeuticCategory(): void {
    if (this.therapeuticForm.invalid) return;

    const payload = {
      categoryName: this.therapeuticForm.value.categoryName.trim(),
      description: this.therapeuticForm.value.description?.trim() || null,
      sortOrder: 999, // default or add input
      createdBy: this.currentUserId
    };

    this.medicalService.addTherapeuticCategory(payload).subscribe({
      next: () => {
        this.showSuccess('Therapeutic category added');
        this.therapeuticForm.reset();
        this.loadTherapeuticCategories(); // Refresh dropdown
      },
      error: (err) => this.showError(err.error?.message || 'Failed to add therapeutic category')
    });
  }

  onAddItem(): void {
    if (this.itemForm.invalid) return;

    const isMedication = this.itemForm.value.categoryID === 1;

    const payload: any = {
      itemCode: this.itemForm.value.itemCode.trim(),
      itemName: this.itemForm.value.itemName.trim(),
      categoryID: this.itemForm.value.categoryID,
      unit: this.itemForm.value.unit.trim(),
      hasExpiry: this.itemForm.value.hasExpiry ?? true,           
      minStockLevel: this.itemForm.value.minStockLevel ?? 0,      
      currentUnitPrice: this.itemForm.value.currentUnitPrice ?? 0, 
      createdBy: this.currentUserId,
      isActive: true
    };

    if (isMedication) {
      payload.genericName = this.itemForm.value.genericName?.trim() || '';
      payload.strength = this.itemForm.value.strength?.trim() || '';
      payload.dosageForm = this.itemForm.value.dosageForm?.trim() || '';
      payload.manufacturer = this.itemForm.value.manufacturer?.trim() || '';

      payload.therapeuticCategoryID = this.itemForm.value.therapeuticCategoryID || null;

      // 🔑 IMPORTANT PART: send Category as STRING (for Medications.Category)
      const selectedTherapCat = this.therapeuticCategories.find(
        c => c.therapeuticCategoryID === payload.therapeuticCategoryID
      );

      payload.category = selectedTherapCat
        ? selectedTherapCat.categoryName
        : null; // goes to Medications.Category (nvarchar)
    }

    if (this.isLabCategory(this.itemForm.value.categoryID)) {
      payload.normalRange = this.itemForm.value.normalRange?.trim() || '';
      payload.labTestCategoryID = this.itemForm.value.labTestCategoryID || null;

      // Optional: send Category string for LabTests.Category if needed
      const selectedLabCat = this.labTestCategories.find(c => c.categoryID === payload.labTestCategoryID);
      payload.labCategory = selectedLabCat ? selectedLabCat.categoryName : '';
    }

    this.medicalService.createInventoryItem(payload).subscribe({
      next: () => {
        this.showSuccess('Item added');
        this.itemForm.reset({ hasExpiry: true, minStockLevel: 0 });
        this.loadAllItems();
      },
      error: (err) => this.showError(err.error?.message || 'Failed to add item')
    });
  }

  onAddLabTest(): void {
    if (this.labTestForm.invalid) return;

    const payload = {
      categoryID: this.labTestForm.value.categoryID,
      testName: this.labTestForm.value.testName.trim(),
      normalRange: this.labTestForm.value.normalRange?.trim() || null,
      unit: this.labTestForm.value.unit?.trim() || null,
      sortOrder: 999, // default
      createdBy: this.currentUserId
    };

    this.medicalService.addLabTest(payload).subscribe({
      next: () => {
        this.showSuccess('Lab test added successfully');
        this.labTestForm.reset();
        // Optional: refresh something if needed
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to add lab test');
      }
    });
  }

  editItem(item: any): void {
    this.editingItem = item;
    this.editForm.patchValue({
      minStockLevel: item.minStockLevel || 0,
      currentUnitPrice: item.currentUnitPrice || null,
      isActive: true // Replace with real value later if added
    });
  }

  saveItemEdit(): void {
    if (this.editForm.invalid || !this.editingItem) {
      this.showError('Invalid form or no item selected');
      return;
    }

    const payload = {
      minStockLevel: this.editForm.value.minStockLevel,
      currentUnitPrice: this.editForm.value.currentUnitPrice,
      isActive: this.editForm.value.isActive,
      updatedBy: this.currentUserId
    };

    console.log('Sending update payload:', payload); // ← Debug: check this in console

    this.medicalService.updateItem(this.editingItem.itemID || this.editingItem.ItemID, payload).subscribe({
      next: (response) => {
        console.log('Update success response:', response); // Debug
        this.showSuccess('Item updated successfully');
        this.editingItem = null;
        this.loadAllItems();
      },
      error: (err) => {
        console.error('Update error details:', err); // Debug
        this.showError(err.error?.message || 'Failed to update item');
      }
    });
  }

  cancelEdit(): void {
    this.editingItem = null;
  }

  onReceiveStock(): void {
    if (this.receiveForm.invalid) return;

    const payload = {
      itemID: this.receiveForm.value.itemID,
      batchNumber: this.receiveForm.value.batchNumber.trim(),
      manufacturer: this.receiveForm.value.manufacturer?.trim() || null,
      expiryDate: this.receiveForm.value.expiryDate ? new Date(this.receiveForm.value.expiryDate).toISOString().split('T')[0] : null,
      quantityReceived: this.receiveForm.value.quantityReceived,
      unitCost: this.receiveForm.value.unitCost,
      receivedBy: this.currentUserId,
      comments: this.receiveForm.value.comments?.trim() || null
    };

    this.medicalService.receiveStock(payload).subscribe({
      next: () => {
        this.showSuccess('Stock received');
        this.receiveForm.reset();
      },
      error: (err) => this.showError(err.error?.message || 'Receive failed')
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.itemsDataSource.filter = filterValue.trim().toLowerCase();
    if (this.itemsDataSource.paginator) this.itemsDataSource.paginator.firstPage();
  }

  adjustStock(item: any): void {
    this.adjustingItem = item;
    this.adjustmentForm.reset();
    this.adjustmentForm.patchValue({ adjustmentQuantity: 0 });
  }

  saveStockAdjustment(): void {
    if (this.adjustmentForm.invalid || !this.adjustingItem) return;

    const delta = this.adjustmentForm.value.adjustmentQuantity;
    const newStock = (this.adjustingItem.currentStock || 0) + delta;

    if (newStock < 0) {
      this.showError('Stock cannot go negative');
      return;
    }

    const payload = {
      currentStock: newStock,               // Send new total
      minStockLevel: this.adjustingItem.minStockLevel, // Keep existing
      currentUnitPrice: this.adjustingItem.currentUnitPrice,
      isActive: true,
      updatedBy: this.currentUserId
    };

    this.medicalService.updateItem(this.adjustingItem.itemID, payload).subscribe({
      next: () => {
        this.showSuccess(`Stock updated to ${newStock}`);
        this.adjustingItem = null;
        this.loadAllItems(); // Refresh UI
      },
      error: (err) => this.showError(err.error?.message || 'Stock update failed')
    });
  }


  cancelAdjustment(): void {
    this.adjustingItem = null;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.snackBar.open(message, 'OK', { duration: 4000 });
    setTimeout(() => this.successMessage = null, 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.snackBar.open(message, 'Close', { duration: 6000 });
    setTimeout(() => this.errorMessage = null, 7000);
  }
}