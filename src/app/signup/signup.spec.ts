import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../core/auth.service';

import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authService: {
    signup: ReturnType<typeof vi.fn>;
    token: () => string | null;
    isAuthenticated: () => boolean;
  };

  const routerStub = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    authService = {
      signup: vi.fn().mockReturnValue(of(undefined)),
      token: () => null,
      isAuthenticated: () => false,
    };

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call signup when form is valid', () => {
    component.form.setValue({ username: 'newuser', password: 'password123' });

    component.onSubmit();

    expect(authService.signup).toHaveBeenCalledWith({ username: 'newuser', password: 'password123' });
    expect(routerStub.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
