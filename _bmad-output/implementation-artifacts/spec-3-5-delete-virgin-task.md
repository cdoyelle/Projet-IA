---
title: 'Story 3.5: Delete only a virgin task'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '65773f9'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Project owners and administrators cannot delete a newly created, never-started task, and started tasks must only allow cancellation, never deletion.

**Approach:** Add `has_started` tracking (plus trigger) and `delete_virgin_task(uuid)` RPC on `public.tasks`, and show « Supprimer » with confirmation in `apps/mobile/app/projects.tsx` only when `status === 'created' && !has_started`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611180005_story_3_5_delete_virgin_task.sql` with `has_started`, `tasks_mark_started` trigger, and `delete_virgin_task(uuid)`.
- Updated `apps/mobile/app/projects.tsx` to show « Supprimer » (with confirmation) only on virgin `created` tasks (`!has_started`), while started/done tasks only offer « Annuler ».

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
