# Issue: Embedded Admin UI Internationalisation
**Issue ID:** admin-ui-i18n-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-03 19:14

## Overview

Make app-owned copy across the embedded Admin UI i18n-compliant. Persist one selected Admin language per shop for all staff accounts, update browser cache only after a successful save, retain English as the default, and expose the existing Polaris-compatible dashboard locales.

Storefront widgets, checkout UI extensions, theme-editor schema copy, and merchant-authored storefront translations are explicitly out of scope.

## Progress Log

### 2026-06-02 22:10 - Pipeline artifacts completed; starting TDD
- Confirmed scope with user: embedded Admin UI only; shop-wide preference shared by all staff accounts.
- Added `docs/admin-ui-i18n/01-requirements.md`.
- Added `docs/admin-ui-i18n/02-architecture.md`.
- Impact analysis: touches app shell locale resolution, dashboard flow, `Shop` schema, Admin catalogs, and Admin routes/components. Storefront widget god nodes are excluded. `AppStateService` is adjacent but does not need modification.
- Identified upstream constraint: installed `@shopify/polaris` package has no `hi.json`; raised the Hindi scope decision before continuing implementation.
- Next: create TDD spec and failing tests for locale support, catalog parity, DB persistence, and success-only browser cache updates.

### 2026-06-02 22:20 - Core locale persistence implemented
- Added nullable `Shop.adminLocale` plus SQL migration. `Session.locale` remains untouched because it is Shopify user/session metadata rather than a Wolfpack shop preference.
- Added `app/services/admin-locale.server.ts` with DB-authoritative load and validated upsert save operations.
- Updated app shell locale resolution to load the shop-wide DB preference and default to English.
- Changed dashboard locale selection to draft-only state with an explicit Save button. Browser cache, URL locale, and active `i18next` language update only after the save response confirms success.
- Initially added Hindi registration while evaluating the Polaris constraint; removed it immediately after user direction documented below.
- Repaired existing locale catalog key drift and translated global embedded Admin navigation.
- Updated `docs/app-nav-map/APP_NAVIGATION_MAP.md` with the dashboard language-save flow.
- Focused verification: `npx jest tests/unit/i18n/admin-ui-i18n.test.ts tests/unit/services/admin-locale.server.test.ts --runInBand --coverage=false` passed (15 tests).
- Prisma generation is blocked by duplicate local `.env` and `prisma/.env` definitions for `DATABASE_URL` and `DIRECT_URL`; both files were intentionally left untouched.
- Next: run TypeScript checks and continue app-owned Admin copy extraction by namespace.

### 2026-06-02 22:25 - Removed Hindi support per user direction
- User explicitly requested that Hindi not be implemented because Shopify Polaris does not provide Hindi internals.
- Removed Hindi from supported locales, dashboard selector, locale catalogs, tests, and architecture contract.
- Kept the shop-wide persisted Admin locale implementation and save-only browser cache contract unchanged.
- Supported Admin locales are now: `en`, `fr`, `de`, `es`, `ja`, `pt-BR`.
- Next: verify the narrowed locale contract, then continue Admin copy extraction for the six Polaris-compatible languages.

### 2026-06-02 22:29 - Starting shared Admin component extraction
- Audited shared Admin banners and configure modals before editing.
- Scoped this batch to reusable embedded Admin components only; storefront widgets remain untouched.
- Updating source-contract tests first so shared merchant-facing copy must resolve through translation keys.
- Next: add catalog keys across the six supported languages, replace shared component literals, and run focused tests.

### 2026-06-02 22:36 - Shared Admin component extraction completed
- Added a reusable `common` translation namespace across all six Polaris-supported catalogs with translated values.
- Extracted merchant-facing copy from reusable Admin banners, preview and discard modals, multi-language modal chrome, readiness overlay, and shared bundle-status selector.
- Updated older source-contract tests that asserted English literals and added `tests/unit/i18n/shared-admin-copy-i18n.test.ts`.
- Verification: 40 focused Jest tests passed; targeted ESLint completed with zero errors; `git diff --check` passed.
- Next: extract smaller top-level Admin routes and billing components, then handle the large configure and design-control-panel surfaces in separate batches.

### 2026-06-02 22:40 - Starting create-bundle wizard extraction
- Audited the top-level Admin route candidates and selected the create-bundle wizard as the next isolated batch.
- Scope includes title bar, breadcrumb, wizard steps, validation copy, field labels, placeholders, bundle-type cards, image alt text, selection actions, and footer action.
- Next: add a source-contract test, add translated catalog values, update the route, and run focused verification.

### 2026-06-02 22:46 - Create-bundle wizard extraction completed
- Added translated `createBundle` catalogs for all six supported languages.
- Extracted wizard title bar, steps, validation, fields, type cards, image alt text, selection controls, and footer action.
- Added `tests/unit/i18n/create-bundle-wizard-i18n.test.ts`.
- Verification: wizard contract and full catalog parity tests passed; targeted ESLint completed with zero errors; `git diff --check` passed.
- Next: extract the reusable billing surface as a single namespace.

### 2026-06-02 22:50 - Dashboard residual extraction completed
- Replaced the remaining hardcoded dashboard theme-editor-unavailable toast with its existing translated catalog key.
- Audited billing components and confirmed billing, onboarding, cart-transform, configure pages, and design-control-panel settings still require separate extraction batches.
- Next: run checkpoint verification and refresh the graph before continuing the remaining Admin extraction.

### 2026-06-02 22:57 - Starting billing feedback extraction
- Checkpoint verification passed: 41 focused Jest tests, zero ESLint errors, valid locale JSON, refreshed graph, and clean `git diff --check`.
- Residual literal audit identifies 48 Admin files, concentrated in billing, onboarding, cart-transform, configure routes, and DCP settings.
- Starting with billing feedback leaves: subscription error, upgrade confirmation, and upgrade success.

### 2026-06-02 23:03 - Billing feedback extraction completed
- Added translated billing feedback values across all six catalogs.
- Extracted subscription errors, upgrade-confirmation modal chrome and benefit rows, and upgrade-success banner copy.
- Added `tests/unit/i18n/billing-feedback-i18n.test.ts`.
- Verification: billing feedback and catalog parity tests passed; targeted ESLint completed with zero errors; `git diff --check` passed.
- Next: extract billing plan cards and upgrade CTA.

### 2026-06-02 23:10 - Billing plan-card extraction completed
- Extracted Free/Grow plan card chrome and upgrade CTA copy with translated catalog values.
- Added `tests/unit/i18n/billing-plan-cards-i18n.test.ts`.
- Verification: billing card and catalog parity tests passed; targeted ESLint completed with zero errors; `git diff --check` passed.
- Next: extract the billing route status, usage, cancellation, feature, and support sections.

### 2026-06-02 23:18 - Billing route extraction completed
- Extracted billing title bar, plan status, usage, limit warning, overview, cancellation confirmation, plan-feature heading, upsell prompt, and support section.
- Added translated billing-route catalogs across all six languages.
- Added `tests/unit/i18n/billing-route-i18n.test.ts`.
- Verification: billing route and catalog parity tests passed; targeted ESLint completed with zero errors; `git diff --check` passed.
- Remaining extraction includes pricing comparison/FAQ leaves, onboarding, cart-transform, configure routes, and DCP settings.
- Next: refresh graph and run the consolidated checkpoint verification.

### 2026-06-03 19:14 - Preparing Checkpoint Commit
- Preparing the current embedded Admin i18n implementation for commit.
- Scope includes shop-wide Admin locale persistence, six supported Polaris-compatible locales, save-only browser cache update, shared Admin copy extraction, create-bundle wizard extraction, billing extraction, tests, Prisma schema/migration, app navigation update, and graph refresh output.
- Remaining extraction work is still tracked in Phase 5 for later batches.

## Related Documentation

- `docs/admin-ui-i18n/01-requirements.md`
- `docs/admin-ui-i18n/02-architecture.md`
- `docs/i18n-research.md`

## Phases Checklist

- [x] Phase 1: Requirements
- [x] Phase 2: Architecture and impact analysis
- [x] Phase 3: Persistence schema and migration
- [x] Phase 4: Save-only cache contract and Polaris-compatible locale registration
- [ ] Phase 5: Embedded Admin UI copy extraction
- [ ] Phase 6: Tests, lint, Prisma generation, graph refresh
