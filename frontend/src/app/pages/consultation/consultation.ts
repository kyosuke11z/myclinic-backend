import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QueueService, QueueEntry } from '../../services/queue.service';
import { EmrService, PrescriptionItem, Prescription } from '../../services/emr.service';
import { PharmacyService, DrugItem } from '../../services/pharmacy.service';
import { SyncService } from '../../services/sync.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css'
})
export class ConsultationPage implements OnInit {
  private queueService = inject(QueueService);
  private emrService = inject(EmrService);
  private pharmacyService = inject(PharmacyService);
  public syncService = inject(SyncService);

  public queues = signal<QueueEntry[]>([]);
  public drugs = signal<DrugItem[]>([]);
  public isLoading = signal<boolean>(true);
  public isConsultationOpen = signal<boolean>(false);
  public activeQueue = signal<QueueEntry | null>(null);

  // EMR History states
  public patientHistory = signal<any>(null);

  // Consult form states
  public diagnosedIcd10 = signal<string>('J00 (Acute nasopharyngitis)');
  public soapSubjective = signal<string>('');
  public soapObjective = signal<string>('');
  public soapAssessment = signal<string>('');
  public soapPlan = signal<string>('');

  // Prescription Rx items lists
  public prescribedItems = signal<PrescriptionItem[]>([]);

  // Drug selector inputs
  public selectedDrugId = signal<number>(0);
  public selectedQty = signal<number>(10);
  public dosageInstructions = signal<string>('กินครั้งละ 1 เม็ด หลังอาหาร เช้า-เย็น');

  // Filter queues waiting for doctor consultation
  public doctorQueues = computed(() => 
    this.queues().filter(q => q.status === 'Waiting_Doctor')
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.queueService.getActiveQueues().subscribe({
      next: (qData) => {
        this.queues.set(qData);
        
        this.pharmacyService.getAllDrugs().subscribe({
          next: (dData) => {
            this.drugs.set(dData);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  openConsultation(q: QueueEntry): void {
    this.activeQueue.set(q);
    this.prescribedItems.set([]);
    this.soapSubjective.set('คนไข้มีอาการเจ็บคอ ไอ เล็กน้อย มีไข้ต่ำๆ');
    this.soapObjective.set(`คอแดงเล็กน้อย (Mild pharyngitis). ผลวัดสัญญาณชีพล่าสุดพร้อม`);
    this.soapAssessment.set('คออักเสบเฉียบพลัน');
    this.soapPlan.set('จ่ายยาแก้อักเสบและยาลดไข้พาราเซตามอล พร้อมแนะนำดื่มน้ำอุ่นมากๆ');
    this.diagnosedIcd10.set('J02.9 (Acute pharyngitis, unspecified)');

    // Fetch EMR history
    this.emrService.getPatientHistory(q.patient_id).subscribe({
      next: (history) => {
        this.patientHistory.set(history);
        this.isConsultationOpen.set(true);
      },
      error: (err) => {
        console.error('Error fetching patient history:', err);
        this.isConsultationOpen.set(true);
      }
    });
  }

  closeConsultation(): void {
    this.isConsultationOpen.set(false);
  }

  addDrugToRx(): void {
    const drugId = Number(this.selectedDrugId());
    if (!drugId) return;

    const drug = this.drugs().find(d => d.id === drugId);
    if (!drug) return;

    // Check if drug is already added
    const existing = this.prescribedItems().find(item => item.drug_id === drugId);
    if (existing) {
      alert('ยานี้ถูกสั่งจ่ายเพิ่มแล้ว');
      return;
    }

    this.prescribedItems.set([
      ...this.prescribedItems(),
      {
        drug_id: drugId,
        quantity: this.selectedQty(),
        dosage_instructions: this.dosageInstructions()
      }
    ]);
  }

  removeDrugFromRx(drugId: number): void {
    this.prescribedItems.set(
      this.prescribedItems().filter(item => item.drug_id !== drugId)
    );
  }

  getDrugName(id: number): string {
    const drug = this.drugs().find(d => d.id === id);
    return drug ? `${drug.name} (${drug.code})` : 'Unknown Drug';
  }

  onSubmitConsultation(): void {
    const q = this.activeQueue();
    if (!q || !q.id) return;

    const payload: Omit<Prescription, 'id'> = {
      patient_id: q.patient_id,
      queue_id: q.id,
      diagnosed_icd10: this.diagnosedIcd10(),
      soap_subjective: this.soapSubjective(),
      soap_objective: this.soapObjective(),
      soap_assessment: this.soapAssessment(),
      soap_plan: this.soapPlan(),
      items: this.prescribedItems()
    };

    this.emrService.createPrescription(payload).subscribe({
      next: () => {
        alert('บันทึกการวินิจฉัยและสั่งยาเรียบร้อย ส่งตัวคนไข้ไปห้องคลังยาเพื่อรับยา');
        this.loadData();
        this.closeConsultation();
      },
      error: (err) => alert('Error saving consultation: ' + err.message)
    });
  }
}
