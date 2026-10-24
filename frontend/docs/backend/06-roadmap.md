# Madar — Backend Plan: 06 Roadmap

> Every phase must be **runnable and testable** on its own. Effort: S (≤1 day), M (2–4 days),
> L (1–2 weeks). Free tooling only. Windows/PowerShell first.

## Phase 0 — Tooling & repo (S)
**Goal:** a developer can clone, run one command, and get services up.
Tasks:
- [ ] Create `backend/` NestJS app (`npm i -g @nestjs/cli` then `nest new backend`).
- [ ] Add `docker-compose.yml` (Postgres + MinIO + Mailpit) — `01-architecture.md` §10.
- [ ] Add ESLint/Prettier, `.env.example`, `.gitignore` (`node_modules`, `dist`, `.env`).
- [ ] GitHub Actions: install → lint → typecheck → test.
Modules: none. Endpoints: none.
Acceptance: `docker compose up -d` shows 3 healthy containers; `npm run start:dev` boots the empty app.
DoD: CI green on an empty app. Rollback: delete `backend/` and `docker-compose.yml`; frontend untouched.
Risks: Docker Desktop/WSL2 setup on Windows (see §first 7 days).

## Phase 1 — Skeleton (S)
**Goal:** the HTTP foundation with no domain yet.
Tasks:
- [ ] Config module with Zod-validated env (`01-architecture.md` §4).
- [ ] `PrismaService` + first migration + connection check.
- [ ] Global `ZodValidationPipe`, `HttpExceptionFilter` (error envelope §6), `RequestIdInterceptor`.
- [ ] `pino` logging; `helmet`; CORS from `CORS_ORIGINS`.
- [ ] Swagger at `/api/docs`; `/health` + `/health/ready`; graceful shutdown.
- [ ] Prisma seed reproduces `src/data/*` (start with users + workspaces).
Modules: `config`, `database`, `health`. Endpoints: `/health`, `/health/ready`.
Tests: health returns 200; ready fails when DB down.
Frontend: none yet.
Acceptance: `curl http://localhost:3000/health` → 200; Swagger UI loads.
DoD: error envelope returned for a bad route; requestId present. Rollback: revert to Phase 0 tag.
Risks: Prisma on Windows (native engine) — use WSL2 if needed.

## Phase 2 — Auth + users + sessions + RBAC (M)
**Goal:** real login, tokens, guards.
Tasks:
- [ ] `users`, `refresh_tokens`, `password_reset_tokens`, `security_events` tables.
- [ ] argon2 hashing; `/auth/login|register|refresh|logout|password/forgot`; demo endpoint.
- [ ] Access JWT + rotating refresh (hash, reuse detection) — `04-auth-security.md` §1.2.
- [ ] `PermissionsGuard` + `@RequirePermission` using `src/constants/permissions.ts:7-35`.
- [ ] Rate limiting + lockout on `/auth/*`; failed-login security events.
- [ ] `/users`, `/users/:id`.
Modules: `auth`, `users`, `common/guards`. Endpoints: `03-api-spec.md` §1–2.
Tests: login happy/sad, refresh rotation, reuse detection, register conflicts, guard denies.
Frontend: wire `setTokenProvider` + `httpAuthService` (see `07-frontend-integration.md`).
Acceptance: sign in with `demo@taskflow3d.com` / `Demo123!` against the real API in the browser.
DoD: 401 on expired access; refresh works silently. Rollback: keep `authService` on mock via env flag.
Risks: cookie/CSRF decision (Q9) — keep the header-only fallback if blocked.

## Phase 3 — Workspaces, members, invitations (M)
**Goal:** multi-tenant isolation.
Tasks: `workspaces`, `workspace_members`, `invitations` tables; personal-workspace rule
(`mockWorkspaceService.ts:6-24`); members/invitations endpoints (`03-api-spec.md` §3–4);
`WorkspaceScopeGuard`. Email invites via Mailpit.
Modules: `workspaces`, `members`.
Tests: non-member gets 403; invite → activity + notification; role change.
Frontend: `httpWorkspaceService`, new `membersService`.
Acceptance: switching workspace in the UI loads only that workspace's data.
DoD: cross-workspace access impossible. Rollback: mock workspace service.
Risks: extracting a members contract first (Q2).

## Phase 4 — Projects & tasks (L)
**Goal:** the core product.
Tasks: `projects`, `project_members`, `tasks`, `subtasks`, `task_comments`, `time_entries` tables;
CRUD + bulk + soft-delete + restore; **recurrence spawn** (`src/store/taskStore.ts:44-73`);
activity + `task_assigned` notification side effects (`taskStore.ts:93-107`); calendar assembly
(`mockCalendarService.ts`).
Modules: `projects`, `tasks`, `calendar`.
Tests: recurrence dates, optimistic rollback, bulk, restore, calendar filters.
Frontend: `httpTaskService`, `httpProjectService`, `httpCalendarService`.
Acceptance: create → complete → see the next recurring task appear; Kanban drag persists.
DoD: all side effects present in DB. Rollback: env flag back to mock.
Risks: extracting subtasks/comments from the embedded arrays changes the Task DTO — coordinate with
frontend (`02-data-model.md` §7).

## Phase 5 — Files + storage (M)
**Goal:** real uploads.
Tasks: `files` table; `FileStorage` abstraction + MinIO; presign → PUT → confirm flow
(`05-realtime-files.md` §6.2); quota; download; activity events.
Modules: `files`, `storage`.
Tests: quota rejection, type/size limits, signed URL expiry, orphan cleanup.
Frontend: `httpFileService` + upload-with-progress.
Acceptance: upload a file, download it, see storage usage change.
DoD: object in MinIO, row in DB, activity recorded. Rollback: mock file service.
Risks: presign/CORS on MinIO — configure bucket CORS.

## Phase 6 — Activity + notifications + SSE (M)
**Goal:** live notifications.
Tasks: `activity_events`, `notifications` tables; list/mark/read/delete; **dedupe rule**
(`notificationStore.ts:68-75`); SSE `/notifications/stream` with ticket auth; fan-out from services.
Modules: `activity`, `notifications`, `realtime/sse`.
Tests: dedupe, unread count, SSE delivery.
Frontend: `httpActivityService`, `httpNotificationService` + SSE client.
Acceptance: completing a task assigned to another user pushes a notification live.
DoD: SSE reconnects and replays missed events. Rollback: mock notification service.
Risks: EventSource header limitation → ticket pattern.

## Phase 7 — Chat & DMs + WebSocket (L)
**Goal:** realtime chat.
Tasks: channels, channel_messages, reactions, mentions, thread, read-state, conversations tables;
extract a **chat contract** first; REST writes + WS delivery (`05-realtime-files.md` §3.1);
permissions (announcements, edit/delete).
Modules: `chat`, `realtime/ws`.
Tests: permission matrix, soft delete, reaction toggle, thread replyCount, DM dedupe.
Frontend: `httpChatService` + WS client replacing typing simulation.
Acceptance: two browsers exchange messages/reactions/typing in real time.
DoD: reconnect replays missed messages. Rollback: mock chat service.
Risks: contract extraction is a prerequisite (Q2); ordering/idempotency.

## Phase 8 — Search + focus + analytics (M)
**Goal:** the insight layer.
Tasks: `pg_trgm` + normalised `search_text` columns (`02-data-model.md` §6); `/search` with tiered
scoring + Arabic normalisation (`mockSearchService.ts:13-54`); `recent_searches`; `focus_sessions`;
analytics aggregates; CSV export.
Modules: `search`, `focus`, `analytics`.
Tests: Arabic normalisation, scoring order, counts, analytics ranges.
Frontend: `httpSearchService`, `httpFocusService`, `httpAnalyticsService`.
Acceptance: Arabic query finds the right task; analytics numbers change after completing tasks.
DoD: search parity with the mock on seed data. Rollback: mock services.
Risks: matching the mock's exact score tiers in SQL.

## Phase 9 — AI assistant (M)
**Goal:** keep behaviour, make it server-side.
Tasks: port the intent engine (`mockAiService.ts:23-74`) to a service; `/ai/chat` (+ optional SSE
tokens); persist history per user+workspace.
Modules: `ai`.
Tests: intent detection for AR/EN, hour extraction, fallbacks.
Frontend: `httpAiService`.
Acceptance: same answers as mock for the three chips (`ai.chips.*`).
DoD: history persists across reloads. Rollback: mock AI service.
Risks: a real LLM is optional; do **not** add a paid provider (Q8).

## Phase 10 — Admin suite (L)
**Goal:** moderation & oversight.
Tasks: admin users/workspaces/tasks/projects; reports workflow (`New|Reviewing|Resolved|Rejected`);
security events + session revoke; system settings; audit log; analytics; CSV export.
Modules: `admin`, `audit`.
Tests: each endpoint's permission; audit row written; report status transitions.
Frontend: `httpAdminService`, `httpAuditService`.
Acceptance: suspend a user, change a role, resolve a report — all logged in audit.
DoD: super_admin-only routes blocked for admin. Rollback: mock admin service.
Risks: i18n keys in audit/security events must stay language-neutral (`03-api-spec.md` §17).

## Phase 11 — Hardening (M)
**Goal:** production-ready.
Tasks: finalize rate limits; security review against `04-auth-security.md` §13; basic load test
(k6/autocannon); backups + restore drill; retention jobs; optional 2FA; optional thumbnails; logging
polish; dependency audit.
Acceptance: security checklist all checked; restore drill succeeds.
DoD: no P1 open in `08-open-questions.md`. Rollback: N/A (config only).
Risks: scope creep — keep 2FA/thumbnails optional.

## Phase 12 — Free deployment (M)
**Goal:** public URL, zero cost.
Tasks:
- [ ] Frontend → Vercel / Netlify / Cloudflare Pages (all free; frontend is a static Vite build).
- [ ] Backend + Postgres → a free tier (e.g. Render/Railway/Fly.io free web service + free Postgres).
- [ ] Storage → Cloudflare R2 free tier (S3-compatible) or MinIO on the same host.
- [ ] Env management per environment; set `VITE_API_URL`/`VITE_WS_URL`; CORS to the real domain.
- [ ] Domain + free HTTPS; CI/CD (GitHub Actions deploy).
Acceptance: sign in and create a task on the public URL.
DoD: `06-roadmap.md` Phase 12 checklist done. Rollback: point DNS back; keep local compose.
Risks: **free tiers change and may sleep** — document cold-start; keep local compose as the source of
truth.

## Definition of Done (every phase)
Runnable locally, tests green in CI, Swagger updated, no secrets committed, frontend still works in
mock mode, and the phase's acceptance check passes.

## Rollback (every phase)
Because each `src/services/*.ts` chooses mock vs HTTP by env (`01-architecture.md` §14), rolling back
a phase = flip that service back to the mock. No data loss for the user's frontend session.

## First 7 days (beginner schedule)

| Day | Focus | Concrete outcome |
|---|---|---|
| 1 | Install Node 20, Docker Desktop (WSL2 backend), Git. Create `backend/`. | `nest new backend` boots; `docker compose up -d` shows Postgres. |
| 2 | Phase 0 + start Phase 1: config, Prisma connect, `/health`. | `curl /health` → 200. |
| 3 | Phase 1 finish: error envelope, logging, Swagger, seed users/workspaces. | Swagger UI lists `/health`; seed visible in Prisma Studio. |
| 4 | Phase 2 start: user table, argon2, `/auth/register`, `/auth/login`. | Register + login via Swagger. |
| 5 | Phase 2 finish: refresh rotation, guards, rate limit, `/users`. | Expired access auto-refreshes. |
| 6 | Wire the frontend: `setTokenProvider` + `httpAuthService`. | Browser login against the real API. |
| 7 | Review, write tests, tag Phase 2. | CI green; `08-open-questions.md` updated. |

### Windows commands (PowerShell)
```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
# prerequisites
winget install OpenJS.NodeJS.LTS
winget install Docker.DockerDesktop
# enable WSL2 if asked:  wsl --install
# backend
npm i -g @nestjs/cli
nest new backend
cd backend
npm install @nestjs/config @nestjs/swagger @nestjs/throttler @prisma/client zod
npm install -D prisma
# services
cd ..
docker compose up -d          # Postgres + MinIO + Mailpit
# db
cd backend
npx prisma migrate dev --name init
npx prisma studio             # free GUI at http://localhost:5555
# run
npm run start:dev             # http://localhost:3000  (Swagger at /api/docs)
```
Tip: if Docker Desktop is unavailable, install Postgres/MinIO via WSL2 Ubuntu, or run Postgres in
WSL2 and keep only that container.
