import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginPage {
  private authService = inject(AuthService);

  public username = signal<string>('');
  public password = signal<string>('');
  public errorMessage = signal<string | null>(null);

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    const success = this.authService.login(this.username(), this.password());
    if (!success) {
      this.errorMessage.set('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ลองใช้ admin / password)');
    }
  }
}
