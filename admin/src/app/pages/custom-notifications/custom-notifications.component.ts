import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface CustomNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  targetType: string;
  targetUserIds: string[] | null;
  totalUsers: number;
  createdAt: any;
}

@Component({
  selector: 'app-custom-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './custom-notifications.component.html',
  styleUrls: ['./custom-notifications.component.css']
})
export class CustomNotificationsComponent implements OnInit {
  notifications: CustomNotification[] = [];
  isLoading = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    this.isLoading = true;
    try {
      const snapshot = await firebase.firestore()
        .collection('custom-notifications')
        .orderBy('createdAt', 'desc')
        .get();

      this.notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomNotification[];
    } catch (error) {
      console.error('Мэдэгдлүүд ачааллахад алдаа:', error);
    } finally {
      this.isLoading = false;
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '-';
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToSendNotification(): void {
    this.router.navigate(['/send-custom-notification']);
  }

}
