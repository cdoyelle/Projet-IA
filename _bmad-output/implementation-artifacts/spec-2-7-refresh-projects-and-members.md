---
title: 'Story 2.7: Refresh projects and members'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'a8471a6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users have no explicit refresh button or pull-to-refresh gesture on `/projects` to reload recent changes to projects and project members.

**Approach:** Add `RefreshControl` (pull-to-refresh) and an « Actualiser » header button to `apps/mobile/app/projects.tsx` that reload both the accessible projects list and the selected project's members.

</frozen-after-approval>

## Implementation Notes

- Updated `apps/mobile/app/projects.tsx` with `RefreshControl` on `ScrollView` and an « Actualiser » button in the header to refresh projects and members on demand.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
