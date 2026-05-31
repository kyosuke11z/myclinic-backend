import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface BillPayment {
  payment_method: 'Cash' | 'Credit' | 'QR' | 'Insurance';
  discount: number;
  paid_amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/billing';

  getPendingBills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`, this.authService.getAuthHeaders());
  }

  payBill(id: number, payment: BillPayment): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/pay/${id}`, 'POST', payment, `ชำระเงินค่ารักษาบิล ID: ${id}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.post<any>(`${this.apiUrl}/pay/${id}`, payment, this.authService.getAuthHeaders());
  }
}
