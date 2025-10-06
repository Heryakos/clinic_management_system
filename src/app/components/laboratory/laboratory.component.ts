import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MedicalService } from 'src/app/medical.service';
import { LaboratoryTest } from 'src/app/models/medical.model';
import { environment } from 'src/environments/environment';
import { testCategories } from 'src/app/models/laboratory-test-categories';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-laboratory',
  templateUrl: './laboratory.component.html',
  styleUrls: ['./laboratory.component.css']
})
export class LaboratoryComponent implements OnInit {
  availableTestCategories: string[] = ['Chemistry', 'Bacteriology', 'Fluid_Analysis', 'Hematology', 'Serology'];
  selectedTestData: any = null;
  laboratoryForm!: FormGroup;
  laboratoryTests: LaboratoryTest[] = [];
  isSubmitting = false;
  createdBy: string | null = null;
  allCardSearchResults: any[] = []; // Store all results from card search
  fetchedTestDetails: { [key: string]: any[] } = {}; // Map testID to test details
  cardNumberSearch: string = '';
  cardSearchResult: any = null;
  cardSearchError: string = '';
  isCardSearching: boolean = false;
  reportedByName: string = '';
  reportedByUserId: string = '';
  physicianName: string = '';
  filteredLaboratoryTests: LaboratoryTest[] = [];
  // fetchedTestDetails: any[] = [];
  selectedTestDetails: any[] = [];
  showTestDetailsDialog: boolean = false;
  selectedTestNumber: string = '';
  employeeID: string | null = null;
  selectedDoctorUserName: string | null = null;
  isActiveTests: boolean = true;
  reportedById: string = ''; 
  constructor(
    private fb: FormBuilder,
    private medicalService: MedicalService,
    private dialog: MatDialog

  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadReportedBy();
    this.patchUnitsForTests();
    this.loadPendingQueue();
  }

  loadReportedBy(): void {
    this.medicalService.getEmployeeById(environment.username).subscribe(
      (response: any) => {
        console.log('deraresponse', response);
        
        const employee = response?.c_Employees?.[0];
        if (employee) {
          this.employeeID = employee.employee_Id ?? null;
          this.createdBy = employee.user_ID ?? null; // Use user_ID for operations
          this.reportedById = employee.user_ID ?? ''; // Store the ID for updates
          this.reportedByName = employee.en_name ?? ''; // Use en_name for display
          this.physicianName = employee.en_name ?? ''; // Use en_name for display
        }
        console.log('logofring', this.createdBy, this.reportedById, this.reportedByName, this.physicianName);
      },
      
      error => {
        this.createdBy = null;
        this.reportedById = '';
        this.reportedByName = '';
        this.physicianName = '';
      }
    );
  }
  

  // searchByCardNumber(): void {
  //   this.cardSearchError = '';
  //   this.cardSearchResult = null;
  //   this.filteredLaboratoryTests = [];
  //   this.fetchedTestDetails = [];
  //   if (!this.cardNumberSearch) {
  //     this.cardSearchError = 'Please enter a card number.';
  //     return;
  //   }
  //   this.isCardSearching = true;
  //   this.medicalService.getPatientLaboratoryTestscardNumber(Number(this.cardNumberSearch)).subscribe(
  //     (result: any) => {
  //       if (result && Array.isArray(result) && result.length > 0) {
  //         this.cardSearchResult = result[0];
  //         this.availableTestCategories = [...new Set(result.map((r: any) => r.testCategory))];
  //         if (this.cardSearchResult && this.cardSearchResult.testID) {
  //           this.medicalService.getLaboratoryTestDetails(this.cardSearchResult.testID).subscribe(
  //             (details: any[]) => {
  //               this.fetchedTestDetails = details || [];
  //               this.patchFormWithCardResult();
  //               this.patchUnitsForTests();
  //             },
  //             error => {
  //               this.fetchedTestDetails = [];
  //               this.patchFormWithCardResult();
  //               this.patchUnitsForTests();
  //             }
  //           );
  //         } else {
  //           this.patchFormWithCardResult();
  //           this.patchUnitsForTests();
  //         }
  //       } else {
  //         this.cardSearchError = 'No laboratory test found for this card number.';
  //       }
  //       this.isCardSearching = false;
  //     },
  //     (error: any) => {
  //       this.isCardSearching = false;
  //       this.cardSearchError = 'Error searching for card number.';
  //     }
  //   );
  //   this.medicalService.getLaboratoryTests(Number(this.cardNumberSearch)).subscribe(
  //     (tests: LaboratoryTest[]) => {
  //       this.filteredLaboratoryTests = tests || [];
  //     },
  //     error => {
  //       this.filteredLaboratoryTests = [];
  //     }
  //   );
  // }
  searchByCardNumber(): void {
    this.cardSearchError = '';
    this.cardSearchResult = null;
    this.allCardSearchResults = [];
    this.fetchedTestDetails = {};
    this.filteredLaboratoryTests = [];
    this.isActiveTests = false;
    
    if (!this.cardNumberSearch) {
      this.cardSearchError = 'Please enter a card number.';
      return;
    }
    
    this.isCardSearching = true;
    
    // Get patient laboratory tests by card number
    this.medicalService.getPatientLaboratoryTestscardNumber(this.cardNumberSearch).subscribe(
      (result: any) => {
        if (result && Array.isArray(result) && result.length > 0) {
          this.allCardSearchResults = result;
          this.cardSearchResult = result[0]; // Default to first result
          this.availableTestCategories = [...new Set(result.map((r: any) => r.testCategory))];
          
          // Fetch test details for all testIDs
          const detailPromises = result
            .filter((r: any) => r.testID)
            .map((r: any) =>
              this.medicalService.getLaboratoryTestDetails(r.testID).toPromise()
                .then((details: any[]) => {
                  this.fetchedTestDetails[r.testID] = details || [];
                })
                .catch(() => {
                  this.fetchedTestDetails[r.testID] = [];
                })
            );
          
          Promise.all(detailPromises).then(() => {
            this.patchFormWithCardResult();
            this.patchUnitsForTests();
            this.isCardSearching = false;
          }).catch(() => {
            this.patchFormWithCardResult();
            this.patchUnitsForTests();
            this.isCardSearching = false;
          });
        } else {
          this.cardSearchError = 'No laboratory test found for this card number.';
          this.isCardSearching = false;
        }
      },
      (error: any) => {
        this.isCardSearching = false;
        this.cardSearchError = 'Error searching for card number.';
      }
    );
    
    // Get all laboratory tests for the patient
    this.medicalService.getLaboratoryTests(this.cardNumberSearch).subscribe(
      (tests: LaboratoryTest[]) => {
        this.filteredLaboratoryTests = tests || [];
      },
      error => {
        this.filteredLaboratoryTests = [];
      }
    );
  }
  
  patchFormWithCardResult(): void {
    if (!this.cardSearchResult) return;
    this.laboratoryForm.patchValue({
      patientID: this.cardSearchResult.patientID || '',
      physician: this.physicianName || '', // Display name
      testType: this.cardSearchResult.testCategory || '',
      reportedBy: this.reportedByName || '' // Display name
    });
    
    this.selectedTestData = this.cardSearchResult;
    this.onTestTypeChange();
  }
  

  initializeForm(): void {
    this.laboratoryForm = this.fb.group({
      patientID: ['', Validators.required],
      physician: [{value: '', disabled: true}, Validators.required],
      testType: ['Chemistry', Validators.required],
      tests: this.fb.array([]),
      reportedBy: [{value: '', disabled: true}, Validators.required] // This will display the name
    });
    this.onTestTypeChange();
  }
  

  patchUnitsForTests(): void {
    const testType = this.laboratoryForm.get('testType')?.value;
    const testsArray = this.testsFormArray;
    const catTests = testCategories[testType as keyof typeof testCategories] || [];
    for (let i = 0; i < testsArray.length; i++) {
      const testGroup = testsArray.at(i);
      const testName = testGroup.get('name')?.value;
      const found = catTests.find(t => t.name === testName);
      if (found) {
        testGroup.get('unit')?.setValue(found.unit);
      }
    }
  }

  get testsFormArray(): FormArray {
    return this.laboratoryForm.get('tests') as FormArray;
  }

  // onTestTypeChange(): void {
  //   let testType = this.laboratoryForm.get('testType')?.value;
  //   if (this.cardSearchResult && this.cardSearchResult.testCategory) {
  //     testType = this.cardSearchResult.testCategory;
  //     console.log('wedont', testType);
      
  //     // this.laboratoryForm.get('testType')?.setValue(testType, { emitEvent: false });
  //   }
  //   // this.medicalService.getLaboratoryTestDetails(this.cardSearchResult.testID).subscribe(
  //   //   (details: any[]) => {
  //   //     console.log('iknow', details);
  //   //     this.fetchedTestDetails = details || [];
  //   //     this.patchFormWithCardResult();
  //   //     this.patchUnitsForTests();
  //   //   },
  //   //   error => {
  //   //     this.fetchedTestDetails = [];
  //   //     this.patchFormWithCardResult();
  //   //     this.patchUnitsForTests();
  //   //   }
  //   // );
  //   const testsArray = this.testsFormArray;
    
  //   while (testsArray.length !== 0) {
  //     testsArray.removeAt(0);
  //   }

  //   if (this.fetchedTestDetails && this.fetchedTestDetails.length > 0) {
  //     console.log('uandi', this.fetchedTestDetails);
      
  //     this.fetchedTestDetails
  //       .filter(detail => detail && this.cardSearchResult && this.cardSearchResult.testCategory && testType && this.cardSearchResult.testCategory === testType)
  //       .forEach(detail => {
  //         console.log('wecanbe', detail);
          
  //         let unit = '';
  //         const catTests = testCategories[testType as keyof typeof testCategories] || [];
  //         const found = catTests.find(t => t.name === detail.testName);
  //         if (found) unit = found.unit;
  //         const resultValue = detail.result || '';
  //         const normalRangeValue = detail.normalRange || '';
  //         const isAbnormalCalc = this.checkIfAbnormal(resultValue, normalRangeValue);
          
  //         const testGroup = this.fb.group({
  //           name: [detail.testName, Validators.required],
  //           result: [resultValue, Validators.required],
  //           normalRange: [normalRangeValue],
  //           unit: [unit],
  //           isAbnormal: [{ value: isAbnormalCalc, disabled: true }],
  //           comments: [detail.comments || '']
  //         });
  //         console.log('itold',testGroup, detail.testName);
          
  //         testGroup.get('result')?.valueChanges.subscribe(val => {
  //           const updatedAbnormal = this.checkIfAbnormal(val, testGroup.get('normalRange')?.value);
  //           testGroup.get('isAbnormal')?.setValue(updatedAbnormal, { emitEvent: false });
  //         });
          
  //         testsArray.push(testGroup);
  //       });
  //   } else {
  //     const tests = testCategories[testType as keyof typeof testCategories] || [];
  //     tests.forEach(test => {
  //       const testGroup = this.fb.group({
  //         name: [test.name, Validators.required],
  //         result: ['', Validators.required],
  //         normalRange: [test.normalRange],
  //         unit: [test.unit],
  //         isAbnormal: [{ value: false, disabled: true }],
  //         comments: ['']
  //       });
      
  //       testGroup.get('result')?.valueChanges.subscribe(val => {
  //         const isAbnormal = this.checkIfAbnormal(val || '', test.normalRange || '');
  //         testGroup.get('isAbnormal')?.setValue(isAbnormal, { emitEvent: false });
  //       });
      
  //       testsArray.push(testGroup);
  //     });
  //   }
  //   this.patchUnitsForTests();
  // }
  onTestTypeChange(): void {
    const testType = this.laboratoryForm.get('testType')?.value;
    const testsArray = this.testsFormArray;
  
    // Clear existing tests in the FormArray
    while (testsArray.length !== 0) {
      testsArray.removeAt(0);
    }
  
    // Find the search result matching the selected testType
    const matchingResult = this.allCardSearchResults.find(r => r.testCategory === testType);
    
    if (matchingResult && this.fetchedTestDetails[matchingResult.testID]) {
      this.cardSearchResult = matchingResult; // Update cardSearchResult to the matching test
      const details = this.fetchedTestDetails[matchingResult.testID] || [];
      details.forEach(detail => {
        if (detail && detail.testName) {
          const catTests = testCategories[testType as keyof typeof testCategories] || [];
          const foundTest = catTests.find(t => t.name === detail.testName);
          const unit = foundTest ? foundTest.unit : detail.unit || '';
          const normalRange = foundTest ? foundTest.normalRange : detail.normalRange || '';
          const resultValue = detail.result || '';
          const isAbnormalCalc = this.checkIfAbnormal(resultValue, normalRange);
  
          const testGroup = this.fb.group({
            name: [detail.testName, Validators.required],
            result: [resultValue, Validators.required],
            normalRange: [normalRange],
            unit: [unit],
            isAbnormal: [{ value: isAbnormalCalc, disabled: true }],
            comments: [detail.comments || '']
          });
  
          testGroup.get('result')?.valueChanges.subscribe(val => {
            const updatedAbnormal = this.checkIfAbnormal(val, testGroup.get('normalRange')?.value);
            testGroup.get('isAbnormal')?.setValue(updatedAbnormal, { emitEvent: false });
          });
  
          testsArray.push(testGroup);
        }
      });
    }
  
    // If no matching result, leave testsFormArray empty
    this.patchUnitsForTests();
  }
  
  // viewTestDetails(testID: string | number): void {
  //   if (!testID) {
  //     alert('Invalid test ID.');
  //     return;
  //   }
  //   this.medicalService.getLaboratoryTestDetails(Number(testID)).subscribe(
  //     (details: any[]) => {
  //       this.selectedTestDetails = details || [];
  //       this.selectedTestNumber = testID.toString();
  //       this.showTestDetailsDialog = true;
  //     },
  //     error => {
  //       this.selectedTestDetails = [];
  //       this.selectedTestNumber = '';
  //       this.showTestDetailsDialog = false;
  //       alert('Could not load test details.');
  //     }
  //   );
  // }
  viewTestDetails(testID: string | number): void {
    if (!testID) {
      alert('Invalid test ID.');
      return;
    }
    this.medicalService.getLaboratoryTestDetails(Number(testID)).subscribe(
      (details: any[]) => {
        this.selectedTestDetails = details || [];
        this.selectedTestNumber = testID.toString();
        this.showTestDetailsDialog = true;
      },
      error => {
        this.selectedTestDetails = [];
        this.selectedTestNumber = '';
        this.showTestDetailsDialog = false;
        alert('Could not load test details.');
      }
    );
  }
  closeTestDetailsDialog(): void {
    this.showTestDetailsDialog = false;
    this.selectedTestDetails = [];
    this.selectedTestNumber = '';
    this.selectedTestData = null;
  }

  checkIfAbnormal(result: string, normalRange: string): boolean {
    if (!result || !normalRange) return false;
  
    const parsedResult = parseFloat(result);
    if (isNaN(parsedResult)) return false;
  
    const match = normalRange.match(/(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/);
    if (!match) return false;
  
    const min = parseFloat(match[1]);
    const max = parseFloat(match[3]);
  
    return parsedResult < min || parsedResult > max;
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
  onSubmit(): void {
    if (!this.cardSearchResult) return;
    if (this.laboratoryForm.valid) {
      this.isSubmitting = true;
  
      const rawForm = this.laboratoryForm.getRawValue();
      const testType = rawForm.testType;
      const testsWithUnits = rawForm.tests.map((test: any) => {
        let unit = test.unit;
        if (!unit) {
          const catTests = testCategories[testType as keyof typeof testCategories] || [];
          const found = catTests.find(t => t.name === test.name);
          if (found) unit = found.unit;
        }
        return { ...test, unit };
      });
  
      // Get the test ID from the card search result
      const testID = this.cardSearchResult.testID;
  
      if (!testID) {
        this.isSubmitting = false;
        alert('Invalid test ID. Cannot update test details.');
        return;
      }
  
      // Update each test detail
      const updatePromises = testsWithUnits.map((test: any) => {
        const detailData = {
          testName: test.name,
          result: test.result,
          normalRange: test.normalRange || null,
          unit: test.unit || null,
          isAbnormal: test.isAbnormal,
          comments: test.comments || null
        };
        
        return this.medicalService.updateLaboratoryTestDetails(testID, detailData).toPromise();
      });
  
      Promise.all(updatePromises).then(() => {
        this.isSubmitting = false;
        
        // Mark the test as completed and refresh queue - use reportedById instead of reportedByName
        this.medicalService.updateLaboratoryTestStatus(testID, 'Completed', this.reportedById).subscribe({
          next: () => {
            this.loadPendingQueue();
            alert('Laboratory test details updated successfully!');
          },
          error: () => {
            this.loadPendingQueue();
            alert('Laboratory test details updated, but there was an error updating the status.');
          }
        });
      }).catch(error => {
        this.isSubmitting = false;
        alert(`Error updating test details: ${error.message || error.error?.message || 'Unknown error'}`);
      });
    }
  }
  
  

  // private loadPendingQueue(): void {
  //   // Load all lab tests (optionally filtered by status if API returns it)
  //   this.medicalService.getLaboratoryTests().subscribe(
  //     (tests: any[]) => {
  //       // Keep only non-completed tasks if Status exists
  //       const pending = Array.isArray(tests) ? tests.filter(t => !t.status || t.status === 'Ordered' || t.status === 'Sample_Collected' || t.status === 'In_Progress') : [];
  //       this.filteredLaboratoryTests = pending;
  //     },
  //     () => {
  //       this.filteredLaboratoryTests = [];
  //     }
  //   );
  // }
  private loadPendingQueue(): void {
    this.isActiveTests = true;
    this.fetchedTestDetails = {};
    this.cardSearchResult = null;
    this.filteredLaboratoryTests = [];
  
    this.medicalService.getLaboratoryTests().subscribe(
      (tests: any[]) => {
        console.log('getLaboratoryTests response:', tests);
        const pending = Array.isArray(tests)
          ? tests
              .filter(t => !t.status || ['Ordered', 'Sample_Collected', 'In_Progress'].includes(t.status))
              .map(t => ({
                testID: t.testID,
                testNumber: t.testNumber,
                patientId: t.patientID || t.patientId, // Map to patientId as required by interface
                patientName: t.patientName || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unknown',
                testCategory: t.testCategory,
                testDate: t.testDate,
                orderingPhysicianName: t.orderingPhysicianName,
                technicianName: t.technicianName || null, // Add this required property
                reportedBy: t.reportedByName || t.reportedBy,
                cardNumber: t.cardNumber,
                status: t.status,
                priority: t.priority,
                tests: t.tests || [], // Add this required property
                reportDate: t.resultDate || t.reportDate || null, // Map to reportDate as required by interface
                age: t.age,
                gender: t.gender,
                sampleCollectionDate: t.sampleCollectionDate,
                resultDate: t.resultDate,
                testCount: t.testCount || 0,
                abnormalCount: t.abnormalCount || 0
              }) as LaboratoryTest) // Cast to LaboratoryTest type
          : [];
  
        this.filteredLaboratoryTests = pending;
        console.log('filteredLaboratoryTests:', this.filteredLaboratoryTests);

        if (this.filteredLaboratoryTests.length > 0) {
          this.cardNumberSearch = this.filteredLaboratoryTests[0].cardNumber;
          this.searchByCardNumber();
        }
      },
      (error) => {
        console.error('getLaboratoryTests error:', error);
        this.filteredLaboratoryTests = [];
      }
    );
  }
  
}