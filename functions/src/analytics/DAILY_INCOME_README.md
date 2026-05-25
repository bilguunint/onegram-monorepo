# Daily Income Analytics Service

## Тайлбар
Энэ service нь өдөр бүрийн орлогыг (successful orders-ийн нийт дүн) бүртгэж, хадгалдаг.

## Database Structure

```
analytics/
  └── daily_incomes/
      └── data/
          ├── 2025-10-14/
          │   ├── date: "2025-10-14"
          │   ├── total_amount: 5062000
          │   ├── order_count: 15
          │   └── last_updated: Timestamp
          ├── 2025-10-15/
          └── ...
```

## Endpoints

### 1. Initialize Daily Income (Анхны бүртгэл)

**URL**: `https://your-region-your-project.cloudfunctions.net/initializeDailyIncome`

**Method**: POST

**Description**: Бүх амжилттай захиалгуудаас өдөр бүрийн орлогыг тооцоолж анх удаа бүртгэнэ.

**Request**:
```bash
POST /initializeDailyIncome
```

**Response**:
```json
{
  "success": true,
  "message": "Daily income initialized successfully",
  "stats": {
    "total_days": 120,
    "total_orders": 1543
  }
}
```

**Usage**:
```typescript
// Angular Service
initializeDailyIncome(): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/initializeDailyIncome`,
    {}
  );
}
```

---

### 2. Get Daily Income (Өдрийн орлого авах)

**URL**: `https://your-region-your-project.cloudfunctions.net/getDailyIncome`

**Method**: GET

**Authentication**: Bearer Token (Optional - санал болгосон)

**Query Parameters**:
- `startDate` (optional): Эхлэх огноо (YYYY-MM-DD)
- `endDate` (optional): Дуусах огноо (YYYY-MM-DD)

**Request Examples**:
```bash
# Get all daily income (last 100 days)
GET /getDailyIncome

# Get specific date range
GET /getDailyIncome?startDate=2025-10-01&endDate=2025-10-14

# Get from specific date onwards
GET /getDailyIncome?startDate=2025-10-01
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-14",
      "total_amount": 5062000,
      "order_count": 15,
      "last_updated": "2025-10-14T08:30:15.123Z"
    },
    {
      "date": "2025-10-13",
      "total_amount": 4850000,
      "order_count": 12,
      "last_updated": "2025-10-13T23:45:20.456Z"
    }
  ],
  "summary": {
    "total_days": 14,
    "total_income": 68420000
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Error Response (500)**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Angular TypeScript Implementation

### Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DailyIncomeData {
  date: string;
  total_amount: number;
  order_count: number;
  last_updated: string;
}

export interface DailyIncomeResponse {
  success: boolean;
  data?: DailyIncomeData[];
  summary?: {
    total_days: number;
    total_income: number;
  };
  error?: string;
}

export interface InitializeResponse {
  success: boolean;
  message?: string;
  stats?: {
    total_days: number;
    total_orders: number;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DailyIncomeService {
  private readonly baseUrl = 'https://your-region-your-project.cloudfunctions.net';

  constructor(private http: HttpClient) {}

  /**
   * Initialize daily income analytics
   */
  initializeDailyIncome(): Observable<InitializeResponse> {
    return this.http.post<InitializeResponse>(
      `${this.baseUrl}/initializeDailyIncome`,
      {}
    );
  }

  /**
   * Get daily income data
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param adminToken - Optional admin token for authentication
   */
  getDailyIncome(
    startDate?: string,
    endDate?: string,
    adminToken?: string
  ): Observable<DailyIncomeResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    let headers = new HttpHeaders();
    if (adminToken) {
      headers = headers.set('Authorization', `Bearer ${adminToken}`);
    }

    return this.http.get<DailyIncomeResponse>(
      `${this.baseUrl}/getDailyIncome`,
      { params, headers }
    );
  }

  /**
   * Get daily income for current month
   */
  getCurrentMonthIncome(adminToken?: string): Observable<DailyIncomeResponse> {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return this.getDailyIncome(startDate, endDate, adminToken);
  }

  /**
   * Get daily income for last N days
   */
  getLastNDaysIncome(days: number, adminToken?: string): Observable<DailyIncomeResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    return this.getDailyIncome(start, end, adminToken);
  }
}
```

### Component Example

```typescript
import { Component, OnInit } from '@angular/core';
import { DailyIncomeService, DailyIncomeData } from '../../services/daily-income.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-daily-income',
  template: `
    <div class="daily-income-container">
      <h2>Daily Income Analytics</h2>
      
      <!-- Date Range Filter -->
      <div class="filters">
        <input type="date" [(ngModel)]="startDate" (change)="loadData()">
        <input type="date" [(ngModel)]="endDate" (change)="loadData()">
        <button (click)="loadData()">Load</button>
        <button (click)="loadLast7Days()">Last 7 Days</button>
        <button (click)="loadLast30Days()">Last 30 Days</button>
        <button (click)="loadCurrentMonth()">This Month</button>
      </div>

      <!-- Summary -->
      <div *ngIf="summary" class="summary">
        <div class="summary-item">
          <span>Total Days:</span>
          <strong>{{ summary.total_days }}</strong>
        </div>
        <div class="summary-item">
          <span>Total Income:</span>
          <strong>{{ summary.total_income | number }} ₮</strong>
        </div>
        <div class="summary-item">
          <span>Average Daily:</span>
          <strong>{{ getAverageDaily() | number }} ₮</strong>
        </div>
      </div>

      <!-- Data Table -->
      <div *ngIf="loading" class="loading">Loading...</div>
      
      <table *ngIf="!loading && dailyData.length > 0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Order Count</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of dailyData">
            <td>{{ item.date }}</td>
            <td>{{ item.total_amount | number }} ₮</td>
            <td>{{ item.order_count }}</td>
            <td>{{ item.last_updated | date:'short' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Chart -->
      <div *ngIf="dailyData.length > 0" class="chart">
        <!-- Integrate with Chart.js or any chart library -->
      </div>

      <!-- No Data -->
      <div *ngIf="!loading && dailyData.length === 0" class="no-data">
        No data available for selected period
      </div>

      <!-- Initialize Button (for admins only) -->
      <div *ngIf="isAdmin" class="admin-actions">
        <button (click)="initializeData()" 
                [disabled]="initializing"
                class="btn-danger">
          {{ initializing ? 'Initializing...' : 'Initialize Daily Income' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .daily-income-container { padding: 20px; }
    .filters { margin-bottom: 20px; }
    .filters input, .filters button { margin-right: 10px; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .summary-item { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    th { background-color: #f5f5f5; }
    .loading, .no-data { text-align: center; padding: 40px; color: #999; }
    .btn-danger { background-color: #dc3545; color: white; padding: 10px 20px; }
  `]
})
export class DailyIncomeComponent implements OnInit {
  dailyData: DailyIncomeData[] = [];
  summary: any = null;
  loading = false;
  initializing = false;
  isAdmin = false;
  startDate: string = '';
  endDate: string = '';

  constructor(
    private dailyIncomeService: DailyIncomeService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.isAdmin = await this.authService.isAdmin();
    this.loadLast30Days();
  }

  async loadData() {
    this.loading = true;
    const token = await this.authService.getIdToken();

    this.dailyIncomeService.getDailyIncome(
      this.startDate || undefined,
      this.endDate || undefined,
      token
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.dailyData = response.data || [];
          this.summary = response.summary;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading daily income:', error);
        this.loading = false;
      }
    });
  }

  loadLast7Days() {
    this.loading = true;
    this.authService.getIdToken().then(token => {
      this.dailyIncomeService.getLastNDaysIncome(7, token).subscribe({
        next: (response) => {
          if (response.success) {
            this.dailyData = response.data || [];
            this.summary = response.summary;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      });
    });
  }

  loadLast30Days() {
    this.loading = true;
    this.authService.getIdToken().then(token => {
      this.dailyIncomeService.getLastNDaysIncome(30, token).subscribe({
        next: (response) => {
          if (response.success) {
            this.dailyData = response.data || [];
            this.summary = response.summary;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      });
    });
  }

  loadCurrentMonth() {
    this.loading = true;
    this.authService.getIdToken().then(token => {
      this.dailyIncomeService.getCurrentMonthIncome(token).subscribe({
        next: (response) => {
          if (response.success) {
            this.dailyData = response.data || [];
            this.summary = response.summary;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      });
    });
  }

  getAverageDaily(): number {
    if (!this.summary || this.summary.total_days === 0) return 0;
    return this.summary.total_income / this.summary.total_days;
  }

  initializeData() {
    const confirmed = confirm(
      'This will process all successful orders and initialize daily income data. Continue?'
    );
    
    if (!confirmed) return;

    this.initializing = true;
    this.dailyIncomeService.initializeDailyIncome().subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Initialization complete! Processed ${response.stats?.total_orders} orders across ${response.stats?.total_days} days.`);
          this.loadLast30Days();
        }
        this.initializing = false;
      },
      error: (error) => {
        console.error('Initialization error:', error);
        alert('Initialization failed. Check console for details.');
        this.initializing = false;
      }
    });
  }
}
```

## Automatic Updates

**analyticsService.js** файлд автоматаар daily income шинэчлэгддэг:

- Order шинээр үүсэх үед: `admin_status === "success"` бол өдрийн орлогод нэмэгдэнэ
- Order update хийгдэх үед: 
  - `admin_status` "success" болох үед орлогод нэмэгдэнэ
  - `admin_status` "success"-аас өөр болох үед орлогоос хасагдана

## Testing

```bash
# 1. Initialize (нэг удаа ажиллуулна)
curl -X POST https://your-region-your-project.cloudfunctions.net/initializeDailyIncome

# 2. Get all data
curl https://your-region-your-project.cloudfunctions.net/getDailyIncome

# 3. Get specific date range
curl "https://your-region-your-project.cloudfunctions.net/getDailyIncome?startDate=2025-10-01&endDate=2025-10-14"

# 4. With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-region-your-project.cloudfunctions.net/getDailyIncome
```

## Notes

- Daily income нь зөвхөн `admin_status === "success"` төлөвтэй захиалгуудыг тооцдог
- Firestore transaction ашигладаг тул data consistency баталгаажна
- Өдөр бүрийн мэдээлэл автоматаар шинэчлэгддэг (triggers ашиглан)
- 100 өдрийн мэдээллийг нэг дор буцаана (query limit)
- Authentication optional тохируулсан (шаардлагатай бол идэвхжүүлж болно)
