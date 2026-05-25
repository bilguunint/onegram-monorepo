import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { UserProfileService, SmsCampaignRequest } from 'src/app/core/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ModalModule
  ],
  templateUrl: './send-message.component.html',
  styleUrl: './send-message.component.css'
})
export class SendMessageComponent implements OnInit {
  @ViewChild('content3') content3: any;
  
  sendForm: FormGroup;
  phoneForm: FormGroup;
  submitted = false;
  addSubmitted = false;
  isLoading = false;
  numbers: string[] = [];
  modalRef?: BsModalRef;

  constructor(
    private fb: FormBuilder,
    private modalService: BsModalService,
    private userService: UserProfileService
  ) {
    this.sendForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      hour: ['', Validators.required],
      text: ['', Validators.required]
    });

    this.phoneForm = this.fb.group({
      phone: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    this.sendForm.patchValue({ date: today });
  }

  get form() {
    return this.sendForm.controls;
  }

  get f() {
    return this.phoneForm.controls;
  }

  addPhone(): void {
    this.addSubmitted = true;

    if (this.phoneForm.invalid) {
      return;
    }

    const phone = this.phoneForm.value.phone.trim();
    
    // Validate phone number (8 digits)
    if (!/^\d{8}$/.test(phone)) {
      Swal.fire({
        icon: 'error',
        title: 'Алдаа',
        text: '8 оронтой утасны дугаар оруулна уу (жишээ: 99123456)'
      });
      return;
    }

    // Check if already exists
    if (this.numbers.includes(phone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Анхаар',
        text: 'Энэ дугаар аль хэдийн нэмэгдсэн байна'
      });
      return;
    }

    this.numbers.push(phone);
    this.phoneForm.reset();
    this.addSubmitted = false;
  }

  removePhone(phone: string): void {
    this.numbers = this.numbers.filter(n => n !== phone);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.sendForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Алдаа',
        text: 'Бүх талбаруудыг бөглөнө үү'
      });
      return;
    }

    if (this.numbers.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Алдаа',
        text: 'Хамгийн багадаа 1 утасны дугаар нэмнэ үү'
      });
      return;
    }

    // Open confirmation modal
    this.modalRef = this.modalService.show(this.content3, { class: 'modal-md' });
  }

  confirmSend(): void {
    this.isLoading = true;

    // Parse time
    const timeParts = this.form.hour.value.split(':');
    const hour = timeParts[0];
    const minute = timeParts[1];

    const campaignData: SmsCampaignRequest = {
      name: this.form.name.value,
      isWithText: 0,
      text: this.form.text.value,
      begin_date: this.form.date.value,
      begin_hour: hour,
      begin_minute: minute,
      numbers: this.numbers
    };

    this.userService.createSmsCampaign(campaignData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.dismissModal();
        
        Swal.fire({
          icon: 'success',
          title: 'Амжилттай',
          text: response.msg || 'Мессеж амжилттай илгээгдлээ',
          confirmButtonText: 'Ойлголоо'
        }).then(() => {
          // Reset form
          this.sendForm.reset();
          this.numbers = [];
          this.submitted = false;
          
          // Set default date again
          const today = new Date().toISOString().split('T')[0];
          this.sendForm.patchValue({ date: today });
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.dismissModal();
        
        console.error('Error sending SMS campaign:', error);
        Swal.fire({
          icon: 'error',
          title: 'Алдаа гарлаа',
          text: error.error?.msg || 'Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.',
          confirmButtonText: 'Хаах'
        });
      }
    });
  }

  dismissModal(): void {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }
}
