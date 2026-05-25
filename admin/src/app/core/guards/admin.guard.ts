import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.authService.currentUser();
    
    if (currentUser && this.authService.hasAnyRole(['admin', 'manager', 'accountant'])) {
      return true;
    }

    // Not logged in or not an admin, redirect to login
    this.router.navigate(['/auth/login']);
    return false;
  }
}
