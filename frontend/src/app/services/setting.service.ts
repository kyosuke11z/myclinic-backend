import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/settings';

  getSettings(key?: string): Observable<Record<string, string>> {
    const url = key ? `${this.apiUrl}?key=${key}` : this.apiUrl;
    return this.http.get<Record<string, string>>(url, this.authService.getAuthHeaders());
  }

  updateSettings(updates: Record<string, string>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(this.apiUrl, 'PUT', updates, `อัปเดตการตั้งค่าระบบ`);
      return of({ message: 'Cached offline' });
    }

    return this.http.put<any>(this.apiUrl, updates, this.authService.getAuthHeaders());
  }
}
