# Community-Driven PC BenchHub Plan

## Finalized Systems

### S0 Hardware DB
- Canonical hardware model + resolve endpoint maintained.
- Report submit pipeline now resolves hardware specs into canonical component IDs.
- Component stats and rating snapshots are refreshed after writes.

### S1 Ratings
- Rating engine now reads aggregated score from `benchmarks.scores` JSON.
- Removed dependency on nonexistent benchmark score column.
- Admin recalc route now uses project auth middleware + admin identity check.

### S2 Reports
- Submit contract supports community fields and canonical component linkage.
- Submit side-effects trigger ratings, feed activity, reputation, and badges.

### S3 Voting
- Added idempotent `votes` migration and indexes.
- Voting now treats `reportId`/`userId` as string IDs end-to-end.
- Vote pipeline updates helpfulness + author reputation/badges + feed.

### S4 Profiles/Reputation
- Reputation and badge recalculation wired into submit/vote writes.
- Profile upvote stats query aligned with numeric vote values.

### S5 Hardware Browse
- Hardware list API now supports page/sort/search/category and returns pagination metadata.
- Benchmarks list supports `componentId` filtering for hardware detail report lists.

### S6 Feed
- Activity tracker connected to key events: register, submit, vote, hardware add, badge earn, collection create.

### S7 Collections/Tags
- Collection list/detail/editor flows available in frontend.
- App routes include `/collections`, `/collections/:id`, `/collections/new`, `/collections/:id/edit`.

## Independent Follow-up Tasks

1. Add automated API tests for submit/vote side-effects and schema migration assertions.
2. Add collection item drag-and-drop reorder UI wired to reorder endpoint.
3. Improve hardware resolver confidence feedback and duplicate-resolution UX.
4. Add admin moderation view for feed/event diagnostics.
5. Expand i18n coverage for remaining hardcoded community widgets.
6. Add benchmark compare replacement flow based on hardware IDs rather than legacy benchmark compare endpoints.
7. Add periodic rating snapshot jobs for low-write components.

## Acceptance Checklist

- Backend starts on fresh DB and existing DB without migration errors.
- Frontend routes function: `/hardware`, `/community`, `/collections`, `/collections/:id`, `/u/:username`, `/badges`.
- Legacy route redirects function: `/dashboard`, `/leaderboard`, `/compare`.
- Submit flow links hardware via `/api/hardware/resolve` and updates hardware/rating/feed/reputation/badges.
- Voting updates helpfulness and author community state.
- Collections can be created, viewed, edited, voted, and item-managed.
- Language switch (`en`/`pt`) includes keys for new community/hardware/collections flow.
