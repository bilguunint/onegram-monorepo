import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { InvestmentService } from '../../core/services/investment.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule
  ],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css'
})
export class InvestmentsComponent implements OnInit {

  // Investments data
  investments: any[] = [];
  allInvestments: any[] = [];
  filteredInvestments: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Admin role
  adminRole: string = '';
  
  // Filtering properties
  adminFilter: string = '';
  dateFilter: string = '';
  endDateFilter: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;
  startItem: number = 0;
  endItem: number = 0;
  
  // Sorting properties
  sortField: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private investmentService: InvestmentService) { }

  ngOnInit(): void {
    // Get admin role first
    this.getAdminRole();
    this.fetchInvestments();
  }

  /**
   * Get admin role from Firebase
   */
  async getAdminRole() {
    try {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
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

  /**
   * Fetch investments from Firestore
   */
  async fetchInvestments() {
    this.isLoading = true;
    try {
      const investmentsSnapshot = await firebase.firestore().collection('investments').get();
      this.allInvestments = investmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.searchInvestments();
      console.log('Investments loaded:', this.allInvestments.length);
    } catch (error) {
      console.error('Error fetching investments:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Хөрөнгө оруулалтын мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Search investments
   */
  searchInvestments() {
    let filteredInvestments = this.allInvestments;

    // Filter by search term
    if (this.searchTerm) {
      filteredInvestments = filteredInvestments.filter(investment => 
        (investment.user?.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (investment.user?.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (investment.user?.phone?.includes(this.searchTerm)) ||
        (investment.user?.email?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (investment.userId?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (investment.verifiedAdmin?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by verified admin
    if (this.adminFilter) {
      filteredInvestments = filteredInvestments.filter(investment => 
        investment.verifiedAdmin === this.adminFilter
      );
    }

    // Filter by creation date
    if (this.dateFilter) {
      filteredInvestments = filteredInvestments.filter(investment => {
        if (investment.createdAt) {
          const investmentDate = new Date(investment.createdAt.toDate());
          const filterDate = new Date(this.dateFilter);
          
          return investmentDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    // Filter by end date
    if (this.endDateFilter) {
      filteredInvestments = filteredInvestments.filter(investment => {
        if (investment.endDate) {
          const endDate = new Date(investment.endDate.toDate());
          const filterDate = new Date(this.endDateFilter);
          
          return endDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    this.filteredInvestments = filteredInvestments;
    
    // Apply sorting
    this.applySorting();
    
    this.totalItems = this.filteredInvestments.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Apply current sorting to filtered investments
   */
  applySorting() {
    if (this.sortField) {
      this.filteredInvestments.sort((a, b) => {
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
  getSortValue(investment: any, field: string): any {
    switch (field) {
      case 'user_name':
        return `${investment.user?.first_name || ''} ${investment.user?.last_name || ''}`.toLowerCase();
      case 'balance':
        return investment.balance || 0;
      case 'createdAt':
        return investment.createdAt?.toDate() || new Date(0);
      case 'endDate':
        return investment.endDate?.toDate() || new Date(0);
      case 'verifiedAdmin':
        return investment.verifiedAdmin || '';
      default:
        return investment[field] || '';
    }
  }

  /**
   * Sort investments
   */
  sortInvestments(field: string) {
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
    this.investments = this.filteredInvestments.slice(startIndex, endIndex);
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
   * Select admin filter
   */
  selectAdminFilter(event: any) {
    this.adminFilter = event.target.value;
    this.searchInvestments();
  }

  /**
   * Filter by creation date
   */
  filterByCreationDate() {
    this.searchInvestments();
  }

  /**
   * Filter by end date
   */
  filterByEndDate() {
    this.searchInvestments();
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.dateFilter = '';
    this.searchInvestments();
  }

  /**
   * Clear end date filter
   */
  clearEndDateFilter() {
    this.endDateFilter = '';
    this.searchInvestments();
  }

  /**
   * Refresh investments
   */
  refreshInvestments() {
    this.fetchInvestments();
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
   * Get user full name
   */
  getUserName(investment: any): string {
    const firstName = investment.user?.first_name || '';
    const lastName = investment.user?.last_name || '';
    return `${lastName} ${firstName}`.trim() || 'Байхгүй';
  }

  /**
   * Get investment status based on end date
   */
  getInvestmentStatus(investment: any): string {
    // Check if manually closed
    if (investment.status === 'closed') {
      return 'Хаагдсан';
    }
    
    if (!investment.endDate) return 'Тодорхойгүй';
    
    const endDate = new Date(investment.endDate.toDate());
    const now = new Date();
    
    if (endDate > now) {
      return 'Идэвхтэй';
    } else {
      return 'Дуусгавар болсон';
    }
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(investment: any): string {
    const status = this.getInvestmentStatus(investment);
    switch (status) {
      case 'Идэвхтэй':
        return 'badge bg-success';
      case 'Хаагдсан':
        return 'badge bg-danger';
      case 'Дуусгавар болсон':
        return 'badge bg-secondary';
      default:
        return 'badge bg-warning';
    }
  }

  /**
   * Format closed date timestamp
   */
  formatClosedDate(closedDate: any): string {
    if (!closedDate) return '-';
    
    try {
      // Handle ISO string
      if (typeof closedDate === 'string') {
        const date = new Date(closedDate);
        return date.toLocaleDateString('mn-MN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      // Handle Firestore timestamp
      if (closedDate.toDate) {
        return closedDate.toDate().toLocaleDateString('mn-MN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      return '-';
    } catch (error) {
      console.error('Error formatting closed date:', error);
      return '-';
    }
  }

  /**
   * Check if investment is closed
   */
  isClosed(investment: any): boolean {
    return investment.status === 'closed';
  }

  /**
   * Calculate days remaining
   */
  getDaysRemaining(investment: any): number {
    if (!investment.endDate) return 0;
    
    const endDate = new Date(investment.endDate.toDate());
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Track by function for ngFor
   */
  trackByInvestment(index: number, investment: any): any {
    return investment.id;
  }

  /**
   * Get unique verified admins for filter
   */
  getUniqueAdmins(): string[] {
    const admins = this.allInvestments
      .map(inv => inv.verifiedAdmin)
      .filter(admin => admin && admin.trim() !== '');
    return [...new Set(admins)].sort();
  }

  /**
   * Export to Excel
   */
  exportToExcel() {
    try {
      if (this.filteredInvestments.length === 0) {
        Swal.fire({
          title: 'Анхааруулга!',
          text: 'Экспорт хийх хөрөнгө оруулалт байхгүй байна.',
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

      const excelData = this.filteredInvestments.map((investment) => ({
        'Хөрөнгө оруулалтын ID': investment.id || '',
        'Хэрэглэгчийн нэр': this.getUserName(investment),
        'Утас': investment.user?.phone || 'Байхгүй',
        'И-мэйл': investment.user?.email || 'Байхгүй',
        'Хэрэглэгчийн ID': investment.userId || 'Байхгүй',
        'Үлдэгдэл': investment.balance || 0,
        'Төлөв': this.getInvestmentStatus(investment),
        'Үлдсэн хоног': this.isClosed(investment) ? '-' : this.getDaysRemaining(investment),
        'Баталгаажуулсан админ': investment.verifiedAdmin || 'Байхгүй',
        'Админ ID': investment.verifiedId || 'Байхгүй',
        'Үүсгэсэн огноо': this.formatTimestamp(investment.createdAt),
        'Дуусах огноо': this.formatTimestamp(investment.endDate),
        'Хаагдсан огноо': this.isClosed(investment) ? this.formatClosedDate(investment.closedDate) : '-',
        'Хаасан админ': this.isClosed(investment) ? (investment.closedBy || 'Байхгүй') : '-',
        'Гэрээний файл': this.isClosed(investment) ? (investment.attachedFile || 'Байхгүй') : '-'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 30 }, // ID
        { wch: 20 }, // Нэр
        { wch: 15 }, // Утас
        { wch: 25 }, // И-мэйл
        { wch: 30 }, // Хэрэглэгчийн ID
        { wch: 15 }, // Үлдэгдэл
        { wch: 15 }, // Төлөв
        { wch: 12 }, // Үлдсэн хоног
        { wch: 20 }, // Админ
        { wch: 30 }, // Админ ID
        { wch: 20 }, // Үүсгэсэн огноо
        { wch: 20 }, // Дуусах огноо
        { wch: 20 }, // Хаагдсан огноо
        { wch: 20 }, // Хаасан админ
        { wch: 50 }  // Гэрээний файл
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Хөрөнгө оруулалт');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Хөрөнгө_оруулалтын_жагсаалт_${currentDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      Swal.fire({
        title: 'Амжилттай!',
        html: `
          <p>Excel файл амжилттай үүсгэгдлээ.</p>
          <div class="text-start mt-3">
            <small class="text-muted">
              <strong>Файлын нэр:</strong> ${filename}<br>
              <strong>Экспорт хийсэн тоо:</strong> ${excelData.length}<br>
              <strong>Нийт тоо:</strong> ${this.allInvestments.length}<br>
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
   * Show investment detail modal
   */
  showInvestmentDetail(investment: any) {
    const currentEndDate = investment.endDate ? new Date(investment.endDate.toDate()) : new Date();
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    Swal.fire({
      title: 'Дуусах хугацаа засах',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label class="form-label">Одоогийн дуусах огноо:</label>
            <p class="text-muted">${this.formatTimestamp(investment.endDate)}</p>
          </div>
          <div class="mb-3">
            <label for="newEndDate" class="form-label">Шинэ дуусах огноо:</label>
            <input type="date" id="newEndDate" class="form-control" value="${formatDateForInput(currentEndDate)}">
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Засах',
      cancelButtonText: 'Цуцлах',
      preConfirm: () => {
        const newEndDateInput = (document.getElementById('newEndDate') as HTMLInputElement);
        const newEndDate = newEndDateInput?.value;
        
        if (!newEndDate) {
          Swal.showValidationMessage('Огноо сонгоно уу');
          return false;
        }
        
        const selectedDate = new Date(newEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          Swal.showValidationMessage('Дуусах огноо өнөөдрөөс хойш байх ёстой');
          return false;
        }
        
        return newEndDate;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        await this.updateInvestmentEndDate(investment.id, result.value);
      }
    });
  }

  /**
   * Update investment end date in Firestore
   */
  async updateInvestmentEndDate(investmentId: string, newEndDate: string) {
    try {
      // Show loading
      Swal.fire({
        title: 'Шинэчилж байна...',
        text: 'Дуусах огноог шинэчилж байна.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Convert string date to Firestore timestamp
      const endDate = firebase.firestore.Timestamp.fromDate(new Date(newEndDate));

      // Update the document
      await firebase.firestore()
        .collection('investments')
        .doc(investmentId)
        .update({
          endDate: endDate
        });

      // Update local data
      const investmentIndex = this.allInvestments.findIndex(inv => inv.id === investmentId);
      if (investmentIndex !== -1) {
        this.allInvestments[investmentIndex].endDate = endDate;
      }

      // Refresh the filtered view
      this.searchInvestments();

      // Show success message
      Swal.fire({
        title: 'Амжилттай!',
        text: 'Дуусах огноо амжилттай шинэчлэгдлээ.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error updating investment end date:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Дуусах огноог шинэчлэхэд алдаа гарлаа.',
        icon: 'error'
      });
    }
  }

  /**
   * Close investment by setting end date to current date
   */
  closeInvestment(investment: any) {
    // Check if investment is already closed
    if (this.isClosed(investment)) {
      Swal.fire({
        title: 'Анхааруулга!',
        text: 'Энэ хөрөнгө оруулалт аль хэдийн хаагдсан байна.',
        icon: 'warning'
      });
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];

    Swal.fire({
      title: 'Гэрээ хаах',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <div class="alert alert-info" role="alert">
              <strong>Хэрэглэгч:</strong> ${this.getUserName(investment)}<br>
              <strong>Хөрөнгө оруулалт:</strong> ${investment.balance?.toLocaleString() || 0}гр
            </div>
            <div class="alert alert-warning" role="alert">
              <strong>Анхааруулга:</strong> Хөрөнгө оруулалт хаагдсаны дараа дахин идэвхжүүлэх боломжгүй.
            </div>
          </div>
          <div class="mb-3">
            <label for="closeDate" class="form-label">Гэрээ хаагдсан огноо <span class="text-danger">*</span></label>
            <input type="date" id="closeDate" class="form-control" value="${currentDate}">
          </div>
          <div class="mb-3">
            <label for="contractFile" class="form-label">Гэрээ (файл) <span class="text-danger">*</span></label>
            <input type="file" id="contractFile" class="form-control" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
            <small class="text-muted">PDF, DOC, DOCX, JPG, PNG форматтай файл оруулна уу</small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Гэрээ хаах',
      cancelButtonText: 'Цуцлах',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const closeDateInput = document.getElementById('closeDate') as HTMLInputElement;
        const contractFileInput = document.getElementById('contractFile') as HTMLInputElement;
        
        const closeDate = closeDateInput?.value;
        const contractFile = contractFileInput?.files?.[0];
        
        if (!closeDate) {
          Swal.showValidationMessage('Гэрээ хаагдсан огноо оруулна уу');
          return false;
        }
        
        if (!contractFile) {
          Swal.showValidationMessage('Гэрээний файл оруулна уу');
          return false;
        }
        
        // Validate file size (max 10MB)
        if (contractFile.size > 10 * 1024 * 1024) {
          Swal.showValidationMessage('Файлын хэмжээ 10MB-аас бага байх ёстой');
          return false;
        }
        
        return {
          closeDate: closeDate,
          contractFile: contractFile
        };
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        await this.confirmCloseInvestment(investment.id, result.value.closeDate, result.value.contractFile);
      }
    });
  }

  /**
   * Confirm and close the investment
   */
  async confirmCloseInvestment(investmentId: string, closeDate: string, contractFile: File) {
    try {
      // Show loading
      Swal.fire({
        title: 'Хаалтыг боловсруулж байна...',
        html: `
          <div class="mb-3">
            <p>Файл байршуулж байна...</p>
            <div class="progress">
              <div id="uploadProgress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Upload contract file to Firebase Storage
      const timestamp = Date.now();
      const fileName = `contracts/${investmentId}_${timestamp}_${contractFile.name}`;
      const storageRef = firebase.storage().ref(fileName);
      
      // Upload with progress tracking
      const uploadTask = storageRef.put(contractFile);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const progressBar = document.getElementById('uploadProgress');
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        }
      );

      await uploadTask;
      const downloadURL = await storageRef.getDownloadURL();

      // 2. Update loading message
      Swal.update({
        html: '<p>API руу хүсэлт илгээж байна...</p>'
      });

      // 3. Call investment service API
      const closeDateISO = new Date(closeDate).toISOString();
      
      this.investmentService.closeInvestment({
        investmentId: investmentId,
        attachFile: downloadURL,
        closeDate: closeDateISO
      }).subscribe({
        next: async (response) => {
          console.log('Close investment response:', response);
          
          if (response.success) {
            // Update local data
            await this.fetchInvestments();

            // Show success message
            Swal.fire({
              title: 'Амжилттай!',
              html: `
                <p>${response.message || 'Хөрөнгө оруулалт амжилттай хаагдлаа.'}</p>
                ${response.closedBalance ? `<p class="text-primary"><strong>Буцаасан дүн:</strong> ${response.closedBalance.toLocaleString()}гр</p>` : ''}
              `,
              icon: 'success',
              confirmButtonText: 'За'
            });
          } else {
            throw new Error(response.error || 'Хөрөнгө оруулалт хаахад алдаа гарлаа');
          }
        },
        error: (error) => {
          console.error('Error closing investment:', error);
          
          let errorMessage = 'Хөрөнгө оруулалт хаахад алдаа гарлаа.';
          if (error.error) {
            errorMessage = error.error;
          }
          
          Swal.fire({
            title: 'Алдаа!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'За'
          });
        }
      });

    } catch (error) {
      console.error('Error in confirmCloseInvestment:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: error instanceof Error ? error.message : 'Хөрөнгө оруулалт хаахад алдаа гарлаа.',
        icon: 'error',
        confirmButtonText: 'За'
      });
    }
  }
}
