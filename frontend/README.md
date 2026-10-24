# Madar

Premium task and project management SaaS - frontend-first, API-ready. Built in phases on one architecture.

**Status: Phase 10 complete (Madar Rebrand, professional copy, CTAs, logo links, redesigned footer, and fully translated Focus page with custom durations).**

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds production bundle
npm run preview    # test production bundle locally (required for service worker / PWA testing)
```

Requires Node.js 20+. No environment variables are needed in mock mode (see `.env.example`).

**Rule**: Any build change or configuration update must be verified with `npm run preview` (recommended in Incognito) to validate production bundle integrity.

## Demo credentials (mock data only)

| Role        | Email                       | Password         |
|-------------|-----------------------------|------------------|
| User        | demo@taskflow3d.com         | Demo123!         |
| Admin       | admin@taskflow3d.com        | Admin123!        |
| Super Admin | superadmin@taskflow3d.com   | SuperAdmin123!   |

"Explore Demo" on `/login` enters the Demo Workspace with no account and shows a **Demo Mode** badge.

## Architecture

```
src/
  api/contracts/    service interfaces (the only thing the UI depends on)
  api/mock/         mock implementations + simulated latency
  api/adapters/http REST client foundation (JWT + refresh-on-401) for the real backend
  services/         one file per service; the swap point between mock and real API
  services/storage/ the only code that touches localStorage
  store/            Zustand stores
  constants/        roles, permissions, routes, themes, shortcuts
  components/ui     design-system primitives, accessible dialogs
  components/guards route guards
  features/         feature modules
  pages/            route pages (app, admin, auth, landing, onboarding, shared)
  i18n/             translations (English and Arabic RTL)
  animations/       motion presets
```

## PWA & Offline Notes

- Service worker (`/sw.js`) registers automatically in production mode (`npm run build` + `npm run preview`).
- Caches app shell, manifest, icons, and offline fallback (`/offline.html`).
- Test offline support by building for production and previewing locally.

## Connecting a real backend later

1. Implement each contract in `src/api/adapters/` using `http()` from `httpClient.ts`.
2. In `src/services/<name>Service.ts` export the REST adapter instead of the mock.
3. Call `setTokenProvider()` from the auth store so requests carry the JWT and refresh on 401.
4. Set `VITE_API_URL` (and `VITE_WS_URL` for WebSockets). The UI does not change.

## Roadmap

| Phase | Scope | Status |
|-------|-------|-------|
| 1 | Foundation (Theme engine, i18n RTL, RBAC guards, services, Zustand) | COMPLETE |
| 2 | Landing page + 3D R3F hero, WebGL fallback, quality tiers | COMPLETE |
| 3 | Auth screens, onboarding, demo mode, app shell, dashboard | COMPLETE |
| 4 | Tasks, task details, subtasks, dependencies, time tracking, Kanban | COMPLETE |
| 5 | Projects, calendar, Gantt, files, activity | COMPLETE |
| 6 | Chat, threads, direct messages, notifications | COMPLETE |
| 7 | AI assistant, analytics, search, command palette | COMPLETE |
| 8 | Admin suite & complete Arabic localization | COMPLETE |
| 9 | PWA/offline, accessibility pass, performance optimization, final QA | COMPLETE |
