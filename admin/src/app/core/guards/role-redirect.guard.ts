import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class RoleRedirectGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      // Current user авах
      const currentUser = firebase.auth().currentUser;
      
      if (!currentUser) {
        return true; // User байхгүй бол default route-д үлдээнэ
      }

      // Admin мэдээлэл авах
      const adminDoc = await firebase.firestore()
        .collection('admins')
        .doc(currentUser.uid)
        .get();

      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        const adminRole = adminData?.role;

        console.log('RoleRedirectGuard - Admin role:', adminRole);
        console.log('RoleRedirectGuard - Current path:', state.url);

        // Manager эрхтэй бол users component-руу чиглүүлэх
        if (adminRole === 'manager') {
          // Хэрэв одоогийн path нь root эсвэл dashboard бол users-руу redirect
          if (state.url === '/' || state.url === '/dashboard' || state.url === '') {
            console.log('Redirecting manager to users');
            this.router.navigate(['/users']);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('RoleRedirectGuard error:', error);
      return true; // Алдаа гарвал default route-д үлдээнэ
    }
  }
}