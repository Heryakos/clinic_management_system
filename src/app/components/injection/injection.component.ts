import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { InjectionDetailsDialogComponent } from '../injection-details-dialog/injection-details-dialog.component';
import { InjectionPaperComponent } from '../injection-paper/injection-paper.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-injection',
    templateUrl: './injection.component.html',
    styleUrls: ['./injection.component.css']
})
export class InjectionComponent implements OnInit {
    searchForm!: FormGroup;
    patient: any | null = null;
    injections: any[] = [];
    isSearching = false;
    nurseId: string | null = null;
    globalActiveInjections: any[] = [];
    selectedInjection: any | null = null;
    
    // New properties from InjectionManagementComponent
    todaySchedules: any[] = [];
    selectedTab: 'today' | 'all' | 'patient' = 'today';
    selectedProcedureTab: 'injections' | 'wound-care' | 'suturing' | 'ear-irrigation' = 'injections';
    isLoading = false;
    currentUserID: string | null = null;
    
    // Procedure data properties
    woundCareProcedures: any[] = [];
    suturingProcedures: any[] = [];
    earIrrigationProcedures: any[] = [];
    todayProcedures: any[] = [];

    constructor(
        private fb: FormBuilder,
        private medicalService: MedicalService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadUserData();
        this.initializeSearchForm();
        this.loadActiveInjectionsQueue();
        this.loadTodaySchedules();
        this.currentUserID = environment.username;
    }

    loadUserData(): void {
        this.medicalService.getEmployeeById(environment.username).subscribe(
            (response: any) => {
                const employee = response?.c_Employees?.[0];
                this.nurseId = employee?.user_ID || null;
                console.log('nurseIdemployee', this.nurseId);
            },
            error => {
                this.nurseId = null;
                this.showSnackBar(`Error loading user data: ${error.message}`, 'error-snackbar');
            }
        );
    }

    initializeSearchForm(): void {
        this.searchForm = this.fb.group({
            patientID: ['', [Validators.required]]
        });
    }

    // Tab management
    selectTab(tab: 'today' | 'all' | 'patient'): void {
        this.selectedTab = tab;
        if (tab === 'today') {
            this.loadTodaySchedules();
        } else if (tab === 'all') {
            this.loadActiveInjectionsQueue();
        }
        // 'patient' tab uses the existing search functionality
    }

    // Procedure tab management
    selectProcedureTab(tab: 'injections' | 'wound-care' | 'suturing' | 'ear-irrigation'): void {
        this.selectedProcedureTab = tab;
        // Reset to default injection tab when switching procedures
        if (tab === 'injections') {
            this.selectedTab = 'today';
            this.loadTodaySchedules();
        } else {
            this.loadTodayProcedures();
        }
    }

    // Load today's procedures for all procedure types
    loadTodayProcedures(): void {
        this.isLoading = true;
        this.medicalService.getTodayPendingProcedures().subscribe({
            next: (procedures) => {
                this.todayProcedures = (procedures || []).map((procedure: any) => {
                    const converted = this.convertToCamelCase(procedure);
                    // Map procedure-specific fields based on type
                    if (procedure.ProcedureType === 'WoundCare') {
                        converted.woundType = procedure.WoundType || 'Unknown';
                        converted.woundLocation = procedure.WoundLocation || 'Unknown';
                        converted.treatmentPlan = procedure.TreatmentPlan || 'Unknown';
                    } else if (procedure.ProcedureType === 'Suturing') {
                        converted.woundType = procedure.WoundType || 'Unknown';
                        converted.woundLocation = procedure.WoundLocation || 'Unknown';
                        converted.treatmentPlan = procedure.TreatmentPlan || 'Unknown';
                    } else if (procedure.ProcedureType === 'EarIrrigation') {
                        converted.earSide = procedure.EarSide || 'Unknown';
                        converted.irrigationSolution = procedure.IrrigationSolution || 'Unknown';
                        converted.solutionTemperature = procedure.SolutionTemperature || 'Unknown';
                    }
                    return converted;
                });
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading today procedures:', error);
                this.showSnackBar('Error loading today\'s procedures', 'error-snackbar');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Load wound care procedures for patient
    loadPatientWoundCare(patientID: number): void {
        this.medicalService.getPatientWoundCare(patientID).subscribe(
            procedures => {
                this.woundCareProcedures = (procedures || []).map((procedure: any) => this.convertToCamelCase(procedure));
            },
            error => {
                this.woundCareProcedures = [];
                this.showSnackBar(`Error loading wound care procedures: ${error.message}`, 'error-snackbar');
            }
        );
    }

    // Load suturing procedures for patient
    loadPatientSuturing(patientID: number): void {
        this.medicalService.getPatientSuturing(patientID).subscribe(
            procedures => {
                this.suturingProcedures = (procedures || []).map((procedure: any) => this.convertToCamelCase(procedure));
            },
            error => {
                this.suturingProcedures = [];
                this.showSnackBar(`Error loading suturing procedures: ${error.message}`, 'error-snackbar');
            }
        );
    }

    // Load ear irrigation procedures for patient
    loadPatientEarIrrigation(patientID: number): void {
        this.medicalService.getPatientEarIrrigation(patientID).subscribe(
            procedures => {
                this.earIrrigationProcedures = (procedures || []).map((procedure: any) => this.convertToCamelCase(procedure));
            },
            error => {
                this.earIrrigationProcedures = [];
                this.showSnackBar(`Error loading ear irrigation procedures: ${error.message}`, 'error-snackbar');
            }
        );
    }

    // Administer procedure
    administerProcedure(procedureID: number, procedureType: 'Injection' | 'WoundCare' | 'Suturing' | 'EarIrrigation'): void {
        if (!this.nurseId) {
            this.showSnackBar('User not authenticated', 'error-snackbar');
            return;
        }

        if (confirm(`Confirm administering ${procedureType} procedure #${procedureID}?`)) {
            const request = {
                procedureID: procedureID,
                procedureType: procedureType,
                performedBy: this.nurseId,
                performedDate: new Date(),
                notes: ''
            };

            this.isLoading = true;
            this.medicalService.administerProcedure(request).subscribe({
                next: () => {
                    this.showSnackBar(`${procedureType} procedure administered successfully`, 'success-snackbar');
                    this.refreshData();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error administering procedure:', error);
                    this.showSnackBar('Error administering procedure', 'error-snackbar');
                    this.isLoading = false;
                }
            });
        }
    }

    // Methods from InjectionManagementComponent
    loadTodaySchedules(): void {
        this.isLoading = true;
        this.medicalService.getTodayPendingSchedules().subscribe({
            next: (schedules) => {
                // Convert PascalCase to camelCase and ensure proper field mapping
                this.todaySchedules = (schedules || []).map((schedule: any) => this.convertToCamelCase(schedule));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading today schedules:', error);
                this.showSnackBar('Error loading today\'s schedules', 'error-snackbar');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadActiveInjectionsQueue(): void {
        this.isLoading = true;
        this.medicalService.getActiveInjections().subscribe(
            (rows) => { 
                // Convert PascalCase to camelCase and ensure proper field mapping
                this.globalActiveInjections = (rows || []).map((injection: any) => this.convertToCamelCase(injection));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            (error) => { 
                this.globalActiveInjections = []; 
                this.isLoading = false;
                this.cdr.detectChanges();
                this.showSnackBar('Error loading active injections', 'error-snackbar');
            }
        );
    }

    // Existing methods
    onSearchPatient(): void {
        if (this.searchForm.valid) {
            this.isSearching = true;
            const cardNumber = this.searchForm.value.patientID;
            this.medicalService.getPatient(cardNumber).subscribe(
                (response: any) => {
                    const p = Array.isArray(response) ? response[0] : response;
                    if (!p) {
                        throw new Error('Patient not found');
                    }
                    const normalized = {
                        firstName: p.FirstName || '',
                        lastName: p.LastName || '',
                        cardNumber: p.CardNumber || cardNumber,
                        age: p.Age,
                        gender: p.Gender || p.gender,
                        patientID: p.PatientID
                    };
                    this.patient = normalized;
                    this.loadPatientInjections(Number(p.PatientID));
                    this.isSearching = false;
                    this.selectedTab = 'patient'; // Switch to patient tab after search
                },
                error => {
                    this.patient = null;
                    this.injections = [];
                    this.isSearching = false;
                    this.showSnackBar(`Error fetching patient: ${error.message}`, 'error-snackbar');
                }
            );
        }
    }

    loadPatientInjections(patientID: number): void {
        this.medicalService.getPatientInjections(patientID).subscribe(
            injections => {
                // Convert PascalCase to camelCase and ensure proper field mapping
                this.injections = (injections || []).map((injection: any) => this.convertToCamelCase(injection));
            },
            error => {
                this.injections = [];
                this.showSnackBar(`Error loading injections: ${error.message}`, 'error-snackbar');
            }
        );
    }

    // View injection details - enhanced version
    viewInjectionDetails(injectionID: number, patientID?: number): void {
        if (!injectionID) return;

        console.log('Opening injection details for ID:', injectionID, 'Patient ID:', patientID);

        const dialogRef = this.dialog.open(InjectionPaperComponent, {
            width: '900px',
            maxWidth: '95vw',
            height: 'auto',
            maxHeight: '90vh',
            data: {
                injectionID: injectionID,
                patientID: patientID,
                dialogTitle: 'Injection Details'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.refresh) {
                this.refreshData();
            }
        });
    }

    // Administer injection - enhanced version
    administerInjection(injectionID: number): void {
        if (this.nurseId) {
            this.medicalService.administerInjection(injectionID, this.nurseId).subscribe(
                () => {
                    if (this.patient?.patientID) {
                        this.loadPatientInjections(this.patient.patientID);
                    }
                    this.loadActiveInjectionsQueue();
                    this.loadTodaySchedules();
                    this.showSnackBar('Injection administered successfully!', 'success-snackbar');
                },
                error => {
                    this.showSnackBar(`Error administering injection: ${error.message}`, 'error-snackbar');
                }
            );
        } else {
            this.showSnackBar('Nurse ID not found.', 'error-snackbar');
        }
    }

    // New method from InjectionManagementComponent
    administerScheduledInjection(schedule: any): void {
        if (!this.nurseId) {
            this.showSnackBar('User not authenticated', 'error-snackbar');
            return;
        }

        if (confirm(`Confirm administering injection for schedule #${schedule.scheduleID}?`)) {
            const request = {
                scheduleID: schedule.scheduleID,
                administeredBy: this.nurseId,
                administeredDate: new Date(),
                notes: ''
            };

            this.isLoading = true;
            this.medicalService.administerInjectionSchedules(request).subscribe({
                next: () => {
                    this.showSnackBar('Injection administered successfully', 'success-snackbar');
                    this.refreshData();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error administering injection:', error);
                    this.showSnackBar('Error administering injection', 'error-snackbar');
                    this.isLoading = false;
                }
            });
        }
    }

    // Helper methods from InjectionManagementComponent
    getScheduleStatusClass(status: string): string {
        if (!status) return 'status-unknown';
        
        const statusMap: { [key: string]: string } = {
            'Pending': 'status-pending',
            'Administered': 'status-administered',
            'Missed': 'status-missed',
            'Cancelled': 'status-cancelled',
            'Active': 'status-active',
            'Completed': 'status-completed'
        };
        return statusMap[status] || 'status-unknown';
    }

    getScheduleProgress(injection: any): number {
        if (!injection || !injection.totalDoses || injection.totalDoses === 0) return 0;
        return Math.round((injection.administeredDoses || 0) / injection.totalDoses * 100);
    }

    getProgressBarClass(progress: number): string {
        if (progress >= 75) return 'progress-high';
        if (progress >= 50) return 'progress-medium';
        if (progress >= 25) return 'progress-low';
        return 'progress-very-low';
    }

    refreshData(): void {
        if (this.selectedProcedureTab === 'injections') {
            if (this.selectedTab === 'today') {
                this.loadTodaySchedules();
            } else if (this.selectedTab === 'all') {
                this.loadActiveInjectionsQueue();
            } else if (this.selectedTab === 'patient' && this.patient?.patientID) {
                this.loadPatientInjections(this.patient.patientID);
            }
        } else {
            this.loadTodayProcedures();
        }
    }

    // Utility method to convert PascalCase to camelCase and ensure field mapping
    private convertToCamelCase(obj: any): any {
        if (!obj) return obj;

        const result: any = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Convert PascalCase to camelCase
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                
                // Handle specific field mappings
                if (key === 'PatientName') {
                    result['fullName'] = obj[key];
                } else if (key === 'OrderingPhysicianName') {
                    result['orderingPhysicianName'] = obj[key];
                } else if (key === 'AdministeredByName') {
                    result['administeredByName'] = obj[key];
                } else if (key === 'MedicationName') {
                    result['medicationName'] = obj[key];
                } else if (key === 'DosageForm') {
                    result['dosageForm'] = obj[key];
                } else if (key === 'InjectionNumber') {
                    result['injectionNumber'] = obj[key];
                } else if (key === 'InjectionDate') {
                    result['injectionDate'] = obj[key];
                } else if (key === 'InjectionID') {
                    result['injectionID'] = obj[key];
                } else if (key === 'ScheduleID') {
                    result['scheduleID'] = obj[key];
                } else if (key === 'ScheduledDate') {
                    result['scheduledDate'] = obj[key];
                } else if (key === 'Status') {
                    result['status'] = obj[key];
                } else {
                    result[camelKey] = obj[key];
                }
            }
        }

        // Ensure critical fields exist
        if (!result.status && obj.Status) {
            result.status = obj.Status;
        }
        if (!result.injectionID && obj.InjectionID) {
            result.injectionID = obj.InjectionID;
        }
        if (!result.patientID && obj.PatientID) {
            result.patientID = obj.PatientID;
        }

        return result;
    }

    private showSnackBar(message: string, panelClass: string = 'info-snackbar'): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: [panelClass]
        });
    }
}