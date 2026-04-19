import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type AssetMarket = 'STOCK' | 'CRYPTO';

export type StockQuote = {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  quoteTimestamp: number;
};

export type SymbolSuggestion = {
  symbol: string;
  description: string;
  type: string;
};

export type SearchHistoryItem = {
  symbol: string;
  searchedAt: string;
  assetType: AssetMarket;
};

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  lookup(symbol: string, market: AssetMarket): Observable<StockQuote> {
    const token = this.authService.token();
    if (!token) {
      return throwError(() => new Error('You must be logged in to lookup stocks.'));
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const headers = this.authHeaders(token);

    return this.http.get<StockQuote>(`${environment.apiBaseUrl}/api/stocks/${encodeURIComponent(normalizedSymbol)}`, {
      headers,
      params: { market },
    });
  }

  searchSymbols(query: string, market: AssetMarket): Observable<SymbolSuggestion[]> {
    const token = this.authService.token();
    if (!token) {
      return throwError(() => new Error('You must be logged in to search symbols.'));
    }

    const headers = this.authHeaders(token);

    return this.http.get<SymbolSuggestion[]>(`${environment.apiBaseUrl}/api/stocks/search`, {
      headers,
      params: { query: query.trim(), market },
    });
  }

  getHistory(market: AssetMarket): Observable<SearchHistoryItem[]> {
    const token = this.authService.token();
    if (!token) {
      return throwError(() => new Error('You must be logged in to load search history.'));
    }

    const headers = this.authHeaders(token);
    return this.http.get<SearchHistoryItem[]>(`${environment.apiBaseUrl}/api/stocks/history`, {
      headers,
      params: { market },
    });
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
