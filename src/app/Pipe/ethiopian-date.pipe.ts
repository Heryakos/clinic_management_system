import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ethiopianDate' })
export class EthiopianDatePipe implements PipeTransform {

  private months = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagume'
  ];

  transform(
    value: string | Date | null | undefined,
    withTime: boolean = false
  ): string {
    if (!value) return '';

    const d = new Date(value);

    // ----- DATE (GC → EC) -----
    const gcYear = d.getFullYear();
    const gcMonth = d.getMonth() + 1;
    const gcDay = d.getDate();

    // Ethiopian year
    const ecYear = gcMonth > 9 || (gcMonth === 9 && gcDay >= 11)
      ? gcYear - 7
      : gcYear - 8;

    // Days since Sept 11
    const newYear = new Date(gcMonth > 9 ? gcYear : gcYear - 1, 8, 11);
    const diffDays = Math.floor((d.getTime() - newYear.getTime()) / 86400000);

    const ecMonth = Math.floor(diffDays / 30);
    const ecDay = diffDays % 30 + 1;

    const monthName = this.months[ecMonth];

    // ----- TIME (GC → Ethiopian clock) -----
    if (!withTime) {
      return `${monthName} ${ecDay}, ${ecYear} EC`;
    }

    let hour = d.getHours() - 6;
    if (hour <= 0) hour += 12;
    if (hour > 12) hour -= 12;

    const minute = d.getMinutes().toString().padStart(2, '0');

    return `${monthName} ${ecDay}, ${ecYear} EC – ${hour}:${minute}`;
  }
}
