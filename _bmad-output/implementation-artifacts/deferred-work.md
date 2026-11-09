- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-demo-account-password.md`
  summary: Add automated tests for `admin-accounts` Edge Function error-code contract, admin role guard, and profile rollback.
  evidence: Story 1.1 is scoped to manual verification with no test runner configured in the repository yet.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-demo-account-password.md`
  summary: Add database integration tests for `app_private.has_active_auth_session()` RLS policy and `public.handle_new_auth_user()` trigger.
  evidence: Story 1.1 specifies manual verification against Supabase rather than an automated SQL test harness.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-demo-account-password.md`
  summary: Add unit tests for multi-chunk `secureStorage` session persistence (`>1800` chars) in `apps/mobile/src/lib/supabase.ts`.
  evidence: Story 1.1 is scoped to manual verification and broader session lifecycle testing is part of Story 1.2.
