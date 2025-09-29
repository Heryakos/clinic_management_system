import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface Reason {
  reasonId: string;
  reasonName: string;
}

export interface ReasonCategory {
  category: string;
  reasons: Reason[];
}

export interface ReasonSelection {
  reasonId: string;
  reasonName: string;
  category: string;
}

@Component({
  selector: 'app-reason-tree-dropdown',
  templateUrl: './reason-tree-dropdown.component.html',
  styleUrls: ['./reason-tree-dropdown.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReasonTreeDropdownComponent),
      multi: true
    }
  ]
})
export class ReasonTreeDropdownComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @Input() reasons: ReasonCategory[] = [];
  @Input() placeholder: string = 'Select reason';
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Output() selectionChange = new EventEmitter<ReasonSelection>();

  @ViewChild('dropdownContainer', { static: false }) dropdownContainer!: ElementRef;

  filteredReasons: ReasonCategory[] = [];
  isOpen = false;
  searchTerm = '';
  expandedCategories = new Set<string>();
  selectedReason: ReasonSelection | null = null;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.updateFilteredReasons();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reasons'] && changes['reasons'].currentValue) {
      console.log('Reasons updated:', JSON.stringify(changes['reasons'].currentValue, null, 2));
      this.updateFilteredReasons();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  writeValue(value: any): void {
    if (value) {
      if (typeof value === 'string') {
        this.findReasonById(value);
      } else if (value.reasonId) {
        this.selectedReason = value;
      }
    } else {
      this.selectedReason = null;
    }
    this.onChange(value?.reasonId || null);
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.detectChanges();
  }

  private findReasonById(id: string) {
    for (const category of this.reasons) {
      const reason = category.reasons.find(r => r.reasonId === id);
      if (reason) {
        this.selectedReason = {
          reasonId: reason.reasonId,
          reasonName: reason.reasonName,
          category: category.category
        };
        this.onChange(reason.reasonId);
        this.cdr.detectChanges();
        return;
      }
    }
    this.selectedReason = null;
    this.cdr.detectChanges();
  }

  onDocumentClick(event: Event) {
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.cdr.detectChanges();
    }
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
        this.updateFilteredReasons(); // Refresh filtered reasons when opening
      }
      this.cdr.detectChanges();
    }
  }

  toggleCategory(category: string) {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
    this.cdr.detectChanges();
  }

  selectReason(reason: Reason, category: string) {
    const selection: ReasonSelection = {
      reasonId: reason.reasonId,
      reasonName: reason.reasonName,
      category
    };
    this.selectedReason = selection;
    this.onChange(reason.reasonId);
    this.selectionChange.emit(selection);
    this.isOpen = false;
    this.searchTerm = '';
    this.updateFilteredReasons();
    this.cdr.detectChanges();
  }

  onSearchChange() {
    this.updateFilteredReasons();
    this.cdr.detectChanges();
  }

  updateFilteredReasons() {
    if (!this.reasons || this.reasons.length === 0) {
      this.filteredReasons = [];
      console.log('No reasons provided');
      return;
    }

    if (!this.searchTerm.trim()) {
      this.filteredReasons = [...this.reasons];
    } else {
      this.filteredReasons = this.reasons
        .map(category => ({
          ...category,
          reasons: category.reasons.filter(reason =>
            reason.reasonName.toLowerCase().includes(this.searchTerm.toLowerCase())
          )
        }))
        .filter(category => category.reasons.length > 0);
    }
    this.expandedCategories.clear();
    this.filteredReasons.forEach(cat => this.expandedCategories.add(cat.category));
    console.log('Filtered reasons:', JSON.stringify(this.filteredReasons, null, 2));
    this.cdr.detectChanges();
  }

  get displayValue(): string {
    if (this.selectedReason) {
      return `${this.selectedReason.category}: ${this.selectedReason.reasonName}`;
    }
    return this.placeholder;
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories.has(category);
  }

  getCategoryReasonCount(category: ReasonCategory): number {
    return category.reasons.length;
  }

  clearSearch() {
    this.searchTerm = '';
    this.updateFilteredReasons();
  }
}