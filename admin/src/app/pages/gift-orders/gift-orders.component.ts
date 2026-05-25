import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-gift-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule
  ],
  templateUrl: './gift-orders.component.html',
  styleUrl: './gift-orders.component.css'
})
export class GiftOrdersComponent implements OnInit {

  // Gift orders data
  giftOrders: any[] = [];
  allGiftOrders: any[] = [];
  filteredGiftOrders: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Filtering properties
  statusFilter: string = '';
  metalFilter: string = '';
  dateFilter: string = '';
  
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

  constructor() { }

  ngOnInit(): void {
    this.fetchGiftOrders();
  }

  /**
   * Fetch gift orders from Firestore
   */
  async fetchGiftOrders() {
    this.isLoading = true;
    try {
      const giftOrdersSnapshot = await firebase.firestore().collection('gift_orders').get();
      this.allGiftOrders = giftOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.searchGiftOrders();
      console.log('Gift orders loaded:', this.allGiftOrders.length);
    } catch (error) {
      console.error('Error fetching gift orders:', error);
      Swal.fire({
        title: 'Алдаа!',
        text: 'Бэлгийн захиалгуудын мэдээлэл татахад алдаа гарлаа.',
        icon: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Search gift orders
   */
  searchGiftOrders() {
    let filteredOrders = this.allGiftOrders;

    // Filter by search term
    if (this.searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        (order.sender?.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.sender?.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.receiver?.first_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.receiver?.last_name?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.sender?.phone?.includes(this.searchTerm)) ||
        (order.receiver?.phone?.includes(this.searchTerm)) ||
        (order.id?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (order.greeting?.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (this.statusFilter) {
      filteredOrders = filteredOrders.filter(order => 
        order.status === this.statusFilter
      );
    }

    // Filter by metal type
    if (this.metalFilter) {
      filteredOrders = filteredOrders.filter(order => {
        if (this.metalFilter === 'gold') {
          return order.metal_id === 1;
        } else if (this.metalFilter === 'silver') {
          return order.metal_id === 3;
        }
        return true;
      });
    }

    // Filter by date
    if (this.dateFilter) {
      filteredOrders = filteredOrders.filter(order => {
        if (order.created_at) {
          const orderDate = new Date(order.created_at.toDate());
          const filterDate = new Date(this.dateFilter);
          
          return orderDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    this.filteredGiftOrders = filteredOrders;
    
    // Apply sorting
    this.applySorting();
    
    this.totalItems = this.filteredGiftOrders.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Apply current sorting to filtered orders
   */
  applySorting() {
    if (this.sortField) {
      this.filteredGiftOrders.sort((a, b) => {
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
  getSortValue(order: any, field: string): any {
    switch (field) {
      case 'sender_name':
        return `${order.sender?.first_name || ''} ${order.sender?.last_name || ''}`.toLowerCase();
      case 'receiver_name':
        return `${order.receiver?.first_name || ''} ${order.receiver?.last_name || ''}`.toLowerCase();
      case 'quantity':
        return order.quantity || 0;
      case 'created_at':
        return order.created_at?.toDate() || new Date(0);
      case 'status':
        return order.status || '';
      default:
        return order[field] || '';
    }
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
    this.giftOrders = this.filteredGiftOrders.slice(startIndex, endIndex);
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
    this.searchGiftOrders();
  }

  /**
   * Select metal filter
   */
  selectMetalFilter(event: any) {
    this.metalFilter = event.target.value;
    this.searchGiftOrders();
  }

  /**
   * Filter by date
   */
  filterByDate() {
    this.searchGiftOrders();
  }

  /**
   * Clear date filter
   */
  clearDateFilter() {
    this.dateFilter = '';
    this.searchGiftOrders();
  }

  /**
   * Refresh gift orders
   */
  refreshGiftOrders() {
    this.fetchGiftOrders();
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
   * Get sender full name
   */
  getSenderName(order: any): string {
    const firstName = order.sender?.first_name || '';
    const lastName = order.sender?.last_name || '';
    return `${lastName} ${firstName}`.trim() || 'Байхгүй';
  }

  /**
   * Get receiver full name
   */
  getReceiverName(order: any): string {
    const firstName = order.receiver?.first_name || '';
    const lastName = order.receiver?.last_name || '';
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
      case 'sent':
        return 'badge bg-info';
      case 'received':
        return 'badge bg-success';
      case 'cancelled':
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
      case 'sent':
        return 'Илгээгдсэн';
      case 'received':
        return 'Хүлээн авсан';
      case 'cancelled':
        return 'Цуцалсан';
      default:
        return status || 'Тодорхойгүй';
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByGiftOrder(index: number, order: any): any {
    return order.id;
  }

  /**
   * Export to Excel
   */
  exportToExcel() {
    try {
      if (this.filteredGiftOrders.length === 0) {
        Swal.fire({
          title: 'Анхааруулга!',
          text: 'Экспорт хийх бэлгийн захиалга байхгүй байна.',
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

      const excelData = this.filteredGiftOrders.map((order) => ({
        'Бэлгийн захиалгын ID': order.id || '',
        'Илгээгч нэр': this.getSenderName(order),
        'Илгээгч утас': order.sender?.phone || 'Байхгүй',
        'Илгээгч и-мэйл': order.sender?.email || 'Байхгүй',
        'Хүлээн авагч нэр': this.getReceiverName(order),
        'Хүлээн авагч утас': order.receiver?.phone || 'Байхгүй',
        'Хүлээн авагч и-мэйл': order.receiver?.email || 'Байхгүй',
        'Металл төрөл': this.getMetalTypeName(order.metal_id),
        'Тоо хэмжээ': order.quantity || 0,
        'Мэндчилгээ': order.greeting || 'Байхгүй',
        'Төлөв': this.getStatusText(order.status),
        'Үүсгэсэн огноо': this.formatTimestamp(order.created_at),
        'Шинэчилсэн огноо': this.formatTimestamp(order.updated_at),
        'Цуцалсан огноо': this.formatTimestamp(order.cancelled_at),
        'Хүлээн авсан огноо': this.formatTimestamp(order.received_at)
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 25 }, // ID
        { wch: 20 }, // Илгээгч нэр
        { wch: 15 }, // Илгээгч утас
        { wch: 25 }, // Илгээгч и-мэйл
        { wch: 20 }, // Хүлээн авагч нэр
        { wch: 15 }, // Хүлээн авагч утас
        { wch: 25 }, // Хүлээн авагч и-мэйл
        { wch: 12 }, // Металл төрөл
        { wch: 12 }, // Тоо хэмжээ
        { wch: 30 }, // Мэндчилгээ
        { wch: 15 }, // Төлөв
        { wch: 20 }, // Үүсгэсэн огноо
        { wch: 20 }, // Шинэчилсэн огноо
        { wch: 20 }, // Цуцалсан огноо
        { wch: 20 }  // Хүлээн авсан огноо
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Бэлгийн захиалгууд');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Бэлгийн_захиалгуудын_жагсаалт_${currentDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      Swal.fire({
        title: 'Амжилттай!',
        html: `
          <p>Excel файл амжилттай үүсгэгдлээ.</p>
          <div class="text-start mt-3">
            <small class="text-muted">
              <strong>Файлын нэр:</strong> ${filename}<br>
              <strong>Экспорт хийсэн захиалгын тоо:</strong> ${excelData.length}<br>
              <strong>Нийт захиалгын тоо:</strong> ${this.allGiftOrders.length}<br>
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
}
