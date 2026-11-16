---
title: 'Story 2.6: Cancel or reactivate a project'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '801bd45'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Owners and administrators cannot cancel an active project (hiding it from ordinary members without deleting it) or reactivate a cancelled project.

**Approach:** Extend `public.projects.status` to include `'cancelled'`, update `app_private.can_access_project` so cancelled projects are visible only to admins and owners, add `cancel_project` and `reactivate_project` RPCs, and add « Annuler le projet » (with confirmation) and « Réactiver le projet » actions to `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160006_story_2_6_cancel_reactivate_project.sql` allowing `'cancelled'` status, restricting cancelled project visibility in `can_access_project`, and adding `cancel_project` / `reactivate_project` RPCs.
- Updated `apps/mobile/app/projects.tsx` with « Annuler le projet » confirmation, « Annulé » status display with `closed_at`, and « Réactiver le projet » clearing `closed_at`.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
