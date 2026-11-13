---
title: 'Story 1.3: View and edit my profile'
type: 'feature'
created: '2026-11-13'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '9507a63'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Signed-in users can see their name on `/home`, but they have no profile screen to view and update their first name and last name, and `public.profiles` has no RLS update policy or column-level update grant for `authenticated`.

**Approach:** Add a column-scoped `UPDATE (first_name, last_name)` grant and `profiles_update_self` RLS policy on `public.profiles`, create the protected `/profile` screen in `apps/mobile/app/profile.tsx`, and add a secondary « Mon profil » link on `/home` (`UX-DR-016`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open profile | Authenticated active user opens `/profile` | Displays current `first_name`, `last_name`, email, and role | Redirects to `/sign-in?reason=expired` if session/profile is inactive |
| Save valid names | Non-empty trimmed `firstName` and `lastName` (<= 100 chars) | Updates `public.profiles`, shows French confirmation, and updated name appears on `/profile` and `/home` | Plain French retry message on network/server error |
| Empty required field | Blank `firstName` or `lastName` | Blocks submission, shows error under the empty field, focuses first invalid field, preserves other entered values | None |

</frozen-after-approval>

## Implementation Notes

- Added `supabase/migrations/202611130001_story_1_3_profile_update.sql` granting `update (first_name, last_name)` on `public.profiles` to `authenticated` and creating the `profiles_update_self` RLS policy guarded by `app_private.has_active_auth_session()`.
- Created `apps/mobile/app/profile.tsx` with active session/profile verification, French form validation, focus movement to the first invalid field, preserved inputs on error, and « Accueil » / « Se déconnecter » header actions.
- Added « Mon profil » secondary navigation button on `apps/mobile/app/home.tsx`.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
