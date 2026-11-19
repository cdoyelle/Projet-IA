---
title: 'Story 3.8: Comment on a task'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '0b2c9c0'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot post, edit, or delete comments on individual tasks within a visible project.

**Approach:** Add `public.task_comments` with RLS enforcing same-project task consistency, read/insert access on visible projects (including cancelled tasks), and edit/delete rights for the author, project owner, or admin, plus `list_task_comments(uuid)` RPC and per-task comments UI in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611190002_story_3_8_task_comments.sql` with `public.task_comments`, RLS policies, `list_task_comments(uuid)`, and comment-check in `delete_virgin_task(uuid)`.
- Updated `apps/mobile/app/projects.tsx` with expandable « Commentaires (N) » per task (add, edit, delete according to role/authorship).

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
