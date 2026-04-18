import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../core/auth.service';
import { AssetMarket, StockService } from '../core/stock.service';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const quote = {
    symbol: 'AAPL',
    currentPrice: 190.1,
    change: 2.35,
    percentChange: 1.25,
    highPrice: 191,
    lowPrice: 187.4,
    openPrice: 188,
    previousClose: 187.75,
    quoteTimestamp: 1713320000,
  };

  const authServiceStub = {
    logout: vi.fn().mockReturnValue(of(undefined)),
    token: () => 'token',
    isAuthenticated: () => true,
  };

  const stockServiceStub = {
    lookup: vi.fn().mockReturnValue(of(quote)),
    searchSymbols: vi.fn().mockReturnValue(of([])),
    getHistory: vi.fn().mockReturnValue(of([])),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: StockService, useValue: stockServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should search for a stock symbol', () => {
    component.form.setValue({ symbol: 'aapl' });

    component.onSearch();

    expect(stockServiceStub.lookup).toHaveBeenCalledWith('aapl', 'STOCK');
    expect(component.result()).toEqual(quote);
  });

  it('should switch to crypto mode and load crypto history', () => {
    component.setMarket('CRYPTO');

    expect(component.activeMarket()).toBe('CRYPTO');
    expect(stockServiceStub.getHistory).toHaveBeenLastCalledWith('CRYPTO');
  });

  it('should search for a crypto pair using the crypto market', () => {
    component.setMarket('CRYPTO');
    component.form.setValue({ symbol: 'BINANCE:BTCUSDT' });

    component.onSearch();

    expect(stockServiceStub.lookup).toHaveBeenLastCalledWith(
      'BINANCE:BTCUSDT',
      'CRYPTO' satisfies AssetMarket,
    );
  });

  it('should allow custom crypto pair suggestions when API search has no matches', () => {
    stockServiceStub.searchSymbols.mockReturnValue(of([]));
    component.setMarket('CRYPTO');

    component.onSymbolInput('kraken:btcusd');

    expect(component.suggestions()[0]).toEqual({
      symbol: 'KRAKEN:BTCUSD',
      description: 'Use this custom pair',
      type: 'Crypto Pair',
    });
  });

  it('should show a backend unavailable message when lookup fails to reach the server', () => {
    stockServiceStub.lookup.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })),
    );
    component.form.setValue({ symbol: 'aapl' });

    component.onSearch();

    expect(component.errorMessage()).toContain('backend is unavailable');
  });

  it('should show a history error when the backend is unavailable', () => {
    stockServiceStub.getHistory.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' })),
    );

    component.ngOnInit();

    expect(component.historyErrorMessage()).toContain('backend is unavailable');
  });

  it('should logout user', () => {
    component.onLogout();

    expect(authServiceStub.logout).toHaveBeenCalled();
  });
});
