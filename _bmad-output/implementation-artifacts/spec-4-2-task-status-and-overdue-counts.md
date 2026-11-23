---
title: 'Story 4.2: View tasks by status and overdue count'
type: 'feature'
created: '2026-11-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '809b5b1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The dashboard shows global and personal progress percentages, but does not display task counts by status (`Créées`, `En cours`, `Terminées`) or `En retard`.

**Approach:** Extend `public.get_project_progress(uuid)` in PostgreSQL to return `created_count`, `in_progress_count`, `done_count`, and `overdue_count` (excluding `done` and `cancelled`), and display those four counters in the « Tableau de bord » card in `apps/mobile/app/projects.tsx` without any « Annulées » counter.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611230001_story_4_2_dashboard_counts.sql` extending `get_project_progress(uuid)` with status and overdue counts.
- Updated `apps/mobile/app/projects.tsx` to display « Créées », « En cours », « Terminées », and « En retard » in the « Tableau de bord » card.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
