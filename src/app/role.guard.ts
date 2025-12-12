import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MedicalService } from '../app/medical.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private medicalService: MedicalService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    // Get page from query parameters
    const page = route.queryParams['page'];
    
    // Public pages - no role required
    if (!page || page === 'clinic_request' || page === 'reimbursement-document-upload') {
      return true;
    }

    // Define required roles for each page
    const pageRoles: { [key: string]: string | string[] } = {
      'dashboard': '5b574f73-d45d-416d-a029-67f9fc0de049',
      'supervisor-medical-requests': ['96c1ab25-d15c-42cf-92ff-9f041ae6ae10', '46dc8001-85ca-4e4f-921b-91d145f607a8'],
      'supervisor-dashboard': ['96c1ab25-d15c-42cf-92ff-9f041ae6ae10', '46dc8001-85ca-4e4f-921b-91d145f607a8'],
      'patient-history-card': 'cc1afad4-4cd7-435a-b100-fc6b62f264d1',
      'patient-assignment': 'cc1afad4-4cd7-435a-b100-fc6b62f264d1',
      'doctor': ['05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7', '91f72e71-8392-4fee-9398-5155d6581559', 'f694f00d-676e-4d9f-a0a3-845edd449b33'],
      'laboratory': '2c27c2f5-f0af-4e88-8e93-d09bcbc77731',
      'pharmacy': 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
      'injection': '095e17ff-4497-4fa0-8be9-74dc4979de58',
      'expense-reimbursement': ['96c1ab25-d15c-42cf-92ff-9f041ae6ae10', '46dc8001-85ca-4e4f-921b-91d145f607a8'],
      'inventory': 'e0e5db04-7418-4cfb-8786-a72f70ccc557',
      'inventory-request': ['05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7', '91f72e71-8392-4fee-9398-5155d6581559', 'f694f00d-676e-4d9f-a0a3-845edd449b33', '2c27c2f5-f0af-4e88-8e93-d09bcbc77731', 'd14cdfed-4011-4086-b9c6-3ac6da444ff8', '095e17ff-4497-4fa0-8be9-74dc4979de58'],
      'inventory-management': 'e0e5db04-7418-4cfb-8786-a72f70ccc557',
      'item-receiving': 'd14cdfed-4011-4086-b9c6-3ac6da444ff8',
      'supervisor-inventory': 'e0e5db04-7418-4cfb-8786-a72f70ccc557',
      'reports': 'ef06de41-276b-496f-b966-16849fe629f5',
      'notifications': '46dc8001-85ca-4e4f-921b-91d145f607a8',
      'users': '5b574f73-d45d-416d-a029-67f9fc0de049'
    };

    const requiredRole = pageRoles[page];
    if (!requiredRole) {
      return true; // No role required for this page
    }

    try {
      const roleIds = await firstValueFrom(this.medicalService.userRoleIds$);
      console.log(`RoleGuard: Checking access for ${page}, userRoleIds: ${roleIds}`);
      
      let hasAccess = false;
      if (Array.isArray(requiredRole)) {
        hasAccess = requiredRole.some(role => roleIds.includes(role.toLowerCase()));
      } else {
        hasAccess = roleIds.includes(requiredRole.toLowerCase());
      }

      if (hasAccess) {
        return true;
      }
      
      console.log(`Unauthorized access to ${page}, redirecting to clinic-request`);
      this.router.navigate(['/fhcerp/en-us'], { queryParams: { page: 'clinic_request' } });
      return false;
    } catch (error) {
      console.error('RoleGuard: Error fetching roleIds', error);
      this.router.navigate(['/fhcerp/en-us'], { queryParams: { page: 'clinic_request' } });
      return false;
    }
  }
}