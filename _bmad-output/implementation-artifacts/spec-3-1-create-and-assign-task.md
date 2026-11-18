---
title: 'Story 3.1: Create and assign a task'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '86aee35'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Project owners and administrators have no tasks table or UI to create and assign tasks within an active project.

**Approach:** Add `public.tasks` with RLS enforcing active-project admin/owner creation, `'created'` initial status, and active project-member/owner assignee validation, plus a « Nouvelle tâche » form and tasks list in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611180001_story_3_1_create_task.sql` creating `public.tasks`, `app_private.is_valid_task_assignee`, `public.list_project_assignable_profiles`, and RLS `select`/`insert` policies.
- Updated `apps/mobile/app/projects.tsx` with the « Tâches » section and « Nouvelle tâche » form (mandatory title and `JJ/MM/AAAA` due date with calendar picker, optional description, priority `Basse`/`Normale`/`Haute`, tags, and assignable active project members/owner).

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
