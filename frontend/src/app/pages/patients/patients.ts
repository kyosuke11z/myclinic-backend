import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patient.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})
export class PatientsPage implements OnInit {
  private patientService = inject(PatientService);

  // States
  public patients = signal<Patient[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  
  // Modal states
  public isModalOpen = signal<boolean>(false);
  public modalMode = signal<'add' | 'edit'>('add');
  
  // Selected patient for add/edit form
  public selectedPatient = signal<Omit<Patient, 'id' | 'hn'>>({
    firstName: '',
    lastName: '',
    name: '',
    phone: '',
    gender: 'ชาย',
    dob: null
  });
  public activePatientId = signal<string | null>(null);

  // Computed filtered patients list
  public filteredPatients = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.patients();
    }
    return this.patients().filter(patient => 
      patient.firstName.toLowerCase().includes(query) || 
      patient.lastName.toLowerCase().includes(query) || 
      patient.hn?.toLowerCase().includes(query) ||
      patient.phone.includes(query)
    );
  });

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading.set(true);
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patients.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching patients:', err);
        this.isLoading.set(false);
      }
    });
  }

  openAddModal(): void {
    this.modalMode.set('add');
    this.activePatientId.set(null);
    this.selectedPatient.set({
      firstName: '',
      lastName: '',
      name: '',
      phone: '',
      gender: 'ชาย',
      dob: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(patient: Patient): void {
    this.modalMode.set('edit');
    this.activePatientId.set(patient.id || null);
    this.selectedPatient.set({
      firstName: patient.firstName,
      lastName: patient.lastName,
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      dob: patient.dob ? patient.dob.substring(0, 10) : ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSavePatient(): void {
    const patientData = this.selectedPatient();
    
    if (!patientData.firstName || !patientData.phone) {
      alert('กรุณากรอกข้อมูลที่จำเป็น: ชื่อและเบอร์โทรศัพท์');
      return;
    }

    if (this.modalMode() === 'add') {
      this.patientService.createPatient(patientData).subscribe({
        next: () => {
          this.loadPatients();
          this.closeModal();
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message)
      });
    } else {
      const id = this.activePatientId();
      if (id) {
        this.patientService.updatePatient(id, patientData).subscribe({
          next: () => {
            this.loadPatients();
            this.closeModal();
          },
          error: (err) => alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ' + err.message)
        });
      }
    }
  }

  onDeletePatient(id: string): void {
    if (confirm('คุณแน่ใจว่าต้องการลบข้อมูลผู้ป่วยรายนี้หรือไม่?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + err.message)
      });
    }
  }
}
