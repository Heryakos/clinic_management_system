import { Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { InventoryRequestEnhanced, InventoryPurchaseRequest, InventoryRequestDetail } from 'src/app/models/inventory-enhanced.model';

@Component({
  selector: 'app-inventory-management',
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css']
})
export class InventoryManagementComponent implements OnInit {
  approvedRequests: InventoryRequestEnhanced[] = [];
  purchaseRequests: InventoryPurchaseRequest[] = [];
  selectedRequest?: InventoryRequestEnhanced;
  selectedRequestDetails: InventoryRequestDetail[] = [];

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    this.loadApprovedRequests();
    this.loadPurchaseRequests();
  }

  loadApprovedRequests(): void {
    this.medicalService.getPendingRequestsForSupervisor().subscribe(
      requests => this.approvedRequests = requests.filter(r => r.status === 'Approved')
    );
  }

  loadPurchaseRequests(): void {
    this.medicalService.getPurchaseRequests().subscribe(
      purchases => this.purchaseRequests = purchases.filter(p => p.status === 'Pending')
    );
  }

  issueItems(request: InventoryRequestEnhanced): void {
    this.medicalService.issueItems(request.requestID!, 'inventoryId').subscribe(
      () => this.loadApprovedRequests()
    );
  }

  createPurchase(request: InventoryRequestEnhanced, item: InventoryRequestDetail): void {
    const purchase: InventoryPurchaseRequest = {
      requestNumber: `PUR-${Date.now()}`,
      originalRequestID: request.requestID!,
      itemID: item.itemID,
      itemName: item.itemName || 'Unknown Item',
      itemCode: item.itemCode || '', // Add this
      quantity: item.requestedQuantity,
      estimatedUnitPrice: item.unitPrice || 0,
      totalEstimatedCost: (item.unitPrice || 0) * item.requestedQuantity, // Add this
      requestedBy: request.requestedBy,
      requestedByName: 'Unknown', // Add this
      requestDate: new Date(), // Add this
      status: 'Pending'
    };
    this.medicalService.createPurchaseRequest(purchase).subscribe(
      () => this.loadPurchaseRequests()
    );
  }

  viewDetails(request: InventoryRequestEnhanced): void {
    this.selectedRequest = request;
    this.medicalService.getRequestDetails(request.requestID!).subscribe(
      details => this.selectedRequestDetails = details
    );
  }

  markPurchased(purchase: InventoryPurchaseRequest): void {
    this.medicalService.updatePurchaseRequestStatus(purchase.purchaseRequestID!, 'Purchased', 'inventoryId').subscribe(
      () => this.loadPurchaseRequests()
    );
  }
}
