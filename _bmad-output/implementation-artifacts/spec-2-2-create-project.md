---
title: 'Story 2.2: Create a project'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '65d19f1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Owners and administrators can view projects on `/projects`, but cannot create a new project from the app.

**Approach:** Add an RLS `insert` policy on `public.projects` for active `admin` and `owner` users, and add the « Nouveau projet » creation form to `apps/mobile/app/projects.tsx` with today's date pre-filled as `start_date`, field-level validation, French confirmation, and automatic selection of the created project.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160002_story_2_2_create_project.sql` granting `insert` on `public.projects` to `authenticated` with `projects_insert_owner_or_admin` RLS policy.
- Updated `apps/mobile/app/projects.tsx` with « Nouveau projet » button for `admin`/`owner`, form pre-filled with today's date (`YYYY-MM-DD`), field validation preserving other inputs, and automatic selection of the created active project.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
