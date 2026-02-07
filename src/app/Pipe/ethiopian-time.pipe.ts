import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ethiopianTime' })
export class EthiopianTimePipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Supports "HH:mm" or "HH:mm:ss"
    const parts = value.split(':');
    if (parts.length < 2) return '';

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    // GC → Ethiopian clock
    hour = hour - 6;
    if (hour <= 0) hour += 12;
    if (hour > 12) hour -= 12;

    return `${hour}:${minute}`;
  }
}
