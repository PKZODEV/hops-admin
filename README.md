# HOPS Admin Console

Operator-facing dashboard for **HOPS** — Hotel Operating System for Thailand. Hotel owners and platform admins manage properties, room inventory, rates, transport, and live bookings through this app.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.1 App Router with React Compiler |
| UI | React 19, Tailwind v4, lucide-react, recharts |
| Auth | HTTP-only `hops_token` cookie issued by the backend |
| Routing guard | `src/middleware.ts` (redirects unauthenticated users to `/login`) |
| Container | Multi-stage `Dockerfile`, `output: "standalone"` |

## Project structure

```
src/
  middleware.ts          # Auth guard — presence-checks the hops_token cookie
  app/
    layout.tsx           # Root shell
    login/               # Public auth screens
    register/
    forgot-password/
    reset-password/
    setup/               # First-run wizard (property + rooms + change-password)
    (dashboard)/         # Authenticated routes
      page.tsx           # KPI dashboard
      hotel-management/  # Properties, rooms, edit
      booking-management/
      rooms/             # Room-unit list / detail
      transport/
      master-data/       # Amenities, property categories
      registration-approvals/
      report/
  components/
    layout/              # Header, Sidebar
    ui/                  # Button, Card, Input, ImageUploader, ...
    onboarding/          # Stepper, AmenitiesSelector
    hotel/               # RoomTypesEditor
  lib/
    api.ts               # Thin JSON HTTP client (cookie-credentialed)
    auth.ts              # Client-side user-cache helpers + role predicates
    imageUrl.ts          # Legacy IP -> sub-domain rewrite for stored URLs
  mockData/              # Static fallback data for dashboard widgets
  types/                 # Shared TypeScript types
```

## Environments

The repo ships three committed env templates. Secrets must never be added to these files — the admin console only consumes public values; the backend cookie is the authentication credential.

| File | Loaded by | Purpose |
| --- | --- | --- |
| `.env.example` | (manual) | Reference of required variables |
| `.env.development` | `next dev` | Localhost defaults |
| `.env.production` | `next build` / `next start` | Production-build defaults |
| `.env.local` | always (highest priority) | **Per-developer overrides — never commit** |

### Required variables

| Name | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Absolute base URL of the HOPS backend, including the `/api/v1` prefix and **without** a trailing slash. |
| `NEXT_PUBLIC_APP_ENV` | optional | `development \| staging \| production` — diagnostic label only. |

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

The console expects the backend at `NEXT_PUBLIC_API_URL`. Bring up `hops-backend` first or point this variable at a deployed environment.

## Production build

```bash
npm run build        # uses .env.production
npm run start
```

## Lint & type-check

```bash
npm run lint
npx tsc --noEmit
```

## Security headers

Configured in `next.config.ts`:

- `Strict-Transport-Security` (2 years, preload)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geo/FLoC disabled)
- `X-DNS-Prefetch-Control: on`
- `X-Powered-By` is suppressed (`poweredByHeader: false`)

## Authentication model

1. The user signs in at `/login`. The backend sets an HTTP-only `hops_token` cookie scoped to the API origin.
2. `src/middleware.ts` redirects any request without that cookie to `/login`, except for the public auth screens (`/register`, `/forgot-password`, `/reset-password`).
3. `lib/auth.ts` mirrors the user profile (id, role, name) into `localStorage` purely for fast UI rendering. **It is not authoritative** — every API call still travels with the cookie and is re-validated by the backend.
4. `clearStoredUser()` on logout removes only the local mirror; the backend `/auth/logout` endpoint is responsible for invalidating the cookie.

## Docker

```bash
docker build -t hops-admin .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.hopsthailand.com/api/v1 \
  -e NEXT_PUBLIC_APP_ENV=production \
  hops-admin
```
