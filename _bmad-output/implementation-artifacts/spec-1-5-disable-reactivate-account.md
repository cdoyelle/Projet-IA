---
title: 'Story 1.5: Disable or reactivate an account'
type: 'feature'
created: '2026-11-13'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'eb12c6c'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Administrators can create demo accounts, but have no UI or server endpoint to list accounts and disable or reactivate them.

**Approach:** Extend the `admin-accounts` Edge Function with `GET` (list accounts) and `PATCH` (toggle `active` and `disabled_at` on `public.profiles`) for verified active administrators, and display the account list with « Actif » / « Désactivé » badges and « Désactiver » / « Réactiver » actions on `apps/mobile/app/accounts.tsx`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| List accounts | Active administrator opens `/accounts` | Displays all accounts with name, role, and « Actif » or « Désactivé » status | Plain French error message with retry option |
| Disable account | Admin taps « Désactiver » on another account | Sets `active = false`, `disabled_at = now()`; badge updates to « Désactivé »; user is blocked by RLS | Plain French error message |
| Reactivate account | Admin taps « Réactiver » on a disabled account | Sets `active = true`, `disabled_at = null`; badge updates to « Actif »; user can sign in again | Plain French error message |

</frozen-after-approval>

## Implementation Notes

- Extended `apps/mobile/src/lib/contracts.ts` with `AdminAccountSummary`, `ListDemoAccountsSuccess`, `ToggleAccountStatusRequest`, and `ToggleAccountStatusSuccess`.
- Extended `supabase/functions/admin-accounts/index.ts` to handle `GET` (list profiles) and `PATCH` (update `active` and `disabled_at`, preventing self-deactivation).
- Added the « Liste des comptes » section to `apps/mobile/app/accounts.tsx` with « Actif » / « Désactivé » status badges and « Désactiver » / « Réactiver » actions.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
