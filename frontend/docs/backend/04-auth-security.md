# Madar — Backend Plan: 04 Auth & Security

> Frontend facts cited. Everything else is **PROPOSED**. Goal: free, simple enough for a solo
> beginner, but not insecure.

## 1. Authentication design

### 1.1 Password storage
- Hash with **argon2id** (fallback bcrypt if native build is painful on Windows). Never store or
  return plaintext — the mock does (`src/api/mock/userRegistry.ts:7-11`) and that is explicitly
  flagged as wrong there.
- Parameters: argon2id defaults (memory 19 MiB, t=2, p=1) or bcrypt cost 12.
- Password policy mirrors the frontend rule: 8+ chars with 3 of uppercase/number/symbol
  (`src/i18n/locales/en.app.json` `validation.passwordWeak`).

### 1.2 Tokens
- **Access token:** JWT, short-lived (`JWT_ACCESS_TTL=15m`), contains `sub` (user id), `role`,
  `sid` (session/refresh family id), `exp`. Sent in the `Authorization` header.
- **Refresh token:** opaque random 256-bit string, stored **hashed** in `refresh_tokens`
  (`02-data-model.md` §5.1), TTL `REFRESH_TTL_DAYS=30`. **Rotated on every use.**
- **Reuse detection:** if a refresh token that was already rotated/revoked is presented, revoke the
  whole `family_id` and force re-login (security_event `suspicious`).
- Logout revokes the presented refresh token; the frontend already sends it
  (`src/store/authStore.ts:78-82`).

### 1.3 Cookie vs header (SPA decision)
| Aspect | Header + localStorage | HttpOnly cookie |
|---|---|---|
| XSS impact | Token stealable by XSS | Token not readable by JS |
| CSRF | Not applicable (no auto-send) | Needs CSRF protection |
| Simplicity for a beginner | High | Medium |
| Fits existing frontend | Yes — `httpClient` already sets `Authorization: Bearer` (`httpClient.ts:30-36`) | Requires rework |

**Recommendation: access token in the `Authorization` header; refresh token in an
`HttpOnly; Secure; SameSite=Strict` cookie.** This keeps the frontend's existing bearer flow
(`httpClient.ts:30-36`) while protecting the long-lived secret from XSS. Because refresh is sent via
cookie, add a **CSRF double-submit token** for `POST /auth/refresh` and `POST /auth/logout`
(read a `csrf` cookie, echo it in a header; reject on mismatch). If the owner prefers maximum
simplicity for v1, store the refresh token in memory + localStorage and skip CSRF — acceptable for a
local-first app, revisit before public hosting. See `08-open-questions.md` Q9.

### 1.4 "Remember me"
Frontend: `remember` boolean is persisted and a `tf3d.tab` sessionStorage flag ends non-remembered
sessions when the tab closes (`src/store/authStore.ts:21-41,90`).
Mapping (PROPOSED):
- `remember=true` → refresh token TTL 30 days, cookie `Max-Age=30d`.
- `remember=false` → refresh token TTL = session (cookie without `Max-Age`, i.e. browser-session), and
  the token row is revoked when the tab/session ends. The client keeps its existing tab guard.

### 1.5 Password reset & email verification
- `POST /auth/password/forgot` → create `password_reset_tokens` row, email a link
  `{PUBLIC_WEB_URL}/reset-password?token=…`. Always return `204` (`mockAuthService.ts:84-87`).
- `POST /auth/password/reset` (**PROPOSED**) → verify token, set new hash, revoke all refresh tokens.
- Email verification (**PROPOSED**): `email_verification_tokens`; `User.status` stays `active` but a
  `emailVerifiedAt` flag gates sensitive actions later.
- **Dev email:** Mailpit in Docker Compose (free, captures all mail at `localhost:8025`).
  **Later free tier:** any free SMTP (e.g. a transactional provider's free plan) via `SMTP_URL`.
  Locally nothing is sent externally.

### 1.6 Login protection
- Rate limit `/auth/login` (strict class, `03-api-spec.md` §21): 5–10 attempts/min per IP+email.
- Progressive lockout: after N failures (e.g. 10 in 15 min) block the account/IP for 15 min; write a
  `failed_login` security event (`src/api/contracts/admin.ts:31`).
- Do not reveal whether the email exists (generic `invalid_credentials`,
  `src/api/contracts/auth.ts:3-9`).

### 1.7 2FA (TOTP) — later phase
Settings has a "Security & 2FA" section (`en.app.json` `settings.security.twoFactor`). Plan: store
`totp_secret` (encrypted) + `totp_enabled` on `users`; endpoints `POST /me/2fa/setup`,
`POST /me/2fa/verify`, `POST /me/2fa/disable`; require TOTP at login when enabled. **Phase 11**, not
before the core works. Free (no vendor).

### 1.8 Sessions list & revoke (Security page)
- `GET /me/sessions` (**PROPOSED**) → list from `refresh_tokens` (device from `user_agent`, ip,
  created, last-used, current flag).
- `DELETE /me/sessions/:id` → revoke; `POST /admin/security/sessions/:id/revoke` for admins
  (`src/api/contracts/admin.ts:29-41`, `mockAdminService.ts:117-120`).

## 2. Authorization (RBAC) — server is the source of truth

- **Global roles** and cumulative permissions are already defined in
  `src/constants/permissions.ts:4-52`. Copy the exact strings to the backend (or import from
  `packages/shared`) so client and server never diverge.
- Implement a NestJS `PermissionsGuard` with a `@RequirePermission('tasks:manage_own')` decorator;
  the guard reads the user's role from the access token and expands it via the same inheritance
  table (`permissions.ts:44-52`).
- **Workspace-level roles** (`owner|admin|member|guest`, `src/types/members.ts:1`) are resolved per
  request from `workspace_members`. A `WorkspaceScopeGuard` verifies membership and attaches the
  workspace role.
- Rules already visible in the frontend that must be enforced server-side:
  - announcements channel read-only; only `chat:post_in_announcements`
    (`src/api/mock/mockChatService.ts:1097-1101`).
  - message edit = author only (`mockChatService.ts:1146`); delete = author or
    `chat:delete_any_message` (`mockChatService.ts:1169`).
  - channel create requires `chat:create_channel` (`mockChatService.ts:1041`).
- **Defense in depth:** guards block by role; services also scope every query by `workspace_id` so a
  bug in a guard cannot leak another workspace's rows.

## 3. Audit trail

- Every privileged mutation (role change, suspend, delete, settings change, session revoke) writes an
  `audit_events` row (`src/api/contracts/admin.ts:50-64`; example data `mockAuditService.ts:7-28`).
- Fields: actor, action key, target key + params, ip, device, status.
- The admin UI already renders these with i18n keys (`actionKey`/`targetKey`) — the server stores the
  keys, the client translates (keeps the API language-neutral).

## 4. Input validation & output sanitization

- **Validate** every request with Zod (shared schemas). Reject unknown fields.
- **XSS:** the SPA escapes by default in React, but message/task text is user content that may later
  be rendered in emails or exports. Rules:
  - store raw text, **sanitize on output** where HTML is possible (emails); never `dangerouslySetInnerHTML`
    on user text.
  - strip control characters; cap lengths (task title 120 per `validation.titleLong`; chat message a
    reasonable max, **PROPOSED** 4000).
- **SQL injection:** impossible via Prisma parameterisation; raw search SQL must use parameters.
- **Mass assignment:** Zod schemas whitelist fields (e.g. a client cannot set `role` on register —
  server forces `'user'`, `mockAuthService.ts:54`).

## 5. File upload security

- Enforce `MAX_UPLOAD_MB` (default 25) and an allow-list of MIME types/extensions.
- Store files in **private** buckets; serve only via short-lived **signed URLs**.
- Validate the object size/type after upload (the presigned PUT can be abused); verify checksum.
- Virus scanning is **out of scope for v1** (no free always-on scanner); note it as a future task
  (Q10). Mitigate by private buckets + type limits + no inline HTML/SVG rendering.
- Quota enforcement against the 10 GB workspace limit (`mockFileService.ts:59-60`).

## 6. Transport & headers

- **CORS:** allow `CORS_ORIGINS` (today `http://localhost:5173`). Credentials enabled only because of
  the refresh cookie; list exact origins, never `*` with credentials.
- **helmet** defaults (CSP, HSTS in production, `X-Content-Type-Options`, frame-deny).
- HTTPS in production via the host's free certificate (see `06-roadmap.md` Phase 12).

## 7. Secrets & configuration

- Secrets only in `.env` (git-ignored; `.env.example` committed with placeholders).
- Never commit real JWT secrets, DB passwords, or SMTP creds.
- Rotate `JWT_ACCESS_SECRET` on compromise (invalidates all access tokens; refresh rows remain).

## 8. Dependency & code hygiene

- `npm audit` in CI; Dependabot (free) for updates.
- Pin major versions; review Prisma/Nest upgrades.
- Lint + typecheck gate in CI (`01-architecture.md` §9).

## 9. PII & logging rules

- **Never log**: passwords, tokens, refresh strings, message bodies, file contents.
- Log identifiers only (`userId`, `requestId`, `route`).
- Redact `Authorization`/`Cookie` headers in the logger.
- Keep `security_events` for auth anomalies; purge on a schedule (**PROPOSED** 90 days).

## 10. Data export & delete (Settings → Data & Export)

The UI has export JSON/CSV and account deletion (`en.app.json` `settings.data`).
- `GET /me/export?format=json|csv` (**PROPOSED**) → the user's tasks, projects, files metadata,
  notifications, preferences.
- `DELETE /me` (**PROPOSED**) → soft-delete then purge: revoke sessions, anonymise PII, keep audit
  rows (with actor set to `deleted-user`). Demo accounts must refuse (UI already blocks:
  `settings.data.demoDeleteError`).

## 11. Demo mode design (safe against a real backend)

Frontend: `/demo` route (`src/app/router.tsx:56`), `loginAsDemo` (`mockAuthService.ts:63-68`),
`isDemo` flag (`src/types/index.ts:26`), demo banner (`en.app.json` `shell.demoBanner`).
**PROPOSED server design (choose one, recommended = B):**
- **A. Read-only demo user:** `u-001` cannot write (403 on mutations). Simple but breaks the
  interactive demo the landing page advertises (`src/pages/landing/sections/ProductPreviewSection`).
- **B. Resettable sandbox (recommended):** `u-001` belongs to `ws-demo`; mutations are allowed but
  scoped to `ws-demo`; a scheduled job (or a `POST /admin/demo/reset`) re-seeds `ws-demo` from the
  seed snapshot. No real user data is touched. Optionally give each visitor a throwaway copy
  (**PROPOSED**, more work).
- Never expose admin/super_admin demo credentials in production builds; keep them for local only.

## 12. Backup plan (free)

- Local: `pg_dump` script + Docker volume snapshot (free).
- Hosted: the free Postgres tier's own backups where available, plus a scheduled `pg_dump` to the
  S3-compatible bucket (free within limits). Document a restore drill. See `06-roadmap.md` Phase 11.

## 13. Security acceptance checklist (Definition of Done)

- [ ] Passwords argon2id; no plaintext anywhere.
- [ ] Access JWT ≤ 15m; refresh rotated + hashed + reuse-detected.
- [ ] `/auth/*` rate-limited + lockout; `failed_login` events recorded.
- [ ] RBAC guard enforces `src/constants/permissions.ts` server-side; workspace scope on every query.
- [ ] Audit row for every privileged mutation.
- [ ] Uploads size/type limited; private bucket; signed URLs.
- [ ] helmet + strict CORS; no secrets in git/logs.
- [ ] `npm audit` clean; CI gate green.
