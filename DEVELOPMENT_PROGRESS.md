# Stock Lookup - Step-by-Step TDD Progress

This document tracks the implementation of the coding exercise using a Spring Boot backend and Angular frontend with test-first cycles.

## 1. Requirement Capture
- Parsed assignment requirements from `RTS_Coding_Demonstration_2024.pdf`.
- Confirmed required features:
  - Signup, login, logout
  - Auth-gated stock lookup by symbol
  - Return opening stock price
  - Include happy-path tests for signup/login/lookup

## 2. Backend TDD (Spring Boot)

### 2.1 Red - Write integration tests first
- Added `backend/src/test/java/com/rts/stocklookup/AuthControllerIT.java`:
  - verifies signup returns JWT
  - verifies login returns JWT
  - verifies duplicate username returns bad request
- Added `backend/src/test/java/com/rts/stocklookup/StockControllerIT.java`:
  - verifies stock endpoint is blocked when unauthenticated
  - verifies authenticated user can lookup a symbol and get opening price

### 2.2 Green - Implement minimal backend features
- Created Spring Boot app in `backend`.
- Added JWT auth stack:
  - `AuthController`, `AuthService`, `JwtService`, `JwtAuthFilter`, `SecurityConfig`
- Added user persistence (H2 + JPA):
  - `AppUser`, `AppUserRepository`
- Added stock lookup API:
  - `StockController`, `StockService`, `FinnhubClient`
- Endpoint summary:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/stocks/{symbol}` (authenticated)

### 2.3 Refactor/Hardening
- Normalized usernames to lowercase in auth service.
- Added request validation for signup/login payloads.
- Centralized config in `backend/src/main/resources/application.yml`.

## 3. Frontend TDD (Angular)

### 3.1 Red - Add tests for route/access flow and components
- Updated/added tests:
  - `src/app/app.spec.ts`
  - `src/app/core/auth.guard.spec.ts`
  - `src/app/login/login.spec.ts`
  - `src/app/signup/signup.spec.ts`
  - `src/app/dashboard/dashboard.spec.ts`

### 3.2 Green - Implement frontend features
- Added app routing and auth guard:
  - `src/app/app.routes.ts`
  - `src/app/core/auth.guard.ts`
- Added API services:
  - `src/app/core/auth.service.ts`
  - `src/app/core/stock.service.ts`
- Implemented screens:
  - Login: `src/app/login/*`
  - Signup: `src/app/signup/*`
  - Dashboard (stock search + logout): `src/app/dashboard/*`
- Switched app shell to routed layout:
  - `src/app/app.ts`
  - `src/app/app.html`
- Enabled HTTP support in config:
  - `src/app/app.config.ts`

### 3.3 Refactor/Developer UX
- Added Angular proxy for local dev API calls:
  - `proxy.conf.json`
  - `angular.json` serve options updated with `proxyConfig`
- Enforced guarded dashboard so stock lookup is unavailable unless authenticated.

## 4. Verification

### 4.1 Frontend
- Ran tests:
  - `npm test -- --watch=false`
  - Result: `5 passed`, `12 passed`
- Ran production build:
  - `npm run build`
  - Result: success

### 4.2 Backend
- Backend tests are present and designed for happy path.
- Local environment lacked Maven executable (`mvn` not found), so backend tests could not be executed in this session.

## 5. How to Continue

1. Install Maven (or add Maven Wrapper) and run:
   - `cd backend`
   - `mvn test`
2. Start backend:
   - `mvn spring-boot:run`
3. Start frontend (from repo root):
   - `npm start`
4. Open app:
   - `http://localhost:4200`

## 6. Notes
- Finnhub API key is read from env var `FINNHUB_API_KEY`.
- JWT secret can be overridden with env var `JWT_SECRET`.
- Default backend DB is in-memory H2 for fast local setup.
