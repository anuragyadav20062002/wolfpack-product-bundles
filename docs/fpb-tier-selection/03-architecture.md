# Architecture Decision Record — Beco-Style Pricing Tier Selection

**Document Type:** Architecture Decision Record (ADR)
**Feature ID:** fpb-tier-selection
**Status:** Proposed
**Created:** 2026-03-17
**Author:** Feature Pipeline

---

## 1. Context

The full-page bundle widget currently renders a single bundle determined at page load. We are adding a tier pill selector so that one page can surface multiple bundles (each representing a pricing tier). This ADR records the architectural decisions made and the file-by-file change plan.

---

## 2. Decision: Option A — Multiple Existing Bundle Records Per Tier

**Rejected alternative:** A new "TierGroup" Prisma model linking N bundles as tiers of one parent.

**Chosen approach:** Each tier is an independent `Bundle` record, already fully supported by the existing API. The Liquid block stores up to 4 (label, bundleId) pairs. The widget JS reads these pairs, renders pills, and swaps the active bundle ID when a pill is clicked.

**Rationale:**
- Zero schema changes, zero migrations, zero new server-side routes.
- Reuses the existing `/api/bundle/:id.json` endpoint unchanged.
- Fully backward-compatible: pages without tier settings continue working with no code path changes.
- Merchant workflow is already natural: create bundles in the dashboard → enter their IDs in the theme editor.

---

## 3. High-Level Data Flow

```
Theme Editor (Liquid schema settings)
  └─ block.settings: tier_1_label, tier_1_bundle_id, ..., tier_4_label, tier_4_bundle_id
       └─ bundle-full-page.liquid renders:
            <div id="bundle-builder-app"
                 data-bundle-id="{{ primary_bundle_id }}"
                 data-tier-config="{{ tiers_json | escape }}"
                 ...>

Widget JS (bundle-widget-full-page.js)
  parseConfiguration()
    └─ reads dataset.tierConfig → parseTierConfig() → TierConfig[]
  init()
    └─ initTierPills(tiers)  (inserts pill bar DOM before promo banner)
    └─ normal init flow continues (loads Tier 1 bundle by default)
  User clicks a pill
    └─ switchTier(bundleId)
         ├─ disables all pills, shows loading overlay
         ├─ updates this.config.bundleId = bundleId
         ├─ await this.loadBundleData()  (fetches new bundle from API)
         ├─ this.selectBundle()
         ├─ this.initializeDataStructures()
         ├─ await this.renderUI()
         ├─ hides loading overlay
         └─ updates pill active state
```

---

## 4. File-by-File Change Plan

### 4.1 `extensions/bundle-builder/blocks/bundle-full-page.liquid`

**Change type:** Add new schema settings + render tier config as data attribute.

**New schema settings block** (inserted after the existing "Promo Banner Settings" header, before `{% endschema %}`):

```json
{
  "type": "header",
  "content": "Pricing Tiers (Optional)"
},
{
  "type": "paragraph",
  "content": "Configure up to 4 pricing tiers. Enter a label (e.g. 'Buy 2 @499 ›') and the Bundle ID for each tier. Tier pills are shown only when 2 or more tiers are configured."
},
{
  "type": "text",
  "id": "tier_1_label",
  "label": "Tier 1 label"
},
{
  "type": "text",
  "id": "tier_1_bundle_id",
  "label": "Tier 1 bundle ID",
  "info": "Leave blank to use the primary Bundle ID above"
},
{
  "type": "text",
  "id": "tier_2_label",
  "label": "Tier 2 label"
},
{
  "type": "text",
  "id": "tier_2_bundle_id",
  "label": "Tier 2 bundle ID"
},
{
  "type": "text",
  "id": "tier_3_label",
  "label": "Tier 3 label (optional)"
},
{
  "type": "text",
  "id": "tier_3_bundle_id",
  "label": "Tier 3 bundle ID (optional)"
},
{
  "type": "text",
  "id": "tier_4_label",
  "label": "Tier 4 label (optional)"
},
{
  "type": "text",
  "id": "tier_4_bundle_id",
  "label": "Tier 4 bundle ID (optional)"
}
```

**New Liquid logic** (above the `<div id="bundle-builder-app"` element):

```liquid
{% comment %} Build tier config array for JavaScript {% endcomment %}
{% assign tier_configs = "" %}
{% assign tier_count = 0 %}
{% for i in (1..4) %}
  {% assign tier_label_key = 'tier_' | append: i | append: '_label' %}
  {% assign tier_bundle_id_key = 'tier_' | append: i | append: '_bundle_id' %}
  {% assign tier_label = block.settings[tier_label_key] %}
  {% assign tier_bundle_id = block.settings[tier_bundle_id_key] %}
  {% comment %} Tier 1 bundle ID falls back to primary bundle_id {% endcomment %}
  {% if i == 1 and tier_bundle_id == blank %}
    {% assign tier_bundle_id = bundle_id %}
  {% endif %}
  {% if tier_label != blank and tier_bundle_id != blank %}
    {% assign tier_count = tier_count | plus: 1 %}
  {% endif %}
{% endfor %}
```

Note: Liquid's lack of native array-building requires the tier config to be emitted as
a JSON string directly into `data-tier-config`. The implementation section details the
exact Liquid template for this. The key invariant is: each entry is `{label, bundleId}`,
JSON-serialised, HTML-escaped.

**Modified `<div>` opening tag** — adds a `data-tier-config` attribute:

```liquid
data-tier-config="{{ tier_json_string | escape }}"
```

Where `tier_json_string` is a JSON array built from the configured tiers.

---

### 4.2 `app/assets/bundle-widget-full-page.js`

This is the primary JS source file. The bundled output lives in
`extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (generated by `npm run build:widgets`).

#### New instance variables (in `constructor`)

```
this.tierConfig = [];       // TierConfig[] parsed from data-tier-config
this.activeTierIndex = 0;   // 0-based index of the currently active tier
```

#### Modified: `parseConfiguration()`

Add after existing config assignments:

```
tierConfig: this.parseTierConfig(dataset.tierConfig || '[]')
```

Store on `this.tierConfig` as well.

#### New method: `parseTierConfig(rawJson)`

- Parses the JSON string from `data-tier-config`.
- Returns a `TierConfig[]` where `TierConfig = { label: string, bundleId: string }`.
- Filters out entries with blank label or bundleId.
- On JSON parse error: returns `[]` (fail gracefully, no pill bar).
- This is a pure function (no `this` dependency other than using it to store results) — easily unit-testable.

#### New method: `isTierActive(tierIndex)`

- Returns `true` if `tierIndex === this.activeTierIndex`.
- Pure helper — easily unit-testable.

#### New method: `initTierPills(tiers)`

- Called from `init()` after `parseConfiguration()` and before `showLoadingOverlay()`.
- Guards: if `tiers.length < 2`, returns immediately (no DOM insertion).
- Creates a `<div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">` element.
- For each tier, creates a `<button class="bundle-tier-pill">` with:
  - `data-tier-index` attribute
  - `data-bundle-id` attribute
  - `aria-pressed="true/false"`
  - Inner text = tier label
- Appends pill bar to `this.container` as the **first child** (before any other content injected by `setupDOMElements` / `renderUI`).
- Stores pill bar element as `this.elements.tierPillBar`.

**Pill bar insertion position:** It must be the first child of `.bundle-widget-full-page` so it renders above the promo banner. `renderFullPageLayout()` appends content into `.full-page-layout` which is inside `.bundle-steps` — the tier pill bar sits outside this, directly inside the root container.

#### New method: `switchTier(bundleId, tierIndex)`

Called when a tier pill button is clicked.

```
async switchTier(bundleId, tierIndex) {
  // 1. Guard: do nothing if this tier is already active
  if (tierIndex === this.activeTierIndex) return;

  // 2. Disable all pills (set bundle-tier-pill--disabled class)
  //    Mark clicked pill as bundle-tier-pill--loading
  // 3. Show loading overlay (no gif — same as tier switch)
  // 4. Update config.bundleId to the new bundleId
  // 5. Reset widget state:
  //    - this.selectedProducts = []
  //    - this.stepProductData = []
  //    - this.currentStepIndex = 0
  //    - clear this.stepCollectionProductIds
  // 6. await this.loadBundleData()
  // 7. this.selectBundle()
  // 8. this.initializeDataStructures()
  // 9. Clear this.elements.stepsContainer.innerHTML
  // 10. await this.renderUI()
  // 11. Hide loading overlay
  // 12. Update this.activeTierIndex = tierIndex
  // 13. Re-render pill active states (update aria-pressed, CSS classes)
  // 14. Re-enable all pills
  // On error:
  //    - hide loading overlay
  //    - show toast error
  //    - re-enable pills, restore previous active state styling
}
```

#### Modified: `attachEventListeners()`

Add event delegation on the tier pill bar:

```javascript
if (this.elements.tierPillBar) {
  this.elements.tierPillBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.bundle-tier-pill');
    if (!pill) return;
    const tierIndex = parseInt(pill.dataset.tierIndex, 10);
    const bundleId = pill.dataset.bundleId;
    this.switchTier(bundleId, tierIndex);
  });
  this.elements.tierPillBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const pill = e.target.closest('.bundle-tier-pill');
      if (!pill) return;
      e.preventDefault();
      pill.click();
    }
  });
}
```

#### Modified: `init()`

```
// After parseConfiguration(), before showLoadingOverlay():
this.tierConfig = this.config.tierConfig;
this.initTierPills(this.tierConfig);
```

---

### 4.3 CSS Files

**Primary file:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

New rules added after `.bundle-widget-full-page` container block.

**CSS variables** (all prefixed `--bundle-tier-`; defined with defaults so no DCP integration is required in v1):

```css
/* Tier Pill CSS variable defaults — override via theme or DCP in future */
/* These live on :root so they can be overridden by DCP-injected CSS */
```

Variables:
- `--bundle-tier-pill-active-bg`: `#00FF00`
- `--bundle-tier-pill-active-text`: `#000000`
- `--bundle-tier-pill-inactive-bg`: `rgb(242, 250, 238)`
- `--bundle-tier-pill-inactive-text`: `#333333`
- `--bundle-tier-pill-hover-bg`: `rgb(220, 245, 210)`
- `--bundle-tier-pill-border`: `1px solid #000000`
- `--bundle-tier-pill-border-radius`: `8px`
- `--bundle-tier-pill-height`: `52px`
- `--bundle-tier-pill-font-size`: `14px`
- `--bundle-tier-pill-font-weight`: `600`
- `--bundle-tier-pill-gap`: `12px`
- `--bundle-tier-pill-padding`: `0 24px`

**New CSS classes:**

| Class | Purpose |
|---|---|
| `.bundle-tier-pill-bar` | Flex container for all pills; horizontal scroll on mobile |
| `.bundle-tier-pill` | Individual pill button |
| `.bundle-tier-pill--active` | Active state overrides |
| `.bundle-tier-pill--loading` | Disabled/loading state for clicked pill |
| `.bundle-tier-pill--disabled` | Disabled state for all pills during switch |

**Responsive rules:**

- Desktop (> 768px): pills in a single row, centered, max-width constrained by content section width.
- Mobile (≤ 768px): `overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap;`

---

### 4.4 `scripts/build-widget-bundles.js`

No structural change. Increment `WIDGET_VERSION` (PATCH bump) before building.

---

### 4.5 `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

Auto-generated output. Do not edit directly. Re-generated via `npm run build:widgets`.

---

## 5. State Management During Tier Switch

The `BundleWidgetFullPage` instance persists across tier switches — it is NOT destroyed and re-created. Instead, `switchTier()` resets the mutable state fields and re-runs the relevant phases of `init()` (from `loadBundleData` onward).

**Fields reset on tier switch:**
- `this.selectedProducts`
- `this.stepProductData`
- `this.currentStepIndex`
- `this.stepCollectionProductIds`
- `this.bundleData` (overwritten by `loadBundleData`)
- `this.selectedBundle` (overwritten by `selectBundle`)
- `this.searchQuery`

**Fields preserved across tier switch:**
- `this.container` (root DOM element)
- `this.config` (except `bundleId` which is updated)
- `this.tierConfig` (does not change)
- `this.activeTierIndex` (updated at end of successful switch)
- `this.elements.tierPillBar` (preserved; pill active states updated)
- `this.productModal` (preserved)

---

## 6. Backward Compatibility

The feature is gated behind the presence of `data-tier-config`. The Liquid template only emits `data-tier-config` when at least one tier label+bundleId pair is configured.

`parseConfiguration()` already handles unknown `dataset` keys gracefully (they are simply absent). Adding `tierConfig` to the config object with an empty array default means zero code paths change when no tiers are configured.

`initTierPills([])` returns immediately, so no DOM changes occur when the feature is not used.

---

## 7. DCP (Design Control Panel) Considerations

**Decision: DCP integration is not required for v1.**

The tier pill CSS variables are defined with sensible defaults directly in the CSS file. They are prefixed `--bundle-tier-` to be consistent with the existing `--bundle-` variable namespace.

A future iteration can add DCP settings (e.g. colour pickers for active/inactive pill backgrounds) without any JS changes — the CSS variables are already in place as the integration point.

The DCP preview in the theme editor will show the tier pill bar if the merchant has configured tiers, because the Liquid block renders `data-tier-config` in the editor's DOM.

---

## 8. Testing Strategy

### Unit-testable pure helpers (no DOM, no fetch)

These functions have no side effects and are the primary unit test targets:

| Function | Test cases |
|---|---|
| `parseTierConfig(rawJson)` | Valid JSON with 2 tiers; valid JSON with 4 tiers; invalid JSON; empty string; tiers with blank label or bundleId filtered out |
| `isTierActive(index)` | Returns true for matching index; false for non-matching |
| (Conceptual) `buildTierConfigJson(settings)` | Tested at integration level via Liquid rendering |

### Integration-level (JSDOM or browser)

- `initTierPills(tiers)`: DOM output has correct number of pills, aria attributes, active class on Tier 1.
- `switchTier()`: verifies state reset, calls `loadBundleData`, updates `activeTierIndex`.
- Pill click event handler: verifies correct `switchTier` invocation.

### End-to-end (manual)

- Configure 2 tiers in Theme Editor → verify pill bar appears.
- Click Tier 2 pill → verify widget content changes.
- Configure 0–1 tiers → verify no pill bar rendered.

### No tests required for

- CSS changes (visual-only, no logic).
- Liquid schema additions (no logic, just markup).
- Build script version bump.

---

## 9. Build and Deploy Checklist

1. Increment `WIDGET_VERSION` in `scripts/build-widget-bundles.js` (PATCH bump).
2. Run `npm run build:widgets` to regenerate `bundle-widget-full-page-bundled.js`.
3. Run `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js`.
4. Commit source + bundled files with `[fpb-tier-selection-1]` prefix.
5. Request manual `shopify app deploy` (per Shopify Deploy Rule in CLAUDE.md).
6. Wait 2–10 minutes for CDN propagation.
7. Verify live version with `console.log(window.__BUNDLE_WIDGET_VERSION__)` in DevTools.
