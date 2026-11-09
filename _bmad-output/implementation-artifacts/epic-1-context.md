# Epic 1 Context: Access TaskFlow and manage accounts

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Provide reliable access for the demonstration team: accounts are prepared by an administrator, people can sign in and retain a valid session, maintain their profile, recover access through the administrator, and be disabled without losing their project and task history. For the demo MVP, credentials are handed over outside the app and no invitation or reset email is sent.

## Stories

- Story 1.1: Create a demo account and receive its password
- Story 1.2: Sign in and keep a session
- Story 1.3: View and edit a profile
- Story 1.4: Recover access with administrator help
- Story 1.5: Disable or reactivate an account

## Requirements & Constraints

- The first administrator account is provisioned directly in Supabase Auth before app use. Demo accounts use generated passwords; an administrator shares them through an external channel. Never store plaintext passwords in application tables or send email for this demo flow.
- Email addresses are unique. First and last names are required profile data. Account creation errors, including an existing address, must not be reported as success and should give a clear next action without technical details.
- Authentication, account status, and access to protected screens must be enforced against the authoritative account state. Disabled accounts cannot access protected data; reactivation preserves existing project and task relationships.
- The interface is in French, follows system light/dark appearance, uses clear field labels and inline validation, preserves entered values after errors, and provides accessible names and touch targets. Do not promise an email when access recovery requires the administrator.

## Technical Decisions

- The approved client target is Expo SDK 58, React Native 0.88, TypeScript, and Expo Router; the current Next.js scaffold is not the mobile client.
- Supabase Auth is authoritative for identities and passwords. PostgreSQL profiles hold required first and last names plus account state; never put passwords in these tables.
- Keep Supabase service-role credentials on the server in Edge Function secrets. Any privileged account operation must verify the caller's identity, active state, session, and administrator role server-side. RLS remains the data authorization boundary.
- Persist mobile Auth sessions in Expo SecureStore and clear local session/data on sign-out or a protected-access rejection. Do not trust client-provided role or account state.

## UX & Interaction Patterns

- Account and profile administration lives in a secondary area; account recovery directs the person to contact the administrator.
- Use concise French messages, visible labels, field-level errors, and a clear success or retry action. Retain entered values after a failed submission and prevent duplicate submissions.
- Respect system text sizing, VoiceOver/TalkBack reading order, light/dark contrast, and touch targets of at least 44 pt on iOS and 48 dp on Android.

## Cross-Story Dependencies

- The first administrator must exist in Supabase Auth before demo accounts can be provisioned. Account creation establishes the identity and profile used by later sign-in, profile, recovery, and account-status stories.
