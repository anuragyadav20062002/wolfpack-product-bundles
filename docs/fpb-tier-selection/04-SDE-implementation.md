# SDE Implementation Plan — Beco-Style Pricing Tier Selection

**Document Type:** SDE Implementation Plan
**Feature ID:** fpb-tier-selection
**Status:** Ready for Implementation
**Created:** 2026-03-17
**Author:** Feature Pipeline

---

## Pre-Implementation Checklist

Before writing the first line of code:

- [ ] Create issue file at `docs/issues-prod/fpb-tier-selection-1.md` (from template in `docs/issues-prod/`)
- [ ] Confirm all planning docs exist: 00-BR.md, 02-PO-requirements.md, 03-architecture.md, this file
- [ ] Confirm test runner works: `npm test` or `npm run test:unit`
- [ ] Note current `WIDGET_VERSION` in `scripts/build-widget-bundles.js`

---

## Phase 1 — Tests for Pure Helpers (TDD Red Phase)

**Goal:** Write failing unit tests for all pure JS helpers before any implementation.

**Test file location:**
```
tests/unit/extensions/fpb-tier-selection.test.ts
```
(or `.js` if the test suite uses plain JS)

**Test cases to write:**

### `parseTierConfig(rawJson: string): TierConfig[]`

```
describe('parseTierConfig', () => {
  it('returns empty array for empty string input')
  it('returns empty array for invalid JSON')
  it('returns empty array for JSON null')
  it('returns empty array for JSON that is not an array')
  it('parses two valid tiers correctly')
  it('parses four valid tiers correctly')
  it('filters out tiers with blank label')
  it('filters out tiers with blank bundleId')
  it('filters out tiers with both fields blank')
  it('trims whitespace from label and bundleId')
  it('returns at most 4 tiers even if input has more')
})
```

### `isTierActive(activeTierIndex: number, candidateIndex: number): boolean`

```
describe('isTierActive', () => {
  it('returns true when candidateIndex equals activeTierIndex')
  it('returns false when candidateIndex does not equal activeTierIndex')
  it('returns true for index 0 when activeTierIndex is 0')
  it('returns false for index 0 when activeTierIndex is 1')
})
```

### `buildTierPillsAriaLabel(tierCount: number): string`

```
describe('buildTierPillsAriaLabel', () => {
  it('returns "Bundle pricing tiers" for any count >= 2')
})
```

**At end of Phase 1:** All tests must be RED (failing — implementations do not exist yet). Commit with message:
```
[fpb-tier-selection-1] test: Add failing unit tests for tier pill helpers
```

---

## Phase 2 — Liquid Block Settings Additions

**Goal:** Add the 8 new tier settings to the Liquid schema and emit `data-tier-config` on the container element.

**File to modify:**
```
extensions/bundle-builder/blocks/bundle-full-page.liquid
```

**Steps:**

1. Add new schema settings block after the "Promo Banner Settings" section (before `{% endschema %}`):
   - 1 header: "Pricing Tiers (Optional)"
   - 1 paragraph explaining usage
   - 4 pairs of text settings: `tier_N_label` + `tier_N_bundle_id` (N = 1 through 4)
   - See `03-architecture.md §4.1` for the exact JSON.

2. Add Liquid logic above the `<div id="bundle-builder-app"` element:
   - Loop over tiers 1–4.
   - For each tier, check if both `tier_N_label` and `tier_N_bundle_id` are non-blank (Tier 1 bundle ID falls back to the primary `bundle_id`).
   - Build a JSON array string of `{"label":"...","bundleId":"..."}` objects using Liquid string concatenation.
   - Assign result to `tier_config_json` Liquid variable.

3. Add `data-tier-config="{{ tier_config_json | escape }}"` attribute to the `<div id="bundle-builder-app"` element.

**Verification (no build needed — Liquid is server-side):**
- In Theme Editor: add two tier labels + bundle IDs → inspect the rendered HTML and confirm `data-tier-config` attribute contains the correct JSON.
- In Theme Editor: add only one tier → confirm `data-tier-config` is `[]` or the attribute only contains one entry (pill bar will not render because JS guards on `< 2` tiers).

**No widget build is needed for this phase alone** (the JS hasn't changed yet and cannot read the new attribute). This phase is safe to commit independently.

**Commit:**
```
[fpb-tier-selection-1] feat: Add tier pricing settings to full-page Liquid block schema
```

---

## Phase 3 — Widget JS: `parseTierConfig`, `initTierPills`, `switchTier`

**Goal:** Implement the pure helpers (turning Phase 1 tests GREEN) and the tier pill DOM/interaction logic.

**File to modify:**
```
app/assets/bundle-widget-full-page.js
```

**Sub-steps:**

### 3a — Implement `parseTierConfig` (makes Phase 1 tests GREEN)

Add as a method of `BundleWidgetFullPage`. Implementation must:
- Parse the JSON string.
- Filter entries where label or bundleId is blank/whitespace.
- Slice to max 4 entries.
- Return `[]` on any error.

Run `npm run test:unit` — Phase 1 tests should now be GREEN.

### 3b — Add instance variables to `constructor`

```javascript
this.tierConfig = [];
this.activeTierIndex = 0;
```

### 3c — Update `parseConfiguration()`

Inside `this.config = { ... }`, add:
```javascript
tierConfig: this.parseTierConfig(dataset.tierConfig || '[]'),
```

After the config assignment:
```javascript
this.tierConfig = this.config.tierConfig;
```

### 3d — Implement `isTierActive(tierIndex)`

```javascript
isTierActive(tierIndex) {
  return tierIndex === this.activeTierIndex;
}
```

### 3e — Implement `initTierPills(tiers)`

- Guard: return immediately if `tiers.length < 2`.
- Create `<div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">`.
- For each tier at index `i`, create `<button class="bundle-tier-pill">` with:
  - `data-tier-index="${i}"`
  - `data-bundle-id="${tier.bundleId}"`
  - `aria-pressed="${i === 0 ? 'true' : 'false'}"`
  - `class="bundle-tier-pill${i === 0 ? ' bundle-tier-pill--active' : ''}"`
  - Inner text: `tier.label`
- If `i === 0`, also add class `bundle-tier-pill--active`.
- Insert `tierPillBar` as `this.container.insertBefore(tierPillBar, this.container.firstChild)`.
- Store as `this.elements.tierPillBar = tierPillBar`.

### 3f — Implement `switchTier(bundleId, tierIndex)`

Follow the exact step-by-step sequence in `03-architecture.md §4.2`. Key points:
- Guard against re-clicking the active tier.
- Temporarily disable all pills before the async fetch.
- Reset `selectedProducts`, `stepProductData`, `currentStepIndex`, `stepCollectionProductIds`, and `searchQuery`.
- Update `this.config.bundleId` before calling `loadBundleData()` (so it fetches the correct bundle ID).
- On success: update `this.activeTierIndex`, call `updatePillActiveStates()`.
- On error: show error toast, restore previous active tier styling.

### 3g — Implement `updatePillActiveStates()`

Helper that iterates all pill buttons in `this.elements.tierPillBar` and sets:
- `aria-pressed` attribute
- `bundle-tier-pill--active` class
based on `this.activeTierIndex`.

### 3h — Update `init()`

After `parseConfiguration()` (and before `showLoadingOverlay()`), add:
```javascript
this.initTierPills(this.tierConfig);
```

### 3i — Update `attachEventListeners()`

Add event delegation on `this.elements.tierPillBar` for click and keydown (Enter/Space). See `03-architecture.md §4.2` for exact handler code pattern.

**After Phase 3, run unit tests:**
```bash
npm run test:unit
```
All Phase 1 tests must be GREEN.

**Lint check:**
```bash
npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js
```
Must produce zero errors.

**Commit:**
```
[fpb-tier-selection-1] feat: Implement tier pill selector logic in full-page widget
```

---

## Phase 4 — Widget CSS: Tier Pill Styles

**Goal:** Add all CSS rules for the pill bar and pill states.

**File to modify:**
```
extensions/bundle-builder/assets/bundle-widget-full-page.css
```

**Important:** This is the compiled CSS file that ships with the extension. The widget CSS is not processed by the JS build pipeline — it is a standalone CSS file served by Shopify. Edit this file directly.

**Steps:**

1. Add CSS variable defaults at the top of the file (after the initial comment block, before `.bundle-widget-full-page`):

```css
/* Tier pill CSS variable defaults */
.bundle-widget-full-page {
  /* ... existing variables remain ... */
  --bundle-tier-pill-active-bg: #00FF00;
  --bundle-tier-pill-active-text: #000000;
  --bundle-tier-pill-inactive-bg: rgb(242, 250, 238);
  --bundle-tier-pill-inactive-text: #333333;
  --bundle-tier-pill-hover-bg: rgb(220, 245, 210);
  --bundle-tier-pill-border: 1px solid #000000;
  --bundle-tier-pill-border-radius: 8px;
  --bundle-tier-pill-height: 52px;
  --bundle-tier-pill-font-size: 14px;
  --bundle-tier-pill-font-weight: 600;
  --bundle-tier-pill-gap: 12px;
  --bundle-tier-pill-padding: 0 24px;
}
```

2. Add new rule blocks after the `.bundle-widget-full-page` block:

```
/* Tier Pill Bar */
.bundle-tier-pill-bar { ... }

/* Individual pill */
.bundle-tier-pill { ... }

/* Active pill */
.bundle-tier-pill--active { ... }

/* Inactive pill hover */
.bundle-tier-pill:not(.bundle-tier-pill--active):hover { ... }

/* Disabled/loading states */
.bundle-tier-pill--disabled,
.bundle-tier-pill--loading { ... }

/* Mobile: horizontal scroll */
@media (max-width: 768px) {
  .bundle-tier-pill-bar { ... }
}
```

Full detailed CSS property values are determined from the reference design (Beco analysis, `docs/beco-bundle-design-analysis.md`) and the CSS variable defaults above.

**No lint step required for CSS.**

**Commit:**
```
[fpb-tier-selection-1] style: Add tier pill bar and pill state CSS
```

---

## Phase 5 — Build, Lint, and Final Commit

**Goal:** Produce the final bundled JS, run all checks, and commit everything together.

**Steps:**

### 5a — Increment widget version

Open `scripts/build-widget-bundles.js`. Increment `WIDGET_VERSION`:
- Current version → PATCH bump (e.g. `1.4.2` → `1.4.3`)
- Record the new version in the issue file's progress log.

### 5b — Run the widget build

```bash
npm run build:widgets
```

Verify the output at `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` is updated (check file modification timestamp and search for the new version string in the first ~50 lines).

### 5c — Run unit tests

```bash
npm run test:unit
```

All tests must pass. If any fail, fix before proceeding.

### 5d — Run linter

```bash
npx eslint --max-warnings 9999 \
  app/assets/bundle-widget-full-page.js \
  extensions/bundle-builder/blocks/bundle-full-page.liquid
```

Must produce zero errors.

### 5e — Update issue file

Update `docs/issues-prod/fpb-tier-selection-1.md`:
- Mark all phases as complete.
- Add a final progress log entry with timestamp.
- Update "Last Updated" and "Status" fields to "Completed".

### 5f — Stage and commit

Files to stage:
- `app/assets/bundle-widget-full-page.js` (source)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (generated bundle)
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `scripts/build-widget-bundles.js` (version bump)
- `docs/issues-prod/fpb-tier-selection-1.md`
- `tests/unit/extensions/fpb-tier-selection.test.ts`

Commit message:
```
[fpb-tier-selection-1] feat: Add Beco-style pricing tier pill selector to full-page bundle widget
```

### 5g — Deploy

Display the following prompt to the user:

```
ACTION REQUIRED — Manual deploy needed.

Run the following command in your terminal:

  shopify app deploy

Reason: The full-page bundle widget JS has been updated with tier pill selector
functionality. Shopify's CDN cache only updates after a deploy.

Let me know once it completes and I will continue.
```

### 5h — Verify in production

After deploy, on a storefront page that has the full-page bundle widget:

```javascript
// In browser DevTools console:
console.log(window.__BUNDLE_WIDGET_VERSION__)
```

Expected: the new version string from Step 5a.

Also verify manually:
- [ ] Configure 2 tiers in Theme Editor → pill bar appears
- [ ] Click Tier 2 → widget content changes, Tier 2 pill becomes active
- [ ] Configure 0 tiers → no pill bar rendered
- [ ] Mobile viewport: pills are horizontally scrollable

---

## Issue File Template

Create `docs/issues-prod/fpb-tier-selection-1.md` immediately before starting Phase 1:

```markdown
# Issue: Beco-Style Pricing Tier Selection for Full-Page Bundle Widget

**Issue ID:** fpb-tier-selection-1
**Status:** In Progress
**Priority:** Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 HH:MM

## Overview
Add a tier pill selector to the full-page bundle widget so merchants can
surface 2–4 pricing tiers (each backed by an existing Bundle record) on a
single bundle page. Follows the Beco reference design.

## Progress Log

### 2026-03-17 HH:MM - Starting Phase 1: Unit Tests
- Writing failing tests for parseTierConfig, isTierActive helpers
- Files to create: tests/unit/extensions/fpb-tier-selection.test.ts

## Related Documentation
- docs/fpb-tier-selection/00-BR.md
- docs/fpb-tier-selection/02-PO-requirements.md
- docs/fpb-tier-selection/03-architecture.md
- docs/fpb-tier-selection/04-SDE-implementation.md (this plan)
- docs/beco-bundle-design-analysis.md (reference design)

## Phases Checklist
- [ ] Phase 1: Tests for pure helpers
- [ ] Phase 2: Liquid block settings
- [ ] Phase 3: Widget JS (parseTierConfig, initTierPills, switchTier)
- [ ] Phase 4: Widget CSS
- [ ] Phase 5: Build, lint, commit, deploy
```

---

## Summary of Files Changed

| File | Change Type | Notes |
|---|---|---|
| `docs/issues-prod/fpb-tier-selection-1.md` | Create | Issue tracking file |
| `tests/unit/extensions/fpb-tier-selection.test.ts` | Create | Unit tests (Phase 1) |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | Modify | Add 8 tier settings + data-tier-config attribute |
| `app/assets/bundle-widget-full-page.js` | Modify | Add parseTierConfig, isTierActive, initTierPills, switchTier, updatePillActiveStates; update init + attachEventListeners |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Modify | Add tier pill CSS variables and rules |
| `scripts/build-widget-bundles.js` | Modify | Increment WIDGET_VERSION (PATCH) |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Auto-generated | Output of npm run build:widgets |
