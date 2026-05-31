import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { PatientService, Patient } from '../../services/patient.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css'
})
export class AppointmentsPage implements OnInit {
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);

  // States
  public appointments = signal<Appointment[]>([]);
  public patients = signal<Patient[]>([]);
  public isLoading = signal<boolean>(true);
  public statusFilter = signal<string>('All');

  // Modal states
  public isModalOpen = signal<boolean>(false);
  public modalMode = signal<'add' | 'edit'>('add');
  public activeAppointmentId = signal<number | null>(null);

  // Form selected fields
  public selectedAppointment = signal<Omit<Appointment, 'id'>>({
    patient_id: null,
    patient_name: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    status: 'Pending',
    doctor_id: null
  });

  // Computed filtered list of appointments
  public filteredAppointments = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'All') {
      return this.appointments();
    }
    return this.appointments().filter(a => a.status === filter);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      appointments: this.appointmentService.getAllAppointments(),
      patients: this.patientService.getAllPatients()
    }).subscribe({
      next: (res) => {
        this.appointments.set(res.appointments);
        this.patients.set(res.patients);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading appointments data:', err);
        this.isLoading.set(false);
      }
    });
  }

  openAddModal(): void {
    this.modalMode.set('add');
    this.activeAppointmentId.set(null);
    
    // Set form to blank/default values
    const today = new Date().toISOString().split('T')[0];
    this.selectedAppointment.set({
      patient_id: null,
      patient_name: '',
      appointment_date: today,
      appointment_time: '09:00',
      reason: '',
      status: 'Pending',
      doctor_id: null
    });
    
    this.isModalOpen.set(true);
  }

  openEditModal(app: Appointment): void {
    this.modalMode.set('edit');
    this.activeAppointmentId.set(app.id || null);
    
    this.selectedAppointment.set({
      patient_id: app.patient_id,
      patient_name: app.patient_name,
      appointment_date: app.appointment_date,
      appointment_time: app.appointment_time ? app.appointment_time.substring(0, 5) : '',
      reason: app.reason || '',
      status: app.status,
      doctor_id: app.doctor_id
    });
    
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onPatientSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const patientId = target.value;
    
    if (patientId) {
      const found = this.patients().find(p => String(p.id) === patientId);
      if (found) {
        this.selectedAppointment.set({
          ...this.selectedAppointment(),
          patient_name: `${found.firstName} ${found.lastName}`.trim(),
          patient_id: Number(patientId)
        });
      }
    } else {
      this.selectedAppointment.set({
        ...this.selectedAppointment(),
        patient_name: '',
        patient_id: null
      });
    }
  }

  onSaveAppointment(): void {
    const data = this.selectedAppointment();
    
    if (!data.patient_name || !data.appointment_date || !data.appointment_time) {
      alert('กรุณากรอกข้อมูลนัดหมายที่จำเป็น');
      return;
    }

    if (this.modalMode() === 'add') {
      this.appointmentService.createAppointment(data).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการจองนัดหมาย: ' + err.message)
      });
    } else {
      const id = this.activeAppointmentId();
      if (id !== null) {
        this.appointmentService.updateAppointment(id, data).subscribe({
          next: () => {
            this.loadData();
            this.closeModal();
          },
          error: (err) => alert('เกิดข้อผิดพลาดในการแก้ไขนัดหมาย: ' + err.message)
        });
      }
    }
  }

  onDeleteAppointment(id: number): void {
    if (confirm('คุณแน่ใจว่าต้องการยกเลิกและลบการนัดหมายรายการนี้หรือไม่?')) {
      this.appointmentService.deleteAppointment(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการลบรายการนัดหมาย: ' + err.message)
      });
    }
  }
}
