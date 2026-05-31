import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface DrugItem {
  id?: number;
  code: string;
  name: string;
  type: 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Cream';
  drug_family: string;
  pregnancy_category?: 'A' | 'B' | 'C' | 'D' | 'X';
  stock_quantity: number;
  reorder_level: number;
  expiry_date: string | null;
  price_per_unit: number;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/pharmacy';

  getAllDrugs(): Observable<DrugItem[]> {
    return this.http.get<DrugItem[]>(`${this.apiUrl}/drugs`, this.authService.getAuthHeaders());
  }

  createDrug(drug: Omit<DrugItem, 'id'>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/drugs`, 'POST', drug, `เพิ่มยาในคลัง: ${drug.name}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.post<any>(`${this.apiUrl}/drugs`, drug, this.authService.getAuthHeaders());
  }

  updateDrug(id: number, drug: Partial<DrugItem>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/drugs/${id}`, 'PUT', drug, `อัปเดตสต็อกยา ID: ${id}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.put<any>(`${this.apiUrl}/drugs/${id}`, drug, this.authService.getAuthHeaders());
  }

  getPendingPrescriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prescriptions/pending`, this.authService.getAuthHeaders());
  }

  dispensePrescription(id: number): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/prescriptions/dispense/${id}`, 'POST', null, `จ่ายยาสำหรับใบวินิจฉัย ID: ${id}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.post<any>(`${this.apiUrl}/prescriptions/dispense/${id}`, {}, this.authService.getAuthHeaders());
  }
}
