# Vercel Deployment Plan

## Goal
Deploy the Angular frontend to Vercel with a repeatable CLI flow that works when `VERCEL_API_KEY` is set.

## Current Architecture
- Frontend: Angular app served from this repository root.
- Backend: Spring Boot app in `backend/`.
- Frontend currently calls same-origin `/api/...` endpoints.

Because Vercel does not run this Spring Boot app as-is, backend hosting must be handled separately.

## Deployment Strategy
1. Deploy frontend to Vercel from repository root.
2. Deploy backend to a Java-friendly host (for example: Render, Railway, Fly.io, or similar).
3. Configure API routing so frontend calls can still reach backend endpoints.

## Implementation Phases

### Phase 1: Frontend deployment automation
- Use `scripts/deploy-vercel.sh`.
- Require `VERCEL_API_KEY` to run in non-interactive mode.
- Build Angular app before deploying.

### Phase 2: Backend production hosting
- Publish `backend/` to a Java runtime host.
- Set production env vars there (`JWT_SECRET`, `FINNHUB_API_KEY`, DB settings).
- Verify backend health and CORS for the Vercel frontend origin.

### Phase 3: API connectivity hardening
Choose one approach:
- Option A: Keep same-origin `/api` by adding Vercel rewrites/proxy to the hosted backend.
- Option B: Move frontend to explicit API base URL configuration per environment.

## CI/CD Recommendation
- Store `VERCEL_API_KEY` as a secret in your CI provider.
- Run:
  - `npm ci`
  - `npm run test -- --watch=false` (optional but recommended)
  - `npm run deploy:vercel`
- Trigger on `main` branch pushes after tests pass.

## Smoke Test Checklist
- Frontend route rendering works on page refresh (SPA deep links).
- Signup/login succeeds.
- Stock lookup returns real backend data.
- Logout clears auth state.
- Browser network calls to `/api/*` resolve with expected status codes.

## Rollback Plan
- Keep previous successful Vercel deployment aliases available.
- If release fails, re-point production alias to last known good deployment.
- If backend issues occur, roll back backend independently and confirm API compatibility.
