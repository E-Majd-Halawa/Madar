# Madar (مدار) — Agent Rules (read first, always)

## Project
Monorepo E:\projects\taskflow-3d: `backend/` (NestJS + Prisma 7 + Postgres 16) and `frontend/` (React + Vite, mock-first).
Roadmap numbering = frontend/docs/backend/06-roadmap.md ONLY. Code wins over docs; report conflicts.

## Environment
- Windows + PowerShell. PATH is broken: run `$env:Path += ";C:\Windows\System32"` before commands. Prefer Select-String over findstr.
- No Docker, Redis, MinIO, Mailpit, or paid services. Local Postgres, dev DB `madar`. Local file storage for dev; production will need an S3-compatible driver.
- Repo root only has git. Never `git init` elsewhere.

## Hard rules
- NEVER run: git add/commit/push/checkout/stash/reset/clean; prisma migrate reset; prisma db push; npm install of new packages (stop and ask).
- NEVER read, print, or edit .env files, DATABASE_URL, tokens, passwords. `.env.example` placeholders are allowed.
- Do not touch: frontend/src/features/ai/AiOrbStage.tsx, frontend/src/features/shell/MobileNav.tsx, frontend/src/pages/app/AiPage.tsx.
- Edit frontend/ ONLY the files the prompt names. VITE_API_URL unset = mock mode must keep working.
- Smallest change. No refactors. Never delete files outside what the prompt names.
- Routes under /api/v1. Error envelope { code, message, fieldErrors?, requestId }.
- One additive migration per phase; never edit applied migrations.

## Workflow
- New phase: DISCOVERY (read-only) -> stop and wait for "GO" -> implement -> tests -> report.
- Tests are the acceptance gate: new behavior needs new tests; totals must increase. Never weaken or delete tests.
- Every claim needs evidence (file:line or real command output). Otherwise write UNVERIFIED. Never infer "done" from earlier reports.
- If unsure or blocked: stop and ask.

## Gates (run and show real output)
backend: npx tsc --noEmit; npm run lint; npm run format:check; npm test; npm run test:e2e
frontend: npx tsc --noEmit; npm run build (VITE_API_URL unset, then set, then unset)

## Report format
Summary, git status before/after, files changed, test totals before->after, UNVERIFIED list, proposed commit messages (user commits manually).

## Status (verify before trusting; update by the user only)
- DONE: P0 skeleton, P1 auth, P2 users/RBAC, P3 workspaces/members/invitations, P4 projects/tasks/calendar.
- P6 activity/notifications/SSE: code + tests done; live browser check pending.
- P5 files: in progress (backend step first). Not started: P7 chat, P8 search/focus/analytics, P9 AI, P10 admin, P11 hardening, P12 deployment.
- Baseline tests: unit 41, e2e 92 (11 files). Update when they change.