
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
import { InjectionPaperComponent } from '../injection-paper/injection-paper.component'; // Adjust path
import { EthiopianDatePickerComponent } from '../ethiopian-date-picker/ethiopian-date-picker.component'; // Adjust path as needed
import { EthiopianDate } from '../../models/ethiopian-date'; // Adjust path as needed
import { WoundCarePaperComponent } from '../wound-care-paper/wound-care-paper.component';
import { SuturingPaperComponent } from '../suturing-paper/suturing-paper.component';
import { EarIrrigationPaperComponent } from '../ear-irrigation-paper/ear-irrigation-paper.component';

@Component({
    selector: 'app-doctor',
    templateUrl: './doctor.component.html',
    styleUrls: ['./doctor.component.css'],
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
    woundCareForm!: FormGroup;
    suturingForm!: FormGroup;
    earIrrigationForm!: FormGroup;
    assignmentForm!: FormGroup;
    patient: any | null = null;
    laboratoryTests: any[] = [];
    prescriptions: any[] = [];
    injections: any[] = [];
    woundCareProcedures: any[] = [];
    suturingProcedures: any[] = [];
    earIrrigationProcedures: any[] = [];
    medications: any[] = [];
    injectableMedications: any[] = [];
    rooms: any[] = [];
    patientAssignments: any[] = [];
    isSearching = false;
    isEditing = false;
    isRequestingLab = false;
    isRequestingPrescription = false;
    isRequestingInjection = false;
    isRequestingWoundCare = false;
    isRequestingSuturing = false;
    isRequestingEarIrrigation = false;
    isAssigning = false;
    selectedProcedureType: 'injection' | 'wound-care' | 'suturing' | 'ear-irrigation' = 'injection';
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
    hasPendingLabs: boolean = false;

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
        this.initializeWoundCareForm();
        this.initializeSuturingForm();
        this.initializeEarIrrigationForm();
        this.initializeAssignmentForm();
        this.loadMedications();
        this.loadInjectableMedications();
        this.loadRooms();
        this.loadUserData();
        // this.loadActivePatients();
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
        // if (tab === 'prescriptions' && this.hasPendingLabs) {
        //     this.showSnackBar('Please complete pending laboratory tests before accessing pharmacy.', 'OK', 5000);
        //     return;
        // }
        this.selectedTab = tab;
        if (tab === 'prescriptions') {
            if (this.patient?.CardNumber) {
                this.loadPatientPrescriptions(this.patient.CardNumber);
            } else {
                this.prescriptions = [];
            }
        }
        this.cdr.detectChanges();
    }

    loadUserData(): void {
        this.medicalService.getEmployeeById(environment.username).subscribe(
            (response: any) => {
                const employee = response?.c_Employees?.[0];
                this.createdBy = employee?.user_ID ?? null;
                this.employeeID = employee?.employee_Id ?? null;
                console.log('doctorid', this.employeeID);

                // After loading user data, load doctor-specific patients
                if (this.createdBy) {
                    this.loadActivePatients(this.createdBy);
                } else {
                    console.error('No user ID found for current doctor');
                    this.activePatients = [];
                }
            },
            error => {
                this.createdBy = null;
                this.employeeID = null;
                console.error('Error loading user data:', error);
                this.activePatients = [];
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
    // loadPrescriptions(): void {
    //     this.medicalService.getPrescriptions().subscribe(
    //         (prescriptions: any[]) => {
    //             this.prescriptions = prescriptions.map(p => ({
    //                 ...p,
    //                 CardNumber: p.CardNumber || p.cardNumber || 'N/A',
    //                 FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
    //                 PrescriptionDate: p.prescriptionDate || p.PrescriptionDate,
    //                 Status: p.status || p.Status || 'Unknown',
    //                 PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
    //                 PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
    //                 prescriptionID: p.prescriptionID || p.PrescriptionID || `temp-${Date.now()}`
    //             }));
    //             this.prescriptions.sort((a, b) =>
    //                 new Date(b.PrescriptionDate || 0).getTime() - new Date(a.PrescriptionDate || 0).getTime()
    //             );
    //             this.cdr.detectChanges();
    //         },
    //         error => {
    //             console.error('Error loading prescriptions:', error);
    //             this.prescriptions = [];
    //             this.showSnackBar('Error loading prescriptions.', 'Close', 5000, 'error-snackbar');
    //         }
    //     );
    // }
    loadPrescriptions(): void {
        this.medicalService.getPrescriptions().subscribe({
            next: (prescriptions: any[]) => {
                // Ensure all prescriptions are included, regardless of status
                this.prescriptions = (prescriptions || []).map(p => ({
                    ...p,
                    CardNumber: p.CardNumber || p.cardNumber || 'N/A',
                    FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
                    PrescriptionDate: p.prescriptionDate || p.PrescriptionDate || null,
                    Status: p.status || p.Status || 'Unknown',
                    PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
                    PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
                    prescriptionID: p.prescriptionID || p.PrescriptionID || `temp-${Date.now()}`
                }));

                // Sort prescriptions by date (newest first), handling null dates
                this.prescriptions.sort((a, b) => {
                    const dateA = a.PrescriptionDate ? new Date(a.PrescriptionDate).getTime() : 0;
                    const dateB = b.PrescriptionDate ? new Date(b.PrescriptionDate).getTime() : 0;
                    return dateB - dateA;
                });

                console.log('Loaded prescriptions (including Dispensed):', this.prescriptions);
                this.cdr.detectChanges(); // Trigger UI update
            },
            error: (error) => {
                console.error('Error loading prescriptions:', error);
                this.prescriptions = [];
                this.showSnackBar('Error loading prescriptions.', 'Close', 5000, 'error-snackbar');
                this.cdr.detectChanges();
            },
            complete: () => {
                console.log('Prescription loading completed');
            }
        });
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
    getRoomName(roomId: number): string {
        const room = this.rooms.find(r => r.roomID === roomId);
        return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
    }

    loadActivePatients(doctorID: string): void {
        this.isSearching = true;
        this.medicalService.getAllDoctorActivePatients(doctorID).subscribe(
            (patients: any[]) => {
                // Remove the role filtering since the API now returns only doctor-specific patients
                this.activePatients = patients.map(patient => ({
                    PatientID: patient.PatientID,
                    CardNumber: patient.CardNumber,
                    FullName: patient.FullName,
                    FatherName: patient.FatherName,
                    DateOfBirth: new Date(patient.DateOfBirth),
                    Age: patient.Age,
                    gender: patient.gender || patient.Gender || 'Unknown',
                    phone: patient.phone,
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
                    RoleName: patient.RoleName,
                    RoomNumber: patient.RoomNumber,
                    StaffUserID: patient.StaffUserID,
                    IsActive: patient.IS_Active,
                    DoctorID: patient.DoctorID, // Add DoctorID to the patient object
                    DoctorName: patient.DoctorFullName // Add doctor name
                }));

                this.isSearching = false;
                console.log('Loaded doctor-specific patients:', this.activePatients.length, this.activePatients);
            },
            error => {
                console.error('Error loading doctor-specific patients:', error);
                this.activePatients = [];
                this.isSearching = false;
                this.showSnackBar('Error loading your assigned patients.', 'Close', 5000, 'error-snackbar');
            }
        );
    }

    onPatientRowClick(patient: PatientSummary): void {
        this.resetPatientData(); // Clear old data immediately
        this.isSearchMode = false;
        this.searched = true;
        this.cardNumber = patient.CardNumber;
        console.log('Patient clicked:', patient.CardNumber, patient.FullName);

        // Instead of using the limited data from the active patients list,
        // let's fetch the complete patient data using the card number
        this.isSearching = true;
        this.medicalService.getPatient(patient.CardNumber).subscribe(
            (response: any) => {
                
                const fullPatientData = Array.isArray(response) ? response[0] : response;
                console.log('anyresponse',response);
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
                            // If Pharmacy tab is active, reload prescriptions for this specific patient
                            if (this.selectedTab === 'prescriptions') {
                                this.loadPatientPrescriptions(fullPatientData.CardNumber);
                            }
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
            notes: [''],
            isRecurring: [false], // Add this field
            startDate: [null], // Add this field
            startTime: [null], // Add time field
            totalDoses: [1, [Validators.required, Validators.min(1)]] // Add this field
        });
    }

    initializeWoundCareForm(): void {
        const generatedWoundCareNumber = 'WC' + Date.now().toString();
        this.woundCareForm = this.fb.group({
            woundCareNumber: [generatedWoundCareNumber, Validators.required],
            woundType: ['', Validators.required],
            woundLocation: ['', Validators.required],
            woundSize: ['', Validators.required],
            woundDepth: ['', Validators.required],
            woundCondition: ['', Validators.required],
            treatmentPlan: ['', Validators.required],
            dressingType: ['', Validators.required],
            cleaningSolution: ['', Validators.required],
            instructions: [''],
            notes: [''],
            isRecurring: [false],
            frequency: [''],
            totalSessions: [1, [Validators.required, Validators.min(1)]]
        });
    }

    initializeSuturingForm(): void {
        const generatedSuturingNumber = 'SUT' + Date.now().toString();
      
        this.suturingForm = this.fb.group({
          // Auto-generated, disabled → excluded from validation
          suturingNumber: [{ value: generatedSuturingNumber, disabled: true }, Validators.required],
      
          // ALL required fields start with an **empty string**
          woundType: ['', Validators.required],
          woundLocation: ['', Validators.required],
          woundSize: ['', Validators.required],
          woundDepth: ['', Validators.required],
          sutureType: ['', Validators.required],
          sutureMaterial: ['', Validators.required],
          sutureSize: ['', Validators.required],
      
          // numStitches already has a sensible default
          numStitches: [1, [Validators.required, Validators.min(1)]],
      
          // Optional fields – no validator
          anesthesiaUsed: [''],
          instructions: [''],
          notes: [''],
          followUpRequired: [false],
          followUpDate: [null]
        });
      }

    // ---------- EAR IRRIGATION ----------
    initializeEarIrrigationForm(): void {
        const generatedEarIrrigationNumber = 'EI' + Date.now().toString();
        this.earIrrigationForm = this.fb.group({
            earIrrigationNumber: [{ value: generatedEarIrrigationNumber, disabled: true }, Validators.required],
            earSide: ['', Validators.required],
            irrigationSolution: ['', Validators.required],
            solutionTemperature: ['', Validators.required],
            irrigationPressure: ['', Validators.required],
            procedureDuration: [30, [Validators.required, Validators.min(1)]],
            findings: [''],
            complications: [''],
            instructions: [''],
            notes: [''],
            followUpRequired: [false],
            followUpDate: [null]
        });
    }

    initializeAssignmentForm(): void {
        this.assignmentForm = this.fb.group({
            assignedRoom: ['', Validators.required],
            doctorID: ['', Validators.required]
        });
    }

    get testsFormArray(): FormArray {
        return this.labRequestForm.get('tests') as FormArray;
    }

    get medicationsFormArray(): FormArray {
        return this.prescriptionForm.get('medications') as FormArray;
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

    onSearch(): void {
        this.resetPatientData(); // Clear old data immediately
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
                        (patient.RoleName === 'Examination(OPD-1)' || patient.RoleName === 'Examination(OPD-2)' || patient.RoleName === 'Examination(OPD-3)')
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
                                // If Pharmacy tab is active, reload prescriptions for this specific patient
                                if (this.selectedTab === 'prescriptions') {
                                    this.loadPatientPrescriptions(patient.CardNumber);
                                }
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
        this.prescriptions = []; // Clear prescriptions array
        this.injections = [];
        this.patientAssignments = []; // Reset patient assignments
        this.medicalHistories = []; // Clear medical histories
        this.hasPendingLabs = false;
        console.log('Patient data reset - prescriptions cleared');
    }

    loadPatientLaboratory(patientId: number): void {
        this.medicalService.getPatientLaboratoryTests(patientId).subscribe(
            tests => {
                this.laboratoryTests = tests;
                this.hasPendingLabs = this.laboratoryTests.some(test => test.status.toLowerCase() !== 'completed');
            },
            error => {
                this.laboratoryTests = [];
                this.hasPendingLabs = false;
                this.showSnackBar(`Error loading laboratory tests: ${error.message}`, 'Close', 5000, 'error-snackbar');
            }
        );
    }

    loadPatientPrescriptions(cardNumber: string): void {
        this.medicalService.getPrescriptions().subscribe((list: any[]) => {
          this.prescriptions = (list || [])
            .filter(p => p) // keep all
            .map(p => ({
              ...p,
              PharmacistName: (p.PharmacistName || '').trim() || 'Not Dispensed',
              PrescriptionID: p.PrescriptionID,
              PrescriptionNumber: p.PrescriptionNumber,
              PrescriptionDate: p.PrescriptionDate,
              TotalAmount: p.TotalAmount || 0,
              Status: p.Status,
              PrescriberName: p.PrescriberName,
            }));
          console.log('Prescriptions (all loaded):', this.prescriptions);
          this.cdr.detectChanges();
        });
      }


    // loadPatientPrescriptions(cardNumber: string): void {
    //     console.log('Loading prescriptions for cardNumber:', cardNumber);
    //     this.prescriptions = [];

    //     this.medicalService.getPrescriptionsByCardNumber(cardNumber).subscribe({
    //         next: (prescriptions: any[]) => {
    //             this.prescriptions = (prescriptions || []).map(p => ({
    //                 prescriptionID: p.prescriptionID || p.PrescriptionID,
    //                 prescriptionNumber: p.prescriptionNumber || p.PrescriptionNumber,
    //                 prescriptionDate: p.prescriptionDate || p.PrescriptionDate,
    //                 totalAmount: p.totalAmount ?? p.TotalAmount ?? 0,
    //                 status: p.status || p.Status,
    //                 prescriberName: p.prescriberName || p.PrescriberName,
    //                 pharmacistName: p.pharmacistName || p.PharmacistName,
    //                 CardNumber: p.CardNumber || p.cardNumber
    //             }));

    //             // Sort by date (newest first)
    //             this.prescriptions.sort((a, b) => {
    //                 const dateA = a.prescriptionDate ? new Date(a.prescriptionDate).getTime() : 0;
    //                 const dateB = b.prescriptionDate ? new Date(b.prescriptionDate).getTime() : 0;
    //                 return dateB - dateA;
    //             });

    //             console.log('Loaded patient prescriptions:', this.prescriptions);
    //             this.cdr.detectChanges();
    //         },
    //         error: (error) => {
    //             console.error('Error loading prescriptions:', error);
    //             this.prescriptions = [];
    //             this.showSnackBar('Error loading prescriptions.', 'Close', 5000, 'error-snackbar');
    //             this.cdr.detectChanges();
    //         }
    //     });
    // }

    loadPatientInjections(patientID: number): void {
        this.medicalService.getPatientInjections(patientID).subscribe(
            (injections: any[]) => {
                console.log('Loaded injections:', injections); // Debug log (keep this)

                // Transform to match frontend expectations (use PascalCase from API response)
                this.injections = (injections || []).map(injection => ({
                    InjectionID: injection.InjectionID,  // Matches API
                    InjectionNumber: injection.InjectionNumber,  // Matches API
                    InjectionDate: injection.InjectionDate,  // Matches API
                    Status: injection.Status,  // Matches API
                    OrderingPhysicianID: injection.OrderingPhysicianID,  // Matches API
                    OrderingPhysicianName: injection.OrderingPhysicianName,  // Matches API
                    MedicationID: injection.MedicationID,  // Matches API
                    MedicationName: injection.MedicationName,  // Matches API
                    Strength: injection.Strength,  // Matches API
                    DosageForm: injection.DosageForm,  // Matches API
                    Dose: injection.Dose,  // Matches API
                    Route: injection.Route,  // Matches API
                    Site: injection.Site,  // Matches API
                    Frequency: injection.Frequency,  // Matches API
                    Duration: injection.Duration,  // Matches API
                    Instructions: injection.Instructions,  // Matches API
                    Notes: injection.Notes,  // Matches API
                    // Defaults for missing fields (update backend for real values if needed)
                    IsRecurring: injection.IsRecurring || false,  // Matches API
                    TotalDoses: injection.TotalDoses || 1,  // Matches API
                    AdministeredDoses: injection.AdministeredDoses || 0  // Matches API
                }));

                console.log('Transformed injections for table:', this.injections); // New debug log
            },
            error => {
                console.error('Error loading injections:', error);
                this.injections = [];
                this.showSnackBar(`Error loading injections: ${error.message}`, 'Close', 5000, 'error-snackbar');
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

    viewPrescriptionDetails(prescriptionID: number | string): void {
        console.log('viewPrescriptionDetails called for prescriptionID:', prescriptionID);
      
        if (!prescriptionID) {
          this.showSnackBar('Invalid prescription ID.', 'Close', 5000, 'error-snackbar');
          return;
        }
      
        // FIX: Try both PascalCase and camelCase
        const id = Number(prescriptionID);
        const prescription = this.prescriptions.find(p =>
          p.PrescriptionID === id ||
          p.prescriptionID === id ||
          p.id === id
        );
      
        if (!prescription) {
          console.warn('Prescription not found in local list:', this.prescriptions);
          this.showSnackBar('Prescription not found.', 'Close', 5000, 'error-snackbar');
          return;
        }
      
        // Extract cardNumber safely
        const cardNumber = prescription.CardNumber ||
                           prescription.cardNumber ||
                           this.patient?.CardNumber ||
                           this.cardNumber;
      
        if (!cardNumber) {
          this.showSnackBar('Patient card number not available.', 'Close', 5000, 'error-snackbar');
          return;
        }
      
        console.log('Opening prescription paper for cardNumber:', cardNumber);
      
        // Open the dialog with correct cardNumber
        const dialogRef = this.dialog.open(PrescriptionPaperComponent, {
          width: '900px',
          maxWidth: '95vw',
          height: '90vh',
          data: { cardNumber: cardNumber }
        });
      
        dialogRef.afterClosed().subscribe(() => {
          console.log('Prescription dialog closed');
        });
      }

    closePrescriptionDetailsDialog(): void {
        this.showPrescriptionDetailsDialog = false;
        this.selectedCardNumber = '';
        this.cdr.detectChanges();
    }
    viewInjectionDetails(injectionID: number): void {
        if (!this.patient?.PatientID) {
            this.showSnackBar('No patient selected.', 'Close', 5000, 'error-snackbar');
            return;
        }

        const dialogRef = this.dialog.open(InjectionPaperComponent, {
            width: '800px',
            height: 'auto',
            maxHeight: '90vh',
            data: {
                injectionID: injectionID,
                patientID: this.patient.PatientID,
                dialogTitle: 'Injection Details'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Injection dialog closed', result);
        });
    }

    viewWoundCareDetails(procedureID: number): void {
        if (!this.patient?.PatientID) {
            this.showSnackBar('No patient selected.', 'Close', 5000, 'error-snackbar');
            return;
        }

        const dialogRef = this.dialog.open(WoundCarePaperComponent, {
            width: '800px',
            height: 'auto',
            maxHeight: '90vh',
            data: {
                woundCareID: procedureID,
                patientID: this.patient.PatientID,
                dialogTitle: 'Wound Care Details'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Wound Care dialog closed', result);
        });
    }

    viewSuturingDetails(procedureID: number): void {
        if (!this.patient?.PatientID) {
            this.showSnackBar('No patient selected.', 'Close', 5000, 'error-snackbar');
            return;
        }

        const dialogRef = this.dialog.open(SuturingPaperComponent, {
            width: '800px',
            height: 'auto',
            maxHeight: '90vh',
            data: {
                suturingID: procedureID,
                patientID: this.patient.PatientID,
                dialogTitle: 'Suturing Details'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Suturing dialog closed', result);
        });
    }

    viewEarIrrigationDetails(procedureID: number): void {
        if (!this.patient?.PatientID) {
            this.showSnackBar('No patient selected.', 'Close', 5000, 'error-snackbar');
            return;
        }

        const dialogRef = this.dialog.open(EarIrrigationPaperComponent, {
            width: '800px',
            height: 'auto',
            maxHeight: '90vh',
            data: {
                earIrrigationID: procedureID,
                patientID: this.patient.PatientID,
                dialogTitle: 'Ear Irrigation Details'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Ear Irrigation dialog closed', result);
        });
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
                cardNumber: cardNumber,  // ADD THIS LINE TO ENSURE CARDNUMBER IS SAVED
                cardID: null,
                prescriberID: this.createdBy,
                notes: this.prescriptionForm.value.notes || null,
                createdBy: this.createdBy,
                medications: this.prescriptionForm.value.medications
            };

            this.medicalService.createPrescription(prescription).subscribe(
                (response: any) => {
                    console.log('CreatePrescription response:', response);
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

    // Procedure type selection
    selectProcedureType(type: 'injection' | 'wound-care' | 'suturing' | 'ear-irrigation'): void {
        this.selectedProcedureType = type;
        // Load data for the selected procedure type
        if (this.patient && this.patient.PatientID) {
            const patientID = parseInt(this.patient.PatientID, 10);
            switch (type) {
                case 'wound-care':
                    this.loadPatientWoundCare(patientID);
                    break;
                case 'suturing':
                    this.loadPatientSuturing(patientID);
                    break;
                case 'ear-irrigation':
                    this.loadPatientEarIrrigation(patientID);
                    break;
                case 'injection':
                default:
                    this.loadPatientInjections(patientID);
                    break;
            }
        }
    }

    // Load wound care procedures for patient
    loadPatientWoundCare(patientID: number): void {
        this.medicalService.getPatientWoundCare(patientID).subscribe(
            (procedures: any[]) => {
                this.woundCareProcedures = procedures || [];
                console.log('Loaded wound care procedures:', this.woundCareProcedures);
            },
            (error) => {
                this.woundCareProcedures = [];
                console.error('Error loading wound care procedures:', error);
            }
        );
    }

    // Load suturing procedures for patient
    loadPatientSuturing(patientID: number): void {
        this.medicalService.getPatientSuturing(patientID).subscribe(
            (procedures: any[]) => {
                this.suturingProcedures = procedures || [];
                console.log('Loaded suturing procedures:', this.suturingProcedures);
            },
            (error) => {
                this.suturingProcedures = [];
                console.error('Error loading suturing procedures:', error);
            }
        );
    }

    // Load ear irrigation procedures for patient
    loadPatientEarIrrigation(patientID: number): void {
        this.medicalService.getPatientEarIrrigation(patientID).subscribe(
            (procedures: any[]) => {
                this.earIrrigationProcedures = procedures || [];
                console.log('Loaded ear irrigation procedures:', this.earIrrigationProcedures);
            },
            (error) => {
                this.earIrrigationProcedures = [];
                console.error('Error loading ear irrigation procedures:', error);
            }
        );
    }

    onInjectionSubmit(): void {
        if (this.injectionForm.valid && this.patient && this.createdBy) {
            this.isRequestingInjection = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;
            const form = this.injectionForm.getRawValue();

            // Convert medicationID to number
            const medicationID = Number(form.medicationID);
            if (isNaN(medicationID)) {
                this.isRequestingInjection = false;
                this.showSnackBar('Invalid medication selected.', 'Close', 5000, 'error-snackbar');
                return;
            }

            // Prepare the injection data matching the stored procedure parameters
            let startDateIso = null;
            if (form.startDate) {
                const gregDate = this.convertEthToGreg(form.startDate);
                if (form.startTime) {
                    const [hours, minutes] = form.startTime.split(':');
                    gregDate.setHours(parseInt(hours), parseInt(minutes));
                }
                startDateIso = gregDate.toISOString();
            }

            const injection = {
                injectionNumber: form.injectionNumber,
                patientID: patientID,
                cardNumber: cardNumber,
                orderingPhysicianID: this.createdBy,
                medicationID: medicationID, // Now a number
                dose: form.dose,
                route: form.route,
                site: form.site,
                frequency: form.frequency,
                duration: form.duration,
                instructions: form.instructions || null,
                notes: form.notes || null,
                createdBy: this.createdBy,
                isRecurring: form.isRecurring || false,
                startDate: startDateIso,
                totalDoses: form.totalDoses || 1
            };

            console.log('Submitting injection:', injection);

            this.medicalService.createInjection(injection).subscribe(
                (response: any) => {
                    this.isRequestingInjection = false;
                    this.injectionForm.reset();
                    this.initializeInjectionForm();
                    this.loadPatientInjections(patientID);
                    this.showSnackBar('Injection requested successfully!', 'Close', 3000, 'success-snackbar');
                },
                error => {
                    this.isRequestingInjection = false;
                    this.showSnackBar(`Error requesting injection: ${error.message}`, 'Close', 5000, 'error-snackbar');
                    console.error('Injection submission error:', error);
                }
            );
        } else {
            this.isRequestingInjection = false;
            if (!this.patient) {
                this.showSnackBar('No patient selected.', 'Close', 5000, 'error-snackbar');
            } else if (!this.createdBy) {
                this.showSnackBar('User not authenticated.', 'Close', 5000, 'error-snackbar');
            } else {
                this.showSnackBar('Please fill all required fields correctly.', 'Close', 5000, 'error-snackbar');
            }
        }
    }

    onWoundCareSubmit(): void {
        if (this.woundCareForm.valid && this.patient && this.createdBy) {
            this.isRequestingWoundCare = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;
            const form = this.woundCareForm.getRawValue();

            const woundCare = {
                woundCareNumber: form.woundCareNumber,
                patientID: patientID,
                cardNumber: cardNumber,
                orderingPhysicianID: this.createdBy,
                woundType: form.woundType,
                woundLocation: form.woundLocation,
                woundSize: form.woundSize,
                woundDepth: form.woundDepth,
                woundCondition: form.woundCondition,
                treatmentPlan: form.treatmentPlan,
                dressingType: form.dressingType,
                cleaningSolution: form.cleaningSolution,
                instructions: form.instructions || null,
                notes: form.notes || null,
                createdBy: this.createdBy,
                isRecurring: form.isRecurring || false,
                frequency: form.frequency || null,
                totalSessions: form.totalSessions || 1
            };

            this.medicalService.createWoundCare(woundCare).subscribe(
                (response) => {
                    this.isRequestingWoundCare = false;
                    this.showSnackBar('Wound care procedure requested successfully!', 'Close', 3000, 'success-snackbar');
                    this.woundCareForm.reset();
                    this.initializeWoundCareForm();
                },
                (error) => {
                    this.isRequestingWoundCare = false;
                    this.showSnackBar(`Error requesting wound care: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingWoundCare = false;
            this.showSnackBar('Please fill all required fields correctly.', 'Close', 5000, 'error-snackbar');
        }
    }

    onSuturingSubmit(): void {
        if (this.suturingForm.valid && this.patient && this.createdBy) {
            this.isRequestingSuturing = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;
            const form = this.suturingForm.getRawValue();

            const suturing = {
                suturingNumber: form.suturingNumber,
                patientID: patientID,
                cardNumber: cardNumber,
                orderingPhysicianID: this.createdBy,
                woundType: form.woundType,
                woundLocation: form.woundLocation,
                woundSize: form.woundSize,
                woundDepth: form.woundDepth,
                sutureType: form.sutureType,
                sutureMaterial: form.sutureMaterial,
                sutureSize: form.sutureSize,
                numStitches: form.numStitches,
                anesthesiaUsed: form.anesthesiaUsed || null,
                instructions: form.instructions || null,
                notes: form.notes || null,
                createdBy: this.createdBy,
                followUpRequired: form.followUpRequired || false,
                followUpDate: form.followUpDate || null
            };

            this.medicalService.createSuturing(suturing).subscribe(
                (response) => {
                    this.isRequestingSuturing = false;
                    this.showSnackBar('Suturing procedure requested successfully!', 'Close', 3000, 'success-snackbar');
                    this.suturingForm.reset();
                    this.initializeSuturingForm();
                },
                (error) => {
                    this.isRequestingSuturing = false;
                    this.showSnackBar(`Error requesting suturing: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingSuturing = false;
            this.showSnackBar('Please fill all required fields correctly.', 'Close', 5000, 'error-snackbar');
        }
    }

    onEarIrrigationSubmit(): void {
        if (this.earIrrigationForm.valid && this.patient && this.createdBy) {
            this.isRequestingEarIrrigation = true;
            const patientID = parseInt(this.patient.PatientID, 10);
            const cardNumber = this.patient.CardNumber;
            const form = this.earIrrigationForm.getRawValue();

            const earIrrigation = {
                earIrrigationNumber: form.earIrrigationNumber,
                patientID: patientID,
                cardNumber: cardNumber,
                orderingPhysicianID: this.createdBy,
                earSide: form.earSide,
                irrigationSolution: form.irrigationSolution,
                solutionTemperature: form.solutionTemperature,
                irrigationPressure: form.irrigationPressure,
                procedureDuration: form.procedureDuration,
                findings: form.findings || null,
                complications: form.complications || null,
                instructions: form.instructions || null,
                notes: form.notes || null,
                createdBy: this.createdBy,
                followUpRequired: form.followUpRequired || false,
                followUpDate: form.followUpDate || null
            };

            this.medicalService.createEarIrrigation(earIrrigation).subscribe(
                (response) => {
                    this.isRequestingEarIrrigation = false;
                    this.showSnackBar('Ear irrigation procedure requested successfully!', 'Close', 3000, 'success-snackbar');
                    this.earIrrigationForm.reset();
                    this.initializeEarIrrigationForm();
                },
                (error) => {
                    this.isRequestingEarIrrigation = false;
                    this.showSnackBar(`Error requesting ear irrigation: ${error.message}`, 'Close', 5000, 'error-snackbar');
                }
            );
        } else {
            this.isRequestingEarIrrigation = false;
            this.showSnackBar('Please fill all required fields correctly.', 'Close', 5000, 'error-snackbar');
        }
    }

    convertEthToGreg(eth: EthiopianDate): Date {
        const jd = 1723856 + 365 * (eth.year - 1) + Math.floor(eth.year / 4) + 30 * eth.month + eth.day - 31.5;
        const l = Math.floor(jd + 0.5) + 68569;
        const n = Math.floor(4 * l / 146097);
        const l1 = l - Math.floor((146097 * n + 3) / 4);
        const i = Math.floor(4000 * (l1 + 1) / 1461001);
        const l2 = l1 - Math.floor(1461 * i / 4) + 31;
        const j = Math.floor(80 * l2 / 2447);
        const day = l2 - Math.floor(2447 * j / 80);
        const l3 = Math.floor(j / 11);
        const month = j + 2 - 12 * l3;
        const year = 100 * (n - 49) + i + l3;
        return new Date(year, month - 1, day);
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
                    this.showSnackBar(`result.success`)
                } else if (result.error) {
                    this.showSnackBar(`result.error`)
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
        // this.loadActivePatients(); // Reload active patients
    }
}   