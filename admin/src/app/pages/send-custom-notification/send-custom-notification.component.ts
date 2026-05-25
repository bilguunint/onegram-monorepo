import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomNotificationService, CustomNotificationRequest } from 'src/app/core/services/custom-notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-send-custom-notification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './send-custom-notification.component.html',
  styleUrls: ['./send-custom-notification.component.css']
})
export class SendCustomNotificationComponent implements OnInit {
  notificationForm: FormGroup;
  userIdForm: FormGroup;
  submitted = false;
  isLoading = false;
  sendToAll = true;
  userIds: string[] = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: CustomNotificationService
  ) {
    this.notificationForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      type: ['custom']
    });

    this.userIdForm = this.fb.group({
      userId: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  get form() {
    return this.notificationForm.controls;
  }

  toggleSendTo(all: boolean): void {
    this.sendToAll = all;
    if (all) {
      this.userIds = [];
    }
  }

  addUserId(): void {
    const userId = this.userIdForm.value.userId?.trim();
    if (!userId) return;

    if (this.userIds.includes(userId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Анхаар',
        text: 'Энэ хэрэглэгчийн ID аль хэдийн нэмэгдсэн байна'
      });
      return;
    }

    this.userIds.push(userId);
    this.userIdForm.reset();
  }

  removeUserId(id: string): void {
    this.userIds = this.userIds.filter(uid => uid !== id);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.notificationForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Алдаа',
        text: 'Бүх шаардлагатай талбаруудыг бөглөнө үү'
      });
      return;
    }

    if (!this.sendToAll && this.userIds.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Алдаа',
        text: 'Хамгийн багадаа 1 хэрэглэгчийн ID нэмнэ үү'
      });
      return;
    }

    const data: CustomNotificationRequest = {
      title: this.form.title.value,
      body: this.form.body.value,
      type: this.form.type.value || 'custom'
    };

    if (!this.sendToAll && this.userIds.length > 0) {
      data.userIds = this.userIds;
    }

    this.isLoading = true;

    this.notificationService.sendNotification(data).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Амжилттай',
          text: 'Мэдэгдэл амжилттай илгээгдлээ',
          confirmButtonText: 'Ойлголоо'
        }).then(() => {
          this.notificationForm.reset({ type: 'custom' });
          this.userIds = [];
          this.submitted = false;
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error sending notification:', error);
        Swal.fire({
          icon: 'error',
          title: 'Алдаа гарлаа',
          text: error.error?.message || 'Мэдэгдэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.',
          confirmButtonText: 'Хаах'
        });
      }
    });
  }
}
