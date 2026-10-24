# Madar (مدار) — Backend Plan: 00 Overview

> Status: PLANNING ONLY. No backend code exists yet. Every claim below cites a frontend file.
> Frontend root: `E:\projects\taskflow-3d\frontend`. Paths below are relative to that root.

## 1. Scope of this plan

Build a **free-to-run, local-first, incremental** backend for the existing Madar frontend
(`frontend/README.md:1-5`). The frontend is *mock-first*: the UI depends only on typed service
interfaces in `src/api/contracts/*`, and each `src/services/*.ts` currently exports a mock
implementation (`src/services/taskService.ts:1-5`). The backend's job is to implement those same
contracts over HTTP + WebSocket so the frontend can swap one file at a time.

This plan covers: architecture, data model, API spec, auth/security, realtime/files, roadmap,
frontend integration, and open questions. It does **not** cover mobile apps or billing.

## 2. Product facts (from code)

| Fact | Evidence |
|---|---|
| Name: Madar / مدار | `src/i18n/locales/en.json` (`app.name`), `src/constants/brand.ts` |
| Bilingual AR (RTL, default per product docs) + EN | `src/i18n/index.ts:24-35`, `src/store/settingsStore.ts:16` |
| Roles: user, moderator, admin, super_admin (cumulative) | `src/constants/permissions.ts:4,44-52` |
| Workspace-scoped data | `src/types/index.ts:32-41`, every task/project/file carries `workspaceId` |
| Demo mode (`/demo`, `loginAsDemo`) | `src/api/mock/mockAuthService.ts:63-68`, `src/app/router.tsx:56` |
| PWA + service worker | `frontend/README.md:49-53` |

## 3. Feature inventory (what the frontend already models)

Domains are derived from the contracts and stores.

| Domain | Contract | Mock impl | Store |
|---|---|---|---|
| Auth | `src/api/contracts/auth.ts` | `mockAuthService.ts` | `authStore.ts` |
| Users | `users.ts` | `mockUserService.ts` | `directoryStore.ts` |
| Workspaces | `workspaces.ts` | `mockWorkspaceService.ts` | `workspaceStore.ts` |
| Members & invitations | *(no contract; store-only)* | — | `memberStore.ts` |
| Tasks (+subtasks, comments, time, recurrence, bulk) | `tasks.ts` | `mockTaskService.ts` | `taskStore.ts` |
| Projects | `projects.ts` | `mockProjectService.ts` | `projectStore.ts` |
| Activity | `activity.ts` | `mockActivityService.ts` | `activityStore.ts` |
| Notifications | `notifications.ts` | `mockNotificationService.ts` | `notificationStore.ts` |
| Files | `files.ts` | `mockFileService.ts` | `fileStore.ts` |
| Calendar | `calendar.ts` | `mockCalendarService.ts` | (page-level) |
| Search | `search.ts` | `mockSearchService.ts` | `searchStore.ts` |
| Focus sessions | `focus.ts` | `mockFocusService.ts` | `focusStore.ts` |
| AI assistant | `ai.ts` | `mockAiService.ts` | (page-level) |
| Analytics | `analytics.ts` | `mockAnalyticsService.ts` | (page-level) |
| Settings/preferences | `settings.ts` | `mockSettingsService.ts` | `preferencesStore.ts` |
| Chat (channels, threads, reactions, DMs) | *(no contract)* | `mockChatService.ts` | `chatStore.ts` |
| Admin (users, workspaces, tasks, projects, reports, security, settings) | `admin.ts` | `mockAdminService.ts` | (page-level) |
| Audit log | *(no contract)* | `mockAuditService.ts` | (page-level) |

**Gap found:** `src/api/contracts/index.ts:1-11` re-exports only 11 domains. `focus.ts`, `ai.ts`,
`analytics.ts`, `admin.ts` exist but are **not** re-exported from the barrel; they are imported by
direct path (`src/services/focusService.ts:1`). There is **no `chat.ts` contract** at all — chat is
called directly against `mockChatService` (`src/store/chatStore.ts:5`). This must be fixed before a
chat adapter can be written. See `08-open-questions.md`.

## 4. Business rules extracted from the frontend

These are server responsibilities; the backend must reproduce them.

### 4.1 Permissions (RBAC)
- Cumulative roles, lowest→highest: `user < moderator < admin < super_admin`
  (`src/constants/permissions.ts:4`).
- Effective permissions are computed by inheritance (`permissions.ts:44-52`).
- Enforced in the frontend today in chat (`src/api/mock/mockChatService.ts:1041,1098,1169`) and
  guards (`src/components/guards/*`). **The server must become the source of truth** using the same
  permission strings (`permissions.ts:7-35`).

### 4.2 Tasks (`src/store/taskStore.ts`)
- **Optimistic updates with rollback** (`taskStore.ts:33-42`).
- **Completion** sets `completedAt` (`taskStore.ts:116-124,234-250`).
- **Recurrence**: completing a recurring task creates a *new* task with the next due date
  (`daily→+1d`, `weekly→+1w`, `monthly→+1M`) via date-fns `addDays/addWeeks/addMonths`
  (`taskStore.ts:44-73`). New task resets subtasks to `done:false`, `trackedMinutes:0`, `status:'todo'`.
- **Assignment notification**: if `assigneeId !== actorId`, push a `task_assigned` notification
  (`taskStore.ts:100-107`).
- **Activity events**: `task_created`, `task_completed`, `task_updated` (comment) recorded
  (`taskStore.ts:93-99,144-154,218-224`).
- **Bulk**: `bulkUpdateStatus`, `bulkDelete` (`taskStore.ts:160-183`).
- **Delete + Undo**: `remove` returns the task, `restore` re-inserts it unchanged
  (`taskStore.ts:252-263`; contract note `src/api/contracts/tasks.ts:11`).
- **Time tracking**: `logTime` adds minutes to `trackedMinutes` (`taskStore.ts:227-232`).
- **Subtasks** and **comments** are stored inside the task object (`src/types/tasks.ts:32-33`).

### 4.3 Notifications (`src/store/notificationStore.ts`)
- Loaded per user, newest first (`src/api/mock/mockNotificationService.ts:11-17`).
- Live push via a subscribe callback → toast (`notificationStore.ts:32-40`).
- **Deduplication**: same `type`+`title` within 5 minutes is dropped (`notificationStore.ts:68-75`).
- Unread count selector (`notificationStore.ts:85`).

### 4.4 Chat (`src/store/chatStore.ts`, `src/api/mock/mockChatService.ts`)
- Channels have `kind: 'public'|'announcements'`; announcements are read-only and only
  moderators+ can post (`mockChatService.ts:1097-1101`; permission `chat:post_in_announcements`).
- Channel name validation: 2–30 chars, `^[a-zA-Z0-9-]+$`, unique slug
  (`mockChatService.ts:1045-1055`).
- Message status lifecycle `sending→sent→delivered→read` (`chatStore.ts:151-157,487-493`).
- Reactions are `Record<emoji, userId[]>` toggled per user (`mockChatService.ts:1180-1208`).
- Mentions are stored as user-id arrays (`src/types/chat.ts:33`).
- Threads: replies carry `threadRootId`; root `replyCount` increments
  (`mockChatService.ts:1210-1255`).
- Edit/delete: author or `chat:delete_any_message` (`mockChatService.ts:1134-1178`); delete is soft
  (`deletedAt`, content cleared) (`mockChatService.ts:1174-1176`).
- DMs: direct conversation keyed by sorted participant pair; `unreadCount`, `pinned`, `muted`,
  `archived` (`mockChatService.ts:1257-1287`; `src/types/chat.ts:51-63`).
- Typing indicators are simulated client-side (`chatStore.ts:245-265,392-411`).

### 4.5 Files (`src/api/mock/mockFileService.ts`)
- List filters: folder, type, project, free-text search (`mockFileService.ts:10-36`).
- Storage usage with a **10 GB quota** constant (`mockFileService.ts:59-60`).
- Delete is hard in mock (`mockFileService.ts:50-53`) — the UI type has no `deletedAt`; trash/restore
  is **PROPOSED** (see open questions).

### 4.6 Search (`src/api/mock/mockSearchService.ts`)
- **Arabic normalisation** (alef variants, diacritics, teh-marbuta→heh) (`mockSearchService.ts:13-19`).
- Scoring tiers: exact 100, prefix 80, word 60, substring 30, plus recency boost
  (`mockSearchService.ts:22-54`).
- Categories: tasks, projects, people, messages, files, events; per-category counts; `limit` default 40
  (`mockSearchService.ts:116-288`).
- Recent searches per user, max 10 (`mockSearchService.ts:64-74,296-303`).

### 4.7 Analytics (`src/api/mock/mockAnalyticsService.ts`)
- Overview metrics: completedTasks, completionRate, avgCompletionDays, focusSessionsCount,
  focusHours, overdueTasks, dailyProductivity[], taskDistribution[], projectProgress[]
  (`src/api/contracts/analytics.ts:1-11`). Mock scales by range `7|30|90`.

### 4.8 AI assistant (`src/api/mock/mockAiService.ts`)
- **Intent detection** over normalized AR/EN text: greeting, overdue, break(subtasks), productivity,
  focus, help, plan, unknown (`mockAiService.ts:23-50`).
- **Hour extraction** incl. Arabic numerals/words (`mockAiService.ts:52-74`).
- Streaming is simulated char-by-char (`mockAiService.ts:191-196`).
- History is localStorage per user+workspace (`mockAiService.ts:201-224`).

### 4.9 Admin (`src/api/mock/mockAdminService.ts`, `mockAuditService.ts`)
- User role/status changes (`active|suspended|banned`), delete (`mockAdminService.ts:62-75`).
- Workspace status (`active|suspended|archived`) (`mockAdminService.ts:77-85`).
- Reports with status `New|Reviewing|Resolved|Rejected` + moderator notes
  (`mockAdminService.ts:103-111`; `src/api/contracts/admin.ts:17-27`).
- Security events + session revoke (`mockAdminService.ts:113-120`).
- System settings: `registrationOpen`, `defaultLanguage`, `maintenanceMode`,
  `sessionTimeoutMinutes` (`mockAdminService.ts:50-55,122-130`).
- Audit events with actor, action key, target, IP, device, status
  (`src/api/contracts/admin.ts:50-64`; `mockAuditService.ts:7-28`).

### 4.10 Auth (`src/api/mock/mockAuthService.ts`)
- Error codes: `invalid_credentials, account_suspended, email_taken, username_taken,
  session_expired, unknown` (`src/api/contracts/auth.ts:3-9`).
- Tokens: access + refresh + `expiresAt` epoch ms; mock TTL 12h (`mockAuthService.ts:13-23`;
  `src/types/index.ts:16-21`).
- Register creates `role:'user'`, `status:'active'` (`mockAuthService.ts:44-61`).
- Password reset always answers identically (`mockAuthService.ts:84-87`).
- Suspended accounts cannot log in (`mockAuthService.ts:38-40`).

### 4.11 Workspaces (`src/api/mock/mockWorkspaceService.ts`)
- Every account gets a **personal workspace** even if not seeded (`mockWorkspaceService.ts:6-24`).
- Demo mode prefers workspace `ws-demo` (`src/store/workspaceStore.ts:22-33`).

## 5. What already exists (frontend-side, reusable)

- **Typed contracts** for 11 domains + 4 extra (`src/api/contracts/*`).
- **HTTP client foundation**: base URL from `VITE_API_URL`, JWT attach, refresh-once-on-401,
  `HttpError` with status, `setTokenProvider` (`src/api/adapters/http/httpClient.ts:6-45`).
  Currently **unused** (no adapter imports it) — confirmed by grep.
- **Storage abstraction** (only place touching localStorage): `src/services/storage/storageAdapter.ts`.
- **Auth store** already holds `refreshToken` and calls `logout(refreshToken)`
  (`src/store/authStore.ts:78-82`), so wiring `setTokenProvider` is small.
- **Seed data** that must be reproduced by the DB seeder: 30 users (`src/data/users.ts:52-93`),
  5 workspaces (`src/data/workspaces.ts:6-57`), 79 task rows (`src/data/tasks.ts`), 15 project rows
  (`src/data/projects.ts`), workspace files (`src/data/files.ts`), 34 notifications
  (`src/data/notifications.ts`), activity rows (`src/data/activity.ts:6-29`), focus sessions
  (`src/data/activity.ts:42-47`), 6 chat channels + messages (`src/api/mock/mockChatService.ts:8-69`).

## 6. What is missing (the backend's whole job)

1. No HTTP server, no database, no persistence beyond the browser.
2. No real auth: mock tokens are `btoa()` payloads; passwords are stored in plain text in
   localStorage (`src/api/mock/userRegistry.ts:7-11`).
3. No server-side RBAC enforcement.
4. No realtime transport (chat/notifications are in-memory listeners).
5. No file storage (files are metadata objects with optional `url`).
6. No server-side search index, analytics aggregation, or AI provider.
7. No contracts for **chat**, **admin**, **audit**, **members/invitations** — these need interface
   extraction before adapters can be written.
8. No pagination on most list endpoints (only `users.list` is paged: `src/api/contracts/users.ts:3-8`).

## 7. Recommended shape (summary — details in later files)

- **Framework:** NestJS (contract-first, DI, guards match the RBAC model). See `01-architecture.md`.
- **ORM:** Prisma (readable schema, easy migrations for a beginner).
- **DB:** PostgreSQL. **Cache/queue:** none at first (single instance); add Redis only if scaling.
- **Realtime:** WebSocket for chat, SSE for notifications. **Storage:** S3-compatible (MinIO local).
- **Validation:** Zod shared between frontend and backend.
- **Local:** Docker Compose (Postgres + MinIO). **Hosting:** free tiers, phased in `06-roadmap.md`.
