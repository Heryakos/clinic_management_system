import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { PatientDoctorCard, PatientMedicalHistory, PatientSummary } from 'src/app/models/medical.model';
import { testCategories } from 'src/app/models/laboratory-test-categories';
import { Medication, DosageForm, MedicationCategory, MedicationSelection } from '../medication-tree-dropdown/medication-tree-dropdown.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { PrescriptionPaperComponent } from '../prescription-paper/prescription-paper.component';
import { InjectionPaperComponent } from '../injection-paper/injection-paper.component';
import { EthiopianDate } from '../../models/ethiopian-date';
import { WoundCarePaperComponent } from '../wound-care-paper/wound-care-paper.component';
import { SuturingPaperComponent } from '../suturing-paper/suturing-paper.component';
import { EarIrrigationPaperComponent } from '../ear-irrigation-paper/ear-irrigation-paper.component';
import { RejectAssignmentDialogComponent, RejectAssignmentDialogData } from '../reject-assignment-dialog/reject-assignment-dialog.component';

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css'],
})
export class DoctorComponent implements OnInit {
  isRejecting = false;
  isRejectingAssignment = false;
  dynamicTestCategories: any = {};
  showSelectAll: boolean = false;
  selectAllChecked: boolean = false;
  selectedPharmacyTab: 'active' | 'dispensed' = 'active';
  selectedLabTab: 'ordered' | 'completed' = 'ordered';
  selectedProcedureType: 'injection' | 'wound-care' | 'suturing' | 'ear-irrigation' = 'injection';
  filteredPrescriptions: any[] = [];
  activePrescriptionCount: number = 0;
  pendingLabCount: number = 0;
  filteredLaboratoryTests: any[] = [];
  selectedCardNumber: string = '';
  activePatients: PatientSummary[] = [];
  isSearchMode = false;
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
  showHistoryIndex: number | null = null;
  createdBy: string | null = null;
  availableTests: { name: string; normalRange: string; unit: string }[] = [];
  selectedTestNames: Set<string> = new Set();
  customTestMode: boolean = false;
  filteredTests: any[] = [];
  selectedTab: string = 'patient-info';
  showTestDetailsDialog: boolean = false;
  selectedTestDetails: any[] = [];
  selectedTestNumber: string = '';
  showPrescriptionDetailsDialog: boolean = false;
  selectedPrescriptionDetails: any[] = [];
  selectedPrescriptionNumber: string = '';
  prescriptionDetailsMap: { [prescriptionID: number]: any } = {};
  categorizedMedications: MedicationCategory[] = [];
  categorizedInjectableMedications: MedicationCategory[] = [];
  employeeID: string | null = null;
  selectedDoctorUserName: string | null = null;
  selectedTestData: any = null;
  hasPendingLabs: boolean = false;
  selectedPatientsTab: 'current' | 'history' = 'current';
  currentActivePatients: PatientSummary[] = [];
  historyPatients: PatientSummary[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private medicalService: MedicalService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadLabTestCategories();
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
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  private updateFilteredLabTests(): void {
    if (this.selectedLabTab === 'ordered') {
      this.filteredLaboratoryTests = this.laboratoryTests.filter(
        test => {
          const status = test.status?.toString().toLowerCase();
          return status === 'ordered' || status === 'pending';
        }
      );
    } else {
      this.filteredLaboratoryTests = this.laboratoryTests.filter(
        test => test.status?.toString().toLowerCase() === 'completed'
      );
    }

    this.pendingLabCount = this.laboratoryTests.filter(
      test => ['ordered', 'pending'].includes(test.status?.toString().toLowerCase())
    ).length;
  }

  onLabTabChange(tab: 'ordered' | 'completed'): void {
    this.selectedLabTab = tab;
    this.updateFilteredLabTests();
  }

  private showSnackBar(message: string, action: string = 'Close', duration: number = 3000, panelClass: string = 'info-snackbar'): void {
    this.snackBar.open(message, action, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [panelClass],
    });
  }

  toggleHistory(index: number): void {
    this.showHistoryIndex = this.showHistoryIndex === index ? null : index;
  }

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
        if (this.createdBy) {
          this.loadActivePatients(this.createdBy);
        } else {
          console.error('No user ID found for current doctor');
          this.activePatients = [];
        }
      },
      (error: any) => {
        this.createdBy = null;
        this.employeeID = null;
        console.error('Error loading user data:', error);
        this.activePatients = [];
      }
    );
  }
  loadLabTestCategories(): void {
    this.medicalService.getLabTestCategories().subscribe({
      next: (data) => {
        this.dynamicTestCategories = data;
        console.log('Dynamic lab tests loaded:', data);
        this.onTestCategoryChange(); 
      },
      error: (err) => {
        console.error('Failed to load lab tests', err);
        this.showSnackBar('Could not load lab tests.', 'Close');
      }
    });
  }
  loadActivePatients(doctorID: string): void {
    this.isSearching = true;
    this.medicalService.getAllDoctorActivePatients(doctorID).subscribe(
      (patients: any[]) => {
        const allPatients = patients || [];
        this.currentActivePatients = allPatients.filter(p => !p.CurrentRequestSickLeave || p.RequestStatus !== 'Finished');
        this.historyPatients = allPatients.filter(p => p.CurrentRequestSickLeave && p.RequestStatus === 'Finished');
        this.activePatients = this.selectedPatientsTab === 'current'
          ? this.currentActivePatients
          : this.historyPatients;
        this.isSearching = false;
        console.log('Loaded doctor-specific patients:', this.activePatients.length, this.activePatients);
        this.cdr.detectChanges(); 
      },
      (error: any) => {
        console.error('Error loading doctor-specific patients:', error);
        this.activePatients = [];
        this.isSearching = false;
        this.showSnackBar('Error loading your assigned patients.', 'Close', 5000, 'error-snackbar');
        this.cdr.detectChanges(); 
      }
    );
  }

  loadPatient(patientID: number): void {
    if (this.patient?.CardNumber) {
      this.medicalService.getPatient(this.patient.CardNumber).subscribe(
        (fullPatient: any) => {
          this.patient = fullPatient;
          this.cdr.detectChanges();
        },
        (error: any) => {
          console.error('Error loading full patient:', error);
        }
      );
    } else {
      console.warn('Cannot load patient: CardNumber not available');
    }
  }

  onPatientRowClick(patient: PatientSummary): void {
    this.resetPatientData();
    this.isSearchMode = false;
    this.searched = true;
    this.cardNumber = patient.CardNumber;
    this.isSearching = true;
    this.medicalService.getPatient(patient.CardNumber).subscribe(
      (response: any) => {
        const rawPatient = Array.isArray(response) ? response[0] : response;
        if (rawPatient && rawPatient.PatientID) {
          this.patient = {
            ...rawPatient,
            Gender: this.mapGender(rawPatient.Gender || rawPatient.gender || ''),
            gender: this.mapGender(rawPatient.Gender || rawPatient.gender || '') 
          };
          const formattedPatient = {
            ...this.patient,
            RegistrationDate: this.formatDate(this.patient.RegistrationDate)
          };
          this.editForm.patchValue(formattedPatient);
          this.medicalService.getPatientByCardNumberHistory(patient.CardNumber).subscribe(
            (historyResponse: PatientMedicalHistory[]) => {
              this.medicalHistories = Array.isArray(historyResponse) ? historyResponse : [];
              this.loadPatientLaboratory(Number(this.patient.PatientID));
              this.loadPatientPrescriptions(this.patient.CardNumber);
              this.loadPatientInjections(this.patient.PatientID);
              if (this.selectedTab === 'prescriptions') {
                this.loadPatientPrescriptions(this.patient.CardNumber);
              }
            },
            (error: any) => {
              this.medicalHistories = [];
            }
          );
        } else {
          this.resetPatientData();
        }
        this.isSearching = false;
        this.cdr.detectChanges(); 
      },
      (error: any) => {
        this.resetPatientData();
        this.isSearching = false;
        this.showSnackBar(`No record found or error occurred: ${error.message}`, 'Close', 5000, 'error-snackbar');
      }
    );
  }

  loadMedications(): void {
    this.medicalService.getMedications().subscribe(
      (medications: MedicationCategory[]) => {
        console.log('Loading hierarchical medications', medications);
        this.categorizedMedications = medications;
        this.medications = medications.flatMap((category: MedicationCategory) =>
          category.dosageForms.flatMap((form: DosageForm) => form.medications)
        );
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
      (error: any) => {
        this.categorizedMedications = [];
        this.categorizedInjectableMedications = [];
        this.medications = [];
        this.injectableMedications = [];
        console.error('Error loading medications:', error);
      }
    );
  }

  loadPrescriptions(): void {
    this.medicalService.getPrescriptions().subscribe({
      next: (prescriptions: any[]) => {
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
        this.prescriptions.sort((a, b) => {
          const dateA = a.PrescriptionDate ? new Date(a.PrescriptionDate).getTime() : 0;
          const dateB = b.PrescriptionDate ? new Date(b.PrescriptionDate).getTime() : 0;
          return dateB - dateA;
        });
        console.log('Loaded prescriptions (including Dispensed):', this.prescriptions);
        this.cdr.detectChanges(); 
      },
      error: (error: any) => {
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

  onMedicationSelection(selection: MedicationSelection, index: number): void {
    const medicationForm = this.medicationsFormArray.at(index) as FormGroup;
    medicationForm.patchValue({
      medicationID: selection.medicationId
    });
  }

  loadInjectableMedications(): void {
    this.medicalService.getMedications().subscribe(
      medications => {
        this.injectableMedications = this.medications.filter((med: { dosageForm: string }) =>
          med.dosageForm === 'Injection' || med.dosageForm === 'Vial'
        );
      },
      (error: any) => {
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
      (error: any) => {
        console.error('Error loading rooms:', error);
      }
    );
  }

  getRoomName(roomId: number): string {
    const room = this.rooms.find(r => r.roomID === roomId);
    return room ? `${room.roomNumber} - ${room.roomName}` : 'Unknown Room';
  }

  private mapGender(genderText: string): 'M' | 'F' {
    if (!genderText) return 'M'; // default to M for safety (or 'U' if you prefer)
    const lower = genderText.toLowerCase().trim();
    if (lower.includes('ወንድ') || lower.includes('male') || lower === 'm') {
      return 'M';
    }
    if (lower.includes('ሴት') || lower.includes('female') || lower === 'f') {
      return 'F';
    }
    return 'M'; 
  }

  initializeSearchForm(): void {
    this.searchForm = this.fb.group({
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
      bloodPressure: ['', [Validators.pattern(/^\d{1,3}\/\d{1,3}$/)]], 
      pulseRate: ['', [Validators.pattern(/^\d{1,3}$/)]], 
      temperature: ['', [Validators.min(30), Validators.max(45)]],
      chiefComplaint: [''],
      bmi: [{ value: '', disabled: true }],
      nextAppointment: [''],
      treatmentPlan: ['']
    });
    this.editForm.get('weight')?.valueChanges.subscribe(() => this.calculateBMI());
    this.editForm.get('height')?.valueChanges.subscribe(() => this.calculateBMI());
  }

  calculateBMI(): void {
    const weight = this.editForm.get('weight')?.value;
    const height = this.editForm.get('height')?.value;
    if (weight && height) {
      const heightInMeters = height / 100; 
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
      isRecurring: [false], 
      startDate: [null], 
      startTime: [null], 
      totalDoses: [1, [Validators.required, Validators.min(1)]] 
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
      suturingNumber: [{ value: generatedSuturingNumber, disabled: true }, Validators.required],
      woundType: ['', Validators.required],
      woundLocation: ['', Validators.required],
      woundSize: ['', Validators.required],
      woundDepth: ['', Validators.required],
      sutureType: ['', Validators.required],
      sutureMaterial: ['', Validators.required],
      sutureSize: ['', Validators.required],
      numStitches: [1, [Validators.required, Validators.min(1)]],
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

  // onTestCategoryChange(): void {
  //   const category = this.labRequestForm.get('testCategory')?.value as keyof typeof testCategories;
  //   this.availableTests = testCategories[category] || [];
  //   this.filteredTests = testCategories[category] || [];
  //   this.selectedTestNames.clear();

  //   const testsArray = this.testsFormArray;
  //   while (testsArray.length !== 0) {
  //     testsArray.removeAt(0);
  //   }

  //   // Determine if we should show "Select All" checkbox
  //   this.showSelectAll = ['UrineAnalysis', 'Hematology', 'Stool_Examination'].includes(category);
  //   this.selectAllChecked = false;

  //   this.customTestMode = false;
  // }
  onTestCategoryChange(): void {
    const category = this.labRequestForm.get('testCategory')?.value;
    this.filteredTests = this.dynamicTestCategories[category]?.tests || [];
    this.testsFormArray.clear();
    this.selectedTestNames.clear();
    this.showSelectAll = ['UrineAnalysis', 'Hematology', 'Stool_Examination'].includes(category);
    this.selectAllChecked = false;
  }
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  
  formatCategoryName(key: string): string {
    return key.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  onSelectAllChange(event: any): void {
    this.selectAllChecked = event.target.checked;
    const category = this.labRequestForm.get('testCategory')?.value;
  
    const excludedTests = new Set<string>();
  
    if (category === 'UrineAnalysis') {
      excludedTests.add('Other');
      excludedTests.add('Pregenancy Test');
    } else if (category === 'Hematology') {
      excludedTests.add('ESR');
      excludedTests.add('Bloodfilm');
    }
  
    this.filteredTests.forEach(test => {
      if (!excludedTests.has(test.name)) {
        if (this.selectAllChecked) {
          this.onTestCheckboxChange({ target: { checked: true } }, test);
        } else {
          this.onTestCheckboxChange({ target: { checked: false } }, test);
        }
      }
    });
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
    this.resetPatientData(); 
    if (this.searchForm.valid) {
      this.isSearching = true;
      const cardNumber = this.searchForm.value.patientID;
      this.medicalService.getPatient(cardNumber).subscribe(
        (response: any) => {
          const patient = Array.isArray(response) ? response[0] : response;
          console.log('Patient data:', patient);
          if (
            patient &&
            patient.PatientID &&
            (patient.RoleName === 'Examination(OPD-1)' || patient.RoleName === 'Examination(OPD-2)' || patient.RoleName === 'Examination(OPD-3)')
          ) {
            this.patient = patient;
            const formattedPatient = {
              ...patient,
              RegistrationDate: this.formatDate(patient.RegistrationDate)
            };
            this.editForm.patchValue(formattedPatient);
            console.log('Form Value After Patch:', this.editForm.value);
            this.cardNumber = patient.CardNumber;
            this.medicalService.getPatientByCardNumberHistory(cardNumber).subscribe(
              (historyResponse: PatientMedicalHistory[]) => {
                this.medicalHistories = Array.isArray(historyResponse) ? historyResponse : [];
                this.loadPatientLaboratory(Number(patient.PatientID));
                this.loadPatientPrescriptions(patient.CardNumber);
                this.loadPatientInjections(patient.PatientID);
                if (this.selectedTab === 'prescriptions') {
                  this.loadPatientPrescriptions(patient.CardNumber);
                }
              },
              (error: any) => {
                this.medicalHistories = [];
              }
            );
          } else {
            this.resetPatientData();
            this.showSnackBar('No patient found with this card number.', 'Close', 5000, 'error-snackbar');
          }
          this.isSearching = false;
        },
        (error: any) => {
          this.resetPatientData();
          this.isSearching = false;
          this.showSnackBar(`No record found or error occurred: ${error.message}`, 'Close', 5000, 'error-snackbar');
        }
      );
    }
  }

  onSignatureError(event: any): void {
    console.warn('Failed to load doctor signature image');
    event.target.src = 'assets/images/signature-placeholder.png';
  }

  private resetPatientData(): void {
    this.patient = null;
    this.editForm.reset();
    this.laboratoryTests = [];
    this.prescriptions = []; 
    this.injections = [];
    this.patientAssignments = []; 
    this.medicalHistories = [];
    this.hasPendingLabs = false;
    console.log('Patient data reset - prescriptions cleared');
  }

  loadPatientLaboratory(patientId: number): void {
    this.medicalService.getPatientLaboratoryTests(patientId).subscribe(
      (tests: any[]) => {
        this.laboratoryTests = tests;
        this.updateFilteredLabTests();
        this.hasPendingLabs = this.laboratoryTests.some(test => test.status.toLowerCase() !== 'completed');
      },
      (error: any) => {
        this.laboratoryTests = [];
        this.hasPendingLabs = false;
        this.showSnackBar(`Error loading laboratory tests: ${error.message}`, 'Close', 5000, 'error-snackbar');
      }
    );
  }

  loadPatientPrescriptions(cardNumber: string): void {
    console.log('Loading prescriptions for cardNumber:', cardNumber);
    this.prescriptions = [];
    this.medicalService.getPrescriptionsByCardNumber(cardNumber).subscribe({
      next: (prescriptions: any[]) => {
        this.prescriptions = (prescriptions || []).map(p => ({
          prescriptionID: p.prescriptionID || p.PrescriptionID,
          prescriptionNumber: p.prescriptionNumber || p.PrescriptionNumber,
          prescriptionDate: p.prescriptionDate || p.PrescriptionDate,
          totalAmount: p.totalAmount ?? p.TotalAmount ?? 0,
          status: p.status || p.Status,
          prescriberName: p.prescriberName || p.PrescriberName,
          pharmacistName: p.pharmacistName || p.PharmacistName,
          CardNumber: p.CardNumber || p.cardNumber
        }));
        this.prescriptions.sort((a, b) => {
          const dateA = a.prescriptionDate ? new Date(a.prescriptionDate).getTime() : 0;
          const dateB = b.prescriptionDate ? new Date(b.prescriptionDate).getTime() : 0;
          return dateB - dateA;
        });

        this.updateFilteredPrescriptions(); 
        console.log('Loaded patient prescriptions:', this.prescriptions);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading prescriptions:', error);
        this.prescriptions = [];
        this.filteredPrescriptions = [];
        this.showSnackBar('Error loading prescriptions.', 'Close', 5000, 'error-snackbar');
        this.cdr.detectChanges();
      }
    });
  }

  private updateFilteredPrescriptions(): void {
    const lowerStatus = (s: string) => s?.toString().toLowerCase();

    if (this.selectedPharmacyTab === 'active') {
      this.filteredPrescriptions = this.prescriptions.filter(p => lowerStatus(p.status) === 'active');
    } else {
      this.filteredPrescriptions = this.prescriptions.filter(p => lowerStatus(p.status) === 'dispensed');
    }

    this.activePrescriptionCount = this.prescriptions.filter(p => lowerStatus(p.status) === 'active').length;
  }

  onPharmacyTabChange(tab: 'active' | 'dispensed'): void {
    this.selectedPharmacyTab = tab;
    this.updateFilteredPrescriptions();
  }
  loadPatientInjections(patientID: number): void {
    this.medicalService.getPatientInjections(patientID).subscribe(
      (injections: any[]) => {
        console.log('Loaded injections:', injections); 
        this.injections = (injections || []).map(injection => ({
          InjectionID: injection.InjectionID, 
          InjectionNumber: injection.InjectionNumber, 
          InjectionDate: injection.InjectionDate, 
          Status: injection.Status,
          OrderingPhysicianID: injection.OrderingPhysicianID,
          OrderingPhysicianName: injection.OrderingPhysicianName, 
          MedicationID: injection.MedicationID, 
          MedicationName: injection.MedicationName,
          Strength: injection.Strength, 
          DosageForm: injection.DosageForm, 
          Dose: injection.Dose, 
          Route: injection.Route, 
          Site: injection.Site, 
          Frequency: injection.Frequency, 
          Duration: injection.Duration, 
          Instructions: injection.Instructions, 
          Notes: injection.Notes, 
          IsRecurring: injection.IsRecurring || false, 
          TotalDoses: injection.TotalDoses || 1, 
          AdministeredDoses: injection.AdministeredDoses || 0 
        }));
        console.log('Transformed injections for table:', this.injections); 
      },
      (error: any) => {
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
        const testData = this.laboratoryTests.find(test => test.testID === testID);
        this.selectedTestData = testData || null;
        this.showTestDetailsDialog = true;
      },
      (error: any) => {
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
    const cardNumber = prescription.CardNumber ||
      prescription.cardNumber ||
      this.patient?.CardNumber ||
      this.cardNumber;
    if (!cardNumber) {
      this.showSnackBar('Patient card number not available.', 'Close', 5000, 'error-snackbar');
      return;
    }
    console.log('Opening prescription paper for cardNumber:', cardNumber);
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
        gender: this.mapGender(this.patient.Gender || this.patient.gender || ''),
        phone: this.patient.phone ?? '',
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
        (error: any) => {
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
          }).catch((error: any) => {
            this.isRequestingLab = false;
            this.showSnackBar(`Error adding test details: ${error.message}`, 'Close', 5000, 'error-snackbar');
          });
        },
        (error: any) => {
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
        cardNumber: cardNumber, // ADD THIS LINE TO ENSURE CARDNUMBER IS SAVED
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
          }).catch((error: any) => {
            this.isRequestingPrescription = false;
            this.showSnackBar(`Error adding prescription details: ${error.message}`, 'Close', 5000, 'error-snackbar');
          });
        },
        (error: any) => {
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

  openRejectAssignmentDialog(patient: PatientSummary): void {
    const dialogRef = this.dialog.open(RejectAssignmentDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        patientName: patient.FullName?.trim() || 'Unknown Patient',
        cardNumber: patient.CardNumber,
        patientID: patient.PatientID,
        doctorID: this.employeeID || this.createdBy || null
      } as RejectAssignmentDialogData,
      disableClose: true
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && result.reason?.trim()) {
        this.performRejectAssignment(patient, result.reason.trim());
      }
    });
  }
  
  performRejectAssignment(patient: PatientSummary, reason: string): void {
    this.isRejecting = true;
  
    const cardId = patient.CardID ?? 0;
    if (cardId <= 0) {
      this.showSnackBar('Cannot reject: Missing or invalid CardID', 'Close', 5000, 'error-snackbar');
      this.isRejecting = false;
      return;
    }
  
    const rejectedByGuid = this.createdBy;
    if (!rejectedByGuid) {
      this.showSnackBar('Cannot reject: Missing doctor/user GUID', 'Close', 5000, 'error-snackbar');
      this.isRejecting = false;
      return;
    }
  
    const payload = {
      rejectionReason: reason.trim(),
      rejectedBy: rejectedByGuid
    };
  
    this.medicalService.rejectWrongAssignment(cardId, payload).subscribe({
      next: (response) => {
        this.currentActivePatients = this.currentActivePatients.filter(
          p => p.PatientID !== patient.PatientID
        );
  
        if (this.selectedPatientsTab === 'current') {
          this.activePatients = [...this.currentActivePatients];
        } else {
          this.activePatients = [...this.historyPatients];
        }
  
        this.showSnackBar(
          `Assignment rejected successfully: ${reason}`,
          'OK',
          4000,
          'success-snackbar'
        );
  
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Reject API failed:', err);
        const errorMsg = err.error?.message || 'Failed to reject assignment.';
        this.showSnackBar(errorMsg, 'Close', 7000, 'error-snackbar');
      },
      complete: () => {
        this.isRejecting = false;
      }
    });
  }

  loadPatientWoundCare(patientID: number): void {
    this.medicalService.getPatientWoundCare(patientID).subscribe(
      (procedures: any[]) => {
        this.woundCareProcedures = procedures || [];
        console.log('Loaded wound care procedures:', this.woundCareProcedures);
      },
      (error: any) => {
        this.woundCareProcedures = [];
        console.error('Error loading wound care procedures:', error);
      }
    );
  }

  loadPatientSuturing(patientID: number): void {
    this.medicalService.getPatientSuturing(patientID).subscribe(
      (procedures: any[]) => {
        this.suturingProcedures = procedures || [];
        console.log('Loaded suturing procedures:', this.suturingProcedures);
      },
      (error: any) => {
        this.suturingProcedures = [];
        console.error('Error loading suturing procedures:', error);
      }
    );
  }

  loadPatientEarIrrigation(patientID: number): void {
    this.medicalService.getPatientEarIrrigation(patientID).subscribe(
      (procedures: any[]) => {
        this.earIrrigationProcedures = procedures || [];
        console.log('Loaded ear irrigation procedures:', this.earIrrigationProcedures);
      },
      (error: any) => {
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
      const medicationID = Number(form.medicationID);
      if (isNaN(medicationID)) {
        this.isRequestingInjection = false;
        this.showSnackBar('Invalid medication selected.', 'Close', 5000, 'error-snackbar');
        return;
      }
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
        medicationID: medicationID, 
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
        (error: any) => {
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
        (response: any) => {
          this.isRequestingWoundCare = false;
          this.showSnackBar('Wound care procedure requested successfully!', 'Close', 3000, 'success-snackbar');
          this.woundCareForm.reset();
          this.initializeWoundCareForm();
          this.loadPatientWoundCare(patientID);
        },
        (error: any) => {
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
        (response: any) => {
          this.isRequestingSuturing = false;
          this.showSnackBar('Suturing procedure requested successfully!', 'Close', 3000, 'success-snackbar');
          this.suturingForm.reset();
          this.initializeSuturingForm();
          this.loadPatientSuturing(patientID);
        },
        (error: any) => {
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
        (response: any) => {
          this.isRequestingEarIrrigation = false;
          this.showSnackBar('Ear irrigation procedure requested successfully!', 'Close', 3000, 'success-snackbar');
          this.earIrrigationForm.reset();
          this.initializeEarIrrigationForm();
          this.loadPatientEarIrrigation(patientID);
        },
        (error: any) => {
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
  }
}