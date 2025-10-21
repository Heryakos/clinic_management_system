import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { InjectionDetailsDialogComponent } from '../injection-details-dialog/injection-details-dialog.component';
import { InjectionPaperComponent } from '../injection-paper/injection-paper.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WoundCarePaperComponent } from '../wound-care-paper/wound-care-paper.component';
import { EarIrrigationPaperComponent } from '../ear-irrigation-paper/ear-irrigation-paper.component';
import { SuturingPaperComponent } from '../suturing-paper/suturing-paper.component';
import { ProcedureStatusUpdate } from 'src/app/models/procedure.models';

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
    ) { }

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

        if (tab === 'injections') {
            this.selectedTab = 'today';
            this.loadTodaySchedules();
        } else {
            this.loadTodayProcedures();
            // For "All" tabs, call the respective load methods when switching to 'all'
            if (this.selectedTab === 'all') {
                switch (tab) {
                    case 'wound-care': this.loadAllWoundCareProcedures(); break;
                    case 'suturing': this.loadAllSuturingProcedures(); break;
                    case 'ear-irrigation': this.loadAllEarIrrigationProcedures(); break;
                }
            }
        }
    }

    loadTodayProcedures(): void {
        this.isLoading = true;
        this.medicalService.getTodayPendingProcedures().subscribe({
            next: (procedures) => {
                this.todayProcedures = (procedures || []).map((procedure: any) => {
                    // ✅ FIXED: Use ProcedureID from SP (WORKS FOR ALL TYPES!)
                    const converted = this.convertToCamelCase(procedure);
                    converted.id = procedure.ProcedureID;  // ← FROM SP
                    converted.procedureID = procedure.ProcedureID;  // ← FROM SP
                    
                    // ✅ Map fields based on procedure type
                    if (procedure.ProcedureType === 'WoundCare') {
                        converted.woundType = procedure.WoundType || 'Unknown';
                        converted.woundLocation = procedure.WoundLocation || 'Unknown';
                        converted.treatmentPlan = procedure.TreatmentPlan || 'Unknown';
                    } else if (procedure.ProcedureType === 'Suturing') {
                        converted.woundType = procedure.WoundType || 'Unknown';
                        converted.woundLocation = procedure.WoundLocation || 'Unknown';
                        converted.sutureType = procedure.TreatmentPlan || 'Unknown'; // SutureType mapped to TreatmentPlan in SP
                    } else if (procedure.ProcedureType === 'EarIrrigation') {
                        converted.earSide = procedure.WoundType || 'Unknown'; // EarSide mapped to WoundType in SP
                        converted.irrigationSolution = procedure.WoundLocation || 'Unknown'; // IrrigationSolution mapped to WoundLocation
                        converted.solutionTemperature = procedure.TreatmentPlan || 'Unknown'; // SolutionTemperature mapped to TreatmentPlan
                    }
    
                    converted.procedureType = procedure.ProcedureType;
                    
                    console.log('✅ FIXED Procedure with ID:', converted);
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
    administerProcedure(procedure: any): void {
        // ✅ FIXED: USE procedure.id (now properly set) OR fallback to procedureID
        const procedureId = procedure.id || procedure.procedureID;

        if (!procedureId) {
            this.showSnackBar('Procedure ID not found!', 'error-snackbar');
            console.error('Procedure ID is missing:', procedure);
            return;
        }

        const statusUpdate: ProcedureStatusUpdate = {
            status: 'Completed',
            performedBy: this.nurseId || 'Nurse Admin',
            performedDate: new Date(),
            notes: 'Administered successfully'
        };

        let successMessage = '';

        console.log('Administering:', procedure.procedureType, 'ID:', procedureId); // DEBUG

        // ✅ FIXED: CALL CORRECT SERVICE METHOD FOR EACH PROCEDURE TYPE
        switch (procedure.procedureType) {
            case 'Injection':
                this.medicalService.administerInjection(procedureId, statusUpdate.performedBy).subscribe({
                    next: () => {
                        this.showSnackBar('Injection administered successfully!');
                        this.refreshData();
                    },
                    error: (err) => this.showSnackBar('Failed to administer injection: ' + err.message, 'error-snackbar')
                });
                break;

            case 'WoundCare':
                this.medicalService.updateWoundCareStatus(procedureId, statusUpdate).subscribe({
                    next: () => {
                        this.showSnackBar('Wound care administered successfully!');
                        this.refreshData();
                    },
                    error: (err) => this.showSnackBar('Failed to administer wound care: ' + err.message, 'error-snackbar')
                });
                break;

            case 'Suturing':
                this.medicalService.updateSuturingStatus(procedureId, statusUpdate).subscribe({
                    next: () => {
                        this.showSnackBar('Suturing administered successfully!');
                        this.refreshData();
                    },
                    error: (err) => this.showSnackBar('Failed to administer suturing: ' + err.message, 'error-snackbar')
                });
                break;

            case 'EarIrrigation':
                this.medicalService.updateEarIrrigationStatus(procedureId, statusUpdate).subscribe({
                    next: () => {
                        this.showSnackBar('Ear irrigation administered successfully!');
                        this.refreshData();
                    },
                    error: (err) => this.showSnackBar('Failed to administer ear irrigation: ' + err.message, 'error-snackbar')
                });
                break;

            default:
                this.showSnackBar('Unknown procedure type: ' + procedure.procedureType, 'error-snackbar');
        }
    }

    // Load ALL active wound care procedures
    loadAllWoundCareProcedures(): void {
        // For "All" tab, you might need a new API endpoint
        // For now, load for a dummy patient or create getAllWoundCare() method
        this.woundCareProcedures = [];
        this.showSnackBar('All procedures view coming soon!', 'info-snackbar');
    }

    // Load ALL active suturing procedures
    loadAllSuturingProcedures(): void {
        this.suturingProcedures = [];
        this.showSnackBar('All procedures view coming soon!', 'info-snackbar');
    }

    // Load ALL active ear irrigation procedures
    loadAllEarIrrigationProcedures(): void {
        this.earIrrigationProcedures = [];
        this.showSnackBar('All procedures view coming soon!', 'info-snackbar');
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
    // viewInjectionDetails(injectionID: number, patientID?: number): void {
    //     if (!injectionID) return;

    //     console.log('Opening injection details for ID:', injectionID, 'Patient ID:', patientID);

    //     const dialogRef = this.dialog.open(InjectionPaperComponent, {
    //         width: '900px',
    //         maxWidth: '95vw',
    //         height: 'auto',
    //         maxHeight: '90vh',
    //         data: {
    //             injectionID: injectionID,
    //             patientID: patientID,
    //             dialogTitle: 'Injection Details'
    //         }
    //     });

    //     dialogRef.afterClosed().subscribe(result => {
    //         if (result && result.refresh) {
    //             this.refreshData();
    //         }
    //     });
    // }
    viewProcedureDetails(procedureID: number, patientID: number, procedureType: 'Injection' | 'WoundCare' | 'Suturing' | 'EarIrrigation'): void {
        if (!procedureID) return;

        console.log(`Opening ${procedureType} details for ID:`, procedureID, 'Patient ID:', patientID);

        // Open appropriate dialog based on procedure type
        let dialogRef;

        if (procedureType === 'Injection') {
            dialogRef = this.dialog.open(InjectionPaperComponent, {
                width: '900px',
                maxWidth: '95vw',
                height: 'auto',
                maxHeight: '90vh',
                data: {
                    injectionID: procedureID,
                    patientID: patientID,
                    dialogTitle: 'Injection Details'
                }
            });
        } else if (procedureType === 'WoundCare') {
            dialogRef = this.dialog.open(WoundCarePaperComponent, {
                width: '900px',
                maxWidth: '95vw',
                height: 'auto',
                maxHeight: '90vh',
                data: {
                    woundCareID: procedureID,
                    patientID: patientID,
                    dialogTitle: 'Wound Care Details'
                }
            });
        } else if (procedureType === 'Suturing') {
            dialogRef = this.dialog.open(SuturingPaperComponent, {
                width: '900px',
                maxWidth: '95vw',
                height: 'auto',
                maxHeight: '90vh',
                data: {
                    suturingID: procedureID,
                    patientID: patientID,
                    dialogTitle: 'Suturing Details'
                }
            });
        } else if (procedureType === 'EarIrrigation') {
            dialogRef = this.dialog.open(EarIrrigationPaperComponent, {
                width: '900px',
                maxWidth: '95vw',
                height: 'auto',
                maxHeight: '90vh',
                data: {
                    earIrrigationID: procedureID,
                    patientID: patientID,
                    dialogTitle: 'Ear Irrigation Details'
                }
            });
        }

        dialogRef?.afterClosed().subscribe((result: any) => {
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
    
        const result: any = {
            procedureID: obj.ProcedureID,  // ✅ PRESERVE FROM SP
            procedureNumber: obj.ProcedureNumber,
            procedureDate: obj.ProcedureDate,
            status: obj.Status,
            patientID: obj.PatientID,
            cardNumber: obj.CardNumber,
            fullName: obj.PatientName  // ← PatientName from SP
        };
    
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