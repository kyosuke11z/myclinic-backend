import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QueueService, QueueEntry } from '../../services/queue.service';
import { EmrService, VitalSigns } from '../../services/emr.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './triage.html'
})
export class TriagePage implements OnInit {
  private queueService = inject(QueueService);
  private emrService = inject(EmrService);
  public syncService = inject(SyncService);

  public queues = signal<QueueEntry[]>([]);
  public isLoading = signal<boolean>(true);
  public isModalOpen = signal<boolean>(false);
  public activeQueue = signal<QueueEntry | null>(null);

  // Vitals form state
  public vitalsForm = signal<Omit<VitalSigns, 'id'>>({
    patient_id: 0,
    weight: 60,
    height: 165,
    bp_systolic: 120,
    bp_diastolic: 80,
    pulse: 75,
    temperature: 36.5,
    oxygen_saturation: 98,
    recorded_by: ''
  });

  // Filter queues to only show those waiting for vital signs triage
  public triageQueues = computed(() => 
    this.queues().filter(q => q.status === 'Waiting_Vitals')
  );

  ngOnInit(): void {
    this.loadQueues();
  }

  loadQueues(): void {
    this.isLoading.set(true);
    this.queueService.getActiveQueues().subscribe({
      next: (data) => {
        this.queues.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching triage queues:', err);
        this.isLoading.set(false);
      }
    });
  }

  openTriageModal(q: QueueEntry): void {
    this.activeQueue.set(q);
    this.vitalsForm.set({
      patient_id: q.patient_id,
      weight: 60,
      height: 165,
      bp_systolic: 120,
      bp_diastolic: 80,
      pulse: 75,
      temperature: 36.5,
      oxygen_saturation: 98,
      recorded_by: localStorage.getItem('userName') || 'Staff Nurse'
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSaveVitals(): void {
    const form = this.vitalsForm();
    if (!form.patient_id) return;

    this.emrService.createVitalSigns(form).subscribe({
      next: () => {
        alert('บันทึกสัญญาณชีพสำเร็จ ส่งคนไข้เข้าพบแพทย์ต่อ');
        this.loadQueues();
        this.closeModal();
      },
      error: (err) => alert('Error saving vital signs: ' + err.message)
    });
  }
}
