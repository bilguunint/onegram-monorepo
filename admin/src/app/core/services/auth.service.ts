import { Injectable } from '@angular/core';

import { getFirebaseBackend } from '../../authUtils';
import { User } from 'src/app/store/Authentication/auth.models';
import { from, map, Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })

export class AuthenticationService {

    user: User;

    constructor() {
    }

    /**
     * Returns the current user
     */
    public currentUser(): User {
        return getFirebaseBackend().getAuthenticatedUser();
    }


    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(email: string, password: string): Observable<any> {
        return from(getFirebaseBackend().loginUser(email, password));
    }

    /**
     * Performs the register
     * @param email email
     * @param password password
     */
    register(user: User) {
        // return from(getFirebaseBackend().registerUser(user));

        return from(getFirebaseBackend().registerUser(user).then((response: any) => {
            const user = response;
            return user;
        }));
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend().forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

    /**
     * Logout the user
     */
    logout() {
        // logout the user
        getFirebaseBackend().logout();
    }

    /**
     * Get admin data
     */
    getAdminData() {
        return getFirebaseBackend().getAdminData();
    }

    /**
     * Check if current user has specific role
     */
    hasRole(role: string): boolean {
        return getFirebaseBackend().hasRole(role);
    }

    /**
     * Check if current user has any of the specified roles
     */
    hasAnyRole(roles: string[]): boolean {
        return getFirebaseBackend().hasAnyRole(roles);
    }

    /**
     * Check if current user is admin
     */
    isAdmin(): boolean {
        return this.hasRole('admin');
    }

    /**
     * Check if current user is manager
     */
    isManager(): boolean {
        return this.hasRole('manager');
    }

    /**
     * Check if current user is accountant
     */
    isAccountant(): boolean {
        return this.hasRole('accountant');
    }
}

