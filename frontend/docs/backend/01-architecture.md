# Madar — Backend Plan: 01 Architecture

> Every framework/ORM claim is a **recommendation (PROPOSED)**; frontend facts are cited.
> Constraint: everything must be free to run; local-first via Docker; owner is a backend beginner.

## 1. Stack decision

### 1.1 Framework: NestJS vs Fastify

| Criterion | NestJS | Fastify (raw) |
|---|---|---|
| Structure for a beginner | Opinionated modules/controllers/services = clear place for everything | Minimal; you invent structure |
| Guards/roles | Built-in `CanActivate` guards + decorators map directly to the RBAC in `src/constants/permissions.ts:7-35` | Manual hooks |
| Validation | First-class pipes + Zod integration | Manual |
| WebSocket | First-class gateway (`@nestjs/websockets`) for chat | `@fastify/websocket` |
| OpenAPI | `@nestjs/swagger` decorators → free Swagger UI | `@fastify/swagger` |
| Learning curve | Steeper up front, easier later | Shallower start, more glue later |
| Docs/community | Very large | Large |

**Recommendation: NestJS.** The frontend is *contract-first* with typed service interfaces
(`src/api/contracts/*`) and cumulative RBAC (`src/constants/permissions.ts`). NestJS mirrors that 1:1
(one module per contract, one guard reusing the permission strings), which means a beginner writes
almost no infrastructure code and cannot easily put things in the wrong place. Fastify would be
faster at runtime but pushes architectural decisions onto the owner.

> Note: NestJS runs on Fastify or Express under the hood — you can use `@nestjs/platform-fastify`
> later for speed without changing application code. Start with the default Express adapter.

### 1.2 ORM: Prisma vs Drizzle

| Criterion | Prisma | Drizzle |
|---|---|---|
| Schema readability | Single `schema.prisma`, very readable | TS-first, more code-like |
| Migrations | `prisma migrate dev` (guided) | `drizzle-kit` (manual SQL-ish) |
| Type safety | Generated client | Inferred types |
| Beginner friendliness | High (Prisma Studio GUI to browse data) | Medium |
| Raw SQL control | `$queryRaw` when needed | Excellent |
| Full-text search | `$queryRaw` with `to_tsvector` | Same, easier to express |

**Recommendation: Prisma.** Prisma Studio gives the owner a free GUI to inspect seeded demo data
(needed to verify seeds match `src/data/*`), and migrations are a single command. Both can do the
PostgreSQL full-text search we need via raw SQL.

### 1.3 Final stack (all free)

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript | Matches frontend (`frontend/README.md:16`) |
| Framework | NestJS (Express adapter) | See 1.1 |
| ORM | Prisma | See 1.2 |
| Database | PostgreSQL 16 | Relational model fits workspaces/roles/FKs |
| Validation | Zod (shared package) | Frontend already uses Zod (`frontend/package.json`, `src/schemas/auth.ts`) |
| Auth | argon2id + JWT (access) + rotating refresh tokens | Free, no vendor |
| Realtime | WebSocket (chat) + SSE (notifications) | Native, no paid broker |
| Files | S3-compatible via abstraction (MinIO local) | Provider-agnostic; R2 later |
| Cache/queue | **None initially** | Single instance; justify Redis only if needed (§1.4) |
| Email (dev) | Mailpit (Docker) | Free, local SMTP capture |
| Docs | Swagger UI via `@nestjs/swagger` | Free |
| CI | GitHub Actions | Free for public repos |

### 1.4 Do we need Redis?
**No, not initially.** The frontend has no cross-instance state today. Add Redis only when:
(a) you run more than one backend instance and need WebSocket pub/sub, or (b) you need background
jobs (deadline reminders). Until then, in-process memory + PostgreSQL is enough and free.

## 2. Repository layout: monorepo (recommended)

**Recommendation: monorepo** with a shared contracts/schemas package, because the frontend already
defines the exact request/response shapes we must implement (`src/api/contracts/*`, `src/types/*`).
Sharing Zod schemas removes drift and is free (npm workspaces).

```
madar/                          (repo root)
  frontend/                     (existing React app — unchanged in structure)
  backend/                      (new NestJS app)
    src/
      main.ts                   bootstrap, global pipes/filters, CORS, Swagger
      app.module.ts
      config/                   env loading + validation (Zod)
      common/                   filters, interceptors, guards, decorators, pagination DTOs
      database/                 PrismaService, seed/
      modules/                  one folder per contract/domain
        auth/  users/  workspaces/  members/  tasks/  projects/
        activity/  notifications/  files/  calendar/  search/
        focus/  ai/  analytics/  settings/  chat/  admin/  audit/  health/
          <domain>.module.ts
          <domain>.controller.ts   (HTTP routes)
          <domain>.service.ts      (business rules)
          <domain>.repository.ts   (Prisma access)
          dto/                     (Zod schemas + inferred types)
      realtime/                 ws gateway + sse controller
      storage/                  file storage abstraction (disk | minio | r2)
    prisma/
      schema.prisma
      migrations/
      seed.ts
    test/
    Dockerfile
    package.json
  packages/
    shared/                     (optional) Zod schemas + types shared with frontend
  docker-compose.yml
  .env.example
```

If a monorepo feels heavy at first, keep `backend/` standalone and copy the small Zod schemas into
it; promote to `packages/shared` in Phase 8. See `08-open-questions.md` Q1.

## 3. Layering

```
HTTP/WS  →  Controller/Gateway   (parse + validate + auth guard; no business logic)
         →  Service             (business rules from 00-overview §4; transactions)
         →  Repository          (Prisma queries only)
         →  PostgreSQL
```

- **Controllers** call services; they never touch Prisma.
- **Services** own rules: recurrence (`src/store/taskStore.ts:44-73`), notification fan-out
  (`taskStore.ts:100-107`), permission checks (`src/constants/permissions.ts`), audit writes.
- **Repositories** are thin and mockable so services can be unit-tested without a DB.
- Cross-cutting concerns live in `common/`: `RolesGuard`, `WorkspaceScopeGuard`, `ZodValidationPipe`,
  `HttpExceptionFilter` (error envelope), `RequestIdInterceptor`.

## 4. Config & environment variables

Loaded once and validated with Zod at boot (fail fast). `.env.example` committed; `.env` ignored.

| Var | Purpose | Default (local) |
|---|---|---|
| `NODE_ENV` | environment | `development` |
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | Postgres DSN | `postgresql://madar:madar@localhost:5432/madar` |
| `JWT_ACCESS_SECRET` | access token signing | (dev random) |
| `JWT_ACCESS_TTL` | access token lifetime | `15m` |
| `REFRESH_TTL_DAYS` | refresh token lifetime | `30` |
| `CORS_ORIGINS` | allowed SPA origins | `http://localhost:5173` |
| `S3_ENDPOINT` | MinIO/R2 endpoint | `http://localhost:9000` |
| `S3_BUCKET` | bucket name | `madar-files` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | creds | `minioadmin` / `minioadmin` |
| `SMTP_URL` | Mailpit/SMTP | `smtp://localhost:1025` |
| `PUBLIC_WEB_URL` | links in emails | `http://localhost:5173` |
| `MAX_UPLOAD_MB` | upload limit | `25` |

The frontend reads `VITE_API_URL` and `VITE_WS_URL` (`src/api/adapters/http/httpClient.ts:6`;
`frontend/README.md:60`).

## 5. Logging

- **Structured JSON** via `pino` (`nestjs-pino`), one line per request with `requestId`, `userId`,
  `route`, `status`, `durationMs`.
- Never log passwords, tokens, or message bodies (PII rule; see `04-auth-security.md`).
- Human-readable pretty printing in dev, JSON in production (free, no vendor).

## 6. Error envelope (standard)

All errors return the same JSON so the frontend can map them once:

```json
{
  "code": "task_not_found",
  "message": "Task not found",
  "fieldErrors": [{ "field": "title", "message": "Required" }],
  "requestId": "01J..."
}
```

- HTTP status is the primary signal; `code` is a stable machine string.
- `fieldErrors` maps to form errors (the frontend already renders per-field errors via Zod,
  `src/schemas/auth.ts`).
- Auth errors must reuse the existing codes from `src/api/contracts/auth.ts:3-9`
  (`invalid_credentials`, `account_suspended`, `email_taken`, `username_taken`, `session_expired`).
- The frontend's `HttpError` currently only exposes `status` and `statusText`
  (`src/api/adapters/http/httpClient.ts:8-16`); a frontend task will extend it to read `code`
  (see `07-frontend-integration.md`).

## 7. Validation with Zod (shared)

- Each DTO is a Zod schema; NestJS uses a `ZodValidationPipe` to parse `body`/`query`/`params`.
- Inferred TS types are exported so controllers/services are typed end-to-end.
- **Shared idea:** put these schemas in `packages/shared` and import them in the frontend to
  validate before sending (frontend already depends on Zod). This guarantees the frontend's
  `NewTaskInput` (`src/api/contracts/tasks.ts:3`) and the server agree.

## 8. Testing strategy (what to test first)

1. **Unit** — pure business rules, no DB: recurrence date math (`taskStore.ts:44-73`), permission
   inheritance (`permissions.ts:44-52`), search scoring + Arabic normalisation
   (`mockSearchService.ts:13-54`), AI intent detection (`mockAiService.ts:23-50`).
2. **Integration** — service + real Postgres (Docker): tasks CRUD + recurrence, invitations,
   file quota, notification fan-out, RBAC guards.
3. **E2E (HTTP)** — `supertest` against the Nest app: login → create task → complete → assert
   activity + notification rows.
4. **Contract tests** — run the same assertions against the mock and the HTTP adapter
   (see `07-frontend-integration.md` §contract tests).
- Runner: Jest (NestJS default) or Vitest. Free.

## 9. Linting & formatting

- ESLint + `@typescript-eslint` + Prettier, shared config at repo root.
- `npm run lint`, `npm run format`, and a `pre-commit` hook via `husky` + `lint-staged` (free).
- CI runs `lint` + `typecheck` + `test` on every push (GitHub Actions, free).

## 10. Docker Compose (local services)

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_USER: madar, POSTGRES_PASSWORD: madar, POSTGRES_DB: madar }
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: minioadmin, MINIO_ROOT_PASSWORD: minioadmin }
    ports: ["9000:9000", "9001:9001"]
    volumes: ["miniodata:/data"]
  mailpit:            # optional, dev email capture
    image: axllent/mailpit
    ports: ["1025:1025", "8025:8025"]
  # redis:            # NOT needed yet (see §1.4)
volumes: { pgdata: {}, miniodata: {} }
```

The backend itself runs on the host (`npm run start:dev`) for fast reload; only services are in
Docker. On Windows use Docker Desktop with the WSL2 backend (see `06-roadmap.md` §first 7 days).

## 11. Migrations workflow

```
npx prisma migrate dev --name add_tasks      # create + apply in dev
npx prisma migrate deploy                    # apply in any environment
npx prisma studio                            # browse data (free GUI)
npx prisma migrate reset                     # drop + recreate + seed
```
Rule: never edit an applied migration; always add a new one.

## 12. Seed scripts (reproduce the demo)

`prisma/seed.ts` must reproduce the frontend demo so screens look identical:
- 3 demo accounts + 27 generated users → `src/data/users.ts:7-93` (emails `*@taskflow3d.com`,
  `*@example.com`).
- 5 workspaces incl. `ws-demo`, `ws-personal-u-001` → `src/data/workspaces.ts:6-57`.
- 79 tasks → `src/data/tasks.ts`; 15 projects → `src/data/projects.ts`.
- Workspace files → `src/data/files.ts`; notifications → `src/data/notifications.ts`.
- Activity + focus sessions → `src/data/activity.ts:6-47`.
- 6 chat channels + seeded messages → `src/api/mock/mockChatService.ts:8-69`.
- Demo accounts must use **hashed** passwords of `Demo123!`, `Admin123!`, `SuperAdmin123!`
  (`src/data/users.ts:7-11`).
The seeder should be idempotent (upsert by fixed id like `u-001`, `ws-demo`).

## 13. API conventions

- **Versioning:** all routes under `/api/v1` (the frontend's comments already use `/api/...` and
  `/api/focus/sessions`, e.g. `src/api/contracts/focus.ts:4`).
- **Pagination:** **cursor-based** for large/unstable lists (tasks, messages, activity, audit),
  **page-based** where the UI already pages (`users.list` uses `page`/`pageSize`,
  `src/api/contracts/users.ts:3-8`). Response envelope for cursor:
  `{ items: T[], nextCursor: string | null }`; page-based keeps `Paged<T>`
  (`src/types/index.ts:43-48`).
- **Sorting/filtering:** explicit query params (`sort=dueDate:asc`, `status=`, `priority=`,
  `projectId=`, `assigneeId=`, `q=`), validated by Zod. Matches `FilterState`
  (`src/types/tasks.ts:48-56`).
- **Idempotency:** `Idempotency-Key` header honored on POSTs that can be retried (create task,
  send message, upload) — store key+result for 24h.
- **Rate limiting:** per-route classes via `@nestjs/throttler` — stricter on auth (`/auth/login`,
  password reset) than reads. See `04-auth-security.md`.
- **CORS:** allow `CORS_ORIGINS` (Vite dev origin `http://localhost:5173` today; add the future
  domain in `06-roadmap.md`). Credentials only if using cookies (see auth decision).
- **OpenAPI:** `@nestjs/swagger` generates `/api/docs` (Swagger UI) and `/api/docs-json`; keep
  DTOs decorated so the spec stays accurate.
- **Health:** `GET /health` (liveness) and `GET /health/ready` (DB + storage reachable).
- **Graceful shutdown:** `app.enableShutdownHooks()`; close Prisma + WS on `SIGTERM/SIGINT`.

## 14. Frontend adapter swap point (how the app flips to real)

The single point of change is each `src/services/*.ts` file. Example today:
`src/services/taskService.ts:1-5` exports `mockTaskService`. After the backend exists, the same file
exports a REST adapter:

```ts
// PROPOSED
export const taskService: TaskService =
  import.meta.env.VITE_API_URL ? httpTaskService : mockTaskService;
```

This keeps **both modes working** (mock offline, HTTP when configured) — see
`07-frontend-integration.md` for the per-service plan and the migration order.
