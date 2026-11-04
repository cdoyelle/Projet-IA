# Adversarial architecture review

**Target:** `ARCHITECTURE-SPINE.md`  
**Lens:** Construct independently built units that obey every current AD but can still diverge.  
**Verdict:** The spine establishes strong authorization and task-state boundaries, but it does not yet close several seams required for consistent implementation across the full PRD and UX. The capability map also leaves two explicit deliverables unaccounted for.

## High findings

### H1 — Several explicit product deliverables have no architecture owner

The capability map ends at FR-039, while PRD FR-040 requires manual scenarios for main flows, all three roles, and Supabase/RLS policies, and FR-041 requires a concise vibe-coding log. Two teams can comply with all ADs yet put these artifacts in incompatible locations/formats or omit them. Add owners/locations for verification scenarios and the development log, or explicitly state that these are project-level deliverables outside the runtime architecture and point to their agreed home. Also add the missing profile, project membership, account administration and invitation/reset flows to the UX mapping.

### H2 — Shared contracts between mobile and server can diverge

AD-1 and AD-5 choose Expo and server-side privileged operations, but there is no canonical contract for Edge Function request/response bodies, error serialization, or the shared error codes listed in the conventions. For example, the assistant screen and Edge Function could independently choose different shapes for citations or represent `AI_UNAVAILABLE` differently while obeying the current rules. Define a shared API contract owner and canonical response/error envelope, including assistant answer, citations, and no-source result.

### H3 — Membership, assignment, profile state and role ownership need one data invariant

AD-2 and AD-3 mention current profile, owner, membership, active status and global administrator, but do not settle who owns authoritative user display/name/avatar data or the exact assignment reference semantics when a member is removed or deactivated. The PRD requires tasks to remain while showing “Membre à attribuer” / “Utilisateur désactivé”, and membership removal revokes assistant access immediately. Two implementations could null `assignee_id`, retain it, or copy display text, with different dashboard and reassignment behavior. Define canonical foreign-key/active-membership handling and the derived display state; specify that role/admin data is server-owned and profile fields are user-editable.

## Medium findings

### M1 — Project, comment and membership writes lack the task write boundary's specificity

AD-3 says it binds project lifecycle and dashboards but its rule routes only task mutations through a database function. AD-6 states retention/visibility, yet does not say how project close/reopen/cancel and membership add/remove are validated atomically. AD-2 RLS alone can permit multiple valid but inconsistent write paths. Specify the authoritative database boundary for project lifecycle and membership changes, plus comment permissions on closed/cancelled objects, or remove them from AD-3's binds.

### M2 — Assistant knowledge ingestion and citations are under-specified at the source boundary

AD-4 protects retrieval and composite project/source integrity, but independently built ingestion and answer modules could disagree about supported source kinds, chunk ordering, stable source identity, or what “link ouvrable” means. The PRD allows fictional preloaded descriptions, notes, tasks and documents, while UX promises source names, excerpts and links when available. Name the canonical source/chunk contract and ingestion owner; otherwise defer the unsupported source kinds and state that citations link only to in-app entities that have a route.

### M3 — Storage is shown as a dependency without a usage/security rule

The diagram includes Supabase Storage and AD-2 binds avatars/storage objects, but PRD says avatar storage is optional and document import is out of scope. Builders could either implement upload or leave Storage unused; if enabled, bucket naming, file constraints and owner-based access are unspecified. Either explicitly defer Storage for the MVP and remove it from required structure, or set the minimal avatar upload and access rule.

### M4 — Capability map does not trace every UX screen

The UX names login/password reset, dashboard, projects, project detail, my tasks, project assistant, project/task forms, members, and profile/account administration. The current map groups broad capabilities, with no explicit mapping for login/reset, profile/account screens, membership screen, comments, or forms. This makes coverage hard to verify and invites independently built screen/data boundaries. Add a screen-to-module row set (shared components may be grouped) and link each to its owning backend capability and ADs.

## Lower priority / deferred

- AD-9 binds demo hosting/builds but does not identify who owns demo data seeding and reset. Give the seed/reset script a canonical home before implementation, especially because PRD FR-038 depends on a known demo project and corpus.
- Error contract lists stable codes but does not define which boundary emits or translates them; address with H2.
- Capability map assigns demo hosting/builds to AD-8, although AD-8 concerns replaceable AI providers; the relevant rule is AD-9.

## Adversarial pairs tested

1. Mobile assistant UI and Edge Function each implement the same intent but select different request/citation/error shapes: allowed by current ADs (H2).
2. Project-membership screen and task-assignment mutation independently represent a removed/deactivated assignee differently: allowed by current ADs (H3).
3. Project lifecycle screen and database policy independently authorize close/reopen/cancel paths: task function requirement does not resolve this (M1).
4. Corpus loader and assistant renderer independently define source/chunk identity and links: retrieval scoping does not close ingestion/UX contract (M2).
5. QA/documentation contributors produce FR-040/041 deliverables with no canonical ownership/location: no AD or map row binds them (H1).

## Recommended disposition

Address H1–H3 before implementation; resolve M1–M4 while updating the spine. The source requirements are sufficiently detailed to make these concrete without asking the commanditaire to invent new behavior. Preserve unconfirmed implementation choices, such as avatar upload and source-file handling, as explicit assumptions or deferred decisions.
