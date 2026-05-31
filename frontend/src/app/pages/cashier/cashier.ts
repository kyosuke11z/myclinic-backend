import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { SyncService } from '../../services/sync.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './cashier.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // Split-Billing & Coverage States (MyClinic Pro Enterprise)
  public coverageRight = signal<'Self' | 'UCS' | 'SSS' | 'CGD' | 'Private'>('Self');
  public coveredAmount = signal<number>(0);

  // Compute final net total dynamically
  public netTotal = computed(() => {
    const bill = this.activeBill();
    if (!bill) return 0;
    const finalVal = bill.total_amount - this.discount();
    return finalVal < 0 ? 0 : finalVal;
  });

  // Patient Co-pay part = Net total - Government/Insurance covered amount
  public patientCoPay = computed(() => {
    const coPay = this.netTotal() - this.coveredAmount();
    return coPay < 0 ? 0 : coPay;
  });

  // Calculate change due for patient
  public changeDue = computed(() => {
    const due = this.patientCoPay();
    const paid = this.paidAmount();
    return paid > due ? paid - due : 0;
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
    this.coverageRight.set('Self');
    this.coveredAmount.set(0);
    this.paymentMethod.set('Cash');
    this.paidAmount.set(bill.total_amount); // Default paid amount to total
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onDiscountChange(val: number): void {
    this.discount.set(val);
    this.recalculateCoverage();
  }

  onCoverageRightChange(val: 'Self' | 'UCS' | 'SSS' | 'CGD' | 'Private'): void {
    this.coverageRight.set(val);
    this.recalculateCoverage();
  }

  onCoveredAmountChange(val: number): void {
    const net = this.netTotal();
    const cleanVal = val > net ? net : (val < 0 ? 0 : val);
    this.coveredAmount.set(cleanVal);
    this.paidAmount.set(this.patientCoPay());
  }

  private recalculateCoverage(): void {
    const net = this.netTotal();
    const scheme = this.coverageRight();

    let cover = 0;
    if (scheme === 'Self') {
      cover = 0;
    } else if (scheme === 'UCS') {
      // บัตรทอง 30 บาท: Cover everything except 30 Baht co-pay
      cover = net > 30 ? net - 30 : 0;
    } else if (scheme === 'SSS') {
      // ประกันสังคม: Cover 80% up to 500 Baht
      const expected = Math.round(net * 0.8 * 100) / 100;
      cover = expected > 500 ? 500 : expected;
    } else if (scheme === 'CGD') {
      // สิทธิ์ข้าราชการเบิกตรง: Cover 100%
      cover = net;
    } else if (scheme === 'Private') {
      // ประกันเอกชนเคลมตรง: Cover 80% of net total
      cover = Math.round(net * 0.8 * 100) / 100;
    }

    this.coveredAmount.set(cover);
    this.paidAmount.set(this.patientCoPay());
  }

  onCompleteCheckout(): void {
    const bill = this.activeBill();
    if (!bill || !bill.id) return;

    const due = this.patientCoPay();
    if (this.paidAmount() < due && this.paymentMethod() !== 'Insurance') {
      alert('ยอดรับเงินน้อยกว่ายอดร่วมจ่ายของคนไข้!');
      return;
    }

    // Prepare payload.
    // If there is government/scheme coverage, the main resolved method is recorded as Insurance/Scheme.
    // Otherwise, it is the direct payment method of the patient.
    const payload = {
      payment_method: this.coveredAmount() > 0 ? 'Insurance' : this.paymentMethod(),
      discount: this.discount(),
      paid_amount: this.netTotal() // Send full net total as resolved so that backend validates it successfully
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
