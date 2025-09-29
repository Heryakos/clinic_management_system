import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { ItemCategory, ItemSelection, InventoryRequestEnhanced, ReasonCategory, ReasonSelection, InventoryItemenhanced, DosageForm, RoomCategory } from 'src/app/models/inventory-enhanced.model';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-inventory-request',
  templateUrl: './inventory-request.component.html',
  styleUrls: ['./inventory-request.component.css']
})
export class InventoryRequestComponent implements OnInit {
  requestForm!: FormGroup;
  categories: ItemCategory[] = [];
  reasons: ReasonCategory[] = [];
  roomNames: string[] = [];
  requestedByuser: string | null = null;
  isSubmitting = false;
  roomId = '';
  private roleIdsSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToUserRoleIds();
    this.loadReasons();
    this.loadUserData();
  }

  initializeForm(): void {
    this.requestForm = this.fb.group({
      requestedFrom: ['', Validators.required],
      reason: ['', Validators.required],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      jobOrderNumber: ['']
    });
  }

  get items(): FormArray {
    return this.requestForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }
  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        console.log('Raw user data response:', JSON.stringify(response, null, 2));
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.requestedByuser = employee.user_ID ?? null;
          
          console.log('Requestedbyuser:',this.requestedByuser);
        } else {
          console.warn('No employee data found in response');
          alert('No user data found. Please try again.');
        }
      },
      error => {
        console.error('Error loading user data:', error);
        this.requestedByuser = null;
        alert(`Error loading user data: ${error.error?.message || error.message}`);
      }
    );
  }
  subscribeToUserRoleIds(): void {
    this.roleIdsSubscription = this.medicalService.userRoleIds$.subscribe(
      roleIds => {
        console.log('Received roleIds:', roleIds);
        if (!roleIds || roleIds.length === 0) {
          console.warn('No role IDs received');
          this.roomId = '';
          this.categories = [];
          alert('No role IDs available. Cannot load inventory.');
          return;
        }
        this.roomId = roleIds.find(id => id && id.trim()) || '';
        console.log('Set roomId:', this.roomId);
        if (this.roomId) {
          this.loadCategories();
          this.loadRoomNames();
        } else {
          console.warn('No valid roomId found in roleIds');
          this.categories = [];
          alert('No valid room ID found. Cannot load inventory.');
        }
      },
      error => {
        console.error('Error fetching role IDs:', error);
        this.roomId = '';
        this.categories = [];
        alert('Failed to fetch role IDs. Please try again.');
      }
    );
  }
  loadCategories(): void {
    if (!this.roomId) {
      console.warn('No roomId available for loading categories');
      this.categories = [];
      alert('No room ID available. Cannot load inventory.');
      return;
    }
    console.log('Fetching inventory items for roomId:', this.roomId);
    this.medicalService.getInventoryItemsByRoom(this.roomId).subscribe(
      (categories: ItemCategory[]) => {
        console.log('Raw data from getInventoryItemsByRoom:', JSON.stringify(categories, null, 2));
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
          console.error('Invalid or empty categories data:', categories);
          this.categories = [];
          alert('No inventory categories available for this room.');
          return;
        }
        
        // Transform categories to ensure proper typing
        this.categories = categories.map((category, index) => {
          console.log(`Processing category ${index}:`, JSON.stringify(category, null, 2));
          
          // Ensure items are properly typed
          const typedItems: InventoryItemenhanced[] = (category.items || []).map(item => ({
            ...item,
            // Ensure stockStatus is properly typed
            stockStatus: item.stockStatus as 'Low Stock' | 'Normal' | 'Overstock' || 'Normal'
          }));
          
          return {
            categoryID: category.categoryID != null ? category.categoryID.toString() : `unknown-${index}-${Math.random().toString(36).substring(2, 9)}`,
            categoryName: category.categoryName || `Category ${category.categoryID || index + 1}`,
            description: category.description || '',
            isActive: category.isActive !== undefined ? category.isActive : true,
            items: typedItems,
            dosageForms: this.groupItemsByUnit(typedItems)
          };
        }).filter(category => category.dosageForms && category.dosageForms.length > 0);
        
        console.log('Transformed categories:', JSON.stringify(this.categories, null, 2));
      },
      error => {
        console.error('Error loading categories:', error);
        this.categories = [];
        alert('Failed to load inventory categories. Please try again.');
      }
    );
  }
  loadRoomNames(): void {
    if (!this.roomId) {
      console.warn('No roomId available for loading room names');
      this.roomNames = [];
      alert('No room ID available. Cannot load room names.');
      return;
    }
    console.log('Fetching room categories for roomId:', this.roomId);
    this.medicalService.getRoomCategories(this.roomId).subscribe(
      (roomCategories: RoomCategory[]) => {
        console.log('Received room categories:', JSON.stringify(roomCategories, null, 2));
        if (!roomCategories || !Array.isArray(roomCategories) || roomCategories.length === 0) {
          console.warn('No room categories available:', roomCategories);
          this.roomNames = [];
          alert('No room names available for this room ID.');
          return;
        }
        // Extract unique roomName values
        this.roomNames = [...new Set(roomCategories.map(category => category.roomName))];
        console.log('Unique room names:', this.roomNames);
        // Set default requestedFrom if only one room name exists
        if (this.roomNames.length === 1) {
          this.requestForm.patchValue({ requestedFrom: this.roomNames[0] });
        }
      },
      error => {
        console.error('Error loading room categories:', error);
        this.roomNames = [];
        alert('Failed to load room names. Please try again.');
      }
    );
  }

  private groupItemsByUnit(items: InventoryItemenhanced[]): DosageForm[] {
    console.log('Grouping items by unit:', JSON.stringify(items, null, 2));
    const formMap = new Map<string, InventoryItemenhanced[]>();
    
    // Ensure items is not null or undefined
    if (!items || items.length === 0) {
      console.warn('No items to group');
      return [];
    }
    
    items.forEach(item => {
      // Ensure item has all required properties
      if (!item || !item.unit) {
        console.warn('Invalid item detected:', item);
        return;
      }
      
      const form = item.unit;
      if (!formMap.has(form)) {
        formMap.set(form, []);
      }
      
      // Ensure item is properly typed before adding
      const typedItem: InventoryItemenhanced = {
        ...item,
        stockStatus: item.stockStatus as 'Low Stock' | 'Normal' | 'Overstock' || 'Normal'
      };
      
      formMap.get(form)!.push(typedItem);
    });
    
    const dosageForms = Array.from(formMap.entries()).map(([form, items]) => ({
      form,
      items: items.sort((a, b) => a.itemName.localeCompare(b.itemName))
    })).sort((a, b) => a.form.localeCompare(b.form));
    
    console.log('Generated dosageForms:', JSON.stringify(dosageForms, null, 2));
    return dosageForms;
  }
  

  loadReasons(): void {
    this.medicalService.getPharmacyRequestReasons().subscribe(
      reasons => {
        console.log('Loaded reasons:', reasons);
        this.reasons = reasons;
      },
      error => console.error('Error loading reasons:', error)
    );
  }
  // onItemSelect(selection: ItemSelection, index: number): void {
  //   const itemGroup = this.items.at(index);
  //   itemGroup.patchValue({
  //     itemId: selection.itemId
  //   });
  // }
  onItemSelect(selection: ItemSelection, index: number): void {
    console.log(`Item selected at index ${index}:`, selection);
    // No need to patch itemId here if formControlName is used
  }

  onReasonSelect(selection: ReasonSelection): void {
    this.requestForm.patchValue({
      reason: selection.reasonId
    });
  }

  submitRequest(): void {
    if (this.requestForm.invalid || !this.requestedByuser || !this.roomId) {
        console.log('Form invalid or missing data:', {
            formErrors: this.requestForm.errors,
            requestedByuser: this.requestedByuser,
            roomId: this.roomId
        });
        alert('Invalid form, user, or room data. Please ensure you are logged in and have selected a valid room.');
        return;
    }

    this.isSubmitting = true;
    const request: InventoryRequestEnhanced = {
        requestNumber: `REQINV-${Date.now()}`,
        requestedFrom: this.requestForm.value.requestedFrom,
        roomID: this.roomId,
        requestedBy: this.requestedByuser,
        requestDate: new Date(),
        reasonForRequest: this.requestForm.value.reason?.toString().trim(),
        status: 'Pending',
        items: this.requestForm.value.items.map((item: any) => ({
            itemID: parseInt(item.itemId, 10),
            requestedQuantity: parseInt(item.quantity, 10),
            jobOrderNumber: item.jobOrderNumber?.toString().trim() || ''
        }))
    };

    console.log('Submitting request:', JSON.stringify(request, null, 2));
    this.medicalService.createInventoryRequestEnhanced(request).subscribe({
        next: () => {
            this.isSubmitting = false;
            this.requestForm.reset();
            alert('Request submitted successfully');
        },
        error: (error) => {
            this.isSubmitting = false;
            console.error('Error submitting request:', error);
            alert(`Error submitting request: ${error.error?.message || error.message}`);
        }
    });
}
  ngOnDestroy(): void {
    if (this.roleIdsSubscription) {
      this.roleIdsSubscription.unsubscribe();
    }
  }
}