import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  id?: string;
  hn?: string;
  firstName: string;
  lastName: string;
  name: string; // Combined name
  phone: string;
  gender: string;
  dob: string | null;
  lastVisit?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiUrl = 'http://localhost:5000/patients';

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  createPatient(patient: Omit<Patient, 'id' | 'hn'>): Observable<any> {
    // Merge firstName and lastName into a single name
    const name = `${patient.firstName} ${patient.lastName}`.trim();
    const payload = {
      name,
      phone: patient.phone,
      gender: patient.gender,
      dob: patient.dob
    };
    return this.http.post<any>(this.apiUrl, payload);
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

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
