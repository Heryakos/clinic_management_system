import { Component, OnInit } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { ASSETS } from './assets.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  logoPath = ASSETS.LOGO;
  title = 'FHC_CHMS';
  employeeName: string | null = null;
  showSidebar = true;

  // Role IDs from aspnet_Roles table
  roles = {
    doctor: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7',
    laboratory: '2c27c2f5-f0af-4e88-8e93-d09bcbc77731',
    pharmacy: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
    injection: '095e17ff-4497-4fa0-8be9-74dc4979de58',
    patient: '27aaf22f-40c3-444f-a17a-364b8b2abafc',
    supervisor: '46dc8001-85ca-4e4f-921b-91d145f607a8',
    supervisorDashboard: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
    patient_card: 'cc1afad4-4cd7-435a-b100-fc6b62f264d1',
    report: 'ef06de41-276b-496f-b966-16849fe629f5',
    dashboard: '5b574f73-d45d-416d-a029-67f9fc0de049',
    inventory: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
    inventory_extended: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
    notifications: '05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7',
  };

  // Boolean flags for menu item visibility
  showDashboard = false;
  showEmployeeRegistered = false;
  showSupervisor = false;
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

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    this.fetchEmployeeName();
    this.fetchUserRoles();
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

  fetchUserRoles() {
    const username = environment.username;
    if (!username) {
      console.log('Empty username: Hiding sidebar, only Medical Requests route accessible');
      this.setDefaultMenuVisibility();
      this.medicalService.setUserRoleIds([]);
      return;
    }

    this.medicalService.getUserRoleByUsername(username).subscribe(
      (response: any) => {
        console.log('Raw User Role Response:', response);
        let roleIds: string[] = [];

        if (Array.isArray(response)) {
          roleIds = response
            .filter((item: any) => item && item.roleId)
            .map((item: any) => item.roleId.toLowerCase());
          console.log('Extracted roleIds from array:', roleIds);
        } else if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              roleIds = parsed
                .filter((item: any) => item && item.roleId)
                .map((item: any) => item.roleId.toLowerCase());
              console.log('Parsed roleIds from string array:', roleIds);
            } else if (parsed && parsed.roleId) {
              roleIds = [parsed.roleId.toLowerCase()];
              console.log('Parsed single roleId from string:', roleIds);
            }
          } catch (e) {
            console.error('Error parsing response string:', e);
          }
        } else if (response && response.roleId) {
          roleIds = [response.roleId.toLowerCase()];
          console.log('Single roleId from response.roleId:', roleIds);
        }

        console.log('Final Extracted roleIds:', roleIds);
        this.medicalService.setUserRoleIds(roleIds);
        this.setMenuVisibilityBasedOnRole(roleIds.length > 0 ? roleIds : undefined);
      },
      (error) => {
        console.error('Error fetching user roles:', error);
        this.medicalService.setUserRoleIds([]);
        this.setDefaultMenuVisibility();
      }
    );
  }

  private setDefaultMenuVisibility() {
    this.showSidebar = false;
    this.showDashboard = false;
    this.showEmployeeRegistered = false;
    this.showSupervisor = false;
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
    // showSickLeave = false;
    this.showNotifications = false;
    console.log('Default menu visibility set: Sidebar hidden, only Medical Requests route accessible');
  }

  private setMenuVisibilityBasedOnRole(roleIds: string[] | undefined) {
    this.showSidebar = true;
    this.showDashboard = false;
    this.showEmployeeRegistered = false;
    this.showSupervisor = false;
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

    if (!roleIds || roleIds.length === 0) {
      this.showSidebar = false;
      console.log('No roles: Sidebar hidden, only Medical Requests route accessible');
      return;
    }

    const normalizedRoleIds = roleIds.map((id) => String(id).replace(/\s/g, '').toLowerCase());

    normalizedRoleIds.forEach((roleId) => {
      if (roleId === this.roles.dashboard) {
        this.showDashboard = true;
        this.showEmployeeRegistered = true;
        this.showExpenses = true;
      }
      if (roleId === this.roles.supervisor) {
        this.showSupervisor = true;
      }
      if (roleId === this.roles.supervisorDashboard) {
        this.showSupervisorDashboard = true;
      }
      if (roleId === this.roles.patient_card) {
        this.showPatientCards = true;
      }
      if (roleId === this.roles.doctor) {
        this.showDoctorRegistration = true;
      }
      if (roleId === this.roles.laboratory) {
        this.showLaboratory = true;
      }
      if (roleId === this.roles.pharmacy) {
        this.showPharmacy = true;
      }
      if (roleId === this.roles.inventory) {
        this.showInventory = true;
      }
      if (roleId === this.roles.inventory_extended) {
        this.showInventoryRequest = true;
        this.showInventoryManagement = true;
        this.showItemReceiving = true;
        this.showSupervisorInventory = true;
      }
      if (roleId === this.roles.report) {
        this.showReports = true;
      }
      if (roleId === this.roles.injection) {
        this.showInjection = true;
      }
      if (roleId === this.roles.patient) {
        this.showPatientAssignment = true;
      }
      if (roleId === this.roles.notifications) {
        this.showNotifications = true;
      }
    });

    console.log('Menu Visibility:', {
      showSidebar: this.showSidebar,
      showDashboard: this.showDashboard,
      showEmployeeRegistered: this.showEmployeeRegistered,
      showSupervisor: this.showSupervisor,
      showSupervisorDashboard: this.showSupervisorDashboard,
      showMedicalRequests: this.showMedicalRequests,
      showPatientCards: this.showPatientCards,
      showDoctorRegistration: this.showDoctorRegistration,
      showLaboratory: this.showLaboratory,
      showPharmacy: this.showPharmacy,
      showExpenses: this.showExpenses,
      showInventory: this.showInventory,
      showInventoryRequest: this.showInventoryRequest,
      showInventoryManagement: this.showInventoryManagement,
      showItemReceiving: this.showItemReceiving,
      showSupervisorInventory: this.showSupervisorInventory,
      showReports: this.showReports,
      showInjection: this.showInjection,
      showPatientAssignment: this.showPatientAssignment,
      showSickLeave: this.showSickLeave,
      showNotifications: this.showNotifications,
    });
  }
}