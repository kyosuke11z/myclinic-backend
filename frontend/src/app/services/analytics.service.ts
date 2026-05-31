import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/analytics';

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, this.authService.getAuthHeaders());
  }

  getAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/logs`, this.authService.getAuthHeaders());
  }
}
