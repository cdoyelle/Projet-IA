---
title: 'Story 4.1: View global and personal progress'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '1d887e3'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users have no dashboard section comparing global project progress to their personal progress using the `0 / 0.5 / 1` status weights.

**Approach:** Add `public.get_project_progress(uuid)` in PostgreSQL computing both `global_progress` and `personal_progress` (returning `null` when no eligible non-cancelled task exists), and display the « Tableau de bord » card in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611200001_story_4_1_dashboard_progress.sql` with `get_project_progress(uuid)`.
- Updated `apps/mobile/app/projects.tsx` to load and display « Avancement global » and « Avancement personnel » (leaving empty `—` instead of `0 %` when no eligible task exists).

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
