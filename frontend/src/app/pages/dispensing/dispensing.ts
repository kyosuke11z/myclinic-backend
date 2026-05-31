import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PharmacyService, DrugItem } from '../../services/pharmacy.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-dispensing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dispensing.html'
})
export class DispensingPage implements OnInit {
  private pharmacyService = inject(PharmacyService);
  public syncService = inject(SyncService);

  public pendingPrescriptions = signal<any[]>([]);
  public drugs = signal<DrugItem[]>([]);
  public isLoading = signal<boolean>(true);
  
  // Dispense modal states
  public isDispenseModalOpen = signal<boolean>(false);
  public activePrescription = signal<any | null>(null);

  // New Drug Form states
  public isDrugModalOpen = signal<boolean>(false);
  public newDrug = signal<Omit<DrugItem, 'id'>>({
    code: '',
    name: '',
    type: 'Tablet',
    stock_quantity: 100,
    reorder_level: 20,
    expiry_date: '',
    price_per_unit: 5.0
  });

  // Computed alert stats
  public lowStockCount = computed(() => 
    this.drugs().filter(d => d.stock_quantity <= d.reorder_level).length
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.pharmacyService.getPendingPrescriptions().subscribe({
      next: (prData) => {
        this.pendingPrescriptions.set(prData);
        
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

  openDispenseModal(pr: any): void {
    this.activePrescription.set(pr);
    this.isDispenseModalOpen.set(true);
  }

  closeDispenseModal(): void {
    this.isDispenseModalOpen.set(false);
  }

  onConfirmDispensing(): void {
    const pr = this.activePrescription();
    if (!pr || !pr.id) return;

    this.pharmacyService.dispensePrescription(pr.id).subscribe({
      next: () => {
        alert('จ่ายยาเรียบร้อย ส่งคิวคนไข้ไปยังโต๊ะการเงิน/แคชเชียร์');
        this.loadData();
        this.closeDispenseModal();
      },
      error: (err) => alert('เกิดข้อผิดพลาดในการจ่ายยา: ' + err.message)
    });
  }

  openAddDrugModal(): void {
    this.newDrug.set({
      code: `DRG${String(this.drugs().length + 1).padStart(3, '0')}`,
      name: '',
      type: 'Tablet',
      stock_quantity: 100,
      reorder_level: 20,
      expiry_date: '2028-12-31',
      price_per_unit: 5.0
    });
    this.isDrugModalOpen.set(true);
  }

  closeDrugModal(): void {
    this.isDrugModalOpen.set(false);
  }

  onSaveDrug(): void {
    const data = this.newDrug();
    if (!data.name || !data.code || data.price_per_unit === undefined) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    this.pharmacyService.createDrug(data).subscribe({
      next: () => {
        alert('บันทึกเพิ่มยาเข้าระบบคลังสำเร็จ');
        this.loadData();
        this.closeDrugModal();
      },
      error: (err) => alert('Error saving drug: ' + err.message)
    });
  }

  addStockCount(drug: DrugItem): void {
    const amount = Number(prompt('ป้อนจำนวนยาที่จะเพิ่มเข้าคลัง:', '100'));
    if (!amount || isNaN(amount)) return;

    const payload = {
      stock_quantity: drug.stock_quantity + amount
    };

    this.pharmacyService.updateDrug(drug.id!, payload).subscribe({
      next: () => {
        alert('เติมสต็อกยาสำเร็จ');
        this.loadData();
      },
      error: (err) => alert('Error adding stock: ' + err.message)
    });
  }
}
