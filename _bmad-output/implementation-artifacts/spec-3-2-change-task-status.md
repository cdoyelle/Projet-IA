---
title: 'Story 3.2: Change the status of my task'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '437d030'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Assigned members cannot update the status of their own tasks (`Créée` -> `En cours` / `Terminée`, `Terminée` -> `En cours`).

**Approach:** Add `public.update_my_task_status(uuid, text)` RPC enforcing active session, active project, `assignee_id = auth.uid()`, and valid status transitions, and show status action buttons only on tasks assigned to the current user in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611180002_story_3_2_task_status_transitions.sql` with `update_my_task_status(uuid, text)`.
- Updated `apps/mobile/app/projects.tsx` to display « Passer en cours », « Terminer », and « Remettre en cours » buttons only for tasks assigned to `userId` on active projects.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
