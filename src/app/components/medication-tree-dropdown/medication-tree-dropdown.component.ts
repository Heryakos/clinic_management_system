import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface Medication {
  medicationName: string;
  medicationID?: number;
  strength?: string;
  dosageForm?: string;
  currentStock?: number;
  minimumStock?: number;
  itemCode?: string;
  category?: string;
  unit?: string; // Added for stock display
}

export interface DosageForm {
  form: string;
  medications: Medication[];
}

export interface MedicationCategory {
  category: string;
  dosageForms: DosageForm[];
}

export interface MedicationSelection {
  medicationId: string;
  medicationName: string;
  dosageForm: string;
  category: string;
  strength?: string;
  currentStock?: number;
}

interface CategoryGroup {
  categoryName: string;
  items: Medication[];
}

@Component({
  selector: 'app-medication-tree-dropdown',
  templateUrl: './medication-tree-dropdown.component.html',
  styleUrls: ['./medication-tree-dropdown.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MedicationTreeDropdownComponent),
      multi: true
    }
  ]
})
export class MedicationTreeDropdownComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() medications: MedicationCategory[] = [];
  @Input() placeholder: string = 'Select medication';
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Output() selectionChange = new EventEmitter<MedicationSelection>();
  @ViewChild('dropdownContainer', { static: false }) dropdownContainer!: ElementRef;

  isOpen = false;
  searchTerm = '';
  expandedCategories = new Set<string>();
  selectedMedication: MedicationSelection | null = null;
  filteredMedications: MedicationCategory[] = [];
  filteredMedicationsByCategory: CategoryGroup[] = [];

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.updateFilteredMedications();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['medications']) {
      console.log('MedicationTreeDropdown received medications:', JSON.stringify(this.medications, null, 2));
      this.updateFilteredMedications();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  writeValue(value: any): void {
    if (value) {
      if (typeof value === 'string' || typeof value === 'number') {
        this.findMedicationById(value.toString());
      } else if (value.medicationId) {
        this.selectedMedication = value;
      }
    } else {
      this.selectedMedication = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private findMedicationById(id: string) {
    for (const category of this.medications) {
      for (const dosageForm of category.dosageForms) {
        for (const medication of dosageForm.medications) {
          const medicationId = medication.medicationID?.toString() || medication.medicationName;
          if (medicationId === id) {
            this.selectedMedication = {
              medicationId: id,
              medicationName: medication.medicationName,
              dosageForm: dosageForm.form,
              category: category.category,
              strength: medication.strength,
              currentStock: medication.currentStock
            };
            break;
          }
        }
      }
    }
  }

  onDocumentClick(event: Event) {
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
      }
    }
  }

  toggleCategory(categoryName: string) {
    if (this.expandedCategories.has(categoryName)) {
      this.expandedCategories.delete(categoryName);
    } else {
      this.expandedCategories.add(categoryName);
    }
  }

  toggleForm(category: string, form: string): void {
    // Implementation for toggling form
  }

  isFormExpanded(category: string, form: string): boolean {
    return false; // Default value
  }

  selectMedication(medication: Medication, category: string, form: string) {
    const medicationId = medication.medicationID?.toString() || medication.medicationName;
    const selection: MedicationSelection = {
      medicationId,
      medicationName: medication.medicationName,
      dosageForm: form,
      category,
      strength: medication.strength,
      currentStock: medication.currentStock
    };
    
    this.selectedMedication = selection;
    this.onChange(medicationId);
    this.selectionChange.emit(selection);
    this.isOpen = false;
    this.searchTerm = '';
    this.updateFilteredMedications();
  }

  onSearchChange() {
    this.updateFilteredMedications();
  }

  updateFilteredMedications() {
    let filteredItems: Medication[] = [];
    if (!this.searchTerm.trim()) {
      this.medications.forEach(category => {
        category.dosageForms.forEach(form => {
          filteredItems.push(...form.medications.map(med => ({
            ...med,
            dosageForm: form.form,
            category: category.category
          })));
        });
      });
    } else {
      this.medications.forEach(category => {
        category.dosageForms.forEach(form => {
          filteredItems.push(...form.medications
            .filter(med =>
              med.medicationName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
              (med.itemCode && med.itemCode.toLowerCase().includes(this.searchTerm.toLowerCase()))
            )
            .map(med => ({
              ...med,
              dosageForm: form.form,
              category: category.category
            })));
        });
      });
    }

    const categoryMap = new Map<string, Medication[]>();
    filteredItems.forEach(item => {
      const categoryName = item.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(item);
    });

    this.filteredMedicationsByCategory = Array.from(categoryMap.entries()).map(([categoryName, items]) => ({
      categoryName,
      items: items.sort((a, b) => a.medicationName.localeCompare(b.medicationName))
    })).sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    if (this.searchTerm.trim()) {
      this.filteredMedicationsByCategory.forEach(category => {
        this.expandedCategories.add(category.categoryName);
      });
    }

    this.filteredMedications = this.medications.filter(category =>
      this.filteredMedicationsByCategory.some(group => group.categoryName === category.category)
    );
  }

  get displayValue(): string {
    if (this.selectedMedication) {
      const strength = this.selectedMedication.strength ? ` (${this.selectedMedication.strength})` : '';
      const stock = this.selectedMedication.currentStock !== undefined
        ? ` (Stock: ${this.selectedMedication.currentStock})`
        : '';
      return `${this.selectedMedication.medicationName}${strength} - ${this.selectedMedication.dosageForm}${stock}`;
    }
    return this.placeholder;
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategories.has(categoryName);
  }

  clearSearch() {
    this.searchTerm = '';
    this.updateFilteredMedications();
  }

  getCategoryMedicationCount(category: MedicationCategory): number {
    return category.dosageForms.reduce((acc, form) => acc + form.medications.length, 0);
  }
}