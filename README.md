# SalonBook

Salon booking platform — live at https://www.salonbook.online

| Folder | What | Hosted on |
|---|---|---|
| `backend/` | Express 5 + TypeScript API, MongoDB, Redis, socket.io | Render (Root Directory `backend`) |
| `frontend/` | React 19 + Vite + Tailwind | Vercel (Root Directory `frontend`) |
| `docs/` | Architecture, setup guide, phased build plan, progress | — |

## Quick start
```bash
npm install                 # root: git hooks (husky + commitlint)
npm --prefix backend install && npm --prefix frontend install
npm run dev:backend         # http://localhost:5001  (needs backend/.env.local)
npm run dev:frontend        # http://localhost:5173  (needs frontend/.env.local)
```

## Workflow
Branch → PR → CI green → merge to `main` → Render + Vercel deploy automatically.
Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:` …).

See [docs/](docs/README.md) for everything else.
