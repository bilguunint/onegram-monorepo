import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { AuthenticationService } from './auth.service';
import { getFirebaseBackend } from '../../authUtils';
import firebase from 'firebase/compat/app';

export interface InvestmentRequest {
  userId: string;
  quantity: number;
  endDate: string; // ISO date string
}

export interface InvestmentResponse {
  status: 'success' | 'failed';
  msg: string;
  data?: {
    userId: string;
    investmentAmount: number;
    previousGoldBalance: number;
    newGoldBalance: number;
    endDate: string;
    verifiedBy: string;
  };
}

export interface CloseInvestmentRequest {
  investmentId: string;
  attachFile: string;
  closeDate: string; // ISO date string with timezone
}

export interface CloseInvestmentResponse {
  success?: boolean;
  message?: string;
  investmentId?: string;
  closedBalance?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private readonly INVESTMENT_ENDPOINT = 'https://makeinvest-yuv3eg5qha-uc.a.run.app';
  private readonly CLOSE_INVESTMENT_ENDPOINT = 'https://us-central1-grammgold.cloudfunctions.net/closeInvestment';

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  /**
   * Creates or updates user investment by transferring gold from user's balance to investment account
   * Only admins can execute this operation
   * 
   * @param investmentData - Investment details including userId, quantity, and endDate
   * @returns Observable<InvestmentResponse>
   */
  makeInvestment(investmentData: InvestmentRequest): Observable<InvestmentResponse> {
    return from(new Promise<InvestmentResponse>((resolve, reject) => {
      // Get current Firebase user
      const currentUser = firebase.auth().currentUser;
      
      if (!currentUser) {
        reject({
          status: 'failed',
          msg: 'Authentication required. Please login as admin.'
        });
        return;
      }

      // Validate request data
      if (!this.validateInvestmentRequest(investmentData)) {
        reject({
          status: 'failed',
          msg: 'Invalid investment data. Please check userId, quantity, and endDate.'
        });
        return;
      }

      // Get Firebase ID token for authentication
      currentUser.getIdToken(true).then((token) => {
        // Prepare headers
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });

        // Make HTTP request to Cloud Function
        this.http.post<InvestmentResponse>(this.INVESTMENT_ENDPOINT, investmentData, { headers })
          .subscribe({
            next: (response) => {
              console.log('Investment created successfully:', response);
              resolve(response);
            },
            error: (error) => {
              console.error('Investment creation failed:', error);
              
              // Handle different error scenarios
              let errorMessage = 'Investment creation failed';
              
              if (error.status === 401) {
                errorMessage = 'Unauthorized. Admin access required.';
              } else if (error.status === 400) {
                errorMessage = error.error?.msg || 'Invalid request data';
              } else if (error.status === 403) {
                errorMessage = 'Forbidden. Insufficient permissions.';
              } else if (error.status === 404) {
                errorMessage = 'User not found';
              } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again later.';
              } else if (error.error?.msg) {
                errorMessage = error.error.msg;
              }

              reject({
                status: 'failed',
                msg: errorMessage
              });
            }
          });

      }).catch((tokenError) => {
        console.error('Failed to get authentication token:', tokenError);
        reject({
          status: 'failed',
          msg: 'Authentication failed. Please login again.'
        });
      });
    }));
  }

  /**
   * Validates investment request data
   * @param data - Investment request data to validate
   * @returns boolean - true if valid, false otherwise
   */
  private validateInvestmentRequest(data: InvestmentRequest): boolean {
    // Check if all required fields are present
    if (!data.userId || !data.quantity || !data.endDate) {
      return false;
    }

    // Validate userId (should be non-empty string)
    if (typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      return false;
    }

    // Validate quantity (should be positive number)
    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      return false;
    }

    // Validate endDate (should be valid ISO date string)
    if (typeof data.endDate !== 'string') {
      return false;
    }

    try {
      const date = new Date(data.endDate);
      if (isNaN(date.getTime())) {
        return false;
      }
      
      // Check if endDate is in the future
      if (date <= new Date()) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Converts a Date object to ISO string format for the API
   * @param date - Date object to convert
   * @returns string - ISO date string
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString();
  }

  /**
   * Creates investment request object with proper formatting
   * @param userId - Target user ID
   * @param quantity - Investment amount in gold
   * @param endDate - Investment end date
   * @returns InvestmentRequest - Formatted request object
   */
  createInvestmentRequest(userId: string, quantity: number, endDate: Date): InvestmentRequest {
    return {
      userId: userId.trim(),
      quantity: Number(quantity),
      endDate: this.formatDateForAPI(endDate)
    };
  }

  /**
   * Closes an investment by transferring the balance back to the user's account
   * Only admins can execute this operation
   * 
   * @param closeData - Close investment details including investmentId, attachFile, and closeDate
   * @returns Observable<CloseInvestmentResponse>
   */
  closeInvestment(closeData: CloseInvestmentRequest): Observable<CloseInvestmentResponse> {
    return from(new Promise<CloseInvestmentResponse>((resolve, reject) => {
      // Get current Firebase user
      const currentUser = firebase.auth().currentUser;
      
      if (!currentUser) {
        reject({
          success: false,
          error: 'Authentication required. Please login as admin.'
        });
        return;
      }

      // Validate request data
      if (!this.validateCloseInvestmentRequest(closeData)) {
        reject({
          success: false,
          error: 'Invalid close investment data. Please check investmentId, attachFile, and closeDate.'
        });
        return;
      }

      // Get Firebase ID token for authentication
      currentUser.getIdToken(true).then((token) => {
        // Prepare headers
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });

        // Make HTTP request to Cloud Function
        this.http.post<CloseInvestmentResponse>(this.CLOSE_INVESTMENT_ENDPOINT, closeData, { headers })
          .subscribe({
            next: (response) => {
              console.log('Investment closed successfully:', response);
              resolve(response);
            },
            error: (error) => {
              console.error('Investment close failed:', error);
              
              // Handle different error scenarios
              let errorMessage = 'Investment close failed';
              
              if (error.status === 401) {
                errorMessage = 'Unauthorized. Admin access required.';
              } else if (error.status === 400) {
                errorMessage = error.error?.error || error.error?.message || 'Invalid request data';
              } else if (error.status === 403) {
                errorMessage = 'Forbidden. Insufficient permissions.';
              } else if (error.status === 404) {
                errorMessage = error.error?.error || 'Investment олдсонгүй';
              } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again later.';
              } else if (error.error?.error) {
                errorMessage = error.error.error;
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              }

              reject({
                success: false,
                error: errorMessage
              });
            }
          });

      }).catch((tokenError) => {
        console.error('Failed to get authentication token:', tokenError);
        reject({
          success: false,
          error: 'Authentication failed. Please login again.'
        });
      });
    }));
  }

  /**
   * Validates close investment request data
   * @param data - Close investment request data to validate
   * @returns boolean - true if valid, false otherwise
   */
  private validateCloseInvestmentRequest(data: CloseInvestmentRequest): boolean {
    // Check if all required fields are present
    if (!data.investmentId || !data.attachFile || !data.closeDate) {
      return false;
    }

    // Validate investmentId (should be non-empty string)
    if (typeof data.investmentId !== 'string' || data.investmentId.trim().length === 0) {
      return false;
    }

    // Validate attachFile (should be non-empty string and valid URL)
    if (typeof data.attachFile !== 'string' || data.attachFile.trim().length === 0) {
      return false;
    }

    // Validate closeDate (should be valid ISO date string)
    if (typeof data.closeDate !== 'string') {
      return false;
    }

    try {
      const date = new Date(data.closeDate);
      if (isNaN(date.getTime())) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Creates close investment request object with proper formatting
   * @param investmentId - Investment ID to close
   * @param attachFile - URL of the attachment file
   * @param closeDate - Date to close the investment
   * @returns CloseInvestmentRequest - Formatted request object
   */
  createCloseInvestmentRequest(investmentId: string, attachFile: string, closeDate: Date): CloseInvestmentRequest {
    return {
      investmentId: investmentId.trim(),
      attachFile: attachFile.trim(),
      closeDate: closeDate.toISOString()
    };
  }
}
