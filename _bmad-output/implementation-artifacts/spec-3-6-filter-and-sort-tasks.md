---
title: 'Story 3.6: Filter and sort tasks'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'bf17057'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot filter or sort tasks within a project to find specific work.

**Approach:** Add combinable task filters (status, priority, assignee, tag, due date) with active filter count and « Effacer les filtres », plus 4 bidirectional sorts (due date, priority, created date, title) in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Updated `apps/mobile/app/projects.tsx` to select `created_at` on tasks and provide combinable filters, active filter count, « Effacer les filtres », bidirectional 4-field sorting, and empty-filter state.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
