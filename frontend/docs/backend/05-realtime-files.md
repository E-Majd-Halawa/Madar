# Madar — Backend Plan: 05 Realtime & Files

> Frontend behaviour cited from stores/mocks. Server design is **PROPOSED**.

## 1. What the frontend simulates today

| Behaviour | Current simulation | Evidence |
|---|---|---|
| Notification push | In-memory listener set; `push()` notifies subscribers → toast | `src/api/mock/mockNotificationService.ts:8,27-38`; `src/store/notificationStore.ts:32-40` |
| Chat typing | Random directory user "types" for ~1.5s after you send | `src/store/chatStore.ts:245-265` |
| Own typing timeout | 3s auto-clear | `chatStore.ts:392-411` |
| Message status | `sending` → `delivered` after 400ms; `read` on open | `chatStore.ts:151-157,164-178,487-493` |
| Delivery/read receipts | Client-only flags on messages | `src/types/chat.ts:35` |
| Presence / online | Not implemented (only `User.lastActiveAt`) | `src/types/index.ts:13` |
| Unread counts | Derived from local arrays | `notificationStore.ts:85`; `src/types/chat.ts:19,57` |
| Focus timer | Pure client interval in `focusStore` | `src/store/focusStore.ts:73-85` |
| AI streaming | Fake char-by-char `onToken` | `src/api/mock/mockAiService.ts:191-196` |

## 2. Transport decision

| Need | Best transport | Why |
|---|---|---|
| Chat messages, typing, presence, reactions | **WebSocket** | Bidirectional, low latency, many small events |
| Notifications, focus reminders, deadline pushes | **SSE** | One-way server→client, trivial to implement, auto-reconnect |
| AI token streaming | **SSE** (or WS) | One-way stream; SSE is simplest |

**Recommendation: two transports — WebSocket for chat, SSE for notifications (and AI streaming).**
Rationale: SSE is dramatically simpler for a beginner (plain HTTP, works through most proxies,
built-in reconnect) and matches notifications exactly; chat genuinely needs bidirectional. If the
owner prefers one transport, a single WebSocket can serve both — but then notifications need manual
reconnect/backoff (Q11 in `08-open-questions.md`).

Auth handshake:
- **SSE:** standard `Authorization: Bearer` header on the `EventSource`… but native `EventSource`
  cannot send headers. Use a short-lived **stream ticket**: `POST /notifications/stream-ticket` →
  `{ ticket, expiresAt }`; connect to `GET /notifications/stream?ticket=…`. (Alternative: cookie-based
  auth since refresh is already a cookie.)
- **WebSocket:** connect to `wss://…/ws?ticket=…` (same ticket pattern) or send an `auth` frame as the
  first message; server closes the socket if the token is invalid/expired within N seconds.

## 3. Event catalog (PROPOSED)

Rooms/namespaces: `user:<userId>` (personal), `workspace:<workspaceId>`, `channel:<channelId>`,
`conversation:<conversationId>`.

### 3.1 Chat (WebSocket)
| Event | Direction | Payload | Room |
|---|---|---|---|
| `message:new` | S→C | `ChannelMessage` | `channel:<id>` |
| `message:edited` | S→C | `{ id, content, editedAt }` | `channel:<id>` |
| `message:deleted` | S→C | `{ id, deletedAt }` | `channel:<id>` |
| `reaction:changed` | S→C | `{ messageId, emoji, userIds }` | `channel:<id>` |
| `thread:reply` | S→C | `ChannelMessage` | `channel:<id>` |
| `typing:start` / `typing:stop` | C↔S | `{ channelId, userId }` | `channel:<id>` |
| `presence:update` | S→C | `{ userId, online }` | `workspace:<id>` |
| `dm:new` / `dm:read` | S→C | `ChatMessage` / `{ conversationId, userId, lastReadAt }` | `conversation:<id>` |
| `channel:read` | S→C | `{ channelId, userId, lastReadAt }` | `channel:<id>` |

Client → server messages mirror the REST mutations or are sent over REST and fanned out via WS. Keep
**writes over REST** (easier validation/idempotency) and use WS only for delivery — this matches the
frontend, which already calls `chatService.*` for writes (`src/store/chatStore.ts:237,272,297,311`).

### 3.2 Notifications (SSE)
| Event | Payload |
|---|---|
| `notification:new` | `AppNotification` (`src/types/notifications.ts:13-21`) |
| `notification:read` | `{ id }` |
| `notification:read-all` | `{}` |

The frontend contract even names the event: `WS: notification:new`
(`src/api/contracts/notifications.ts:3`).

### 3.3 Focus / reminders (SSE) — **PROPOSED**
`focus:session-completed` (optional cross-device sync), `reminder:due` (deadline reminders; needs a
scheduler — see §5).

## 4. Reliability

- **Ordering:** messages carry a monotonic server `created_at` (timestamptz) and a per-room sequence
  (`seq` bigint per channel/conversation, **PROPOSED**). Clients sort by `(createdAt, seq)`.
- **Idempotency:** client sends an `Idempotency-Key` (or `clientId`) on send; server dedupes so
  retries don't double-post.
- **Missed events:** on reconnect the client passes the last seen `seq`/`createdAt`; the server
  replays missed rows (`GET /channels/:id/messages?after=…`). SSE uses the standard `Last-Event-ID`
  header.
- **Reconnect/backoff:** client exponential backoff (1s→30s); SSE `EventSource` reconnects
  automatically, WS needs a small client helper.
- **Presence:** derived from active socket connections + `users.last_active_at`; on disconnect,
  broadcast `presence:update { online:false }`.

## 5. Scaling note

- **Single instance first** (free, simplest): sockets held in process memory, no broker.
- **Only if multiple instances are needed:** add Redis pub/sub so events fan out across instances
  (`@socket.io/redis-adapter` or a custom channel). This is the *only* strong justification for
  Redis (see `01-architecture.md` §1.4). Background reminders also need a scheduler — use
  `@nestjs/schedule` in-process first; a queue (BullMQ + Redis) only when it must survive restarts.

## 6. Files

### 6.1 Storage abstraction (provider-agnostic)

```
interface FileStorage {
  createUploadUrl(key, mime, maxBytes): Promise<{ url, expiresAt }>   // presigned PUT
  createDownloadUrl(key, expiresIn): Promise<string>                  // presigned GET
  head(key): Promise<{ size, mime, etag } | null>
  delete(key): Promise<void>
}
```
Implementations: `LocalDiskStorage` (dev without MinIO), `S3Storage` (MinIO locally, Cloudflare R2
or any S3 later). Selected by env (`S3_ENDPOINT` etc., `01-architecture.md` §4). No provider-specific
code outside this module.

### 6.2 Upload flow (step by step)
1. Client validates size/type locally, then `POST /workspaces/:id/files/presign`
   → `{ storageKey, uploadUrl, expiresAt }` (server picks `storageKey`, checks quota).
2. Client `PUT`s the bytes directly to `uploadUrl` (no large body through the API server).
3. Client `POST /workspaces/:id/files` with `{ storageKey, name, size, type, mime, projectId, folder,
   description }`.
4. Server `head()`s the object to verify size/mime, computes checksum, inserts the `files` row,
   writes `file_uploaded` activity, returns `WorkspaceFile`.
- Multipart fallback (**PROPOSED** for big files): proxy upload through the API with a multipart
  parser. Simpler but heavier; only if presign is a problem.
- Progress: the frontend can use `XMLHttpRequest`/`fetch` progress against the presigned URL
  (`07-frontend-integration.md` §upload).

### 6.3 Download / preview
- `GET /files/:id/download` → 302 to a signed GET URL (short TTL), increments `downloads_count`.
- Preview: signed URL with `Content-Disposition: inline` for allowed types (images/PDF). Thumbnails
  are **later** (Phase 11, generate on upload with a free lib, store alongside).

### 6.4 Quotas, trash, retention
- Quota: per-workspace `quota_bytes` (default 10 GB, `mockFileService.ts:59-60`); reject presign when
  exceeded → 413 `quota_exceeded`.
- Trash: **PROPOSED** (the UI has no trash today — `mockFileService.ts:50-53` is hard delete). If
  added: `deleted_at` + retention window (e.g. 30 days) then a job purges object + row.
- Orphan cleanup: scheduled job removes storage objects whose row is gone.

### 6.5 Security
Private buckets, signed URLs only, type/size allow-lists, checksum verification, no inline
HTML/SVG rendering — see `04-auth-security.md` §5.
