import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { OrderService } from 'src/app/core/services/order.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule,
    ModalModule,
    HttpClientModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  modalRef?: BsModalRef;

  // Orders data
  orders: any[] = [];
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedFilter: string = '';
  
  // Admin role
  adminRole: string = '';
  
  // Filtering properties
  filterType: string = '';
  startDateFilter: string = '';
  endDateFilter: string = '';
  paymentStatusFilter: string = '';
  adminStatusFilter: string = '';
  productFilter: string = '';
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

  // Modal state for order detail
  selectedOrderDetail: any = null;
  showOrderDetailModal: boolean = false;

  constructor(private modalService: BsModalService, private orderService: OrderService) {
  }

  ngOnInit(): void {
    // Get admin role first
    this.getAdminRole();
    // Set default payment status filter to show only paid orders
    this.paymentStatusFilter = 'success';
    // Load orders for last 7 days by default
    this.fetchOrdersByDateRange('week');
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
            console.log('Orders - Admin role:', this.adminRole);
          }
        }
      });
    } catch (error) {
      console.error('Admin role авахад алдаа:', error);
      this.adminRole = '';
    }
  }

  /**
   * Fetch orders filtered by a date range from Firestore
   * range: 'week' | 'month' | 'year' | 'all'
   */
  async fetchOrdersByDateRange(range: string, resetPage: boolean = true) {
    this.isLoading = true;
    this.dateRangeFilter = range;
    try {
      let query: any = firebase.firestore().collection('orders');

      if (range !== 'all') {
        const now = new Date();
        let startDate: Date;

        if (range === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (range === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
          // year
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }

        query = query.where('created_at', '>=', firebase.firestore.Timestamp.fromDate(startDate!));
      }

      const snapshot = await query.get();
      this.allOrders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Apply existing client-side filters
      this.searchOrders(resetPage);
      console.log(`Orders loaded for range "${range}":`, this.allOrders.length);
    } catch (error) {
      console.error('Error fetching orders by date range:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Захиалгуудын мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch orders from Firestore
   */
  async fetchOrders() {
    this.isLoading = true;
    try {
      // Get all orders for complete filtering functionality
      const allOrdersSnapshot = await firebase.firestore().collection('orders').get();
      this.allOrders = allOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Apply current filters
      this.searchOrders();
      console.log('Orders loaded:', this.allOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Захиалгуудын мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch only paid orders from Firestore (optimized)
   */
  async fetchPaidOrdersOnly() {
    this.isLoading = true;
    try {
      // Query only paid orders for better performance
      const paidOrdersSnapshot = await firebase.firestore()
        .collection('orders')
        .where('payment_status', '==', 'success')
        .get();
      
      const paidOrders = paidOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.allOrders = paidOrders;
      this.filteredOrders = [...paidOrders];
      
      // Apply default sorting
      this.applySorting();
      
      this.totalItems = this.filteredOrders.length;
      this.updatePagination();
      console.log('Paid orders loaded:', paidOrders.length);
    } catch (error) {
      console.error('Error fetching paid orders:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Төлөгдсөн захиалгуудын мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Search orders
   */
  searchOrders(resetPage: boolean = true) {
    let filteredOrders = this.allOrders;

    // Filter by search term
    if (this.searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        (order.client?.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.client?.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.client?.phone?.includes(this.searchTerm)) ||
        (order.client?.email?.includes(this.searchTerm)) ||
        (order.id?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.qpay_description?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by payment status
    if (this.paymentStatusFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.payment_status === this.paymentStatusFilter
      );
    }

    // Filter by admin status
    if (this.adminStatusFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.admin_status === this.adminStatusFilter
      );
    }

    // Filter by product type (metal_id)
    if (this.productFilter) {
      filteredOrders = filteredOrders.filter(order => {
        if (this.productFilter === 'gold') {
          return order.metal_id === 1;
        } else if (this.productFilter === 'silver') {
          return order.metal_id === 3;
        }
        return true;
      });
    }

    // Filter by start/end date range
    if (this.startDateFilter || this.endDateFilter) {
      filteredOrders = filteredOrders.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at.toDate());

        if (this.startDateFilter) {
          const start = new Date(this.startDateFilter);
          start.setHours(0,0,0,0);
          if (orderDate < start) return false;
        }

        if (this.endDateFilter) {
          const end = new Date(this.endDateFilter);
          end.setHours(23,59,59,999);
          if (orderDate > end) return false;
        }

        return true;
      });
    }

    this.filteredOrders = filteredOrders;
    
    // Apply default sorting by created_at desc
    this.applySorting();
    
    this.totalItems = this.filteredOrders.length;
    if (resetPage) {
      this.currentPage = 1;
    } else {
      // Ensure currentPage is still valid after filtering
      const maxPage = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
      }
    }
    this.updatePagination();
  }

  /**
   * Apply current sorting to filtered orders
   */
  applySorting() {
    if (this.sortField) {
      this.filteredOrders.sort((a, b) => {
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
   * Filter orders by date
   */
  filterByDate() {
    this.searchOrders();
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.searchOrders();
  }

  /**
   * Select payment status filter
   */
  selectPaymentStatusFilter(event: any) {
    this.paymentStatusFilter = event.target.value;
    
    // If user selects different filter and we only have paid orders, fetch all orders
    if (this.paymentStatusFilter !== 'success' && this.allOrders.length > 0) {
      const hasOnlyPaidOrders = this.allOrders.every(order => order.payment_status === 'success');
      if (hasOnlyPaidOrders) {
        this.fetchOrders(); // Fetch all orders for complete filtering
        return;
      }
    }
    
    this.searchOrders();
  }

  /**
   * Select admin status filter
   */
  selectAdminStatusFilter(event: any) {
    this.adminStatusFilter = event.target.value;
    
    // If we only have paid orders but user wants to filter by admin status, fetch all orders
    if (this.allOrders.length > 0) {
      const hasOnlyPaidOrders = this.allOrders.every(order => order.payment_status === 'success');
      if (hasOnlyPaidOrders && this.adminStatusFilter) {
        this.fetchOrders(); // Fetch all orders for complete filtering
        return;
      }
    }
    
    this.searchOrders();
  }

  /**
   * Select product filter
   */
  selectProductFilter(event: any) {
    this.productFilter = event.target.value;
    
    // If we only have paid orders but user wants to filter by product, fetch all orders
    if (this.allOrders.length > 0) {
      const hasOnlyPaidOrders = this.allOrders.every(order => order.payment_status === 'success');
      if (hasOnlyPaidOrders && this.productFilter) {
        this.fetchOrders(); // Fetch all orders for complete filtering
        return;
      }
    }
    
    this.searchOrders();
  }

  /**
   * Refresh orders
   */
  refreshOrders() {
    this.fetchOrdersByDateRange(this.dateRangeFilter, false);
  }

  /**
   * Update pagination
   */
  updatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    
    // Get current page orders
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.orders = this.filteredOrders.slice(startIndex, endIndex);
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
    const maxPages = 5; // Show maximum 5 page numbers
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
   * Sort orders
   */
  sortOrders(field: string) {
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
   * Get sort value for comparison
   */
  getSortValue(order: any, field: string): any {
    switch (field) {
      case 'client_name':
        return `${order.client?.first_name || ''} ${order.client?.last_name || ''}`.toLowerCase();
      case 'amount':
        return order.amount || 0;
      case 'quantity':
        return order.quantity || 0;
      case 'created_at':
        return order.created_at?.toDate() || new Date(0);
      case 'admin_status':
        return order.admin_status || '';
      case 'type':
        return order.type || '';
      default:
        return order[field] || '';
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
  getClientName(order: any): string {
    const firstName = order.client?.first_name || '';
    const lastName = order.client?.last_name || '';
    return `${lastName} ${firstName}`.trim() || 'Байхгүй';
  }

  /**
   * Get product type name
   */
  getProductTypeName(prodType: string): string {
    switch (prodType) {
      case 'bar':
        return 'Гулдмай';
      case 'ingot':
        return 'Ембүү';
      case 'earrings':
        return 'Ээмэг';
      case 'ring':
        return 'Бөгж';
      default:
        return prodType || 'Тодорхойгүй';
    }
  }

  /**
   * Get order status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge bg-warning';
      case 'success':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
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
      case 'success':
        return 'Баталгаажсан';
      case 'rejected':
        return 'Татгалзсан';
      default:
        return status || 'Тодорхойгүй';
    }
  }

  /**
   * Get type text
   */
  getTypeText(type: string): string {
    switch (type) {
      case 'deposit':
        return 'Орлого';
      case 'withdraw':
        return 'Зарлага';
      default:
        return type || 'Тодорхойгүй';
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByOrder(index: number, order: any): any {
    return order.id;
  }

  /**
   * Export orders to Excel
   */
  exportToExcel() {
    try {
      let ordersToExport = this.filteredOrders;
      
      if (ordersToExport.length === 0) {
        Swal.fire({
          title: 'Анхааруулга!',
          text: 'Экспорт хийх захиалга байхгүй байна.',
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
      const excelData = ordersToExport.map((order, index) => ({
        'Захиалгын ID': order.id || '',
        'Гүйлгээний утга': `ORDER-${order.id}`,
        'Хуучин гүйлгээний утга': order.qpay_description || '',
        'Харилцагчийн нэр': this.getClientName(order),
        'Утас': order.client?.phone || 'Байхгүй',
        'И-мэйл': order.client?.email || 'Байхгүй',
        'Төрөл': this.getTypeText(order.type),
        'Металл': order.metal_id === 1 ? 'Алт' : (order.metal_id === 3 ? 'Мөнгө' : 'Тодорхойгүй'),
        'Бүтээгдэхүүн төрөл': this.getProductTypeName(order.prod_type),
        'Дүн': order.amount || 0,
        'Тоо хэмжээ': order.quantity || 0,
        'Үнэ': order.price || 0,
        'Төлөв': this.getStatusText(order.admin_status),
        'Төлбөрийн төлөв': order.payment_status || '',
        'Огноо': this.formatTimestamp(order.created_at)
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Захиалгын ID
        { wch: 20 }, // Гүйлгээний утга
        { wch: 20 }, // Харилцагчийн нэр
        { wch: 15 }, // Утас
        { wch: 25 }, // И-мэйл
        { wch: 10 }, // Төрөл
        { wch: 15 }, // Бүтээгдэхүүн төрөл
        { wch: 15 }, // Дүн
        { wch: 12 }, // Тоо хэмжээ
        { wch: 15 }, // Үнэ
        { wch: 15 }, // Төлөв
        { wch: 15 }, // Төлбөрийн төлөв
        { wch: 20 }  // Огноо
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Захиалгууд');

      // Generate filename with current date and filter info
      const currentDate = new Date().toISOString().split('T')[0];
      let filterInfo = '';
      if (this.searchTerm) filterInfo += '_хайлт';
      if (this.selectedFilter) filterInfo += '_шүүлт';
      if (this.startDateFilter || this.endDateFilter) filterInfo += '_огноо';
      
      const filename = `Захиалгуудын_жагсаалт_${currentDate}${filterInfo}.xlsx`;

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
              <strong>Экспорт хийсэн захиалгын тоо:</strong> ${excelData.length}<br>
              <strong>Нийт захиалгын тоо:</strong> ${this.allOrders.length}<br>
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
   * Захиалгыг verify хийх
   */
  async verifyOrderHandler(order: any) {
    const result = await Swal.fire({
      title: 'Баталгаажуулах уу?',
      html: `
        <div class="text-start">
          <p>Та <b>${order.client.last_name}</b> овогтой <b>${order.client.first_name}</b>-ийн <b>${order.quantity} гр</b>-н захиалгыг баталгаажуулахдаа итгэлтэй байна уу?</p>
          
          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" id="isExtraOrder">
            <label class="form-check-label" for="isExtraOrder">
              Онцгой захиалга
            </label>
          </div>
          
          <div class="mt-3">
            <label for="orderDescription" class="form-label">Тайлбар:</label>
            <textarea class="form-control" id="orderDescription" rows="3" placeholder="Захиалгын тайлбар..."></textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<span id="swal-confirm-btn-text">Тийм, баталгаажуулна</span><span id="swal-confirm-btn-loader" style="display:none;margin-left:8px;"><i class="fa fa-spinner fa-spin"></i></span>',
      cancelButtonText: 'Үгүй',
      focusCancel: true,
      allowOutsideClick: false,
      preConfirm: async () => {
        // Get form values
        const isExtraOrder = (document.getElementById('isExtraOrder') as HTMLInputElement)?.checked || false;
        const description = (document.getElementById('orderDescription') as HTMLTextAreaElement)?.value || '';
        
        // Loader харуулах
        const btnText = document.getElementById('swal-confirm-btn-text');
        const btnLoader = document.getElementById('swal-confirm-btn-loader');
        if (btnText && btnLoader) {
          btnText.style.display = 'none';
          btnLoader.style.display = 'inline-block';
        }
        try {
          // Firebase-аас одоогийн хэрэглэгчийн токен авах
          const user = firebase.auth().currentUser;
          if (!user) throw new Error('Админ эрхээр нэвтэрсэн эсэхээ шалгана уу.');
          const token = await user.getIdToken();
          return await this.orderService.verifyOrder(order.user_id, order.id, token, isExtraOrder, description).toPromise();
        } catch (err: any) {
          throw new Error(err?.error || err?.message || 'Үйлдэл амжилтгүй.');
        }
      }
    });
    if (!result.isConfirmed) return;
    // Амжилттай болвол
    if (result.value) {
      this.refreshOrders();
      const res = result.value;
      if (res.status === 'verified') {
        Swal.fire('Амжилттай',
          `<div class="text-start">
            <b>Статус:</b> ${res.status}<br>
            <b>Металл:</b> ${res.metal_id === 1 ? 'Алт' : 'Мөнгө'}<br>
            <b>Тоо хэмжээ:</b> ${res.qty} гр<br>
            <b>Баталгаажуулсан:</b> ${res.performed_by}
          </div>`,
          'success');
      } else if (res.status === 'already_verified') {
        Swal.fire('Анхааруулга', `<b>${res.performed_by}</b> аль хэдийн баталгаажуулсан.`, 'info');
      } else {
        Swal.fire('Амжилтгүй', 'Тодорхойгүй хариу.', 'warning');
      }
    }
    // Алдаа болвол
    if (result.dismiss === Swal.DismissReason.cancel) return;
    if (result.isDenied || result.isDismissed) return;
    if (result.isConfirmed && result.value === undefined) {
      Swal.fire('Алдаа', 'Үйлдэл амжилтгүй.', 'error');
    }
  }

  /**
   * Show order detail modal using SweetAlert
   */
  openOrderDetailModal(order: any) {
    const verifiedAtText = this.formatVerifiedAt(order.verified_at);
    const verifiedByName = order.verified_by_name || 'Тодорхойгүй';
    
    Swal.fire({
      title: 'Захиалгын дэлгэрэнгүй мэдээлэл',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <h6><i class="mdi mdi-account me-2"></i>Харилцагчийн мэдээлэл</h6>
            <p class="mb-1"><b>Нэр:</b> ${this.getClientName(order)}</p>
            <p class="mb-1"><b>Утас:</b> ${order.client?.phone || 'Байхгүй'}</p>
            <p class="mb-1"><b>И-мэйл:</b> ${order.client?.email || 'Байхгүй'}</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-package me-2"></i>Захиалгын мэдээлэл</h6>
            <p class="mb-1"><b>Захиалгын ID:</b> ${order.id}</p>
            <p class="mb-1"><b>Бүтээгдэхүүн:</b> ${this.getProductTypeName(order.prod_type)}</p>
            <p class="mb-1"><b>Металл:</b> ${order.metal_id === 1 ? 'Алт' : 'Мөнгө'}</p>
            <p class="mb-1"><b>Тоо хэмжээ:</b> ${order.quantity} гр</p>
            <p class="mb-1"><b>Үнэ:</b> ${order.price?.toLocaleString()} ₮</p>
            <p class="mb-1"><b>Нийт дүн:</b> ${order.amount?.toLocaleString()} ₮</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-check-circle me-2"></i>Баталгаажуулалтын мэдээлэл</h6>
            <p class="mb-1"><b>Баталгаажуулсан огноо:</b> ${verifiedAtText}</p>
            <p class="mb-1"><b>Баталгаажуулсан админ:</b> ${verifiedByName}</p>
            <p class="mb-1"><b>Админ ID:</b> ${order.verified_by_uid || 'Байхгүй'}</p>
          </div>
          
          <div class="mb-3">
            <h6><i class="mdi mdi-clock me-2"></i>Огнооны мэдээлэл</h6>
            <p class="mb-1"><b>Захиалга үүсгэсэн:</b> ${this.formatTimestamp(order.created_at)}</p>
            <p class="mb-1"><b>QPay дугаар:</b> ${order.qpay_description || 'Байхгүй'}</p>
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
   * Format Firestore timestamp or JS Date
   */
  formatVerifiedAt(ts: any): string {
    if (!ts) return 'Байхгүй';
    try {
      let date: Date;
      if (typeof ts.toDate === 'function') {
        date = ts.toDate();
      } else {
        date = new Date(ts);
      }
      return date.toLocaleString('mn-MN');
    } catch (e) {
      return 'Алдаатай огноо';
    }
  }
}
