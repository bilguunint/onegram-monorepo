import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagetitleComponent } from 'src/app/shared/ui/pagetitle/pagetitle.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import Swal from 'sweetalert2';
import { InvestmentService, InvestmentRequest } from '../../core/services/investment.service';
import { UserProfileService } from '../../core/services/user.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [CommonModule, PagetitleComponent, FormsModule, BsDropdownModule, ModalModule, BsDatepickerModule]
})
export class UsersComponent implements OnInit {
  modalRef?: BsModalRef;
  breadCrumbItems: Array<{}>;
  users: any[] = [];
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedFilter: string = '';
  
  // Admin role
  adminRole: string = '';
  
  // Filtering properties
  filterType: string = '';
  dateFilter: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  totalPages: number = 0;
  startItem: number = 0;
  endItem: number = 0;
  
  // Sorting properties
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // User category filter
  userCategory: string = 'has_gold';
  
  // Investment modal properties
  selectedUserId: string = '';
  selectedUser: any = null;
  investmentAmount: number = 0;
  investmentEndDate: Date = new Date();

  // Ledger modal properties
  ledgerUser: any = null;
  ledgerData: any = null;
  ledgerLoading: boolean = false;

  constructor(
    private modalService: BsModalService,
    private investmentService: InvestmentService,
    private userService: UserProfileService
  ) {
    this.breadCrumbItems = [
      { label: 'Хэрэглэгчид' },
      { label: 'Жагсаалт', active: true }
    ];
  }

  ngOnInit(): void {
    // Get admin role first
    this.getAdminRole();
    // Default: load gold users
    this.fetchUsersByCategory('has_gold');
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
            console.log('Users - Admin role:', this.adminRole);
          }
        }
      });
    } catch (error) {
      console.error('Admin role авахад алдаа:', error);
      this.adminRole = '';
    }
  }

  /**
   * Open modal
   * @param content modal content
   */
  openModal(content: TemplateRef<any>) {
    this.modalRef = this.modalService.show(content);
  }

  /**
   * Open investment modal
   * @param content modal content
   * @param userId user ID
   */
  openInvestmentModal(content: TemplateRef<any>, userId: string) {
    this.selectedUserId = userId;
    this.selectedUser = this.users.find(user => user.id === userId) || null;
    this.investmentAmount = 0;
    this.investmentEndDate = new Date();
    this.modalRef = this.modalService.show(content);
  }

  /**
   * Fetch users by category from Firestore
   * 'has_gold' - users with gold balance > 0
   * 'others' - users with no gold balance
   */
  async fetchUsersByCategory(category: string) {
    this.isLoading = true;
    this.userCategory = category;
    this.searchTerm = '';
    this.selectedFilter = '';
    this.dateFilter = '';
    this.currentPage = 1;
    try {
      let snapshot;
      if (category === 'has_gold') {
        snapshot = await firebase.firestore()
          .collection('users')
          .where('balance.gold', '>', 0)
          .get();
      } else {
        // 'others' - users where gold is 0 or doesn't exist
        snapshot = await firebase.firestore()
          .collection('users')
          .where('balance.gold', '==', 0)
          .get();
      }

      this.allUsers = snapshot.docs.map(doc => this.mapUserDoc(doc));
      // Sort by created_at desc client-side
      this.allUsers.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      this.filteredUsers = [...this.allUsers];
      this.totalItems = this.filteredUsers.length;
      this.updatePagination();
      console.log(`Users loaded (${category}):`, this.allUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Map Firestore document to user object
   */
  private mapUserDoc(doc: firebase.firestore.QueryDocumentSnapshot): any {
    const userData = doc.data();
    return {
      id: doc.id,
      ...userData,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      registration_number: userData.registration_number || '',
      balance: userData.balance || { gold: 0, silver: 0, saving: 0 },
      invest_total: userData.invest_total || 0,
      created_at: userData.created_at || null,
      updated_at: userData.updated_at || null
    };
  }

  /**
   * Search users
   */
  searchUsers() {
    let filteredUsers = this.allUsers;

    // Filter by search term
    if (this.searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        (user.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.email?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.phone?.includes(this.searchTerm)) ||
        (user.registration_number?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by date
    if (this.dateFilter) {
      filteredUsers = filteredUsers.filter(user => {
        if (user.created_at) {
          const userDate = new Date(user.created_at.toDate());
          const filterDate = new Date(this.dateFilter);
          
          // Compare only date parts (ignore time)
          return userDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    this.filteredUsers = filteredUsers;
    this.totalItems = this.filteredUsers.length;
    this.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  /**
   * Filter users by date
   */
  filterByDate() {
    this.searchUsers(); // Reuse the searchUsers function which now includes date filtering
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.dateFilter = '';
    this.searchUsers();
  }

  /**
   * Update pagination
   */
  updatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    
    // Get current page items
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.users = this.filteredUsers.slice(startIndex, endIndex);
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
    const maxPagesToShow = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Filter by selected option (client-side sub-filter)
   */
  selectFilter(event: any) {
    const value = event.target.value;
    // If category changed, re-fetch from Firestore
    if (value === 'has_gold' || value === 'others') {
      this.fetchUsersByCategory(value);
    } else {
      this.selectedFilter = value;
      this.searchUsers();
    }
  }

  /**
   * Delete user
   */
  deleteUser(userId: string) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger ms-2'
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons
      .fire({
        title: 'Та итгэлтэй байна уу?',
        text: 'Энэ үйлдлийг буцаах боломжгүй!',
        icon: 'warning',
        confirmButtonText: 'Тийм, устга!',
        cancelButtonText: 'Үгүй, цуцла!',
        showCancelButton: true
      })
      .then(result => {
        if (result.value) {
          this.performDelete(userId);
        }
      });
  }

  /**
   * Perform delete operation
   */
  private async performDelete(userId: string) {
    try {
      await firebase.firestore().collection('users').doc(userId).delete();
      
      Swal.fire({
        title: 'Устгагдсан!',
        text: 'Хэрэглэгч амжилттай устгагдлаа.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh users list
      this.fetchUsersByCategory(this.userCategory);
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Хэрэглэгчийг устгахад алдаа гарлаа.',
        icon: 'error'
      });
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return 'Мэдээлэл алга';
  }

  /**
   * Refresh users data
   */
  refreshUsers() {
    this.sortField = '';
    this.sortDirection = 'asc';
    this.fetchUsersByCategory(this.userCategory);
  }

  /**
   * Get user's full name
   */
  getFullName(user: any): string {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${lastName} ${firstName}`.trim() || 'Нэр тодорхойгүй';
  }

  /**
   * Get user initials for avatar
   */
  getInitials(user: any): string {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const email = user.email || '';
    
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Get gold balance from balance map
   */
  getGoldBalance(user: any): number {
    return user.balance?.gold || 0;
  }

  /**
   * Get silver balance from balance map
   */
  getSilverBalance(user: any): number {
    return user.balance?.silver || 0;
  }

  /**
   * Get saving balance from balance map
   */
  getSavingBalance(user: any): number {
    return user.balance?.saving || 0;
  }

  /**
   * Format currency with K, M, B suffixes
   */
  formatCurrency(amount: number): string {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + 'тэрбум';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'сая';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'мянга';
    }
    return amount.toLocaleString();
  }

  /**
   * Sort users by field
   */
  sortUsers(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.filteredUsers.sort((a, b) => {
      let valueA = this.getSortValue(a, field);
      let valueB = this.getSortValue(b, field);
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    this.currentPage = 1; // Reset to first page after sorting
    this.updatePagination();
  }

  /**
   * Get sort value from user object
   */
  private getSortValue(user: any, field: string): any {
    switch (field) {
      case 'name':
        return this.getFullName(user);
      case 'email':
        return user.email || '';
      case 'phone':
        return user.phone || '';
      case 'registration_number':
        return user.registration_number || '';
      case 'gold':
        return user.balance?.gold || 0;
      case 'silver':
        return user.balance?.silver || 0;
      case 'saving':
        return user.balance?.saving || 0;
      case 'invest_total':
        return user.invest_total || 0;
      case 'created_at':
        return user.created_at?.toDate() || new Date(0);
      default:
        return '';
    }
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
   * Save investment using Investment Service
   */
  async saveInvestment() {
    console.log('Saving investment for user:', this.selectedUserId);
    console.log('Investment amount:', this.investmentAmount);
    console.log('Investment end date:', this.investmentEndDate);
    if (!this.selectedUserId || this.investmentAmount <= 0 || !this.investmentEndDate) {
      Swal.fire({
        title: 'Алдаа!',
        text: 'Бүх талбарыг зөв бөглөнө үү.',
        icon: 'error'
      });
      return;
    }

    // Validate end date is in the future
    if (this.investmentEndDate <= new Date()) {
      Swal.fire({
        title: 'Алдаа!',
        text: 'Дуусах огноо ирээдүйд байх ёстой.',
        icon: 'error'
      });
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Боловсруулж байна...',
      text: 'Хөрөнгө оруулалт үүсгэж байна.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Create investment request
      const investmentRequest: InvestmentRequest = this.investmentService.createInvestmentRequest(
        this.selectedUserId,
        this.investmentAmount,
        this.investmentEndDate
      );

      // Call Investment Service
      this.investmentService.makeInvestment(investmentRequest).subscribe({
        next: (response) => {
          console.log('Investment response:', response);
          
          if (response.status === 'success') {
            Swal.fire({
              title: 'Амжилттай!',
              html: `
                <p>Хөрөнгө оруулалт амжилттай үүсгэгдлээ.</p>
                <div class="text-start mt-3">
                  <small class="text-muted">
                    <strong>Хэрэглэгчийн ID:</strong> ${response.data?.userId}<br>
                    <strong>Хөрөнгө оруулсан дүн:</strong> ${response.data?.investmentAmount} гр<br>
                    <strong>Өмнөх алтны үлдэгдэл:</strong> ${response.data?.previousGoldBalance} гр<br>
                    <strong>Шинэ алтны үлдэгдэл:</strong> ${response.data?.newGoldBalance} гр<br>
                    <strong>Баталгаажуулсан:</strong> ${response.data?.verifiedBy}
                  </small>
                </div>
              `,
              icon: 'success',
              timer: 3000,
              showConfirmButton: true
            });

            this.modalRef?.hide();
            this.resetInvestmentForm();
            this.fetchUsersByCategory(this.userCategory); // Refresh users list
          } else {
            throw new Error(response.msg);
          }
        },
        error: (error) => {
          console.error('Investment error:', error);
          Swal.fire({
            title: 'Алдаа!',
            text: error.msg || 'Хөрөнгө оруулалт үүсгэхэд алдаа гарлаа.',
            icon: 'error'
          });
        }
      });

    } catch (error: any) {
      console.error('Error saving investment:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: error.message || 'Хөрөнгө оруулалт үүсгэхэд алдаа гарлаа.',
        icon: 'error'
      });
    }
  }

  /**
   * Reset investment form
   */
  resetInvestmentForm() {
    this.selectedUserId = '';
    this.selectedUser = null;
    this.investmentAmount = 0;
    this.investmentEndDate = new Date();
  }

  /**
   * Export users to Excel
   */
  exportToExcel() {
    try {
      // Get all filtered users (not just current page)
      let usersToExport = this.filteredUsers;
      
      if (usersToExport.length === 0) {
        Swal.fire({
          title: 'Анхааруулга!',
          text: 'Экспорт хийх хэрэглэгч байхгүй байна.',
          icon: 'warning'
        });
        return;
      }

      // Show loading
      Swal.fire({
        title: 'Боловсруулж байна...',
        text: 'Excel файл үүсгэж байна.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Prepare data for Excel
      const excelData = usersToExport.map((user, index) => ({
        'ID': user.id || '',
        'Овог': user.last_name || 'Байхгүй',
        'Нэр': user.first_name || 'Байхгүй',
        'Регистрийн дугаар': user.registration_number || 'Байхгүй',
        'Алтны хэмжээ': this.getGoldBalance(user) + ' гр',
        'Мөнгөний хэмжээ': this.getSilverBalance(user) + ' гр',
        'И-Мэйл хаяг': user.email || 'Байхгүй',
        'Утас': user.phone || 'Байхгүй',
        'Огноо': this.formatTimestamp(user.created_at) || 'Байхгүй'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // ID
        { wch: 15 }, // Овог
        { wch: 15 }, // Нэр
        { wch: 20 }, // Регистрийн дугаар
        { wch: 15 }, // Алтны хэмжээ
        { wch: 15 }, // Мөнгөний хэмжээ
        { wch: 30 }, // И-Мэйл хаяг
        { wch: 15 }, // Утас
        { wch: 20 }  // Огноо
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Хэрэглэгчид');

      // Generate filename with current date and filter info
      const currentDate = new Date().toISOString().split('T')[0];
      let filterInfo = '';
      if (this.searchTerm) filterInfo += '_хайлт';
      if (this.selectedFilter) filterInfo += '_шүүлт';
      if (this.dateFilter) filterInfo += '_огноо';
      
      const filename = `Хэрэглэгчдийн_жагсаалт_${currentDate}${filterInfo}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message
      Swal.fire({
        title: 'Амжилттай!',
        html: `
          <p>Excel файл амжилттай үүсгэгдлээ.</p>
          <div class="text-start mt-3">
            <small class="text-muted">
              <strong>Файлын нэр:</strong> ${filename}<br>
              <strong>Экспорт хийсэн хэрэглэгчдийн тоо:</strong> ${excelData.length}<br>
              <strong>Нийт хэрэглэгчдийн тоо:</strong> ${this.allUsers.length}<br>
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
   * Track by function for performance
   */
  trackByUser(index: number, item: any): string {
    return item.id;
  }

  /**
   * View user ledger in modal
   */
  async viewUser(content: TemplateRef<any>, user: any) {
    this.ledgerUser = user;
    this.ledgerData = null;
    this.ledgerLoading = true;
    this.modalRef = this.modalService.show(content, { class: 'modal-lg' });

    try {
      const doc = await firebase.firestore()
        .collection('ledger_transactions')
        .doc(user.id)
        .get();
      this.ledgerData = doc.exists ? doc.data() : null;
    } catch (err) {
      console.error('Ledger fetch error:', err);
      this.ledgerData = null;
    } finally {
      this.ledgerLoading = false;
    }
  }

  getLedgerUserName(): string {
    if (!this.ledgerUser) return '';
    return this.getFullName(this.ledgerUser);
  }

  getSortedTransactions(): any[] {
    if (!this.ledgerData?.transactions) return [];
    return [...this.ledgerData.transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  formatLedgerDate(dateVal: any): string {
    if (!dateVal) return '-';
    let d: Date;
    if (dateVal && typeof dateVal.toDate === 'function') {
      d = dateVal.toDate();
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  getLedgerDiff(): number {
    if (!this.ledgerData) return 0;
    return (this.ledgerData.balance_gold ?? 0) - (this.ledgerData.calculated_balance ?? 0);
  }

  getLedgerTypeBadge(type: string): string {
    const map: Record<string, string> = {
      order:          'badge bg-success-subtle text-success',
      withdraw:       'badge bg-danger-subtle text-danger',
      gift_sent:      'badge bg-warning-subtle text-warning',
      gift_recieved:  'badge bg-info-subtle text-info',
      gift_received:  'badge bg-info-subtle text-info',
      gift_cancelled: 'badge bg-secondary-subtle text-secondary',
      created_investment: 'badge bg-primary-subtle text-primary',
      closed_investment:  'badge bg-dark-subtle text-dark',
    };
    return map[type] ?? 'badge bg-light text-dark';
  }

  getLedgerTypeLabel(type: string): string {
    const map: Record<string, string> = {
      order:          'Захиалга',
      withdraw:       'Татан авалт',
      gift_sent:      'Бэлэг илгээсэн',
      gift_recieved:  'Бэлэг хүлээн авсан',
      gift_received:  'Бэлэг хүлээн авсан',
      gift_cancelled: 'Бэлэг цуцлагдсан',
      created_investment: 'Хөрөнгө оруулалт нээсэн',
      closed_investment:  'Хөрөнгө оруулалт хаасан',
    };
    return map[type] ?? type;
  }

  /**
   * Reset user PIN
   */
  async resetUserPin(user: any) {
    // Show confirmation modal
    const result = await Swal.fire({
      title: 'Пинкод reset хийх',
      html: `Та <strong>${user.last_name}</strong> овогтой <strong>${user.first_name}</strong>-н пинкодыг reset хийх гэж байна.<br><br>Энэ үйлдлийг буцаах боломжгүй. Та итгэлтэй байна уу?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Тийм, reset хий',
      cancelButtonText: 'Цуцлах',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const resetObservable = await this.userService.resetPin(user.id);
          return new Promise((resolve, reject) => {
            resetObservable.subscribe({
              next: (response) => {
                resolve(response);
              },
              error: (error) => {
                console.error('Reset PIN error:', error);
                reject(error);
              }
            });
          });
        } catch (error) {
          console.error('Reset PIN auth error:', error);
          Swal.showValidationMessage('Authentication алдаа гарлаа');
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed && result.value) {
      const response = result.value as any;
      
      if (response.status === 'success') {
        await Swal.fire({
          title: 'Амжилттай!',
          html: `
            <div class="text-start">
              <p><strong>Пинкод амжилттай reset хийгдлээ</strong></p>
              <hr>
              <p><strong>Хэрэглэгч:</strong> ${response.data.userPhone}</p>
              <p><strong>Reset хийсэн:</strong> ${response.data.resetBy}</p>
              <p><strong>Эрх:</strong> ${response.data.resetByRole}</p>
              <p><strong>Огноо:</strong> ${this.formatTimestamp(response.data.resetAt)}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Хаах',
          confirmButtonColor: '#28a745'
        });
      } else {
        await Swal.fire({
          title: 'Алдаа гарлаа!',
          text: response.msg || 'Пинкод reset хийхэд алдаа гарлаа',
          icon: 'error',
          confirmButtonText: 'Хаах',
          confirmButtonColor: '#d33'
        });
      }
    }
  }
}
