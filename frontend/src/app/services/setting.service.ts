import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private readonly apiUrl = 'http://localhost:5000/settings';

  constructor(private http: HttpClient) {}

  getSettings(key?: string): Observable<Record<string, string>> {
    const url = key ? `${this.apiUrl}?key=${key}` : this.apiUrl;
    return this.http.get<Record<string, string>>(url);
  }

  updateSettings(updates: Record<string, string>): Observable<any> {
    return this.http.put<any>(this.apiUrl, updates);
  }
}
