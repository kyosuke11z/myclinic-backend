import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface Appointment {
  id?: number;
  patient_id: number | null;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: 'Pending' | 'Completed' | 'Cancelled';
  doctor_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/appointments';

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, this.authService.getAuthHeaders());
  }

  createAppointment(appointment: Omit<Appointment, 'id'>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(this.apiUrl, 'POST', appointment, `สร้างคิวนัดหมาย: ${appointment.patient_name}`);
      return of({ message: 'Cached offline', appointmentId: 0 });
    }

    return this.http.post<any>(this.apiUrl, appointment, this.authService.getAuthHeaders());
  }

  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/${id}`, 'PUT', appointment, `แก้ไขนัดหมาย ID: ${id}`);
      return of({ message: 'Cached offline' });
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, appointment, this.authService.getAuthHeaders());
  }

  deleteAppointment(id: number): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/${id}`, 'DELETE', null, `ลบนัดหมาย ID: ${id}`);
      return of({ message: 'Cached offline' });
    }

    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.authService.getAuthHeaders());
  }
}
