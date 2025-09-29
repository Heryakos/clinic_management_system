import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { ItemRegistration, InventoryPurchaseRequest } from 'src/app/models/inventory-enhanced.model';
import { environment } from 'src/environments/environment';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-item-receiving',
  templateUrl: './item-receiving.component.html',
  styleUrls: ['./item-receiving.component.css']
})
export class ItemReceivingComponent implements OnInit {
  receivingForm!: FormGroup;
  private sequenceCounter = 1;
  // Summary data
  purchasedRequestsCount = 0;
  receivedTodayCount = 0;
  qualityPendingCount = 0;
  totalReceivedValue = 0;

  // Data arrays
  availablePurchaseRequests: InventoryPurchaseRequest[] = [];
  recentlyReceived: ItemRegistration[] = [];

  // Modal properties
  selectedPurchaseRequest: InventoryPurchaseRequest | null = null;
  selectedReceivedItem: ItemRegistration | null = null;

  // Processing state
  isSubmitting = false;
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.loadPurchaseRequests();
    this.loadRecentlyReceived();
    this.validateBatchNumber();
  }

  private getNextSequence(): number {
    return this.sequenceCounter++;
  }
  initializeForm(): void {
    this.receivingForm = this.fb.group({
      purchaseRequestId: ['', Validators.required],
      batchNumber: ['', [
        Validators.required,
        Validators.pattern('^[A-Z0-9-]+$'), // Only uppercase letters, numbers, and hyphens
        Validators.minLength(3),
        Validators.maxLength(20)
      ]],
      manufacturer: ['', Validators.required],
      supplier: ['', Validators.required],
      manufactureDate: [''],
      expiryDate: [''],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      qualityCheck: [true],
      qualityComments: ['']
    });
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

  loadPurchaseRequests(): void {
    this.medicalService.getPurchaseRequests().subscribe(
      (purchases: InventoryPurchaseRequest[]) => {
        // Filter for purchased items that haven't been received yet
        this.availablePurchaseRequests = purchases.filter(p =>
          p.status === 'Purchased' || p.status === 'Pending'
        );
        this.updateSummaryData();
      },
      error => {
        console.error('Error loading purchase requests:', error);
        alert('Error loading purchase requests. Please try again.');
      }
    );
  }

  loadRecentlyReceived(): void {
    // Load recently received items from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // You might need to create an endpoint for this or filter existing data
    // For now, we'll use a placeholder method
    this.recentlyReceived = [];
    this.updateSummaryData();
  }

  updateSummaryData(): void {
    this.purchasedRequestsCount = this.availablePurchaseRequests.length;

    const today = new Date();
    this.receivedTodayCount = this.recentlyReceived.filter(item => {
      const receivedDate = new Date(item.receivedDate);
      return receivedDate.toDateString() === today.toDateString();
    }).length;

    this.qualityPendingCount = this.recentlyReceived.filter(item => !item.qualityCheck).length;

    this.totalReceivedValue = this.recentlyReceived
      .filter(item => {
        const receivedDate = new Date(item.receivedDate);
        return receivedDate.toDateString() === today.toDateString();
      })
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }

  selectPurchaseRequest(purchaseRequest: InventoryPurchaseRequest): void {
    this.receivingForm.patchValue({
      purchaseRequestId: purchaseRequest.purchaseRequestID,
      supplier: purchaseRequest.supplier || '',
      unitPrice: purchaseRequest.estimatedUnitPrice || 0,
      quantity: purchaseRequest.quantity
    });
  }

  calculateTotalCost(): number {
    const quantity = this.receivingForm.get('quantity')?.value || 0;
    const unitPrice = this.receivingForm.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  submitReceiving(): void {
    if (this.receivingForm.invalid || !this.currentUserId) {
      if (!this.currentUserId) {
        alert('User information not available. Please refresh the page.');
      }
      return;
    }

    this.isSubmitting = true;
    const selectedPurchase = this.availablePurchaseRequests.find(p =>
      p.purchaseRequestID === +this.receivingForm.value.purchaseRequestId
    );

    if (!selectedPurchase) {
      this.isSubmitting = false;
      alert('Selected purchase request not found.');
      return;
    }

    const registration: ItemRegistration = {
      registrationID: 0,
      itemID: selectedPurchase.itemID,
      itemName: selectedPurchase.itemName,
      itemCode: selectedPurchase.itemCode || '',
      batchNumber: this.receivingForm.value.batchNumber,
      manufacturer: this.receivingForm.value.manufacturer,
      supplier: this.receivingForm.value.supplier,
      manufactureDate: this.receivingForm.value.manufactureDate || null,
      expiryDate: this.receivingForm.value.expiryDate || null,
      quantity: this.receivingForm.value.quantity,
      unitPrice: this.receivingForm.value.unitPrice,
      totalCost: this.calculateTotalCost(),
      purchaseRequestID: selectedPurchase.purchaseRequestID,
      purchaseRequestNumber: selectedPurchase.requestNumber,
      receivedDate: new Date(),
      receivedBy: this.currentUserId,
      receivedByName: '', // Will be populated by backend
      qualityCheck: this.receivingForm.value.qualityCheck,
      qualityCheckBy: this.currentUserId,
      qualityCheckByName: '', // Will be populated by backend
      qualityCheckDate: new Date(),
      qualityComments: this.receivingForm.value.qualityComments || null,
      isActive: true
    };

    this.medicalService.registerReceivedItems(registration).subscribe(
      () => {
        this.isSubmitting = false;
        this.resetForm();
        this.loadPurchaseRequests();
        this.loadRecentlyReceived();
        alert('Items received and registered successfully!');
      },
      error => {
        this.isSubmitting = false;
        console.error('Error receiving items:', error);
        alert('Error receiving items. Please try again.');
      }
    );
  }

  resetForm(): void {
    this.receivingForm.reset();
    this.receivingForm.patchValue({
      qualityCheck: true
    });
  }

  viewPurchaseDetails(purchaseRequest: InventoryPurchaseRequest): void {
    this.selectedPurchaseRequest = purchaseRequest;
    this.selectedReceivedItem = null;
  }

  viewReceivedItemDetails(receivedItem: ItemRegistration): void {
    this.selectedReceivedItem = receivedItem;
    this.selectedPurchaseRequest = null;
  }

  closeDetailsModal(): void {
    this.selectedPurchaseRequest = null;
    this.selectedReceivedItem = null;
  }

  checkBatchNumberExists(batchNumber: string): Observable<boolean> {
    // You'll need to implement this method in your MedicalService
    return this.medicalService.checkBatchNumber(batchNumber);
  }
  validateBatchNumber(): void {
    const batchControl = this.receivingForm.get('batchNumber');
    if (batchControl) {
      batchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((batchNumber: string) => this.checkBatchNumberExists(batchNumber))
      ).subscribe(exists => {
        if (exists) {
          batchControl.setErrors({ batchExists: true });
        }
      });
    }
  }

  generatePurchaseRequestNumber(): string {
    const prefix = 'PR';
    const year = new Date().getFullYear();
    const sequence = this.getNextSequence();
    return `${prefix}${year}-${sequence.toString().padStart(4, '0')}`;
  }

}