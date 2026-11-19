---
title: 'Story 3.7: Comment on a project'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'fc9418d'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Project members, owners, and administrators have no way to post, edit, or delete comments on visible projects (including closed or cancelled projects).

**Approach:** Add `public.project_comments` with RLS allowing reads/inserts on any accessible project and edits/deletes by the author, project owner, or administrator, plus `list_project_comments(uuid)` RPC and the « Commentaires du projet » section in `apps/mobile/app/projects.tsx`.

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611190001_story_3_7_project_comments.sql` with `public.project_comments`, RLS policies, and `list_project_comments(uuid)`.
- Updated `apps/mobile/app/projects.tsx` with « Commentaires du projet » (add, edit, delete according to role/authorship, works on closed/cancelled projects without reactivating them).

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
