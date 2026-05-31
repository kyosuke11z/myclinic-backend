import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html'
})
export class LayoutComponent {
  private authService = inject(AuthService);
  
  public username = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
