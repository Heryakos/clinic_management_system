import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByCategory'
})
export class FilterByCategoryPipe implements PipeTransform {
  transform(items: any[], category: string): any[] {
    console.log('Filtering medications:', items, 'for category:', category);
    if (!items || !category) {
      return items;
    }
    const filtered = items.filter(item => item.category === category);
    console.log('Filtered result:', filtered);
    return filtered;
  }
}