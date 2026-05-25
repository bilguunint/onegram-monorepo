import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerGuard implements CanActivate {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.hasAnyRole(['admin', 'manager'])) {
      return true;
    }

    // Not manager or admin, redirect to dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
