# Build Plan

Tick `[x]` as each item is done. One sub-phase ≈ one PR. Update [PROGRESS.md](PROGRESS.md) after each.

## Phase 0 — Hotfix: make the live site load data
- [x] 0.1 Render → backend env → set `FRONTEND_ORIGIN=https://www.salonbook.online,https://salonbook.online` → save (auto-redeploys)
- [x] 0.2 Verify: open site, branches/services load (confirmed with Kochi branch)
- [x] 0.3 Code: CORS rejection returns a clean error instead of 500; trim spaces in origin list
- [x] 0.4 Code: remove the `REQUEST DEBUG` console.log block in `app.ts` (logs passwords)
- [x] 0.5 Code: register `/services/paginated` before `/services/:id` (currently 404 "Service not found")
- [x] 0.6 Code: raise axios timeout (10s → 60s) + show "waking up server…" so Render cold starts don't show empty pages
- [x] 0.7 Code: nearest-branches — only return branches within a radius / that have services; fall back to all branches
- [ ] 0.8 Data: assign stylists + services to every branch (or reset data in Phase 3). Empty today: kinalur, Kallai, Madavoor, Thodayad (0/0), Manglore (0 services); 13 stylists have no branch
- [x] 0.9 Code: nearest-branch ranking should also ignore services that are deleted/inactive (Thodayad ranks high but shows 0)

## Phase 1 — Merge into one repo
- [x] 1.1 Pull latest `main` in both local repos (local is 10 commits behind GitHub)
- [x] 1.2 Create new GitHub repo `salonbook` (private)
- [x] 1.3 Import both repos with full history via `git subtree` into `backend/` and `frontend/`; add `docs/`
- [x] 1.4 Root files: `.gitignore`, `README.md`, single husky + commitlint at root
- [x] 1.5 Render → switch repo to `salonbook`, Root Directory `backend`
- [x] 1.6 Vercel → switch repo to `salonbook`, Root Directory `frontend`
- [x] 1.7 Verify both deploy from the new repo; archive the two old repos on GitHub

## Phase 2 — CI for the combined repo
- [x] 2.1 `.github/workflows/ci.yml`: runs on PR + push to main, Node 20
- [x] 2.2 Path filters: backend job only if `backend/**` changed, frontend job only if `frontend/**` changed
- [x] 2.3 Jobs: install (`npm ci`) → typecheck → lint → build; commitlint on PR
- [ ] 2.4 Branch protection on `main`: require PR + green CI
- [x] 2.5 Vercel PR preview URLs working

## Phase 3 — Fresh infrastructure (see setup-guide.md)
- [ ] 3.1 Atlas: new cluster/user/URI
- [ ] 3.2 Upstash: new Redis, `rediss://` URL
- [ ] 3.3 Cloudinary: account + keys
- [ ] 3.4 Render: all env vars from the table, health check `/api/health`
- [ ] 3.5 DNS: remove old `api` A record, add `api` CNAME → Render; add custom domain on Render
- [ ] 3.6 Set `COOKIE_DOMAIN=.salonbook.online`; Vercel `VITE_API_BASE_URL=https://api.salonbook.online/api`; redeploy
- [ ] 3.7 Google OAuth origins + Razorpay website updated
- [ ] 3.8 Seed admin user + base data (categories, services, a branch)
- [ ] 3.9 Uptime ping (UptimeRobot/cron-job.org) on `/api/health` every 10 min
- [ ] 3.10 Smoke test: sign up, Google login, login on iPhone Safari, book, pay (test), chat

## Phase 4 — Finish Cloudinary migration
- [ ] 4.1 Remove `S3Service`, `aws-sdk`, `AWS_*` env vars
- [ ] 4.2 Check every upload: profile photo, branch images, service images, category images, chat attachments
- [ ] 4.3 Images resized/optimised via Cloudinary transforms (`f_auto,q_auto,w_…`)
- [ ] 4.4 Delete images from Cloudinary when the record is deleted/replaced
- [ ] 4.5 Re-upload all images through the admin UI

## Phase 5 — Responsive UI cleanup (mobile 360px · tablet 768px · laptop 1280px+)
- [ ] 5.1 Audit: list every page per role with what breaks at each size
- [ ] 5.2 Shared layout: header/nav (mobile menu), footer, page containers, spacing scale
- [ ] 5.3 Public pages: home, branches, services, service detail, contact
- [ ] 5.4 Auth pages: login, signup, OTP, forgot password
- [ ] 5.5 User area: booking flow (slot picker, calendar), cart/checkout, bookings, wallet, wishlist, profile, chat
- [ ] 5.6 Stylist area: dashboard, schedule, bookings, wallet, chat
- [ ] 5.7 Admin area: sidebar → drawer on mobile, tables → cards on small screens, forms, dashboard charts
- [ ] 5.8 Modals/dialogs/toasts fit small screens; no horizontal scroll anywhere
- [ ] 5.9 Final pass on real devices (phone, tablet, laptop)

## Phase 6 — Code cleanup
- [ ] 6.1 Remove commented-out code and stray `console.log`s (backend + frontend)
- [x] 6.2 Remove tracked junk (`dump.rdb`, logs, `.DS_Store`, backend `dist/`) — done in Phase 1
- [ ] 6.3 Fix all lint/typecheck warnings

## Phase 7 — New features
- [ ] 7.1 _(list features here as we decide them)_
