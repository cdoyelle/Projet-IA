---
title: 'Story 1.4: Recover access with administrator help'
type: 'feature'
created: '2026-11-13'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '0ddf2a2'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users who cannot sign in have no recovery guidance on the sign-in screen, and the MVP demo does not send password-reset emails.

**Approach:** Add an accessible sign-in help toggle (« Mot de passe oublié ? ») on `/sign-in` that displays clear French instructions telling the user to contact their administrator for a manual password reset without promising any email delivery.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open sign-in help | User taps « Mot de passe oublié ? » on `/sign-in` | Displays a clear French card instructing the user to contact their administrator and stating that no email is sent | None |
| Close sign-in help | User taps « Masquer l’aide » | Hides the help card without clearing entered email | None |

</frozen-after-approval>

## Implementation Notes

- Added a « Mot de passe oublié ? » toggle button and accessible French help card on `apps/mobile/app/sign-in.tsx` explaining that no reset email is sent and advising the user to contact their administrator.

## Verification

**Commands:**
- `npm.cmd --prefix "d:/Projets_IA/GDU_TaskFlow/apps/mobile" run typecheck` -- expected: exits 0 with no TypeScript errors.
