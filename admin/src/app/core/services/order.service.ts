import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private verifyOrderUrl = 'https://verifyorder-yuv3eg5qha-uc.a.run.app';

  constructor(private http: HttpClient) {}

  verifyOrder(user_id: string, order_id: string, token: string, is_extraOrder: boolean, description: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    const body = { 
      user_id, 
      order_id,
      is_extraOrder,
      description 
    };
    return this.http.post<any>(this.verifyOrderUrl, body, { headers }).pipe(
      catchError((error) => {
        // Always return error with .error property for SweetAlert
        return throwError(() => error.error || { error: 'Unknown error' });
      })
    );
  }
}
