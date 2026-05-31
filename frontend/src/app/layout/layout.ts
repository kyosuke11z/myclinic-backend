import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html'
})
export class LayoutComponent {
  private authService = inject(AuthService);
  public syncService = inject(SyncService);
  
  public username = this.authService.currentUser;
  public userRole = this.authService.userRole;
  public staffName = this.authService.staffName;

  logout(): void {
    this.authService.logout();
  }
}
