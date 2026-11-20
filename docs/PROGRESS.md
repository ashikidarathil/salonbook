# Progress

**Current:** Phase 8 done → next Phase 9 (WhatsApp-style chat)
**Next step:** Phase 9.3 message ticks (✓ / ✓✓ / blue)

## Log
- 2026-11-17 — Investigated live site. Data fails because the backend CORS check rejects
  `https://www.salonbook.online` → 500 on every browser request. API itself works (branches return
  200 without an Origin header). Docs + plan created.
- 2026-11-17 — 0.1 done: `FRONTEND_ORIGIN` fixed on Render (first attempt had a hidden newline).
  www origin → 200 + preflight 204. Apex origin still 500 (harmless: apex redirects to www).
- 2026-11-17 — 0.2 done: site lists services + stylists for Kochi. "Empty lists" were branches with
  no stylists/services assigned, not a code bug. Found 3 real bugs → added 0.5–0.7; data gaps → 0.8.
- 2026-11-17 — 0.3–0.7 coded. Backend branch `fix/phase0-cors-routes` (CORS trim + no 500, debug log
  removed, services route order, nearest ranking). Frontend branch `fix/phase0-timeout-nearest`
  (60s timeout + wake banner). Both build + lint clean. Note: backend tracks `dist/` in git → remove in 6.2.
- 2026-11-17 — 0.3–0.7 merged & live: backend PR #3, frontend PR #2. Verified on prod: services/paginated
  200, www + apex origins allowed, unknown origin gets no CORS header (no 500), wake banner in bundle.
  Follow-up 0.9 added (ranking counts deleted services).
- 2026-11-17 — 0.9 merged (backend PR #4) + verified live: branches with visible services rank first.
  Phase 0 done except 0.8 (data, admin panel). 1.1 done (both local repos synced with GitHub).
- 2026-11-17 — 1.2–1.4 done: private repo https://github.com/ashikidarathil/salonbook with full history of
  both repos (git subtree). Root husky + commitlint, root .gitignore/README, docs/ moved in. Untracked
  backend dist/, logs, dump.rdb, .DS_Store. Fixed 2 frontend lint errors (reviews pages) that had failed
  frontend CI since March. Old folder `Saloon Booking Managment/` kept as backup — docs now live here.
- 2026-11-17 — 1.5 done: Render deploys from `salonbook`, Root Directory `backend`, still Docker runtime
  (backend/Dockerfile). Verified live: health 200, all public endpoints 200, CORS OK.
- 2026-11-17 — 1.6 done: Vercel deploys from `salonbook`, Root Directory `frontend`. First prod deploy was
  blocked (commit author email not linked to GitHub) → repo git email set to the GitHub no-reply address.
  PR #1 merged, prod deploy verified live.
- 2026-11-17 — 1.7 done: old repos salon-booking-backend / salon-booking-frontend archived (read-only).
  Phase 1 complete.
- 2026-11-17 — 2.1–2.3, 2.5: single CI workflow (`.github/workflows/ci.yml`) with path filters, commitlint
  on PRs, and one aggregate "CI result" check. Vercel previews already on every PR.
- 2026-11-17 — 2.4 done. Private repo couldn't run Actions (GitHub billing block) → history scanned for
  secrets (clean) → repo made public. `main` protected: PR + "CI result" required. Phase 2 complete.
- 2026-11-17 — 3.1 + 3.8 done: Render `MONGODB_URI` → `salonbook_prod` (same Atlas cluster; old
  `salon_booking` kept as backup, delete after a week). Admin created + seed run. Verified live: 8 branches,
  8 categories, 20 services, 16 stylists, Kochi Men's Haircut ₹290, 54 slots on a Monday.
- 2026-11-17 — Added Phase 8 (readable URLs / slugs) to the plan at the user's request. Also done since
  last entry: images seeded (PR #4), service detail crash fix (PR #5), demo reviews + 4 home stylists (PR #6,
  seed:reviews run on prod), detail-page loading fix (PR #7).
- 2026-11-18 — 3.2 done: kept existing Upstash `saloon-redis` (free, Mumbai). Render `REDIS_URL` set to its
  `rediss://` URL. Verified live: verify-reset-otp with fake data → 400 "Invalid or expired OTP" in 0.85s.
- 2026-11-18 — 3.3–3.4 done: Render env has CLOUDINARY_FOLDER=salonbook, NODE_ENV=production, no AWS_*.
  Verified live after redeploy: health 200, public endpoints 200, Redis OK.
- 2026-11-18 — 3.5–3.6 done: Namecheap `api` A record (old AWS 13.206.83.223) replaced by CNAME →
  salon-booking-backend-ra3n.onrender.com; Render custom domain verified + certificate issued (~9 min).
  Vercel `VITE_API_BASE_URL=https://api.salonbook.online/api` (re-added as non-sensitive; Vercel won't save a
  Sensitive var with a VITE_ prefix), `VITE_SOCKET_URL` deleted (falls back to API host). Render
  `COOKIE_DOMAIN=.salonbook.online`. Verified live: bundle only references api.salonbook.online, CORS + preflight
  OK, socket.io handshake 200, home top stylists + 20/20 service detail pages load in Chrome.
- 2026-11-18 — 3.7 done. Razorpay: live + local test keys were stale ("Authentication failed" on order
  creation) → regenerated test keys in Razorpay, updated Render + local `.env.local`. Verified by user: booking
  #BK-222079 CONFIRMED, advance ₹460 of ₹2,300 paid via Razorpay test UPI. Google login works on live.
  PRs #10/#11 now surface Razorpay's failure reason in the UI and Render logs.
- 2026-11-18 — 3.9: keep-awake GitHub Action pings /api/health every 10 min.
- 2026-11-19 — 3.10 done: full flow verified by user on live (login, book, Razorpay pay, chat text/image/voice).
  Fixes on the way: chat socket URL broke on api.* domain (#13), voice format + real duration (#14).
  Phase 3 complete. Added Phase 9 (WhatsApp-style chat: waveforms, ticks, image attach/preview/viewer) — to do after Phase 8.
- 2026-11-19 — Phase 4 done: removed S3Service + aws-sdk + AWS_* env; images delivered f_auto,q_auto with
  EXIF rotation; chat photos capped at 1600px; old-image deletion handles transformed URLs and never fails an
  upload. Verified against Cloudinary dev folder: 4000x3000 rotated phone photo → 1200x1600 upright WebP;
  profile/service/chat/voice upload + delete all confirmed.
- 2026-11-19 — Phase 8 backend: slugs + /api/resolve + booking-by-number with owner check, migrate:slugs
  script. 16/16 API checks on a temp DB (slugs, resolve by slug/id/case, 404/400, kochi-2 on duplicate,
  booking by number, other customer blocked, admin allowed); top stylists/services carry slugs.
- 2026-11-19 — 8.2 run on prod. 8.5 frontend: /branches/kochi/services/mens-haircut, /stylists/arjun-menon,
  /profile/bookings/BK-XXXXXX; old id links redirect. Verified in Chrome: 9/9 public checks against the live API,
  8/8 booking checks (detail, checkout, payment success, My Bookings) on a local stack.
- 2026-11-20 — 8.6 done: admins can set/edit URL names (branch + service forms, stylist Public profile bar).
  Verified: 14/14 API checks (change, old slug 404, duplicate 409, invalid/id-like 400, auto on create) and
  11/11 admin UI checks in Chrome. Phase 8 complete.
