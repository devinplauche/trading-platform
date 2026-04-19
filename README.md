# Stock Lookup (Spring Boot + Angular)

This project implements the RTS coding exercise with:
- Spring Boot backend (`backend/`)
- Angular frontend (`/` root app)

## Features
- User signup, login, logout
- Auth-protected stock lookup by ticker symbol
- Opening stock price retrieval through Finnhub integration
- TDD-oriented test coverage for key happy paths

## Project Structure
- Frontend Angular app: `src/`
- Backend Spring Boot app: `backend/`
- Step-by-step development notes: `DEVELOPMENT_PROGRESS.md`

## Prerequisites
- Node.js and npm
- Java 21+
- Maven (for backend)

Optional environment variables:
- `FINNHUB_API_KEY` (defaults to `demo`)
- `JWT_SECRET` (defaults to a local dev secret in `application.yml`)

## Run App (Frontend + Backend)
From repository root:

```bash
npm install
npm start
```

Frontend runs at `http://localhost:4200`.
Backend runs at `http://localhost:8080`.

## Run Backend
If you only want the backend:

```bash
npm run start:backend
```

## API Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/stocks/{symbol}` (requires bearer token)

## Testing

### Frontend tests
From repository root:

```bash
npm test -- --watch=false
```

### Backend tests
From `backend/`:

```bash
mvn test
```

## Build Frontend
From repository root:

```bash
npm run build
```

## Deploy Frontend To Vercel

A deployment plan is available at `docs/vercel-deployment-plan.md`.

This repository includes a deploy script that works with a Vercel API key:

```bash
export VERCEL_API_KEY="your_vercel_token"
npm run deploy:vercel
```

Optional environment variables for the script:
- `VERCEL_PROJECT_NAME` (defaults to current folder name)
- `VERCEL_SCOPE` (team/user scope)
- `VERCEL_CWD` (deployment directory; defaults to repo root)

The frontend currently calls same-origin `/api/*` routes, so the Spring Boot backend should be hosted separately and connected via rewrite/proxy or explicit API base URL configuration.

## Notes
- Angular dev server proxy is configured in `proxy.conf.json` to route `/api` calls to `http://localhost:8080`.
- Backend uses a file-based H2 DB (`./data/stocklookup`) for local persistence across restarts.
