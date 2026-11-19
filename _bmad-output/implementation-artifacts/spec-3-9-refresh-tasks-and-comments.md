---
title: 'Story 3.9: Refresh tasks and comments'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '2f207f2'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot see the last refresh timestamp for tasks and comments, nor distinguish stale data with a « Réessayer » action when a refresh fails.

**Approach:** Track `lastUpdatedAt` and `refreshError` in `apps/mobile/app/projects.tsx`, keep existing data and unsaved inputs visible during refresh and on error, display « Dernière mise à jour : HH:MM:SS », and show a « Réessayer » button on network/refresh failure.

</frozen-after-approval>

## Implementation Notes

- Updated `apps/mobile/app/projects.tsx` to preserve visible lists and unsaved inputs during refresh, display `lastUpdatedAt`, and show a stale-data notice with « Réessayer » on refresh failure.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
