---
title: 'Story 2.4: Add or remove a project member'
type: 'feature'
created: '2026-11-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '114d06a'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Project owners and administrators have no way in the app to add active accounts as project members or remove existing members.

**Approach:** Add RLS `insert`/`delete` policies on `public.project_members` (enforcing active target accounts and active project ownership/admin) plus `list_project_members` and `list_active_profiles_for_project` RPCs, and add the « Membres du projet » management section to `apps/mobile/app/projects.tsx` with active-account search and no invitation button.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611160004_story_2_4_project_members.sql` with `insert`/`delete` policies on `public.project_members` and `list_project_members` / `list_active_profiles_for_project` RPCs.
- Updated `apps/mobile/app/projects.tsx` to display project members, allow owners/admins on active projects to search and add active accounts or remove members, and show « Aucun compte actif trouvé. » without any invitation button for unknown/inactive accounts.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
