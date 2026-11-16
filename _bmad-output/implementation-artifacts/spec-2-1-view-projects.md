---
title: 'Story 2.1: View projects that concern me'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '4dd00b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Signed-in users have no projects screen or `public.projects` / `public.project_members` tables with role-based RLS.

**Approach:** Add `public.projects` and `public.project_members` with RLS enforcing admin/owner/member access, create the protected `/projects` screen in `apps/mobile/app/projects.tsx` with project cards (name, status, progress, useful date, task count), empty state, and tablet side-by-side detail layout, and link it from `/home`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160001_story_2_1_projects_list.sql` creating `public.projects`, `public.project_members`, `app_private.is_admin()`, and `app_private.can_access_project(uuid)` with RLS `select` policies.
- Created `apps/mobile/app/projects.tsx` with active session verification, project cards, « Aucun projet pour le moment » empty state, and responsive tablet split-pane detail view.
- Added « Projets » navigation button on `apps/mobile/app/home.tsx`.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
