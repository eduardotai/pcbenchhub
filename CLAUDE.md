# CLAUDE.md

## PC BenchHub Architecture Principles

1. Backend-first contracts
- Treat backend APIs as canonical and stabilize route contracts before frontend wiring.
- Keep endpoints namespaced (`/api/hardware`, `/api/ratings`, `/api/feed`, `/api/collections`, `/api/tags`, `/api/votes`).
- Prefer additive, backward-compatible changes over destructive rewrites.

2. Identifier consistency
- `benchmark/report` IDs are UUID strings end-to-end.
- `user_id` in domain links is string UUID.
- `hardware_components.id` remains integer and is used as numeric component reference.
- Never coerce report/user IDs to integers in routes or models.

3. Migration safety
- Migrations must be idempotent and rerunnable on existing databases.
- Schema updates should avoid destructive resets and preserve prior data.
- New indexes/constraints should be introduced only after data cleanup/backfill steps when required.

4. Domain write pipeline
- Report submission must trigger: hardware resolve/link -> component stat refresh -> rating recalculation -> feed activity -> reputation update -> badge granting.
- Vote changes must trigger: helpfulness recalculation -> author reputation update -> badge granting -> feed activity.
- Domain side-effects should be resilient: local failure in one side-effect must not corrupt the primary write.

5. Rating model behavior
- Component ratings are computed from benchmark `scores` JSON, not a non-existent scalar column.
- Aggregate score per report is derived from numeric score metrics and used consistently in rating snapshots.
- `community_rating` + `rating_confidence` are snapshot-driven outputs and stored on `hardware_components`.

6. Frontend navigation model
- Primary user journey: `Home -> Hardware -> Community -> Collections`.
- Legacy routes (`/dashboard`, `/leaderboard`, `/compare`) remain as redirects during migration.
- New pages should consume canonical API namespaces via `src/services/api.js`.

7. Community UX requirements
- Community content pages (feed, profile, collections, hardware detail) should display reputation, badges, helpfulness, and timeline data from canonical endpoints.
- Collection CRUD uses backend ownership checks; editor routes are protected.

8. Internationalization discipline
- New community/hardware/collections UI strings must be added in both `en.json` and `pt.json`.
- Avoid shipping UI labels only in code when they are user-visible workflow text.

9. Seed data expectations
- Seed should populate users, benchmark reports, hardware components (through resolution), tags, and badges.
- Seed runs should be repeat-safe and avoid duplicate logical records where practical.

10. Verification baseline
- Backend starts cleanly on fresh and existing DBs.
- Frontend build must complete without unresolved route/import errors.
- Critical paths to validate after changes: submit report, hardware detail/rating history, vote helpfulness + reputation update, collection create/detail/edit/vote.
