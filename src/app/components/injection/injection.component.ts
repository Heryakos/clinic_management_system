import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { InjectionDetailsDialogComponent } from '../injection-details-dialog/injection-details-dialog.component';

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

    constructor(
        private fb: FormBuilder,
        private medicalService: MedicalService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadUserData();
        this.initializeSearchForm();
        this.loadActiveInjectionsQueue();
    }

    loadUserData(): void {
        this.medicalService.getEmployeeById(environment.username).subscribe(
            (response: any) => {
                const employee = response?.c_Employees?.[0];
                this.nurseId = employee?.user_ID || null;
                console.log('nurseIdemployee',this.nurseId)
            },
            error => {
                this.nurseId = null;
                alert(`Error loading user data: ${error.message}`);
            }
        );
    }

    initializeSearchForm(): void {
        this.searchForm = this.fb.group({
            patientID: ['', [Validators.required]]
        });
    }

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
                },
                error => {
                    this.patient = null;
                    this.injections = [];
                    this.isSearching = false;
                    alert(`Error fetching patient: ${error.message}`);
                }
            );
        }
    }

    loadPatientInjections(patientID: number): void {
        this.medicalService.getPatientInjections(patientID).subscribe(
            injections => {
                this.injections = injections;
            },
            error => {
                this.injections = [];
                alert(`Error loading injections: ${error.message}`);
            }
        );
    }

    private loadActiveInjectionsQueue(): void {
        this.medicalService.getActiveInjections().subscribe(
            (rows) => { this.globalActiveInjections = rows || []; },
            () => { this.globalActiveInjections = []; }
        );
    }

    viewInjectionDetails(injectionID: number): void {
        const injection = this.injections.find(inj => inj.injectionID === injectionID);
        if (injection) {
          // Open the dialog with the injection data
          this.dialog.open(InjectionDetailsDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            data: { injection }, // Pass the injection data to the dialog
            panelClass: 'custom-dialog-container' // Optional: for custom styling
          });
        } else {
          // Fetch full details if not found in the injections array
          this.medicalService.getPatientInjections(injectionID).subscribe(
            (details) => {
              this.dialog.open(InjectionDetailsDialogComponent, {
                width: '800px',
                maxHeight: '90vh',
                data: { injection: details },
                panelClass: 'custom-dialog-container'
              });
            },
            (error) => {
              alert(`Error fetching details: ${error.message}`);
            }
          );
        }
      }
    //   closeDialog(): void {
    //     this.selectedInjection = null;
    // }

    administerInjection(injectionID: number): void {
        if (this.nurseId) {
            this.medicalService.administerInjection(injectionID, this.nurseId).subscribe(
                () => {
                    if (this.patient?.patientID) {
                        this.loadPatientInjections(this.patient.patientID);
                    }
                    this.loadActiveInjectionsQueue();
                    alert('Injection administered successfully!');
                },
                error => {
                    alert(`Error administering injection: ${error.message}`);
                }
            );
        } else {
            alert('Nurse ID not found.');
        }
    }
}