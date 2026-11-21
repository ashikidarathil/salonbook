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
- [x] 2.4 Branch protection on `main`: PR required (0 approvals, solo dev) + "CI result" check; no force push. Repo made public so Actions are free
- [x] 2.5 Vercel PR preview URLs working

## Phase 3 — Fresh infrastructure (see setup-guide.md)
- [x] 3.1 Atlas: keep the existing cluster; new empty database `salonbook_prod` (old `salon_booking` stays as backup) — only the DB name in `MONGODB_URI` changes
- [x] 3.2 Upstash: new Redis, `rediss://` URL
- [x] 3.3 Cloudinary: account + keys
- [x] 3.4 Render: all env vars from the table, health check `/api/health`
- [x] 3.5 DNS: remove old `api` A record, add `api` CNAME → Render; add custom domain on Render
- [x] 3.6 Set `COOKIE_DOMAIN=.salonbook.online`; Vercel `VITE_API_BASE_URL=https://api.salonbook.online/api`; redeploy
- [x] 3.7 Google OAuth origins + Razorpay website updated
- [x] 3.8 `npm run create-admin` then `npm run seed` against `salonbook_prod` (8 Kerala branches, 8 categories, 20 services, 16 stylists with Mon–Sat schedules) — see setup-guide.md §9
- [x] 3.9 Uptime ping on `/api/health` every 10 min — GitHub Action `.github/workflows/keep-awake.yml` (no extra account; paused by GitHub after 60 days without repo activity)
- [x] 3.10 Smoke test: sign up, Google login, login on iPhone Safari, book, pay (test), chat

## Phase 4 — Finish Cloudinary migration
- [x] 4.1 Remove `S3Service`, `aws-sdk`, `AWS_*` env vars
- [x] 4.2 Check every upload: profile photo, service images, chat images + voice (branches/categories have no images) — verified against real Cloudinary
- [x] 4.3 Optimised: images served `f_auto,q_auto` (WebP/AVIF), EXIF auto-rotate, chat photos shrunk to max 1600px (GIFs untouched)
- [x] 4.4 Old profile/service images deleted from Cloudinary on replace/delete (delete failures no longer fail the upload); verified deletion
- [x] 4.5 Re-upload images — not needed: seed data uses Unsplash photos (Phase 3); admins can replace any image in the admin panel

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

## Phase 8 — Readable URLs (slugs)
Replace database IDs in public URLs with readable names. Old ID links keep working and redirect.

| Page | Today | After |
|---|---|---|
| Service detail | `/branches/6afc87…cb0/services/6afc87…c98` | `/branches/kochi/services/mens-haircut` |
| Stylist profile | `/stylists/6afc87…dfc` | `/stylists/arjun-menon` |
| Branch pages | `/branches/6afc87…cb0/...` | `/branches/kochi/...` |
| Booking / checkout / payment | `/bookings/6afc87…` | `/bookings/BK-7F3A21` |

- [x] 8.1 Backend: `slug` field (unique, sparse) on Branch, Service, Stylist; set from the name on create (`Men's Haircut` → `mens-haircut`, duplicates get `-2`), then kept stable
- [x] 8.2 Backend: `npm run migrate:slugs` — run on prod 2026-11-19 (8 branches, 20 services, 16 stylists)
- [x] 8.3 Backend: `GET /api/resolve?branch=&service=&stylist=` turns slugs **or** old ids into ids + canonical slugs; responses include `slug` / `serviceSlug`
- [x] 8.4 Backend: booking detail accepts the booking number (`BK-XXXXXX`) or id; customers can only open their own bookings
- [x] 8.5 Frontend: links use slugs / booking numbers; old id URLs (and odd casing) redirect to the canonical URL; unknown slugs show "Not found"
- [x] 8.6 Admin: "URL name" field with live preview on branch + service forms; stylist "Public profile" bar with inline edit. Unique (409 "already in use"), validated, old slug stops resolving
- [x] 8.7 Seed sets slugs (`ensureSlugs`); verified in the browser — 9 public-page + 8 booking-page checks

## Phase 9 — WhatsApp-style chat (after Phase 8)
- [x] 9.0 Chat security (prerequisite): socket requires a valid login, only room members can join, sender comes from the login, REST chat routes check room access
- [x] 9.1 Voice messages show a waveform (saved at record time; computed from the audio for old messages), progress fills while playing
- [x] 9.2 Live waveform + timer while recording; cancel / send controls
- [x] 9.3 Message ticks: ✓ sent, ✓✓ delivered (recipient online anywhere on the site), blue ✓✓ read (chat open and tab visible); `deliveredAt` / `readAt`, live over socket.io; admins never trigger read
- [x] 9.4 Attach menu: Photos / Camera / Files (photos only; PDFs not included)
- [x] 9.5 Preview before sending, with optional caption
- [x] 9.6 Send multiple photos at once
- [x] 9.7 Full-screen image viewer (zoom, close, download)

## Phase 7 — New features
- [ ] 7.1 _(list features here as we decide them)_
