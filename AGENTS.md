# Madar (مدار) — Backend Agent Context

## Project
Monorepo at E:\projects\taskflow-3d: `frontend/` (React, mock-first, DO NOT MODIFY unless asked) and `backend/` (NestJS, to build).

## Stack (fixed, do not substitute)
Node 22, TypeScript, NestJS (Express), Prisma, PostgreSQL 16 (local on Windows), Zod, argon2, JWT.
NO Docker. NO Redis. NO MinIO (use LocalDiskStorage). NO paid services.

## Environment
- Windows + PowerShell. Use PowerShell-compatible commands.
- DB: local PostgreSQL 16, database `madar`, port 5432.
- `backend/.env` already exists with DATABASE_URL. NEVER read, print, edit, or commit it. Create `.env.example` with placeholders only.
- Never put passwords/tokens in code, logs, or commits.

## Source of truth
1. Actual frontend code in `frontend/src` (contracts in `src/api/contracts`, types in `src/types`, seed data in `src/data`, mocks in `src/api/mock`).
2. Plan docs in `frontend/docs/backend/00..08-*.md`. Where docs conflict with code, CODE WINS and report the conflict.
Do not invent fields or endpoints; cite the frontend file for every claim.

## Rules
- One phase at a time. Do only what the prompt asks.
- Never modify `frontend/` unless explicitly told.
- Never delete files outside `backend/`.
- Routes under `/api/v1`. Error envelope: `{ code, message, fieldErrors?, requestId }`.
- Each phase ends with runnable verification; run it and show real output.
- Commit after each phase with a conventional message. Do not push.
- If blocked or unsure, stop and ask instead of guessing.
## Status
- Phase 0-1 DONE (backend/: Nest, Prisma 7 with adapter-pg, health, seed, error envelope, Vitest).
- Prisma 7: URL in prisma.config.ts, client generated to src/generated/prisma (git-ignored).
- Testing uses Vitest. backend/.npmrc has legacy-peer-deps=true.
- Git IS initialized at the repo root. Never run `git init` inside backend/. Do not push; I commit manually.