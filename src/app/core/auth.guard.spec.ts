import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('should allow access when authenticated', () => {
    const authServiceStub = {
      isAuthenticated: () => true,
    };

    const routerStub = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('should redirect when not authenticated', () => {
    const redirectTree = {};
    const authServiceStub = {
      isAuthenticated: () => false,
    };

    const routerStub = {
      createUrlTree: vi.fn().mockReturnValue(redirectTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(redirectTree);
  });
});
