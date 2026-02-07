import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { MedicalService } from '../../medical.service'; // adjust path
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface HistoryRow {
  RecordType: string;
  EmployeeID: string;
  CardNumber: string;
  EmployeeName: string;
  DepartmentAmharic: string;
  DepartmentEnglish: string;
  OrganizationEnglish: string;
  OrganizationAmharic: string;
  Photo: string; // base64
  Position: string;
  EventDate: string;
  RequestType: string;
  Reason: string;
  SupervisorApproval: number;
  Status: string;
  is_sick_leave: number;
  CurrentStatus: string;
  PreferredDate: string;
  PreferredTime: string | null;
  VisitCardID: number | null;
  VisitDate: string | null;
  Diagnosis: string | null;
  DoctorName: string | null;
  CertificateID: number | null;
  SickLeaveStart: string | null;
  SickLeaveEnd: string | null;
}

@Component({
  selector: 'app-clinic-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxEchartsModule
  ],
  templateUrl: './clinic-history.component.html',
  styleUrls: ['./clinic-history.component.css']
})
export class ClinicHistoryComponent implements OnInit {
  private readonly REPORT_ROLE_ID = '25892724-A484-4A65-BF2B-45700A87B7C8';
  monthlyChartOption: EChartsOption = {};
  departmentChartOption: EChartsOption = {};
  genderChartOption: EChartsOption = {};
  chartLoading = false;
  currentUserRoleIds: string | null = null;
  hasReportRole: boolean = false;
  canAccessReports: boolean = false;
  genderFilter: 'All' | 'male' | 'female' = 'All';
  organizations: any[] = [];
  selectedOrganization: string | null = null;     // GUID string
  departments: any[] = [];
  selectedDepartment: string | null = null;
  searchPhoto: string | null = null;
  searchName: string | null = null;
  hasMyHistoryData = false;
  // Tabs
  selectedTab = 0; // 0 = My History, 1 = Search/Reports

  // My History
  myEmployeeId: string | null = null;
  myName: string | null = null;
  myPhoto: string | null = null;
  myDetailData: HistoryRow[] = [];

  // Search / Reports
  searchEmployeeIdOrCard: string = '';
  selectedOrg: string = '';
  selectedDep: string = '';
  fromDate: Date | null = new Date(new Date().getFullYear(), 0, 1);
  toDate: Date | null = new Date();
  mode: 'DETAIL' | 'DEPARTMENT' | 'MONTHLY' | 'SUMMARY' | 'GENDER' = 'DETAIL';

  // Shared data
  detailData: HistoryRow[] = [];
  departmentData: any[] = [];
  monthlyData: any[] = [];
  summaryData: any = null;

  loading = false;
  errorMessage: string | null = null;

  // Full columns for DETAIL table
  displayedColumns: string[] = [
    'RecordType',
    'EventDate',
    'RequestType',
    'Reason',
    'CurrentStatus',
    'PreferredDate',       // ← new
    'DoctorName',          // ← new
    'SickLeaveStart',      // ← new
    'SickLeaveEnd',        // ← new
    'DepartmentEnglish',
    'OrganizationEnglish',
    'Position'
  ];
  displayedColumnsSearch: string[] = [
    'RecordType',
    'EventDate',
    'EmployeeName',
    'RequestType',
    'Reason',
    'CurrentStatus',
    'DepartmentEnglish',
    'DoctorName',
    'SickLeaveStart',
    'SickLeaveEnd'
  ];

  constructor(
    private medicalService: MedicalService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.fromDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    this.toDate = new Date();
    this.mode = 'DETAIL';

    this.loadCurrentUser();
    this.loadOrganizations();

    // ──────────────────────────────────────────────────────────────
    // Listen to user roles (same observable you already use in app.component)
    this.medicalService.userRoleIds$.subscribe(roleIds => {
      const normalized = roleIds.map(id => String(id).trim().toLowerCase().replace(/\s/g, ''));
      this.canAccessReports = normalized.includes(this.REPORT_ROLE_ID.toLowerCase());

      console.log('Has report role (observable):', this.canAccessReports);

      // Optional: update hasReportRole immediately if observable fires first
      this.hasReportRole = this.hasReportRole || this.canAccessReports;
      this.cdr.detectChanges();
    });
    // ──────────────────────────────────────────────────────────────
  }
  onModeChange() {
    if (!this.loading) {
      this.search();  // re-run search with new mode
    }
  }
  private async loadCurrentUser() {
    this.loading = true;
    this.errorMessage = null;
    try {
      const response = await firstValueFrom(this.medicalService.getEmployeeById(environment.username));
      const employee = response?.c_Employees?.[0];
      if (employee?.employee_Id) {
        this.myEmployeeId = employee.employee_Id;
        this.myName = employee.en_name || 'Unknown';
        this.myPhoto = employee.photo ? `data:image/jpeg;base64,${employee.photo}` : null;
        this.loadMyHistory();
      } else {
        this.showError('Could not load your employee profile');
      }
    } catch (err) {
      this.showError('Failed to load current user');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  private loadOrganizations() {
    this.medicalService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations = data;
        // Optional: sort by name_en
        this.organizations.sort((a, b) => a.NameEn.localeCompare(b.NameEn));
      },
      error: () => this.showError('Failed to load organizations')
    });
  }

  // When organization changes
  onOrganizationChange() {
    this.selectedDepartment = null;
    this.departments = [];

    if (!this.selectedOrganization) return;

    this.medicalService.getDepartments(this.selectedOrganization).subscribe({
      next: (data) => {
        this.departments = data;
        this.departments.sort((a, b) => a.NameEn.localeCompare(b.NameEn));
      },
      error: () => this.showError('Failed to load departments')
    });
  }

  private loadMyHistory() {
    if (!this.myEmployeeId) return;

    const params = {
      employeeIdOrCard: this.myEmployeeId,
      fromDate: this.fromDate?.toISOString().split('T')[0],
      toDate: this.toDate?.toISOString().split('T')[0],
      mode: this.mode,
      includePending: true,
      includeCompleted: true
    };

    this.loadData(params, true);
  }

  search() {
    console.log('Searching with gender:', this.genderFilter);

    const params: any = {
      employeeIdOrCard: this.searchEmployeeIdOrCard?.trim() || undefined,
      fromDate: this.fromDate ? this.fromDate.toISOString().split('T')[0] : undefined,
      toDate: this.toDate ? this.toDate.toISOString().split('T')[0] : undefined,
      mode: this.mode,
      organizationCode: this.selectedOrganization || undefined,
      departmentCode: this.selectedDepartment || undefined,
      gender: this.genderFilter === 'All' ? undefined : this.genderFilter,
      includePending: true,
      includeCompleted: true,
      // Force fresh request every time (bypass cache)
      _t: new Date().getTime()   // ← add timestamp cache-buster
    };

    console.log('Full search params:', params);

    // Clear old results first
    this.detailData = [];
    this.loading = true;

    this.loadData(params, false);
  }
  loadClinicVisitors(period: 'today' | 'week' | 'month') {
    this.loading = true;

    const today = new Date();
    let fromDate: Date;

    if (period === 'today') {
      fromDate = new Date(today);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      fromDate = new Date(today);
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      fromDate.setDate(today.getDate() - diff); // start of week (Monday)
      fromDate.setHours(0, 0, 0, 0);
    } else { // month
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    this.fromDate = fromDate;
    this.toDate = today;

    // Clear previous search filters (optional – depending on your need)
    // this.searchEmployeeIdOrCard = '';
    // this.selectedOrganization = null;
    // this.selectedDepartment = null;
    // this.genderFilter = 'All';

    // Trigger search / reload
    if (this.selectedTab === 0) {
      // My History tab → reload my data
      this.loadMyHistory();
    } else {
      // Search / Reports tab → run full search
      this.search();
    }
  }
  onGenderChange() {
    // Optional: auto-search when gender changes
    if (!this.loading) {
      this.search();
    }
  }
  private async loadData(params: any, isMyHistory: boolean = false) {
    this.loading = true;
    this.errorMessage = null;

    // Clear previous data
    if (isMyHistory) {
      this.myDetailData = [];
      this.hasMyHistoryData = false;           // Reset flag
      this.myPhoto = null;                     // Reset photo
      this.myName = null;                      // Reset name
    } else {
      this.detailData = [];
      this.departmentData = [];
      this.monthlyData = [];
      this.summaryData = null;
      this.searchPhoto = null;                 // Reset search header
      this.searchName = null;
    }

    // const params: any = {
    //   fromDate: this.fromDate ? this.fromDate.toISOString().split('T')[0] : undefined,
    //   toDate: this.toDate ? this.toDate.toISOString().split('T')[0] : undefined,
    //   mode: this.mode,
    //   includePending: true,
    //   includeCompleted: true
    // };

    // if (employeeIdOrCard) {
    //   params.employeeIdOrCard = employeeIdOrCard;
    // }

    try {
      console.log('Calling API with these params:', params);
      const data = await firstValueFrom(this.medicalService.getClinicHistory(params));
      console.log('API returned rows:', data.length);
      if (data.length === 0) {
        console.log('First row gender source:', data[0].EmployeeID);  // just to see
        console.log('Sample data (first 2 rows):', data.slice(0, 2));
        this.errorMessage = isMyHistory
          ? 'No clinic records found for you.'
          : 'No clinic history found for the selected criteria';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        // Flags and header fields remain reset → no header shown
      } else {
        // ──────────────────────────────────────────────────────────────
        // This is the correct place for your snippet
        // ──────────────────────────────────────────────────────────────
        if (this.mode === 'DETAIL') {
          if (isMyHistory) {
            this.myDetailData = data;
            this.hasMyHistoryData = true;

            const firstRow = data[0];
            this.myPhoto = firstRow.Photo
              ? `data:image/jpeg;base64,${firstRow.Photo}`
              : null;
            this.myName = firstRow.EmployeeName || this.myName || 'Unknown';
            this.myEmployeeId = firstRow.EmployeeID || firstRow.CardNumber || this.myEmployeeId;
            // NEW: Extract roles from first row (only for My History)
            // ────────────────────────────────────────────────
            if (firstRow.RecordType === 'NoHistoryButHR') {
              // Do NOT show dummy in table or header
              this.myDetailData = [];
              this.hasMyHistoryData = false;
              this.myPhoto = null;
              this.myName = null;
              // But still extract roles
            } 
            else {
              // Normal data
              this.myDetailData = data;
              this.hasMyHistoryData = true;

              this.myPhoto = firstRow.Photo
                ? `data:image/jpeg;base64,${firstRow.Photo}`
                : null;
              this.myName = firstRow.EmployeeName || this.myName || 'Unknown';
              this.myEmployeeId = firstRow.EmployeeID || firstRow.CardNumber || this.myEmployeeId;
            }

            // ────────────────────────────────────────────────
            // ALWAYS extract roles if present (dummy or real)
            // ────────────────────────────────────────────────
            if (firstRow?.UserRoleIds) {
              this.currentUserRoleIds = firstRow.UserRoleIds;

              const rolesArray = this.currentUserRoleIds!
                .split(',')
                .map(id => id.trim().toLowerCase());

              this.hasReportRole = rolesArray.includes(
                this.REPORT_ROLE_ID.toLowerCase()
              );

              console.log('User roles from API:', this.currentUserRoleIds);
              console.log('Has REPORT role?', this.hasReportRole);

              this.cdr.detectChanges();
            } else {
              this.hasReportRole = false;
              this.cdr.detectChanges();
            }
          } else {
            // Search tab logic (unchanged)
            this.detailData = data;


            // Set search header info (for Search / Reports tab)
            const firstRow = data[0];
            this.searchPhoto = firstRow.Photo
              ? `data:image/jpeg;base64,${firstRow.Photo}`
              : null;
            this.searchName = firstRow.EmployeeName || 'Employee Records';
          }
        }
        else if (this.mode === 'DEPARTMENT') {
          this.departmentData = data;
          this.buildDepartmentChart();
        }
        else if (this.mode === 'MONTHLY') {
          this.monthlyData = data;
          this.buildMonthlyChart();
        }
        else if (this.mode === 'SUMMARY') {
          this.summaryData = data[0] || {};
        // }
        // else if (this.mode === 'GENDER') {
        //   this.buildGenderChart(); 
        // }
      } else if (this.mode === 'GENDER') {
        // Expect array like [{ GenderGroup: 'Male', Count: 45 }, ...]
        const genderData = data || [];
        const male = genderData.find(d => d.GenderGroup === 'Male')?.Count || 0;
        const female = genderData.find(d => d.GenderGroup === 'Female')?.Count || 0;
      
        this.genderChartOption = {
          // ... same pie config ...
          series: [{
            data: [
              { value: male, name: 'Male', itemStyle: { color: '#2196F3' } },
              { value: female, name: 'Female', itemStyle: { color: '#E91E63' } }
            ]
          }]
        };
      }
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to load clinic history';
      console.error(err);
      // this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }
  // Add this inside the class ClinicHistoryComponent
  onTabChange(event: MatTabChangeEvent) {
    console.log('Tab changed to:', event.index, event.tab.textLabel);

    // Optional: reload data or reset something when switching tabs
    if (event.index === 0) {
      // My History tab → reload my data if needed
      this.loadMyHistory();
    } else if (event.index === 1) {
      // Search / Reports tab → optional: clear search or reset filters
      this.searchEmployeeIdOrCard = '';
      this.selectedOrg = '';
      this.selectedDep = '';
    }
  }
  private buildMonthlyChart() {
    if (!this.monthlyData?.length) {
      this.monthlyChartOption = {
        title: { text: 'No monthly data available', left: 'center' },
        series: []
      };
      return;
    }
  
    const months = this.monthlyData.map(d => d.YearMonth || `${d.Year}-${d.Month}`);
    const totals = this.monthlyData.map(d => d.TotalEvents || 0);
    const visits = this.monthlyData.map(d => d.Visits || 0);
    const sickLeaves = this.monthlyData.map(d => d.SickLeaves || 0);
  
    this.monthlyChartOption = {
      title: {
        text: 'Monthly Clinic Activity',
        left: 'center',
        textStyle: { color: '#1a2332', fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Total Events', 'Visits', 'Sick Leaves'], top: 40 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { rotate: 45, color: '#5f6c7b' }
      },
      yAxis: { type: 'value' },
      series: [
        { name: 'Total Events', type: 'line', data: totals, smooth: true, itemStyle: { color: '#2196F3' } },
        { name: 'Visits', type: 'bar', data: visits, itemStyle: { color: '#4CAF50' } },
        { name: 'Sick Leaves', type: 'bar', data: sickLeaves, itemStyle: { color: '#F44336' } }
      ]
    };
  }
  
  private buildDepartmentChart() {
    if (!this.departmentData?.length) {
      this.departmentChartOption = {
        title: { text: 'No department data', left: 'center' },
        series: []
      };
      return;
    }
  
    const departments = this.departmentData.map(d => d.DepartmentEnglish || 'Unknown');
    const totals = this.departmentData.map(d => d.TotalEvents || 0);
  
    this.departmentChartOption = {
      title: { text: 'Clinic Activity by Department', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', top: 60 },
      series: [{
        name: 'Total Events',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: departments.map((dep, i) => ({ name: dep, value: totals[i] })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    };
  }
  
  private buildGenderChart() {
    // Placeholder until SP returns gender data
    this.genderChartOption = {
      title: {
        text: 'Gender Distribution of Clinic Visitors',
        subtext: 'Data coming soon – update SP for GENDER mode',
        left: 'center'
      },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: 'Gender',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 50, name: 'Male', itemStyle: { color: '#2196F3' } },
          { value: 50, name: 'Female', itemStyle: { color: '#E91E63' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  async exportChartToPDF(chartId: string, title: string) {
    const element = document.getElementById(chartId);
    if (!element) return;
  
    this.loading = true;
  
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // higher quality
        useCORS: true,
        logging: false
      });
  
      const imgData = canvas.toDataURL('image/png');
  
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
  
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      doc.setFontSize(18);
      doc.text(title, 14, 20);
  
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  
      doc.addImage(imgData, 'PNG', 10, 40, pdfWidth - 20, pdfHeight - 50);
  
      doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Chart export failed:', err);
      this.showError('Failed to export chart to PDF');
    } finally {
      this.loading = false;
    }
  }
  
  printChart(chartId: string) {
    const element = document.getElementById(chartId);
    if (!element) return;
  
    // Simple print – hides everything except chart
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Chart</title></head>
          <body style="margin:0; padding:20px;">
            ${element.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  exportToPDF() {
    if (this.detailData.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Clinic Visitors Report', 14, 20);

    const subtitle = `Period: ${this.fromDate?.toLocaleDateString() || '—'} to ${this.toDate?.toLocaleDateString() || '—'}`;
    doc.setFontSize(11);
    doc.text(subtitle, 14, 28);

    if (this.selectedOrganization) {
      const org = this.organizations.find(o => o.OrganizationCode === this.selectedOrganization);
      doc.text(`Organization: ${org?.NameEn || '—'}`, 14, 36);
    }
    if (this.selectedDepartment) {
      const dep = this.departments.find(d => d.DepartmentCode === this.selectedDepartment);
      doc.text(`Department: ${dep?.NameEn || '—'}`, 14, 44);
    }
    if (this.genderFilter !== 'All') {
      doc.text(`Gender: ${this.genderFilter}`, 14, 52);
    }

    autoTable(doc, {
      startY: 60,
      head: [['Type', 'Date', 'Employee', 'Request', 'Reason', 'Status', 'Department', 'Doctor']],
      body: this.detailData.map(row => [
        row.RecordType,
        new Date(row.EventDate).toLocaleDateString(),
        row.EmployeeName,
        row.RequestType,
        row.Reason || '—',
        row.CurrentStatus,
        row.DepartmentEnglish || '—',
        row.DoctorName || '—'
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [44, 62, 80] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    doc.save(`clinic-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  printTable() {
    window.print(); // simplest — prints current page (you can style @media print)
    // or generate PDF and auto-print like above + doc.autoPrint(); doc.output('dataurlnewwindow');
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}