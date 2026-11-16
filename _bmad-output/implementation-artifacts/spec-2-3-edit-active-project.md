---
title: 'Story 2.3: Edit an active project'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '4208a81'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Owners and administrators cannot edit an active project's name, description, or dates, and `public.projects` has no RLS `update` policy.

**Approach:** Add a column-scoped `UPDATE (name, description, start_date, due_date)` grant and `projects_update_active_owner_or_admin` RLS policy on `public.projects` (enforcing `status = 'active'` and admin/owner check), and add inline editing to the project detail view in `apps/mobile/app/projects.tsx` while keeping member and closed-project views strictly read-only.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160003_story_2_3_edit_active_project.sql` granting `update (name, description, start_date, due_date)` on `public.projects` to `authenticated` with `projects_update_active_owner_or_admin`.
- Updated `apps/mobile/app/projects.tsx` to display project details on both phone and tablet, show « Modifier le projet » only for active projects owned by the user or viewed by an admin, and keep member and closed-project views read-only.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
