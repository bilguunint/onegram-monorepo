import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { WithdrawService, VerifyWithdrawRequest } from '../../core/services/withdraw.service';

@Component({
  selector: 'app-withdraws',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule
  ],
  templateUrl: './withdraws.component.html',
  styleUrl: './withdraws.component.css'
})
export class WithdrawsComponent implements OnInit {

  // Withdraws data
  withdraws: any[] = [];
  allWithdraws: any[] = [];
  filteredWithdraws: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Role-based access control
  adminRole: string = 'admin';
  adminUid: string = '';
  
  // Filtering properties
  statusFilter: string = '';
  metalFilter: string = '';
  dateFilter: string = '';
  verificationFilter: string = '';
  dateRangeFilter: string = 'week';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;
  startItem: number = 0;
  endItem: number = 0;
  
  // Sorting properties
  sortField: string = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private withdrawService: WithdrawService) { }

  ngOnInit(): void {
    this.getAdminRole();
    this.fetchWithdrawsByDateRange('week');
  }

  /**
   * Fetch withdraws filtered by date range from Firestore
   * range: 'week' | 'month' | 'year' | 'all'
   */
  async fetchWithdrawsByDateRange(range: string) {
    this.isLoading = true;
    this.dateRangeFilter = range;
    try {
      let query: any = firebase.firestore().collection('withdraws');

      if (range !== 'all') {
        const now = new Date();
        let startDate: Date;

        if (range === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (range === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }

        query = query.where('created_at', '>=', firebase.firestore.Timestamp.fromDate(startDate));
      }

      const snapshot = await query.get();
      this.allWithdraws = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      this.searchWithdraws();
      console.log(`Withdraws loaded for range "${range}":`, this.allWithdraws.length);
    } catch (error) {
      console.error('Error fetching withdraws:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Биетээр авах хүсэлтүүдийн мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch withdraws from Firestore
   */
  async fetchWithdraws() {
    this.isLoading = true;
    try {
      const withdrawsSnapshot = await firebase.firestore().collection('withdraws').get();
      this.allWithdraws = withdrawsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.searchWithdraws();
      console.log('Withdraws loaded:', this.allWithdraws.length);
    } catch (error) {
      console.error('Error fetching withdraws:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Биетээр авах хүсэлтүүдийн мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Search withdraws
   */
  searchWithdraws() {
    let filteredWithdraws = this.allWithdraws;

    // Filter by search term
    if (this.searchTerm) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => 
        (withdraw.client?.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.client?.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.client?.phone?.includes(this.searchTerm)) ||
        (withdraw.client?.email?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.id?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.user_id?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.verificationCode?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (withdraw.notes?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (this.statusFilter) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => 
        withdraw.status === this.statusFilter
      );
    }

    // Filter by metal type
    if (this.metalFilter) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => {
        if (this.metalFilter === 'gold') {
          return withdraw.metal_id === 1;
        } else if (this.metalFilter === 'silver') {
          return withdraw.metal_id === 3;
        }
        return true;
      });
    }

    // Filter by verification status
    if (this.verificationFilter) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => {
        if (this.verificationFilter === 'verified') {
          return withdraw.verified_at;
        } else if (this.verificationFilter === 'unverified') {
          return !withdraw.verified_at;
        } else if (this.verificationFilter === 'code_used') {
          return withdraw.verificationCodeUsed;
        } else if (this.verificationFilter === 'code_not_used') {
          return !withdraw.verificationCodeUsed;
        }
        return true;
      });
    }

    // Filter by date
    if (this.dateFilter) {
      filteredWithdraws = filteredWithdraws.filter(withdraw => {
        if (withdraw.created_at) {
          const withdrawDate = new Date(withdraw.created_at.toDate());
          const filterDate = new Date(this.dateFilter);
          
          return withdrawDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    this.filteredWithdraws = filteredWithdraws;
    
    // Apply sorting
    this.applySorting();
    
    this.totalItems = this.filteredWithdraws.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Apply current sorting to filtered withdraws
   */
  applySorting() {
    if (this.sortField) {
      this.filteredWithdraws.sort((a, b) => {
        let aValue = this.getSortValue(a, this.sortField);
        let bValue = this.getSortValue(b, this.sortField);

        if (aValue < bValue) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
  }

  /**
   * Get sort value for comparison
   */
  getSortValue(withdraw: any, field: string): any {
    switch (field) {
      case 'client_name':
        return `${withdraw.client?.first_name || ''} ${withdraw.client?.last_name || ''}`.toLowerCase();
      case 'quantity':
        return withdraw.quantity || 0;
      case 'created_at':
        return withdraw.created_at?.toDate() || new Date(0);
      case 'status':
        return withdraw.status || '';
      case 'verified_at':
        return withdraw.verified_at?.toDate() || new Date(0);
      default:
        return withdraw[field] || '';
    }
  }

  /**
   * Sort withdraws
   */
  sortWithdraws(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.applySorting();
    this.updatePagination();
  }

  /**
   * Get sort icon class
   */
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'mdi mdi-sort';
    }
    return this.sortDirection === 'asc' ? 'mdi mdi-sort-ascending' : 'mdi mdi-sort-descending';
  }

  /**
   * Update pagination
   */
  updatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.withdraws = this.filteredWithdraws.slice(startIndex, endIndex);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Select status filter
   */
  selectStatusFilter(event: any) {
    this.statusFilter = event.target.value;
    this.searchWithdraws();
  }

  /**
   * Select metal filter
   */
  selectMetalFilter(event: any) {
    this.metalFilter = event.target.value;
    this.searchWithdraws();
  }

  /**
   * Select verification filter
   */
  selectVerificationFilter(event: any) {
    this.verificationFilter = event.target.value;
    this.searchWithdraws();
  }

  /**
   * Filter by date
   */
  filterByDate() {
    this.searchWithdraws();
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.dateFilter = '';
    this.searchWithdraws();
  }

  /**
   * Refresh withdraws
   */
  refreshWithdraws() {
    this.fetchWithdrawsByDateRange(this.dateRangeFilter);
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'Байхгүй';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('mn-MN') + ' ' + date.toLocaleTimeString('mn-MN');
    } catch (error) {
      return 'Алдаатай огноо';
    }
  }

  /**
   * Get client full name
   */
  getClientName(withdraw: any): string {
    const firstName = withdraw.client?.first_name || '';
    const lastName = withdraw.client?.last_name || '';
    return `${lastName} ${firstName}`.trim() || 'Байхгүй';
  }

  /**
   * Get metal type name
   */
  getMetalTypeName(metalId: number): string {
    return metalId === 1 ? 'Алт' : metalId === 3 ? 'Мөнгө' : 'Тодорхойгүй';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge bg-warning';
      case 'verified':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      case 'completed':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }

  /**
   * Get status text
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Хүлээгдэж буй';
      case 'verified':
        return 'Баталгаажсан';
      case 'rejected':
        return 'Татгалзсан';
      case 'completed':
        return 'Дууссан';
      default:
        return status || 'Тодорхойгүй';
    }
  }

  /**
   * Check if verification code is expired
   */
  isVerificationCodeExpired(withdraw: any): boolean {
    if (!withdraw.verificationCodeExpiresAt) return false;
    
    const expiresAt = new Date(withdraw.verificationCodeExpiresAt.toDate());
    const now = new Date();
    
    return expiresAt < now;
  }

  /**
   * Get verification status
   */
  getVerificationStatus(withdraw: any): string {
    if (withdraw.verified_at) {
      return 'Баталгаажсан';
    } else if (withdraw.verificationCodeUsed) {
      return 'Код ашигласан';
    } else if (this.isVerificationCodeExpired(withdraw)) {
      return 'Код дууссан';
    } else {
      return 'Баталгаажаагүй';
    }
  }

  /**
   * Get verification badge class
   */
  getVerificationBadgeClass(withdraw: any): string {
    if (withdraw.verified_at) {
      return 'badge bg-success';
    } else if (withdraw.verificationCodeUsed) {
      return 'badge bg-info';
    } else if (this.isVerificationCodeExpired(withdraw)) {
      return 'badge bg-danger';
    } else {
      return 'badge bg-secondary';
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByWithdraw(index: number, withdraw: any): any {
    return withdraw.id;
  }

  /**
   * Export to Excel
   */
  exportToExcel() {
    try {
      if (this.filteredWithdraws.length === 0) {
        Swal.fire({
          title: 'Анхааруулга!',
          text: 'Экспорт хийх биетээр авах хүсэлт байхгүй байна.',
          icon: 'warning'
        });
        return;
      }

      Swal.fire({
        title: 'Боловсруулж байна...',
        text: 'Excel файл үүсгэж байна.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const excelData = this.filteredWithdraws.map((withdraw) => ({
        'Хүсэлтийн ID': withdraw.id || '',
        'Харилцагчийн нэр': this.getClientName(withdraw),
        'Утас': withdraw.client?.phone || 'Байхгүй',
        'И-мэйл': withdraw.client?.email || 'Байхгүй',
        'Хэрэглэгчийн ID': withdraw.user_id || 'Байхгүй',
        'Металл төрөл': this.getMetalTypeName(withdraw.metal_id),
        'Тоо хэмжээ': withdraw.quantity || 0,
        'Үнэ': withdraw.price || 0,
        'Төлөв': this.getStatusText(withdraw.status),
        'Төрөл': withdraw.withdraw_type === 'sold_to_us' ? 'Манайд зарсан' : withdraw.withdraw_type === 'taken_physically' ? 'Биетээр авсан' : '-',
        'Баталгаажуулалт': this.getVerificationStatus(withdraw),
        'Баталгаажуулсан код': withdraw.verificationCode || 'Байхгүй',
        'Баталгаажуулсан админ': withdraw.verified_by_name || 'Байхгүй',
        'Үүсгэсэн огноо': this.formatTimestamp(withdraw.created_at),
        'Шинэчилсэн огноо': this.formatTimestamp(withdraw.updated_at),
        'Баталгаажуулсан огноо': this.formatTimestamp(withdraw.verified_at)
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 25 }, // ID
        { wch: 20 }, // Нэр
        { wch: 15 }, // Утас
        { wch: 25 }, // И-мэйл
        { wch: 30 }, // Хэрэглэгчийн ID
        { wch: 12 }, // Металл төрөл
        { wch: 12 }, // Тоо хэмжээ
        { wch: 18 }, // Үнэ
        { wch: 15 }, // Төлөв
        { wch: 18 }, // Төрөл
        { wch: 15 }, // Баталгаажуулалт
        { wch: 20 }, // Код
        { wch: 20 }, // Админ
        { wch: 20 }, // Үүсгэсэн огноо
        { wch: 20 }, // Шинэчилсэн огноо
        { wch: 20 }  // Баталгаажуулсан огноо
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Биетээр авах хүсэлтүүд');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Биетээр_авах_хүсэлтүүдийн_жагсаалт_${currentDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      Swal.fire({
        title: 'Амжилттай!',
        html: `
          <p>Excel файл амжилттай үүсгэгдлээ.</p>
          <div class="text-start mt-3">
            <small class="text-muted">
              <strong>Файлын нэр:</strong> ${filename}<br>
              <strong>Экспорт хийсэн тоо:</strong> ${excelData.length}<br>
              <strong>Нийт тоо:</strong> ${this.allWithdraws.length}<br>
              <strong>Огноо:</strong> ${new Date().toLocaleString('mn-MN')}
            </small>
          </div>
        `,
        icon: 'success',
        timer: 4000,
        showConfirmButton: true
      });

    } catch (error) {
      console.error('Excel export error:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Excel файл үүсгэхэд алдаа гарлаа.',
        icon: 'error'
      });
    }
  }

  /**
   * Show withdraw detail modal
   */
  showWithdrawDetail(withdraw: any) {
    const verificationStatus = this.getVerificationStatus(withdraw);
    
    Swal.fire({
      title: 'Биетээр авах хүсэлтийн дэлгэрэнгүй мэдээлэл',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <h6><i class="mdi mdi-account me-2"></i>Харилцагчийн мэдээлэл</h6>
            <p class="mb-1"><b>Нэр:</b> ${this.getClientName(withdraw)}</p>
            <p class="mb-1"><b>Утас:</b> ${withdraw.client?.phone || 'Байхгүй'}</p>
            <p class="mb-1"><b>И-мэйл:</b> ${withdraw.client?.email || 'Байхгүй'}</p>
            <p class="mb-1"><b>Хэрэглэгчийн ID:</b> ${withdraw.user_id || 'Байхгүй'}</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-cash me-2"></i>Хүсэлтийн мэдээлэл</h6>
            <p class="mb-1"><b>ID:</b> ${withdraw.id}</p>
            <p class="mb-1"><b>Металл төрөл:</b> ${this.getMetalTypeName(withdraw.metal_id)}</p>
            <p class="mb-1"><b>Тоо хэмжээ:</b> ${withdraw.quantity} гр</p>
            <p class="mb-1"><b>Төлөв:</b> <span class="badge ${this.getStatusBadgeClass(withdraw.status)}">${this.getStatusText(withdraw.status)}</span></p>
            <p class="mb-1"><b>Тэмдэглэл:</b> ${withdraw.notes || 'Байхгүй'}</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-shield-check me-2"></i>Баталгаажуулалтын мэдээлэл</h6>
            <p class="mb-1"><b>Баталгаажуулалтын код:</b> ${withdraw.verificationCode || 'Байхгүй'}</p>
            <p class="mb-1"><b>Код дуусах хугацаа:</b> ${this.formatTimestamp(withdraw.verificationCodeExpiresAt)}</p>
            <p class="mb-1"><b>Код ашигласан эсэх:</b> ${withdraw.verificationCodeUsed ? 'Тийм' : 'Үгүй'}</p>
            <p class="mb-1"><b>Баталгаажуулалтын төлөв:</b> <span class="badge ${this.getVerificationBadgeClass(withdraw)}">${verificationStatus}</span></p>
            <p class="mb-1"><b>Баталгаажуулсан админ:</b> ${withdraw.verified_by_name || 'Байхгүй'}</p>
            <p class="mb-1"><b>Админ ID:</b> ${withdraw.verified_by_uid || 'Байхгүй'}</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-clock me-2"></i>Огнооны мэдээлэл</h6>
            <p class="mb-1"><b>Үүсгэсэн огноо:</b> ${this.formatTimestamp(withdraw.created_at)}</p>
            <p class="mb-1"><b>Шинэчилсэн огноо:</b> ${this.formatTimestamp(withdraw.updated_at)}</p>
            <p class="mb-1"><b>Баталгаажуулсан огноо:</b> ${this.formatTimestamp(withdraw.verified_at)}</p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Хаах',
      customClass: {
        popup: 'swal-wide'
      }
    });
  }

  /**
   * Verify withdraw request with confirmation modal
   * @param withdraw - The withdraw request to verify
   */
  async verifyWithdraw(withdraw: any) {
    try {
      // Show confirmation modal first
      const confirmResult = await Swal.fire({
        title: 'Баталгаажуулах',
        text: `Та ${withdraw.quantity} гр биетээр авах хүсэлтийг баталгаажуулахдаа итгэлтэй байна уу?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Тийм, баталгаажуулах',
        cancelButtonText: 'Үгүй',
        confirmButtonColor: '#1D6F42',
        cancelButtonColor: '#d33'
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Show input modal for verification code
      const { value: verificationCode } = await Swal.fire({
        title: 'Баталгаажуулах код',
        html: `
          <div class="text-start mb-3">
            <label class="form-label fw-bold">Төрөл</label>
            <select id="withdraw-type" class="form-select mb-3">
              <option value="sold_to_us">Манайд зарсан</option>
              <option value="taken_physically">Биетээр авсан</option>
            </select>
            <label class="form-label fw-bold">SMS-аар илгээсэн 5 оронтой тоо үсэг холилдсон кодыг оруулна уу</label>
            <input id="verification-code-input" class="form-control" type="text" maxlength="5" placeholder="A1B2C" style="text-transform: uppercase;">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<span id="confirm-text">Баталгаажуулах</span><span id="confirm-loader" style="display: none;"><i class="spinner-border spinner-border-sm me-2"></i>Баталгаажуулж байна...</span>',
        cancelButtonText: 'Болих',
        confirmButtonColor: '#1D6F42',
        cancelButtonColor: '#d33',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          const input = document.getElementById('verification-code-input') as HTMLInputElement;
          if (input) {
            input.focus();
          }
        },
        preConfirm: () => {
          const codeInput = document.getElementById('verification-code-input') as HTMLInputElement;
          const typeSelect = document.getElementById('withdraw-type') as HTMLSelectElement;
          const code = codeInput?.value || '';
          const type = typeSelect?.value || 'sold_to_us';
          
          if (!code) {
            Swal.showValidationMessage('Баталгаажуулах код оруулна уу!');
            return false;
          }
          if (code.length !== 5) {
            Swal.showValidationMessage('Код 5 оронтой байх ёстой!');
            return false;
          }
          if (!/^[A-Za-z0-9]+$/.test(code)) {
            Swal.showValidationMessage('Код тоо болон үсгээс бүрдэх ёстой!');
            return false;
          }

          // Show loading state on button
          const confirmText = document.getElementById('confirm-text');
          const confirmLoader = document.getElementById('confirm-loader');
          const confirmButton = Swal.getConfirmButton();
          
          if (confirmText && confirmLoader && confirmButton) {
            confirmText.style.display = 'none';
            confirmLoader.style.display = 'inline-block';
            confirmButton.disabled = true;
          }

          try {
            // Prepare verification request
            const verifyRequest: VerifyWithdrawRequest = {
              verificationCode: code.toUpperCase(),
              withdrawId: withdraw.id,
              withdrawType: type
            };

            // Call verification service and wait for response
            return new Promise(async (resolve, reject) => {
              try {
                const verifyObservable = await this.withdrawService.verifyWithdraw(verifyRequest);
                verifyObservable.subscribe({
                  next: (response) => {
                    resolve(response);
                  },
                  error: (error) => {
                    // Reset button state
                    if (confirmText && confirmLoader && confirmButton) {
                      confirmText.style.display = 'inline-block';
                      confirmLoader.style.display = 'none';
                      confirmButton.disabled = false;
                    }
                    
                    Swal.showValidationMessage(error.message || 'Баталгаажуулахад алдаа гарлаа');
                    reject(error);
                  }
                });
              } catch (error: any) {
                // Reset button state
                if (confirmText && confirmLoader && confirmButton) {
                  confirmText.style.display = 'inline-block';
                  confirmLoader.style.display = 'none';
                  confirmButton.disabled = false;
                }
                
                Swal.showValidationMessage(error.message || 'Firebase authentication алдаа');
                reject(error);
              }
            });
          } catch (error: any) {
            // Reset button state
            if (confirmText && confirmLoader && confirmButton) {
              confirmText.style.display = 'inline-block';
              confirmLoader.style.display = 'none';
              confirmButton.disabled = false;
            }
            
            Swal.showValidationMessage(error.message || 'Баталгаажуулахад алдаа гарлаа');
            return false;
          }
        }
      });

      if (!verificationCode) {
        return;
      }

      // If we get here, verification was successful (response is in verificationCode.value)
      const response = verificationCode;
      this.refreshWithdraws();
      // Show success message
      Swal.fire({
        title: 'Амжилттай!',
        html: `
          <div class="text-start">
            <p><strong>Биетээр авах хүсэлт амжилттай баталгаажлаа</strong></p>
            <hr>
            <p><i class="mdi mdi-check-circle text-success me-2"></i><strong>Төлөв:</strong> ${response.status}</p>
            <p><i class="mdi mdi-gold me-2"></i><strong>Металл:</strong> ${response.metal_id === 1 ? 'Алт' : response.metal_id === 3 ? 'Мөнгө' : 'Тодорхойгүй'}</p>
            <p><i class="mdi mdi-weight me-2"></i><strong>Тоо хэмжээ:</strong> ${response.quantity} гр</p>
            <p><i class="mdi mdi-account me-2"></i><strong>Хэрэглэгч ID:</strong> ${response.user_id}</p>
            <p><i class="mdi mdi-account-check me-2"></i><strong>Баталгаажуулсан:</strong> ${response.performed_by}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Хаах',
        confirmButtonColor: '#1D6F42',
        customClass: {
          popup: 'swal-wide'
        }
      });

      // Refresh withdraws list to show updated data
      this.refreshWithdraws();

    } catch (error) {
      console.error('Verification error:', error);
      Swal.fire({
        title: 'Алдаа гарлаа!',
        text: 'Баталгаажуулахад алдаа гарлаа',
        icon: 'error',
        confirmButtonText: 'Хаах',
        confirmButtonColor: '#d33'
      });
    }
  }

  /**
   * Get admin role from Firebase auth custom claims
   */
  async getAdminRole() {
      try {
        firebase.auth().onAuthStateChanged(async (user) => {
          if (user) {
            this.adminUid = user.uid; // Store admin UID
            const adminDoc = await firebase.firestore()
              .collection('admins')
              .doc(user.uid)
              .get();
            
            if (adminDoc.exists) {
              const adminData = adminDoc.data();
              this.adminRole = adminData?.role || '';
              console.log('Investments - Admin role:', this.adminRole);
            }
          }
        });
      } catch (error) {
        console.error('Admin role авахад алдаа:', error);
        this.adminRole = '';
      }
    }
}
