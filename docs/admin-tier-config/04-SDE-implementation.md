# SDE Implementation Plan: Admin UI Tier Configuration for Full-Page Bundle Widget

## Overview

This plan implements the admin-side tier configuration feature for the full-page bundle widget using Option C from the architecture document: a nullable `tierConfig` JSON column on `Bundle`, exposed through the existing bundle API, with the widget reading tier config from the API response.

**Implementation boundary:** This document covers the implementation plan only. No code is written here. Code writing follows TDD in the sequence below.

**Reference documents:**
- `docs/admin-tier-config/00-BR.md`
- `docs/admin-tier-config/02-PO-requirements.md`
- `docs/admin-tier-config/03-architecture.md`

---

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/tier-config-validator.test.ts` | `validateTierConfig` — valid input, max entries, empty fields, cross-shop bundle IDs, null/non-array input | Pending |
| `tests/unit/routes/api.bundle.tier-config.test.ts` | Loader response includes `tierConfig` when set; returns `null` when absent | Pending |
| `tests/unit/routes/full-page-configure.tier-save.test.ts` | `handleSaveBundle` parses `tierConfigData`, strips invalid entries, writes to DB; clears config when absent | Pending |
| `tests/unit/assets/fpb-tier-api-source.test.ts` | Widget reads tiers from API response; fallback to `data-tier-config`; minimum 2 tier requirement; precedence rule | Pending |

---

## Phase 1 — Type definitions and validator (pure logic)

**Tests (Red):**
- `tests/unit/lib/tier-config-validator.test.ts`
  - `validateTierConfig(null, shopId, db)` → returns `[]`
  - `validateTierConfig([], shopId, db)` → returns `[]`
  - `validateTierConfig([{ label: "T1", linkedBundleId: "abc" }], shopId, db)` with `db.bundle.findMany` returning `["abc"]` → returns the entry
  - `validateTierConfig` with 5 entries → returns only first 4
  - `validateTierConfig` with entry having empty `label` → strips that entry
  - `validateTierConfig` with entry having `linkedBundleId` not in DB results → strips that entry
  - `validateTierConfig` with `label` > 50 chars → strips that entry

**Implementation (Green):**
- Step 1.1: Create `app/types/tier-config.ts` — `TierConfigEntry` interface and `TierConfig` type alias.
- Step 1.2: Create `app/lib/tier-config-validator.server.ts` — export `validateTierConfig(raw: unknown, shopId: string, db: PrismaClient): Promise<TierConfig>`.
  - Parse and normalize raw input.
  - Strip entries missing `label` or `linkedBundleId`.
  - Strip entries with `label` longer than 50 chars.
  - Slice to 4 entries.
  - Query `db.bundle.findMany({ where: { id: { in: linkedBundleIds }, shopId } })` to get valid IDs.
  - Filter entries to only those whose `linkedBundleId` is in the returned set.

**Refactor:** Ensure the function is purely async with no side effects beyond the DB read.

---

## Phase 2 — Prisma migration

**Tests:** None required (migration file, no logic to test).

**Implementation:**
- Step 2.1: Add `tierConfig  Json?` field to the `Bundle` model in `prisma/schema.prisma`.
- Step 2.2: Run `npx prisma migrate dev --name add_tier_config_to_bundle` to generate the migration file and apply it to the local dev DB.
- Step 2.3: Run `npx prisma generate` to regenerate the Prisma client.
- Step 2.4: Verify TypeScript compiles with the new field (`npx tsc --noEmit`).

---

## Phase 3 — Bundle API response includes `tierConfig`

**Tests (Red):**
- `tests/unit/routes/api.bundle.tier-config.test.ts`
  - Mock `db.bundle.findFirst` to return a bundle with `tierConfig: [{ label: "T1", linkedBundleId: "abc" }]`.
  - Call the loader (or the formatting logic directly).
  - Assert `response.bundle.tierConfig` equals `[{ label: "T1", linkedBundleId: "abc" }]`.
  - Mock `db.bundle.findFirst` to return a bundle with `tierConfig: null`.
  - Assert `response.bundle.tierConfig` is `null`.

**Implementation (Green):**
- Step 3.1: In `app/routes/api/api.bundle.$bundleId[.]json.tsx`, add `tierConfig: bundle.tierConfig ?? null` to the `formattedBundle` object.
- Step 3.2: Update `LoaderData` type (if applicable) to include `tierConfig`.

**Refactor:** Verify no other fields in `formattedBundle` need type alignment.

---

## Phase 4 — Save handler reads and writes `tierConfig`

**Tests (Red):**
- `tests/unit/routes/full-page-configure.tier-save.test.ts`
  - Construct a `FormData` with `tierConfigData: JSON.stringify([{ label: "T1", linkedBundleId: "abc" }])`.
  - Mock `db.bundle.update` and `db.bundle.findUnique`.
  - Mock `validateTierConfig` to return the input unchanged (or use real implementation with mocked `db.bundle.findMany`).
  - Call `handleSaveBundle` and assert `db.bundle.update` was called with `data: { ..., tierConfig: [{ label: "T1", linkedBundleId: "abc" }] }`.
  - Construct `FormData` without `tierConfigData`.
  - Assert `db.bundle.update` was called with `data: { ..., tierConfig: null }`.
  - Construct `FormData` with `tierConfigData` containing a cross-shop bundle ID.
  - Assert that entry is stripped before DB write.

**Implementation (Green):**
- Step 4.1: In `handlers.server.ts` → `handleSaveBundle`:
  - Parse `tierConfigData` from `formData.get("tierConfigData")`.
  - If present, call `validateTierConfig(parsed, session.shop, db)`.
  - Include `tierConfig: validatedTiers.length > 0 ? validatedTiers : null` in the `db.bundle.update` data object.
  - If not present, include `tierConfig: null` (explicit null to clear).

**Refactor:** Ensure error handling does not swallow tier validation errors — log them but do not fail the entire save.

---

## Phase 5 — Admin UI component: `PricingTiersSection`

**Tests:** None required (Polaris UI component — TDD exception per CLAUDE.md).

**Implementation:**
- Step 5.1: Create `app/components/bundle-configure/PricingTiersSection.tsx`.
  - Props: `tiers: TierConfigEntry[]`, `availableBundles: { id: string; name: string }[]`, `onChange: (tiers: TierConfigEntry[]) => void`, `currentBundleId: string`.
  - Renders a Polaris `Card` with:
    - Section header "Pricing Tiers" (`Text variant="headingMd"`)
    - Description paragraph
    - Empty state (`EmptyState`) when `tiers.length === 0`
    - One row per tier (tier number heading, `TextField` for label, `Select` for linked bundle, `Button variant="plain" tone="critical"` delete button)
    - "Add tier" `Button` (disabled when `tiers.length >= 4`)
  - Filters `availableBundles` to exclude `currentBundleId` from each tier's selector if needed (or allow self-reference — PO deferred this decision, allow it for now).
  - Each row change calls `onChange` with the updated array.

- Step 5.2: In the configure route loader, add a query for available bundles:
  ```typescript
  const availableBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      bundleType: 'full_page',
      status: { in: ['draft', 'active'] }
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  ```
  Include `availableBundles` in the loader return value.

- Step 5.3: Update `LoaderData` type in `types.ts` to add `availableBundles: { id: string; name: string }[]`.

- Step 5.4: In `useBundleConfigurationState.ts`, add tier state:
  - `tierConfig: TierConfigEntry[]` — initialized from `bundle.tierConfig ?? []`
  - `setTierConfig: (tiers: TierConfigEntry[]) => void` — calls `markAsDirty()` on change

- Step 5.5: In `route.tsx`:
  - Add `"pricing_tiers"` to `bundleSetupItems` with the `DiscountIcon` icon and `fullPageOnly: true`.
  - Render `<PricingTiersSection>` inside the section for `pricing_tiers`.
  - In the `handleSave` / save bar submission logic, include `tierConfigData: JSON.stringify(tierConfig)` in the `FormData` sent to the action.

---

## Phase 6 — Widget JS reads `tierConfig` from API response

**Tests (Red):**
- `tests/unit/assets/fpb-tier-api-source.test.ts`
  - Provide a mock bundle API response with `tierConfig: [{ label: "T1", bundleId: "a" }, { label: "T2", bundleId: "b" }]`.
  - Assert `resolveTierConfig(apiTierConfig, dataTierConfig)` returns the API source.
  - Provide `apiTierConfig: null` and `dataTierConfig: [...]` → assert fallback to `dataTierConfig`.
  - Provide `apiTierConfig: [{ label: "T1", bundleId: "a" }]` (single entry) → assert result is `[]` (minimum 2 not met).
  - Provide both `apiTierConfig` and `dataTierConfig` as non-empty → assert `apiTierConfig` takes precedence.

Note: The test extracts a pure helper function `resolveTierConfig` that encapsulates the precedence logic. This function should be extractable and testable without instantiating the full widget.

**Implementation (Green):**
- Step 6.1: In `app/assets/bundle-widget-full-page.js`, after the bundle API response is received and `bundle` data is parsed, add resolution logic:
  ```javascript
  const apiTiers = Array.isArray(bundle.tierConfig) ? bundle.tierConfig : null;
  const htmlTiers = this.tierConfig; // Already parsed from data-tier-config
  const resolvedTiers = (apiTiers && apiTiers.length >= 2) ? apiTiers : (htmlTiers && htmlTiers.length >= 2 ? htmlTiers : []);
  ```
  Note: The API response uses `linkedBundleId` as the key (DB schema), but the widget pill uses `bundleId`. Map `linkedBundleId` → `bundleId` when converting API tiers to pill config:
  ```javascript
  const pillTiers = resolvedTiers.map(t => ({ label: t.label, bundleId: t.linkedBundleId ?? t.bundleId }));
  ```
  Call `this.initTierPills(pillTiers)` (or re-call it if already called with empty data at init).

- Step 6.2: Ensure `initTierPills([])` is a no-op / clears any existing pills (it already returns early on empty array per existing code).

- Step 6.3: Increment `WIDGET_VERSION` in `scripts/build-widget-bundles.js` (PATCH bump).

- Step 6.4: Run `npm run build:widgets` to regenerate `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`.

**Refactor:** Consider extracting the resolution logic into a named pure function `resolveTierConfig(apiTiers, htmlTiers)` within the widget file to keep `initTierPills` call site clean.

---

## Phase 7 — Issue file and commit

- Step 7.1: Create `docs/issues-prod/admin-tier-config-1.md` per CLAUDE.md issue tracking format.
- Step 7.2: Run `npx eslint --max-warnings 9999` on all modified files.
- Step 7.3: Run `npm test` — confirm all new tests pass and no regressions.
- Step 7.4: Stage modified files and commit with message format: `[admin-tier-config-1] feat: Add admin UI tier configuration for full-page bundle widget`.

---

## Build and Verification Checklist

- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests (especially `tests/unit/assets/fpb-tier-selection.test.ts`)
- [ ] TypeScript compiles without new errors (`npx tsc --noEmit`)
- [ ] Prisma migration applied and client regenerated
- [ ] Widget rebuilt (`npm run build:widgets`) — both source and bundled files committed
- [ ] `WIDGET_VERSION` incremented in `scripts/build-widget-bundles.js`
- [ ] ESLint passes on all modified files (`npx eslint --max-warnings 9999 <files>`)
- [ ] Backward compatible: existing bundles with `tierConfig: null` show no tier pills (same as today)
- [ ] Backward compatible: existing Theme Editor tier configs (`data-tier-config`) still work when no admin config is set
- [ ] `availableBundles` loader query scoped to `session.shop` (no cross-shop data leak)

---

## Manual Test Steps (after deployment)

1. Open any existing full-page bundle in the admin. Confirm "Pricing Tiers" nav item is present and section renders (empty state).
2. Add two tiers: select two different bundles, assign labels. Save. Confirm save bar clears.
3. Reload the page. Confirm both tiers are pre-populated.
4. Visit the storefront bundle page. Confirm tier pills appear with the correct labels.
5. Click a tier pill. Confirm the widget switches to the linked bundle's product set.
6. Remove one tier in admin so only one remains. Save. Visit storefront. Confirm no tier pills are shown.
7. Configure tiers in the Theme Editor block settings (legacy path). Confirm they are overridden by admin-configured tiers when `tierConfig` is set.
8. Clear admin tier config (remove all tiers). Save. Visit storefront. Confirm Theme Editor tiers are now shown again (fallback working).

---

## Rollback Notes

- The `tierConfig` column is nullable. Rolling back the code (without rolling back the migration) leaves the column populated but unused — safe.
- Rolling back the migration: `ALTER TABLE "Bundle" DROP COLUMN "tierConfig"` — will lose any saved tier config for bundles that had it set. Only do this if absolutely necessary.
- The widget JS rollback requires re-deploying the previous widget bundle version. The version number in `WIDGET_VERSION` must be reverted and `shopify app deploy` run.
- The Liquid block requires no changes and no rollback.
