import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id?: number;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: 'Pending' | 'Completed' | 'Cancelled';
  patient_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = 'http://localhost:5000/appointments';

  constructor(private http: HttpClient) {}

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  createAppointment(appointment: Omit<Appointment, 'id'>): Observable<any> {
    return this.http.post<any>(this.apiUrl, appointment);
  }

  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, appointment);
  }

  deleteAppointment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
