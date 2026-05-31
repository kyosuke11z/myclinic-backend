import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, of } from 'rxjs';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  timestamp: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private http = inject(HttpClient);
  
  private readonly CACHE_KEY = 'myclinic_offline_queue';

  // Signals for reactive UI bindings
  public isOnline = signal<boolean>(navigator.onLine);
  public pendingSyncCount = signal<number>(0);
  public isSyncing = signal<boolean>(false);

  constructor() {
    this.updatePendingCount();
    
    // Listen to browser network changes
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // Periodic ping check every 15 seconds to ensure server is actually reachable
    setInterval(() => this.checkServerConnectivity(), 15000);

    // Reactive effect: Trigger sync automatically when online state changes to true
    effect(() => {
      if (this.isOnline() && this.pendingSyncCount() > 0 && !this.isSyncing()) {
        this.syncPendingActions();
      }
    });
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline.set(online);
    if (online) {
      this.checkServerConnectivity();
    }
  }

  // Ping backend server health endpoint
  public async checkServerConnectivity(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get('http://localhost:5000/', { responseType: 'text' }).pipe(
          catchError(() => of(null))
        )
      );
      const reachable = response !== null;
      this.isOnline.set(reachable);
      return reachable;
    } catch {
      this.isOnline.set(false);
      return false;
    }
  }

  // Retrieve cached offline actions
  public getOfflineQueue(): OfflineAction[] {
    const data = localStorage.getItem(this.CACHE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Cache write actions locally when offline
  public cacheAction(url: string, method: 'POST' | 'PUT' | 'DELETE', body: any, description: string): void {
    const queue = this.getOfflineQueue();
    const newAction: OfflineAction = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      method,
      body,
      timestamp: Date.now(),
      description
    };
    queue.push(newAction);
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(queue));
    this.updatePendingCount();
    console.warn(`[SyncService] Offline. Cached action: "${description}"`);
  }

  // Process and upload pending cache to backend
  public async syncPendingActions(): Promise<void> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    this.isSyncing.set(true);
    console.log(`[SyncService] Starting sync for ${queue.length} pending actions...`);

    // Sort chronologically (oldest first)
    queue.sort((a, b) => a.timestamp - b.timestamp);

    const remainingActions: OfflineAction[] = [];

    for (const action of queue) {
      try {
        // Execute request synchronously
        let req$: Observable<any>;
        if (action.method === 'POST') {
          req$ = this.http.post(action.url, action.body);
        } else if (action.method === 'PUT') {
          req$ = this.http.put(action.url, action.body);
        } else {
          req$ = this.http.delete(action.url);
        }

        // Attach authorization header if token exists
        const token = localStorage.getItem('isAuthenticated'); // In a real app we'd use HttpInterceptor
        await firstValueFrom(req$);
        console.log(`[SyncService] Successfully synced: "${action.description}"`);
      } catch (err) {
        console.error(`[SyncService] Failed to sync action: "${action.description}". Postponing.`, err);
        remainingActions.push(action);
      }
    }

    // Save remaining actions back to cache
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(remainingActions));
    this.updatePendingCount();
    this.isSyncing.set(false);
  }

  private updatePendingCount(): void {
    this.pendingSyncCount.set(this.getOfflineQueue().length);
  }
}
