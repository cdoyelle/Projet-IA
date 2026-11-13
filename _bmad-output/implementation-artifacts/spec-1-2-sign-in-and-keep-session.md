---
title: 'Story 1.2: Sign in and keep a session'
type: 'feature'
created: '2026-11-13'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: 'b0a6c38067e23c2df163a6cefbe7cb944e9d1c41'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.1 restricted sign-in to administrators only and routed directly to the demo account creation screen. Regular active members cannot sign in to reach a protected home screen, expired or invalidated sessions do not display a clear French prompt when accessing protected screens, and administrators have no home screen separate from the secondary account administration screen.

**Approach:** Generalize the Expo mobile authentication and session flow (`apps/mobile/`) so any active member or administrator can sign in with email and password to reach the protected home screen (`/home`), restore their valid session from `expo-secure-store` on app reopen without re-entering their password, see a simple French message and sign-in form when credentials are wrong or a session is expired/inactive, and sign out cleanly via « Se déconnecter » so protected screens are no longer accessible.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Active member or admin sign-in | Valid email and password for an active account (`profile.active === true`) | Session persisted in SecureStore; navigates to protected `/home` screen showing user identity (and secondary admin link if `role === 'admin'`) | None |
| App reopen with valid session | Valid stored session in SecureStore and `profile.active === true` | App restores protected `/home` screen without prompting for password again | None |
| Wrong password or unknown email | Non-empty email and wrong password submitted on `/sign-in` | Stays on `/sign-in`; preserves entered email; clears password; displays clear French error message | No technical/provider stack details |
| Expired or invalidated session on protected screen | Stored session is expired, revoked, or profile is inactive when opening/resuming `/`, `/home`, or `/accounts` | Local session is cleared; redirects to `/sign-in?reason=expired` displaying a clear French message and the sign-in form | Do not crash if `signOut` or network fails |
| Explicit sign-out (« Se déconnecter ») | User taps « Se déconnecter » on `/home` or `/accounts` | Clears session from SecureStore; navigates to `/sign-in` without expired-session banner; protected screens are no longer accessible | Redirect to `/sign-in` even if network sign-out fails |

</frozen-after-approval>

## Implementation Notes

- Generalized `apps/mobile/app/sign-in.tsx` for all active roles (`member`, `owner`, `admin`), added the accessible `reason=expired` alert banner, cleared password on credential or inactive-account rejection while preserving the entered email, and routed active accounts to `/home`.
- Updated `apps/mobile/app/index.tsx` to route active stored sessions to `/home`, clear expired/inactive sessions and redirect to `/sign-in?reason=expired`, and route unauthenticated launches to `/sign-in`.
- Created `apps/mobile/app/home.tsx` with active session/profile verification on mount, auth state changes, and foreground `AppState` resume, displaying member identity, role badge, secondary admin navigation to `/accounts` (`UX-DR-016`), and explicit « Se déconnecter ».
- Updated `apps/mobile/app/accounts.tsx` with « Accueil » return navigation (`router.replace('/home')`), consistent « Se déconnecter » handling, foreground `AppState` re-verification, and non-admin active redirect to `/home` without signing out.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.

**Manual checks (if no CLI):**
- Sign in with an active account (member or admin) and verify `/home` appears.
- Close and reopen the app in Expo Go and verify `/home` is restored without re-entering the password.
- Enter a wrong password on `/sign-in` and verify the simple French message appears and email is preserved.
- Tap « Se déconnecter » and verify `/sign-in` appears and protected screens are no longer accessible.
