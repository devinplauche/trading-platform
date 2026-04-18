import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { StockQuote, StockService } from '../core/stock.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stockService = inject(StockService);
  readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    symbol: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(8)]],
  });

  readonly isSearching = signal(false);
  readonly errorMessage = signal('');
  readonly result = signal<StockQuote | null>(null);

  onSearch(): void {
    if (this.form.invalid || this.isSearching()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSearching.set(true);
    this.errorMessage.set('');
    this.result.set(null);

    const { symbol } = this.form.getRawValue();

    this.stockService
      .lookup(symbol)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => {
          this.isSearching.set(false);
          this.result.set(quote);
        },
        error: () => {
          this.isSearching.set(false);
          this.errorMessage.set('Unable to retrieve stock data right now.');
        },
      });
  }

  onLogout(): void {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
