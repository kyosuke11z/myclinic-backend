import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface Patient {
  id?: string;
  hn?: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  gender: string;
  dob: string | null;
  allergies?: string;
  medical_history?: string;
  lastVisit?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/patients';

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl, this.authService.getAuthHeaders());
  }

  createPatient(patient: Omit<Patient, 'id' | 'hn'>): Observable<any> {
    const name = `${patient.firstName} ${patient.lastName}`.trim();
    const payload = {
      name,
      phone: patient.phone,
      gender: patient.gender,
      dob: patient.dob,
      allergies: patient.allergies || 'ไม่มี',
      medical_history: patient.medical_history || 'ไม่มี'
    };

    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(this.apiUrl, 'POST', payload, `เพิ่มผู้ป่วย: ${name}`);
      return of({ message: 'Cached offline', patientId: 'TEMP_' + Math.random().toString(36).substring(2, 5) });
    }

    return this.http.post<any>(this.apiUrl, payload, this.authService.getAuthHeaders());
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<any> {
    const payload: any = { ...patient };
    if (patient.firstName !== undefined || patient.lastName !== undefined) {
      payload.name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    }
    delete payload.id;
    delete payload.hn;
    delete payload.firstName;
    delete payload.lastName;

    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/${id}`, 'PUT', payload, `แก้ไขผู้ป่วย ID: ${id}`);
      return of({ message: 'Cached offline' });
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, this.authService.getAuthHeaders());
  }

  deletePatient(id: string): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/${id}`, 'DELETE', null, `ลบผู้ป่วย ID: ${id}`);
      return of({ message: 'Cached offline' });
    }

    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.authService.getAuthHeaders());
  }
}
