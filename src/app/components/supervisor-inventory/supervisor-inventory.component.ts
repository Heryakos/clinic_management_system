import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { InventoryRequestEnhanced, InventoryRequestDetail, InventoryPurchaseRequest } from 'src/app/models/inventory-enhanced.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-supervisor-inventory',
  templateUrl: './supervisor-inventory.component.html',
  styleUrls: ['./supervisor-inventory.component.css']
})
export class SupervisorInventoryComponent implements OnInit {
  pendingRequests: InventoryRequestEnhanced[] = [];
  filteredRequests: InventoryRequestEnhanced[] = [];
  purchaseRequests: InventoryPurchaseRequest[] = [];
  selectedRequest?: InventoryRequestEnhanced;
  selectedRequestDetails: InventoryRequestDetail[] = [];
  comments = '';
  isProcessing = false;
  supervisorId: string | null = null;

  constructor(
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadPendingRequests();
    this.loadPurchaseRequests();
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.supervisorId = employee.user_ID ?? null;
        } else {
          console.error('No employee data found.');
          alert('Error loading user data. Please refresh the page.');
        }
      },
      error => {
        console.error('Error loading user data:', error);
        alert('Error loading user data. Please refresh the page.');
      }
    );
  }

  loadPendingRequests(): void {
    this.medicalService.getPendingRequestsForSupervisor().subscribe(
      requests => {
        console.log('Pending requests:', requests);
        this.pendingRequests = requests;
        this.filteredRequests = [...requests];
        this.cdr.detectChanges();
      },
      error => {
        console.error('Error loading pending requests:', error);
        alert('Failed to load pending requests. Please try again.');
      }
    );
  }

  loadPurchaseRequests(): void {
    this.medicalService.getPurchaseRequests().subscribe(
      purchases => {
        this.purchaseRequests = purchases;
        this.cdr.detectChanges();
      },
      error => {
        console.error('Error loading purchase requests:', error);
        alert('Failed to load purchase requests. Please try again.');
      }
    );
  }

  filterRequests(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();

    if (!searchTerm) {
      this.filteredRequests = [...this.pendingRequests];
    } else {
      this.filteredRequests = this.pendingRequests.filter(request =>
        request.requestNumber.toLowerCase().includes(searchTerm)
      );
    }
    this.cdr.detectChanges();
  }

  viewDetails(request: InventoryRequestEnhanced): void {
    if (!request.requestID) {
      console.error('Request ID is undefined:', request);
      alert('Invalid request ID. Please try again.');
      return;
    }
    this.selectedRequest = request;
    this.comments = '';
    this.medicalService.getRequestDetails(request.requestID).subscribe(
      details => {
        this.selectedRequestDetails = details;
        this.cdr.detectChanges();
      },
      error => {
        console.error('Error fetching request details:', error);
        alert('Failed to load request details. Please try again.');
      }
    );
  }

  approveRequest(): void {
    if (!this.selectedRequest || !this.supervisorId || !this.selectedRequest.requestID) {
      console.error('Invalid request or supervisor ID:', { selectedRequest: this.selectedRequest, supervisorId: this.supervisorId });
      alert('Cannot approve request. Missing request or user data.');
      return;
    }
    this.isProcessing = true;
    this.medicalService.updateRequestStatus(this.selectedRequest.requestID, 'Approved', this.supervisorId, this.comments).subscribe(
      () => {
        this.isProcessing = false;
        this.selectedRequest = undefined;
        this.selectedRequestDetails = [];
        this.comments = '';
        this.loadPendingRequests();
        this.cdr.detectChanges();
        alert('Request approved successfully!');
      },
      error => {
        this.isProcessing = false;
        console.error('Error approving request:', error);
        alert('Failed to approve request. Please try again.');
      }
    );
  }

  rejectRequest(): void {
    if (!this.selectedRequest || !this.supervisorId || !this.selectedRequest.requestID) {
      console.error('Invalid request or supervisor ID:', { selectedRequest: this.selectedRequest, supervisorId: this.supervisorId });
      alert('Cannot reject request. Missing request or user data.');
      return;
    }
    this.isProcessing = true;
    this.medicalService.updateRequestStatus(this.selectedRequest.requestID, 'Rejected', this.supervisorId, this.comments).subscribe(
      () => {
        this.isProcessing = false;
        this.selectedRequest = undefined;
        this.selectedRequestDetails = [];
        this.comments = '';
        this.loadPendingRequests();
        this.cdr.detectChanges();
        alert('Request rejected successfully!');
      },
      error => {
        this.isProcessing = false;
        console.error('Error rejecting request:', error);
        alert('Failed to reject request. Please try again.');
      }
    );
  }

  monitorRequest(requestId: number): void {
    this.medicalService.setSupervisorMonitoring(requestId, true).subscribe(
      () => {
        this.loadPendingRequests();
        alert('Request monitoring enabled.');
      },
      error => {
        console.error('Error enabling monitoring:', error);
        alert('Failed to enable monitoring. Please try again.');
      }
    );
  }

  generateReport(type: string): void {
    this.medicalService.getInventoryReports(type).subscribe(
      report => {
        console.log(`Report (${type}):`, report);
        alert(`Report (${type}) generated. Check console for details.`);
      },
      error => {
        console.error(`Error generating ${type} report:`, error);
        alert(`Failed to generate ${type} report. Please try again.`);
      }
    );
  }

  closeModal(): void {
    this.selectedRequest = undefined;
    this.selectedRequestDetails = [];
    this.comments = '';
    this.cdr.detectChanges();
  }
}