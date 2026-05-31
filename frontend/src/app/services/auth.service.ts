import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly AUTH_KEY = 'isAuthenticated';
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'username';
  private readonly ROLE_KEY = 'userRole';
  private readonly NAME_KEY = 'userName';

  private readonly apiUrl = 'http://localhost:5000/auth/login';

  // Signals
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<string | null>(null);
  public userRole = signal<string | null>(null);
  public staffName = signal<string | null>(null);

  constructor() {
    const storedAuth = localStorage.getItem(this.AUTH_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);
    const storedRole = localStorage.getItem(this.ROLE_KEY);
    const storedName = localStorage.getItem(this.NAME_KEY);

    if (storedAuth === 'true' && storedUser && storedRole) {
      this.isAuthenticated.set(true);
      this.currentUser.set(storedUser);
      this.userRole.set(storedRole);
      this.staffName.set(storedName);
    }
  }

  // Retrieve HTTP Headers with JWT Token
  public getAuthHeaders() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Direct login call to backend
      const response: any = await firstValueFrom(
        this.http.post(this.apiUrl, { username, password })
      );

      if (response && response.token) {
        this.setSession(response.token, response.user);
        this.router.navigate(['/']);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend login failed. Trying offline fallback...');
      
      // Offline fallback: verify against local mock roles (standard mock accounts)
      const mockAccounts: Record<string, { role: string, name: string }> = {
        'admin': { role: 'Admin', name: 'นพ. วิทยา ผู้บริหาร' },
        'doctor1': { role: 'Doctor', name: 'พญ. นรี ดำรงศักดิ์' },
        'doctor2': { role: 'Doctor', name: 'นพ. วรุตม์ แสงธรรม' },
        'nurse1': { role: 'Nurse', name: 'นส. สมศรี รักพยาบาล' },
        'pharmacist1': { role: 'Pharmacist', name: 'นาย สุขดี คุมห้องยา' },
        'cashier1': { role: 'Cashier', name: 'นาง จอมขวัญ บิลเงิน' }
      };

      if (mockAccounts[username] && password === 'password') {
        const mockUser = {
          id: 0,
          username,
          role: mockAccounts[username].role,
          name: mockAccounts[username].name
        };
        this.setSession('MOCK_OFFLINE_TOKEN', mockUser);
        this.router.navigate(['/']);
        return true;
      }

      return false;
    }
  }

  private setSession(token: string, user: any) {
    this.isAuthenticated.set(true);
    this.currentUser.set(user.username);
    this.userRole.set(user.role);
    this.staffName.set(user.name);

    localStorage.setItem(this.AUTH_KEY, 'true');
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, user.username);
    localStorage.setItem(this.ROLE_KEY, user.role);
    localStorage.setItem(this.NAME_KEY, user.name);
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.userRole.set(null);
    this.staffName.set(null);

    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.NAME_KEY);
    
    this.router.navigate(['/login']);
  }
}
