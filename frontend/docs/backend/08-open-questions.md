# Madar — Backend Plan: 08 Open Questions

> Numbered questions whose answers change the design. Each has a **recommended default** so work is
> never blocked. None block Phase 0–2.

**Q1. Monorepo vs separate repo?**
Recommendation: **monorepo** with `frontend/` + `backend/` (+ optional `packages/shared` for Zod).
Rationale: the frontend already defines the exact shapes to implement (`src/api/contracts/*`).
If monorepo tooling feels heavy, keep `backend/` standalone now and promote shared schemas later.

**Q2. There are no contracts for chat, members/invitations, or audit — who writes them?**
Recommendation: **you do, before Phase 3/7/10.** Create `src/api/contracts/chat.ts`,
`members.ts`, `audit.ts` (types already exist: `src/types/chat.ts`, `src/types/members.ts`,
`src/api/contracts/admin.ts` `AuditEvent`). Also re-export `focus/ai/analytics/admin` from
`src/api/contracts/index.ts` (currently missing — `index.ts:1-11`). Without this, adapters can't be
written mechanically.

**Q3. `ProjectFile` vs `WorkspaceFile` — one table or two?**
The frontend has **two** file types: `ProjectFile` (`src/types/projects.ts:3-13`, used only by
`src/store/projectStore.ts:6-83`) and `WorkspaceFile` (`src/types/files.ts:3-18`).
Recommendation: **one `files` table**, expose `/projects/:id/files` as a filtered view, and deprecate
`ProjectFile` (or map it). Confirm before Phase 5.

**Q4. Reaction storage for channel vs conversation messages.**
Recommendation: **one `message_reactions` table with a nullable `channel_message_id` /
`conversation_message_id`** (or two tables if you prefer strict FKs). Pick one before Phase 7.

**Q5. Task dependencies (and cycle prevention).**
The frontend has **no dependency field** (`src/types/tasks.ts:18-40`). The prompt mentions them.
Recommendation: **do not build in v1**; if needed, add `task_dependencies` with a DFS cycle check on
insert (`02-data-model.md` §3.11). Confirm whether the UI will expose them.

**Q6. File trash/restore and retention?**
The UI hard-deletes today (`src/api/mock/mockFileService.ts:50-53`).
Recommendation: add `deleted_at` + **30-day retention** then purge (cheap, safer). Confirm the window.

**Q7. Calendar payload size.**
`CalendarItem` includes full `rawTask`/`rawProject` (`src/api/contracts/calendar.ts:19-20`).
Recommendation: return the **light shape** and let the client fetch the full entity on open; reduces
payload. Confirm if the UI needs the raw objects immediately.

**Q8. AI: keep the free intent engine or add a real LLM?**
Recommendation: **keep the server-side port of the mock intent engine** (`mockAiService.ts:23-74`) —
free, offline, deterministic. A real LLM requires a provider (Q: which free tier? rate limits?) and
is optional. Confirm.

**Q9. Refresh token: cookie or localStorage?**
Recommendation: **HttpOnly cookie for refresh + bearer access header** (`04-auth-security.md` §1.3),
which needs a CSRF token. If you want the simplest v1, use localStorage for both and revisit before
public hosting. Confirm before Phase 2.

**Q10. File virus scanning / content moderation?**
No free always-on scanner exists.
Recommendation: **defer**; mitigate with private buckets, type/size limits, no inline HTML/SVG
(`04-auth-security.md` §5). Revisit at Phase 11.

**Q11. One realtime transport or two (WS + SSE)?**
Recommendation: **two** (WS chat, SSE notifications) — SSE is far simpler (`05-realtime-files.md` §2).
Confirm if you'd rather maintain a single WS.

**Q12. Email provider for production.**
Dev = Mailpit (free). Production needs a free SMTP tier.
Recommendation: pick any transactional provider's free plan later; keep `SMTP_URL` provider-agnostic
(`01-architecture.md` §4). Confirm before Phase 12.

**Q13. Languages for emails.**
Product is AR (default) + EN (`src/i18n/index.ts:24-35`).
Recommendation: send emails in the **user's saved language** (`user_preferences`, JSONB) with EN
fallback. Confirm.

**Q14. Social login (Google/GitHub)?**
The login screen shows social buttons but they are explicitly "future"
(`src/i18n/locales/en.app.json` `auth.social.future`).
Recommendation: **defer**; email+password only in v1. Confirm.

**Q15. Admin visibility rules — who sees what?**
Recommendation: moderator → reports only; admin → users/workspaces/tasks/projects/analytics/logs;
super_admin → settings/security/roles (`src/constants/permissions.ts:16-34`). Confirm the exact matrix.

**Q16. Demo mode rules (read-only vs resettable sandbox)?**
Recommendation: **resettable `ws-demo` sandbox** (`04-auth-security.md` §11). Confirm whether visitors
should each get an isolated copy (more work) or share `ws-demo`.

**Q17. Multi-workspace per user and any future billing?**
Constraint: everything free, no paid subscriptions.
Recommendation: support multiple workspaces (already in the data model), **no billing** now; design
does not block adding it later. Confirm.

**Q18. Data residency / PII retention.**
Recommendation: single region (whatever the free host provides); purge `security_events` after 90
days; keep audit rows anonymised. Confirm any legal requirement.

**Q19. Analytics/privacy (do you need usage analytics)?**
Recommendation: rely on server logs + existing product analytics pages; **no third-party trackers**
(privacy + free). Confirm.

**Q20. Mobile app plans?**
None in the frontend (it is a responsive PWA — `frontend/README.md:49-53`).
Recommendation: **PWA only**; a REST + WS API already supports a future mobile client. Confirm.

**Q21. Search: pg_trgm vs tsvector?**
Recommendation: **pg_trgm + normalised column** first (`02-data-model.md` §6), add tsvector later if
ranking needs it. Confirm.

**Q22. Rate-limit numbers.**
Defaults proposed in `03-api-spec.md` §21. Confirm they match your tolerance (they are easy to tune).

**Q23. Pagination defaults (limit sizes)?**
Recommendation: `limit` default 20–50, max 100; `users` keeps page-based (`src/api/contracts/users.ts`).
Confirm.

**Q24. Deployment target (free tier) — which host?**
Free tiers change frequently and may sleep.
Recommendation: decide at Phase 12; keep `docker-compose` as the source of truth so the host is
swappable. Confirm preferred host (Vercel/Render/Railway/Fly/Cloudflare).
