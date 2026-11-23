---
title: 'Story 4.3: Refresh the dashboard'
type: 'feature'
created: '2026-11-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'b811c3f'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users need an explicit « Actualiser » button directly on the « Tableau de bord » card with loading indicator, last-success timestamp, and stale-data « Réessayer » feedback without clearing existing numbers.

**Approach:** Add an « Actualiser » button, loading indicator, `lastUpdatedAt` timestamp, and `refreshError` + « Réessayer » notice inside the « Tableau de bord » card in `apps/mobile/app/projects.tsx` wired to `refreshAll()`.

</frozen-after-approval>

## Implementation Notes

- Updated `apps/mobile/app/projects.tsx` to add « Actualiser », loading indicator, `lastUpdatedAt`, and stale-data « Réessayer » feedback directly inside the « Tableau de bord » card.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
