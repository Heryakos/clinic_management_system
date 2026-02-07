import { Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ASSETS } from './assets.config';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private subs: Subscription[] = [];
  logoPath = ASSETS.LOGO;
  title = 'FHC_CHMS';
  employeeName: string | null = null;
  showSidebar = false;
  hideHeader = false;
  userRoleIds: string[] = [];


  // Current page for dynamic component loading
  currentPage: string = 'medical-request';

  // Role IDs from aspnet_Roles table
  roles = {
    doctorOPD1: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7',
    doctorOPD2: '6d4c480b-c372-410c-9dca-f635b6d4fe55',
    doctorOPD3: 'f694f00d-676e-4d9f-a0a3-845edd449b33',
    laboratory: '2c27c2f5-f0af-4e88-8e93-d09bcbc77731',
    pharmacy: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
    injection: '095e17ff-4497-4fa0-8be9-74dc4979de58',
    supervisor: '96c1ab25-d15c-42cf-92ff-9f041ae6ae10',
    supervisorDashboard: '46dc8001-85ca-4e4f-921b-91d145f607a8',
    patient_card: 'cc1afad4-4cd7-435a-b100-fc6b62f264d1',
    report: 'ef06de41-276b-496f-b966-16849fe629f5',
    dashboard: '5b574f73-d45d-416d-a029-67f9fc0de049',
    inventory: 'e0e5db04-7418-4cfb-8786-a72f70ccc557',
    inventory_extended: 'e0e5db04-7418-4cfb-8786-a72f70ccc557',
    notifications: '46dc8001-85ca-4e4f-921b-91d145f607a8',
    financeApproval: 'c3e03aea-c104-498b-814d-2242a355ee6d', 
    cashierPayment: '6a18779a-2439-4f37-8b5b-b77480f1d6b0',
    clinicHistoryReports: '25892724-a484-4a65-bf2b-45700a87b7c8',
    Clinic_Controller: '7b2ba40e-8582-49a4-b731-fc79c7bc86b7',
  };

  // Boolean flags for menu item visibility
  showDashboard = false;
  showEmployeeRegistered = false;
  showSupervisor = false;
  showcliniccontroller = false;
  showSupervisorDashboard = false;
  showMedicalRequests = true;
  showPatientCards = false;
  showDoctorRegistration = false;
  showLaboratory = false;
  showPharmacy = false;
  showExpenses = false;
  showInventory = false;
  showInventoryRequest = false;
  showInventoryManagement = false;
  showItemReceiving = false;
  showSupervisorInventory = false;
  showReports = false;
  showInjection = false;
  showPatientAssignment = false;
  showSickLeave = false;
  showNotifications = false;
  showFinanceApproval = false;
  showCashierPayment = false;
  showClinicHistoryReports = false;

  private evaluateHeaderVisibility() {
    const hideHeaderRoutes = [
      '/clinic_request',
      '/supervisor-medical-requests',
      '/reimbursement-document-upload',
      '/clinic-history',
      '/finance-approval',
      '/cashier-payment'
    ];
  
    const url = this.router.url;
    const isTargetRoute = hideHeaderRoutes.some(r => url.endsWith(r));
  
    const clinicOnlyRoleIds = [
      this.roles.doctorOPD1,
      this.roles.doctorOPD2,
      this.roles.doctorOPD3,
      this.roles.supervisor,
      this.roles.Clinic_Controller
    ].map(r => r.toLowerCase());
  
    const hasClinicRole =
    this.userRoleIds.length === 0 ||
      this.userRoleIds.some(roleId => clinicOnlyRoleIds.includes(roleId));
  
    this.hideHeader = isTargetRoute && hasClinicRole;
  
    console.log('hideHeaderRoutes', hideHeaderRoutes);
    console.log('clinicOnlyRoleIds', clinicOnlyRoleIds);
    console.log('hasClinicRole', hasClinicRole);
    console.log('hideHeader', this.hideHeader);
  }
  


  constructor(
    private medicalService: MedicalService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      await this.fetchEmployeeName();
      await this.fetchUserRoles();
      console.log('Roles after initial fetch in AppComponent:', this.userRoleIds);
    } catch (err) {
      console.error('Initial load failed:', err);
    }
    // Listen for query parameter changes
    this.route.queryParams.subscribe(params => {
      this.currentPage = params['page'] || 'medical-request';
      console.log('Current page:', this.currentPage);
    });
    this.medicalService.userRoleIds$.subscribe(roleIds => {
      this.userRoleIds = roleIds;
      console.log('Updated userRoleIds:', this.userRoleIds);
      this.evaluateHeaderVisibility();
    });
    
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.evaluateHeaderVisibility();
      });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  // Navigate to different pages using query parameters
  navigateTo(page: string) {
    this.router.navigate([], {
      queryParams: { page: page },
      queryParamsHandling: 'merge'
    });
  }

  fetchEmployeeName() {
    const username = environment.username;
    if (!username) {
      console.log('Empty username: Cannot fetch employee name');
      this.employeeName = null;
      return;
    }

    this.medicalService.getEmployeeById(username).subscribe(
      (employee: any) => {
        console.log('Employee Response:', employee);
        if (employee && employee['c_Employees'] && employee['c_Employees'][0]?.en_name) {
          this.employeeName = employee['c_Employees'][0].en_name;
          console.log('Employee Name:', this.employeeName);
        } else {
          console.log('No employee name found in response');
          this.employeeName = null;
        }
      },
      (error) => {
        console.error('Error fetching employee name:', error);
        this.employeeName = null;
      }
    );
  }

  async fetchUserRoles(): Promise<void> {
    const username = environment.username;
  
    if (!username) {
      this.medicalService.setUserRoleIds([]);
      this.setDefaultMenuVisibility();
      return;
    }
  
    try {
      const response = await firstValueFrom(
        this.medicalService.getUserRoleByUsername(username)
      );
  
      console.log('Raw roles from server (awaited):', response);
  
      let roleIds: string[] = [];
  
      if (Array.isArray(response)) {
        roleIds = response
          .filter(r => r?.roleId)
          .map(r => String(r.roleId).trim().toLowerCase());
      } else if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          if (Array.isArray(parsed)) {
            roleIds = parsed
              .filter(r => r?.roleId)
              .map(r => String(r.roleId).trim().toLowerCase());
          } else if (parsed?.roleId) {
            roleIds = [String(parsed.roleId).trim().toLowerCase()];
          }
        } catch {
          roleIds = [];
        }
      } else if (response?.roleId) {
        roleIds = [String(response.roleId).trim().toLowerCase()];
      }
  
      console.log('Parsed & normalized roleIds:', roleIds);
  
      // Set roles in service (this emits to userRoleIds$)
      this.medicalService.setUserRoleIds(roleIds);
  
      // Update local state & sidebar
      this.setMenuVisibilityBasedOnRole(roleIds);
  
    } catch (error) {
      console.error('Role fetch failed:', error);
      this.medicalService.setUserRoleIds([]);
      this.setDefaultMenuVisibility();
    }
  }
  private setDefaultMenuVisibility() {
    this.showSidebar = false;
    this.showDashboard = false;
    this.showEmployeeRegistered = false;
    this.showSupervisor = false;
    this.showcliniccontroller = false;
    this.showSupervisorDashboard = false;
    this.showMedicalRequests = true;
    this.showPatientCards = false;
    this.showDoctorRegistration = false;
    this.showLaboratory = false;
    this.showPharmacy = false;
    this.showExpenses = false;
    this.showInventory = false;
    this.showInventoryRequest = false;
    this.showInventoryManagement = false;
    this.showItemReceiving = false;
    this.showSupervisorInventory = false;
    this.showReports = false;
    this.showInjection = false;
    this.showPatientAssignment = false;
    this.showSickLeave = false;
    this.showNotifications = false;
    this.showFinanceApproval = false;
    this.showCashierPayment = false;
    console.log('Default menu visibility set: Sidebar hidden, only Medical Requests route accessible');
  }

  private setMenuVisibilityBasedOnRole(roleIds: string[] | undefined) {
    // Reset ALL flags to false first
    this.showSidebar = false;
    this.showDashboard = false;
    this.showEmployeeRegistered = false;
    this.showSupervisor = false;
    this.showcliniccontroller = false;
    this.showSupervisorDashboard = false;
    this.showMedicalRequests = false;
    this.showPatientCards = false;
    this.showDoctorRegistration = false;
    this.showLaboratory = false;
    this.showPharmacy = false;
    this.showExpenses = false;
    this.showInventory = false;
    this.showInventoryRequest = false;
    this.showInventoryManagement = false;
    this.showItemReceiving = false;
    this.showSupervisorInventory = false;
    this.showReports = false;
    this.showInjection = false;
    this.showPatientAssignment = false;
    this.showSickLeave = false;
    this.showNotifications = false;
    this.showFinanceApproval = false;
    this.showCashierPayment = false;
    this.showClinicHistoryReports = false;
  
    if (!roleIds || roleIds.length === 0) {
      console.log('No roles → only public clinic_request allowed');
      return;
    }
  
    const normalized = roleIds.map(id => String(id).trim().toLowerCase());
  
    // ── Strict isolation for finance & cashier ───────────────────────────────
    const isFinance = normalized.includes(this.roles.financeApproval.toLowerCase());
    const isCashier = normalized.includes(this.roles.cashierPayment.toLowerCase());
  
    if (isFinance || isCashier) {
      this.showSidebar = true;
  
      if (isFinance) {
        this.showFinanceApproval = true;
      }
      if (isCashier) {
        this.showCashierPayment = true;
      }
  
      // IMPORTANT: do NOT set any other flags for these users
      console.log('Finance/Cashier user detected → restricted view', {
        showFinanceApproval: this.showFinanceApproval,
        showCashierPayment: this.showCashierPayment
      });
      return; // ← STOP HERE — no clinic items
    }
  
    // ── Normal clinic / other roles ──────────────────────────────────────────
    this.showSidebar = true;
    this.showMedicalRequests = true; // default for most clinic users
  
    normalized.forEach(roleId => {
      // Keep all your existing clinic logic here
      if (roleId === this.roles.clinicHistoryReports.toLowerCase()) {
        this.showClinicHistoryReports = true;
      }
      if (roleId === this.roles.dashboard.toLowerCase()) {
        this.showDashboard = true;
        this.showEmployeeRegistered = true;
      }
      if (roleId === this.roles.supervisor.toLowerCase()) {
        this.showSupervisor = true;
        this.showcliniccontroller = true;
      }
      if (roleId === this.roles.supervisorDashboard.toLowerCase()) {
        this.showExpenses = true;
        this.showSupervisorDashboard = true;
      }
      if (roleId === this.roles.patient_card.toLowerCase()) {
        this.showPatientCards = true;
      }
      if (
        roleId === this.roles.doctorOPD1.toLowerCase() ||
        roleId === this.roles.doctorOPD2.toLowerCase() ||
        roleId === this.roles.doctorOPD3.toLowerCase()
      ) {
        this.showDoctorRegistration = true;
        this.showInventoryRequest = true;
      }
      if (roleId === this.roles.laboratory.toLowerCase()) {
        this.showLaboratory = true;
        this.showInventoryRequest = true;
      }
      if (roleId === this.roles.pharmacy.toLowerCase()) {
        this.showPharmacy = true;
        this.showInventoryRequest = true;
      }
      if (roleId === this.roles.inventory.toLowerCase()) {
        this.showInventory = true;
      }
      if (roleId === this.roles.inventory_extended.toLowerCase()) {
        this.showInventoryRequest = true;
        this.showInventoryManagement = true;
        this.showItemReceiving = true;
        this.showSupervisorInventory = true;
      }
      if (roleId === this.roles.report.toLowerCase()) {
        this.showReports = true;
      }
      if (roleId === this.roles.injection.toLowerCase()) {
        this.showInjection = true;
      }
      if (roleId === this.roles.notifications.toLowerCase()) {
        this.showNotifications = true;
      }
      if (
        roleId === this.roles.supervisor.toLowerCase() ||
        roleId === this.roles.Clinic_Controller.toLowerCase() ||
        roleId === this.roles.dashboard.toLowerCase() ||
        roleId === this.roles.report.toLowerCase() ||
        roleId === this.roles.supervisorDashboard.toLowerCase() ||
        roleId === this.roles.clinicHistoryReports.toLowerCase()
      ) {
        this.showcliniccontroller = true;
      }
    });
  
    console.log('Normal clinic menu visibility applied');
  }
}