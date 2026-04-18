import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../core/auth.service';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    token: () => string | null;
    isAuthenticated: () => boolean;
  };

  const routerStub = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    authService = {
      login: vi.fn().mockReturnValue(of(undefined)),
      token: () => null,
      isAuthenticated: () => false,
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call auth service when form is valid', () => {
    component.form.setValue({ username: 'alice', password: 'password123' });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ username: 'alice', password: 'password123' });
    expect(routerStub.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
