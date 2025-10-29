import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { MedicalService } from 'src/app/medical.service';
import jsPDF from 'jspdf'; // Updated import
import autoTable from 'jspdf-autotable';
import * as pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts'; // this makes vfs available




// Set pdfMake fonts
// (pdfMake as any).vfs = (pdfFonts as any).vfs;

// Define minimal TDocumentDefinitions interface
interface TDocumentDefinitions {
  content: any[];
  styles?: { [key: string]: any };
  defaultStyle?: { [key: string]: any };
}

// Add index signature to ReportData
interface ReportData {
  totalPatients: number;
  totalMedicalRequests: number;
  totalPrescriptions: number;
  totalLabTests: number;
  totalExpenseReimbursements: number;
  totalInventoryRequests: number;
  activeSickLeaves: number;
  monthlyStats: any[];
  departmentStats: any[];
  expenseStats: any[];
  [key: string]: any; // Index signature to allow dynamic key access
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reportData: ReportData = {
    totalPatients: 0,
    totalMedicalRequests: 0,
    totalPrescriptions: 0,
    totalLabTests: 0,
    totalExpenseReimbursements: 0,
    totalInventoryRequests: 0,
    activeSickLeaves: 0,
    monthlyStats: [],
    departmentStats: [],
    expenseStats: []
  };

  selectedReportType = 'overview';
  selectedDateRange = 'month';
  isLoading = false;
  curruntdate = new Date();

  chartOptions: any;

  // Backed by server data (financial-summary endpoint)
  financialSummary: { prescriptionRevenue: number; expenseReimbursements: number; inventoryValue: number; labTestRevenue: number } = {
    prescriptionRevenue: 0,
    expenseReimbursements: 0,
    inventoryValue: 0,
    labTestRevenue: 0
  };

  // Detail modal state
  detailModalOpen = false;
  detailTitle = '';
  detailChartOptions: any;
  detailColumns: { field: string; header: string }[] = [];
  detailRows: any[] = [];

  statsConfig = [
    { title: 'Total Patients', key: 'totalPatients', icon: 'people', subtitle: 'Active patients', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { title: 'Medical Requests', key: 'totalMedicalRequests', icon: 'description', subtitle: 'Total requests', gradient: 'linear-gradient(135deg, #28a745, #20c997)' },
    { title: 'Prescriptions', key: 'totalPrescriptions', icon: 'medical_services', subtitle: 'Issued prescriptions', gradient: 'linear-gradient(135deg, #dc3545, #e74c3c)' },
    { title: 'Lab Tests', key: 'totalLabTests', icon: 'science', subtitle: 'Completed tests', gradient: 'linear-gradient(135deg, #fd7e14, #ff9f43)' },
    { title: 'Expense Claims', key: 'totalExpenseReimbursements', icon: 'attach_money', subtitle: 'Reimbursement claims', gradient: 'linear-gradient(135deg, #17a2b8, #20c997)' },
    { title: 'Inventory Requests', key: 'totalInventoryRequests', icon: 'inventory', subtitle: 'Supply requests', gradient: 'linear-gradient(135deg, #6c757d, #868e96)' },
    { title: 'Active Sick Leaves', key: 'activeSickLeaves', icon: 'local_hospital', subtitle: 'Current leaves', gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' }
  ];

  activitiesConfig = [
    { title: 'Medical Requests', key: 'totalMedicalRequests', icon: 'description', description: 'total requests processed', gradient: 'linear-gradient(135deg, #28a745, #20c997)' },
    { title: 'Laboratory Tests', key: 'totalLabTests', icon: 'science', description: 'tests completed', gradient: 'linear-gradient(135deg, #fd7e14, #ff9f43)' },
    { title: 'Prescriptions', key: 'totalPrescriptions', icon: 'medical_services', description: 'prescriptions issued', gradient: 'linear-gradient(135deg, #dc3545, #e74c3c)' },
    { title: 'Inventory', key: 'totalInventoryRequests', icon: 'inventory', description: 'inventory requests processed', gradient: 'linear-gradient(135deg, #6c757d, #868e96)' }
  ];

  constructor(private medicalService: MedicalService) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.isLoading = true;

    const currentYear = new Date().getFullYear();
    // Build 12 parallel calls for monthly SP across the year
    const monthlyCalls: Observable<any>[] = Array.from({ length: 12 }, (_, idx) =>
      this.medicalService.getMonthlyReport(currentYear, idx + 1)
    );

    // Parallel calls to APIs backed by SPs/views
    forkJoin({
      monthly: forkJoin(monthlyCalls),
      departmentStats: this.medicalService.getDepartmentStatistics(),
      financialSummary: this.medicalService.getFinancialSummary(),
      patientStats: this.medicalService.getPatientStatistics(),
      // Additional controllers for totals that are not covered by CHMS_ReportsController
      inventoryRequests: this.medicalService.getInventoryRequests(),
      sickLeaves: this.medicalService.getSickLeaveCertificates()
    }).subscribe(result => {
      // Map monthly stats
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyStats = result.monthly.map((items: any[], index: number) => {
        const getCount = (category: string) => {
          const row = items.find(r => (r.Category || r.category) === category);
          return row ? (row.Count || row.count || 0) : 0;
        };
        return {
          month: months[index],
          patients: getCount('Patients Registered'),
          requests: getCount('Medical Requests'),
          prescriptions: getCount('Prescriptions'),
          labTests: getCount('Laboratory Tests')
        };
      });

      // Aggregate totals from monthly report
      const sumByKey = (key: 'patients' | 'requests' | 'prescriptions' | 'labTests') =>
        monthlyStats.reduce((acc, m) => acc + (m[key] || 0), 0);

      // Map department stats to UI shape
      const departmentStats = (Array.isArray(result.departmentStats) ? result.departmentStats : []).map((d: any) => ({
        department: d.Department || d.department,
        patients: d.TotalEmployees || d.totalEmployees || 0, // proxy due to lack of per-dept patients
        requests: d.MedicalRequests || d.medicalRequests || 0,
        expenses: d.TotalExpenseReimbursements || d.totalExpenseReimbursements || 0,
        expenseReimbursementCount: d.ExpenseReimbursementCount || d.expenseReimbursementCount || 0
      }));

      // Financial summary
      this.financialSummary = {
        prescriptionRevenue: result.financialSummary?.prescriptionRevenue ?? result.financialSummary?.PrescriptionRevenue ?? 0,
        expenseReimbursements: result.financialSummary?.expenseReimbursements ?? result.financialSummary?.ExpenseReimbursements ?? 0,
        inventoryValue: result.financialSummary?.inventoryValue ?? result.financialSummary?.InventoryValue ?? 0,
        labTestRevenue: result.financialSummary?.labTestRevenue ?? result.financialSummary?.LabTestRevenue ?? 0
      };

      // Compute counts for reimbursements and sick leaves
      const totalExpenseReimbursementCount = departmentStats.reduce((acc: number, d: any) => acc + (d.expenseReimbursementCount || 0), 0);
      const activeSickLeaves = (Array.isArray(result.sickLeaves) ? result.sickLeaves : [])
        .filter((leave: any) => (leave.Status || leave.status || '').toString().toLowerCase() === 'active').length;

      // Final report data
      this.reportData = {
        totalPatients: result.patientStats?.TotalPatients || result.patientStats?.totalPatients || 0,
        totalMedicalRequests: sumByKey('requests'),
        totalPrescriptions: sumByKey('prescriptions'),
        totalLabTests: sumByKey('labTests'),
        totalExpenseReimbursements: totalExpenseReimbursementCount,
        totalInventoryRequests: Array.isArray(result.inventoryRequests) ? result.inventoryRequests.length : 0,
        activeSickLeaves,
        monthlyStats,
        departmentStats,
        expenseStats: []
      };

      this.updateChart();
      this.isLoading = false;
    });
  }

  // Retained for completeness; not used for server-driven stats now
  generateMonthlyStats(data: any): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthData = {
        month,
        patients: this.getCountByMonth(data.patients, index, currentYear),
        requests: this.getCountByMonth(data.medicalRequests, index, currentYear),
        prescriptions: this.getCountByMonth(data.prescriptions, index, currentYear),
        labTests: this.getCountByMonth(data.labTests, index, currentYear)
      };
      return monthData;
    });
  }

  generateDepartmentStats(data: any): any[] {
    const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];
    
    return departments.map(dept => ({
      department: dept,
      patients: Math.floor(Math.random() * 50) + 10,
      requests: Math.floor(Math.random() * 30) + 5,
      expenses: Math.floor(Math.random() * 10000) + 1000
    }));
  }

  generateExpenseStats(data: any): any[] {
    return data.expenseReimbursements.map((expense: any) => ({
      department: expense.department,
      amount: expense.totalAmount,
      month: new Date(expense.submissionDate).toLocaleDateString('en-US', { month: 'short' })
    }));
  }

  getCountByMonth(items: any[], month: number, year: number): number {
    return items.filter(item => {
      const itemDate = new Date(item.date || item.requestDate || item.submissionDate || item.issueDate);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    }).length;
  }

  updateChart(): void {
    this.chartOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Patients', 'Requests', 'Prescriptions', 'Lab Tests'],
        textStyle: { color: '#333' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: this.reportData.monthlyStats.map(stat => stat.month),
        axisLabel: { color: '#333' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#333' }
      },
      series: [
        {
          name: 'Patients',
          type: 'bar',
          data: this.reportData.monthlyStats.map(stat => stat.patients),
          itemStyle: { color: '#667eea' }
        },
        {
          name: 'Requests',
          type: 'bar',
          data: this.reportData.monthlyStats.map(stat => stat.requests),
          itemStyle: { color: '#28a745' }
        },
        {
          name: 'Prescriptions',
          type: 'bar',
          data: this.reportData.monthlyStats.map(stat => stat.prescriptions),
          itemStyle: { color: '#dc3545' }
        },
        {
          name: 'Lab Tests',
          type: 'bar',
          data: this.reportData.monthlyStats.map(stat => stat.labTests),
          itemStyle: { color: '#fd7e14' }
        }
      ]
    };
  }

  // Helpers for financial cards
  getTotalRevenue(): number {
    return (this.financialSummary.prescriptionRevenue || 0) + (this.financialSummary.labTestRevenue || 0);
  }
  getTotalExpenses(): number {
    return this.financialSummary.expenseReimbursements || 0;
  }
  getNetProfit(): number {
    return this.getTotalRevenue() - this.getTotalExpenses();
  }

  getPerformanceGradient(patients: number): string {
    const percentage = (patients / 60) * 100;
    if (percentage > 75) return 'linear-gradient(90deg, #28a745, #20c997)';
    if (percentage > 50) return 'linear-gradient(90deg, #fd7e14, #ff9f43)';
    return 'linear-gradient(90deg, #dc3545, #e74c3c)';
  }

  onReportTypeChange(): void {
    this.loadReportData();
  }

  // Detail modal logic
  openDetail(stat: { title: string; key: string }): void {
    this.detailTitle = stat.title;
    this.detailModalOpen = true;

    // Default chart over months using existing monthlyStats
    this.detailChartOptions = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: this.reportData.monthlyStats.map(m => m.month) },
      yAxis: { type: 'value' },
      series: [
        { name: stat.title, type: 'bar', data: this.reportData.monthlyStats.map(m => m[this.mapStatKeyToMonthlyKey(stat.key)]) }
      ]
    };

    // Configure table per metric
    switch (stat.key) {
      case 'totalPatients':
        // ---------- COLUMNS ----------
        this.detailColumns = [
          { field: 'CardNumber',       header: 'Card #' },
          { field: 'FullName',         header: 'Full Name' },
          { field: 'FatherName',       header: 'Father Name' },
          { field: 'Gender',           header: 'Gender' },
          { field: 'Age',              header: 'Age' },
          { field: 'Phone',            header: 'Phone' },
          { field: 'Address',          header: 'Address' },
          { field: 'BloodType',        header: 'Blood Type' },
          { field: 'Department',       header: 'Department' },
          { field: 'TotalVisits',      header: 'Total Visits' },
          { field: 'LastVisitDate',    header: 'Last Visit' },
          { field: 'LastDiagnosis',    header: 'Last Diagnosis' },
          { field: 'RegistrationDate', header: 'Registered' }
        ];
      
        // ---------- DATA ----------
        this.medicalService.getPatients().subscribe(list => {
          this.detailRows = (list || []).map((p: any) => {
            const regDate = p.RegistrationDate || p.registrationDate
              ? new Date(p.RegistrationDate || p.registrationDate).toLocaleDateString()
              : '—';
      
            const lastVisit = p.LastVisitDate || p.lastVisitDate
              ? new Date(p.LastVisitDate || p.lastVisitDate).toLocaleDateString()
              : '—';
      
            const age = p.Age ?? p.age ?? '—';
            const blood = p.BloodType || p.bloodType || '—';
            const phone = p.phone || p.Phone || '—';
            const diagnosis = p.LastDiagnosis || p.lastDiagnosis || '—';
            const dept = p.department_name || p.Department || '—';
      
            return {
              CardNumber:       p.CardNumber       || p.cardNumber       || '—',
              FullName:         p.FullName         || p.fullName         || '—',
              FatherName:       p.FatherName       || p.fatherName       || '—',
              Gender:           p.gender           || p.Gender           || '—',
              Age:              age,
              Phone:            phone,
              Address:          p.Address          || p.address          || '—',
              BloodType:        blood === '' ? '—' : blood,
              Department:       dept,
              TotalVisits:      p.TotalVisits      || p.totalVisits      || 0,
              LastVisitDate:    lastVisit,
              LastDiagnosis:    diagnosis,
              RegistrationDate: regDate
            };
          });
        });
      
        // ---------- CHART: Monthly Patient Registrations ----------
        this.detailChartOptions = {
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: this.reportData.monthlyStats.map(m => m.month) },
          yAxis: { type: 'value' },
          series: [
            {
              name: 'New Patients',
              type: 'bar',
              data: this.reportData.monthlyStats.map(m => m.patients),
              itemStyle: { color: '#667eea' },
              emphasis: { itemStyle: { color: '#5a6fd8' } }
            }
          ]
        };
        break;
        case 'totalMedicalRequests':
          this.detailColumns = [
            { field: 'RequestNumber', header: 'Request #' },
            { field: 'EmployeeName', header: 'Employee Name' },
            { field: 'EmployeeCode', header: 'Emp Code' },
            { field: 'Department', header: 'Department' },
            { field: 'RequestType', header: 'Type' },
            { field: 'Reason', header: 'Reason' },
            { field: 'PreferredDateTime', header: 'Preferred Date & Time' },
            { field: 'SupervisorApproval', header: 'Sup. Approved' },
            { field: 'ApprovedByName', header: 'Approved By' },
            { field: 'Status', header: 'Status' },
            { field: 'RequestDate', header: 'Requested On' }
          ];
        
          this.medicalService.getAllMedicalRequests().subscribe(list => {
            this.detailRows = (list || []).map((r: any) => {
              const requestDate = r.requestDate ? new Date(r.requestDate) : null;
              const preferredDate = r.preferredDate ? new Date(r.preferredDate) : null;
              const preferredTime = r.preferredTime
                ? new Date(`1970-01-01T${r.preferredTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
        
              const preferredDateTime = preferredDate
                ? `${preferredDate.toLocaleDateString()} ${preferredTime}`
                : 'N/A';
        
              return {
                RequestNumber: r.requestNumber || r.RequestNumber,
                EmployeeName: r.employeeName || r.EmployeeName || 'N/A',
                EmployeeCode: r.employeeCode || r.EmployeeCode,
                Department: r.department || r.Department || 'N/A',
                RequestType: r.requestType || r.RequestType,
                Reason: r.reason || r.Reason || '—',
                PreferredDateTime: preferredDateTime,
                SupervisorApproval: r.supervisorApproval === true ? 'Yes' : r.supervisorApproval === false ? 'No' : 'Pending',
                ApprovedByName: r.approvedByName || r.ApprovedByName || '—',
                Status: r.status || r.Status,
                RequestDate: requestDate ? requestDate.toLocaleDateString() : ''
              };
            });
          });
          break;
          case 'totalPrescriptions':
            // ---------- COLUMNS ----------
            this.detailColumns = [
              { field: 'PrescriptionNumber', header: 'Prescription #' },
              { field: 'PatientName',       header: 'Patient' },
              { field: 'CardNumber',        header: 'Card #' },
              { field: 'PrescriberName',    header: 'Prescribed By' },
              { field: 'PharmacistName',    header: 'Pharmacist' },
              { field: 'PrescriptionDate',  header: 'Date' },
              { field: 'TotalAmount',       header: 'Amount (ETB)' },
              { field: 'Status',            header: 'Status' },
              { field: 'Notes',             header: 'Notes' }
            ];
          
            // ---------- DATA ----------
            this.medicalService.getPrescriptions().subscribe(list => {
              this.detailRows = (list || []).map((p: any) => {
                const prescDate = p.prescriptionDate
                  ? new Date(p.prescriptionDate).toLocaleDateString()
                  : '—';
          
                return {
                  PrescriptionNumber: p.prescriptionNumber || p.PrescriptionNumber,
                  PatientName:       p.patientName       || p.PatientName       || '—',
                  CardNumber:        p.cardNumber        || p.CardNumber        || '—',
                  PrescriberName:    p.prescriberName    || p.PrescriberName    || '—',
                  PharmacistName:    p.pharmacistName    ?? '—',               // null → "—"
                  PrescriptionDate:  prescDate,
                  TotalAmount:       (p.totalAmount ?? 0).toFixed(2),
                  Status:            p.status            || p.Status            || '—',
                  Notes:             p.notes             || p.Notes             || '—'
                };
              });
            });
          
            // ---------- CHART (Monthly Prescription Trend) ----------
            this.detailChartOptions = {
              tooltip: { trigger: 'axis' },
              xAxis: { type: 'category', data: this.reportData.monthlyStats.map(m => m.month) },
              yAxis: { type: 'value' },
              series: [
                {
                  name: 'Prescriptions',
                  type: 'line',
                  data: this.reportData.monthlyStats.map(m => m.prescriptions),
                  itemStyle: { color: '#dc3545' },
                  areaStyle: { opacity: 0.1 }
                }
              ]
            };
            break;
      case 'totalLabTests':
        this.detailColumns = [
          { field: 'TestNumber', header: 'Test #' },
          { field: 'PatientName', header: 'Patient' },
          { field: 'TestCategory', header: 'Category' },
          { field: 'Status', header: 'Status' },
          { field: 'TestDate', header: 'Date' }
        ];
        this.medicalService.getLaboratoryTests().subscribe(list => {
          this.detailRows = (list || []).map((t: any) => ({
            TestNumber: t.testNumber || t.TestNumber,
            PatientName: t.patientName || t.PatientName,
            TestCategory: t.testCategory || t.TestCategory,
            Status: t.status || t.Status,
            TestDate: t.testDate ? new Date(t.testDate).toLocaleDateString() : ''
          }));
        });
        break;
      case 'totalExpenseReimbursements':
        this.detailColumns = [
          { field: 'ReimbursementNumber', header: 'Reimb. #' },
          { field: 'PatientName', header: 'Patient' },
          { field: 'Department', header: 'Department' },
          { field: 'Status', header: 'Status' },
          { field: 'TotalAmount', header: 'Amount' }
        ];
        this.medicalService.getExpenseReimbursements().subscribe(list => {
          this.detailRows = (list || []).map((e: any) => ({
            ReimbursementNumber: e.reimbursementNumber || e.ReimbursementNumber,
            PatientName: e.patientName || e.PatientName,
            Department: e.department || e.Department,
            Status: e.status || e.Status,
            TotalAmount: e.totalAmount || e.TotalAmount
          }));
        });
        break;
      case 'totalInventoryRequests':
        this.detailColumns = [
          { field: 'RequestNumber', header: 'Request #' },
          { field: 'RequestedFrom', header: 'Requested From' },
          { field: 'ReasonForRequest', header: 'Reason' },
          { field: 'Status', header: 'Status' },
          { field: 'RequestDate', header: 'Date' }
        ];
        this.medicalService.getInventoryRequests().subscribe(list => {
          this.detailRows = (list || []).map((r: any) => ({
            RequestNumber: r.requestNumber,
            RequestedFrom: r.requestedFrom,
            ReasonForRequest: r.reasonForRequest,
            Status: r.status,
            RequestDate: r.requestDate ? new Date(r.requestDate).toLocaleDateString() : ''
          }));
        });
        break;
      case 'activeSickLeaves':
        this.detailColumns = [
          { field: 'EmployeeID', header: 'Employee ID' },
          { field: 'PatientName', header: 'Patient' },
          { field: 'DoctorName', header: 'Doctor' },
          { field: 'StartDate', header: 'Start' },
          { field: 'EndDate', header: 'End' }
        ];
        this.medicalService.getSickLeaveCertificates().subscribe(list => {
          this.detailRows = (list || []).filter((s: any) => (s.status || s.Status) === 'Active').map((s: any) => ({
            EmployeeID: s.employeeID || s.EmployeeID,
            PatientName: s.patientName || s.PatientName,
            DoctorName: s.doctorName || s.DoctorName,
            StartDate: s.startDate || s.StartDate,
            EndDate: s.endDate || s.EndDate
          }));
        });
        break;
      default:
        this.detailColumns = [];
        this.detailRows = [];
    }
  }

  openDepartmentDetail(dept: any): void {
    this.detailTitle = `Department: ${dept.department}`;
    this.detailModalOpen = true;

    // Chart: requests vs expenses
    this.detailChartOptions = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Requests', 'Expenses (ETB)'] },
      yAxis: { type: 'value' },
      series: [
        { name: 'Value', type: 'bar', data: [dept.requests || 0, dept.expenses || 0], itemStyle: { color: '#667eea' } }
      ]
    };

    // Table: pull medical requests and expense reimbursements for context
    this.detailColumns = [
      { field: 'Type', header: 'Type' },
      { field: 'Identifier', header: 'Identifier' },
      { field: 'Status', header: 'Status' },
      { field: 'Amount', header: 'Amount' },
      { field: 'Date', header: 'Date' }
    ];

    forkJoin({
      requests: this.medicalService.getAllMedicalRequests(),
      expenses: this.medicalService.getExpenseReimbursements()
    }).subscribe(({ requests, expenses }) => {
      const rowsReq = (requests || [])
        .filter((r: any) => (r.department || r.Department) === dept.department)
        .map((r: any) => ({
          Type: 'Request',
          Identifier: r.requestNumber || r.RequestNumber,
          Status: r.status || r.Status,
          Amount: '',
          Date: r.requestDate ? new Date(r.requestDate).toLocaleDateString() : ''
        }));

      const rowsExp = (expenses || [])
        .filter((e: any) => (e.department || e.Department) === dept.department)
        .map((e: any) => ({
          Type: 'Expense',
          Identifier: e.reimbursementNumber || e.ReimbursementNumber,
          Status: e.status || e.Status,
          Amount: e.totalAmount || e.TotalAmount,
          Date: e.submissionDate ? new Date(e.submissionDate).toLocaleDateString() : ''
        }));

      this.detailRows = [...rowsReq, ...rowsExp];
    });
  }

  closeDetail(): void {
    this.detailModalOpen = false;
    this.detailRows = [];
    this.detailColumns = [];
    this.detailChartOptions = undefined;
  }

  private mapStatKeyToMonthlyKey(key: string): 'patients' | 'requests' | 'prescriptions' | 'labTests' {
    switch (key) {
      case 'totalPatients':
        return 'patients';
      case 'totalMedicalRequests':
        return 'requests';
      case 'totalPrescriptions':
        return 'prescriptions';
      case 'totalLabTests':
        return 'labTests';
      default:
        return 'requests';
    }
  }

  exportReport(format: string): void {
    if (format === 'pdf') {
      this.exportToPDF();
    } else if (format === 'excel') {
      this.exportToExcel();
    }
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Hospital Management Report', 14, 22);
    
    // Overview Stats
    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Value']],
      body: this.statsConfig.map(stat => [stat.title, this.reportData[stat.key]]),
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { top: 30 }
    });

    // Department Stats
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Department', 'Patients', 'Requests', 'Expenses (ETB)']],
      body: this.reportData.departmentStats.map(dept => [
        dept.department,
        dept.patients,
        dept.requests,
        dept.expenses.toFixed(2)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] }
    });

    // Financial Summary
    const revenue = this.getTotalRevenue().toFixed(2);
    const expenses = this.getTotalExpenses().toFixed(2);
    const profit = this.getNetProfit().toFixed(2);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Metric', 'Amount (ETB)']],
      body: [
        ['Total Revenue', revenue],
        ['Total Expenses', expenses],
        ['Net Profit', profit]
      ],
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save(`hospital_report_${this.selectedDateRange}.pdf`);
  }

  exportToExcel(): void {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Hospital Management Report', style: 'header' },
        { text: `Generated on: ${this.curruntdate.toLocaleDateString()}`, style: 'subheader' },
        { text: 'Overview Statistics', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              ['Metric', 'Value'],
              ...this.statsConfig.map(stat => [stat.title, this.reportData[stat.key]])
            ]
          }
        },
        { text: 'Department Statistics', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              ['Department', 'Patients', 'Requests', 'Expenses (ETB)'],
              ...this.reportData.departmentStats.map(dept => [
                dept.department,
                dept.patients,
                dept.requests,
                dept.expenses.toFixed(2)
              ])
            ]
          }
        },
        { text: 'Financial Summary', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              ['Metric', 'Amount (ETB)'],
              ['Total Revenue', this.getTotalRevenue().toFixed(2)],
              ['Total Expenses', this.getTotalExpenses().toFixed(2)],
              ['Net Profit', this.getNetProfit().toFixed(2)]
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 12, margin: [0, 0, 0, 20] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 10] }
      }
    };

    pdfMake.createPdf(docDefinition).download(`hospital_report_${this.selectedDateRange}.pdf`);
  }

  printReport(): void {
    window.print();
  }
}