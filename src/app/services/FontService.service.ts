import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FontService {
  private fontCache: { [key: string]: Observable<string> } = {};

  constructor(private http: HttpClient) {}

  loadFontBase64(fontJsonPath: string): Observable<string> {
    const fullPath = `/assets/${fontJsonPath}`;
    
    if (!this.fontCache[fullPath]) {
      this.fontCache[fullPath] = this.http.get(fullPath).pipe(
        map((data: any) => {
          if (data && data.fontBase64) {
            console.log('Font loaded successfully from:', fullPath);
            return data.fontBase64;
          } else {
            throw new Error('Invalid font JSON format - missing fontBase64 property');
          }
        }),
        catchError(error => {
          console.error(`Failed to load font from ${fullPath}:`, error);
          // Return empty string to trigger fallback
          return of('');
        }),
        shareReplay(1)
      );
    }
    
    return this.fontCache[fullPath];
  }

  // Method to check if font supports specific characters
  supportsAmharic(text: string): boolean {
    // Basic Amharic character range check
    const amharicRegex = /[\u1200-\u137F]/;
    return amharicRegex.test(text);
  }
}