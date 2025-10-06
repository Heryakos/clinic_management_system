import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { SupervisorRequest, PurchaseRequest, InventoryRequestDetail, ItemRegistration, InventoryPurchaseRequest } from '../../models/inventory-enhanced.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-supervisor-dashboard',
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.css']
})
export class SupervisorDashboardComponent implements OnInit {
  pendingRequestsCount = 0;
  approvedRequestsCount = 0;
  purchaseRequestsCount = 0;
  totalEstimatedValue = 0;

  statusFilter = 'pending';
  roomFilter = 'all';
  dateFrom = '';
  dateTo = '';

  allRequests: SupervisorRequest[] = [];
  filteredRequests: SupervisorRequest[] = [];
  purchaseRequests: PurchaseRequest[] = [];
  uniqueRooms: string[] = [];

  selectedRequest: SupervisorRequest | null = null;
  selectedRequestItems: InventoryRequestDetail[] = [];
  selectedPurchase: PurchaseRequest | null = null;
  selectedPurchaseItems: ItemRegistration[] = [];
  showCommentsInput = false;
  actionComments = '';
  isProcessing = false;

  supervisorId: string | null = null;
  supervisorName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadRequests();
    this.loadPurchaseRequests();
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.supervisorId = employee.user_ID ?? null;
          this.supervisorName = employee.fullName ?? employee.firstName + ' ' + employee.lastName ?? null;
        }
      },
      error => {
        console.error('Error loading user data:', error);
        alert('Error loading user data. Please refresh the page.');
      }
    );
  }

  loadRequests(): void {
    this.medicalService.getPendingRequestsForSupervisor().subscribe(
      (requests: SupervisorRequest[]) => {
        this.allRequests = requests.filter(r => r.status === 'Pending');
        this.updateSummaryData();
        this.updateUniqueRooms();
        this.onFilterChange();
      },
      error => {
        console.error('Error loading requests:', error);
        alert('Error loading requests. Please try again.');
      }
    );
  }

  loadPurchaseRequests(): void {
    this.medicalService.getPurchaseRequests().subscribe(
      requests => this.purchaseRequests = requests.filter(r => r.status === 'Pending') as PurchaseRequest[]
    );
  }

  updateSummaryData(): void {
    this.pendingRequestsCount = this.allRequests.filter(r => r.status === 'Pending').length;
    this.approvedRequestsCount = this.allRequests.filter(r => 
      r.status === 'Approved' && 
      new Date(r.requestDate).toDateString() === new Date().toDateString()
    ).length;
    this.totalEstimatedValue = this.allRequests
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + (r.estimatedValue || 0), 0);
  }

  updateUniqueRooms(): void {
    this.uniqueRooms = [...new Set(this.allRequests.map(r => r.roomName))].sort();
  }

  onFilterChange(): void {
    let filtered = [...this.allRequests];

    if (this.statusFilter !== 'all' && this.statusFilter !== 'pending') {
      filtered = filtered.filter(r => r.status.toLowerCase() === this.statusFilter);
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
  }

  getRoomClass(roomName: string | null): string {
    if (!roomName) return 'room-default';
    return 'room-' + roomName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  viewRequestDetails(request: SupervisorRequest): void {
    this.selectedRequest = request;
    this.selectedPurchase = null;
    this.selectedPurchaseItems = [];
    this.showCommentsInput = false;
    this.actionComments = '';
    
    this.medicalService.getRequestDetails(request.requestID).subscribe(
      (items: any[]) => {
        this.selectedRequestItems = items.map(item => ({
          ...item,
          currentStock: item.currentStock || 0,
          requestedQuantity: item.quantity || 0
        }));
      },
      error => {
        console.error('Error loading request items:', error);
        alert('Error loading request details.');
      }
    );
  }

  approveRequest(request: SupervisorRequest): void {
    this.viewRequestDetails(request);
    this.showCommentsInput = true;
  }

  rejectRequest(request: SupervisorRequest): void {
    this.viewRequestDetails(request);
    this.showCommentsInput = true;
  }

  confirmApproveRequest(): void {
    if (!this.selectedRequest || !this.supervisorId) return;
    
    this.isProcessing = true;
    this.medicalService.updateRequestStatus(
      this.selectedRequest.requestID, 
      'Approved', 
      this.supervisorId, 
      this.actionComments
    ).subscribe(
      () => {
        this.isProcessing = false;
        this.closeModal();
        this.loadRequests();
        this.loadPurchaseRequests();
        alert('Request approved successfully!');
      },
      error => {
        this.isProcessing = false;
        console.error('Error approving request:', error);
        alert('Error approving request. Please try again.');
      }
    );
  }

  confirmRejectRequest(): void {
    if (!this.selectedRequest || !this.supervisorId) return;
    
    this.isProcessing = true;
    this.medicalService.updateRequestStatus(
      this.selectedRequest.requestID, 
      'Rejected', 
      this.supervisorId, 
      this.actionComments
    ).subscribe(
      () => {
        this.isProcessing = false;
        this.closeModal();
        this.loadRequests();
        alert('Request rejected.');
      },
      error => {
        this.isProcessing = false;
        console.error('Error rejecting request:', error);
        alert('Error rejecting request. Please try again.');
      }
    );
  }

  issueItems(request: SupervisorRequest): void {
    if (!this.supervisorId) return;
    
    this.medicalService.updateRequestStatus(
      request.requestID, 
      'Issued', 
      this.supervisorId, 
      'Items issued to requesting department'
    ).subscribe(
      () => {
        this.loadRequests();
        alert('Items issued successfully!');
      },
      error => {
        console.error('Error issuing items:', error);
        alert('Error issuing items. Please try again.');
      }
    );
  }

  viewPurchaseDetails(purchase: PurchaseRequest): void {
    this.selectedPurchase = purchase;
    this.selectedRequest = null;
    this.selectedRequestItems = [];
    this.showCommentsInput = false;
    this.actionComments = '';
  
    // Fetch associated item registrations
    if (purchase.purchaseRequestID) {
      this.medicalService.getItemRegistrations(purchase.purchaseRequestID.toString()).subscribe(
        (registration: ItemRegistration) => {
          this.selectedPurchaseItems = registration ? [registration] : [];
        },
        error => {
          console.error('Error loading purchase item registrations:', error);
          this.selectedPurchaseItems = [];
          alert('Error loading purchase details.');
        }
      );
    } else {
      this.selectedPurchaseItems = [];
    }
  }
  

  closeModal(): void {
    this.selectedRequest = null;
    this.selectedRequestItems = [];
    this.selectedPurchase = null;
    this.selectedPurchaseItems = [];
    this.showCommentsInput = false;
    this.actionComments = '';
    this.isProcessing = false;
  }
}