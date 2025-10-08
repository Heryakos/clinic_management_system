import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { environment } from 'src/environments/environment';
import { InventoryItem, InventoryRequest } from 'src/app/models/medical.model';
import { Medication, MedicationCategory, MedicationSelection } from '../medication-tree-dropdown/medication-tree-dropdown.component';
import { ReasonCategory, ReasonSelection } from '../reason-tree-dropdown/reason-tree-dropdown.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { StockSelectionDialogComponent } from '../stock-selection-dialog/stock-selection-dialog.component';
import { InventoryCategory, RoomCategory, ItemCategory, ItemSelection } from '../../models/inventory-enhanced.model';
import { PrescriptionPaperComponent } from '../prescription-paper/prescription-paper.component';

@Component({
  selector: 'app-pharmacy',
  templateUrl: './pharmacy.component.html',
  styleUrls: ['./pharmacy.component.css']
})
export class PharmacyComponent implements OnInit, OnDestroy {
  pharmacistFirstName: string | null = null;
  selectedPrescription: any = null;
  cardNumber: string = '';
  prescriptionForm!: FormGroup;
  addMedicationForm!: FormGroup;
  inventoryRequestForm!: FormGroup;
  prescriptions: any[] = [];
  medications: any[] = [];
  medicationTree: MedicationCategory[] = [];
  inventoryItems: InventoryItem[] = [];
  inventoryRequests: InventoryRequest[] = [];
  categorizedMedications: MedicationCategory[] = [];
  isSubmitting = false;
  isSubmittingInventory = false;
  pharmacistId: string | null = null;
  searchPatientID: string = '';
  isSearching: boolean = false;
  searchError: string = '';
  showFormAndTable: boolean = true;
  showInventoryRequest: boolean = false;
  prescriptionDetailsMap: { [prescriptionID: number]: any } = {};
  showPrescriptionDetailsDialog = false;
  selectedPrescriptionNumber: string | number = '';
  selectedPrescriptionDetails: any[] = [];
  showInventoryDetailsDialog: boolean = false;
  selectedInventoryRequestNumber: string = '';
  selectedInventoryRequestDetails: any[] = [];
  reasons: ReasonCategory[] = [];
  selectedDoctorUserName: string | null = null;
  employeeID: string | null = null;
  medicationDetailsWithStock: { medication: string; isInStock: boolean }[] = [];
  isActivePrescriptions: boolean = true;
  private queueRefreshSub?: Subscription;

  // Enhanced properties
  currentRoomId: string = 'd14cdfed-4011-4086-b9c6-3ac6da444ff8';
  currentRoomName: string = 'Pharmacy';
  pharmacistName: string = '';
  availableCategories: InventoryCategory[] = [];
  roomSpecificItems: ItemCategory[] = [];

  categories: string[] = [
    'Analgesics', 'Antibiotics', 'Antidiabetic', 'Antihypertensives', 'Proton Pump Inhibitor',
    'Antiplatelet', 'Antidepressants', 'Antipsychotics', 'Antifungals', 'Antivirals',
    'Steroids', 'Antacids & Antigastric', 'Vitamins & Supplements', 'Hormonal Treatments',
    'Immunosuppressants', 'Sedatives & Hypnotics', 'Diuretics', 'Local Anesthetics',
    'Muscle Relaxants', 'Bronchodilators', 'Cough and Cold Medications',
    'Antiemetics', 'Anticonvulsants', 'Antihistamines', 'Laxatives & Stool Softeners',
    'Anthelmintics', 'Antituberculars', 'Antimalarials', 'Antineoplastics', 'Statins',
    'Ophthalmic Agents', 'Topical Dermatologicals', 'Antispasmodics', 'Expectorants',
    'Biologics', 'Anticoagulants', 'Vaccines', 'Enzyme Replacement Therapies', 'Smoking Cessation'
  ];

  dosageForms: string[] = [
    'Tablet', 'Capsule', 'Vial', 'Injection', 'Inhaler', 'Syrup',
    'Drops', 'Cream', 'Ointment', 'Effervescent Tablet', 'Patch',
    'Prefilled Syringe', 'Suppository', 'Pessary', 'Suspension', 'Implant'
  ];

  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.initializePrescriptionForm();
    this.initializeAddMedicationForm();
    this.initializeInventoryForm();
    // this.loadMedications();
    // this.loadInventoryItems();
    // this.loadReasons();
    // this.loadRoomSpecificData();
    // this.loadMyRequests();
    this.loadPrescriptionQueue();
    this.queueRefreshSub = interval(30000).subscribe(() => this.loadPrescriptionQueue());
  }
  ngOnDestroy(): void {
    this.queueRefreshSub?.unsubscribe();
  }

  loadUserData(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.employeeID = employee.employee_Id ?? null;
          this.pharmacistId = employee.user_ID ?? null;
          this.pharmacistFirstName = employee.fName ?? null;
          this.pharmacistName = `${employee.fName} ${employee.lName}`;
          this.prescriptionForm.patchValue({ pharmacistName: this.pharmacistName });
          this.inventoryRequestForm.patchValue({ requestedBy: this.pharmacistName });
        }
      },
      error => {
        this.pharmacistId = null;
        alert(`Error loading user data: ${error.error?.message || error.message}`);
      }
    );
  }

  initializePrescriptionForm(): void {
    this.prescriptionForm = this.fb.group({
      patientID: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      patientName: [{ value: '', disabled: true }],
      cardNo: [{ value: '', disabled: true }],
      age: [{ value: '', disabled: true }],
      sex: [{ value: '', disabled: true }],
      diagnosis: ['', Validators.required],
      pharmacistName: [{ value: '', disabled: true }],
      medications: this.fb.array([this.createMedicationGroup()])
    });
  }

  initializeAddMedicationForm(): void {
    this.addMedicationForm = this.fb.group({
      medicationName: ['', Validators.required],
      genericName: ['', Validators.required],
      strength: ['', Validators.required],
      dosageForm: ['', Validators.required],
      manufacturer: ['', Validators.required],
      category: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  initializeInventoryForm(): void {
    this.inventoryRequestForm = this.fb.group({
      requestedFrom: ['', Validators.required],
      reasonForRequest: ['', Validators.required],
      requestedBy: [{ value: '', disabled: true }, Validators.required],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  createMedicationGroup(): FormGroup {
    return this.fb.group({
      medicationID: ['', Validators.required],
      dose: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      instructions: ['']
    });
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      itemID: ['', Validators.required],
      unit: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      jobOrderNo: ['']
    });
  }

  get medicationsFormArray(): FormArray {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  get itemsFormArray(): FormArray {
    return this.inventoryRequestForm.get('items') as FormArray;
  }

  addMedication(): void {
    this.medicationsFormArray.push(this.createMedicationGroup());
  }

  removeMedication(index: number): void {
    if (this.medicationsFormArray.length > 1) {
      this.medicationsFormArray.removeAt(index);
    }
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  loadMedications(): void {
    this.medicalService.getMedications().subscribe(
      (tree: MedicationCategory[]) => {
        this.medicationTree = tree;
        this.categorizedMedications = tree;
        this.medications = [];
        tree.forEach((cat: any) => {
          cat.dosageForms.forEach((form: any) => {
            form.medications.forEach((med: any) => {
              this.medications.push({
                ...med,
                dosageForm: form.form,
                category: cat.category
              });
            });
          });
        });
      },
      error => {
        this.medicationTree = [];
        this.categorizedMedications = [];
        this.medications = [];
        alert(`Error loading medications: ${error.error?.message || error.message}`);
      }
    );
  }

  loadInventoryItems(): void {
    this.medicalService.getInventoryItems().subscribe({
      next: (items) => {
        this.inventoryItems = items;
        console.log('inventoryitemsroot', this.inventoryItems);
        
      },
      error: (error) => {
        console.error('Error loading inventory items:', error);
        alert('Failed to load inventory items. Please try again.');
      }
    });
  }

  loadMyRequests(): void {
    if (this.pharmacistId) {
      this.medicalService.getRequestsByUser(this.pharmacistId).subscribe(
        (requests: InventoryRequest[]) => {
          this.inventoryRequests = requests.sort((a, b) =>
            new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
          );
        },
        error => {
          console.error('Error loading user requests:', error);
        }
      );
    }
  }
  loadReasons(): void {
    this.medicalService.getPharmacyRequestReasons().subscribe(
      (response: any) => {
        console.log('Raw reasons response:', response);
        
        // Handle different response formats
        let reasonsData = [];
        if (Array.isArray(response)) {
          reasonsData = response;
        } else if (response?.reasons) {
          reasonsData = response.reasons;
        } else if (response?.category && response?.reasons) {
          reasonsData = [response];
        }
  
        // Transform the response to match the expected interface
        this.reasons = reasonsData.map((category: any) => ({
          category: category.category || 'Uncategorized',
          reasons: (category.reasons || []).map((r: any) => ({
            reasonId: r.reasonID?.toString() || r.reasonId?.toString() || '',
            reasonName: r.reasonText || r.reasonName || r.reason || ''
          }))
        }));
  
        console.log('Mapped reasons:', this.reasons);
        console.log('First reason name:', this.reasons[0]?.reasons[0]?.reasonName); // Test the mapping
        this.cdr.detectChanges();
      },
      error => {
        console.error('Error loading reasons:', error);
        this.reasons = [];
        alert('Failed to load request reasons. Please try again.');
        this.cdr.detectChanges();
      }
    );
  }
  

  onReasonSelection(selection: ReasonSelection): void {
    this.inventoryRequestForm.patchValue({
      reasonForRequest: selection.reasonId
    });
  }

  onItemSelection(selection: ItemSelection, index: number): void {
    const itemFormGroup = this.itemsFormArray.at(index) as FormGroup;
    const itemId = typeof selection.itemId === 'number' ? selection.itemId.toString() : selection.itemId;
    itemFormGroup.patchValue({
      itemID: itemId,
      unit: selection.unit
    });
    this.checkStockAvailability(index);
  }

  getSelectedItemCategory(index: number): string {
    const itemID = parseInt(this.itemsFormArray.at(index).get('itemID')?.value);
    for (const category of this.roomSpecificItems) {
      const item = category.items.find(i => i.itemID === itemID);
      if (item) {
        return category.categoryName;
      }
    }
    return '';
  }
  
  getAvailableStock(index: number): string {
    const itemID = parseInt(this.itemsFormArray.at(index).get('itemID')?.value);
    for (const category of this.roomSpecificItems) {
      const item = category.items.find(i => i.itemID === itemID);
      if (item) {
        return `${item.currentStock} ${item.unit}`;
      }
    }
    return 'Select item';
  }
  
  getStockStatusClass(index: number): string {
    const itemID = parseInt(this.itemsFormArray.at(index).get('itemID')?.value);
    const requestedQty = this.itemsFormArray.at(index).get('quantity')?.value || 0;
    if (itemID && requestedQty > 0) {
      for (const category of this.roomSpecificItems) {
        const item = category.items.find(i => i.itemID === itemID);
        if (item) {
          if (item.currentStock >= requestedQty) {
            return 'stock-available';
          } else if (item.currentStock > 0) {
            return 'stock-partial';
          } else {
            return 'stock-unavailable';
          }
        }
      }
    }
    return 'stock-unknown';
  }
  
  

  checkStockAvailability(index: number): void {
    const itemID = this.itemsFormArray.at(index).get('itemID')?.value;
    const requestedQty = this.itemsFormArray.at(index).get('quantity')?.value || 0;
    if (itemID && requestedQty > 0) {
      for (const category of this.roomSpecificItems) {
        const item = category.items.find(i => i.itemID.toString() === itemID);
        if (item && item.currentStock < requestedQty) {
          console.log(`Warning: Requested quantity (${requestedQty}) exceeds available stock (${item.currentStock}) for ${item.itemName}`);
        }
      }
    }
  }

// In the loadRoomSpecificData method, update the mapping to convert between the interfaces
loadRoomSpecificData(): void {
  this.medicalService.getRoomCategories(this.currentRoomId).subscribe(
    (categories: RoomCategory[]) => {
      this.availableCategories = categories.map(rc => ({
        categoryID: rc.categoryID.toString(),
        categoryName: rc.roomName,
        description: '',
        isActive: true
      }));
      console.log('Mapped categories:', this.availableCategories); // Add this for debugging
    },
    error => {
      console.error('Error loading room categories:', error);
    }
  );

  this.medicalService.getInventoryItemsByRoom(this.currentRoomId).subscribe(
    (response: any) => {
      this.roomSpecificItems = response.map((category: any) => ({
        categoryID: category.categoryID?.toString() || '',
        categoryName: category.categoryName || '',
        description: category.description || '',
        isActive: category.isActive ?? true,
        items: (category.items || []).map((item: any) => ({
          itemID: item.itemID || 0,
          itemCode: item.itemCode || '',
          itemName: item.itemName || '',
          categoryID: item.categoryID || 0,
          categoryName: item.categoryName || '',
          unit: item.unit || '',
          currentStock: item.currentStock || 0,
          minimumStock: item.minimumStock || 0,
          maximumStock: item.maximumStock,
          unitPrice: item.unitPrice,
          expiryDate: item.expiryDate,
          manufacturer: item.manufacturer,
          batchNumber: item.batchNumber,
          isActive: item.isActive ?? true,
          createdDate: item.createdDate || new Date(),
          updatedDate: item.updatedDate || new Date(),
          maxQuantityAllowed: item.maxQuantityAllowed,
          stockStatus: item.stockStatus
        }))
      }));
      console.log('Mapped room items:', this.roomSpecificItems); // Add this for debugging
    },
    error => {
      console.error('Error loading room-specific items:', error);
      alert('Error loading available items. Please try again.');
    }
  );
}



  addNewMedication(selection: MedicationSelection): void {
    const newMedication = {
      medicationID: selection.medicationId,
      medicationName: selection.medicationName || 'Custom Medication',
      strength: '',
      dosageForm: 'Unknown',
      therapeuticClass: 'Custom'
    };
    this.medicalService.addMedication(newMedication).subscribe({
      next: (addedMedication) => {
        const customCategory = this.categorizedMedications.find(c => c.category === 'Custom') || {
          category: 'Custom',
          dosageForms: [{ form: 'Unknown', medications: [] }]
        };
        customCategory.dosageForms[0].medications.push(addedMedication);
        if (!this.categorizedMedications.includes(customCategory)) {
          this.categorizedMedications.push(customCategory);
        }
      },
      error: (error) => {
        console.error('Error adding new medication:', error);
        alert('Failed to add new medication. Please try again.');
      },
    });
  }

  onAddMedication(): void {
    if (this.addMedicationForm.valid) {
      const data = { ...this.addMedicationForm.value, isActive: 1 };
      this.medicalService.addMedication(data).subscribe(
        () => {
          alert('Medication added successfully!');
          this.addMedicationForm.reset();
          this.loadMedications();
        },
        error => {
          alert(`Error adding medication: ${error.error?.message || error.message}`);
        }
      );
    }
  }

  toggleStockStatus(index: number): void {
    this.medicationDetailsWithStock[index].isInStock = !this.medicationDetailsWithStock[index].isInStock;
    console.log('Updated stock status:', this.medicationDetailsWithStock);
  }

  extractMedicationNames(medicationDetails: string): string[] {
    if (!medicationDetails || typeof medicationDetails !== 'string') {
      console.warn('Invalid or empty MedicationName:', medicationDetails);
      return [];
    }
    const medications = medicationDetails
      .split(',')
      .map(detail => {
        const trimmed = detail.trim();
        if (!trimmed) return null;
        const parts = trimmed.split(' - ');
        const medicationName = parts[0]?.trim() || '';
        return medicationName;
      })
      .filter((name): name is string => !!name && name.length > 0);
    return [...new Set(medications)];
  }

  onSearch(): void {
    this.searchError = '';
    this.isSearching = true;
    this.showFormAndTable = false;
    this.medicationDetailsWithStock = [];
    this.prescriptionDetailsMap = {};
    this.isActivePrescriptions = false;
    this.loadMedications();
    const patientID = this.searchPatientID;
    if (!patientID) {
      this.searchError = 'Please enter a patient ID.';
      this.isSearching = false;
      return;
    }

    console.log('Searching for patient ID:', patientID);

    this.medicalService.getPatient(patientID).subscribe(
      (patient: any) => {
        console.log('Patient response:', patient);
        if (!patient || !patient.PatientID) {
          this.searchError = 'No patient found with this ID.';
          this.isSearching = false;
          return;
        }

        this.cardNumber = patient.CardNumber;
        this.prescriptionForm.patchValue({
          patientID: patient.PatientID,
          patientName: patient.firstName + ' ' + patient.lastName,
          cardNo: patient.CardNumber,
          age: patient.age,
          sex: patient.gender
        });

        this.medicalService.getPrescriptionsByCardNumber(patient.CardNumber).subscribe(
          (prescriptions: any[]) => {
            console.log('Prescriptions response from getPrescriptionsByCardNumber:', prescriptions);
            if (prescriptions && prescriptions.length > 0) {
              this.processPrescriptions(prescriptions);
            } else {
              console.log('No prescriptions found with getPrescriptionsByCardNumber, trying getPrescriptionspayrollID');
              this.medicalService.getPrescriptionspayrollID(patient.CardNumber).subscribe(
                (payrollPrescriptions: any[]) => {
                  console.log('Prescriptions response from getPrescriptionspayrollID:', payrollPrescriptions);
                  this.processPrescriptions(payrollPrescriptions || []);
                },
                error => {
                  console.error('Error loading prescriptions from getPrescriptionspayrollID:', error);
                  this.prescriptions = [];
                  this.searchError = 'Error loading prescriptions from payroll ID endpoint.';
                  this.isSearching = false;
                  this.showFormAndTable = true;
                }
              );
            }
          },
          error => {
            console.log('Error in getPrescriptionsByCardNumber, trying getPrescriptionspayrollID');
            this.medicalService.getPrescriptionspayrollID(patient.CardNumber).subscribe(
              (payrollPrescriptions: any[]) => {
                console.log('Prescriptions response from getPrescriptionspayrollID:', payrollPrescriptions);
                this.processPrescriptions(payrollPrescriptions || []);
              },
              error => {
                console.error('Error loading prescriptions from getPrescriptionspayrollID:', error);
                this.prescriptions = [];
                this.searchError = 'Error loading prescriptions from payroll ID endpoint.';
                this.isSearching = false;
                this.showFormAndTable = true;
              }
            );
          }
        );
      },
      error => {
        console.error('Error loading patient details:', error);
        this.searchError = 'Error loading patient details.';
        this.isSearching = false;
      }
    );
  }

  private processPrescriptions(prescriptions: any[]): void {
    // Filter out Dispensed prescriptions
    const filteredPrescriptions = prescriptions.filter(p => {
        const status = (p.Status || p.status || 'Unknown').toLowerCase();
        return status !== 'dispensed';
    });

    this.prescriptions = filteredPrescriptions.map((p, index) => {
        const rawId = (p.prescriptionID ?? p.PrescriptionID) as any;
        const numericId = typeof rawId === 'number' ? rawId : (rawId ? parseInt(rawId, 10) : NaN);
        return {
            ...p,
            // Use numeric ID when valid; otherwise fall back to a temp marker
            prescriptionID: Number.isInteger(numericId) && numericId > 0 ? numericId : `temp-${index}-${Date.now()}`
        };
    });

    console.log('Processed prescriptions (excluding Dispensed):', this.prescriptions);

    if (this.prescriptions.length > 0) {
        const detailPromises = this.prescriptions.map(prescription => {
            if (!prescription.prescriptionID || prescription.prescriptionID.startsWith('temp-')) {
                console.warn('Using temporary ID for prescription:', prescription);
                this.prescriptionDetailsMap[prescription.prescriptionID] = {
                    MedicationName: prescription.MedicationName || ''
                };
                return Promise.resolve(this.prescriptionDetailsMap[prescription.prescriptionID]);
            }

            return this.medicalService.getPrescriptionIDDetails(prescription.prescriptionID).toPromise()
                .then(details => {
                    console.log(`Details for prescription ${prescription.prescriptionID}:`, details);
                    this.prescriptionDetailsMap[prescription.prescriptionID] = details || null;
                    return details;
                })
                .catch(error => {
                    console.error(`Error loading details for prescription ${prescription.prescriptionID}:`, error);
                    this.prescriptionDetailsMap[prescription.prescriptionID] = null;
                    return null;
                });
        });

        Promise.all(detailPromises).then(() => {
            // Resolve missing IDs by matching PrescriptionNumber against the global list
            this.resolveMissingPrescriptionIds().then(() => {
            const allMedications: Set<string> = new Set();
            Object.values(this.prescriptionDetailsMap).forEach(details => {
                if (details && details.MedicationName) {
                    this.extractMedicationNames(details.MedicationName).forEach(name => allMedications.add(name));
                }
            });
            this.medicationDetailsWithStock = Array.from(allMedications).map(name => ({
                medication: name,
                isInStock: false
            }));
            console.log('Populated medicationDetailsWithStock with all unique medications:', this.medicationDetailsWithStock);

            this.showFormAndTable = true;
            this.isSearching = false;
            this.cdr.detectChanges(); // Force UI update
            });
        });
    } else {
        console.warn('No prescriptions found for card number:', this.cardNumber);
        this.showFormAndTable = true;
        this.isSearching = false;
        this.cdr.detectChanges();
    }
}

  private async resolveMissingPrescriptionIds(): Promise<void> {
    return new Promise<void>((resolve) => {
      const hasTemp = this.prescriptions.some(p => typeof p.prescriptionID !== 'number');
      if (!hasTemp) {
        resolve();
        return;
      }

      this.medicalService.getPrescriptions().subscribe({
        next: (all: any[]) => {
          const mapByNumber = new Map<string, number>();
          (all || []).forEach(x => {
            const id = (x.prescriptionID ?? x.PrescriptionID) as any;
            const numId = typeof id === 'number' ? id : (id ? parseInt(id, 10) : NaN);
            const number = x.prescriptionNumber || x.PrescriptionNumber;
            if (number && Number.isInteger(numId) && numId > 0) {
              mapByNumber.set(String(number), numId);
            }
          });

          this.prescriptions = this.prescriptions.map(p => {
            if (typeof p.prescriptionID === 'number' && p.prescriptionID > 0) {
              return p;
            }
            const number = p.prescriptionNumber || p.PrescriptionNumber;
            const found = number ? mapByNumber.get(String(number)) : undefined;
            if (found) {
              return { ...p, prescriptionID: found };
            }
            return p;
          });

          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadPatientDetails(): void {
    const patientID = this.prescriptionForm.get('patientID')?.value;
    if (patientID) {
      this.medicalService.getPatient(patientID).subscribe(
        (patient: any) => {
          this.prescriptionForm.patchValue({
            patientName: patient.firstName + ' ' + patient.lastName,
            cardNo: patient.CardNumber,
            age: patient.age,
            sex: patient.gender
          });
        },
        error => {
          this.prescriptionForm.patchValue({
            patientName: '',
            cardNo: '',
            age: '',
            sex: ''
          });
          alert(`Error loading patient details: ${error.error?.message || error.message}`);
        }
      );
    }
  }

  calculateTotalPrice(): number {
    return this.medicationsFormArray.controls.reduce((total, control) => {
      const quantity = control.get('quantity')?.value || 0;
      const unitPrice = control.get('unitPrice')?.value || 0;
      return total + (quantity * unitPrice);
    }, 0);
  }

  onSubmit(): void {
    if (this.prescriptionForm.valid) {
      this.isSubmitting = true;
      const patientID = parseInt(this.prescriptionForm.get('patientID')?.value, 10);
      const prescription = {
        prescriptionNumber: 'PR' + Date.now(),
        patientID: patientID,
        cardID: null,
        prescriberID: this.pharmacistId,
        notes: this.prescriptionForm.get('diagnosis')?.value,
        createdBy: this.pharmacistId,
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
            this.medicalService.dispensePrescription(prescriptionID, this.pharmacistId!).subscribe(
              () => {
                this.isSubmitting = false;
                this.prescriptionForm.reset();
                this.initializePrescriptionForm();
                alert('Prescription dispensed successfully!');
              },
              error => {
                this.isSubmitting = false;
                alert(`Error dispensing prescription: ${error.error?.message || error.message}`);
              }
            );
          }).catch(error => {
            this.isSubmitting = false;
            alert(`Error adding prescription details: ${error.message}`);
          });
        },
        error => {
          this.isSubmitting = false;
          alert(`Error creating prescription: ${error.error?.message || error.message}`);
        }
      );
    }
  }

  // onInventorySubmit(): void {
  //   if (this.inventoryRequestForm.valid) {
  //     this.isSubmittingInventory = true;
  //     const newRequest: InventoryRequest = {
  //       id: this.generateId(),
  //       requestNumber: this.generateRequestNo(),
  //       requestedFrom: this.inventoryRequestForm.value.requestedFrom,
  //       reasonForRequest: this.inventoryRequestForm.value.reasonForRequest,
  //       items: this.inventoryRequestForm.value.items.map((item: any) => ({
  //         ...item,
  //         itemID: item.itemID
  //       })),
  //       requestedBy: this.pharmacistId || '',
  //       requestDate: new Date(),
  //       status: 'pending'
  //     };

  //     this.medicalService.createInventoryRequest(newRequest).subscribe({
  //       next: () => {
  //         this.isSubmittingInventory = false;
  //         this.inventoryRequestForm.reset();
  //         this.initializeInventoryForm();
  //         this.loadMyRequests();
  //         alert('Inventory request submitted successfully!');
  //         if (this.pharmacistName) {
  //           this.inventoryRequestForm.patchValue({ requestedBy: this.pharmacistName });
  //         }
  //       },
  //       error: (error) => {
  //         this.isSubmittingInventory = false;
  //         console.error('Error submitting request:', error);
  //         alert('Error submitting request. Please try again.');
  //       }
  //     });
  //   }
  // }

  toggleInventoryRequest(): void {
    this.showInventoryRequest = !this.showInventoryRequest;
    if (this.showInventoryRequest) {
      this.loadRoomSpecificData();
      this.loadReasons();
      this.loadMyRequests();
      this.loadInventoryItems();
    }
    this.cdr.detectChanges();
  }

  viewInventoryRequestDetails(requestId: string): void {
    this.selectedInventoryRequestNumber = '';
    this.selectedInventoryRequestDetails = [];
    const request = this.inventoryRequests.find(r => r.id === requestId);
    if (request) {
      this.selectedInventoryRequestNumber = request.requestNumber;
      this.selectedInventoryRequestDetails = request.items.map((item: any) => ({
        ...item,
        itemName: this.roomSpecificItems
          .flatMap(category => category.items)
          .find(i => i.itemID.toString() === item.itemID)?.itemName || item.itemID
      }));
      this.showInventoryDetailsDialog = true;
    }
  }

  closeInventoryDetailsDialog(): void {
    this.showInventoryDetailsDialog = false;
    this.selectedInventoryRequestNumber = '';
    this.selectedInventoryRequestDetails = [];
  }

  updateRequestStatus(id: string, status: string): void {
    const request = this.inventoryRequests.find(r => r.id === id);
    if (request && this.pharmacistId) {
      this.medicalService.updateRequestStatus(
        parseInt(id),
        status,
        this.pharmacistId,
        `Status updated to ${status}`
      ).subscribe(
        () => {
          request.status = status as 'pending' | 'approved' | 'issued';
          this.loadMyRequests();
          alert(`Request ${status} successfully!`);
        },
        error => {
          console.error(`Error updating request status to ${status}:`, error);
          alert(`Error updating request status. Please try again.`);
        }
      );
    }
  }

  viewPrescriptionDetails(prescriptionID: number | string, event: Event): void {
    event.stopPropagation(); // Prevent the row click event from firing
    console.log('viewPrescriptionDetails called for prescriptionID:', prescriptionID);
    if (!prescriptionID) {
      console.error('Invalid prescriptionID:', prescriptionID);
      alert('Invalid prescription ID. Please try again.');
      return;
    }
  
    const prescription = this.prescriptions.find(p => p.prescriptionID === prescriptionID);
    if (!prescription) {
      console.error('Prescription not found for ID:', prescriptionID);
      alert('Prescription not found.');
      return;
    }
  
    console.log('Found prescription:', prescription);
    let details = this.prescriptionDetailsMap[Number(prescriptionID)];
    console.log('Prescription details from map:', details);
  
    if (!details && prescription.MedicationName) {
      details = { MedicationName: prescription.MedicationName };
      console.log('Using MedicationName from prescription:', details);
    }
  
    if (details && details.MedicationName) {
      const inStockMedications: string[] = [];
      const outOfStockMedications: string[] = [];
      const medicationEntries = details.MedicationName.split(',').map((entry: string) => entry.trim());
      console.log('medicationEntries:', medicationEntries, this.medicationDetailsWithStock);
  
      medicationEntries.forEach((medicationEntry: string) => {
        if (!medicationEntry) return;
        const medicationName = medicationEntry.split(' - ')[0]?.trim() || '';
        const stockItem = this.medicationDetailsWithStock.find(item => item.medication === medicationName);
        if (stockItem && stockItem.isInStock) {
          inStockMedications.push(medicationEntry);
        } else {
          outOfStockMedications.push(medicationEntry);
        }
      });
  
      console.log('In stock medications:', inStockMedications);
      console.log('Out of stock medications:', outOfStockMedications);
  
      this.dialog.open(StockSelectionDialogComponent, {
        width: '500px',
        data: {
          cardNumber: this.cardNumber,
          prescription,
          inStockMedications,
          outOfStockMedications
        }
      });
    } else {
      console.warn('No MedicationName or empty details for prescriptionID:', prescriptionID);
      this.dialog.open(StockSelectionDialogComponent, {
        width: '500px',
        data: {
          cardNumber: this.cardNumber,
          prescription,
          inStockMedications: [],
          outOfStockMedications: []
        }
      });
    }
  }

  closePrescriptionDetailsDialog(): void {
    this.showPrescriptionDetailsDialog = false;
    this.selectedPrescription = null;
  }

  // private loadPrescriptionQueue(): void {
  //   this.medicalService.getPrescriptions().subscribe(
  //     (prescriptions: any[]) => {
  //       const all = prescriptions || [];
  //       const nonDispensed = all.filter(p => {
  //         const s = (p.Status || p.status || '').toString();
  //         return s === '' || s === 'Active' || s === 'Pending' || s === 'Ordered';
  //       });
  //       this.prescriptions = nonDispensed.length > 0 ? nonDispensed : all;
  //       // Sort newest first
  //       this.prescriptions.sort((a, b) => new Date(b.PrescriptionDate || b.prescriptionDate || 0).getTime() - new Date(a.PrescriptionDate || a.prescriptionDate || 0).getTime());
  //     },
  //     () => {
  //       this.prescriptions = [];
  //     }
  //   );
  // }
  private loadPrescriptionQueue(): void {
    if (!this.isActivePrescriptions) {
        return; // Skip refresh when in patient-specific mode
    }
    
    this.medicationDetailsWithStock = []; // Reset only in active mode
    this.prescriptionDetailsMap = {}; // Reset only in active mode

    this.medicalService.getPrescriptions().subscribe({
        next: (prescriptions: any[]) => {
            const all = prescriptions || [];
            const nonDispensed = all
                .filter(p => {
                    const s = (p.status || p.Status || '').toString().toLowerCase();
                    return s !== 'dispensed' && (s === '' || s === 'active' || s === 'pending' || s === 'ordered');
                })
                .map(p => {
                    const rawId = (p.prescriptionID ?? p.PrescriptionID) as any;
                    const numericId = typeof rawId === 'number' ? rawId : (rawId ? parseInt(rawId, 10) : NaN);
                    return {
                        ...p,
                        CardNumber: p.CardNumber || p.cardNumber || 'N/A',
                        FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
                        PrescriptionDate: p.prescriptionDate || p.PrescriptionDate,
                        Status: p.status || p.Status || 'Unknown',
                        PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
                        PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
                        prescriptionID: Number.isInteger(numericId) && numericId > 0 ? numericId : `temp-${Date.now()}`,
                        UserName: p.UserName
                    };
                });

            this.prescriptions = nonDispensed.length > 0 ? nonDispensed : [];
            console.log('Final prescriptions array (excluding Dispensed):', this.prescriptions);

            this.prescriptions.sort((a, b) =>
                new Date(b.PrescriptionDate || 0).getTime() - new Date(a.PrescriptionDate || 0).getTime()
            );

            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('Error in getPrescriptions:', error);
            this.prescriptions = [];
            this.cdr.detectChanges();
        },
        complete: () => {
            console.log('getPrescriptionQueue completed');
        }
    });
}
  // private loadPrescriptionQueue(): void {
  //   this.isActivePrescriptions = true; // Set flag for Active Prescriptions
  //   this.medicationDetailsWithStock = []; // Reset stock status
  //   this.prescriptionDetailsMap = {}; // Reset details map
  //   // console.log('Starting loadPrescriptionQueue');
  //   // debugger;
  
  //   this.medicalService.getPrescriptions().subscribe({
  //     next: (prescriptions: any[]) => {
  //       // console.log('Received prescriptions:', prescriptions);
  //       // debugger;
  // // 
  //       const all = prescriptions || [];
  //       const nonDispensed = all
  //         .filter(p => {
  //           const s = (p.status || p.Status || '').toString().toLowerCase();
  //           console.log('Filtering prescription:', p, 'Status:', s);
  //           // return s === '' || s === 'active' || s === 'pending' || s === 'ordered';
  //           return s !== 'dispensed' && (s === '' || s === 'active' || s === 'pending' || s === 'ordered');
  //         })
  //         .map(p => ({
  //           ...p,
  //           CardNumber: p.CardNumber || p.cardNumber || 'N/A',
  //           FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
  //           PrescriptionDate: p.prescriptionDate || p.PrescriptionDate,
  //           Status: p.status || p.Status || 'Unknown', // Map to PascalCase
  //           PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
  //           PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
  //           prescriptionID: p.prescriptionID || p.PrescriptionID || `temp-${Date.now()}`,
  //           UserName: p.UserName
  //         }));
  
  //       console.log('Non-dispensed prescriptions:', nonDispensed);
  //       // debugger;
  
  //       this.prescriptions = nonDispensed.length > 0 ? nonDispensed : all.map(p => ({
  //         ...p,
  //         CardNumber: p.CardNumber || p.cardNumber || 'N/A',
  //         FullName: p.patientName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
  //         PrescriptionDate: p.prescriptionDate || p.PrescriptionDate,
  //         Status: p.status || p.Status || 'Unknown',
  //         PrescriberName: p.prescriberName || p.PrescriberName || 'N/A',
  //         PharmacistName: p.pharmacistName || p.PharmacistName || 'N/A',
  //         prescriptionID: p.prescriptionID || p.PrescriptionID || `temp-${Date.now()}`,
  //         UserName: p.UserName
  //       }));
  
  //       console.log('Final prescriptions array:', this.prescriptions);
  //       this.prescriptions.sort((a, b) =>
  //         new Date(b.PrescriptionDate || 0).getTime() - new Date(a.PrescriptionDate || 0).getTime()
  //       );
  
  //       this.cdr.detectChanges(); // Ensure UI updates
  //       // console.log('Change detection triggered');
  //     },
  //     error: (error) => {
  //       console.error('Error in getPrescriptions:', error);
  //       // debugger;
  //       this.prescriptions = [];
  //       this.cdr.detectChanges();
  //       console.log('Error handler: prescriptions cleared');
  //     },
  //     complete: () => {
  //       console.log('getPrescriptionQueue subscription completed');
  //     }
  //   });
  // }
  dispensePrescription(prescriptionID: number, event: Event): void {
    event.stopPropagation(); // Prevent the row click event from firing
    // Guard: ensure we have a valid numeric prescription ID
    if (typeof prescriptionID !== 'number' || !Number.isInteger(prescriptionID) || prescriptionID <= 0) {
      alert('Invalid prescription ID. Please refresh and try again.');
      return;
    }

    if (this.pharmacistId) {
      this.medicalService.dispensePrescription(prescriptionID, this.pharmacistId).subscribe(
        () => {
          alert('Prescription dispensed successfully!');
          this.loadPrescriptionQueue();
        },
        error => {
          console.error('Dispense error:', error);
          alert(`Error dispensing prescription: ${error.error?.message || error.message}`);
        }
      );
    } else {
      alert('Pharmacist ID not found.');
    }
  }

  openNotificationDialog(): void {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { employeeID: this.employeeID, selectedDoctorUserName: this.selectedDoctorUserName }
    });

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

  private generateId(): string {
    return 'INV' + Date.now().toString();
  }

  private generateRequestNo(): string {
    return 'STK' + Date.now().toString().slice(-6);
  }

  onPrescriptionRowClick(prescription: any): void {
    this.searchPatientID = prescription.CardNumber;
    this.onSearch();
  }

  getValidPrescriptionId(prescription: any): number | null {
    const rawId = prescription?.prescriptionID ?? prescription?.PrescriptionID;
    const numericId = typeof rawId === 'number' ? rawId : (rawId ? parseInt(rawId, 10) : NaN);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  }

  onDispenseClick(prescription: any, event: Event): void {
    event.stopPropagation();
    const id = this.getValidPrescriptionId(prescription);
    if (!id) {
      // Resolve on-demand via global list by matching PrescriptionNumber and CardNumber
      const number = prescription?.prescriptionNumber || prescription?.PrescriptionNumber;
      const card = prescription?.CardNumber || prescription?.cardNumber;
      const dateValue = prescription?.PrescriptionDate || prescription?.prescriptionDate;
      // Proceed with resolver even if number is missing, using fallback
      this.resolvePrescriptionIdForRow(number || '', card || '', (resolvedId) => {
        if (!resolvedId) {
          alert('Could not resolve prescription ID. Please refresh and try again.');
          return;
        }
        this.dispensePrescription(resolvedId, event);
      }, dateValue);
      return;
    }
    this.dispensePrescription(id, event);
  }

  private resolvePrescriptionIdForRow(prescriptionNumber: string, cardNumber: string, cb: (id: number | null) => void, prescriptionDate?: any): void {
    this.medicalService.getPrescriptions().subscribe({
      next: (all: any[]) => {
        const match = (all || []).find(p => {
          const pn = p.prescriptionNumber || p.PrescriptionNumber;
          const cn = p.CardNumber || p.cardNumber;
          if (prescriptionNumber && cardNumber) {
            return String(pn) === String(prescriptionNumber) && String(cn) === String(cardNumber);
          }
          if (cardNumber && prescriptionDate) {
            const pd = p.prescriptionDate || p.PrescriptionDate;
            const inputDate = new Date(prescriptionDate);
            const rowDate = pd ? new Date(pd) : null;
            const sameDay = rowDate && inputDate && inputDate.toDateString() === rowDate.toDateString();
            return String(cn) === String(cardNumber) && !!sameDay;
          }
          return false;
        });
        if (!match) {
          cb(null);
          return;
        }
        const rawId = (match.prescriptionID ?? match.PrescriptionID) as any;
        const numericId = typeof rawId === 'number' ? rawId : (rawId ? parseInt(rawId, 10) : NaN);
        cb(Number.isInteger(numericId) && numericId > 0 ? numericId : null);
      },
      error: () => cb(null)
    });
  }
}