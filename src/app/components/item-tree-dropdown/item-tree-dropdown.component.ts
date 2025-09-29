import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InventoryItemenhanced, ItemCategory, ItemSelection, DosageForm } from 'src/app/models/inventory-enhanced.model';

@Component({
  selector: 'app-item-tree-dropdown',
  templateUrl: './item-tree-dropdown.component.html',
  styleUrls: ['./item-tree-dropdown.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ItemTreeDropdownComponent),
      multi: true
    }
  ]
})
export class ItemTreeDropdownComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() items: ItemCategory[] = [];
  @Input() placeholder: string = 'Select item';
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Output() itemSelected = new EventEmitter<ItemSelection>();
  @ViewChild('dropdownContainer', { static: false }) dropdownContainer!: ElementRef;

  isOpen = false;
  searchTerm = '';
  expandedCategories = new Set<string>();
  expandedForms = new Map<string, Set<string>>();
  selectedItem: ItemSelection | null = null;
  filteredItems: ItemCategory[] = [];

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    console.log('ItemTreeDropdownComponent initialized');
    this.updateFilteredItems();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      console.log('Received items in ItemTreeDropdownComponent:', JSON.stringify(this.items, null, 2));
      this.updateFilteredItems();
    }
  }

  ngOnDestroy() {
    console.log('ItemTreeDropdownComponent destroyed');
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  writeValue(value: any): void {
    console.log('writeValue called with:', value);
    if (value) {
      if (typeof value === 'string' || typeof value === 'number') {
        this.findItemById(value.toString());
      } else if (value.itemId) {
        this.selectedItem = value;
        console.log('Selected item set:', this.selectedItem);
      }
    } else {
      this.selectedItem = null;
      console.log('Selected item cleared');
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
    console.log('Disabled state set:', isDisabled);
  }

  private findItemById(id: string) {
    console.log('Finding item by ID:', id);
    for (const category of this.items || []) {
      for (const dosageForm of category.dosageForms || []) {
        for (const item of dosageForm.items || []) {
          if (item.itemID.toString() === id) {
            this.selectedItem = {
              itemId: item.itemID,
              itemName: item.itemName,
              dosageForm: dosageForm.form,
              categoryName: category.categoryName,
              unit: item.unit,
              currentStock: item.currentStock
            };
            console.log('Found item by ID:', this.selectedItem);
            return;
          }
        }
      }
    }
    this.selectedItem = null;
    console.log('No item found for ID:', id);
  }

  onDocumentClick(event: Event) {
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isOpen = false;
      console.log('Dropdown closed due to outside click');
    }
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      console.log('Dropdown toggled, isOpen:', this.isOpen);
      if (this.isOpen) {
        this.onTouched();
      }
    }
  }

  toggleCategory(categoryName: string) {
    if (this.expandedCategories.has(categoryName)) {
      this.expandedCategories.delete(categoryName);
      this.expandedForms.delete(categoryName);
      console.log('Collapsed category:', categoryName);
    } else {
      this.expandedCategories.add(categoryName);
      console.log('Expanded category:', categoryName);
    }
  }

  toggleForm(categoryName: string, form: string) {
    if (!this.expandedForms.has(categoryName)) {
      this.expandedForms.set(categoryName, new Set<string>());
    }
    const forms = this.expandedForms.get(categoryName)!;
    if (forms.has(form)) {
      forms.delete(form);
      console.log(`Collapsed form ${form} in category ${categoryName}`);
    } else {
      forms.add(form);
      console.log(`Expanded form ${form} in category ${categoryName}`);
    }
  }

  isFormExpanded(categoryName: string, form: string): boolean {
    return this.expandedForms.get(categoryName)?.has(form) || false;
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategories.has(categoryName);
  }

  selectItem(item: InventoryItemenhanced, categoryName: string, dosageForm: string) {
    const selection: ItemSelection = {
      itemId: item.itemID,
      itemName: item.itemName,
      dosageForm,
      categoryName,
      unit: item.unit,
      currentStock: item.currentStock
    };

    this.selectedItem = selection;
    this.onChange(item.itemID);
    this.itemSelected.emit(selection);
    this.isOpen = false;
    this.searchTerm = '';
    this.updateFilteredItems();
    console.log('Selected item:', selection);
  }

  onSearchChange() {
    console.log('Search term changed:', this.searchTerm);
    this.updateFilteredItems();
  }

  updateFilteredItems() {
    console.log('Updating filtered items with items:', JSON.stringify(this.items, null, 2));
    let filteredItems: InventoryItemenhanced[] = [];
    if (!this.searchTerm.trim()) {
      this.items.forEach(category => {
        (category.dosageForms || []).forEach(form => {
          filteredItems.push(...(form.items || []).map(item => ({
            ...item,
            dosageForm: form.form,
            categoryName: category.categoryName
          })));
        });
      });
    } else {
      this.items.forEach(category => {
        (category.dosageForms || []).forEach(form => {
          filteredItems.push(...(form.items || [])
            .filter(item =>
              item.itemName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
              (item.itemCode && item.itemCode.toLowerCase().includes(this.searchTerm.toLowerCase()))
            )
            .map(item => ({
              ...item,
              dosageForm: form.form,
              categoryName: category.categoryName
            })));
        });
      });
    }

    const categoryMap = new Map<string, Map<string, InventoryItemenhanced[]>>();
    filteredItems.forEach(item => {
      const categoryName = item.categoryName || 'Uncategorized';
      const dosageForm = item.dosageForm || item.unit || 'Unknown';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, new Map<string, InventoryItemenhanced[]>());
      }
      const formMap = categoryMap.get(categoryName)!;
      if (!formMap.has(dosageForm)) {
        formMap.set(dosageForm, []);
      }
      formMap.get(dosageForm)!.push(item);
    });

    this.filteredItems = Array.from(categoryMap.entries()).map(([categoryName, formMap]) => ({
      categoryID: categoryName,
      categoryName,
      description: '',
      isActive: true,
      items: [],
      dosageForms: Array.from(formMap.entries()).map(([form, items]) => ({
        form,
        items: items.sort((a, b) => a.itemName.localeCompare(b.itemName))
      })).sort((a, b) => a.form.localeCompare(b.form))
    })).sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    console.log('Filtered items:', JSON.stringify(this.filteredItems, null, 2));
  }

  get displayValue(): string {
    if (this.selectedItem) {
      return `${this.selectedItem.itemName} (${this.selectedItem.dosageForm}, Stock: ${this.selectedItem.currentStock})`;
    }
    return this.placeholder;
  }

  clearSearch() {
    this.searchTerm = '';
    console.log('Search cleared');
    this.updateFilteredItems();
  }

  getCategoryItemCount(category: ItemCategory): number {
    return (category.dosageForms || []).reduce((acc, form) => acc + (form.items || []).length, 0);
  }
}