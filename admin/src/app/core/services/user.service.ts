import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from 'src/app/store/Authentication/auth.models';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Observable } from 'rxjs';

// Reset PIN interfaces
export interface ResetPinRequest {
    userId: string;
}

export interface ResetPinResponse {
    status: 'success' | 'failed';
    msg: string;
    data?: {
        userId: string;
        userPhone: string;
        resetBy: string;
        resetByRole: string;
        resetAt: string;
    };
}

// SMS Campaign interfaces
export interface SmsCampaignRequest {
    name: string;
    isWithText: number;
    text: string;
    begin_date: string;
    begin_hour: string;
    begin_minute: string;
    numbers: string[];
}

export interface SmsCampaignResponse {
    status: 'success' | 'failed';
    msg: string;
    data?: any;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
    private resetPinUrl = 'https://resetpin-yuv3eg5qha-uc.a.run.app';
    private smsCampaignUrl = 'https://us-central1-grammgold.cloudfunctions.net/createSmsCampaign';

    constructor(private http: HttpClient) { }
    /***
     * Get All User
     */
    getAll() {
        return this.http.get<User[]>(`api/users`);
    }

    /***
     * Facked User Register
     */
    register(user: User) {
        return this.http.post(`/users/register`, user);
    }

    /**
     * Reset user PIN
     * @param userId - User ID to reset PIN for
     * @returns Observable with reset PIN response
     */
    async resetPin(userId: string): Promise<Observable<ResetPinResponse>> {
        try {
            // Get Firebase auth token
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const idToken = await user.getIdToken();
            
            // Set headers with authorization
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            });

            // Request body
            const body: ResetPinRequest = {
                userId: userId
            };

            return this.http.post<ResetPinResponse>(this.resetPinUrl, body, { headers });
        } catch (error) {
            console.error('Error getting auth token:', error);
            throw error;
        }
    }

    /**
     * Create SMS Campaign
     * @param campaignData - SMS campaign data
     * @returns Observable with SMS campaign response
     */
    createSmsCampaign(campaignData: SmsCampaignRequest): Observable<SmsCampaignResponse> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        return this.http.post<SmsCampaignResponse>(this.smsCampaignUrl, campaignData, { headers });
    }
}
