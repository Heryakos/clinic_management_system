import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MedicalService } from 'src/app/medical.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as echarts from 'echarts';
import { FontService } from '../../services/FontService.service';

interface ReportTexts {
  [key: string]: {
    [key: string]: string;
  };
}

@Component({
  selector: 'app-cashier-reports',
  templateUrl: './cashier-reports.component.html',
  styleUrls: ['./cashier-reports.component.css']
})
export class CashierReportsComponent implements OnInit, OnDestroy {
  @ViewChild('reportContent') reportContent!: ElementRef;

  // Report data
  paymentSummary: any = {
    totalPayments: 0,
    totalAmount: 0,
    averagePayment: 0
  };
  paymentTrends: any[] = [];
  departmentBreakdown: any[] = [];
  paymentMethodStats: any[] = [];

  // Date filters
  startDate: string = '';
  endDate: string = '';

  // Chart instances
  trendsChart: any;
  departmentChart: any;
  methodChart: any;

  // Language support
  reportLang: 'en' | 'am' = 'en';

  // Loading states
  isLoading = false;

  // Report texts for both languages
  reportTexts: ReportTexts = {
    en: {
      title: 'Cashier Payment Report',
      summary: 'Payment Summary',
      trends: 'Payment Trends',
      departmentBreakdown: 'Department Breakdown',
      methods: 'Payment Methods',
      totalPayments: 'Total Payments',
      totalAmount: 'Total Amount',
      averagePayment: 'Average Payment',
      dateRange: 'Date Range',
      generate: 'Generate Report',
      exportPdf: 'Export PDF',
      print: 'Print Report',
      paymentDate: 'Payment Date',
      amount: 'Amount',
      department: 'Department',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      check: 'Check',
      count: 'Count',
      birr: 'ETB'
    },
    am: {
      title: 'የካሺየር ክፍያ ሪፖርት',
      summary: 'የክፍያ ማጠቃለያ',
      trends: 'የክፍያ አዝማሚያዎች',
      departmentBreakdown: 'የዲፓርትመንት መበስበስ',
      methods: 'የክፍያ ዘዴዎች',
      totalPayments: 'ጠቅላላ ክፍያዎች',
      totalAmount: 'ጠቅላላ መጠን',
      averagePayment: 'አማካይ ክፍያ',
      dateRange: 'የቀን ክልል',
      generate: 'ሪፖርት አውጣ',
      exportPdf: 'PDF ላክ',
      print: 'ሪፖርት አትም',
      paymentDate: 'የክፍያ ቀን',
      amount: 'መጠን',
      department: 'ዲፓርትመንት',
      paymentMethod: 'የክፍያ ዘዴ',
      cash: 'ጥሬ ገንዘብ',
      check: 'ቼክ',
      count: 'ብዛት',
      birr: 'ብር'
    }
  };

  constructor(
    private medicalService: MedicalService,
    private fontService: FontService
  ) { }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadReportData();
  }

  setDefaultDateRange(): void {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    this.startDate = this.formatDateForInput(start);
    this.endDate = this.formatDateForInput(end);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPercentage(amount: number, total: number): string {
    if (!total || total === 0) return '0';
    return ((amount / total) * 100).toFixed(1);
  }

  private loadReportData(): void {
    this.isLoading = true;

    // Convert string dates to Date objects, use defaults if not set
    const startDateObj = this.startDate ? new Date(this.startDate) : this.getDefaultStartDate();
    const endDateObj = this.endDate ? new Date(this.endDate) : new Date();

    this.medicalService.getPaymentReports(startDateObj, endDateObj).subscribe({
      next: (data: any) => {
        console.log('Report data from API:', data);

        this.paymentSummary = data.summary || {};
        this.paymentTrends = data.trends || [];
        this.departmentBreakdown = data.departmentBreakdown || [];
        this.paymentMethodStats = data.paymentMethodStats || [];

        // Format dates for trends
        this.paymentTrends = this.paymentTrends.map((trend: any) => ({
          ...trend,
          date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        this.initCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading report data:', error);
        this.isLoading = false;
        // Removed mock data - only show error state
        this.paymentSummary = {};
        this.paymentTrends = [];
        this.departmentBreakdown = [];
        this.paymentMethodStats = [];
        this.initCharts();
      }
    });
  }

  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  initCharts(): void {
    setTimeout(() => {
      this.initTrendsChart();
      this.initDepartmentChart();
      this.initMethodChart();
    }, 100);
  }

  initTrendsChart(): void {
    const chartDom = document.getElementById('trendsChart');
    if (!chartDom) {
      console.warn('Trends chart element not found');
      return;
    }

    if (this.trendsChart) {
      this.trendsChart.dispose();
    }

    this.trendsChart = echarts.init(chartDom);

    const option = {
      title: {
        text: this.getText('trends'),
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = params[0].axisValue;
          const value = params[0].value;
          return `${date}<br/>${this.getText('amount')}: ${this.formatCurrency(value)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: this.paymentTrends.map(t => t.date),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: this.getText('amount'),
        axisLabel: {
          formatter: (value: number) => this.formatCurrency(value)
        }
      },
      series: [{
        data: this.paymentTrends.map(t => t.amount),
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#3498db'
        },
        itemStyle: {
          color: '#2980b9'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(52, 152, 219, 0.3)'
            }, {
              offset: 1, color: 'rgba(52, 152, 219, 0.1)'
            }]
          }
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      }
    };

    this.trendsChart.setOption(option);

    window.addEventListener('resize', () => {
      this.trendsChart.resize();
    });
  }

  initDepartmentChart(): void {
    const chartDom = document.getElementById('departmentChart');
    if (!chartDom) {
      console.warn('Department chart element not found');
      return;
    }

    if (this.departmentChart) {
      this.departmentChart.dispose();
    }

    this.departmentChart = echarts.init(chartDom);

    const option = {
      title: {
        text: this.getText('departmentBreakdown'),
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>${this.getText('amount')}: ${this.formatCurrency(params.value)}<br/>${this.getText('count')}: ${params.data.count}`;
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '55%'],
        data: this.departmentBreakdown.map(dept => ({
          value: dept.amount,
          name: dept.department,
          count: dept.count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        }
      }],
      legend: {
        orient: 'horizontal',
        bottom: 10,
        data: this.departmentBreakdown.map(dept => dept.department)
      }
    };

    this.departmentChart.setOption(option);

    window.addEventListener('resize', () => {
      this.departmentChart.resize();
    });
  }

  initMethodChart(): void {
    const chartDom = document.getElementById('methodChart');
    if (!chartDom) {
      console.warn('Method chart element not found');
      return;
    }

    if (this.methodChart) {
      this.methodChart.dispose();
    }

    this.methodChart = echarts.init(chartDom);

    const option = {
      title: {
        text: this.getText('methods'),
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: this.paymentMethodStats.map(m =>
          m.method === 'Cash' ? this.getText('cash') : this.getText('check')
        )
      },
      yAxis: [{
        type: 'value',
        name: this.getText('amount'),
        axisLabel: {
          formatter: (value: number) => this.formatCurrency(value)
        }
      }, {
        type: 'value',
        name: this.getText('count'),
        position: 'right'
      }],
      series: [
        {
          name: this.getText('amount'),
          type: 'bar',
          data: this.paymentMethodStats.map(m => m.amount),
          itemStyle: {
            color: '#27ae60'
          },
          yAxisIndex: 0
        },
        {
          name: this.getText('count'),
          type: 'line',
          data: this.paymentMethodStats.map(m => m.count),
          itemStyle: {
            color: '#e74c3c'
          },
          yAxisIndex: 1
        }
      ],
      grid: {
        left: '3%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      }
    };

    this.methodChart.setOption(option);

    window.addEventListener('resize', () => {
      this.methodChart.resize();
    });
  }

  getText(key: string): string {
    const langTexts = this.reportTexts[this.reportLang];
    return langTexts ? langTexts[key] || key : key;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      minimumFractionDigits: 2
    }).format(amount) + ' ETB';
  }

  generateReport(): void {
    this.loadReportData();
  }

  async exportToPDF(): Promise<void> {
    this.isLoading = true;

    try {
      // Load Amharic font first
      const fontBase64 = await this.fontService.loadFontBase64('fonts/AbyssinicaSIL-Regular.json').toPromise();
      
      if (!fontBase64) {
        console.error('Amharic font loading failed');
        this.isLoading = false;
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Add Amharic font support
      const fontName = 'AbyssinicaSIL';
      doc.addFileToVFS('AbyssinicaSIL-Regular.ttf', fontBase64);
      doc.addFont('AbyssinicaSIL-Regular.ttf', fontName, 'normal');
      
      // Set font based on current language
      if (this.reportLang === 'am') {
        doc.setFont(fontName);
      } else {
        doc.setFont('helvetica');
      }

      // Add company header
      await this.addReportHeader(doc);

      // Add summary section
      this.addSummarySection(doc);

      // Add charts as images
      await this.addChartsAsImages(doc);

      // Add detailed table
      this.addDetailedTable(doc);

      // Add footer
      this.addReportFooter(doc);

      doc.save(`cashier-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async addReportHeader(doc: jsPDF): Promise<void> {
    // Set font based on language
    if (this.reportLang === 'am') {
      doc.setFont('AbyssinicaSIL', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }

    // Company name - Always in Amharic for the clinic name
    doc.setFontSize(20);
    if (this.reportLang === 'am') {
      doc.setFont('AbyssinicaSIL', 'normal');
      doc.text('ፌዴራል ሆሲንግ ኮርፖሬሽን ሜዲካል ክሊኒክ', 105, 20, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('Federal Housing Corporation Medical Clinic', 105, 20, { align: 'center' });
    }

    // Report title
    doc.setFontSize(16);
    doc.text(this.getText('title'), 105, 30, { align: 'center' });

    // Date information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.getText('dateRange')}: ${this.startDate} ${this.getText('to')} ${this.endDate}`, 20, 45);
    doc.text(`${this.getText('generatedOn')}: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, 277, 55);
  }

  private addSummarySection(doc: jsPDF): void {
    doc.setFontSize(14);
    if (this.reportLang === 'am') {
      doc.setFont('AbyssinicaSIL', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(this.getText('summary'), 20, 65);

    const summaryData = [
      [this.getText('totalPayments'), this.paymentSummary.totalPayments?.toString() || '0'],
      [this.getText('totalAmount'), this.formatCurrency(this.paymentSummary.totalAmount || 0)],
      [this.getText('averagePayment'), this.formatCurrency(this.paymentSummary.averagePayment || 0)]
    ];

    autoTable(doc, {
      startY: 70,
      head: [[this.getText('summary'), this.getText('value')]],
      body: summaryData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
        textColor: [0, 0, 0],
        font: this.reportLang === 'am' ? 'AbyssinicaSIL' : 'helvetica'
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 }
    });
  }

  private async addChartsAsImages(doc: jsPDF): Promise<void> {
    const charts = [
      { instance: this.trendsChart, title: this.getText('trends') },
      { instance: this.departmentChart, title: this.getText('departmentBreakdown') },
      { instance: this.methodChart, title: this.getText('methods') }
    ];

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
      }

      if (chart.instance) {
        try {
          const imgData = chart.instance.getDataURL({
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });

          // Set font for chart title
          if (this.reportLang === 'am') {
            doc.setFont('AbyssinicaSIL', 'normal');
          } else {
            doc.setFont('helvetica', 'bold');
          }
          doc.setFontSize(12);
          doc.text(chart.title, 20, currentY);

          // Add chart image
          doc.addImage(imgData, 'PNG', 20, currentY + 5, 250, 80);
          currentY += 95;
        } catch (error) {
          console.error(`Error capturing chart ${chart.title}:`, error);
          // Add placeholder text if chart capture fails
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Chart ${chart.title} could not be rendered`, 20, currentY + 5);
          currentY += 30;
        }
      }
    }
  }

  private addDetailedTable(doc: jsPDF): void {
    let currentY = (doc as any).lastAutoTable?.finalY + 10 || 120;
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    // Department breakdown table
    autoTable(doc, {
      startY: currentY,
      head: [[
        this.getText('department'),
        this.getText('count'),
        this.getText('amount')
      ]],
      body: this.departmentBreakdown.map(dept => [
        dept.department,
        dept.count.toString(),
        this.formatCurrency(dept.amount)
      ]),
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        font: this.reportLang === 'am' ? 'AbyssinicaSIL' : 'helvetica'
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255]
      },
      margin: { left: 20, right: 20 }
    });

    // Payment method table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[
        this.getText('paymentMethod'),
        this.getText('count'),
        this.getText('amount')
      ]],
      body: this.paymentMethodStats.map(method => [
        method.method === 'Cash' ? this.getText('cash') : this.getText('check'),
        method.count.toString(),
        this.formatCurrency(method.amount)
      ]),
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        font: this.reportLang === 'am' ? 'AbyssinicaSIL' : 'helvetica'
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255]
      },
      margin: { left: 20, right: 20 }
    });
  }

  private addReportFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      if (this.reportLang === 'am') {
        doc.setFont('AbyssinicaSIL', 'normal');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(
        `Page ${i} of ${pageCount} - Federal Housing Corporation Medical Clinic - ${this.getText('generatedOn')} ${new Date().toLocaleDateString()}`,
        145,
        200,
        { align: 'center' }
      );
    }
  }

  printReport(): void {
    window.print();
  }

  toggleLanguage(): void {
    this.reportLang = this.reportLang === 'en' ? 'am' : 'en';
    setTimeout(() => {
      this.initCharts(); // Re-initialize charts with new language
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up chart instances
    if (this.trendsChart) {
      this.trendsChart.dispose();
    }
    if (this.departmentChart) {
      this.departmentChart.dispose();
    }
    if (this.methodChart) {
      this.methodChart.dispose();
    }

    // Remove resize listeners
    window.removeEventListener('resize', () => { });
  }
}