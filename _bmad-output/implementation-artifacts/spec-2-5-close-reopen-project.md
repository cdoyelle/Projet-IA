---
title: 'Story 2.5: Close and reopen a project'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'b034da5'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Owners and administrators cannot close an active project or reopen a closed project while preserving its previous `closed_at` date.

**Approach:** Add `closed_at` to `public.projects` along with `close_project(uuid)` and `reopen_project(uuid)` RPCs, and add « Clôturer le projet » / « Rouvrir le projet » actions and `closed_at` display to `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160005_story_2_5_close_reopen_project.sql` adding `closed_at` and `close_project` / `reopen_project` RPCs.
- Updated `apps/mobile/app/projects.tsx` to display `closed_at` and allow owners/admins to close active projects and reopen closed projects while preserving the previous `closed_at` date.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
