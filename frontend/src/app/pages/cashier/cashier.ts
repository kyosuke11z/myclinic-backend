import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { SyncService } from '../../services/sync.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './cashier.html'
})
export class CashierPage implements OnInit {
  private billingService = inject(BillingService);
  public syncService = inject(SyncService);

  public pendingBills = signal<any[]>([]);
  public isLoading = signal<boolean>(true);
  public isModalOpen = signal<boolean>(false);
  public activeBill = signal<any | null>(null);

  // POS payment form states
  public discount = signal<number>(0);
  public paymentMethod = signal<'Cash' | 'Credit' | 'QR' | 'Insurance'>('Cash');
  public paidAmount = signal<number>(0);

  // Compute final net total dynamically
  public netTotal = computed(() => {
    const bill = this.activeBill();
    if (!bill) return 0;
    const finalVal = bill.total_amount - this.discount();
    return finalVal < 0 ? 0 : finalVal;
  });

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.isLoading.set(true);
    this.billingService.getPendingBills().subscribe({
      next: (data) => {
        this.pendingBills.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching billing queue:', err);
        this.isLoading.set(false);
      }
    });
  }

  openCheckoutModal(bill: any): void {
    this.activeBill.set(bill);
    this.discount.set(0);
    this.paymentMethod.set('Cash');
    this.paidAmount.set(bill.total_amount); // Default paid amount to total
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onDiscountChange(val: number): void {
    this.discount.set(val);
    // Automatically update paid amount to match net total
    this.paidAmount.set(this.netTotal());
  }

  onCompleteCheckout(): void {
    const bill = this.activeBill();
    if (!bill || !bill.id) return;

    if (this.paidAmount() < this.netTotal() && this.paymentMethod() !== 'Insurance') {
      alert('ยอดรับเงินน้อยกว่ายอดสุทธิที่ค้างชำระ!');
      return;
    }

    const payload = {
      payment_method: this.paymentMethod(),
      discount: this.discount(),
      paid_amount: this.paidAmount()
    };

    this.billingService.payBill(bill.id, payload).subscribe({
      next: () => {
        alert('ชำระเงินและปิดบิลสำเร็จ พิมพ์ใบเสร็จและปล่อยคิวเรียบร้อย');
        this.loadBills();
        this.closeModal();
      },
      error: (err) => alert('เกิดข้อผิดพลาดในการปิดบิล: ' + err.message)
    });
  }
}
