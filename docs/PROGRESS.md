# Progress

**Current:** Phase 1 — Merge into one repo
**Next step:** 1.2–1.4 build combined repo `salonbook`

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
