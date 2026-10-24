# Madar — Backend Plan: 07 Frontend Integration

> This file lists the exact frontend changes needed to consume the backend. **No code is changed in
> this planning task** — these are tasks for later. Current state cited per file.

## 1. How the swap works today

Each service file exports a mock (verified):
`src/services/taskService.ts:1-5`, `authService.ts`, `userService.ts`, `workspaceService.ts`,
`projectService.ts`, `activityService.ts`, `notificationService.ts`, `settingsService.ts`,
`calendarService.ts`, `fileService.ts`, `searchService.ts`, `focusService.ts`, `aiService.ts`,
`analyticsService.ts`, `chatService.ts`, `adminService.ts`, `auditService.ts`.
The HTTP foundation is `src/api/adapters/http/httpClient.ts` (base URL `VITE_API_URL`, bearer token,
refresh-once-on-401) and it is **not imported anywhere yet**.

## 2. Per-service integration plan

| Service file | Current export | HTTP adapter to create | Endpoints | Frontend changes required |
|---|---|---|---|---|
| `authService.ts` | `mockAuthService` | `src/api/adapters/http/httpAuthService.ts` | `/auth/*` (§1) | `setTokenProvider` wiring; persist `tokens`; map `AuthErrorCode` from `code`; remove demo credentials from login UI (`src/pages/auth/LoginPage.tsx:102-123` currently shows them) |
| `userService.ts` | `mockUserService` | `httpUserService.ts` | `/users`, `/users/:id` | none structural (`Paged` already used) |
| `workspaceService.ts` | `mockWorkspaceService` | `httpWorkspaceService.ts` | `/workspaces*` | none |
| `taskService.ts` | `mockTaskService` | `httpTaskService.ts` | `/workspaces/:id/tasks`, `/tasks/*` | pagination in list; DTO map for nested subtasks/comments; optimistic rollback already handled (`src/store/taskStore.ts:33-42`) |
| `projectService.ts` | `mockProjectService` | `httpProjectService.ts` | `/projects*` | add `updatedAt` if needed (`02-data-model.md` §7) |
| `activityService.ts` | `mockActivityService` | `httpActivityService.ts` | `/workspaces/:id/activity`, `/users/:id/focus-sessions` | pagination (activity list is long) |
| `notificationService.ts` | `mockNotificationService` | `httpNotificationService.ts` | `/notifications*`, SSE | replace `subscribe` callback with an SSE client; keep the store API (`src/store/notificationStore.ts:32-40`) |
| `settingsService.ts` | `mockSettingsService` | `httpSettingsService.ts` | `/me/preferences` | none |
| `calendarService.ts` | `mockCalendarService` | `httpCalendarService.ts` | `/workspaces/:id/calendar` | decide on `rawTask`/`rawProject` payload (Q7) |
| `fileService.ts` | `mockFileService` | `httpFileService.ts` | `/files*`, `/storage` | upload with presign + progress; download via signed URL |
| `searchService.ts` | `mockSearchService` | `httpSearchService.ts` | `/search*` | keep debounce (`src/store/searchStore.ts:24,48-60`); handle `hasMore` |
| `focusService.ts` | `mockFocusService` | `httpFocusService.ts` | `/focus/sessions` | none |
| `aiService.ts` | `mockAiService` | `httpAiService.ts` | `/ai/*` | map `streamPrompt` to SSE tokens (keep `onToken` signature) |
| `analyticsService.ts` | `mockAnalyticsService` | `httpAnalyticsService.ts` | `/analytics/overview` | none |
| `chatService.ts` | `mockChatService` | `httpChatService.ts` | `/channels*`, `/conversations*` | **extract a chat contract first**; add WS client; replace typing simulation (`src/store/chatStore.ts:245-265`) |
| `adminService.ts` | `mockAdminService` | `httpAdminService.ts` | `/admin/*` | pagination on lists; error mapping |
| `auditService.ts` | `mockAuditService` | `httpAuditService.ts` | `/admin/audit` | pagination |

The env-flag pattern for every file (**PROPOSED**):
```ts
export const taskService: TaskService =
  import.meta.env.VITE_API_URL ? httpTaskService : mockTaskService;
```
This keeps mock mode working offline and lets each phase roll back independently
(`06-roadmap.md` §Rollback).

## 3. Cross-cutting frontend tasks (do these first)

1. **`setTokenProvider`** — call it once at startup so `httpClient` attaches the JWT and refreshes on
   401. The provider should read the access token and call `/auth/refresh` (the store already holds
   `refreshToken`: `src/store/authStore.ts:79`).
2. **Extend `HttpError`** — `src/api/adapters/http/httpClient.ts:8-16` exposes only `status`; add
   `code` and `fieldErrors` parsed from the error envelope (`03-api-spec.md` §22), and map auth codes
   to the existing `AuthErrorCode` union (`src/api/contracts/auth.ts:3-9`).
3. **Env wiring** — `VITE_API_URL`, `VITE_WS_URL`; a Vite dev proxy (`/api` → `localhost:3000`) to
   avoid CORS in dev; update `.env.example` (`frontend/README.md:16,60`).
4. **Service worker exclusions** — the SW (`public/sw.js`) must not cache `/api/*` or WebSocket
   upgrade requests; only cache the app shell (`frontend/README.md:49-53`).
5. **Extract missing contracts** — create `src/api/contracts/chat.ts`, `admin` is done, plus
   `members.ts` and `audit.ts`, and re-export `focus/ai/analytics/admin` from
   `src/api/contracts/index.ts` (currently missing, `index.ts:1-11`). Needed before adapters.
6. **Remove demo credentials from production UI** — `src/pages/auth/LoginPage.tsx:102-123` and the
   empty `login.exploreDemo` key (`src/i18n/locales/en.json:145`) should not ship in prod builds.
7. **Realtime client** — a small SSE client (notifications) + WS client (chat) with backoff, wired to
   the existing store APIs.
8. **Upload with progress** — presign then `fetch`/XHR with `onprogress`.
9. **Pagination in lists** — Tasks, Files, Chat messages, Activity, Audit currently load everything.
10. **Loading/error states + optimistic rollbacks** — already present in some stores
    (`src/store/taskStore.ts:33-42`); audit the rest.
11. **Offline queue** — **DEFERRED**: queue mutations when offline and flush on reconnect (later
    phase; the SW exists but no queue today).

## 4. Migration order (keeps the app working at every step)

1. Cross-cutting tasks §3.1–3.5 (no behaviour change in mock mode).
2. Auth → then `userService` → `workspaceService` (Phase 2–3).
3. Tasks → Projects → Calendar (Phase 4).
4. Files (Phase 5).
5. Activity → Notifications/SSE (Phase 6).
6. Chat/WS (Phase 7).
7. Search → Focus → Analytics (Phase 8).
8. AI (Phase 9).
9. Admin → Audit (Phase 10).

Each step: flip one `src/services/*.ts` to the HTTP adapter behind the env flag, verify in the
browser, keep the mock importable for rollback.

## 5. DTO → frontend type mapping notes

- Dates: server sends ISO-8601; frontend already parses ISO (`src/types/tasks.ts:38-39`,
  `src/utils/dates.ts`). Keep `AuthTokens.expiresAt` as **epoch ms** (`src/types/index.ts:20`).
- Nested arrays: `Task.subtasks`, `Task.comments`, `ChannelMessage.reactions` must be assembled by the
  server (or a thin mapper) to match `src/types/tasks.ts:32-33` and `src/types/chat.ts:32`.
- Computed fields: `Workspace.memberIds`, `Project.memberIds`, `Channel.unreadCount`,
  `Conversation.lastMessage/unreadCount`, `WorkspaceFile.projectName` are derived — the server
  computes them so the frontend types stay unchanged (`02-data-model.md` §7).
- Enums must serialize as the exact lowercase strings in `src/types/*` (e.g. `in_progress`,
  `on_hold`, `super_admin`).

## 6. Contract tests (run the same assertions against both adapters)

Idea: one test file per contract that takes a `TaskService` (etc.) instance and asserts behaviour
(create → list contains it; complete sets `completedAt`; recurrence spawns the next task;
permission errors). Run it twice: once with `mockTaskService`, once with `httpTaskService` against a
seeded test DB. If both pass, the swap is safe. This is the cheapest way to guarantee parity and is
free (Jest/Vitest).
