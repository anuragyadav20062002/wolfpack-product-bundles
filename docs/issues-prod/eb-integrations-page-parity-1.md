# Issue: EB Integrations Page Parity
**Issue ID:** eb-integrations-page-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 09:09

## Overview
Replicate the EB Integrations page UI in WPB, audit every EB quick setup link for integration supportability, and point WPB setup actions to `https://wolfpackapps.com` until WPB-hosted guides are written.

## Progress Log
### 2026-06-04 08:55 - Audit started
- Created issue log before implementation changes.
- Active task changed from Settings -> Controls to EB Integrations page parity.
- The installed `feature-pipeline` skill file is not available in the advertised skill roots, so the feature pipeline will be followed manually: evidence audit, requirements, architecture/file plan, implementation, and Chrome e2e proof.
- Next steps: inspect current WPB integrations route, audit live EB Integrations UI and all quick setup links in Chrome, document integration supportability and setup-link behavior, then implement the UI parity slice.

### 2026-06-04 09:06 - Live EB audit and implementation
- Audited EB `/integrations` in authenticated Shopify Admin Chrome.
- Read quick setup links for Stoq, subscriptions, Judge.me, page builders, and checkout callbacks; Zapiet behaved as a chat setup action and did not open an article.
- Documented UI contract and supportability notes in `internal docs/EB Integrations Reference.md`.
- Added TDD spec `test-spec/integrations-page-parity.spec.md`, updated route/data tests, confirmed expected red state, then implemented setup URLs and EB-style card layout.
- Gokwik and Shopflo logo downloads were blocked by the execution environment, so those two cards use text-logo fallback until assets are added.

### 2026-06-04 09:09 - Verification
- Targeted Jest passed for integrations route/data contract tests.
- ESLint passed on modified route, shared data, and test files.
- Chrome verification passed through Shopify Admin at `/app/integrations`: all integration cards render, inline setup/request panels are removed, and `View Setup` opens `https://wolfpackapps.com/`.
- Rebuilt graphify code graph after code changes.
- Temporary Chrome tab cleanup was rejected by the environment due the current approval/usage limit, so audit tabs were left open.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `internal docs/EB Integrations Reference.md`

## Phases Checklist
- [x] Phase 1: Current WPB integrations route audit
- [x] Phase 2: Live EB Integrations UI and quick setup audit
- [x] Phase 3: Supportability and UI contract documentation
- [x] Phase 4: Implementation and tests
- [x] Phase 5: Chrome e2e verification
