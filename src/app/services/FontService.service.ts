import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { concatMap, map, catchError, filter, first, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FontService {
  private fontCache: { [key: string]: Observable<string> } = {};

  constructor(private http: HttpClient) {}

  loadFontBase64(fontJsonPath: string): Observable<string> {
    const cacheKey = fontJsonPath;
  
    if (!this.fontCache[cacheKey]) {
      const candidatePaths = [
        `assets/${fontJsonPath}`,  // Local dev build
        `xokaerp/DesktopModules/MVC/XOKA_DNN_Case/Views/Item/assets/assets/${fontJsonPath}`, // Deployed path
        `/xokaerp/DesktopModules/MVC/XOKA_DNN_Case/Views/Item/assets/assets/${fontJsonPath}` // Absolute fallback
      ];
  
      this.fontCache[cacheKey] = from(candidatePaths).pipe(
        concatMap(path =>
          this.http.get(path).pipe(
            map((data: any) => {
              if (data?.fontBase64) {
                console.log('%c✅ Font Loaded From: ' + path, 'color: green;');
                return data.fontBase64 as string;
              }
              return '';
            }),
            catchError(() => of(''))
          )
        ),
        filter(base64 => base64 !== ''), // Keep only valid matches
        first(undefined, ''),            // ✅ default if all fail
        shareReplay(1)
      );
      
    }
  
    return this.fontCache[cacheKey];
  }
  

  // Method to check if font supports specific characters
  supportsAmharic(text: string): boolean {
    // Basic Amharic character range check
    const amharicRegex = /[\u1200-\u137F]/;
    return amharicRegex.test(text);
  }
}