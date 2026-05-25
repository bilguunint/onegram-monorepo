import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgApexchartsModule } from 'ng-apexcharts';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Component({
  selector: 'app-withdraws-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BsDropdownModule,
    NgApexchartsModule
  ],
  templateUrl: './withdraws-statistics.component.html',
  styleUrl: './withdraws-statistics.component.css'
})
export class WithdrawsStatisticsComponent implements OnInit {

  isLoading: boolean = true;
  analyticsData: any = null;
  selectedMonth: string = '';
  availableMonths: string[] = [];

  // Pie chart configuration
  withdrawTypePieChart: any = {
    chart: {
      height: 350,
      type: 'pie',
    },
    series: [],
    labels: [],
    colors: ['#34c38f', '#f46a6a', '#f1b44c'],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      offsetY: 10
    },
    responsive: [{
      breakpoint: 600,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        },
      }
    }]
  };

  constructor() { }

  ngOnInit(): void {
    this.initializeMonth();
    this.loadAvailableMonths();
  }

  initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = `${year}_${month}`;
  }

  async loadAvailableMonths() {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection('withdraw_analytics').get();
      
      this.availableMonths = snapshot.docs
        .map(doc => doc.id)
        .filter(id => id !== 'overall' && id.match(/^\d{4}_\d{2}$/))
        .sort()
        .reverse();
      
      if (this.availableMonths.length > 0) {
        if (!this.availableMonths.includes(this.selectedMonth)) {
          this.selectedMonth = this.availableMonths[0];
        }
        this.loadWithdrawAnalytics();
      }
    } catch (error) {
      console.error('Error loading available months:', error);
    }
  }

  async loadWithdrawAnalytics() {
    try {
      this.isLoading = true;
      const db = firebase.firestore();
      const docRef = db.collection('withdraw_analytics').doc(this.selectedMonth);
      
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        this.analyticsData = docSnap.data();
        
        // Update pie chart data
        const byWithdrawType = this.analyticsData?.by_withdraw_type;
        if (byWithdrawType) {
          const series = [];
          const labels = [];
          
          if (byWithdrawType.sold_to_us?.count) {
            series.push(byWithdrawType.sold_to_us.count);
            labels.push('Манайд зарсан');
          }
          if (byWithdrawType.taken_physically?.count) {
            series.push(byWithdrawType.taken_physically.count);
            labels.push('Биетээр авсан');
          }
          if (byWithdrawType.unspecified?.count) {
            series.push(byWithdrawType.unspecified.count);
            labels.push('Тодорхойгүй');
          }
          
          this.withdrawTypePieChart.series = series;
          this.withdrawTypePieChart.labels = labels;
        }
      } else {
        console.log('No analytics data found for this month');
        this.analyticsData = null;
      }
    } catch (error) {
      console.error('Error loading withdraw analytics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onMonthChange() {
    this.loadWithdrawAnalytics();
  }

  formatMonthDisplay(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('_');
    return `${year}-${month}`;
  }

}
