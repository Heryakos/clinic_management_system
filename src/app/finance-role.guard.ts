import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MedicalService } from '../app/medical.service';
import { firstValueFrom } from 'rxjs';
import { timeout, filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FinanceRoleGuard implements CanActivate {
  constructor(
    private medicalService: MedicalService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const roleIds = await firstValueFrom(
        this.medicalService.userRoleIds$.pipe(
          filter(r => r.length > 0),
          timeout(10000)
        )
      );
  
      const hasRole = roleIds
        .map(r => r.toLowerCase())
        .includes('c3e03aea-c104-498b-814d-2242a355ee6d');
  
      if (!hasRole) {
        this.router.navigate(['/access-denied']);
        return false;
      }
  
      return true;
    } catch {
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
  
}
