describe('Stock Lookup E2E (Cypress)', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('signs up and lands on dashboard', () => {
    cy.intercept('POST', '/api/auth/signup', {
      statusCode: 201,
      body: { token: 'fake-signup-token' },
    }).as('signup');

    cy.intercept('GET', '/api/stocks/history*', (req) => {
      expect(req.headers.authorization).to.eq('Bearer fake-signup-token');
      expect(req.query.market).to.eq('STOCK');
      req.reply({ statusCode: 200, body: [] });
    }).as('history');

    cy.visit('/signup');
    cy.get('[data-testid="signup-username"]').type('newuser', { force: true });
    cy.get('[data-testid="signup-password"]').type('password123', { force: true });
    cy.get('[data-testid="signup-submit"]').click({ force: true });

    cy.wait('@signup');
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-title"]').should('contain.text', 'Stock Lookup');
  });

  it('logs in, performs predictive search, and displays quote details', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-login-token' },
    }).as('login');

    let historyCalls = 0;
    cy.intercept('GET', '/api/stocks/history*', (req) => {
      expect(req.headers.authorization).to.eq('Bearer fake-login-token');
      expect(req.query.market).to.eq('STOCK');
      historyCalls += 1;

      if (historyCalls === 1) {
        req.reply({ statusCode: 200, body: [] });
        return;
      }

      req.reply({
        statusCode: 200,
        body: [{ symbol: 'AAPL', searchedAt: '2026-04-17T20:30:00Z', assetType: 'STOCK' }],
      });
    }).as('history');

    cy.intercept('GET', '/api/stocks/search*', {
      statusCode: 200,
      body: [
        { symbol: 'AAPL', description: 'Apple Inc', type: 'Common Stock' },
        { symbol: 'AAPB', description: 'GraniteShares 2x Long AAPL', type: 'ETF' },
      ],
    }).as('searchSymbols');

    cy.intercept('GET', '/api/stocks/AAPL*', (req) => {
      expect(req.query.market).to.eq('STOCK');
      req.reply({
        statusCode: 200,
        body: {
          symbol: 'AAPL',
          currentPrice: 190.1,
          change: 2.35,
          percentChange: 1.25,
          highPrice: 191.0,
          lowPrice: 187.4,
          openPrice: 188.0,
          previousClose: 187.75,
          quoteTimestamp: 1713320000,
        },
      });
    }).as('lookup');

    cy.visit('/login');
    cy.get('[data-testid="login-username"]').type('alice', { force: true });
    cy.get('[data-testid="login-password"]').type('password123', { force: true });
    cy.get('[data-testid="login-submit"]').click({ force: true });

    cy.wait('@login');
    cy.url().should('include', '/dashboard');

    cy.get('[data-testid="dashboard-symbol-input"]').clear().type('AAP');
    cy.wait('@searchSymbols');
    cy.get('[data-testid="dashboard-suggestion"]').first().click();

    cy.wait('@lookup');
    cy.wait('@history');

    cy.get('[data-testid="dashboard-result-symbol"]').should('contain.text', 'AAPL');
    cy.get('[data-testid="dashboard-result-price"]').should('contain.text', '$190.10');
    cy.get('[data-testid="dashboard-metric-open"]').should('contain.text', '$188.00');
    cy.get('[data-testid="dashboard-history-item"]').first().should('contain.text', 'AAPL');
  });

  it('shows clear error when username is already taken on signup', () => {
    cy.intercept('POST', '/api/auth/signup', {
      statusCode: 400,
      body: {},
    }).as('signupTaken');

    cy.visit('/signup');
    cy.get('[data-testid="signup-username"]').type('devinplauche@gmail.com', { force: true });
    cy.get('[data-testid="signup-password"]').type('password123', { force: true });
    cy.get('[data-testid="signup-submit"]').click({ force: true });

    cy.wait('@signupTaken');
    cy.get('[data-testid="signup-error"]').should('contain.text', 'Signup failed');
    cy.url().should('include', '/signup');
  });

  it('shows login error for invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {},
    }).as('loginFailure');

    cy.visit('/login');
    cy.get('[data-testid="login-username"]').type('devinplauche@gmail.com', { force: true });
    cy.get('[data-testid="login-password"]').type('wrong-password', { force: true });
    cy.get('[data-testid="login-submit"]').click({ force: true });

    cy.wait('@loginFailure');
    cy.get('[data-testid="login-error"]').should('contain.text', 'Login failed');
    cy.url().should('include', '/login');
  });

  it('allows user to recover by signing in after duplicate-signup response', () => {
    cy.intercept('POST', '/api/auth/signup', {
      statusCode: 400,
      body: {},
    }).as('signupTaken');

    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'existing-user-token' },
    }).as('loginSuccess');

    cy.intercept('GET', '/api/stocks/history*', (req) => {
      expect(req.query.market).to.eq('STOCK');
      req.reply({
        statusCode: 200,
        body: [{ symbol: 'AAPL', searchedAt: '2026-04-17T20:30:00Z', assetType: 'STOCK' }],
      });
    }).as('history');

    cy.visit('/signup');
    cy.get('[data-testid="signup-username"]').type('devinplauche@gmail.com', { force: true });
    cy.get('[data-testid="signup-password"]').type('password123', { force: true });
    cy.get('[data-testid="signup-submit"]').click({ force: true });
    cy.wait('@signupTaken');

    cy.contains('Sign in').click({ force: true });
    cy.url().should('include', '/login');

    cy.get('[data-testid="login-username"]').clear().type('devinplauche@gmail.com', { force: true });
    cy.get('[data-testid="login-password"]').clear().type('password123', { force: true });
    cy.get('[data-testid="login-submit"]').click({ force: true });

    cy.wait('@loginSuccess');
    cy.wait('@history');
    cy.url().should('include', '/dashboard');
  });

  it('keeps the market tabs centered on the dashboard', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'center-test-token' },
    }).as('login');

    cy.intercept('GET', '/api/stocks/history*', {
      statusCode: 200,
      body: [],
    }).as('history');

    cy.visit('/login');
    cy.get('[data-testid="login-username"]').type('alice', { force: true });
    cy.get('[data-testid="login-password"]').type('password123', { force: true });
    cy.get('[data-testid="login-submit"]').click({ force: true });

    cy.wait('@login');
    cy.wait('@history');
    cy.url().should('include', '/dashboard');

    cy.get('[aria-label="Market selector"]').should('be.visible');
    cy.get('[aria-label="Market selector"]').then(($tabs) => {
      const tabsRect = $tabs[0].getBoundingClientRect();
      cy.window().then((win) => {
        const viewportCenter = win.innerWidth / 2;
        const tabsCenter = tabsRect.left + tabsRect.width / 2;
        expect(Math.abs(tabsCenter - viewportCenter)).to.be.lessThan(24);
      });
    });
  });

  it('looks up Bitcoin then Eth with custom crypto pairs and shows both in crypto history', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'crypto-flow-token' },
    }).as('login');

    let cryptoHistoryCalls = 0;
    cy.intercept('GET', '/api/stocks/history*', (req) => {
      if (req.query.market !== 'CRYPTO') {
        req.reply({ statusCode: 200, body: [] });
        return;
      }

      cryptoHistoryCalls += 1;
      if (cryptoHistoryCalls === 1) {
        req.reply({ statusCode: 200, body: [] });
        return;
      }

      if (cryptoHistoryCalls === 2) {
        req.reply({
          statusCode: 200,
          body: [
            {
              symbol: 'KRAKEN:BTCUSD',
              searchedAt: '2026-04-17T21:10:00Z',
              assetType: 'CRYPTO',
            },
          ],
        });
        return;
      }

      req.reply({
        statusCode: 200,
        body: [
          {
            symbol: 'KRAKEN:ETHUSD',
            searchedAt: '2026-04-17T21:11:00Z',
            assetType: 'CRYPTO',
          },
          {
            symbol: 'KRAKEN:BTCUSD',
            searchedAt: '2026-04-17T21:10:00Z',
            assetType: 'CRYPTO',
          },
        ],
      });
    }).as('cryptoHistory');

    cy.intercept('GET', '/api/stocks/search*', (req) => {
      expect(req.query.market).to.eq('CRYPTO');
      req.reply({ statusCode: 200, body: [] });
    }).as('cryptoSearch');

    cy.intercept('GET', '/api/stocks/KRAKEN%3ABTCUSD*', (req) => {
      expect(req.query.market).to.eq('CRYPTO');
      req.reply({
        statusCode: 200,
        body: {
          symbol: 'KRAKEN:BTCUSD',
          currentPrice: 68450.1,
          change: 935.35,
          percentChange: 1.39,
          highPrice: 69000.0,
          lowPrice: 67210.0,
          openPrice: 67514.75,
          previousClose: 67514.75,
          quoteTimestamp: 1713320000,
        },
      });
    }).as('btcLookup');

    cy.intercept('GET', '/api/stocks/KRAKEN%3AETHUSD*', (req) => {
      expect(req.query.market).to.eq('CRYPTO');
      req.reply({
        statusCode: 200,
        body: {
          symbol: 'KRAKEN:ETHUSD',
          currentPrice: 3500.2,
          change: 58.1,
          percentChange: 1.69,
          highPrice: 3540.0,
          lowPrice: 3440.0,
          openPrice: 3452.1,
          previousClose: 3442.1,
          quoteTimestamp: 1713320060,
        },
      });
    }).as('ethLookup');

    cy.visit('/login');
    cy.get('[data-testid="login-username"]').type('alice', { force: true });
    cy.get('[data-testid="login-password"]').type('password123', { force: true });
    cy.get('[data-testid="login-submit"]').click({ force: true });

    cy.wait('@login');
    cy.url().should('include', '/dashboard');

    cy.get('[data-testid="dashboard-tab-crypto"]').click({ force: true });
    cy.wait('@cryptoHistory');

    cy.get('[data-testid="dashboard-symbol-input"]').clear().type('KRAKEN:BTCUSD');
    cy.wait('@cryptoSearch');
    cy.get('[data-testid="dashboard-suggestion"]').first().should('contain.text', 'KRAKEN:BTCUSD').click({ force: true });
    cy.wait('@btcLookup');
    cy.wait('@cryptoHistory');

    cy.get('[data-testid="dashboard-symbol-input"]').clear().type('KRAKEN:ETHUSD');
    cy.wait('@cryptoSearch');
    cy.get('[data-testid="dashboard-suggestion"]').first().should('contain.text', 'KRAKEN:ETHUSD').click({ force: true });
    cy.wait('@ethLookup');
    cy.wait('@cryptoHistory');

    cy.get('[data-testid="dashboard-history-item"]').should('have.length.at.least', 2);
    cy.get('[data-testid="dashboard-history-item"]').first().should('contain.text', 'KRAKEN:ETHUSD');
    cy.get('[data-testid="dashboard-history-item"]').eq(1).should('contain.text', 'KRAKEN:BTCUSD');
  });
});
