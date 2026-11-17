# Setup Guide

Do these in the order of [build-plan.md](build-plan.md). Never commit real values — they go only in
`backend/.env.local`, `frontend/.env.local`, Render and Vercel dashboards.

## 1. MongoDB Atlas (reset)
1. Atlas → your project → create a **free M0** cluster (region: Mumbai `ap-south-1`, close to Render Singapore/users).
2. Database Access → add user (password auth). Save username/password.
3. Network Access → add `0.0.0.0/0` (Render free has no fixed IP).
4. Connect → Drivers → copy URI, add DB name:
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/salon_booking?retryWrites=true&w=majority`
5. This is `MONGODB_URI`.

## 2. Upstash Redis (reset)
1. Upstash → Create database → Redis, region close to Render, TLS on.
2. Copy the **`rediss://` URL** (two s's = TLS) from the "Connect" → Node tab.
3. This is `REDIS_URL`.

## 3. Cloudinary
1. Sign up → Dashboard → copy **Cloud name, API key, API secret**.
2. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, optional `CLOUDINARY_FOLDER=salonbook`.

## 4. Render (backend)
1. New → Web Service → connect GitHub repo (after Phase 1: the combined repo).
2. **Root Directory:** `backend` · Build: `npm ci && npm run build` · Start: `npm start` · Node 20.
3. Environment → add every var in the table below.
4. Settings → Custom Domain → add `api.salonbook.online` → Render shows a CNAME target.
5. Health check path: `/api/health`.

## 5. Vercel (frontend)
1. Project → Settings → Git → connect the combined repo. **Root Directory:** `frontend`. Framework: Vite.
2. Environment Variables (Production + Preview):
   - `VITE_API_BASE_URL=https://api.salonbook.online/api`
   - `VITE_GOOGLE_CLIENT_ID=<same as backend GOOGLE_CLIENT_ID>`
3. Domains: `salonbook.online` → redirect to `www.salonbook.online` (already done).
4. Redeploy after any env change (VITE vars are baked in at build).

## 6. DNS (where salonbook.online is managed)
- Delete the old `A api → 13.206.83.223` record.
- Add `CNAME api → <target Render gave you>`.
- Leave the Vercel records for `@` and `www` as they are.

## 7. Google OAuth (console.cloud.google.com → Credentials → OAuth client)
- Authorized JavaScript origins: `https://www.salonbook.online`, `https://salonbook.online`, `http://localhost:5173`.

## 8. Razorpay
- Dashboard → Settings → add website `https://www.salonbook.online`. Use test keys until go-live.

## Backend env vars (Render)
| Var | Value / note |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | leave unset (Render sets it) |
| `MONGODB_URI` | from Atlas |
| `REDIS_URL` | from Upstash (`rediss://…`) |
| `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | long random strings: `openssl rand -hex 32` each |
| `ACCESS_TOKEN_EXPIRES` / `REFRESH_TOKEN_EXPIRES` | e.g. `15m` / `7d` |
| `FRONTEND_ORIGIN` | `https://www.salonbook.online,https://salonbook.online` — **comma-separated, no spaces, no trailing slash** |
| `COOKIE_DOMAIN` | `.salonbook.online` (only after API is on `api.salonbook.online`) |
| `GOOGLE_CLIENT_ID` | from Google console |
| `SMTP_HOST/PORT/USER/PASS/FROM` | e.g. Gmail SMTP with an app password |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | from Twilio |
| `CLOUDINARY_*` | from Cloudinary |
| `RAZORPAY_KEY_ID/KEY_SECRET` | from Razorpay |

## Local dev
```
cd backend && npm i && npm run dev        # :5001  (uses backend/.env.local)
cd frontend && npm i && npm run dev       # :5173  (uses frontend/.env.local)
```
Local `FRONTEND_ORIGIN=http://localhost:5173`. Local Mongo/Redis via `docker compose up mongo redis`
or point at Atlas/Upstash dev databases.

## 9. Fresh data for the live site (admin + seed)
Run from `backend/` on your Mac. The values stay in your terminal; nothing is committed.
```bash
cd backend
export MONGODB_URI='mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/salonbook_prod?retryWrites=true&w=majority'

# 1. Admin login for the live site
ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='strong-password' ADMIN_NAME='Admin' npm run create-admin

# 2. Branches, categories, services, prices, stylists, schedules (edit src/scripts/seedData.ts first if needed)
SEED_STYLIST_PASSWORD='strong-password' SEED_CONFIRM=salonbook_prod npm run seed
```
- `SEED_CONFIRM` must equal the database name, so the seed can't hit the wrong database.
- Both scripts are safe to re-run (they update by name/email, no duplicates).
- Stylist logins: `<firstname>.<branch>@stylist.salonbook.online` (lowercase), all with `SEED_STYLIST_PASSWORD`.
- Then switch Render's `MONGODB_URI` to the `salonbook_prod` string.
