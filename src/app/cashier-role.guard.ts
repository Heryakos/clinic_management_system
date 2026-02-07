import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MedicalService } from '../app/medical.service';
import { firstValueFrom } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CashierRoleGuard implements CanActivate {
  constructor(
    private medicalService: MedicalService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const roleIds = await firstValueFrom(
        this.medicalService.userRoleIds$.pipe(
          filter(r => Array.isArray(r) && r.length > 0), // 🔑 wait for roles
          timeout(10000)
        )
      );

      const normalized = roleIds.map(id => id.toLowerCase().trim());
      const cashierRoleId = '6a18779a-2439-4f37-8b5b-b77480f1d6b0';

      const hasCashierRole = normalized.includes(cashierRoleId);

      if (!hasCashierRole) {
        this.router.navigate(['/access-denied']); // ✅ correct UX
        return false;
      }

      return true;
    } catch (err) {
      console.error('[CashierRoleGuard] Timeout / error:', err);
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}
