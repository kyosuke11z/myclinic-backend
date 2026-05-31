import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './audit-logs.html'
})
export class AuditLogsPage implements OnInit {
  private analyticsService = inject(AnalyticsService);

  public logs = signal<any[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.analyticsService.getAuditLogs().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching audit logs:', err);
        this.isLoading.set(false);
      }
    });
  }
}
