---
title: 'Story 3.3: Edit a task I manage'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '8c4faa5'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Project owners and administrators cannot edit task details, and done tasks must remain locked until returned to `in_progress`.

**Approach:** Add a column-scoped `UPDATE` grant and `tasks_update_owner_or_admin` RLS policy on `public.tasks` (blocking updates when `status = 'done'`), add `public.reopen_done_task(uuid)` for authorized roles, and add inline task editing + locked-state « Remettre en cours » in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611180003_story_3_3_edit_task.sql` with `tasks_update_owner_or_admin` and `reopen_done_task(uuid)`.
- Updated `apps/mobile/app/projects.tsx` with « Modifier » on non-done tasks for owners/admins, locked notice + « Remettre en cours » on done tasks, and inline task editing.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
