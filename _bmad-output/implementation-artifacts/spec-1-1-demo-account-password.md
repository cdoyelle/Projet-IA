---
title: 'Story 1.1: Create a demo account and receive its password'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'da779d2aa2162fb8ac33c486cf501d5951e2b95c'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Demo administrators need to create accounts without email delivery, but the project has no account administration feature.

**Approach:** Add the Story 1.1 account creation flow to the approved Expo mobile app and a protected Supabase server operation. Generate the password securely, return it only for the administrator to share outside the app, and never persist it in application tables.

**Decision:** Include only the sign-in and session support an administrator needs to reach and use Story 1.1. This deliberately overlaps Story 1.2; its broader session lifecycle, sign-out, recovery, and other account features remain out of scope.

## Boundaries & Constraints

**Always:** Expo SDK 58, React Native 0.88, TypeScript, Expo Router, Supabase Auth and PostgreSQL. Require first name, last name, and unique email. Verify administrator identity and active session on the server; keep privileged credentials server-side. Use French labels, field errors, loading/success/failure states, preserve fields after failure, and respect system theme and accessibility.

**Never:** Send an email, store or log a plaintext password, expose privileged keys in the app, report a duplicate or failed creation as success, implement account disable/reactivation or any other neighboring story, or extend the Next.js scaffold as the mobile client.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create account | Valid names and unused email; authenticated active administrator | Auth account and profile are created without email; generated password is shown once for external sharing | None |
| Duplicate email | Valid names and email already in use | No success state; keep entered values and explain the next action in French | Do not expose provider details |
| Invalid form | Missing name or malformed email | Do not submit; identify the field and correction | Keep other entered values |
| Server/network failure | Valid form; operation fails | No success or password is shown; fields remain available for retry | Plain French retry guidance, no technical details |

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/epics.md` — Story 1.1 acceptance criteria; include generated password, no email, and safe duplicate/error messages. Implement only the minimum sign-in prerequisite chosen by the user; do not implement other neighboring stories.
- `_bmad-output/planning-artifacts/prds/prd-GDU_TaskFlow-2026-10-27/prd.md` — FR-033, FR-036–037 and FR-041; required profile fields and form/error behavior.
- `_bmad-output/planning-artifacts/ux-designs/ux-GDU_TaskFlow-2026-10-29/{DESIGN.md,EXPERIENCE.md}` — secondary account administration area, French UI, colors, system theme, touch targets, labels and accessible errors.
- `_bmad-output/planning-artifacts/architecture/architecture-GDU_TaskFlow-2026-11-02/{architecture.md,ARCHITECTURE-SPINE.md}` — AD-1, AD-2, AD-5, AD-12; Expo target, server-side privilege checks, Auth identity and profile authority.
- `src/app/page.tsx`, `src/lib/supabase/`, `package.json` — current Next.js starter only. Do not reuse web cookie clients as mobile session storage or extend this app as the product client.
- `_bmad-output/implementation-artifacts/epic-1-context.md` — distilled Epic 1 constraints.

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/` — create the Expo 58 / React Native 0.88 TypeScript app, the minimal administrator sign-in/session prerequisite, and the Story 1.1 account administration screen.
- [x] `supabase/migrations/` — add only the profile/account schema needed for account creation and authoritative admin checks.
- [x] `supabase/functions/admin-accounts/` — validate caller and role, create the Auth identity without email, generate a strong password, and return it only on success.
- [x] `apps/mobile/` — connect the form to the protected operation; translate stable errors and display the returned password for external handoff without storing it.

**Acceptance Criteria:**
- Given a provisioned active administrator, when they sign in, then they reach the protected account administration screen with the session needed for the account operation.
- Given an authenticated active administrator and valid unused account details, when they create the account, then Supabase Auth and its profile contain the new account, no email is sent, and the generated password is shown for sharing outside the app.
- Given a duplicate address or server failure, when creation is attempted, then the app does not show success or a password and gives a clear French next action without technical details.
- Given invalid fields, when creation is attempted, then submission is blocked and each field explains its correction while preserving the other values.
- Given a non-administrator or inactive caller, when the operation is invoked directly, then the server rejects it without creating an account.

## Implementation Notes

- Built the Expo SDK 58 / React Native 0.88 TypeScript client in `apps/mobile/` with Expo Router, `expo-secure-store` session persistence (including >1800-char chunking and safe fallback), and a versioned Edge Function contract (`apps/mobile/src/lib/contracts.ts`).
- Implemented the minimal administrator sign-in prerequisite (`apps/mobile/app/sign-in.tsx`) and the protected demo account creation screen (`apps/mobile/app/accounts.tsx`) with French copy, field-level validation, focus movement to the first invalid field, preserved inputs on error, one-time password display/share/hide actions, system light/dark theme tokens (`DESIGN.md`), and phone/tablet gutters.
- Added `supabase/migrations/202611090001_story_1_1_demo_accounts.sql` creating `public.profiles`, `app_private.has_active_auth_session()` for RLS session/active-account enforcement, and `public.handle_new_auth_user()` trigger.
- Added `supabase/functions/admin-accounts/index.ts` verifying caller identity, active session, and `admin` role server-side before generating a 32-character password, creating a confirmed Supabase Auth user without sending email, ensuring the profile row exists (rolling back on failure), and returning the generated password once.

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| `edge-case-hunter`: `SecureStore.setItemAsync` throws during `setItem` without `try/catch` | `medium` | `patch` | Wrapped `setItem` in `try/catch` falling back to `memoryFallback` in `apps/mobile/src/lib/supabase.ts`. |
| `edge-case-hunter`: `SecureStore` throws inside `removeItem` (`try/finally` without `catch`) | `medium` | `patch` | Added `catch` block in `removeItem` so sign-out never rejects on keystore errors. |
| `edge-case-hunter`: `supabase.auth.signOut` rejection in `accounts.tsx` prevents navigation | `low` | `patch` | Wrapped `signOut` in `try/catch/finally` in `apps/mobile/app/accounts.tsx` so redirect to `/sign-in` always runs. |
| `edge-case-hunter`: Unmount or sign-out while `createAccount` is in flight populates password state | `medium` | `patch` | Guarded post-await state updates in `createAccount` with `mountedRef.current` in `apps/mobile/app/accounts.tsx`. |
| `blind-hunter`: Transient `profileError` signs user out and misreports access denial | `medium` | `patch` | Distinguished `profileError` from unauthorized/inactive profile in `sign-in.tsx`, `accounts.tsx`, and `index.tsx`. |
| `blind-hunter`: Displayed one-time password cleared when form is re-submitted with invalid fields | `medium` | `patch` | Moved `setPassword(null)` after client-side validation check in `apps/mobile/app/accounts.tsx`. |
| `blind-hunter`: Missing share/copy action for 32-character generated password | `low` | `patch` | Added `Partager le mot de passe` action using React Native `Share.share` in `apps/mobile/app/accounts.tsx`. |
| `blind-hunter`: Missing focus movement to first invalid field on validation error | `medium` | `patch` | Added `TextInput` refs and focused the first invalid field in `sign-in.tsx` and `accounts.tsx`. |
| `blind-hunter`: Missing shared versioned TypeScript contract for Edge Function boundary | `low` | `patch` | Added `apps/mobile/src/lib/contracts.ts` and aligned error codes across client and Edge Function. |
| `blind-hunter`: Missing `apps/mobile/package-lock.json` | `false` | reject | `apps/mobile/package-lock.json` exists on disk and was only excluded from the temporary review diff file. |
| `blind-hunter`: Unhandled exceptions in `secureStorage.setItem` | `medium` | `patch` | Grouped with `edge-case-hunter` `setItem`/`removeItem` fix in `apps/mobile/src/lib/supabase.ts`. |
| `blind-hunter`: Redundant double query to `public.profiles` and unreachable `403` branch for disabled caller | `low` | `patch` | Simplified caller verification in `supabase/functions/admin-accounts/index.ts` to distinguish `401 AUTH_REQUIRED` from `403 FORBIDDEN`. |
| `blind-hunter`: Database check constraints and trigger allow untrimmed whitespace in names | `low` | `patch` | Enforced `first_name = btrim(first_name)` and `last_name = btrim(last_name)` and trimmed 100-char substrings in `202611090001_story_1_1_demo_accounts.sql`. |
| `blind-hunter`: Unused `focus`/`primaryPressed` tokens and missing 28px tablet gutter | `low` | `patch` | Applied `theme.focus` on focused inputs, `theme.primaryPressed` on primary button press, and responsive 16px/28px gutters in `sign-in.tsx` and `accounts.tsx`. |
| `blind-hunter`: Empty `Implementation Notes` section in spec | `false` | reject | Spec-edit finding rejected per review rules; `Implementation Notes` populated during workflow completion. |
| `verification-gap`: Unverified `admin-accounts` error-code contract, admin guard, and profile rollback | `medium` | `defer` | Pre-verified gap; Story 1.1 specifies manual verification only with no automated test runner in the repository yet. |
| `verification-gap`: Unverified `app_private.has_active_auth_session()` RLS boundary and trigger | `medium` | `defer` | Pre-verified gap; Story 1.1 specifies manual verification rather than a database test harness. |
| `verification-gap`: Unverified multi-chunk `secureStorage` session persistence | `medium` | `defer` | Pre-verified gap; Story 1.1 specifies manual verification and broader session lifecycle belongs to Story 1.2. |


## Design Notes

The mobile client must never generate or retain the account password: the server creates the Auth user and sends the secret to the client only once after successful creation. The existing Next.js project remains a separate scaffold. The repo has no Android emulator tools on PATH; Expo Go on a physical device is the likely preview route.

## Verification

**Manual checks (no test suite requested):**
- Sign in as the provisioned administrator, then inspect the account screen in the running Expo app.
- Review successful creation, duplicate email, field validation, retry behavior, password visibility, French copy, light/dark theme and accessible field/action labels.
