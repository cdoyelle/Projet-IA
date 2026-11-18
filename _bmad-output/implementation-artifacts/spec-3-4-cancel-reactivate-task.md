---
title: 'Story 3.4: Cancel or reactivate a task'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '3d675d7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Owners and administrators cannot cancel a task while preserving its previous status, nor reactivate it to restore that previous status.

**Approach:** Extend `public.tasks` with `'cancelled'` status and `previous_status`, add atomic `cancel_task(uuid)` and `reactivate_task(uuid)` RPCs, and add « Annuler » (with confirmation) and « Réactiver » actions in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611180004_story_3_4_cancel_reactivate_task.sql` adding `previous_status`, `'cancelled'` status, `cancel_task`, and `reactivate_task`.
- Updated `apps/mobile/app/projects.tsx` with « Annuler » confirmation, « Annulée » status display, and « Réactiver » restoring the previous status.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
