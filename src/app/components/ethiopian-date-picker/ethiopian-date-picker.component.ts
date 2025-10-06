import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EthiopianDate } from '../../models/ethiopian-date';
import { EthiopianDateAdapter } from '../../directive/ethiopian-date-adapter';

@Component({
  selector: 'app-ethiopian-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ethiopian-date-picker.component.html',
  styleUrls: ['./ethiopian-date-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EthiopianDatePickerComponent),
      multi: true
    }
    // Removed EthiopianDateAdapter from providers
  ]
})
export class EthiopianDatePickerComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = 'Select date';
  @Output() dateChange = new EventEmitter<EthiopianDate>();

  isOpen = false;
  selectedDate: EthiopianDate | null = null;
  currentViewDate: EthiopianDate;
  calendarDays: (number | null)[][] = [];
  monthNames: string[] = [];
  dayNames: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  private onChange: any = () => {};
  private onTouched: any = () => {};
  disabled = false;

  constructor(private dateAdapter: EthiopianDateAdapter) {
    this.currentViewDate = this.dateAdapter.today();
    this.monthNames = this.dateAdapter.getMonthNames('long');
  }

  ngOnInit(): void {
    this.generateCalendar();
  }

  writeValue(value: any): void {
    if (value) {
      if (typeof value === 'string') {
        const parsed = this.dateAdapter.parse(value);
        if (parsed) {
          this.selectedDate = parsed;
          this.currentViewDate = this.dateAdapter.clone(parsed);
        }
      } else if (value.year && value.month && value.day) {
        this.selectedDate = value;
        this.currentViewDate = this.dateAdapter.clone(value);
      }
      this.generateCalendar();
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

  toggleCalendar(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
      }
    }
  }

  closeCalendar(): void {
    this.isOpen = false;
  }

  selectDate(day: number | null): void {
    if (day === null || this.disabled) return;

    this.selectedDate = {
      year: this.currentViewDate.year,
      month: this.currentViewDate.month,
      day: day
    };

    this.onChange(this.selectedDate);
    this.dateChange.emit(this.selectedDate);
    this.closeCalendar();
  }

  previousMonth(): void {
    if (this.currentViewDate.month === 1) {
      this.currentViewDate.month = 13;
      this.currentViewDate.year--;
    } else {
      this.currentViewDate.month--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentViewDate.month === 13) {
      this.currentViewDate.month = 1;
      this.currentViewDate.year++;
    } else {
      this.currentViewDate.month++;
    }
    this.generateCalendar();
  }

  previousYear(): void {
    this.currentViewDate.year--;
    this.generateCalendar();
  }

  nextYear(): void {
    this.currentViewDate.year++;
    this.generateCalendar();
  }

  goToToday(): void {
    const today = this.dateAdapter.today();
    this.currentViewDate = today;
    this.selectedDate = today;
    this.onChange(this.selectedDate);
    this.dateChange.emit(this.selectedDate);
    this.generateCalendar();
    this.closeCalendar();
  }

  generateCalendar(): void {
    const daysInMonth = this.dateAdapter.getNumDaysInMonth(this.currentViewDate);
    const firstDay = this.dateAdapter.getDayOfWeek({
      year: this.currentViewDate.year,
      month: this.currentViewDate.month,
      day: 1
    });

    this.calendarDays = [];
    let week: (number | null)[] = new Array(7).fill(null);
    let dayCounter = 1;

    for (let i = firstDay; i < 7 && dayCounter <= daysInMonth; i++) {
      week[i] = dayCounter++;
    }
    this.calendarDays.push([...week]);

    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week[i] = dayCounter++;
      }
      this.calendarDays.push([...week]);
    }
  }

  isSelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    return this.selectedDate.day === day &&
           this.selectedDate.month === this.currentViewDate.month &&
           this.selectedDate.year === this.currentViewDate.year;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = this.dateAdapter.today();
    return day === today.day &&
           this.currentViewDate.month === today.month &&
           this.currentViewDate.year === today.year;
  }

  getDisplayValue(): string {
    if (this.selectedDate) {
      return this.dateAdapter.format(this.selectedDate, null);
    }
    return '';
  }

  clearDate(event: Event): void {
    event.stopPropagation();
    this.selectedDate = null;
    this.onChange(null);
    this.dateChange.emit(undefined as any);
  }
}