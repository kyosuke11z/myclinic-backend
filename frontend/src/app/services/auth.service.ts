import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_KEY = 'isAuthenticated';
  private readonly USER_KEY = 'username';

  // Reactively track authentication state with Signals
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<string | null>(null);

  constructor(private router: Router) {
    // Check initial state from localStorage
    const storedAuth = localStorage.getItem(this.AUTH_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedAuth === 'true' && storedUser) {
      this.isAuthenticated.set(true);
      this.currentUser.set(storedUser);
    }
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'password') {
      this.isAuthenticated.set(true);
      this.currentUser.set(username);
      localStorage.setItem(this.AUTH_KEY, 'true');
      localStorage.setItem(this.USER_KEY, username);
      this.router.navigate(['/']);
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }
}
