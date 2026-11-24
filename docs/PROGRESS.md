# Progress

**Current:** Phase 9 — WhatsApp-style chat
**Next step:** merge ticks PR, then 9.1–9.2 voice waveforms

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
- 2026-11-21 — 9.0 chat security: the socket trusted the browser's userId and any connection could join any
  room; REST messages/read/upload had no room check. Fixed. Verified: 17/17 attack checks; chat reconnects by
  itself after token expiry + server restart (4s test token).
- 2026-11-21 — 9.3 ticks built. Verified with two real Chrome sessions (13/13): sent → delivered when the
  stylist comes online → read when the chat opens, hidden tab stays delivered, survives reload, admin view never
  turns it blue.
- 2026-11-21 — Chat gap fix (#22): the newest message now sits right above the input box.
- 2026-11-21 — 9.1 + 9.2 voice waveforms: live wave + timer while recording, delete / send controls, wave saved
  with the message, bars fill while playing, tap to seek, old messages rebuild their wave from the audio.
  Verified with two real Chrome sessions and a fake mic (20/20), including cancel, phone width and a forged wave.
- 2026-11-21 — 9.4–9.7 photos: attach menu (Photos / Camera / Files), full-screen preview with a caption per photo,
  up to 10 photos paced under the server's message limit, full-screen viewer (zoom, pan, swipe, download), also for
  admin. Verified in real Chrome sessions with a fake camera (34/34). Not tested on a physical phone. Phase 9 built.
- 2026-11-21 — 9.8 + 9.9: messages, photos and voice notes appear instantly with a loader, and failures show
  Not sent · Retry. Every spinner and skeleton replaced by one Loader, coloured by site area. Verified in real Chrome
  sessions with slow, dropped and rate-limited sends (32/32). Not tested on a physical phone.
- 2026-11-21 — 9.9 follow-up: loader colors now come from each side's exact primary color (customer coral, stylist
  blue, admin green), with darker and lighter shades of that same color instead of the earlier pink.
- 2026-11-21 — 9.10 delete for everyone: senders can remove their text, photo or voice message for both people, live,
  leaving a "deleted" placeholder. Content and the stored file are erased. Verified in two real Chrome sessions (20/20).
  Not tested on a physical phone.
- 2026-11-21 — 5.1 inner-page foundation: shared breadcrumbs, page header and form page. Admin Categories now uses
  add and edit pages, keeps its list position, and has working action cards on phones.
- 2026-11-21 — 5.2 admin catalog: Services, Coupons and Holidays now use inner pages and phone cards, and lists keep
  their search and filters. Fixed creating a new service, which the server was rejecting. Verified in Chrome at
  laptop, tablet and phone sizes (48/48). Not tested on a physical device.
- 2026-11-21 — 5.3 branches and stylists: branch form with the map on the page, branch breaks, stylist invite and
  stylist Manage are inner pages. All form pages now use the full screen width. Fixed search boxes dropping letters
  during fast typing. Verified in Chrome from phone to 1920px (81/81), with map lookups and invite sending simulated.
  Not tested on a physical device.
- 2026-11-21 — 5.4 schedules and slots: day adjustments, breaks and special slots are inner pages for admin and
  stylist, slots become cards on phones, and stylist pages use the full width. Verified in Chrome from phone to
  1920px (75/75). Not tested on a physical device.
- 2026-11-21 — 5.5 booking flow: choosing a service, stylist, date and time, plus customer and admin reschedule, are
  inner pages. Fixed admin reschedule having no stylist or times, stale times after changing date, re-picking a
  service in the cart, and blank calendar arrows. Verified in Chrome from phone to 1920px (39/39), with the payment
  step simulated. Not tested on a physical device.
- 2026-11-21 — 5.6 customer account: review, wallet top-up and become a stylist are inner pages. Application errors
  now show on the form. Verified in Chrome from phone to 1920px (34/34), with Razorpay and the application request
  simulated. Not tested on a physical device. The Contact page's Send Message form is still not connected.
- 2026-11-21 — 5.6a uniform breadcrumbs: every admin, stylist and customer page now has one breadcrumb trail. Branch
  inner pages show the branch name, and stylist Manage shows its section and has one back arrow. Checked 53 pages at
  laptop, tablet and phone sizes (325 checks). Chat, login and home are left without breadcrumbs on purpose.
- 2026-11-22 — 5.7 final responsive pass: the remaining admin tables become cards on phones and tablets. Checked
  admin, stylist and customer pages with a real booking from 360 to 1920px (328 checks), including phone-card actions.
  Still open: 5.8 on real devices.
- 2026-11-22 — 5.7 uniform pages: every admin, stylist and account page now has the same title, description, spacing
  and full width. Removed empty border boxes that left content with no padding, including stylist Appointments.
  Checked 48 pages from 360 to 1920px (961 checks). Still open: 5.8 on real devices.
- 2026-11-22 — 5.7a stylist portal: hamburger menu on phones with a clear active tab. My Schedule shows the loader
  instead of false Not Working days and reopens instantly from saved data. Removed loading text beside the loader
  across the site without changing the animation. Verified in Chrome with slowed requests (38/38).
- 2026-11-22 — 9.9 follow-up: popup loading now uses the same site-wide loader, in each side's colours and with no
  text. The old default spinner is gone. Verified in Chrome for admin and stylist at laptop and phone sizes.
- 2026-11-22 — 9.9 follow-up: restored the white container around the action loader at the user's request.
- 2026-11-22 — 5.4 follow-up: the special slot delete action is now a full-size Delete button for admin and stylist.
- 2026-11-23 — 5.4 follow-up: removed the lightning emoji from special slot and special booking labels.
  Slot and special slot lists now use the standard loader size.
- 2026-11-23 — 5.7 follow-up: dashboard and wallet period filters fit phones, with equal tabs in one row and a full-width
  Specific Date button, for admin and stylist.
- 2026-11-23 — 5.7 follow-up: admin mobile menu now opens, shows the active tab, and closes after navigating.
- 2026-11-23 — Admin responsive pass, Dashboard: compact stat cards, readable charts with short dates, a proper empty
  state, and layouts for phone, tablet and laptop. Checked with empty and large data at nine widths (91 checks).
- 2026-11-23 — Admin responsive pass, shared fix: page-level card and button styles now override the defaults, so
  smaller phone padding works everywhere. Checked 60 admin, stylist and customer pages at phone, tablet and laptop.
- 2026-11-23 — Admin responsive pass, Bookings: compact booking cards, tidy filters, side-by-side phone actions and a
  responsive details page.
- 2026-11-23 — Admin responsive pass, Customers: customer cards, a search that survives refresh, and page numbers that
  fit small phones across the site.
- 2026-11-23 — Admin responsive pass, Stylists: stylist cards and table, plus responsive Schedule, Services, Off-Days
  and Wallet tabs inside Manage.
- 2026-11-23 — Admin responsive pass, Categories: category cards below laptop width, fixed-width table from laptop
  width, search icon, soft status badges, and a one-column form on tablets.
- 2026-11-23 — Admin responsive pass, Services: service cards below laptop width, fixed-width table from laptop
  width, compact filters, and a one-column form on tablets.
- 2026-11-23 — Admin responsive pass, Branches: branch cards and table, plus responsive Stylists, Categories,
  Services, Breaks and branch form pages.
- 2026-11-23 — Slots redesign: admin filters, status chips, laptop day board and phone day list; stylist week strip.
  Fixed blocked time being offered as special slots, unblock creating special slots, and delete blocking time.
- 2026-11-23 — Admin responsive pass, Holidays: holiday cards with date tile, fixed-width table from laptop width,
  and a one-column form on tablets.
- 2026-11-23 — Admin responsive pass, Coupons: coupon cards with usage bar, fixed-width table from laptop width,
  amounts as ₹1,000, and a one-column form on tablets.
- 2026-11-24 — Admin responsive pass, Dispute Chats: WhatsApp-style list then conversation on phones, side by side
  from tablet width, search, open chat kept in the address, real voice player, opens at the newest message.
- 2026-11-24 — Admin responsive pass, Reviews: shared page header and breadcrumbs, filters kept in the address,
  review cards in two columns from laptop width, full-size Delete and Restore, shared pagination.
- 2026-11-24 — Admin responsive pass, Platform Wallet: shared header and breadcrumbs, filters kept in the address,
  escrow cards with booking links. Fixed wallet pagination (frontend read total/pages; server sends
  totalItems/totalPages), so records after the first 10 are reachable on admin and stylist wallets.
- 2026-11-24 — Admin responsive pass, Notifications (shared by customer, stylist and admin): shared header and
  breadcrumbs shown once, status and day filters kept in the address, notification cards that wrap long text.
  Admin responsive pass complete: Dashboard through Notifications.
- 2026-11-24 — Bug fixes: category and service names keep their capitals (duplicates still blocked in any case);
  restoring a category or service makes it Active again; editing a disabled branch service's price keeps it
  disabled; avatars without a photo (or with a broken one) show only the initial or icon.
- 2026-11-24 — Deleted chat preview shows a small gray icon instead of the red emoji (old saved previews too).
  Notification bell panel spans the width under the header on phones instead of hanging to the left.
  Customer header fits 320 px phones (the name hides below 360 px so every icon stays on screen).
- 2026-11-24 — Popups (dropdowns, selects, menus, tooltips, dialogs, sheets) take the side colour of the page they
  open from: green on admin pages, blue on stylist pages, coral for customers.
- 2026-11-24 — Carousel arrows (Stylists and Services filter rows, service details) show only when there is more
  to scroll in that direction, instead of always showing greyed out.
- 2026-11-24 — Stylist responsive pass, Dashboard: same layout as the admin dashboard through shared dashboard
  components (period filter, stat card, status ring, chart helpers); amounts as ₹1,00,000; quick links to
  Appointments and My Slots. Fixed Specific Date sending the previous day.
- 2026-11-24 — Stylist responsive pass, Appointments: Today / All / day / search kept in the address, one clean
  card per booking (price and status once), two-column action buttons, two cards per row on laptops; detail
  page with amounts as ₹1,00,000 and actions beside the details on laptops. Today now uses the local date.
- 2026-11-24 — Stylist responsive pass, My Schedule: three tabs side by side on phones (Weekly / Daily / Breaks),
  readable Daily calendar with a key and coloured bars on small screens, bigger break delete button, break
  reasons wrap. Shared with the admin stylist schedule.
- 2026-11-24 — Stylist responsive pass, Leave Requests: request history as cards (leave type in words, clear
  status badge, day count, full reason and admin remark, Withdraw button); form fits phones, end date follows the
  start date, form beside history only from laptop width.
- 2026-11-24 — Stylist responsive pass, My Wallet: same look as the admin Platform Wallet (shared escrow card),
  All / Held / Released filter and search kept in the address, release dates in words, booking numbers link to
  the appointment, loading and empty states on every screen size.
- 2026-11-24 — Stylist responsive pass, Reviews: same look as the admin Reviews page through shared review
  card and filters (search, All / Today / 7 days / 30 days, day; kept in the address), rating overview card,
  two cards per row on laptops, 10 per page.
- 2026-11-24 — Stylist responsive pass, Profile: photo beside the forms on laptops, one-column fields on tablets,
  full-width Cancel / Save on phones. Stylist top bar: title and name only from laptop width, long names
  shortened. Stylist responsive pass complete: Dashboard through Profile.
- 2026-11-24 — Customer responsive pass, Home: hero gets the same side margin as the rest of the page; Popular
  Services and client reviews swipe sideways on phones; Top Rated Stylists two per row on phones; Trending
  Hairstyles three per row from tablet width. Phone page height about 10,400 px to 6,100 px.
- 2026-11-24 — Customer responsive pass, Branches: plain-words note when location is off (not the browser's
  error text), working search icon, the chosen branch is marked Selected, slightly tighter cards on phones.
- 2026-11-24 — Customer responsive pass, Services: compact rows on phones and small tablets (photo beside the
  details; buttons stack below 360 px), photo cards from tablet width; service details puts the category above
  the title and gives review dates readable text. Phone list height about 6,250 px to 4,000 px.
- 2026-11-24 — Customer responsive pass, Stylists: shorter photos on phones, readable service tags and contact
  labels, larger favourite (heart) buttons with labels for screen readers. Booking page already fit.
- 2026-11-24 — Customer responsive pass, Cart and payment: all amounts as ₹1,00,000 (cart, checkout, payment
  result) through a shared formatRupees helper; chosen slot shown as Thu, 26 Nov · 11:00; long service names
  wrap; bigger Remove and Change buttons; readable notes; readable cart count bubble in the header.
- 2026-11-24 — Customer responsive pass, My Bookings: one compact card per booking (services on one line,
  readable status and payment, amount as ₹1,00,000, two-column buttons), two cards per row on laptops; booking
  page with readable labels, tidy service rows and a coral Reschedule button. Phone list about 4,600 px to
  2,700 px. Reschedule and review pages already fit.
- 2026-11-24 — Stylist fixes: Completed buttons are green (appointments list and details); appointment details
  fill the full width when there are no action buttons; Slots has a Pick calendar to jump to any day up to 90
  days ahead (admin date box too). Server allows 90 days only for the admin and stylist slot views; customers
  still book 14 days ahead.
- 2026-11-24 — Customer responsive pass, Profile/Favourites/Wallet: readable wallet dates, labels and badges;
  bigger Add Money button; larger show/hide password buttons with labels. Breadcrumbs: one per page (removed
  "Back to Services/Stylists" links), and on Services and Stylists the breadcrumb sits inside the pink header,
  lined up with the page content.
- 2026-11-24 — Customer responsive pass, Chat: long links and words wrap inside the bubble instead of running
  off the screen (this also pushed the whole tablet layout sideways); bigger message "…" buttons; readable times,
  booking numbers, unread and header count bubbles. Shared with the stylist chat.
- 2026-11-24 — Services: the whole service card opens the service page (Add to Cart still adds). Each service
  now has two photos: a card photo for lists and a page photo for the service page (new detailImageUrl; upload
  and delete take ?kind=detail). The service page falls back to the card photo when no page photo is set, and
  the seed copies the card photo into the page photo. Admin service form shows both photos side by side.
