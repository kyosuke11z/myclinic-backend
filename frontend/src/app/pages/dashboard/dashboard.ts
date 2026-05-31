import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PatientService, Patient } from '../../services/patient.service';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardPage implements OnInit {
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);

  // States using Signals
  public patients = signal<Patient[]>([]);
  public appointments = signal<Appointment[]>([]);
  public isLoading = signal<boolean>(true);

  // Computed statistics (super high performance!)
  public totalPatients = computed(() => this.patients().length);
  public totalAppointments = computed(() => this.appointments().length);
  
  public pendingAppointments = computed(() => 
    this.appointments().filter(a => a.status === 'Pending').length
  );
  
  public completedAppointments = computed(() => 
    this.appointments().filter(a => a.status === 'Completed').length
  );

  public latestAppointments = computed(() => {
    // Get last 5 appointments
    return this.appointments().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      patients: this.patientService.getAllPatients(),
      appointments: this.appointmentService.getAllAppointments()
    }).subscribe({
      next: (res) => {
        this.patients.set(res.patients);
        this.appointments.set(res.appointments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading.set(false);
      }
    });
  }
}
