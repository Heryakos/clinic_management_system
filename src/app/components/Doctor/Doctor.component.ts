import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { PatientDoctorCard, PatientMedicalHistory, PatientSummary } from 'src/app/models/medical.model';
import { testCategories } from 'src/app/models/laboratory-test-categories';
import { Medication, DosageForm, MedicationCategory, MedicationSelection } from '../medication-tree-dropdown/medication-tree-dropdown.component'; // Adjust the import path as needed
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { PrescriptionPaperComponent } from '../prescription-paper/prescription-paper.component';

@Component({
    selector: 'app-doctor',
    templateUrl: './doctor.component.html',
    styleUrls: ['./doctor.component.css']
})
export class DoctorComponent implements OnInit {
    selectedCardNumber: string = '';
    activePatients: PatientSummary[] = []
    isSearchMode = false; // New property to track search mode
    searched = false;
    cardNumber: string = '';
    selectedPrescription: any = null;
    medicalHistories: PatientMedicalHistory[] = [];
    searchForm!: FormGroup;
    editForm!: FormGroup;
    labRequestForm!: FormGroup;
    prescriptionForm!: FormGroup;
    injectionForm!: FormGroup;
    assignmentForm!: FormGroup;
    patient: any | null = null;
    laboratoryTests: any[] = [];
    prescriptions: any[] = [];
    injections: any[] = [];
    medications: any[] = [];
    injectableMedications: any[] = [];
    rooms: any[] = [];
    patientAssignments: any[] = [];
    isSearching = false;
    isEditing = false;
    isRequestingLab = false;
    isRequestingPrescription = false;
    isRequestingInjection = false;
    isAssigning = false;
    showHistoryIndex: number | null = null; // Track which history item is expanded
    createdBy: string | null = null;
    availableTests: { name: string; normalRange: string; unit: string }[] = [];
    selectedTestNames: Set<string> = new Set();
    customTestMode: boolean = false;
    filteredTests: any[] = [];
    selectedTab: string = 'patient-info'; // Default tab
    // selectedTab: 'patient-info' | 'referrals' = 'patient-info'; // or your default value
    showTestDetailsDialog: boolean = false;
    selectedTestDetails: any[] = [];
    selectedTestNumber: string = '';
    showPrescriptionDetailsDialog: boolean = false;
    selectedPrescriptionDetails: any[] = [];
    selectedPrescriptionNumber: string = '';
    prescriptionDetailsMap: { [prescriptionID: number]: any } = {};
    categorizedMedications: MedicationCategory[] = []; // New property for categorized medications
    categorizedInjectableMedications: MedicationCategory[] = [];
    employeeID: string | null = null;
    selectedDoctorUserName: string | null = null;
    selectedTestData: any = null; // Add this property

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private medicalService: MedicalService,
        private dialog: MatDialog,
        private cdr: ChangeDetectorRef

    ) { }

    ngOnInit(): void {
        this.initializeSearchForm();
        this.initializeEditForm();
        this.initializeLabRequestForm();
        this.initializePrescriptionForm();
        this.initializeInjectionForm();
        this.initializeAssignmentForm();
        this.loadMedications();
        this.loadInjectableMedications();
        this.loadRooms();
        this.loadUserData();
        this.loadActivePatients();
        this.loadPrescriptions();
    }
    // Helper method to show snackbar messages
    private showSnackBar(message: string, action: string = 'Close', duration: number = 3000, panelClass: string = 'info-snackbar'): void {
        this.snackBar.open(message, action, {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: [panelClass],
        });
    }
    // // Toggle medical history panel
    toggleHistory(index: number): void {
        this.showHistoryIndex = this.showHistoryIndex === index ? null : index;
    }

    // Switch between tabs
    selectTab(tab: string): void {
        console.log('Selected tab:', tab, 'patientID:', this.patient?.cardNumber, 'createdBy:', this.createdBy);
        this.selectedTab = tab;
    }

    loadUserData(): void {
        this.medicalService.getEmployeeById(environment.username).subscribe(
            (response: any) => {
                const employee = response?.c_Employees?.[0];
                this.createdBy = employee?.user_ID ?? null;
                this.employeeID = employee?.employee_Id ?? null;
                console.log('doctorid', this.employeeID);
            },

            error => {
                this.createdBy = null;
            }
        );
    }

    // Modified loadMedications to categorize medications
    loadMedications(): void {
        this.medicalService.getMedications().subscribe(
            (medications: MedicationCategory[]) => {
                console.log('Loading hierarchical medications', medications);
                this.categorizedMedications = medications;
                this.medications = medications.flatMap((category: MedicationCategory) =>
                    category.dosageForms.flatMap((form: DosageForm) => form.medications)
                );
                // Filter for injectable medications (Injection or Vial)
                this.categorizedInjectableMedications = medications
                    .map((category: MedicationCategory) => ({
                        category: category.category,
                        dosageForms: category.dosageForms.filter((form: DosageForm) =>
                            form.form === 'Injection' || form.form === 'Vial'
                        )
                    }))
                    .filter((category: MedicationCategory) => category.dosageForms.length > 0);
                this.injectableMedications = this.medications.filter((med: Medication) =>
                    med.dosageForm === 'Injection' || med.dosageForm === 'Vial'
                );
            },
            error => {
                this.categorizedMedications = [];
                this.categorizedInjectableMedications = [];
                this.medications = [];
                this.injectableMedications = [];
                console.error('Error loading medications:', error);
            }
        );
    }
    loadPrescriptions(): void {
        this.medicalService.getPrescriptions().subscribe(
            (prescriptions: any[]) => {
                this.prescriptions = prescriptions.map(p => ({
                    ...p,
                    CardNumber: p.CardNumber || p.cardNumber || 'N/A',
                    FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
                    PrescriptionDate: p.prescriptionDate || p.PrescriptionDate,
                    Status: p.status || p.Status || 'Unknown',
                    PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
                    PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
                    prescriptionID: p.prescriptionID || p.PrescriptionID || `temp-${Date.now()}`
                }));
                this.prescriptions.sort((a, b) =>
                    new Date(b.PrescriptionDate || 0).getTime() - new Date(a.PrescriptionDate || 0).getTime()
                );
                this.cdr.detectChanges();
            },
            error => {
                console.error('Error loading prescriptions:', error);
                this.prescriptions = [];
                this.showSnackBar('Error loading prescriptions.', 'Close', 5000, 'error-snackbar');
            }
        );
    }
    // New method to categorize medications
    private categorizeMedications(medications: any[]): MedicationCategory[] {
        const categoryMap = new Map<string, DosageForm[]>();

        medications.forEach(med => {
            const category = med.therapeuticClass || 'Uncategorized';
            const dosageForm = med.dosageForm || 'Unknown';
            const medication: Medication = {
                medicationID: med.medicationID,
                medicationName: med.medicationName,
                strength: med.strength
            };

            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }

            const dosageForms = categoryMap.get(category)!;
            let form = dosageForms.find(df => df.form === dosageForm);
            if (!form) {
                form = { form: dosageForm, medications: [] };
                dosageForms.push(form);
            }
            form.medications.push(medication);
        });

        return Array.from(categoryMap.entries()).map(([category, dosageForms]) => ({
            category,
            dosageForms
        }));
    }

    // New method to handle medication selection
    onMedicationSelection(selection: MedicationSelection, index: number): void {
        const medicationForm = this.medicationsFormArray.at(index) as FormGroup;
        medicationForm.patchValue({
            medicationID: selection.medicationId
        });
    }

    loadInjectableMedications(): void {
        this.medicalService.getMedications().subscribe(
            medications => {
                // this.injectableMedications = medications.filter((med: { dosageForm: string; }) => med.dosageForm === 'Injection' || med.dosageForm === 'Vial');
                this.injectableMedications = this.medications.filter((med: { dosageForm: string }) =>
                    med.dosageForm === 'Injection' || med.dosageForm === 'Vial'
                );
            },
            error => {
                this.injectableMedications = [];
                this.showSnackBar(`Error loading injectable medications: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }
    onInjectionMedicationSelection(selection: MedicationSelection): void {
        this.injectionForm.patchValue({
            medicationID: selection.medicationId
        });
    }
    loadRooms(): void {
        this.medicalService.getRooms().subscribe(
            (rooms: any[]) => {
                this.rooms = rooms;
            },
            error => {
                console.error('Error loading rooms:', error);
            }
        );
    }
    loadActivePatients(): void {
        this.isSearching = true;
        this.medicalService.getAllActivePatients().subscribe(
            (patients: any[]) => {
                const all = patients.map(patient => ({
                    PatientID: patient.PatientID,
                    CardNumber: patient.CardNumber,
                    FullName: patient.FullName,
                    FatherName: patient.FatherName,
                    DateOfBirth: new Date(patient.DateOfBirth),
                    Age: patient.Age,
                    gender: patient.gender,
                    phone: patient.Phone,
                    Address: patient.Address,
                    BloodType: patient.BloodType,
                    TotalVisits: patient.TotalVisits,
                    LastVisitDate: patient.LastVisitDate ? new Date(patient.LastVisitDate) : undefined,
                    LastDiagnosis: patient.LastDiagnosis,
                    RegistrationDate: patient.RegistrationDate,
                    SupervisorApproval: patient.SupervisorApproval,
                    EmployeeID: patient.EmployeeID,
                    Photo: patient.Photo,
                    RequestType: patient.RequestType,
                    RequestNumber: patient.RequestNumber,
                    RoomType: patient.RoomType,
                    RoomNumber: patient.RoomNumber,
                    StaffUserID: patient.StaffUserID,
                    IsActive: patient.IS_Active
                }));
                const examOnly = all.filter(p => {
                    const room = (p as any).RoomType || (p as any).RoomName;
                    return room === 'Examination(OPD-1)' || room === 'Examination(OPD-2)' || room === 'Examination(OPD-3)';
                });
                this.activePatients = examOnly.length > 0 ? examOnly : all;
                this.isSearching = false;
            },
            error => {
                console.error('Error loading active patients:', error);
                this.activePatients = [];
                this.isSearching = false;
                this.showSnackBar('Error loading active patients.', 'Close', 5000, 'error-snackbar');
            }
        );
    }
    // loadPatientAssignments(): void {
    //     if (this.patient) {
    //         this.medicalService.getPatientAssignments().subscribe(
    //             (assignments: any[]) => {
    //                 this.patientAssignments = assignments.filter(a => a.patientID === this.patient.patientID);
    //             },
    //             error => {
    //                 console.error('Error loading patient assignments:', error);
    //                 this.patientAssignments = [];
    //             }
    //         );
    //     }
    // }
    onPatientRowClick(patient: PatientSummary): void {
        this.isSearchMode = false;
        this.searched = true;
        this.cardNumber = patient.CardNumber;

        // Instead of using the limited data from the active patients list,
        // let's fetch the complete patient data using the card number
        this.isSearching = true;
        this.medicalService.getPatient(patient.CardNumber).subscribe(
            (response: any) => {
                const fullPatientData = Array.isArray(response) ? response[0] : response;
                if (fullPatientData && fullPatientData.PatientID) {
                    this.patient = fullPatientData;
                    const formattedPatient = {
                        ...fullPatientData,
                        RegistrationDate: this.formatDate(fullPatientData.RegistrationDate)
                    };
                    this.editForm.patchValue(formattedPatient);

                    // Fetch medical history
                    this.medicalService.getPatientByCardNumberHistory(patient.CardNumber).subscribe(
                        (historyResponse: PatientMedicalHistory[]) => {
                            this.medicalHistories = Array.isArray(historyResponse) ? historyResponse : [];
                            this.loadPatientLaboratory(Number(fullPatientData.PatientID));
                            this.loadPatientPrescriptions(fullPatientData.CardNumber);
                            this.loadPatientInjections(fullPatientData.PatientID);
                        },
                        error => {
                            this.medicalHistories = [];
                            // this.showSnackBar(`Error fetching medical history: ${error.message}`, 'Close', 5000, 'error-snackbar');
                        }
                    );
                } else {
                    this.resetPatientData();
                    // this.showSnackBar('No patient found with this card number.', 'Close', 5000, 'error-snackbar');
                }
                this.isSearching = false;
            },
            error => {
                this.resetPatientData();
                this.isSearching = false;
                // this.showSnackBar(`No record found or error occurred: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }

    // onPatientRowClick(patient: PatientSummary): void {
    //     this.isSearchMode = false;
    //     this.searched = true;
    //     this.patient = patient;
    //     this.cardNumber = patient.CardNumber;
    //     this.editForm.patchValue({
    //       ...patient,
    //     //   RegistrationDate: this.formatDate(patient.RegistrationDate)
    //     RegistrationDate: patient.RegistrationDate ? this.formatDate(patient.RegistrationDate.toISOString()) : ''

    //     });
    //     this.loadPatientLaboratory(Number(patient.PatientID));
    //     this.loadPatientPrescriptions(patient.CardNumber);
    //     this.loadPatientInjections(patient.PatientID);
    //     this.medicalService.getPatientByCardNumberHistory(patient.CardNumber).subscribe(
    //       (historyResponse: PatientMedicalHistory[]) => {
    //         this.medicalHistories = Array.isArray(historyResponse) ? historyResponse : [];
    //       },
    //       error => {
    //         this.medicalHistories = [];
    //         this.showSnackBar(`Error fetching medical наверhistory: ${error.message}`, 'Close', 5000, 'error-snackbar');
    //       }
    //     );
    //   }
    initializeSearchForm(): void {
        this.searchForm = this.fb.group({
            // patientID: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
            patientID: ['', Validators.required]
        });
    }

    initializeEditForm(): void {
        this.editForm = this.fb.group({
            patientID: [{ value: '', disabled: true }],
            cardNumber: [{ value: '', disabled: true }],
            firstName: [{ value: '', disabled: true }, Validators.required],
            lastName: [{ value: '', disabled: true }, Validators.required],
            fatherName: [{ value: '', disabled: true }],
            grandFatherName: [{ value: '', disabled: true }],
            dateOfBirth: [{ value: '', disabled: true }],
            age: [{ value: '', disabled: true }, [Validators.required, Validators.min(0), Validators.max(150)]],
            gender: [{ value: '', disabled: true }],
            phone: [{ value: '', disabled: true }],
            address: [{ value: '', disabled: true }],
            region: [{ value: '', disabled: true }],
            subCity: [{ value: '', disabled: true }],
            woreda: [{ value: '', disabled: true }],
            houseNumber: [{ value: '', disabled: true }],
            emergencyContact: [{ value: '', disabled: true }],
            emergencyPhone: [{ value: '', disabled: true }],
            //   bloodType: ['', this.patient?.bloodType ? [Validators.disabled] : []],
            bloodType: [{ value: '', disabled: true }],
            allergies: [''],
            medicalHistory: [''],
            isActive: [{ value: true, disabled: true }],
            RegistrationDate: [{ value: '', disabled: true }],
            createdBy: [{ value: '', disabled: true }],
            lastDiagnosis: [''],
            clinicalFindings: [{ value: '', disabled: true }],
            weight: ['', [Validators.min(0)]],
            height: ['', [Validators.min(0)]],
            bloodPressure: ['', [Validators.pattern(/^\d{1,3}\/\d{1,3}$/)]], // e.g., 120/80
            pulseRate: ['', [Validators.pattern(/^\d{1,3}$/)]], // e.g., 80
            temperature: ['', [Validators.min(30), Validators.max(45)]],
            chiefComplaint: [''],
            bmi: [{ value: '', disabled: true }],
            nextAppointment: [''],
            treatmentPlan: ['']
        });

        // Subscribe to weight and height changes to calculate BMI
        this.editForm.get('weight')?.valueChanges.subscribe(() => this.calculateBMI());
        this.editForm.get('height')?.valueChanges.subscribe(() => this.calculateBMI());
    }
    calculateBMI(): void {
        const weight = this.editForm.get('weight')?.value;
        const height = this.editForm.get('height')?.value;
        if (weight && height) {
            const heightInMeters = height / 100; // Convert cm to meters
            const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
            this.editForm.get('bmi')?.setValue(bmi);
        } else {
            this.editForm.get('bmi')?.setValue('');
        }
    }

    initializeLabRequestForm(): void {
        const generatedTestNumber = 'LAB' + Date.now().toString();
        this.labRequestForm = this.fb.group({
            testNumber: [{ value: generatedTestNumber, disabled: true }, Validators.required],
            testCategory: ['Chemistry', Validators.required],
            priority: ['Normal', Validators.required],
            clinicalNotes: [''],
            tests: this.fb.array([])
        });
        this.onTestCategoryChange();
        this.labRequestForm.get('testCategory')?.valueChanges.subscribe(() => {
            this.onTestCategoryChange();
        });
    }

    initializePrescriptionForm(): void {
        const generatedPrescriptionNumber = 'PR' + Date.now().toString();
        this.prescriptionForm = this.fb.group({
            prescriptionNumber: [{ value: generatedPrescriptionNumber, disabled: true }, Validators.required],
            notes: [''],
            medications: this.fb.array([this.createMedication()])
        });
    }

    initializeInjectionForm(): void {
        const generatedInjectionNumber = 'INJ' + Date.now().toString();
        this.injectionForm = this.fb.group({
            injectionNumber: [generatedInjectionNumber, Validators.required],
            medicationID: ['', Validators.required],
            dose: ['', Validators.required],
            route: ['', Validators.required],
            site: ['', Validators.required],
            frequency: ['', Validators.required],
            duration: ['', Validators.required],
            instructions: [''],
            notes: ['']
        });
    }

    initializeAssignmentForm(): void {
        this.assignmentForm = this.fb.group({
            assignedRoom: ['', Validators.required],
            doctorID: ['', Validators.required]
        });
    }

    // onAssignmentSubmit(): void {
    //     if (this.assignmentForm.valid && this.patient) {
    //         this.isAssigning = true;

    //         const assignment = {
    //             cardID: this.patient.patientID,
    //             assignedRoom: this.assignmentForm.value.assignedRoom,
    //             doctorID: this.assignmentForm.value.doctorID,
    //             assignedBy: this.createdBy
    //         };

    //         this.medicalService.assignPatient(assignment).subscribe(
    //             () => {
    //                 this.isAssigning = false;
    //                 this.assignmentForm.reset();
    //                 this.loadPatientAssignments();
    //                 alert('Patient assigned to room successfully!');
    //             },
    //             error => {
    //                 this.isAssigning = false;
    //                 alert('Error assigning patient to room. Please try again.');
    //             }
    //         );
    //     }
    // }

    // updateAssignmentStatus(assignmentId: number, status: string): void {
    //     this.medicalService.updateAssignmentStatus(assignmentId, status).subscribe(
    //         () => {
    //             this.loadPatientAssignments();
    //             alert('Assignment status updated successfully!');
    //         },
    //         error => {
    //             alert('Error updating assignment status. Please try again.');
    //         }
    //     );
    // }

    getRoomName(roomId: number): string {
        const room = this.rooms.find(r => r.roomID === roomId);
        return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
    }

    onTestCategoryChange(): void {
        const category = this.labRequestForm.get('testCategory')?.value as keyof typeof testCategories;
        this.availableTests = testCategories[category] || [];
        this.filteredTests = testCategories[category] || [];
        this.selectedTestNames.clear();
        const testsArray = this.testsFormArray;
        while (testsArray.length !== 0) {
            testsArray.removeAt(0);
        }
        this.customTestMode = false;
    }

    onTestCheckboxChange(event: any, test: any): void {
        const checked = event.target.checked;
        const testsArray = this.testsFormArray;
        if (checked) {
            if (!this.selectedTestNames.has(test.name)) {
                testsArray.push(this.fb.group({
                    testName: [test.name, Validators.required],
                    normalRange: [test.normalRange],
                    result: [''],
                    unit: [test.unit],
                    isAbnormal: [false],
                    comments: ['']
                }));
                this.selectedTestNames.add(test.name);
            }
        } else {
            for (let i = 0; i < testsArray.length; i++) {
                if (testsArray.at(i).get('testName')?.value === test.name) {
                    testsArray.removeAt(i);
                    this.selectedTestNames.delete(test.name);
                    break;
                }
            }
        }
    }

    isTestSelected(testName: string): boolean {
        return this.testsFormArray.controls.some(ctrl => ctrl.get('testName')?.value === testName);
    }

    enableCustomTestMode(): void {
        this.customTestMode = true;
        this.testsFormArray.push(this.createTest());
    }

    removeCustomTest(index: number): void {
        this.testsFormArray.removeAt(index);
        if (this.testsFormArray.length === 0) {
            this.customTestMode = false;
        }
    }

    createTest(): FormGroup {
        return this.fb.group({
            testName: ['', Validators.required],
            normalRange: [''],
            result: [''],
            unit: [''],
            isAbnormal: [false],
            comments: ['']
        });
    }

    createMedication(): FormGroup {
        return this.fb.group({
            medicationID: ['', Validators.required],
            dose: ['', Validators.required],
            frequency: ['', Validators.required],
            duration: ['', Validators.required],
            quantity: ['', [Validators.required, Validators.min(1)]],
            // unitPrice: ['', [Validators.required, Validators.min(0)]],
            instructions: ['']
        });
    }

    get testsFormArray(): FormArray {
        return this.labRequestForm.get('tests') as FormArray;
    }

    get medicationsFormArray(): FormArray {
        return this.prescriptionForm.get('medications') as FormArray;
    }

    addTest(): void {
        this.enableCustomTestMode();
    }

    removeTest(index: number): void {
        const testName = this.testsFormArray.at(index).get('testName')?.value;
        if (this.selectedTestNames.has(testName)) {
            this.selectedTestNames.delete(testName);
        }
        this.testsFormArray.removeAt(index);
        if (this.testsFormArray.length === 0) {
            this.customTestMode = false;
        }
    }

    addMedication(): void {
        this.medicationsFormArray.push(this.createMedication());
    }

    removeMedication(index: number): void {
        if (this.medicationsFormArray.length > 1) {
            this.medicationsFormArray.removeAt(index);
        }
    }

    // onSearch(): void {
    //     if (this.searchForm.valid) {
    //         const cardNumber = this.searchForm.value.patientID;
    //         this.isSearching = true;
    //         this.medicalService.getPatient(cardNumber).subscribe(
    //             (response: any) => {
    //                 const patient = Array.isArray(response) ? response[0] : response;
    //                 if (patient && patient.patientID) {
    //                     this.patient = patient;
    //                     this.editForm.patchValue(patient);
    //                     this.loadPatientLaboratory();
    //                     this.loadPatientPrescriptions(patient.cardNumber);
    //                     this.loadPatientInjections(patient.patientID);
    //                     this.loadPatientAssignments(); // Load patient assignments after patient is found
    //                 } else {
    //                     this.resetPatientData();
    //                     // alert('No patient found with this card number.');
    //                 }
    //                 this.isSearching = false;
    //             },
    //             error => {
    //                 this.resetPatientData();
    //                 this.isSearching = false;
    //                 // alert(`No record found or error occurred: ${error.error?.message || error.message}`);
    //             }
    //         );
    //     }
    // }
    onSearch(): void {
        if (this.searchForm.valid) {
            this.isSearching = true;

            // Fetch patient data
            const cardNumber = this.searchForm.value.patientID;
            this.medicalService.getPatient(cardNumber).subscribe(
                (response: any) => {
                    const patient = Array.isArray(response) ? response[0] : response;
                    console.log('Patient data:', patient);
                    if (
                        patient &&
                        patient.PatientID &&
                        (patient.RoomName === 'Examination(OPD-1)' || patient.RoomName === 'Examination(OPD-2)' || patient.RoomName === 'Examination(OPD-3)')
                        // patient.RoomName === 'doctor'

                    ) {
                        this.patient = patient;
                        const formattedPatient = {
                            ...patient,
                            RegistrationDate: this.formatDate(patient.RegistrationDate)
                        };
                        // this.editForm.patchValue(patient);
                        this.editForm.patchValue(formattedPatient);
                        console.log('Form Value After Patch:', this.editForm.value);

                        // Fetch medical history
                        this.cardNumber = patient.CardNumber;
                        this.medicalService.getPatientByCardNumberHistory(cardNumber).subscribe(
                            (historyResponse: PatientMedicalHistory[]) => {
                                this.medicalHistories = Array.isArray(historyResponse) ? historyResponse : [];
                                this.loadPatientLaboratory(Number(patient.PatientID));
                                this.loadPatientPrescriptions(patient.CardNumber);
                                this.loadPatientInjections(patient.PatientID);
                            },
                            error => {
                                this.medicalHistories = [];
                                // this.showSnackBar(`Error fetching medical history: ${error.message}`, 'Close', 5000, 'error-snackbar');
                            }
                        );
                    } else {
                        this.resetPatientData();
                        this.showSnackBar('No patient found with this card number.', 'Close', 5000, 'error-snackbar');
                    }
                    this.isSearching = false;
                },
                error => {
                    this.resetPatientData();
                    this.isSearching = false;
                    this.showSnackBar(`No record found or error occurred: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        }
    }

    private resetPatientData(): void {
        this.patient = null;
        this.editForm.reset();
        this.laboratoryTests = [];
        this.prescriptions = [];
        this.injections = [];
        this.patientAssignments = []; // Reset patient assignments
    }

    loadPatientLaboratory(patientId: number): void {
        this.medicalService.getPatientLaboratoryTests(patientId).subscribe(
            tests => {
                this.laboratoryTests = tests;
            },
            error => {
                this.laboratoryTests = [];
                this.showSnackBar(`Error loading laboratory tests: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }

    loadPatientPrescriptions(cardNumber: string): void {
        console.log('cardNumber:', cardNumber);
        this.medicalService.getPrescriptionspayrollID(cardNumber).subscribe(
            prescriptions => {
                this.prescriptions = prescriptions;
            },
            error => {
                this.prescriptions = [];
                this.showSnackBar(`Error loading prescriptions: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }

    loadPatientInjections(patientID: number): void {
        this.medicalService.getPatientInjections(patientID).subscribe(
            injections => {
                this.injections = injections;
            },
            error => {
                this.injections = [];
                // this.showSnackBar(`Error loading injections: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }

    viewTestDetails(testID: string | number): void {
        if (!testID) {
            this.showSnackBar('Invalid test ID.', 'Close', 5000, 'error-snackbar');
            return;
        }

        this.medicalService.getLaboratoryTestDetails(Number(testID)).subscribe(
            (details: any[]) => {
                this.selectedTestDetails = details || [];
                this.selectedTestNumber = testID.toString();

                // Get the test data from the laboratoryTests array
                const testData = this.laboratoryTests.find(test => test.testID === testID);
                this.selectedTestData = testData || null;

                this.showTestDetailsDialog = true;
            },
            error => {
                this.selectedTestDetails = [];
                this.selectedTestNumber = '';
                this.selectedTestData = null;
                this.showTestDetailsDialog = false;
                this.showSnackBar('Could not load test details.', 'Close', 5000, 'error-snackbar');
            }
        );
    }

    closeTestDetailsDialog(): void {
        this.showTestDetailsDialog = false;
        this.selectedTestDetails = [];
        this.selectedTestNumber = '';
        this.selectedTestData = null;
    }

    // viewPrescriptionDetails(prescriptionID: number): void {
    //     if (!prescriptionID) {
    //         alert('Invalid prescription ID.');
    //         return;
    //     }
    //     this.selectedPrescriptionNumber = '';
    //     this.selectedPrescriptionDetails = [];
    //     const prescription = this.prescriptions.find(p => p.prescriptionID === prescriptionID);
    //     if (prescription) {
    //         this.selectedPrescriptionNumber = prescription.prescriptionNumber;
    //     }
    //     // Try to get details from map, otherwise fetch
    //     const cached = this.prescriptionDetailsMap[prescriptionID];
    //     if (cached && Array.isArray(cached)) {
    //         this.selectedPrescriptionDetails = cached;
    //         this.showPrescriptionDetailsDialog = true;
    //     } else {
    //         this.medicalService.getPrescriptionIDDetails(Number(prescriptionID)).subscribe(
    //             (details: any[]) => {
    //                 this.selectedPrescriptionDetails = details || [];
    //                 this.prescriptionDetailsMap[prescriptionID] = details;
    //                 this.showPrescriptionDetailsDialog = true;
    //             },
    //             error => {
    //                 this.selectedPrescriptionDetails = [];
    //                 this.showPrescriptionDetailsDialog = true;
    //             }
    //         );
    //     }
    // }

    // closePrescriptionDetailsDialog(): void {
    //     this.showPrescriptionDetailsDialog = false;
    //     this.selectedPrescriptionDetails = [];
    //     this.selectedPrescriptionNumber = '';
    // }
    viewPrescriptionDetails(prescriptionID: number | string): void {
        console.log('viewPrescriptionDetails called for prescriptionID:', prescriptionID);
        if (!prescriptionID) {
          this.showSnackBar('Invalid prescription ID.', 'Close', 5000, 'error-snackbar');
          return;
        }
    
        const prescription = this.prescriptions.find(p => p.prescriptionID === prescriptionID);
        if (!prescription) {
          this.showSnackBar('Prescription not found.', 'Close', 5000, 'error-snackbar');
          return;
        }
    
        // Open as a dialog, passing cardNumber as data
        const dialogRef = this.dialog.open(PrescriptionPaperComponent, {
          width: '800px',  // Adjust as needed
          height: 'auto',
          maxHeight: '90vh',
          data: { cardNumber: prescription.CardNumber || this.cardNumber }  // Pass cardNumber via data
        });
    
        // Optional: Handle dialog close
        dialogRef.afterClosed().subscribe(result => {
          console.log('Prescription dialog closed', result);
          // Handle any result if needed (e.g., refresh data)
        });
      }

    closePrescriptionDetailsDialog(): void {
        this.showPrescriptionDetailsDialog = false;
        this.selectedCardNumber = '';
        this.cdr.detectChanges();
    }
    viewInjectionDetails(injectionID: number): void {
        this.showSnackBar(`Viewing details for Injection ID: ${injectionID}`, 'Close', 3000, 'info-snackbar');
    }

    onEditSubmit(): void {
        console.log('isEditing before:', this.isEditing);
        if (this.editForm.valid && this.patient && this.createdBy) {
            this.isEditing = true;
            console.log('isEditing set to true:', this.isEditing);
            console.log('Form Valid:', this.editForm.valid, 'Form Value:', this.editForm.getRawValue());

            const updatedPatient: PatientDoctorCard = {
                patientID: this.patient.PatientID,
                cardNumber: this.patient.CardNumber || '',
                firstName: this.patient.FirstName || '',
                lastName: this.patient.LastName || '',
                fatherName: this.patient.FatherName ?? '',
                grandFatherName: this.patient.GrandFatherName ?? '',
                dateOfBirth: this.patient.DateOfBirth || '1900-01-01',
                age: this.patient.Age || 0,
                gender: this.patient.Gender || 'U',
                phone: this.patient.Phone ?? '',
                address: this.patient.Address ?? '',
                region: this.patient.Region ?? '',
                subCity: this.patient.SubCity ?? '',
                woreda: this.patient.Woreda ?? '',
                houseNumber: this.patient.HouseNumber ?? '',
                emergencyContact: this.patient.EmergencyContact ?? '',
                emergencyPhone: this.patient.EmergencyPhone ?? '',
                bloodType: this.editForm.get('bloodType')?.value ?? this.patient.BloodType ?? '',
                allergies: this.editForm.get('allergies')?.value ?? this.patient.Allergies ?? '',
                medicalHistory: this.editForm.get('medicalHistory')?.value ?? this.patient.MedicalHistory ?? '',
                isActive: this.patient.IsActive ?? true,
                RegistrationDate: this.editForm.get('RegistrationDate')?.value || this.formatDate(this.patient.RegistrationDate) || '',
                createdBy: this.createdBy,
                lastDiagnosis: this.patient.LastDiagnosis ?? '',
                clinicalFindings: this.patient.ClinicalFindings ?? '',
                weight: this.editForm.get('weight')?.value ?? this.patient.weight ?? null,
                height: this.editForm.get('height')?.value ?? this.patient.height ?? null,
                bloodPressure: this.editForm.get('bloodPressure')?.value ?? this.patient.bloodPressure ?? null,
                pulseRate: this.editForm.get('pulseRate')?.value ?? this.patient.pulseRate ?? null,
                temperature: this.editForm.get('temperature')?.value ?? this.patient.temperature ?? null,
                chiefComplaint: this.editForm.get('chiefComplaint')?.value ?? this.patient.chiefComplaint ?? null,
                bmi: this.editForm.get('bmi')?.value ?? this.patient.bmi ?? null,
                nextAppointment: this.editForm.get('nextAppointment')?.value ?? this.patient.nextAppointment ?? null,
                treatmentPlan: this.editForm.get('treatmentPlan')?.value ?? this.patient.treatmentPlan ?? null
            };

            const patientID = parseInt(this.patient.PatientID, 10);
            if (isNaN(patientID)) {
                this.isEditing = false;
                this.showSnackBar('Invalid Patient ID.', 'Close', 5000, 'error-snackbar');
                return;
            }

            console.log('Updated Patient Data:', updatedPatient);

            this.medicalService.updatePatient(patientID, updatedPatient).subscribe(
                () => {
                    this.isEditing = false;
                    this.onSearch();
                    this.showSnackBar('Patient updated successfully!', 'Close', 3000, 'success-snackbar');
                },
                error => {
                    this.isEditing = false;
                    this.showSnackBar(`Error updating patient: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isEditing = false;
            this.showSnackBar('Cannot update patient: Missing user ID or invalid form data.', 'Close', 5000, 'error-snackbar');
        }
    }

    onLabRequestSubmit(): void {
        if (this.labRequestForm.valid && this.patient && this.patient.PatientID && this.patient.CardNumber) {
            this.isRequestingLab = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;

            if (isNaN(patientID) || !cardNumber) {
                this.isRequestingLab = false;
                this.showSnackBar('Invalid patient data: Patient ID or Card Number is missing.', 'Close', 5000, 'error-snackbar');
                return;
            }

            console.log('Submitting lab request with patientID:', patientID, 'cardNumber:', cardNumber);

            const labTest = {
                testNumber: this.labRequestForm.getRawValue().testNumber,
                patientID: patientID,
                cardNumber: cardNumber,
                cardID: null,
                orderingPhysician: this.createdBy,
                testCategory: this.labRequestForm.value.testCategory,
                priority: this.labRequestForm.value.priority,
                clinicalNotes: this.labRequestForm.value.clinicalNotes || null,
                createdBy: this.createdBy,
                tests: this.labRequestForm.value.tests
            };

            this.medicalService.createLaboratoryTest(labTest).subscribe(
                (response: any) => {
                    const testID = response.testID;
                    const testDetailsPromises = labTest.tests.map((test: any) =>
                        this.medicalService.addLaboratoryTestDetail(testID, {
                            testName: test.testName,
                            normalRange: test.normalRange || null,
                            unit: test.unit || '',
                            isAbnormal: test.isAbnormal,
                            comments: test.comments || '',
                            result: null
                        }).toPromise()
                    );

                    Promise.all(testDetailsPromises).then(() => {
                        this.isRequestingLab = false;
                        this.labRequestForm.reset();
                        this.initializeLabRequestForm();
                        this.loadPatientLaboratory(patientID);
                        this.showSnackBar('Lab test requested successfully!', 'Close', 3000, 'success-snackbar');
                    }).catch(error => {
                        this.isRequestingLab = false;
                        this.showSnackBar(`Error adding test details: ${error.message}`, 'Close', 5000, 'error-snackbar');
                    });
                },
                error => {
                    this.isRequestingLab = false;
                    this.showSnackBar(`Error requesting lab test: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingLab = false;
            this.showSnackBar('Cannot request lab test: Invalid form or missing patient data.', 'Close', 5000, 'error-snackbar');
        }
    }

    onPrescriptionSubmit(): void {
        if (this.prescriptionForm.valid && this.patient && this.patient.PatientID && this.patient.CardNumber) {
            this.isRequestingPrescription = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;

            if (isNaN(patientID) || !cardNumber) {
                this.isRequestingPrescription = false;
                this.showSnackBar('Invalid patient data: Patient ID or Card Number is missing.', 'Close', 5000, 'error-snackbar');
                return;
            }

            console.log('Submitting prescription with patientID:', patientID, 'cardNumber:', cardNumber);

            const prescription = {
                prescriptionNumber: 'PR' + Date.now().toString(),
                patientID: patientID,
                cardID: null,
                prescriberID: this.createdBy,
                notes: this.prescriptionForm.value.notes || null,
                createdBy: this.createdBy,
                medications: this.prescriptionForm.value.medications
            };

            this.medicalService.createPrescription(prescription).subscribe(
                (response: any) => {
                    const prescriptionID = response.prescriptionID;
                    const prescriptionDetailsPromises = prescription.medications.map((med: any) =>
                        this.medicalService.addPrescriptionDetail(prescriptionID, {
                            medicationID: med.medicationID,
                            dose: med.dose,
                            frequency: med.frequency,
                            duration: med.duration,
                            quantity: med.quantity,
                            unitPrice: med.unitPrice,
                            instructions: med.instructions || null
                        }).toPromise()
                    );

                    Promise.all(prescriptionDetailsPromises).then(() => {
                        this.isRequestingPrescription = false;
                        this.prescriptionForm.reset();
                        this.initializePrescriptionForm();
                        this.loadPatientPrescriptions(cardNumber);
                        this.showSnackBar('Prescription requested successfully!', 'Close', 3000, 'success-snackbar');
                    }).catch(error => {
                        this.isRequestingPrescription = false;
                        this.showSnackBar(`Error adding prescription details: ${error.message}`, 'Close', 5000, 'error-snackbar');
                    });
                },
                error => {
                    this.isRequestingPrescription = false;
                    this.showSnackBar(`Error requesting prescription: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingPrescription = false;
            this.showSnackBar('Cannot request prescription: Invalid form or missing patient data.', 'Close', 5000, 'error-snackbar');
        }
    }


    onInjectionSubmit(): void {
        if (this.injectionForm.valid && this.patient) {
            this.isRequestingInjection = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const form = this.injectionForm.getRawValue();
            const injection = {
                injectionNumber: form.injectionNumber,
                patientID: patientID,
                cardID: null,
                orderingPhysicianID: this.createdBy,
                medicationID: form.medicationID,
                dose: form.dose,
                route: form.route,
                site: form.site,
                frequency: form.frequency,
                duration: form.duration,
                instructions: form.instructions || null,
                notes: form.notes || null,
                createdBy: this.createdBy
            };

            this.medicalService.createInjection(injection).subscribe(
                () => {
                    this.isRequestingInjection = false;
                    this.injectionForm.reset();
                    this.initializeInjectionForm();
                    this.loadPatientInjections(patientID);
                    // this.showSnackBar('Injection requested successfully!', 'Close', 3000, 'success-snackbar');
                },
                error => {
                    this.isRequestingInjection = false;
                    // this.showSnackBar(`Error requesting injection: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingInjection = false;
            // this.showSnackBar('Cannot request injection: Invalid form or missing patient data.', 'Close', 5000, 'error-snackbar');
        }
    }

    formatDate(dateString: string | undefined): string {

        if (!dateString) return '';
        const date = new Date(dateString);
        console.log('asitold', date);
        return date.toISOString().split('T')[0];
    }

    openNotificationDialog(): void {
        const dialogRef = this.dialog.open(NotificationDialogComponent, {
            width: '600px',
            disableClose: true,
            data: { employeeID: this.employeeID, selectedDoctorUserName: this.selectedDoctorUserName }
        });
        console.log('doctorhistory', this.employeeID);

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.success) {
                    alert(result.success);
                } else if (result.error) {
                    alert(result.error);
                }
            }
        });
    }

    onEditClick(): void {
        // Scroll to edit form or show edit form
        const editForm = document.querySelector('.edit-form');
        if (editForm) {
            editForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    resetSearch(): void {
        this.isSearchMode = false;
        this.searched = false;
        this.patient = null;
        this.cardNumber = '';
        this.medicalHistories = [];
        this.laboratoryTests = [];
        this.prescriptions = [];
        this.injections = [];
        this.searchForm.reset();
        this.editForm.reset();
        this.loadActivePatients(); // Reload active patients
    }
}