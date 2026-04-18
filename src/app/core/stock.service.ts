import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export type StockQuote = {
  symbol: string;
  openPrice: number;
};

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  lookup(symbol: string): Observable<StockQuote> {
    const token = this.authService.token();
    if (!token) {
      return throwError(() => new Error('You must be logged in to lookup stocks.'));
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<StockQuote>(`/api/stocks/${encodeURIComponent(normalizedSymbol)}`, {
      headers,
    });
  }
}
