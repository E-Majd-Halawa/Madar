# Madar — Backend Plan: 03 API Specification

> Endpoints are derived from `src/api/contracts/*`, the stores, and `src/api/mock/*`.
> Routes are under **`/api/v1`**. Anything not evidenced by the frontend is labelled **PROPOSED**.
> Auth = required access token unless marked *public*. Every workspace-scoped route re-checks
> membership. Rate-limit classes: **strict** (auth/mutations), **normal** (writes), **loose** (reads).

## 0. Conventions

- **Auth header:** `Authorization: Bearer <accessToken>` (decision in `04-auth-security.md`).
- **Error envelope** (all failures): `{ code, message, fieldErrors?, requestId }` (§ see §22).
- **Pagination:** `?cursor=&limit=` (cursor) or `?page=&pageSize=` (page) — see `01-architecture.md` §13.
- **Sorting/filtering:** `?sort=field:asc|desc`, plus domain filters, Zod-validated.
- **Workspace scope:** routes under `/workspaces/:workspaceId/...` validate the caller is a member
  and resolve the `WorkspaceMember.role` for permission checks.
- **Roles** are the global roles (`src/types/index.ts:1`); **permissions** are the strings in
  `src/constants/permissions.ts:7-35`. Server is the source of truth.

## 1. Auth — `/api/v1/auth`  (contract `src/api/contracts/auth.ts`)

| Method | Contract method | Endpoint | Body | Response | Status | Access | RL |
|---|---|---|---|---|---|---|---|
| POST | `login` | `/auth/login` | `{ email, password }` | `AuthSession` | 200 / 401 / 403 / 429 | public | strict |
| POST | `register` | `/auth/register` | `{ fullName, username, email, password }` | `AuthSession` | 201 / 409 / 429 | public | strict |
| POST | `loginAsDemo` | `/auth/demo` | — | `AuthSession` (`isDemo:true`) | 200 | public | strict |
| POST | `logout` | `/auth/logout` | `{ refreshToken? }` | `204` | 204 | auth | normal |
| POST | `refresh` | `/auth/refresh` | `{ refreshToken }` | `AuthTokens` | 200 / 401 | public | strict |
| POST | `requestPasswordReset` | `/auth/password/forgot` | `{ email }` | `204` (always) | 204 | public | strict |

Notes:
- `AuthSession = { user, tokens: { accessToken, refreshToken, expiresAt(epoch ms) }, isDemo }`
  (`src/types/index.ts:16-28`).
- Error `code`s must match `src/api/contracts/auth.ts:3-9`.
- Login rejects `status='suspended'` (`src/api/mock/mockAuthService.ts:38-40`) → 403 `account_suspended`.
- Register: email/username uniqueness (`userRegistry.ts:27-31`) → 409 `email_taken`/`username_taken`.
- **Side effects:** security_event on failed login and on new session (`admin.ts:31`); audit event.
- Forgot-password always 204 regardless of existence (`mockAuthService.ts:84-87`); sends email via SMTP.

**PROPOSED auth extras:** `POST /auth/password/reset` (`{ token, password }`),
`POST /auth/verify-email`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`
(the Security page implies a session list — `src/api/contracts/admin.ts:29-41`).

## 2. Users / profile — `/api/v1`  (contract `users.ts`)

| Method | Contract | Endpoint | Query | Response | Access |
|---|---|---|---|---|---|
| GET | `list` | `/users` | `query, role, page=1, pageSize=10` | `Paged<User>` | auth (directory) |
| GET | `getById` | `/users/:id` | — | `User \| null` | auth |

- `Paged<T> = { items, total, page, pageSize }` (`src/types/index.ts:43-48`) — this is the one
  page-based endpoint the frontend already uses (`mockUserService.ts:6-18`).
- Used by `directoryStore` (`pageSize:200`) and `memberStore` (`pageSize:30`)
  (`src/store/directoryStore.ts:15`, `memberStore.ts:68`).

**PROPOSED profile writes** (Settings → Account, `en.app.json` `settings.account`):
`PATCH /me` (`{ fullName, email }`), `PATCH /me/password`, `POST /me/avatar`.

## 3. Workspaces — `/api/v1`  (contract `workspaces.ts`)

| Method | Contract | Endpoint | Response | Access |
|---|---|---|---|---|
| GET | `listForUser` | `/workspaces` (current user) | `Workspace[]` | auth |
| GET | `getById` | `/workspaces/:id` | `Workspace \| null` | member |

- Must ensure a **personal workspace** exists for the user (`mockWorkspaceService.ts:6-24`).
- Demo preference (`preferDemo`) is a client concern; server just returns the list
  (`src/store/workspaceStore.ts:22-33`).

## 4. Members & invitations — `/api/v1/workspaces/:workspaceId`  *(no contract yet — PROPOSED)*

Derived from `src/store/memberStore.ts`.

| Method | Store method | Endpoint | Body | Permission | Side effects |
|---|---|---|---|---|---|
| GET | `load` | `/members` | — | member | — |
| POST | `inviteMember` | `/invitations` | `{ email, role, department }` | `workspace:manage_settings` (admin) | email + `member_invited` activity + notification |
| PATCH | `updateRole` | `/members/:userId` | `{ role }` | admin (workspace) | `role_changed` activity + notification |
| DELETE | `removeMember` | `/members/:userId` | — | admin | activity |
| DELETE | `cancelInvite` | `/invitations/:id` | — | admin | — |
| POST | `resendInvite` | `/invitations/:id/resend` | — | admin | email |

Types: `WorkspaceMemberItem`, `PendingInvite` (`src/types/members.ts`).
**Extract a `members` contract before writing the adapter** (Q2 in `08-open-questions.md`).

## 5. Tasks — `/api/v1`  (contract `tasks.ts`)

| Method | Contract | Endpoint | Body/Query | Response | Permission |
|---|---|---|---|---|---|
| GET | `listByWorkspace` | `/workspaces/:workspaceId/tasks` | filters+sort+paging | `Task[]` (cursor **PROPOSED**) | member |
| POST | `create` | `/tasks` | `NewTaskInput` | `Task` | `tasks:manage_own` |
| PATCH | `update` | `/tasks/:id` | `TaskPatch` | `Task` | owner/`projects:manage_all` |
| DELETE | `remove` | `/tasks/:id` | — | `204` (soft) | as update |
| POST | `restore` | `/tasks/:id/restore` | — | `204`/`Task` | as update |

`NewTaskInput = { workspaceId, title, creatorId } & TaskPatch` (`tasks.ts:3`).
Filters map to `FilterState` (`src/types/tasks.ts:48-56`): `search,status,priority,project,assignee`,
`sort=dueDate|priority|title|createdAt`, `direction=asc|desc`.

**Side effects (must match frontend):**
- create: `task_created` activity; if `assigneeId !== actorId` → `task_assigned` notification
  (`src/store/taskStore.ts:93-107`).
- complete: set `completedAt`; `task_completed` activity; **recurrence spawns next task**
  (`taskStore.ts:116-124,44-73`).
- update/comment: `task_updated` activity (`taskStore.ts:218-224`).

**PROPOSED sub-routes** (to replace embedded arrays; `src/types/tasks.ts:32-33`):
`GET/POST /tasks/:id/subtasks`, `PATCH/DELETE /tasks/:id/subtasks/:subtaskId`,
`GET/POST /tasks/:id/comments`, `POST /tasks/:id/time-entries`,
`POST /tasks/bulk-status` + `POST /tasks/bulk-delete` (`taskStore.ts:160-183`),
`GET/POST /tasks/:id/dependencies` (**PROPOSED**, see `02-data-model.md` §3.11).

## 6. Projects — `/api/v1`  (contract `projects.ts`)

| Method | Contract | Endpoint | Body | Response |
|---|---|---|---|---|
| GET | `listByWorkspace` | `/workspaces/:workspaceId/projects` | — | `Project[]` |
| GET | `getById` | `/projects/:id` | — | `Project \| null` |
| POST | `create` | `/projects` | `Omit<Project,'id'|'createdAt'>` | `Project` |
| PATCH | `update` | `/projects/:id` | `Partial<Project>` | `Project` |
| DELETE | `remove` | `/projects/:id` | — | `204` |

- create → `project_created` activity (`src/store/projectStore.ts:121-128`).
- update/remove → `settings_changed` activity with `metadata.projectId` (`projectStore.ts:148-186`).
- Permission: `projects:manage_own` / `projects:manage_all` (`permissions.ts:9,29`).
- Project members → **PROPOSED** `/projects/:id/members` (from `Project.memberIds`).
- Project files (`ProjectFile`, `src/types/projects.ts:3-13`) currently live only in
  `projectStore.ts:6-83` → **PROPOSED** `/projects/:id/files` reusing the files table (Q3).

## 7. Files — `/api/v1`  (contract `files.ts`)

| Method | Contract | Endpoint | Body/Query | Response |
|---|---|---|---|---|
| GET | `list` | `/workspaces/:workspaceId/files` | `search,folder,type,projectId` | `WorkspaceFile[]` |
| POST | `upload` | `/workspaces/:workspaceId/files` | metadata (see flow) | `WorkspaceFile` |
| DELETE | `delete` | `/files/:id` | — | `204` |
| GET | `getStorageUsage` | `/workspaces/:workspaceId/storage` | — | `StorageUsage` |

- Filters: `FileFilter` (`src/types/files.ts:20-25`); search across name/description/extension/folder/
  projectName (`mockFileService.ts:23-33`).
- `StorageUsage = { usedBytes, quotaBytes, byType }` (`src/types/files.ts:27-31`); quota 10 GB today
  (`mockFileService.ts:59-60`).
- **Upload flow (PROPOSED, detailed in `05-realtime-files.md`):**
  1. `POST /workspaces/:id/files/presign` → `{ uploadUrl, storageKey, expiresAt }`
  2. client `PUT`s bytes to `uploadUrl` (S3/MinIO)
  3. `POST /workspaces/:id/files` with `{ storageKey, name, size, type, mime, projectId, folder, description }`
     → server verifies object, records row.
- Side effects: `file_uploaded` / `file_deleted` activity (`src/types/activity.ts:11-12`).
- **PROPOSED:** `GET /files/:id/download` (signed URL, increments `downloadsCount`),
  `POST /files/:id/restore` (trash — Q6).

## 8. Activity — `/api/v1`  (contract `activity.ts`)

| Method | Contract | Endpoint | Response | Access |
|---|---|---|---|---|
| GET | `listByWorkspace` | `/workspaces/:workspaceId/activity` | `ActivityEvent[]` | member |
| POST | `record` | `/workspaces/:workspaceId/activity` | `ActivityEvent` | member (**PROPOSED**: usually server-side only) |
| GET | `listFocusSessions` | `/users/:id/focus-sessions` | `FocusSession[]` | self/`analytics:view` |

Most activity writes should happen **inside** the domain services (task/project/file), not via a
public `record` endpoint; keep the endpoint for parity/testing but restrict it.

## 9. Notifications — `/api/v1`  (contract `notifications.ts`)

| Method | Contract | Endpoint | Response |
|---|---|---|---|
| GET | `list` | `/notifications` | `AppNotification[]` (newest first) |
| PATCH | `markRead` | `/notifications/:id` | `204` body `{ read }` |
| POST | `markAllRead` | `/notifications/read-all` | `204` |
| DELETE | `remove` | `/notifications/:id` | `204` |
| — | `push` | *(server-internal)* | creates + emits SSE |
| — | `subscribe` | `GET /notifications/stream` (SSE) | event stream |

- Server must reproduce **dedupe**: same `type`+`title` within 5 min (`notificationStore.ts:68-75`).
- Unread count via `GET /notifications/unread-count` **PROPOSED** (or computed client-side from list,
  `notificationStore.ts:85`).
- Preferences (level, email, push, per-category) live in `user_preferences`
  (`src/types/preferences.ts:15-24`).

## 10. Settings / preferences — `/api/v1`  (contract `settings.ts`)

| Method | Contract | Endpoint | Body | Response |
|---|---|---|---|---|
| GET | `getPreferences` | `/me/preferences` | — | `UserPreferences` |
| PATCH | `savePreferences` | `/me/preferences` | `Partial<UserPreferences>` | `UserPreferences` |

Defaults from `mockSettingsService.ts:6-24`; seeded accounts have `onboardingCompleted:true`
(`mockSettingsService.ts:32-33`).

## 11. Calendar — `/api/v1`  (contract `calendar.ts`)

| Method | Contract | Endpoint | Query | Response |
|---|---|---|---|---|
| GET | `getItems` | `/workspaces/:workspaceId/calendar` | `projectId,priority,assigneeId,type,month,year` | `CalendarItem[]` |

- Items are assembled from tasks + project deadlines (`mockCalendarService.ts:10-64`); archived
  excluded; sorted by date asc. `CalendarItem` (`calendar.ts:5-21`) includes `rawTask`/`rawProject`
  — the server may return a lighter shape and let the client re-fetch (**PROPOSED**, Q7).

## 12. Search — `/api/v1`  (contract `search.ts`)

| Method | Contract | Endpoint | Query/Body | Response |
|---|---|---|---|---|
| GET | `search` | `/search` | `q, workspaceId, category, limit=40` | `SearchResults` |
| GET | `getRecentSearches` | `/search/recent` | — | `RecentSearch[]` |
| POST | `saveRecentSearch` | `/search/recent` | `{ query }` | `204` |
| DELETE | `clearRecentSearches` | `/search/recent` | — | `204` |

- Must reproduce the tiered scoring + Arabic normalisation (`mockSearchService.ts:13-54`) and
  per-category counts + `hasMore` (`search.ts:27-33`).
- Recent capped at 10 per user (`mockSearchService.ts:66`).

## 13. Focus — `/api/v1`  (contract `focus.ts`)

| Method | Contract | Endpoint | Body | Response |
|---|---|---|---|---|
| GET | `listSessions` | `/focus/sessions` | `?userId=` | `FocusSession[]` |
| POST | `logSession` | `/focus/sessions` | `Omit<FocusSession,'id'>` | `FocusSession` |

## 14. AI assistant — `/api/v1`  (contract `ai.ts`)

| Method | Contract | Endpoint | Body | Response |
|---|---|---|---|---|
| POST | `streamPrompt` | `/ai/chat` | `{ prompt, context }` | `AiPlanResponse` (streamed tokens **PROPOSED** via SSE) |
| GET | `getHistory` | `/ai/history` | `?workspaceId=` | messages |
| PUT | `saveHistory` | `/ai/history` | messages | `204` |
| DELETE | `clearHistory` | `/ai/history` | `?workspaceId=` | `204` |

- Phase 9 can keep the **intent engine server-side** (port `mockAiService.ts:23-74`) so behaviour is
  identical and free; a real LLM is optional later (Q8).

## 15. Analytics — `/api/v1`  (contract `analytics.ts`)

| Method | Contract | Endpoint | Query | Response |
|---|---|---|---|---|
| GET | `getOverview` | `/analytics/overview` | `?range=7|30|90` | `AnalyticsOverview` |

- Aggregates over tasks + focus_sessions (`analytics.ts:1-11`). Permission `analytics:view`
  (`permissions.ts:31`). Export CSV exists in UI → `GET /analytics/export.csv` **PROPOSED**.

## 16. Chat — `/api/v1`  *(no contract yet — PROPOSED, from `mockChatService.ts`)*

| Method | Mock method | Endpoint | Permission |
|---|---|---|---|
| GET | `loadChannels` | `/workspaces/:id/channels` | member |
| GET | `getChannel` | `/channels/:id` | member |
| POST | `createChannel` | `/workspaces/:id/channels` | `chat:create_channel` |
| GET | `loadChannelMessages` | `/channels/:id/messages` | member (cursor) |
| POST | `sendChannelMessage` | `/channels/:id/messages` | `chat:send`; announcements need `chat:post_in_announcements` |
| PATCH | `editChannelMessage` | `/channels/:id/messages/:msgId` | author |
| DELETE | `deleteChannelMessage` | `/channels/:id/messages/:msgId` | author or `chat:delete_any_message` |
| POST | `toggleReaction` | `/messages/:msgId/reactions` | member |
| POST | `sendThreadReply` | `/channels/:id/messages/:rootId/replies` | as send |
| POST | `startDirectConversation` | `/conversations` | member |
| DELETE | `deleteDirectMessage` | `/conversations/:id/messages/:msgId` | author or moderator |
| **PROPOSED** | (DM parity) | `GET/POST /conversations`, `GET/POST /conversations/:id/messages`, `PATCH`/`DELETE` message, `POST /conversations/:id/messages/:msgId/reactions`, `PATCH /conversations/:id` (pin/mute/archive) | member |

Rules: name validation `^[a-zA-Z0-9-]+$`, 2–30 chars, unique slug (`mockChatService.ts:1045-1055`);
announcements read-only (`mockChatService.ts:1097-1101`); soft delete (`mockChatService.ts:1174-1176`).
Realtime events in `05-realtime-files.md`.

## 17. Admin — `/api/v1/admin`  (contract `admin.ts`)

All require `admin`+ unless noted; `super_admin` for settings/security where indicated.

| Method | Contract | Endpoint | Permission |
|---|---|---|---|
| GET | `getUsers` | `/admin/users` | `users:manage` |
| PATCH | `updateUserRole` | `/admin/users/:id/role` | `roles:manage` (super_admin) |
| PATCH | `updateUserStatus` | `/admin/users/:id/status` | `users:suspend` |
| DELETE | `deleteUser` | `/admin/users/:id` | `users:manage` |
| GET | `getWorkspaces` | `/admin/workspaces` | `users:manage` (admin) |
| PATCH | `updateWorkspaceStatus` | `/admin/workspaces/:id/status` | admin |
| GET | `getTasks` | `/admin/tasks` | `projects:manage_all` |
| DELETE | `deleteTask` | `/admin/tasks/:id` | `projects:manage_all` |
| GET | `getProjects` | `/admin/projects` | `projects:manage_all` |
| DELETE | `deleteProject` | `/admin/projects/:id` | `projects:manage_all` |
| GET | `getReports` | `/admin/reports` | `reports:review` (moderator) |
| PATCH | `updateReport` | `/admin/reports/:id` | `reports:review` |
| GET | `getSecurityEvents` | `/admin/security/events` | `security:full` (super_admin) |
| POST | `revokeSession` | `/admin/security/sessions/:id/revoke` | `security:full` |
| GET | `getSettings` | `/admin/settings` | `system:manage_settings` |
| PATCH | `updateSettings` | `/admin/settings` | `system:manage_settings` |

Side effects: every admin mutation writes an **audit event** (`src/api/contracts/admin.ts:50-64`) and
possibly a security event. `updateUserRole` → `role_change` notification to the user.

## 18. Audit — `/api/v1/admin/audit`  *(no contract yet)*

| Method | Mock method | Endpoint | Permission |
|---|---|---|---|
| GET | `getEvents` | `/admin/audit` | `audit:view` |
| POST | `logEvent` | *(server-internal)* | — |

## 19. Health

| Endpoint | Purpose | Access |
|---|---|---|
| `GET /health` | liveness (200) | public |
| `GET /health/ready` | DB + storage reachable | public |

## 20. Contract → endpoint table (adapter-writing map)

| Service file | Contract | Endpoints |
|---|---|---|
| `authService.ts` | `auth.ts` | `/auth/*` |
| `userService.ts` | `users.ts` | `/users`, `/users/:id` |
| `workspaceService.ts` | `workspaces.ts` | `/workspaces`, `/workspaces/:id` |
| `taskService.ts` | `tasks.ts` | `/workspaces/:id/tasks`, `/tasks/*` |
| `projectService.ts` | `projects.ts` | `/workspaces/:id/projects`, `/projects/*` |
| `activityService.ts` | `activity.ts` | `/workspaces/:id/activity`, `/users/:id/focus-sessions` |
| `notificationService.ts` | `notifications.ts` | `/notifications*`, `/notifications/stream` |
| `settingsService.ts` | `settings.ts` | `/me/preferences` |
| `calendarService.ts` | `calendar.ts` | `/workspaces/:id/calendar` |
| `fileService.ts` | `files.ts` | `/workspaces/:id/files`, `/files/:id`, `/workspaces/:id/storage` |
| `searchService.ts` | `search.ts` | `/search*` |
| `focusService.ts` | `focus.ts` | `/focus/sessions` |
| `aiService.ts` | `ai.ts` | `/ai/*` |
| `analyticsService.ts` | `analytics.ts` | `/analytics/overview` |
| `chatService.ts` | *(none)* | `/channels*`, `/conversations*` |
| `adminService.ts` | `admin.ts` | `/admin/*` |
| `auditService.ts` | *(none)* | `/admin/audit` |

## 21. Rate-limit classes (PROPOSED, `@nestjs/throttler`)

| Class | Example routes | Limit (per IP+user) |
|---|---|---|
| strict | `/auth/login`, `/auth/register`, `/auth/password/forgot`, `/auth/refresh` | 5–10 / min, exponential backoff + lockout |
| normal | all mutations (POST/PATCH/DELETE) | 60 / min |
| loose | GET reads | 300 / min |
| upload | `presign` | 20 / hour |

## 22. Error envelope & frontend mapping

```json
{ "code": "task_not_found", "message": "Task not found", "fieldErrors": [], "requestId": "01J..." }
```
- HTTP status: 400 validation, 401 unauthenticated, 403 forbidden (role/permission), 404 not found,
  409 conflict (unique), 413 payload too large, 422 semantic, 429 rate-limited, 500 unexpected.
- The frontend's `HttpError` (`src/api/adapters/http/httpClient.ts:8-16`) currently exposes only
  `status`/`statusText`; `07-frontend-integration.md` adds `code`/`fieldErrors` parsing.
- Auth codes must match `src/api/contracts/auth.ts:3-9`.
