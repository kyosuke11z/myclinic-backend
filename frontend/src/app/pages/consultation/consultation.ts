import { Component, OnInit, inject, signal, computed, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QueueService, QueueEntry } from '../../services/queue.service';
import { EmrService, PrescriptionItem, Prescription } from '../../services/emr.service';
import { PharmacyService, DrugItem } from '../../services/pharmacy.service';
import { SyncService } from '../../services/sync.service';

// Advanced Standalone imports for clinical workspace
import { EmrHistoryComponent } from './emr-history';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [FormsModule, EmrHistoryComponent],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationPage implements OnInit {
  private queueService = inject(QueueService);
  private emrService = inject(EmrService);
  private pharmacyService = inject(PharmacyService);
  public syncService = inject(SyncService);
  private elementRef = inject(ElementRef);

  public queues = signal<QueueEntry[]>([]);
  public drugs = signal<DrugItem[]>([]);
  public isLoading = signal<boolean>(true);
  public isConsultationOpen = signal<boolean>(false);
  public activeQueue = signal<QueueEntry | null>(null);

  // EMR History states
  public patientHistory = signal<any>(null);

  // Consult form states
  public diagnosedIcd10 = signal<string>('J02.9 (Acute pharyngitis, unspecified)');
  public soapSubjective = signal<string>('');
  public soapObjective = signal<string>('');
  public soapAssessment = signal<string>('');
  public soapPlan = signal<string>('');

  // Prescription Rx items lists
  public prescribedItems = signal<PrescriptionItem[]>([]);

  // Drug selector inputs & Autocomplete suggestion states
  public selectedDrugId = signal<number>(0);
  public selectedQty = signal<number>(10);
  public dosageInstructions = signal<string>('รับประทานครั้งละ 1 เม็ด เช้า-เย็น หลังอาหารทันที');

  // Minimalist Autocomplete signals
  public drugSearchQuery = signal<string>('');
  public showSearchResults = signal<boolean>(false);

  // Compute suggestions reactively based on query string
  public filteredDrugs = computed(() => {
    const query = this.drugSearchQuery().toLowerCase().trim();
    if (!query) return [];
    return this.drugs().filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.code.toLowerCase().includes(query) ||
      d.drug_family.toLowerCase().includes(query)
    );
  });

  // Filter queues waiting for doctor consultation
  public doctorQueues = computed(() => 
    this.queues().filter(q => q.status === 'Waiting_Doctor')
  );

  @HostListener('document:click', ['$event'])
  clickout(event: any): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSearchResults.set(false);
    }
  }

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
    this.soapSubjective.set('คนไข้บ่นมีอาการคัดจมูก มีน้ำมูก และเจ็บคอสะสมมาประมาณ 2 วัน');
    this.soapObjective.set(`ลำคอแดงเล็กน้อย ไม่มีหนองบวมพุพอง อุณหภูมิร่างกายปกติ`);
    this.soapAssessment.set('คอและช่องจมูกส่วนบนอักเสบเฉียบพลัน');
    this.soapPlan.set('สั่งยากลุ่มแก้อักเสบและยาลดน้ำมูก พร้อมให้คนไข้ดื่มน้ำอุ่นพักผ่อนให้เพียงพอ');
    this.diagnosedIcd10.set('J02.9 (Acute pharyngitis, unspecified)');
    
    // Clear search autocomplete state
    this.drugSearchQuery.set('');
    this.showSearchResults.set(false);
    this.selectedDrugId.set(0);

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

  // Reactive pre-guard validators used directly in drug suggest box
  checkAllergyConflict(drug: any): boolean {
    const allergies = this.patientHistory()?.patient?.allergies;
    if (!allergies || allergies === 'ไม่มี') return false;
    return allergies.toLowerCase().trim() === drug.drug_family.toLowerCase().trim();
  }

  checkPregnancyConflict(drug: any): boolean {
    const pregnancy = this.patientHistory()?.patient?.pregnancy_status;
    if (pregnancy !== 'Pregnant') return false;
    return drug.pregnancy_category === 'X' || drug.pregnancy_category === 'D';
  }

  checkKidneyConflict(drug: any): boolean {
    if (drug.drug_family !== 'NSAIDs') return false;
    const vitals = this.patientHistory()?.vitals?.[0];
    return vitals && vitals.creatinine > 1.5;
  }

  checkLowStock(drug: any): boolean {
    return drug.stock_quantity <= drug.reorder_level;
  }

  onSearchQueryChange(val: string): void {
    this.drugSearchQuery.set(val);
    this.showSearchResults.set(val.trim().length > 0);
  }

  selectDrugFromSuggestion(drug: DrugItem): void {
    this.selectedDrugId.set(drug.id!);
    this.drugSearchQuery.set(drug.name);
    this.showSearchResults.set(false);
  }

  addDrugToRx(): void {
    const drugId = Number(this.selectedDrugId());
    if (!drugId) return;

    const drug = this.drugs().find(d => d.id === drugId);
    if (!drug) return;

    const existing = this.prescribedItems().find(item => item.drug_id === drugId);
    if (existing) {
      alert('⚠️ ยารายการนี้ถูกสั่งจ่ายเพิ่มเติมลงในบิลคิวนี้เรียบร้อยแล้วค่ะ');
      return;
    }

    // --- HIGH-UX CLINICAL BLOCKS (Double Lock Security Checks) ---
    if (this.checkAllergyConflict(drug)) {
      alert(`🚫 ห้ามสั่งจ่ายยาตัวนี้เด็ดขาด!\n\nคนไข้มีประวัติระบุแพ้ยากลุ่ม "${this.patientHistory()?.patient?.allergies}" ซึ่งเป็นตระกูลเดียวกับยา "${drug.name}" กรุณาเปลี่ยนเป็นตัวยาตระกูลอื่นแทนเพื่อความปลอดภัยสูงสุดค่ะ`);
      return;
    }

    if (this.checkPregnancyConflict(drug)) {
      alert(`🚫 ห้ามสั่งจ่ายยาตัวนี้เด็ดขาด!\n\nคนไข้กำลังตั้งครรภ์ และยา "${drug.name}" เป็นยาหมวด Category ${drug.pregnancy_category} ซึ่งอันตรายและอาจทำให้เด็กในครรภ์พิการได้ค่ะ`);
      return;
    }

    if (this.checkKidneyConflict(drug)) {
      alert(`🚫 ห้ามสั่งจ่ายยาตัวนี้เด็ดขาด!\n\nคนไข้มียอด Creatinine สูงวิกฤต (${this.patientHistory()?.vitals?.[0]?.creatinine} mg/dL) ห้ามจ่ายยากลุ่ม NSAIDs เด็ดขาดเนื่องจากเป็นพิษร้ายต่อไตค่ะ`);
      return;
    }

    // Add Rx item if passed all clinical block rules
    this.prescribedItems.set([
      ...this.prescribedItems(),
      {
        drug_id: drugId,
        quantity: this.selectedQty(),
        dosage_instructions: this.dosageInstructions()
      }
    ]);

    // Clean suggestion state and search input for smooth next selection
    this.selectedDrugId.set(0);
    this.drugSearchQuery.set('');
    this.showSearchResults.set(false);
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
        alert('บันทึกผลการวินิจฉัยและส่งใบสั่งยาเรียบร้อย ส่งคิวคนไข้ไปยังจุดห้องคลังยา');
        this.loadData();
        this.closeConsultation();
      },
      error: (err) => alert('เกิดข้อผิดพลาดในการบันทึกตรวจรักษา: ' + err.message)
    });
  }
}
