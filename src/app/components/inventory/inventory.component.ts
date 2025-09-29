import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { SupervisorRequest, InventoryRequestDetail, InventoryItemenhanced } from 'src/app/models/inventory-enhanced.model';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { MedicationCategory, MedicationSelection } from '../medication-tree-dropdown/medication-tree-dropdown.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit, OnDestroy {
  // Form for new inventory request
  inventoryRequestForm!: FormGroup;
  isSubmitting = false;
  categorizedMedications: MedicationCategory[] = [];

  // Summary data
  approvedRequestsCount = 0;
  pendingIssueCount = 0;
  lowStockItemsCount = 0;
  totalPendingValue = 0;

  // Filter properties
  statusFilter = 'all';
  roomFilter = 'all';
  dateFrom = '';
  dateTo = '';

  // Data arrays
  allRequests: SupervisorRequest[] = [];
  filteredRequests: SupervisorRequest[] = [];
  inventoryItems: InventoryItemenhanced[] = [];
  inventoryRequests: SupervisorRequest[] = [];
  uniqueRooms: string[] = [];

  // Modal properties
  selectedRequest: SupervisorRequest | null = null;
  selectedRequestItems: InventoryRequestDetail[] = [];
  selectedItem: InventoryItemenhanced | null = null;
  showCommentsInput = false;
  issueComments = '';
  isProcessing = false;

  // User properties
  currentUserId: string | null = null;
  roomId = '';
  private roleIdsSubscription!: Subscription;

  constructor(
    private medicalService: MedicalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.subscribeToUserRoleIds();
    this.loadMedications();
    this.loadInventoryRequests();
    this.loadApprovedRequests();
  }

  initializeForm(): void {
    this.inventoryRequestForm = this.fb.group({
      requestedFrom: ['', Validators.required],
      reasonForRequest: ['', Validators.required],
      items: this.fb.array([this.createItemGroup()]),
      requestedBy: ['', Validators.required]
    });
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      medicationID: ['', Validators.required],
      unit: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      jobOrderNo: ['']
    });
  }

  get itemsFormArray(): FormArray {
    return this.inventoryRequestForm.get('items') as FormArray;
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  loadMedications(): void {
    this.medicalService.getMedications().subscribe({
      next: (medications: MedicationCategory[]) => {
        console.log('Loaded medications:', medications);
        this.categorizedMedications = medications;
      },
      error: (error) => {
        console.error('Error loading medications:', error);
        alert('Failed to load medications. Please try again.');
        this.categorizedMedications = [];
      }
    });
  }

  onMedicationSelection(selection: MedicationSelection, index: number): void {
    const itemFormGroup = this.itemsFormArray.at(index) as FormGroup;
    itemFormGroup.patchValue({
      medicationID: selection.medicationId
    });

    if (selection.medicationId && !this.categorizedMedications.some(category =>
      category.dosageForms.some(form => form.medications.some(med => med.medicationID === Number(selection.medicationId)))
    )) {
      this.addNewMedication(selection);
    }
  }

  addNewMedication(selection: MedicationSelection): void {
    const newMedication = {
      medicationID: selection.medicationId,
      medicationName: selection.medicationName || 'Custom Medication',
      strength: '',
      dosageForm: 'Unknown',
      therapeuticClass: 'Custom'
    };
    this.medicalService.addMedication(newMedication).subscribe({
      next: (addedMedication) => {
        const customCategory = this.categorizedMedications.find(c => c.category === 'Custom') || {
          category: 'Custom',
          dosageForms: [{ form: 'Unknown', medications: [] }]
        };
        customCategory.dosageForms[0].medications.push(addedMedication);
        if (!this.categorizedMedications.includes(customCategory)) {
          this.categorizedMedications.push(customCategory);
        }
      },
      error: (error) => {
        console.error('Error adding new medication:', error);
        alert('Failed to add new medication. Please try again.');
      }
    });
  }

  loadInventoryRequests(): void {
    this.medicalService.getInventorysuperRequests().subscribe({
      next: (requests: SupervisorRequest[]) => {
        console.log('Loaded inventory requests:', requests);
        this.inventoryRequests = requests
          .filter(r => r.status.toLowerCase() === 'pending')
          .map(request => ({
            ...request,
            status: request.status.toLowerCase() as 'pending' | 'approved' | 'issued' | 'received'
          }));
      },
      error: (error) => {
        console.error('Error loading inventory requests:', error);
        alert('Failed to load inventory requests. Please try again.');
      }
    });
  }
  

  updateRequestStatus(id: number, status: string): void {
    this.isProcessing = true;
    if (!this.currentUserId) {
      alert('User information not available. Please try again.');
      this.isProcessing = false;
      return;
    }
    this.medicalService.updateRequestStatus(id, status, this.currentUserId).subscribe({
      next: () => {
        console.log(`Request ${id} updated to status: ${status}`);
        const request = this.inventoryRequests.find(r => r.requestID === id);
        if (request) {
          request.status = status.toLowerCase() as 'pending' | 'approved' | 'issued' | 'received';
          // Remove from inventoryRequests if approved
          if (status.toLowerCase() === 'approved') {
            this.inventoryRequests = this.inventoryRequests.filter(r => r.requestID !== id);
          }
        }
        this.loadApprovedRequests();
        this.loadInventoryRequests();
        this.isProcessing = false;
        alert(`Request ${status} successfully!`);
      },
      error: (error) => {
        console.error(`Error updating request status to ${status}:`, error);
        alert(`Failed to update request status. Please try again.`);
        this.isProcessing = false;
      }
    });
  }
  

  onSubmit(): void {
    if (this.inventoryRequestForm.valid) {
      this.isSubmitting = true;
      const newRequest: SupervisorRequest = {
        requestID: this.generateId(),
        requestNumber: this.generateRequestNo(),
        requestedFrom: this.inventoryRequestForm.value.requestedFrom,
        reasonForRequest: this.inventoryRequestForm.value.reasonForRequest,
        items: this.inventoryRequestForm.value.items,
        requestedBy: this.inventoryRequestForm.value.requestedBy,
        requestedByName: this.inventoryRequestForm.value.requestedBy,
        requestDate: new Date(),
        status: 'pending',
        roomID: this.roomId,
        roomName: this.roomFilter !== 'all' ? this.roomFilter : '',
        itemCount: this.inventoryRequestForm.value.items.length,
        estimatedValue: 0
      };

      this.medicalService.createInventoryRequest(newRequest).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.inventoryRequestForm.reset();
          this.initializeForm();
          this.loadApprovedRequests();
          this.loadInventoryRequests();
          alert('Inventory request submitted successfully!');
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error submitting request:', error);
          alert('Error submitting request. Please try again.');
        }
      });
    }
  }

  private generateId(): number {
    return Date.now();
  }

  private generateRequestNo(): string {
    return 'REQINV-' + Date.now().toString();
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.currentUserId = employee.user_ID ?? null;
        } else {
          console.warn('No employee data found');
          alert('No user data found. Please try again.');
        }
      },
      error => {
        console.error('Error loading user data:', error);
        alert('Error loading user data. Please refresh the page.');
      }
    );
  }

  subscribeToUserRoleIds(): void {
    this.roleIdsSubscription = this.medicalService.userRoleIds$.subscribe(
      roleIds => {
        if (!roleIds || roleIds.length === 0) {
          console.warn('No role IDs received');
          return;
        }
        this.roomId = roleIds.find(id => id && id.trim()) || '';
        if (this.roomId) {
          this.loadApprovedRequests();
          this.loadInventoryItems();
          this.loadInventoryRequests();
        }
      },
      error => {
        console.error('Error fetching role IDs:', error);
        alert('Failed to fetch role IDs. Please try again.');
      }
    );
  }

  loadApprovedRequests(): void {
    this.medicalService.getPendingRequestsForSupervisor().subscribe(
      (requests: SupervisorRequest[]) => {
        console.log('Loaded approved requests:', requests);
        this.allRequests = requests.map(request => ({
          ...request,
          status: request.status.toLowerCase() as 'pending' | 'approved' | 'issued' | 'received'
        }));
        this.updateSummaryData();
        this.updateUniqueRooms();
        this.onFilterChange();
      },
      error => {
        console.error('Error loading approved requests:', error);
        alert('Error loading requests. Please try again.');
      }
    );
  }

  loadInventoryItems(): void {
    this.medicalService.getIssueItems().subscribe(
      (items: InventoryItemenhanced[]) => {
        console.log('Loaded inventory items:', items);
        this.inventoryItems = items.map(item => ({
          ...item,
          currentStock: item.currentStock || 0,
          minimumStock: item.minimumStock || 0,
          maximumStock: item.maximumStock || undefined,
          itemID: item.itemID || 0,
          itemCode: item.itemCode || '',
          itemName: item.itemName || '',
          categoryID: item.categoryID || 0,
          categoryName: item.categoryName || '',
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          batchNumber: item.batchNumber || '',
          manufacturer: item.manufacturer || '',
          expiryDate: item.expiryDate,
          isActive: item.isActive !== undefined ? item.isActive : true,
          createdDate: item.createdDate || new Date(),
          updatedDate: item.updatedDate || new Date(),
          maxQuantityAllowed: item.maxQuantityAllowed,
          stockStatus: item.stockStatus || 'Normal',
          RoomID: item.RoomID
        }));
        this.updateSummaryData();
      },
      error => {
        console.error('Error loading inventory items:', error);
        alert('Error loading inventory items. Please try again.');
      }
    );
  }
  

  updateSummaryData(): void {
    this.approvedRequestsCount = this.allRequests.filter(r => r.status === 'approved').length;
    this.pendingIssueCount = this.allRequests.filter(r => r.status === 'approved').length;
    this.lowStockItemsCount = this.inventoryItems.filter(item => 
      item.currentStock <= item.minimumStock
    ).length;
    this.totalPendingValue = this.allRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.estimatedValue || 0), 0);
  }

  updateUniqueRooms(): void {
    this.uniqueRooms = [...new Set(this.allRequests.map(r => r.roomName))].filter(room => room).sort();
  }

  onFilterChange(): void {
    let filtered = [...this.allRequests];
    console.log('Filtering requests:', filtered, 'with statusFilter:', this.statusFilter);

    // Default filter for Approved and Issued requests in Approved Requests table
    filtered = filtered.filter(r => ['approved', 'issued'].includes(r.status.toLowerCase()));

    // Apply status filter if not 'all'
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    if (this.roomFilter !== 'all') {
      filtered = filtered.filter(r => r.roomName === this.roomFilter);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(r => new Date(r.requestDate) >= fromDate);
    }
    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.requestDate) <= toDate);
    }

    this.filteredRequests = filtered.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
    console.log('Filtered requests:', this.filteredRequests);
  }

  getRoomClass(roomName: string | null): string {
    if (!roomName) return 'room-default';
    return 'room-' + roomName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  getStockStatusClass(item: InventoryItemenhanced): string {
    if (item.currentStock <= item.minimumStock) return 'low-stock';
    if (item.maximumStock && item.currentStock > item.maximumStock) return 'overstock';
    return 'normal-stock';
  }

  getStockStatusText(item: InventoryItemenhanced): string {
    if (item.currentStock <= item.minimumStock) return 'Low Stock';
    if (item.maximumStock && item.currentStock > item.maximumStock) return 'Overstock';
    return 'Normal';
  }

  viewRequestDetails(request: SupervisorRequest): void {
    this.selectedRequest = request;
    this.selectedItem = null;
    this.showCommentsInput = request.status.toLowerCase() === 'approved' || request.status.toLowerCase() === 'issued';
    this.issueComments = '';
    
    this.medicalService.getRequestDetails(request.requestID).subscribe(
      (items: InventoryRequestDetail[]) => {
        this.selectedRequestItems = items;
      },
      error => {
        console.error('Error loading request items:', error);
        alert('Error loading request details.');
      }
    );
  }

  viewItemDetails(item: InventoryItemenhanced): void {
    this.selectedItem = item;
    this.selectedRequest = null;
  }

  issueItems(request: SupervisorRequest): void {
    this.viewRequestDetails(request);
  }

  confirmReceipt(request: SupervisorRequest): void {
    this.viewRequestDetails(request);
  }

  confirmIssueItems(): void {
    if (!this.selectedRequest || !this.currentUserId) {
      alert('Missing request or user information');
      return;
    }

    const insufficientItems = this.selectedRequestItems.filter(item => 
      (item.currentStock || 0) < (item.requestedQuantity || 0)
    );

    if (insufficientItems.length > 0) {
      const itemNames = insufficientItems.map(item => item.itemName).join(', ');
      alert(`Insufficient stock for items: ${itemNames}. Cannot issue request.`);
      return;
    }

    this.isProcessing = true;
    this.medicalService.issueItems(
      this.selectedRequest.requestID,
      this.currentUserId,
      this.issueComments
    ).subscribe(
      () => {
        this.isProcessing = false;
        this.closeModal();
        this.loadApprovedRequests();
        this.loadInventoryItems();
        this.loadInventoryRequests();
        alert('Items issued successfully!');
      },
      error => {
        this.isProcessing = false;
        console.error('Error issuing items:', error);
        alert('Error issuing items. Please try again.');
      }
    );
  }

  confirmReceiptItems(): void {
    if (!this.selectedRequest || !this.currentUserId) {
      alert('Missing request or user information');
      return;
    }

    this.isProcessing = true;
    this.medicalService.confirmReceipt(
      this.selectedRequest.requestID,
      this.currentUserId,
      this.issueComments
    ).subscribe(
      () => {
        this.isProcessing = false;
        this.closeModal();
        this.loadApprovedRequests();
        this.loadInventoryRequests();
        alert('Receipt confirmed successfully!');
      },
      error => {
        this.isProcessing = false;
        console.error('Error confirming receipt:', error);
        alert('Error confirming receipt. Please try again.');
      }
    );
  }

  closeModal(): void {
    this.selectedRequest = null;
    this.selectedRequestItems = [];
    this.showCommentsInput = false;
    this.issueComments = '';
    this.isProcessing = false;
  }

  closeItemModal(): void {
    this.selectedItem = null;
  }

  ngOnDestroy(): void {
    if (this.roleIdsSubscription) {
      this.roleIdsSubscription.unsubscribe();
    }
  }
}