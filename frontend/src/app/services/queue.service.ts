import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface QueueEntry {
  id?: number;
  patient_id: number;
  appointment_id?: number | null;
  queue_number: string;
  status: 'Waiting_Vitals' | 'Waiting_Doctor' | 'Waiting_Pharmacy' | 'Waiting_Billing' | 'Discharged';
  doctor_id?: number | null;
  triage_level?: 'Green' | 'Yellow' | 'Orange' | 'Red';
  current_station: string;
  created_at?: string;
  patient_name?: string;
  patient_hn?: string;
  gender?: string;
  dob?: string;
  doctor_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/queues';

  getActiveQueues(): Observable<QueueEntry[]> {
    return this.http.get<QueueEntry[]>(`${this.apiUrl}/active`, this.authService.getAuthHeaders());
  }

  createQueue(queue: { patient_id: number, appointment_id?: number | null, doctor_id?: number | null }): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(this.apiUrl, 'POST', queue, `ลงทะเบียนเข้าคิวผู้ป่วย ID: ${queue.patient_id}`);
      return of({ message: 'Cached offline', queueNumber: 'TEMP_Q' });
    }
    return this.http.post<any>(this.apiUrl, queue, this.authService.getAuthHeaders());
  }

  updateQueueStation(id: number, update: { status?: string, current_station?: string, doctor_id?: number | null }): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/${id}`, 'PUT', update, `เลื่อนคิว ID: ${id} ไปยังสถานี: ${update.current_station || 'ถัดไป'}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.put<any>(`${this.apiUrl}/${id}`, update, this.authService.getAuthHeaders());
  }
}
