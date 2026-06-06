# Issue: First-Load Minimum Configuration Tour

**Issue ID:** first-load-min-config-tour-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-22
**Last Updated:** 2026-05-22 00:33

## Overview
Limit the first-load guided tour to the minimum steps required for a new merchant's bundle to appear on the storefront, and align the PPB Step Setup/category accordion UX with the EB-style configure flow.

## Progress Log

### 2026-05-22 00:00 - Starting feature pipeline and scoped implementation
- Created requirements and architecture docs for first-load minimum configuration tour.
- Confirmed current code already has shop-level guided tour storage and a `first_load` loader flag, but create redirect does not append the query parameter.
- Files planned: create handler, unified create configure route, tour steps, shared drag handlers, PPB configure route, route CSS, and create wizard tests.
- Next: patch the redirect/readiness/UI gaps and run targeted tests plus lint.

### 2026-05-22 00:25 - Completed implementation and validation
- Added `first_load=true` to successful create wizard redirects.
- Updated create wizard readiness to count category accordion products and collections.
- Kept first-load tour copy focused on minimum activation rather than discount/design readiness.
- Added category drag image feedback through the shared drag handler used by FPB and PPB configure pages.
- Moved PPB Step Flow and Step Setup into one card with an internal horizontal divider and EB-style header actions.
- Added test spec: `test-spec/create-bundle-wizard.spec.md`.
- Verification: `npx jest tests/unit/routes/create-bundle-wizard.test.ts --runInBand --coverage=false` passed.
- Verification: `npx eslint --max-warnings 9999 ...modified code files...` completed with zero errors and existing warnings only.
- Browser verification: reloaded authenticated PPB configure page in Shopify Admin; page loaded without runtime failure, but the selected live bundle had no configured step content, so Step Setup body/card visual proof remains partial without mutating merchant data.

### 2026-05-22 00:23 - Reopened for EB parity corrections
- User clarified `first_load=true` must apply only to merchants installing/using the app for the first time, not every create redirect.
- User clarified category default names must move with the dragged accordion when custom names are absent.
- User requested Step Setup toggle beside the title, actions right-aligned, and tighter heading/description spacing.
- User requested complete EB parity exploration for Bundle Visibility → Bundle Widget and Bundle Embed before implementation.
- Next: inspect EB Admin-to-storefront flow first, then patch and revalidate.

### 2026-05-22 00:33 - Completed FPB and PPB parity pass
- Replaced unconditional create redirect query behavior with a persisted `Shop.firstCreateTourEligible` install flag consumed on first successful create.
- Added Prisma migration and regenerated Prisma Client.
- Updated first-load tests to cover eligible and ineligible shops.
- Preserved default category names during drag/drop reorder so default labels move with the accordion.
- Aligned Step Setup headers in FPB and PPB: toggle sits beside the title, action buttons are right-aligned, and description spacing is tighter.
- Added category body parity improvements across FPB and PPB, including multi-language controls and FPB category title field.
- Explored EB Bundle Visibility → Bundle Widget and storefront paths before implementation:
  - EB Bundle Visibility shows App Embed Status, Publishing Best Practices, Your Bundle Link, and Want more placement options.
  - EB guide buttons open the single Bundle Visibility Quick Guides help article for hero, navigation, announcement, and featured product placement.
  - EB Widget setup is an in-page panel with enable checkbox, preview, block/button choice, disabled Multi Language, Button Text, display targeting, browsed-product checkbox, and custom embed button.
  - EB full-page storefront link renders the builder page; EB PPB product renders the bundle product; EB component-product upsell did not render because the observed EB widget toggle was off.
- Aligned FPB and PPB Bundle Widget setup panels to the observed EB flow while keeping FPB's existing Bundle Link/page slug and media-asset nuances in Bundle Visibility.
- Verification: `npx jest tests/unit/routes/create-bundle-wizard.test.ts --runInBand --coverage=false` passed.
- Verification: `npx prisma generate` passed.
- Verification: `npx eslint --max-warnings 9999 ...modified TS/TSX files...` completed with zero errors and existing warnings only. Direct CSS-module ESLint is unsupported by the repo parser config and failed before linting CSS content.
- Browser verification: authenticated Shopify Admin PPB and FPB configure pages loaded; Bundle Visibility and Bundle Widget panels render for both bundle types. The live test bundles had no step content, so category body/drag proof remains limited without mutating merchant data.

## Related Documentation
- `docs/first-load-min-config-tour/01-requirements.md`
- `docs/first-load-min-config-tour/02-architecture.md`
- `docs/guided-tour-reference.md`
- `docs/guided-tour-comparison.md`
- `docs/eb-step-setup-readiness-parity/02-architecture.md`

## Phases Checklist
- [x] Phase 1: Requirements
- [x] Phase 2: Architecture
- [x] Phase 3: Implementation
- [x] Phase 4: Validation
