import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { isBackendUnavailable } from '../core/backend-error';
import {
  AssetMarket,
  SearchHistoryItem,
  StockQuote,
  StockService,
  SymbolSuggestion,
} from '../core/stock.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  readonly cryptoQuickPicks: ReadonlyArray<SymbolSuggestion> = [
    { symbol: 'BINANCE:BTCUSDT', description: 'Bitcoin / Tether', type: 'Crypto' },
    { symbol: 'BINANCE:ETHUSDT', description: 'Ethereum / Tether', type: 'Crypto' },
    { symbol: 'BINANCE:SOLUSDT', description: 'Solana / Tether', type: 'Crypto' },
  ];

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stockService = inject(StockService);
  readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    symbol: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(24)]],
  });

  readonly activeMarket = signal<AssetMarket>('STOCK');
  readonly isSearching = signal(false);
  readonly isLoadingSuggestions = signal(false);
  readonly isLoadingHistory = signal(false);
  readonly errorMessage = signal('');
  readonly historyErrorMessage = signal('');
  readonly result = signal<StockQuote | null>(null);
  readonly suggestions = signal<SymbolSuggestion[]>([]);
  readonly history = signal<SearchHistoryItem[]>([]);
  readonly hasHistory = computed(() => this.history().length > 0);
  readonly pageTitle = computed(() =>
    this.activeMarket() === 'CRYPTO' ? 'Crypto Lookup' : 'Stock Lookup',
  );
  readonly pageDescription = computed(() =>
    this.activeMarket() === 'CRYPTO'
      ? 'Track major trading pairs, scan crypto-specific matches, and keep a dedicated digital-asset history.'
      : 'Search symbols fast, view richer quote details, and revisit recent equity lookups.',
  );
  readonly lookupTitle = computed(() =>
    this.activeMarket() === 'CRYPTO' ? 'Search Crypto Pair' : 'Search Symbol',
  );
  readonly inputLabel = computed(() =>
    this.activeMarket() === 'CRYPTO' ? 'Crypto pair' : 'Stock symbol',
  );
  readonly inputPlaceholder = computed(() =>
    this.activeMarket() === 'CRYPTO' ? 'BINANCE:BTCUSDT' : 'AAPL',
  );
  readonly submitLabel = computed(() =>
    this.isSearching()
      ? 'Searching...'
      : this.activeMarket() === 'CRYPTO'
        ? 'Lookup Crypto'
        : 'Lookup Stock',
  );
  readonly historyTitle = computed(() =>
    this.activeMarket() === 'CRYPTO' ? 'Recent Crypto Searches' : 'Recent Stock Searches',
  );
  readonly emptyHistoryMessage = computed(() =>
    this.activeMarket() === 'CRYPTO'
      ? 'No crypto searches yet. Lookup a pair to build your digital-asset history.'
      : 'No recent searches yet. Lookup a symbol to build history.',
  );

  ngOnInit(): void {
    this.loadHistory();
  }

  setMarket(market: AssetMarket): void {
    if (this.activeMarket() === market) {
      return;
    }

    this.activeMarket.set(market);
    this.form.patchValue({ symbol: '' });
    this.errorMessage.set('');
    this.historyErrorMessage.set('');
    this.result.set(null);
    this.suggestions.set([]);
    this.loadHistory();
  }

  onSymbolInput(value: string): void {
    const query = value.trim();
    if (query.length < 1) {
      this.suggestions.set([]);
      return;
    }

    this.isLoadingSuggestions.set(true);
    this.stockService
      .searchSymbols(query, this.activeMarket())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.isLoadingSuggestions.set(false);
          this.suggestions.set(this.withCustomCryptoSuggestion(query, results));
        },
        error: () => {
          this.isLoadingSuggestions.set(false);
          this.suggestions.set([]);
        },
      });
  }

  selectSuggestion(suggestion: SymbolSuggestion): void {
    this.form.patchValue({ symbol: suggestion.symbol });
    this.suggestions.set([]);
    this.onSearch();
  }

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
      .lookup(symbol, this.activeMarket())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => {
          this.isSearching.set(false);
          this.result.set(quote);
          this.suggestions.set([]);
          this.loadHistory();
        },
        error: (error: unknown) => {
          this.isSearching.set(false);
          this.errorMessage.set(
            this.lookupErrorMessage(error),
          );
        },
      });
  }

  onLogout(): void {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.historyErrorMessage.set('');
    this.stockService
      .getHistory(this.activeMarket())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.isLoadingHistory.set(false);
          this.history.set(items);
        },
        error: (error: unknown) => {
          this.isLoadingHistory.set(false);
          this.history.set([]);
          this.historyErrorMessage.set(
            isBackendUnavailable(error)
              ? `Cannot load recent ${this.marketLabel()} searches because the backend is unavailable.`
              : `Unable to load recent ${this.marketLabel()} searches right now.`,
          );
        },
      });
  }

  private lookupErrorMessage(error: unknown): string {
    if (isBackendUnavailable(error)) {
      return `Cannot retrieve ${this.marketLabel()} data because the backend is unavailable. Start the server and try again.`;
    }

    return this.activeMarket() === 'CRYPTO'
      ? 'Unable to retrieve crypto data right now.'
      : 'Unable to retrieve stock data right now.';
  }

  private marketLabel(): string {
    return this.activeMarket() === 'CRYPTO' ? 'crypto' : 'stock';
  }

  private withCustomCryptoSuggestion(
    query: string,
    results: ReadonlyArray<SymbolSuggestion>,
  ): SymbolSuggestion[] {
    if (this.activeMarket() !== 'CRYPTO') {
      return [...results];
    }

    const normalizedQuery = query.trim().toUpperCase();
    if (normalizedQuery.length < 3) {
      return [...results];
    }

    const alreadyPresent = results.some(
      (item) => item.symbol.trim().toUpperCase() === normalizedQuery,
    );
    if (alreadyPresent) {
      return [...results];
    }

    const customPairSuggestion: SymbolSuggestion = {
      symbol: normalizedQuery,
      description: 'Use this custom pair',
      type: 'Crypto Pair',
    };

    return [customPairSuggestion, ...results];
  }
}
