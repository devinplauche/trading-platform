import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../core/auth.service';
import { StockService } from '../core/stock.service';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const authServiceStub = {
    logout: vi.fn().mockReturnValue(of(undefined)),
    token: () => 'token',
    isAuthenticated: () => true,
  };

  const stockServiceStub = {
    lookup: vi.fn().mockReturnValue(of({ symbol: 'AAPL', openPrice: 182.5 })),
  };

  beforeEach(async () => {
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

    expect(stockServiceStub.lookup).toHaveBeenCalledWith('aapl');
    expect(component.result()).toEqual({ symbol: 'AAPL', openPrice: 182.5 });
  });

  it('should logout user', () => {
    component.onLogout();

    expect(authServiceStub.logout).toHaveBeenCalled();
  });
});
