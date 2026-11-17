# Architecture

## Big picture

```
Browser ──► www.salonbook.online (Vercel, static React build)
   │
   │  HTTPS (axios, cookies)  +  WebSocket (socket.io)
   ▼
Backend API (Render web service, Node/Express)  ──► MongoDB Atlas   (all data)
   │                                            ──► Upstash Redis   (OTPs, cache, sessions)
   │                                            ──► Cloudinary      (images)
   │                                            ──► Razorpay        (payments)
   │                                            ──► SMTP / Twilio   (email / SMS)
   └── node-cron jobs run inside the same process
```

## Frontend (`frontend/`)
- React 19 + Vite + TypeScript, Tailwind + Radix/shadcn UI, Redux Toolkit.
- `src/services/api/` — one axios instance, `baseURL = VITE_API_BASE_URL`, `withCredentials: true`.
  Sends `X-Tab-ID` and `X-Auth-Role` headers. On 401 it calls `/auth/refresh` once and retries.
- `src/features/<module>/` — Redux slice + thunks per module. `src/pages/{admin,stylist,user,auth}` — screens per role.
- `VITE_*` vars are **baked in at build time** — changing them on Vercel needs a redeploy.
- `vercel.json` rewrites all routes to `index.html` (SPA routing).

## Backend (`backend/`)
- Express 5 + TypeScript, tsyringe dependency injection, Mongoose, Zod validation, Winston logs.
- Each module in `src/modules/<name>/` = `routes → controller → service → repository → model`.
  Modules: auth, admin, branch, branchCategory, branchService, category, service, stylistInvite,
  stylistBranch, stylistService, schedule, offDay, holiday, slot, booking, payment, coupon,
  wallet, escrow, stylistWallet, chat, notification, review, wishlist.
- `src/app.ts` — middleware order: CORS → JSON → cookies → logger → routes → error handler.
- `src/socket/` — socket.io for chat + live notifications (same CORS list as the API).
- `src/common/cron.ts` — scheduled jobs (needs an always-on process, so not Vercel serverless).
- Auth: access + refresh JWT in httpOnly cookies. Google login via `google-auth-library`.
- Images: `CloudinaryService` (S3Service is legacy, to be removed).

## Roles
USER (customer booking), STYLIST (schedule, bookings, wallet), ADMIN (branches, services, stylists, payouts).

## GitHub & CI/CD (today → target)
| | Today | Target (after Phase 1–2) |
|---|---|---|
| Repos | `salon-booking-backend`, `salon-booking-frontend` | one repo `salonbook` with `backend/`, `frontend/`, `docs/` |
| CI | lint + build on push to main (frontend: push only) | one workflow, runs on every PR, only for the folder that changed |
| CD | Vercel + Render auto-deploy on push to main | same, pointed at the subfolders (Root Directory setting) |
| Previews | — | Vercel preview URL on every PR |

Flow: branch → PR → CI green → merge to `main` → Vercel/Render deploy automatically.

## Known issues found on 2026-11-17
1. **No data loads on the live site.** Backend rejects the browser's `Origin` → every request returns 500.
   Cause: `FRONTEND_ORIGIN` on Render doesn't contain `https://www.salonbook.online`. Fix in Phase 0.
2. CORS rejection throws an error → shows as 500 instead of a clean CORS failure (code fix in Phase 0).
3. Frontend (salonbook.online) and API (onrender.com) are different sites → login cookies are
   "third-party" and Safari/iPhone blocks them. Fix: API on `api.salonbook.online` (Phase 3).
4. `api.salonbook.online` DNS points to an old AWS IP that times out.
5. Render free tier sleeps after 15 min → first request ~30–50 s. `/api/health` exists for uptime pings.
6. Request debug `console.log` in `app.ts` logs every request body (incl. passwords) — remove.
