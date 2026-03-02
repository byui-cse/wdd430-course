# Standalone Course Tool Migration Plan

## Goal

Create a standalone shared tool app for course workflows (teams, projects, peer reviews, future self review), while keeping course content sites separate.

- Current course sites: `wdd430.netlify.app`, `wdd360.netlify.app`
- New tool site (example): `course-tools.netlify.app`
- Route-scoped context: `/wdd430/...`, `/wdd360/...`
- Course-specific features: bakeoffs enabled for `wdd430` only

---

## Scope Summary

### Shared Modules (all courses)

- Teams
- Projects
- Peer Reviews
- Review tracking/follow-up
- Semester selection

### Course-specific Modules

- Bakeoffs: `wdd430` only

### Planned Next Module

- Self Review (shared module)

---

## Phase 0 — Project Setup (1 day)

### Tasks

- [ ] Create new standalone repo/app (Astro + Svelte, same stack as current app).
- [ ] Add environment setup for Supabase URL/key.
- [ ] Add base routes:
  - [ ] `/:courseCode/`
  - [ ] `/:courseCode/projects`
  - [ ] `/:courseCode/teams`
  - [ ] `/:courseCode/reviews`
  - [ ] `/:courseCode/bakeoffs` (feature-gated)
- [ ] Add `course config` file (`src/lib/config/courses.ts`) with enabled modules by course.

### Acceptance Criteria

- App boots for known courses (`wdd430`, `wdd360`) and rejects unknown course codes.
- Course code visible in app header/context.

---

## Phase 1 — Data Model & SQL Migration (1 day)

### Decisions

Use separate fields (not a single string) for maintainability:

- `course_code` (e.g. `wdd430`)
- `section_code` (e.g. `01`) — optional initially, but add now for forward compatibility.

### SQL Changes

Apply to these tables:

- `projects`
- `peer_review_teams`
- `peer_reviews`
- `project_peer_reviews`
- `scorecards` (if bakeoffs are course-scoped)

### Migration Checklist

- [ ] Add `course_code text` and `section_code text` columns (nullable initially).
- [ ] Backfill existing records with `course_code='wdd430'` (and optional default section).
- [ ] Set `course_code` to `NOT NULL` after backfill.
- [ ] Add indexes on `(course_code, section_code)` and common filter columns.
- [ ] Ensure review tables are join-consistent with parent records by course.

### Acceptance Criteria

- Existing records are scoped to `wdd430`.
- Queries filtered by course return only course-specific rows.

---

## Phase 2 — Course-aware Authorization & RLS (1–2 days)

### Header Contract

All requests should include:

- `x-bakeoff-passcode`: entered by user
- `x-course-code`: route-derived

### Security Design

Private secret storage should be keyed per course:

- `private.app_secrets` rows like:
  - `course_passcode_wdd430`
  - `course_passcode_wdd360`

### DB Functions

Create course-aware helpers:

- `public.get_request_course_code()`
- `public.authorize_course_tool()`
- `public.verify_passcode_for_course(input_code text, input_course text)`

### RLS Checklist

- [ ] Update policies for all tool tables to enforce `course_code = header course`.
- [ ] Ensure `WITH CHECK` enforces course on inserts/updates.
- [ ] Remove any broad allow-all policies once course-aware policies verified.

### Acceptance Criteria

- Cross-course data access is blocked even with valid passcode from another course.
- Invalid course/passcode combinations fail cleanly.

---

## Phase 3 — App Context + Supabase Client Refactor (1 day)

### Supabase Client Changes

Refactor client initialization to include both passcode and course headers.

Suggested API in `src/lib/supabase.ts`:

- `initializeSupabase({ passcode, courseCode })`
- `setCourseContext(courseCode)`
- `setPasscode(passcode)`
- `clearAuthContext()`

### Local Storage Keys

Store auth per course:

- `tool_passcode_wdd430`
- `tool_passcode_wdd360`

### Acceptance Criteria

- Switching courses does not leak passcodes/headers across courses.
- Refresh keeps user authenticated for the current course only.

---

## Phase 4 — Module Migration & Feature Gates (1–2 days)

### Folder Structure

- `src/modules/core`
- `src/modules/projects`
- `src/modules/teams`
- `src/modules/reviews`
- `src/modules/bakeoffs`

### Migration Checklist

- [ ] Move current team/project/review UI into shared modules.
- [ ] Move bakeoff components into `bakeoffs` module.
- [ ] Add feature gate utility:
  - `isFeatureEnabled(courseCode, feature)`
- [ ] Hide/disable bakeoff routes and nav for courses that do not support bakeoffs.

### Acceptance Criteria

- `wdd430` sees bakeoff features.
- `wdd360` does not see bakeoff features.
- Shared modules work for both courses.

---

## Phase 5 — Course Site Integration (0.5 day)

### Content Site Changes

On each course site, add links to tool with course-scoped path:

- `wdd430.netlify.app` links to `course-tools.netlify.app/wdd430/...`
- `wdd360.netlify.app` links to `course-tools.netlify.app/wdd360/...`

### UX Notes

- Do not pass passcode in URL.
- Optional: include `returnTo` query for “Back to course” navigation.

### Acceptance Criteria

- Deep links open correctly with course context.
- Users can navigate back to course content site.

---

## Phase 6 — Verification, Rollout, and Cleanup (1 day)

### Test Matrix

- [ ] `wdd430` passcode + `wdd430` route = success
- [ ] `wdd360` passcode + `wdd360` route = success
- [ ] `wdd430` passcode + `wdd360` route = denied
- [ ] Bakeoff page visible only on `wdd430`
- [ ] Semester filtering works inside each course only
- [ ] Review follow-up toggles and counts remain accurate

### Rollout Strategy

1. Deploy standalone app with `wdd430` only enabled.
2. Validate with instructors/TAs.
3. Enable `wdd360` after passcode + RLS validation.
4. Replace old dynamic pages in course repos with links/redirects.

---

## Initial Route Map

- `/:courseCode/` → dashboard
- `/:courseCode/projects`
- `/:courseCode/projects/new`
- `/:courseCode/teams`
- `/:courseCode/teams/new`
- `/:courseCode/reviews`
- `/:courseCode/reviews/project/:projectId`
- `/:courseCode/reviews/project/:projectId/history`
- `/:courseCode/bakeoffs` (feature-gated)

---

## Self Review Prep (Post-Migration)

Design now to avoid rework:

- New module: `modules/self-review`
- Table suggestion: `self_reviews`
  - `course_code`, `section_code`, `team_id`, `project_id`, `student_id_or_name`, rubric fields, `created_at`
- Reuse existing:
  - semester state
  - passcode gate
  - course-aware RLS patterns

---

## Risks and Mitigations

- **Risk:** RLS misconfiguration leaks cross-course data
  - **Mitigation:** test matrix + temporary shadow logging + staged rollout
- **Risk:** Course passcode confusion
  - **Mitigation:** per-course login context and clear course label in UI
- **Risk:** Link drift between course sites and tool
  - **Mitigation:** central link constants and smoke tests

---

## Recommended Ticket Breakdown

1. Standalone app scaffold + course route parsing
2. DB migration for `course_code/section_code`
3. Course-aware passcode verification function updates
4. RLS policy updates for all workflow tables
5. Supabase client header/context refactor
6. Shared module migration (teams/projects/reviews)
7. Bakeoff feature gate + route guard
8. Course site link integration
9. Rollout validation and cutover
10. Self review module design ticket (follow-up)
