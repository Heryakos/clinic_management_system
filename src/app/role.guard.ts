import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MedicalService } from '../app/medical.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private medicalService: MedicalService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const page = route.routeConfig?.path;
  
    // Public pages
    if (!page || page === 'clinic_request' || page === 'reimbursement-document-upload') {
      return true;
    }
  
    const pageRoles: { [key: string]: string | string[] } = {
      dashboard: '5b574f73-d45d-416d-a029-67f9fc0de049',
      'supervisor-medical-requests': ['96c1ab25-d15c-42cf-92ff-9f041ae6ae10', '46dc8001-85ca-4e4f-921b-91d145f607a8'],
      'supervisor-dashboard': ['96c1ab25-d15c-42cf-92ff-9f041ae6ae10', '46dc8001-85ca-4e4f-921b-91d145f607a8'],
      doctor: ['05cdc20a-24c4-4ead-aaa5-b913b7d5c1e7', '6d4c480b-c372-410c-9dca-f635b6d4fe55', 'f694f00d-676e-4d9f-a0a3-845edd449b33'],
      laboratory: '2c27c2f5-f0af-4e88-8e93-d09bcbc77731',
      pharmacy: 'd14cdfed-4011-4086-b9c6-3ac6da444ff8'
    };
  
    const requiredRole = pageRoles[page];
    if (!requiredRole) return true;
  
    const roleIds = await firstValueFrom(this.medicalService.userRoleIds$);
  
    const hasAccess = Array.isArray(requiredRole)
      ? requiredRole.some(r => roleIds.includes(r.toLowerCase()))
      : roleIds.includes(requiredRole.toLowerCase());
  
    if (!hasAccess) {
      this.router.navigate(['/clinic_request']);
      return false;
    }
  
    return true;
  }
  
}