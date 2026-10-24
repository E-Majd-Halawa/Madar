# Madar — Backend Plan: 02 Data Model

> Derived from `src/types/*`, `src/data/*`, `src/store/*`, `src/api/mock/*`. Anything the frontend
> does **not** show is labelled **PROPOSED**. ORM: Prisma (see `01-architecture.md` §1.2).
> Target: PostgreSQL 16.

## 1. Modelling rules

1. **Every workspace-scoped table carries `workspace_id`** (FK → `workspaces.id`), because the
   frontend scopes all queries by workspace (`src/api/mock/mockTaskService.ts:12`,
   `mockProjectService.ts:12`, `mockFileService.ts:12`, `mockActivityService.ts:14`).
2. **IDs**: frontend ids are opaque strings (`u-001`, `ws-demo`, `p-101`, `tsk-…`). Use `text` PKs so
   seed ids match the frontend exactly (`src/data/users.ts:19`, `src/data/workspaces.ts:8`). New rows
   use `cuid()`/`uuid()` server-side.
3. **Timestamps**: store `timestamptz`; serialize ISO-8601 strings (frontend expects ISO strings,
   e.g. `src/types/tasks.ts:38-39`).
4. **Enums**: use Postgres enums for closed sets that the frontend already enumerates.
5. **Soft delete**: only where the UI implies recovery. Tasks have **Undo**
   (`src/api/contracts/tasks.ts:11`, `src/store/taskStore.ts:259-263`) and chat messages soft-delete
   (`mockChatService.ts:1174-1176`). Files/projects/users have **hard** delete in the UI
   (`mockFileService.ts:50-53`, `mockProjectService.ts:33-36`, `mockAdminService.ts:72-75`) — file
   trash is **PROPOSED** (Q6 in `08-open-questions.md`).
6. **`created_at`/`updated_at`** on all mutable tables; the frontend relies on `updatedAt` for sort
   and search recency (`src/types/tasks.ts:39`, `mockSearchService.ts:33`).

## 2. Enums (from frontend unions)

| Enum | Values | Source |
|---|---|---|
| `role` | user, moderator, admin, super_admin | `src/types/index.ts:1` |
| `user_status` | active, suspended, invited | `src/types/index.ts:2` |
| `workspace_type` | personal, team | `src/types/index.ts:30` |
| `workspace_role` | owner, admin, member, guest | `src/types/members.ts:1` |
| `task_status` | backlog, todo, in_progress, review, completed, archived | `src/types/tasks.ts:1` |
| `task_priority` | low, medium, high, urgent | `src/types/tasks.ts:2` |
| `recurrence` | none, daily, weekly, monthly | `src/types/tasks.ts:36` |
| `project_status` | planning, active, on_hold, completed, archived | `src/types/projects.ts:1` |
| `file_type` | document, design, image, archive, code, other | `src/types/files.ts:1` |
| `notification_type` | task_assigned, task_completed, deadline, mention, message, project_update, invitation, role_change, security, system | `src/types/notifications.ts:1-11` |
| `activity_action` | task_created, task_updated, task_completed, project_created, member_invited, message_sent, role_changed, user_suspended, settings_changed, file_uploaded, file_deleted, comment_added | `src/types/activity.ts:1-13` |
| `activity_target` | task, project, member, channel, workspace, file, comment | `src/types/activity.ts:15` |
| `channel_kind` | public, announcements | `src/types/chat.ts:15` |
| `message_status` | sending, sent, delivered, read, failed | `src/types/chat.ts:35` |
| `conversation_type` | direct, group | `src/types/chat.ts:53` |
| `notification_level` | all, important, none | `src/types/preferences.ts:2` |
| `usage_purpose` | personal, study, work, freelance, team | `src/types/preferences.ts:1` |
| `report_type` / `report_reason` / `report_status` | message/user/project/other · spam/harassment/inappropriate/other · New/Reviewing/Resolved/Rejected | `src/api/contracts/admin.ts:19-21` |
| `security_event_type` | failed_login, session, suspicious, password_change, role_change | `src/api/contracts/admin.ts:31` |
| `audit_status` | success, warning, error | `src/api/contracts/admin.ts:60` |
| `workspace_status` (admin) | active, suspended, archived | `src/api/contracts/admin.ts:11` |
| `admin_user_status` | active, suspended, banned | `src/api/contracts/admin.ts:4` |

## 3. Core tables

### 3.1 users
Frontend `User` (`src/types/index.ts:4-14`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | matches `u-001` seeds |
| full_name | text NOT NULL | `fullName` |
| username | citext UNIQUE NOT NULL | unique check `userRegistry.ts:30-31` |
| email | citext UNIQUE NOT NULL | unique check `userRegistry.ts:27-28` |
| role | role NOT NULL DEFAULT 'user' | `mockAuthService.ts:54` |
| status | user_status NOT NULL DEFAULT 'active' | |
| avatar_url | text NULL | `avatarUrl?` |
| password_hash | text NOT NULL | **PROPOSED** (mock keeps plaintext; never ship that) |
| created_at / last_active_at | timestamptz | `lastActiveAt` |

### 3.2 workspaces
`Workspace` (`src/types/index.ts:32-41`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | `ws-demo` etc. |
| name, description | text | |
| type | workspace_type | |
| owner_id | text FK → users.id | |
| color | text | hex |
| created_at | timestamptz | |
Membership is normalised (not `memberIds[]`) → `workspace_members` (below). The frontend's
`memberIds` (`src/types/index.ts:38`) is served as a derived array.

### 3.3 workspace_members
Replaces `Workspace.memberIds` and powers `WorkspaceMemberItem` (`src/types/members.ts:3-14`) and
admin counts.
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | FK → workspaces | |
| user_id | FK → users | |
| role | workspace_role NOT NULL DEFAULT 'member' | owner/admin/member/guest |
| department | text NULL | `memberStore.ts:22-37` |
| status | user_status | active/invited/suspended |
| joined_at, last_active_at | timestamptz | |
| UNIQUE (workspace_id, user_id) | | |

### 3.4 invitations
`PendingInvite` (`src/types/members.ts:16-22`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | FK | |
| email | citext NOT NULL | |
| role | workspace_role | |
| department | text | |
| invited_by | FK → users | |
| token_hash | text NULL | **PROPOSED** (accept link) |
| status | text NOT NULL DEFAULT 'pending' | pending/accepted/revoked/**PROPOSED** |
| invited_at, expires_at | timestamptz | |

### 3.5 projects
`Project` (`src/types/projects.ts:15-27`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | `p-101` |
| workspace_id | FK | |
| name, description | text | |
| status | project_status | |
| color | text | |
| owner_id | FK → users | |
| start_date | date NULL | |
| due_date | date NULL | |
| created_at, updated_at | timestamptz | `updatedAt` is **PROPOSED** (frontend Project has no updatedAt — see §7) |
Project members → `project_members` (project.`memberIds`, `src/types/projects.ts:23`).

### 3.6 project_members
`(project_id, user_id)` composite PK; `role` text NULL.

### 3.7 tasks
`Task` (`src/types/tasks.ts:18-40`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | FK | |
| project_id | FK NULL | |
| title, description | text | |
| status | task_status | |
| priority | task_priority | |
| category | text | |
| start_date, due_date | timestamptz NULL | frontend uses ISO strings |
| assignee_id | FK NULL | |
| creator_id | FK | |
| tags | text[] | `src/types/tasks.ts:31` |
| estimate_minutes | int NULL | |
| tracked_minutes | int NOT NULL DEFAULT 0 | |
| recurrence | recurrence NOT NULL DEFAULT 'none' | |
| completed_at | timestamptz NULL | |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz NULL | **soft delete** for Undo |
Indexes: `(workspace_id, status)`, `(workspace_id, due_date)`, `(assignee_id)`, `(project_id)`,
GIN on `tags`, full-text (see §6).

### 3.8 subtasks
Extracted from `Task.subtasks` (`src/types/tasks.ts:4-8,32`) so they can be checked independently.
`id text PK, task_id FK, title text, done boolean, position int`.

### 3.9 task_comments
From `TaskComment` (`src/types/tasks.ts:10-15`) — embedded in mock, extracted here.
`id, task_id FK, author_id FK, content text, created_at, deleted_at NULL`.

### 3.10 time_entries
`trackedMinutes` is a counter today (`taskStore.ts:227-232`); store the log so it is auditable.
`id, task_id FK, user_id FK, minutes int, note text NULL, logged_at`. `tracked_minutes` becomes a
cached sum (**PROPOSED** — see §7).

### 3.11 task_dependencies — **PROPOSED**
**The frontend has no dependency field** (`src/types/tasks.ts:18-40` has no `dependencies`).
If added: `task_id FK, depends_on_task_id FK, UNIQUE(task_id, depends_on_task_id)`, and a
cycle-prevention check on insert (DFS over the dependency graph; reject if a path exists from
`depends_on_task_id` back to `task_id`). Marked PROPOSED; see `08-open-questions.md` Q5.

### 3.12 files
`WorkspaceFile` (`src/types/files.ts:3-18`).
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | FK | |
| project_id | FK NULL | |
| folder | text | |
| name, extension | text | |
| size_bytes | bigint | `size` in bytes |
| type | file_type | |
| mime_type | text | **PROPOSED** (needed to serve) |
| storage_key | text NOT NULL | **PROPOSED** — object key in S3 |
| checksum | text NULL | **PROPOSED** — sha256 for dedupe/integrity |
| uploaded_by | FK → users | |
| uploaded_at | timestamptz | |
| downloads_count | int DEFAULT 0 | |
| description | text NULL | |
| deleted_at | timestamptz NULL | **PROPOSED** trash (Q6) |
Quota: constant 10 GB in mock (`mockFileService.ts:59-60`) → store per-workspace `quota_bytes`.

### 3.13 activity_events
`ActivityEvent` (`src/types/activity.ts:17-26`).
`id, workspace_id FK, actor_id FK, action activity_action, target_type activity_target,
target_name text, metadata jsonb NULL, created_at`. Index `(workspace_id, created_at DESC)`.

### 3.14 notifications
`AppNotification` (`src/types/notifications.ts:13-21`).
`id, user_id FK, type notification_type, title text, body text NULL, href text NULL,
read boolean DEFAULT false, created_at`. Index `(user_id, created_at DESC)` and partial
`WHERE read = false` for unread counts (`notificationStore.ts:85`).

### 3.15 focus_sessions
`FocusSession` (`src/types/activity.ts:28-35`).
`id, user_id FK, workspace_id FK, task_id FK NULL, started_at timestamptz, minutes int`.
Index `(user_id, started_at DESC)` (dashboard/analytics read this).

### 3.16 user_preferences
`UserPreferences` (`src/types/preferences.ts:5-25`). Mostly scalar → store as **JSONB** plus the
few fields the server filters on.
`user_id PK FK, prefs jsonb NOT NULL, updated_at`. JSONB keys mirror the type exactly
(`onboardingCompleted, usage[], workspaceType, timezone, workStart, workEnd, workDays[],
notificationLevel, emailNotifications, pushNotifications, categoryLevels{...}`).
Rationale: the shape is client-owned and evolves (`mockSettingsService.ts:6-24`).

## 4. Chat tables

### 4.1 channels
`Channel` (`src/types/chat.ts:10-20`).
`id, workspace_id FK, name, slug, description, kind channel_kind, is_read_only boolean,
created_by FK, created_at, UNIQUE(workspace_id, slug)`.

### 4.2 channel_messages
`ChannelMessage` (`src/types/chat.ts:22-36`).
`id, channel_id FK, sender_id FK, content text, created_at, edited_at NULL, deleted_at NULL,
thread_root_id FK NULL (self), reply_count int DEFAULT 0`. Index `(channel_id, created_at DESC)`.

### 4.3 message_reactions
Replaces `reactions: Record<emoji,userId[]>` (`src/types/chat.ts:32`).
`id, message_id FK, user_id FK, emoji text, UNIQUE(message_id, user_id, emoji)`.

### 4.4 message_mentions
`message_id FK, user_id FK, UNIQUE(message_id, user_id)` (`src/types/chat.ts:33`).

### 4.5 channel_read_state
`channel_id FK, user_id FK, last_read_at timestamptz, UNIQUE(channel_id,user_id)` — powers
`unreadCount` (`src/types/chat.ts:19`, `chatStore.ts:386-390`).

### 4.6 conversations (DMs / groups)
`Conversation` (`src/types/chat.ts:51-63`).
`id, workspace_id FK, type conversation_type, name NULL, created_at, updated_at`.
Participants → `conversation_participants (conversation_id, user_id, pinned bool, muted bool,
archived bool, UNIQUE(conversation_id,user_id))` — `pinned/muted/archived` are per-user
(`chatStore.ts:414-442`).

### 4.7 conversation_messages
`ChatMessage` (`src/types/chat.ts:38-49`): `id, conversation_id FK, sender_id FK, content,
created_at, edited_at NULL, deleted_at NULL, type text ('text'|'system')`.
Reactions reuse `message_reactions` with a nullable `conversation_message_id` **or** a second table
(**PROPOSED** — pick one; see Q4).

### 4.8 conversation_read_state
`conversation_id, user_id, last_read_at` → `unreadCount` (`src/types/chat.ts:57`).

## 5. Auth / security tables

### 5.1 refresh_tokens
Access token is stateless JWT; refresh is **rotating + hashed in DB** (see `04-auth-security.md`).
`id, user_id FK, token_hash text UNIQUE, family_id uuid, expires_at timestamptz,
revoked_at NULL, replaced_by_id NULL, created_at, ip text, user_agent text`.
Reuse detection: if a revoked token is presented, revoke the whole `family_id`.

### 5.2 password_reset_tokens
`id, user_id FK, token_hash UNIQUE, expires_at, used_at NULL, created_at`.

### 5.3 email_verification_tokens — **PROPOSED**
`id, user_id FK, token_hash UNIQUE, expires_at, used_at NULL`.

### 5.4 security_events
`SecurityEvent` (`src/api/contracts/admin.ts:29-41`).
`id, type security_event_type, description_key text, description_params jsonb NULL, ip text,
device text, user_id FK NULL, created_at, revoked boolean NULL`.

### 5.5 audit_events
`AuditEvent` (`src/api/contracts/admin.ts:50-64`).
`id, actor_id FK, action_key text, action_params jsonb NULL, target_key text NULL,
target_params jsonb NULL, ip text, device text, status audit_status, created_at`.
Index `(created_at DESC)`, `(actor_id)`.

### 5.6 system_settings
Single-row config (`SystemSettings`, `src/api/contracts/admin.ts:43-48`).
`id int PK DEFAULT 1, registration_open bool, default_language text, maintenance_mode bool,
session_timeout_minutes int, updated_at`.

### 5.7 reports
`AdminReport` (`src/api/contracts/admin.ts:17-27`).
`id, type report_type, reason report_reason, status report_status, reporter_name text,
target_description text, target_id text, moderator_notes text NULL, created_at, updated_at`.

## 6. Full-text search (Arabic + English)

The frontend's mock search normalises Arabic (alef variants, diacritics, teh-marbuta→heh) and scores
by tiers (`src/api/mock/mockSearchService.ts:13-54`). Two free PostgreSQL options:

**Recommended: `pg_trgm` + `unaccent` + a normalised column.**
- Enable extensions: `CREATE EXTENSION pg_trgm; CREATE EXTENSION unaccent;`
- Add a generated/derived `search_text` column per searchable table, storing lowercased +
  Arabic-normalised text (same rules as `mockSearchService.ts:13-19`, applied on write).
- Index: `CREATE INDEX ... USING gin (search_text gin_trgm_ops);` → supports fuzzy/substring
  matching and works well for both scripts.
- Ranking: `similarity()` or `word_similarity()` approximates the frontend's tiered score; keep the
  same ordering intent (exact > prefix > word > substring) in the SQL `ORDER BY`.

**Alternative: `tsvector` with the `simple` dictionary.**
- `to_tsvector('simple', search_text)` — no stemming (Arabic stemming in PG is weak), so it behaves
  predictably for Arabic; combine with `unaccent` for English.
- Index: `GIN (to_tsvector('simple', search_text))`. Use `ts_rank` for scoring.

Decision: start with **pg_trgm** (better substring/fuzzy behaviour, closer to the mock), keep the
`tsvector` column as a later optimisation. Rationale and the exact normalisation function belong in
`05-realtime-files.md`/service code, not here.

Searchable tables: tasks (title, description), projects (name, description), files (name,
description), channel_messages + conversation_messages (content), users (full_name, username,
email). Recent searches: `recent_searches (id, user_id, query, created_at)` capped at 10 per user
(`mockSearchService.ts:66,296-303`).

## 7. Mapping table: frontend field → DB column (and where the model must change)

| Frontend field | Where | DB column | Change needed |
|---|---|---|---|
| `Workspace.memberIds: string[]` | `src/types/index.ts:38` | derived from `workspace_members` | **Fix:** keep array in API response (computed), don't store array |
| `Project.memberIds: string[]` | `src/types/projects.ts:23` | `project_members` | same |
| `Task.subtasks: Subtask[]` | `src/types/tasks.ts:32` | `subtasks` table | API returns nested array (assembled) |
| `Task.comments?: TaskComment[]` | `src/types/tasks.ts:33` | `task_comments` | API returns nested array; keep optional |
| `Task.trackedMinutes` | `src/types/tasks.ts:35` | `SUM(time_entries.minutes)` cached | **Fix:** server computes; or keep counter + write log |
| `ChannelMessage.reactions: Record<emoji,string[]>` | `src/types/chat.ts:32` | `message_reactions` | API assembles the map |
| `ChannelMessage.replyCount` | `src/types/chat.ts:31` | `channel_messages.reply_count` | server maintains on reply |
| `Channel.unreadCount?` | `src/types/chat.ts:19` | `channel_read_state` | computed per user |
| `Conversation.lastMessage?` | `src/types/chat.ts:56` | derived (latest message) | computed in query |
| `Conversation.unreadCount` | `src/types/chat.ts:57` | `conversation_read_state` | computed per user |
| `Conversation.pinned/muted/archived` | `src/types/chat.ts:60-62` | `conversation_participants` | per-user, not per-conversation |
| `Project.createdAt` only | `src/types/projects.ts:26` | add `updated_at` | **Fix:** add `updatedAt` to the type if the UI needs it |
| `ProjectFile` (separate type) | `src/types/projects.ts:3-13` | `files` table | **Fix:** unify with `WorkspaceFile` or map (Q3) |
| `WorkspaceFile.projectName?` | `src/types/files.ts:7` | join `projects.name` | computed |
| `AuthTokens.expiresAt` (epoch ms) | `src/types/index.ts:20` | server returns epoch ms | keep numeric |
| `AppNotification.read` | `src/types/notifications.ts:20` | `notifications.read` | — |
| `AuditEvent.action`/`target` (resolved) | `src/api/contracts/admin.ts:62-63` | derived from `action_key`/`target_key` | **Fix:** server resolves i18n keys or returns both |
| `SecurityEvent.description?` | `src/api/contracts/admin.ts:34` | derived from `description_key` | same |

## 8. ER diagram (Mermaid)

```mermaid
erDiagram
  users ||--o{ workspace_members : joins
  users ||--o{ refresh_tokens : has
  users ||--o{ notifications : receives
  users ||--o{ focus_sessions : logs
  workspaces ||--o{ workspace_members : has
  workspaces ||--o{ projects : contains
  workspaces ||--o{ tasks : contains
  workspaces ||--o{ files : contains
  workspaces ||--o{ channels : contains
  workspaces ||--o{ activity_events : logs
  workspaces ||--o{ conversations : contains
  projects ||--o{ tasks : groups
  projects ||--o{ project_members : has
  tasks ||--o{ subtasks : has
  tasks ||--o{ task_comments : has
  tasks ||--o{ time_entries : logs
  tasks ||--o{ task_dependencies : "depends_on (PROPOSED)"
  channels ||--o{ channel_messages : has
  channels ||--o{ channel_read_state : tracks
  channel_messages ||--o{ message_reactions : has
  channel_messages ||--o{ message_mentions : has
  channel_messages ||--o{ channel_messages : "thread_root"
  conversations ||--o{ conversation_participants : has
  conversations ||--o{ conversation_messages : has
  conversation_messages ||--o{ message_reactions : has
  users ||--o{ audit_events : acts
  users ||--o{ security_events : triggers
  users ||--o{ reports : reports
```

## 9. Prisma schema (documentation text — not a code file)

```prisma
// PROPOSED — for the owner to copy into backend/prisma/schema.prisma
enum Role { user moderator admin super_admin }
enum UserStatus { active suspended invited }
enum WorkspaceType { personal team }
enum WorkspaceRole { owner admin member guest }
enum TaskStatus { backlog todo in_progress review completed archived }
enum TaskPriority { low medium high urgent }
enum Recurrence { none daily weekly monthly }
enum ProjectStatus { planning active on_hold completed archived }
enum FileType { document design image archive code other }
enum NotificationType { task_assigned task_completed deadline mention message project_update invitation role_change security system }
enum ActivityAction { task_created task_updated task_completed project_created member_invited message_sent role_changed user_suspended settings_changed file_uploaded file_deleted comment_added }
enum ActivityTarget { task project member channel workspace file comment }
enum ChannelKind { public announcements }
enum ConversationType { direct group }

model User {
  id           String   @id
  fullName     String   @map("full_name")
  username     String   @unique
  email        String   @unique
  role         Role     @default(user)
  status       UserStatus @default(active)
  avatarUrl    String?  @map("avatar_url")
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  lastActiveAt DateTime @default(now()) @map("last_active_at")
  preferences  UserPreference?
  memberships  WorkspaceMember[]
  @@map("users")
}

model Workspace {
  id          String @id
  name        String
  description String
  type        WorkspaceType
  ownerId     String @map("owner_id")
  color       String
  createdAt   DateTime @default(now()) @map("created_at")
  members     WorkspaceMember[]
  projects    Project[]
  tasks       Task[]
  files       File[]
  @@map("workspaces")
}

model WorkspaceMember {
  id           String @id @default(cuid())
  workspaceId  String @map("workspace_id")
  userId       String @map("user_id")
  role         WorkspaceRole @default(member)
  department   String?
  status       UserStatus @default(active)
  joinedAt     DateTime @default(now()) @map("joined_at")
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  user         User @relation(fields: [userId], references: [id])
  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Task {
  id             String @id
  workspaceId    String @map("workspace_id")
  projectId      String? @map("project_id")
  title          String
  description    String @default("")
  status         TaskStatus @default(todo)
  priority       TaskPriority @default(medium)
  category       String @default("General")
  startDate      DateTime? @map("start_date")
  dueDate        DateTime? @map("due_date")
  assigneeId     String? @map("assignee_id")
  creatorId      String  @map("creator_id")
  tags           String[]
  estimateMinutes Int?   @map("estimate_minutes")
  trackedMinutes Int     @default(0) @map("tracked_minutes")
  recurrence     Recurrence @default(none)
  completedAt    DateTime? @map("completed_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")
  subtasks       Subtask[]
  comments       TaskComment[]
  timeEntries    TimeEntry[]
  @@index([workspaceId, status])
  @@index([workspaceId, dueDate])
  @@map("tasks")
}

// ...Subtask, TaskComment, TimeEntry, Project, ProjectMember, File, ActivityEvent,
// Notification, FocusSession, UserPreference, Channel, ChannelMessage, MessageReaction,
// MessageMention, ChannelReadState, Conversation, ConversationParticipant,
// ConversationMessage, ConversationReadState, RefreshToken, PasswordResetToken,
// SecurityEvent, AuditEvent, SystemSettings, Report, Invitation  (same 1:1 mapping as §3–§5)
```

> The full schema is the union of §3–§5; the above shows the pattern. Every table maps with
> `@@map` to snake_case and every field with `@map`.

## 10. Seed strategy

`backend/prisma/seed.ts` (idempotent, upsert by fixed id) reproduces the frontend demo exactly:

| Seed | Source | Count |
|---|---|---|
| Users (3 demo + 27 generated) | `src/data/users.ts:7-93` | 30 |
| Demo passwords hashed | `src/data/users.ts:7-11` | 3 |
| Workspaces | `src/data/workspaces.ts:6-57` | 5 |
| Workspace members | `memberIds` in `src/data/workspaces.ts:23,33,43,53` | per workspace |
| Tasks | `src/data/tasks.ts` (79 rows) | 79 |
| Projects | `src/data/projects.ts` (15 rows) | 15 |
| Files | `src/data/files.ts` | per file |
| Notifications | `src/data/notifications.ts:6-44` (all `userId: u-001`) | 34 |
| Activity | `src/data/activity.ts:6-29` (all `ws-demo`) | 22 |
| Focus sessions | `src/data/activity.ts:42-47` (`u-001`, `ws-demo`) | 12 |
| Channels | `src/api/mock/mockChatService.ts:8-69` | 6 |
| Channel messages | `src/api/mock/mockChatService.ts:73-976` | ~60 |
| Admin reports | `src/api/mock/mockAdminService.ts:27-40` | 12 |
| Security events | `src/api/mock/mockAdminService.ts:42-48` | 5 |
| Audit events | `src/api/mock/mockAuditService.ts:7-28` | 20 |
| System settings | `src/api/mock/mockAdminService.ts:50-55` | 1 |

Rules: fixed ids (`u-001`, `ws-demo`, `p-101`, `ch-general`); relative dates where the frontend uses
offsets (`src/utils/dates.ts` helpers `hoursAgoIso`/`dayOffsetIso`) so demo data always looks
current (`src/data/notifications.ts:54`); running seed twice must not duplicate rows.
