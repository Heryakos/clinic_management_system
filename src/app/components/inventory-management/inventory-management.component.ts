// New Component: src/app/components/inventory-management/inventory-management.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service'; // Adjust path as needed
import { InventoryCategory, InventoryItemenhanced, RoomCategory } from '../../models/inventory-enhanced.model'; // Adjust path

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  categoryForm: FormGroup;
  itemForm: FormGroup;
  categories: InventoryCategory[] = [];
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
  }

  ngOnInit(): void {
    this.loadCategories();
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
          roomID: this.currentRoomId,
          categoryID: response.categoryID || response.CategoryID, // Assuming response has new ID
          roomName: this.currentRoomName,
          isActive: true,
          roomCategoryID: '',
          createdDate: new Date(),
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
}