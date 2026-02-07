import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';                    // ← ADD THIS
import { Subscription } from 'rxjs';
import { MedicalService } from 'src/app/medical.service';
import { ItemCategory, ReasonCategory, RoomCategory, InventoryRequestEnhanced } from 'src/app/models/inventory-enhanced.model';
import { environment } from 'src/environments/environment'; // ← ADD THIS

@Component({
  selector: 'app-inventory-request-form',
  templateUrl: './inventory-request-form.component.html',
  styleUrls: ['./inventory-request-form.component.css']
})
export class InventoryRequestFormComponent implements OnInit, OnDestroy {
  requestForm: FormGroup;
  categories: ItemCategory[] = [];        // For item tree dropdown
  reasons: ReasonCategory[] = [];         // For reason tree dropdown
  roomNames: string[] = [];               // For "Requested From" select
  roomId: string | null = null;           // User's room GUID from role
  requestedByGuid: string | null = null;  // User's GUID

  isLoading = true;
  isSubmitting = false;

  private roleSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private snackBar: MatSnackBar
  ) {
    this.requestForm = this.fb.group({
      requestedFrom: ['', Validators.required],
      reason: ['', Validators.required],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  ngOnInit(): void {
    // Subscribe to user role IDs (room GUIDs)
    this.roleSub = this.medicalService.userRoleIds$.subscribe(roleIds => {
      if (roleIds && roleIds.length > 0) {
        // Use first role ID as roomId (you can adjust logic if multiple rooms)
        this.roomId = roleIds[0];
        console.log('User Room ID (from role):', this.roomId);
        this.loadData();
      } else {
        this.isLoading = false;
        this.showError('No room access found. Contact administrator.');
      }
    });

    // Load current user GUID
    this.medicalService.getEmployeeById(environment.username).subscribe(
      res => {
        const employee = res?.c_Employees?.[0];
        this.requestedByGuid = employee?.user_ID ?? null;
      },
      err => console.error('Failed to load user GUID', err)
    );
  }

  async loadData() {
    if (!this.roomId) return;
  
    this.isLoading = true;
    try {
      // 1. Load room names
      const roomCats: RoomCategory[] = await firstValueFrom(
        this.medicalService.getRoomCategories(this.roomId!)
      );
      this.roomNames = [...new Set(roomCats.map(r => r.roomName))].filter(Boolean);
  
      if (this.roomNames.length === 1) {
        this.requestForm.patchValue({ requestedFrom: this.roomNames[0] });
      }
  
      // 2. Load items
      this.categories = await firstValueFrom(
        this.medicalService.getInventoryItemsByRoom(this.roomId!)
      );
  
      // 3. Load reasons
      this.reasons = await firstValueFrom(
        this.medicalService.getPharmacyRequestReasons()
      );
  
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load inventory data. Please try again.');
    } finally {
      this.isLoading = false;
    }
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

  onReasonSelect(selection: any): void {
    this.requestForm.patchValue({ reason: selection.reasonId });
  }

  onItemSelect(selection: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({ itemId: selection.itemId });
  }

  async submitRequest(): Promise<void> {
    if (this.requestForm.invalid) {
      this.showError('Please complete all required fields.');
      return;
    }

    if (!this.roomId || !this.requestedByGuid) {
      this.showError('User or room information missing.');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.requestForm.value;

    const payload: InventoryRequestEnhanced = {
      requestNumber: `REQINV-${Date.now()}`,
      requestedFrom: formValue.requestedFrom,
      roomID: this.roomId,
      requestedBy: this.requestedByGuid,
      requestDate: new Date(),
      reasonForRequest: formValue.reason,
      status: 'Pending',
      items: formValue.items.map((item: any) => ({
        itemID: parseInt(item.itemId, 10),
        requestedQuantity: parseInt(item.quantity, 10),
        jobOrderNumber: item.jobOrderNumber?.trim() || ''
      }))
    };

    try {
      await this.medicalService.createInventoryRequestEnhanced(payload).toPromise();
      this.showSuccess('Inventory request submitted successfully!');
      this.requestForm.reset();
      this.items.clear();
      this.items.push(this.createItemGroup());
      if (this.roomNames.length === 1) {
        this.requestForm.patchValue({ requestedFrom: this.roomNames[0] });
      }
    } catch (error: any) {
      this.showError('Failed to submit request: ' + (error?.error?.message || error.message));
    } finally {
      this.isSubmitting = false;
    }
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 7000, panelClass: ['error-snackbar'] });
  }
}