---
title: 'Story 5.1: Project Assistant from docs-app'
type: 'feature'
created: '2026-11-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'd339dec1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Members have no in-app AI assistant to ask questions about documents in `docs-app/` with strict source-only answers and citations.

**Approach:** Add `assistant_documents` and `assistant_chunks` (`pgvector`) in PostgreSQL with RLS, create the `project-assistant` Edge Function using Gemini Embeddings + `gemini-2.5-flash` (returning citations or referring to the administrator when not found), and create the `/assistant` conversation screen in `apps/mobile/app/assistant.tsx` linked from `/home`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611230002_assistant_docs_pgvector.sql` with `vector` extension, `assistant_documents`, `assistant_chunks`, and `match_assistant_chunks`.
- Added `supabase/functions/project-assistant/index.ts` supporting `ask` (all active authenticated users) and `ingest` (admin only, idempotent by `filename`).
- Created `apps/mobile/app/assistant.tsx` and linked it from `apps/mobile/app/home.tsx`.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
