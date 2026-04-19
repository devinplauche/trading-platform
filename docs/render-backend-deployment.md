# Render Deployment Guide (Backend)

## Prerequisites
- Render account (free tier available at [render.com](https://render.com))
- GitHub repo connected to Render

## Step 1: Create a Web Service on Render

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repo

## Step 2: Configure the Web Service

| Setting | Value |
|---------|-------|
| **Name** | `stock-lookup-backend` (or similar) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Docker` |
| **Build Command** | (leave empty; Docker will use Dockerfile) |
| **Start Command** | (leave empty; Dockerfile defines ENTRYPOINT) |

## Step 3: Add Environment Variables

Under **Environment**, add:

```
JWT_SECRET=<generate-a-strong-random-string>
FINNHUB_API_KEY=<your-api-key>
```

To generate a strong JWT_SECRET, run:
```bash
openssl rand -base64 32
```

## Step 4: Deploy

Click **Create Web Service**. Render will:
1. Build the Docker image using `backend/Dockerfile`
2. Deploy the container
3. Give you a URL (e.g., `https://stock-lookup-backend.render.com`)

## Step 5: Update Frontend to Use Backend URL

In your Vercel frontend, you need to tell it where the backend is. Update the API base URL:

### Option A: Update Services Directly (Quick)

In [src/app/core/auth.service.ts](../../src/app/core/auth.service.ts):
```typescript
// Replace '/api' with your backend URL
const backendUrl = 'https://stock-lookup-backend.render.com';
return this.http.post<AuthResponse>(`${backendUrl}/api/auth/signup`, credentials)...
```

### Option B: Use Environment Configuration (Recommended)

Create `src/environments/environment.ts`:
```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:8080'  // local dev
};
```

Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  apiBaseUrl: 'https://stock-lookup-backend.render.com'  // production
};
```

Inject in services:
```typescript
import { environment } from '../../../environments/environment';

export class AuthService {
  signup(credentials: Credentials): Observable<void> {
    return this.http.post<AuthResponse>(
      `${environment.apiBaseUrl}/api/auth/signup`,
      credentials
    )...
  }
}
```

## Step 6: Re-deploy Frontend on Vercel

After updating the frontend code, redeploy to Vercel:
```bash
export VERCEL_API_KEY="your_vercel_token"
npm run deploy:vercel
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build fails: `mvn: command not found`** | Make sure `Root Directory` is set to `backend` and `Runtime` is `Docker` |
| **401 Unauthorized on login** | Check that `JWT_SECRET` env var is set on Render |
| **CORS errors** | Add CORS headers in backend config (check `backend/src/main/java/.../security/SecurityConfig.java`) |
| **Database file not found** | Use `render.com` managed PostgreSQL instead of local H2 (optional upgrade) |

## Next Steps (Optional)

- Use Render's managed database instead of local H2 for persistence across restarts
- Add CI/CD to auto-deploy on git push (Render supports this natively)
- Monitor backend health checks in Render dashboard
