import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomNotificationRequest {
  title: string;
  body: string;
  type?: string;
  userIds?: string[];
}

export interface CustomNotificationResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {
  private apiUrl = 'https://sendcustomnotification-yuv3eg5qha-uc.a.run.app';

  constructor(private http: HttpClient) {}

  sendNotification(data: CustomNotificationRequest): Observable<CustomNotificationResponse> {
    return this.http.post<CustomNotificationResponse>(this.apiUrl, data);
  }
}
