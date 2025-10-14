// src/app/components/inventory-management/inventory-management.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service'; // Adjust path as needed
import { InventoryCategory, InventoryItemenhanced, RoomCategory } from '../../models/inventory-enhanced.model'; // Adjust path
import { MedicationCategory } from '../../components/medication-tree-dropdown/medication-tree-dropdown.component'; // Adjust path as needed
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  selectedTab: 'categories' | 'items' | 'medications' = 'categories';
  displayedColumns: string[] = [
    'medicationID',
    'medicationName',
    'genericName',
    'strength',
    'dosageForm',
    'manufacturer',
    'category',
    'unitPrice',
    'actions'
  ];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  categoryForm: FormGroup;
  itemForm: FormGroup;
  medicationForm: FormGroup;
  editMedicationForm: FormGroup;
  categories: InventoryCategory[] = [];
  medications: any[] = []; // Flat list for table
  hierarchicalMedications: MedicationCategory[] = []; // For potential tree view
  selectedMedication: any = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Assume current room ID for the clinic person (e.g., from auth or route param)
  currentRoomId: string = 'e0e5db04-7418-4cfb-8786-a72f70ccc557'; // Replace with actual room ID logic
  currentRoomName: string = 'Clinic Room'; // Replace with actual room name

  constructor(private fb: FormBuilder, private medicalService: MedicalService) {
    this.categoryForm = this.fb.group({
      categoryName: ['', Validators.required],
      description: ['']
    });

    this.itemForm = this.fb.group({
      itemCode: ['', Validators.required],
      itemName: ['', Validators.required],
      categoryID: [null, Validators.required],
      unit: ['', Validators.required],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      maximumStock: [null, Validators.min(0)],
      unitPrice: [null, Validators.min(0)],
      expiryDate: [null],
      manufacturer: [''],
      batchNumber: [''],
      isActive: [true]
    });

    this.medicationForm = this.fb.group({
      medicationName: ['', Validators.required],
      genericName: [''],
      strength: [''],
      dosageForm: ['', Validators.required],
      manufacturer: [''],
      category: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });

    this.editMedicationForm = this.fb.group({
      medicationID: [{value: '', disabled: true}],
      medicationName: ['', Validators.required],
      genericName: [''],
      strength: [''],
      dosageForm: ['', Validators.required],
      manufacturer: [''],
      category: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadMedications();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  selectTab(tab: 'categories' | 'items' | 'medications'): void {
    this.selectedTab = tab;
    this.errorMessage = null;
    this.successMessage = null;
    this.selectedMedication = null;
  }

  loadCategories(): void {
    this.medicalService.getInventoryCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories.';
        console.error(err);
      }
    });
  }

  loadMedications(): void {
    this.medicalService.getMedications().subscribe({
      next: (data: MedicationCategory[]) => {
        this.hierarchicalMedications = data;
  
        // Flatten for table
        this.medications = data.flatMap(cat => 
          cat.dosageForms.flatMap(form => 
            form.medications.map(med => ({
              ...med,
              dosageForm: form.form,
              category: cat.category
            }))
          )
        );
  
        // Assign to datasource after paginator is ready
        this.dataSource = new MatTableDataSource(this.medications);
  
        // Make sure paginator is attached AFTER datasource reset
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
  
        // Enable filtering to work with new dataSource
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          const search = filter.trim().toLowerCase();
          return Object.values(data).some(val =>
            String(val).toLowerCase().includes(search)
          );
        };
      },
      error: (err) => {
        this.errorMessage = 'Failed to load medications.';
        console.error(err);
      }
    });
  }
  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  onAddCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const categoryData = this.categoryForm.value;
    this.medicalService.createInventoryCategory(categoryData).subscribe({
      next: (response) => {
        this.successMessage = 'Category added successfully.';
        this.loadCategories(); // Refresh categories
        this.categoryForm.reset();

        // Optionally associate with current room
        const roomCategory: RoomCategory = {
          roomCategoryID: '',
          categoryID: (response.categoryID || response.CategoryID).toString(),
          roomID: this.currentRoomId,
          roomName: this.currentRoomName,
          createdDate: new Date(),
          isActive: true
        };
        this.medicalService.addRoomCategory(roomCategory).subscribe({
          next: () => console.log('Category associated with room.'),
          error: (err) => console.error('Failed to associate category with room:', err)
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to add category.';
        console.error(err);
      }
    });
  }

  onAddItem(): void {
    if (this.itemForm.invalid) {
      return;
    }

    const itemData: InventoryItemenhanced = this.itemForm.value;
    this.medicalService.createInventoryItem(itemData).subscribe({
      next: (response) => {
        this.successMessage = 'Item added successfully.';
        this.itemForm.reset();
        // Optionally initialize stock in RoomStocks via another API/SP if needed
      },
      error: (err) => {
        this.errorMessage = 'Failed to add item.';
        console.error(err);
      }
    });
  }

  onAddMedication(): void {
    if (this.medicationForm.invalid) {
      return;
    }

    const medicationData = this.medicationForm.value;
    this.medicalService.addMedication(medicationData).subscribe({
      next: (response) => {
        this.successMessage = 'Medication added successfully.';
        this.loadMedications(); // Refresh medications
        this.medicationForm.reset();
      },
      error: (err) => {
        this.errorMessage = 'Failed to add medication.';
        console.error(err);
      }
    });
  }

  onEditMedication(medication: any): void {
    this.selectedMedication = medication;
    this.editMedicationForm.patchValue({
      medicationID: medication.medicationID,
      medicationName: medication.medicationName,
      genericName: medication.genericName,
      strength: medication.strength,
      dosageForm: medication.dosageForm,
      manufacturer: medication.manufacturer,
      category: medication.category,
      unitPrice: medication.unitPrice,
      isActive: medication.isActive
    });
  }

  onUpdateMedication(): void {
    if (this.editMedicationForm.invalid || !this.selectedMedication) {
      return;
    }

    const updatedData = {
      ...this.editMedicationForm.value,
      medicationID: this.selectedMedication.medicationID
    };

    // Assuming you add an updateMedication method in service
    this.medicalService.updateMedication(updatedData).subscribe({
      next: () => {
        this.successMessage = 'Medication updated successfully.';
        this.loadMedications();
        this.selectedMedication = null;
        this.editMedicationForm.reset();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update medication.';
        console.error(err);
      }
    });
  }

  onCancelEdit(): void {
    this.selectedMedication = null;
    this.editMedicationForm.reset();
  }
}