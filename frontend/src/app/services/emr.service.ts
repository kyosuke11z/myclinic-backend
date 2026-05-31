import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SyncService } from './sync.service';
import { AuthService } from './auth.service';

export interface VitalSigns {
  id?: number;
  patient_id: number;
  weight: number;
  height: number;
  bp_systolic: number;
  bp_diastolic: number;
  pulse: number;
  temperature: number;
  oxygen_saturation: number;
  triage_level?: 'Green' | 'Yellow' | 'Orange' | 'Red';
  creatinine?: number;
  recorded_at?: string;
  recorded_by?: string;
}

export interface PrescriptionItem {
  drug_id: number;
  quantity: number;
  dosage_instructions: string;
}

export interface Prescription {
  id?: number;
  patient_id: number;
  queue_id: number;
  diagnosed_icd10: string;
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
  items: PrescriptionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class EmrService {
  private http = inject(HttpClient);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:5000/emr';

  getPatientHistory(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/history/${patientId}`, this.authService.getAuthHeaders());
  }

  createVitalSigns(vitals: Omit<VitalSigns, 'id'>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/vitals`, 'POST', vitals, `บันทึกสัญญาณชีพผู้ป่วย ID: ${vitals.patient_id}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.post<any>(`${this.apiUrl}/vitals`, vitals, this.authService.getAuthHeaders());
  }

  createPrescription(prescription: Omit<Prescription, 'id'>): Observable<any> {
    if (!this.syncService.isOnline()) {
      this.syncService.cacheAction(`${this.apiUrl}/prescription`, 'POST', prescription, `บันทึกเวชระเบียน SOAP & สั่งยาผู้ป่วย ID: ${prescription.patient_id}`);
      return of({ message: 'Cached offline' });
    }
    return this.http.post<any>(`${this.apiUrl}/prescription`, prescription, this.authService.getAuthHeaders());
  }
}
