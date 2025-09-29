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
    const expectedRole = route.data['expectedRole'];
    if (!expectedRole) {
      return true; // No role required for the route
    }

    try {
      const roleIds = await firstValueFrom(this.medicalService.userRoleIds$);
      console.log(`RoleGuard: Checking access for ${state.url}, expectedRole: ${expectedRole}, userRoleIds: ${roleIds}`);
      if (roleIds.includes(expectedRole.toLowerCase())) {
        return true;
      }
      console.log(`Unauthorized access to ${state.url}, redirecting to /medical-request`);
      this.router.navigate(['/medical-request']);
      return false;
    } catch (error) {
      console.error('RoleGuard: Error fetching roleIds', error);
      this.router.navigate(['/medical-request']);
      return false;
    }
  }
}