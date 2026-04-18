import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		loadComponent: () => import('./login/login').then((m) => m.Login),
	},
	{
		path: 'signup',
		loadComponent: () => import('./signup/signup').then((m) => m.Signup),
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
