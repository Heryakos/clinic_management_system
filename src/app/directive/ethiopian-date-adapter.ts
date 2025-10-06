import { Injectable } from '@angular/core';
import { EthiopianDate } from '../models/ethiopian-date';

const MONTH_NAMES = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagume'
];

const DAY_OF_WEEK_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable({
  providedIn: 'root' // Ensures singleton service available app-wide
})
export class EthiopianDateAdapter {

  getYear(date: EthiopianDate): number {
    return date.year;
  }

  getMonth(date: EthiopianDate): number {
    return date.month - 1; // 0-based
  }

  getDate(date: EthiopianDate): number {
    return date.day;
  }

  getDayOfWeek(date: EthiopianDate): number {
    const gcDate = this.ecToGregorian(date.year, date.month, date.day);
    return gcDate.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return MONTH_NAMES;
  }

  getDateNames(): string[] {
    return Array.from({length: 31}, (_, i) => String(i + 1));
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return DAY_OF_WEEK_NAMES;
  }

  getYearName(date: EthiopianDate): string {
    return String(date.year);
  }

  getFirstDayOfWeek(): number {
    return 1; // Monday
  }

  getNumDaysInMonth(date: EthiopianDate): number {
    if (date.month <= 12) return 30;
    return this.isECLeapYear(date.year) ? 6 : 5;
  }

  clone(date: EthiopianDate): EthiopianDate {
    return {year: date.year, month: date.month, day: date.day};
  }

  createDate(year: number, month: number, date: number): EthiopianDate {
    return {year, month: month + 1, day: date};
  }

  today(): EthiopianDate {
    const gcToday = new Date();
    return this.gregorianToEC(gcToday);
  }

  parse(value: any): EthiopianDate | null {
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number);
      if (this.isValidECDate(day, month, year)) {
        return {year, month, day};
      }
    }
    return null;
  }

  format(date: EthiopianDate, displayFormat: any): string {
    return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
  }

  addCalendarYears(date: EthiopianDate, years: number): EthiopianDate {
    const newDate = this.clone(date);
    newDate.year += years;
    if (newDate.month === 13 && newDate.day > (this.isECLeapYear(newDate.year) ? 6 : 5)) {
      newDate.day = this.isECLeapYear(newDate.year) ? 6 : 5;
    }
    return newDate;
  }

  addCalendarMonths(date: EthiopianDate, months: number): EthiopianDate {
    const gcDate = this.ecToGregorian(date.year, date.month, date.day);
    gcDate.setMonth(gcDate.getMonth() + months);
    return this.gregorianToEC(gcDate);
  }

  addCalendarDays(date: EthiopianDate, days: number): EthiopianDate {
    const gcDate = this.ecToGregorian(date.year, date.month, date.day);
    gcDate.setDate(gcDate.getDate() + days);
    return this.gregorianToEC(gcDate);
  }

  toIso8601(date: EthiopianDate): string {
    const gcDate = this.ecToGregorian(date.year, date.month, date.day);
    return gcDate.toISOString();
  }

  isValid(date: EthiopianDate): boolean {
    return this.isValidECDate(date.day, date.month, date.year);
  }

  compareDate(first: EthiopianDate, second: EthiopianDate): number {
    const gcFirst = this.ecToGregorian(first.year, first.month, first.day);
    const gcSecond = this.ecToGregorian(second.year, second.month, second.day);
    return gcFirst.getTime() - gcSecond.getTime();
  }

  // Conversion functions
  public gregorianToEC(gregorianDate: Date): EthiopianDate {
    const julianDay = this.gregorianToJulianDay(gregorianDate);
    const { year, month, day } = this.julianDayToEC(julianDay);
    return { year, month, day };
  }

  public ecToGregorian(year: number, month: number, day: number): Date {
    const julianDay = this.ecToJulianDay(year, month, day);
    return this.julianDayToGregorian(julianDay);
  }

  public isValidECDate(day: number, month: number, year: number): boolean {
    if (year < 1) return false;
    if (month < 1 || month > 13) return false;
    if (day < 1) return false;
    if (month <= 12 && day > 30) return false;
    if (month === 13 && day > (this.isECLeapYear(year) ? 6 : 5)) return false;
    return true;
  }

  private isECLeapYear(year: number): boolean {
    return (year % 4 === 3);
  }

  private gregorianToJulianDay(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  private julianDayToEC(jd: number): { year: number, month: number, day: number } {
    const JD_OFFSET = 1723855;
    const n = jd - JD_OFFSET;
    const year = Math.floor((4 * n + 3) / 1461);
    const dayOfYear = n - Math.floor((1461 * year) / 4);
    const month = Math.min(13, Math.floor((dayOfYear - 1) / 30) + 1);
    const day = dayOfYear - (month - 1) * 30;
    return { year, month, day };
  }

  private ecToJulianDay(year: number, month: number, day: number): number {
    const JD_OFFSET = 1723855;
    const days = (year * 365) + Math.floor(year / 4) + (month - 1) * 30 + day;
    return JD_OFFSET + days;
  }

  private julianDayToGregorian(jd: number): Date {
    const a = jd + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = b * 100 + d - 4800 + Math.floor(m / 10);
    return new Date(year, month - 1, day);
  }
}