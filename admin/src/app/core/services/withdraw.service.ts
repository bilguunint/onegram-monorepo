import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export interface VerifyWithdrawRequest {
  verificationCode: string;
  withdrawId: string;
  withdrawType?: string;
}

export interface VerifyWithdrawResponse {
  status: string;
  metal_id: number;
  quantity: number;
  user_id: string;
  performed_by: string;
}

export interface WithdrawErrorResponse {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class WithdrawService {
  private apiUrl = 'https://verifywithdraw-yuv3eg5qha-uc.a.run.app';

  constructor(private http: HttpClient) {}

  /**
   * Verify a withdraw request
   * @param request - The verification request containing code and withdraw ID
   * @returns Observable with verification response
   */
  async verifyWithdraw(request: VerifyWithdrawRequest): Promise<Observable<VerifyWithdrawResponse>> {
    const token = await this.getAuthToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<VerifyWithdrawResponse>(this.apiUrl, request, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get Firebase current user authentication token
   * @returns Promise<string> Firebase ID token
   */
  private async getAuthToken(): Promise<string> {
    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('Хэрэглэгч нэвтрээгүй байна');
      }
      
      const token = await currentUser.getIdToken();
      return token;
    } catch (error) {
      console.error('Firebase auth token авахад алдаа:', error);
      throw new Error('Authentication token авахад алдаа гарлаа');
    }
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Алдаа гарлаа';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific error cases
    if (error.status === 401) {
      errorMessage = 'Нэвтрэх эрх хангалтгүй';
    } else if (error.status === 403) {
      errorMessage = 'Хандах эрх хангалтгүй - Админ эрх шаардлагатай';
    } else if (error.status === 404) {
      errorMessage = 'Биетээр авах хүсэлт олдсонгүй';
    } else if (error.status === 400) {
      errorMessage = 'Баталгаажуулах код буруу эсвэл хүчингүй';
    } else if (error.status === 0) {
      errorMessage = 'Сүлжээний алдаа - Интернет холболтоо шалгана уу';
    }

    console.error('WithdrawService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}