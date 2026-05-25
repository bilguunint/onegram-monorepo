import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { emailSentBarChart, monthlyEarningChart, earningLineChart } from './data';
import { bitconinChart } from '../crypto/data';
import { ChartType } from './dashboard.model';
import { BsModalService, BsModalRef, ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
import { EventService } from '../../../core/services/event.service';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { ConfigService } from '../../../core/services/config.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TransactionComponent } from 'src/app/shared/widget/transaction/transaction.component';
import { PagetitleComponent } from 'src/app/shared/ui/pagetitle/pagetitle.component';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  standalone:true,
  imports:[PagetitleComponent,CommonModule,NgApexchartsModule,BsDropdownModule,ModalModule,TransactionComponent]
})
export class DefaultComponent implements OnInit {
  modalRef?: BsModalRef;
  isVisible: string;

  emailSentBarChart: ChartType;
  monthlyEarningChart: ChartType;
  earningLineChart: any;
  bitconinChart: any;
  transactions: any;
  statData: any;
  
  // Analytics data from Firestore
  analyticsData: any = {
    total_users: 0,
    total_orders: 0,
    successful_orders: 0,
    total_investments: 0,
    total_revenue_all_time: 0,
    total_gold_sold_all_time: 0,
    total_silver_sold_all_time: 0,
    total_gold_withdraws_all_time: 0,
    total_silver_withdraws_all_time: 0,
    users_with_gold: 0,
    last_updated: null
  };
  
  // Total investors count
  totalInvestors: number = 0;
  
  // Gold rate data from Firestore
  goldRateData: any = {
    rate: 0,
    changes: 0,
    name: '',
    updated_at: null
  };
  
  // Monthly data from Firestore
  monthlyData: any = {
    current_month: {
      month: '',
      total_revenue: 0,
      total_orders: 0,
      successful_orders: 0,
      total_gold_sold: 0,
      last_updated: null
    },
    previous_month: {
      month: '',
      total_revenue: 0,
      total_orders: 0,
      successful_orders: 0,
      total_gold_sold: 0
    }
  };
  
  // Monthly data list for table
  monthlyDataList: any[] = [];
  
  // Daily rates data for chart
  dailyRatesData: any[] = [];

  // Gold balance distribution data from Firestore
  goldBalanceDistribution: any = {
    totalGoldInSystem: 0,
    totalUsers: 0,
    uniqueBalanceCount: 0,
    usersWithGold: 0,
    usersWithoutGold: 0,
    distribution: []
  };
  goldDistributionPreview: any[] = [];
  
  // User count data for chart
  activeUserPeriod: string = '1m';
  userCountChart: any = {
    series: [{
      name: 'Шинэ хэрэглэгч',
      data: []
    }],
    chart: {
      height: 288,
      type: 'line',
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        color: '#000',
        top: 18,
        left: 7,
        blur: 8,
        opacity: 0.2
      },
      events: {
        mounted: (chart: any) => {
          // Disable passive event listeners for chart interactions
          chart.w.globals.dom.base.style.touchAction = 'pan-x pan-y';
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#556ee6'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MM/dd'
      }
    },
    yaxis: {
      title: {
        text: 'Хэрэглэгчийн тоо'
      }
    }
  };
  
  goldPriceChart: any = {
    series: [{
      name: 'Алтны ханш',
      data: [31, 40, 36, 51, 49, 72, 69, 56, 68, 82]
    }],
    chart: {
      type: 'area',
      height: 40,
      sparkline: {
        enabled: true
      },
      events: {
        mounted: (chart: any) => {
          chart.w.globals.dom.base.style.touchAction = 'pan-x pan-y';
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: ['#f1b44c'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [25, 100, 100, 100]
      },
    }
  };
  
  // Daily sales chart
  activeSalesPeriod: string = '1m';
  dailySalesChart: any = {
    series: [{
      name: 'Борлуулалт',
      data: []
    }],
    chart: {
      height: 288,
      type: 'line',
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        color: '#000',
        top: 18,
        left: 7,
        blur: 8,
        opacity: 0.2
      },
      events: {
        mounted: (chart: any) => {
          chart.w.globals.dom.base.style.touchAction = 'pan-x pan-y';
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#34c38f'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MM/dd'
      }
    },
    yaxis: {
      title: {
        text: 'Дүн (₮)'
      },
      labels: {
        formatter: function(val: number) {
          return '₮' + val.toLocaleString();
        }
      }
    }
  };
  
  isLoadingAnalytics: boolean = false;
  
  config:any = {
    backdrop: true,
    ignoreBackdropClick: true
  };

  isActive: string;

  @ViewChild('content') content;
  @ViewChild('center', { static: false }) center?: ModalDirective;
  @ViewChild('distributionModal', { static: false }) distributionModal?: ModalDirective;
  constructor(private modalService: BsModalService, private configService: ConfigService, private eventService: EventService) {
  }

  ngOnInit() {

    /**
     * horizontal-vertical layput set
     */
    const attribute = document.body.getAttribute('data-layout');

    this.isVisible = attribute;
    const vertical = document.getElementById('layout-vertical');
    if (vertical != null) {
      vertical.setAttribute('checked', 'true');
    }
    if (attribute == 'horizontal') {
      const horizontal = document.getElementById('layout-horizontal');
      if (horizontal != null) {
        horizontal.setAttribute('checked', 'true');
      }
    }

    /**
     * Fetches the data
     */
    this.fetchData();
  }

  /**
   * Fetches the data
   */
  private fetchData() {
    this.emailSentBarChart = emailSentBarChart;
    this.monthlyEarningChart = monthlyEarningChart;
    this.earningLineChart = {
      ...earningLineChart,
      chart: {
        ...earningLineChart.chart,
        events: {
          mounted: (chart: any) => {
            chart.w.globals.dom.base.style.touchAction = 'pan-x pan-y';
          }
        }
      }
    };
    this.bitconinChart = {
      ...bitconinChart,
      chart: {
        ...bitconinChart.chart,
        events: {
          mounted: (chart: any) => {
            chart.w.globals.dom.base.style.touchAction = 'pan-x pan-y';
          }
        }
      }
    };

    this.isActive = 'year';
    this.configService.getConfig().subscribe(data => {
      this.transactions = data.transactions;
      this.statData = data.statData;
    });

    // Fetch analytics data from Firestore
    this.fetchAnalyticsData();
    
    // Fetch investors count
    this.fetchInvestorsCount();
    
    // Fetch gold rate data from Firestore
    this.fetchGoldRateData();
    
    // Fetch daily user count data from Firestore
    this.fetchDailyUsersData();
    
    // Fetch daily sales data from Firestore
    this.fetchDailySalesData();
    
    // Fetch monthly data from Firestore
    this.fetchMonthlyData();

    // Fetch gold balance distribution
    this.fetchGoldBalanceDistribution();
  }

  /**
   * Fetch analytics data from Firestore
   */
  private async fetchAnalyticsData() {
    this.isLoadingAnalytics = true;
    try {
      const analyticsDoc = await firebase.firestore()
        .collection('analytics')
        .doc('overall')
        .get();

      if (analyticsDoc.exists) {
        const data = analyticsDoc.data();
        this.analyticsData = {
          total_users: data?.total_users || 0,
          total_orders: data?.total_orders || 0,
          successful_orders: data?.successful_orders || 0,
          total_investments: data?.total_investments || 0,
          total_revenue_all_time: data?.total_revenue_all_time || 0,
          total_gold_sold_all_time: data?.total_gold_sold_all_time || 0,
          total_silver_sold_all_time: data?.total_silver_sold_all_time || 0,
          total_gold_withdraws_all_time: data?.total_gold_withdraws_all_time || 0,
          total_silver_withdraws_all_time: data?.total_silver_withdraws_all_time || 0,
          users_with_gold: data?.users_with_gold || 0,
          last_updated: data?.last_updated || null
        };
        
        console.log('Analytics data loaded:', this.analyticsData);
      } else {
        console.log('Analytics document does not exist');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      this.isLoadingAnalytics = false;
    }
  }
  /**
   * Refresh analytics data
   */
  refreshAnalyticsData() {
    this.fetchAnalyticsData();
    this.fetchGoldRateData();
    this.fetchDailyUsersData();
    this.fetchMonthlyData();
  }

  /**
   * Fetch gold rate data from Firestore
   */
  private async fetchGoldRateData() {
    try {
      // Fetch current gold rate
      const goldRateDoc = await firebase.firestore()
        .collection('latest_rates')
        .doc('latest_gold_rate')
        .get();

      if (goldRateDoc.exists) {
        const data = goldRateDoc.data();
        this.goldRateData = {
          rate: data?.rate || 0,
          changes: data?.changes || 0,
          name: data?.name || 'Алт',
          updated_at: data?.updated_at || null
        };
      } else {
        console.log('Gold rate document not found');
      }

      // Fetch daily rates for chart from rates collection
      const ratesQuery = await firebase.firestore()
        .collection('rates')
        .where('name', '==', 'Алт')
        .orderBy('date', 'desc')
        .limit(30) // Last 30 days
        .get();

      if (!ratesQuery.empty) {
        const rates: number[] = [];
        ratesQuery.docs.reverse().forEach(doc => {
          const docData = doc.data();
          rates.push(docData.rate || 0);
        });

        // Update chart data with real rates
        this.goldPriceChart = {
          ...this.goldPriceChart,
          series: [{
            name: 'Алтны ханш',
            data: rates
          }]
        };
      }

    } catch (error) {
      console.error('Error fetching gold rate data:', error);
    }
  }

  /**
   * Fetch daily user count data from Firestore
   */
  private async fetchDailyUsersData() {
    try {
      const userDataDoc = await firebase.firestore()
        .collection('analytics')
        .doc('daily_users')
        .collection('data')
        .get();

      if (!userDataDoc.empty) {
        const dates: any = {};
        userDataDoc.docs.forEach(doc => {
          const docData = doc.data();
          const docId = doc.id; // This should be the date
          dates[docId] = docData.new_users || 0;
        });
        
        this.updateUserChart(dates, this.activeUserPeriod);
      } else {
        console.log('Daily users data collection is empty');
      }
    } catch (error) {
      console.error('Error fetching daily users data:', error);
    }
  }

  /**
   * Update user chart based on period
   */
  private updateUserChart(dates: any, period: string): void {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(2020, 0, 1); // ALL - from 2020
        break;
    }

    const filteredData = Object.entries(dates)
      .filter(([dateStr]) => new Date(dateStr) >= startDate)
      .map(([dateStr, count]) => ({
        x: new Date(dateStr).getTime(),
        y: count
      }))
      .sort((a, b) => a.x - b.x);

    this.userCountChart = {
      ...this.userCountChart,
      series: [{
        name: 'Шинэ хэрэглэгч',
        data: filteredData
      }]
    };
  }

  /**
   * Fetch monthly data from Firestore
   */
  private async fetchMonthlyData() {
    try {
      // Get current month (YYYY-MM format)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Get previous month
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // Fetch current month data
      const currentMonthDoc = await firebase.firestore()
        .collection('analytics')
        .doc('monthly')
        .collection('data')
        .doc(currentMonth)
        .get();

      // Fetch previous month data
      const previousMonthDoc = await firebase.firestore()
        .collection('analytics')
        .doc('monthly')
        .collection('data')
        .doc(previousMonth)
        .get();

      if (currentMonthDoc.exists) {
        const currentData = currentMonthDoc.data();
        this.monthlyData.current_month = {
          month: currentData?.month || currentMonth,
          total_revenue: currentData?.total_revenue || 0,
          total_orders: currentData?.total_orders || 0,
          successful_orders: currentData?.successful_orders || 0,
          total_gold_sold: currentData?.total_gold_sold || 0,
          last_updated: currentData?.last_updated || null
        };
      }

      if (previousMonthDoc.exists) {
        const previousData = previousMonthDoc.data();
        this.monthlyData.previous_month = {
          month: previousData?.month || previousMonth,
          total_revenue: previousData?.total_revenue || 0,
          total_orders: previousData?.total_orders || 0,
          successful_orders: previousData?.successful_orders || 0,
          total_gold_sold: previousData?.total_gold_sold || 0
        };
      }

      // Fetch all monthly data for table (last 12 months)
      const monthlyDataQuery = await firebase.firestore()
        .collection('analytics')
        .doc('monthly')
        .collection('data')
        .orderBy('month', 'desc')
        .limit(12)
        .get();

      this.monthlyDataList = [];
      monthlyDataQuery.docs.forEach(doc => {
        const data = doc.data();
        this.monthlyDataList.push({
          id: doc.id,
          month: data.month || doc.id,
          total_revenue: data.total_revenue || 0,
          total_orders: data.total_orders || 0,
          successful_orders: data.successful_orders || 0,
          total_gold_sold: data.total_gold_sold || 0,
          success_rate: data.total_orders > 0 ? (data.successful_orders / data.total_orders * 100) : 0,
          average_order_value: data.successful_orders > 0 ? (data.total_revenue / data.successful_orders) : 0,
          last_updated: data.last_updated || null
        });
      });

      console.log('Monthly data fetched:', this.monthlyData);
      console.log('Monthly data list:', this.monthlyDataList);
      
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  }

  /**
   * Update user count period
   */
  updateUserCountPeriod(period: string): void {
    this.activeUserPeriod = period;
    this.fetchDailyUsersData();
  }

  /**
   * Update sales chart period
   */
  updateSalesPeriod(period: string): void {
    this.activeSalesPeriod = period;
    this.fetchDailySalesData();
  }

  /**
   * Fetch daily sales data from Firestore
   */
  private async fetchDailySalesData() {
    try {
      const salesDataDoc = await firebase.firestore()
        .collection('analytics')
        .doc('daily_incomes')
        .collection('data')
        .get();

      if (!salesDataDoc.empty) {
        const dates: any = {};
        salesDataDoc.docs.forEach(doc => {
          const docData = doc.data();
          const docId = doc.id; // This should be the date (YYYY-MM-DD)
          dates[docId] = docData.total_amount || 0;
        });
        
        this.updateSalesChart(dates, this.activeSalesPeriod);
      } else {
        console.log('Daily sales data collection is empty');
      }
    } catch (error) {
      console.error('Error fetching daily sales data:', error);
    }
  }

  /**
   * Update sales chart based on period
   */
  private updateSalesChart(dates: any, period: string): void {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(2020, 0, 1); // ALL - from 2020
        break;
    }

    const filteredData = Object.entries(dates)
      .filter(([dateStr]) => new Date(dateStr) >= startDate)
      .map(([dateStr, amount]) => ({
        x: new Date(dateStr).getTime(),
        y: amount
      }))
      .sort((a, b) => a.x - b.x);

    this.dailySalesChart = {
      ...this.dailySalesChart,
      series: [{
        name: 'Борлуулалт',
        data: filteredData
      }]
    };
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return 'No data available';
  }

  opencenterModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }
  
  weeklyreport() {
    this.isActive = 'week';
    this.emailSentBarChart.series =
      [{
        name: 'Series A',
        data: [44, 55, 41, 67, 22, 43, 36, 52, 24, 18, 36, 48]
      }, {
        name: 'Series B',
        data: [11, 17, 15, 15, 21, 14, 11, 18, 17, 12, 20, 18]
      }, {
        name: 'Series C',
        data: [13, 23, 20, 8, 13, 27, 18, 22, 10, 16, 24, 22]
      }];
  }

  monthlyreport() {
    this.isActive = 'month';
    this.emailSentBarChart.series =
      [{
        name: 'Series A',
        data: [44, 55, 41, 67, 22, 43, 36, 52, 24, 18, 36, 48]
      }, {
        name: 'Series B',
        data: [13, 23, 20, 8, 13, 27, 18, 22, 10, 16, 24, 22]
      }, {
        name: 'Series C',
        data: [11, 17, 15, 15, 21, 14, 11, 18, 17, 12, 20, 18]
      }];
  }

  yearlyreport() {
    this.isActive = 'year';
    this.emailSentBarChart.series =
      [{
        name: 'Series A',
        data: [13, 23, 20, 8, 13, 27, 18, 22, 10, 16, 24, 22]
      }, {
        name: 'Series B',
        data: [11, 17, 15, 15, 21, 14, 11, 18, 17, 12, 20, 18]
      }, {
        name: 'Series C',
        data: [44, 55, 41, 67, 22, 43, 36, 52, 24, 18, 36, 48]
      }];
  }

  /**
   * Change the layout onclick
   * @param layout Change the layout
   */
  changeLayout(layout: string) {
    this.eventService.broadcast('changeLayout', layout);
  }

  // Monthly data tracking function for performance
  trackByMonth(index: number, item: any): string {
    return item.month;
  }

  // Format month name in Mongolian
  formatMonthName(monthString: string): string {
    const months = [
      'Нэгдүгээр сар', 'Хоёрдугаар сар', 'Гуравдугаар сар', 'Дөрөвдүгээр сар',
      'Тавдугаар сар', 'Зургадугаар сар', 'Долдугаар сар', 'Наймдугаар сар',
      'Есдүгээр сар', 'Аравдугаар сар', 'Арван нэгдүгээр сар', 'Арван хоёрдугаар сар'
    ];
    
    const [year, month] = monthString.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    
    if (monthIndex >= 0 && monthIndex < months.length) {
      return `${months[monthIndex]} ${year}`;
    }
    
    return monthString;
  }

  // Format currency with K, M, B suffixes
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
   * Fetch gold balance distribution from Firestore
   */
  private async fetchGoldBalanceDistribution() {
    try {
      const docSnap = await firebase.firestore()
        .collection('gold_balance_distribution')
        .doc('latest')
        .get();

      if (docSnap.exists) {
        const data = docSnap.data();
        const sortedDist = (data?.distribution || []).slice().sort(
          (a: any, b: any) => a.gold - b.gold
        );
        this.goldBalanceDistribution = {
          totalGoldInSystem: data?.totalGoldInSystem || 0,
          totalUsers: data?.totalUsers || 0,
          uniqueBalanceCount: data?.uniqueBalanceCount || 0,
          usersWithGold: data?.usersWithGold || 0,
          usersWithoutGold: data?.usersWithoutGold || 0,
          distribution: sortedDist
        };
        this.goldDistributionPreview = sortedDist.slice(0, 20);
      }
    } catch (error) {
      console.error('Error fetching gold balance distribution:', error);
    }
  }

  openDistributionModal() {
    this.distributionModal?.show();
  }

  /**
   * Fetch total investors count from investments collection
   */
  private async fetchInvestorsCount() {
    try {
      const investmentsSnapshot = await firebase.firestore()
        .collection('investments')
        .get();
      
      this.totalInvestors = investmentsSnapshot.size;
      console.log('Total investors:', this.totalInvestors);
    } catch (error) {
      console.error('Error fetching investors count:', error);
      this.totalInvestors = 0;
    }
  }
}
