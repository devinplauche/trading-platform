import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

type Credentials = {
  username: string;
  password: string;
};

type AuthResponse = {
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'stock_lookup_token';
  private readonly tokenState = signal<string | null>(localStorage.getItem(this.storageKey));

  readonly token = computed(() => this.tokenState());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  signup(credentials: Credentials): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/signup', credentials).pipe(
      tap((response) => this.setToken(response.token)),
      map(() => undefined)
    );
  }

  login(credentials: Credentials): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => this.setToken(response.token)),
      map(() => undefined)
    );
  }

  logout(): Observable<void> {
    return this.http.post('/api/auth/logout', {}).pipe(
      catchError(() => of(null)),
      tap(() => {
        this.tokenState.set(null);
        localStorage.removeItem(this.storageKey);
        this.router.navigate(['/login']);
      }),
      map(() => undefined)
    );
  }

  private setToken(token: string): void {
    this.tokenState.set(token);
    localStorage.setItem(this.storageKey, token);
  }
}
