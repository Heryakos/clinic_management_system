import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { MedicalRequestView, ApprovalRequest } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-supervisor-medical-requests',
  templateUrl: './supervisor-medical-requests.component.html',
  styleUrls: ['./supervisor-medical-requests.component.css']
})
export class SupervisorMedicalRequestsComponent implements OnInit {
  currentEmployeeCode: string | null = null;
  rejectForm!: FormGroup;
  medicalRequests: MedicalRequestView[] = [];
  showRejectModal = false;
  showReasonModal = false;
  showReasonModalinfo = false;
  showSickLeavePrintModal = false;
  currentReason: string | null = null;
  currentRequestId: string | null = null;
  approvedBy: string | null = null;
  userRole: 'employee' | 'supervisor' = 'employee';
  selectedEmployeeCode: string | null = null;

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
    this.loadMedicalRequests(environment.username);
  }

  initializeForms(): void {
    this.rejectForm = this.fb.group({
      comments: ['', Validators.required]
    });
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.approvedBy = employee.user_ID ?? null;
          this.userRole = employee.isSupervisor ? 'supervisor' : 'employee';
          if (this.userRole !== 'supervisor') {
            // alert('Access denied: Supervisor role required.');
          }
        } else {
          console.warn('No employee data found');
        }
      },
      error => {
        console.error('Error fetching employee data:', error);
        // alert('Error loading user data. Please try again.');
      }
    );
  }

  // loadMedicalRequests(): void {
  //   this.medicalService.getAllMedicalRequests().subscribe(
  //     (requests: MedicalRequestView[]) => {
  //       this.medicalRequests = requests;
  //     },
  //     error => {
  //       console.error('Error loading medical requests:', error);
  //       // alert('Error loading medical requests. Please try again.');
  //     }
  //   );
  // }

  loadMedicalRequests(payrolId: string): void {
    this.medicalService.getAllMedicalRequestsTeamleader(payrolId).subscribe(
      (requests: MedicalRequestView[]) => {
        this.medicalRequests = requests;
      },
      error => {
        console.error('Error loading medical requests:', error);
      }
    );
  }

  updateRequestStatus(id: number, status: string): void {
    if (status === 'Rejected') {
      this.currentRequestId = id.toString();
      this.showRejectModal = true;
      return;
    }

    const approval: ApprovalRequest = {
      approvedBy: this.approvedBy || '',
      status: status,
      comments: status === 'Approved' ? 'Approved by supervisor' : undefined
    };

    this.medicalService.approveMedicalRequest(id, approval).subscribe(
      () => {
        this.loadMedicalRequests(environment.username);
        // alert(`Request ${status.toLowerCase()} successfully!`);
      },
      error => {
        // alert('Error updating request status. Please try again.');
      }
    );
  }

  openRejectModal(id: number): void {
    this.currentRequestId = id.toString();
    this.showRejectModal = true;
  }

  submitRejection(): void {
    if (this.rejectForm.valid && this.currentRequestId) {
      const approval: ApprovalRequest = {
        approvedBy: this.approvedBy || '',
        status: 'Rejected',
        comments: this.rejectForm.value.comments
      };

      this.medicalService.approveMedicalRequest(parseInt(this.currentRequestId), approval).subscribe(
        () => {
          this.closeRejectModal();
          this.loadMedicalRequests(environment.username);
          // alert('Request rejected successfully!');
        },
        error => {
          // alert('Error rejecting request. Please try again.');
        }
      );
    }
  }

  openReasonModal(employeeCode: string): void {
    console.log('Openin modalwithEmployeeCode:', employeeCode);
    this.currentEmployeeCode = employeeCode;
    this.showReasonModal = true;
  }
  openReasonModalinfo(reason: string): void {
    console.log('Openin modalwithEmployeeCode:', reason);
    this.currentReason = reason;
    this.showReasonModalinfo = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectForm.reset();
    this.currentRequestId = null;
  }

  closeReasonModal(): void {
    this.showReasonModal = false;
    this.currentEmployeeCode = null;
  }
  closeReasonModalinfo(): void {
    this.showReasonModalinfo = false;
    this.currentReason = null;
  }
  openSickLeavePrintModal(employeeCode: string): void {
    this.selectedEmployeeCode = employeeCode;
    this.showSickLeavePrintModal = true;
  }

  onCloseSickLeavePrintModal(): void {
    this.showSickLeavePrintModal = false;
    this.selectedEmployeeCode = null;
  }
}