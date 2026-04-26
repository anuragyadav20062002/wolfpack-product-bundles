# Requirements: Add-On / Upsell Step (Enhanced Free Gift Step)

**Feature name:** `addon-upsell-step`
**Status:** In Progress
**Created:** 2026-04-26

## Fast-Track Note
Prior research from `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §5 (Feature A) and the EB UI crawl covers the competitive context. Wolfpack's current implementation is at `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx:1992–2059`.

---

## Context

Wolfpack currently implements the "free gift" concept as a simple checkbox toggle inside a step's configuration card (`isFreeGift: boolean`). When enabled, it sets products in the step to $0.00 and shows a gift name in the sidebar message. There is no concept of the step having its own name, title, icon, or being shown distinctly in the step navigation tabs.

EB's equivalent ("Free Gift & Add Ons", Feature A — the Gifting Step) is a first-class step type with:
- A configurable **Step Name** shown in the step navigation tab
- A configurable **Step Title** shown as the section heading
- A configurable **Step Icon** (uploaded image replacing the default gift icon)
- The step appears as a DISTINCT tab in the bundle's step navigator
- Multi-language support for Step Name and Step Title
- The step is conceptually a "bonus" moment AFTER the main steps — an add-on or upsell moment

The user wants Wolfpack to replace the current `isFreeGift` checkbox with a more robust, EB-parity UI/UX that treats the add-on/upsell step as a distinct step type — friendly, configurable, and first-class.

---

## Functional Requirements

- **FR-01** — Replace the `isFreeGift` checkbox UI with a proper **Step Mode selector**: `regular | addon`. When `addon` mode is selected, the step behaves as an add-on/upsell step.
- **FR-02** — When a step is in `addon` mode, expose:
  - **Step Label** (shown in the step navigation tab) — free text, e.g. "Add-Ons", "Free Gifts", "Extras"
  - **Step Title** (shown as the heading inside the step panel) — free text, e.g. "Pick a free gift!", "Complete your order with..."
  - **Step Icon** — file upload (falls back to a default gift/star icon)
  - **Display products at $0** toggle — boolean, default `true` for backward compat (existing free gift behavior)
  - **Unlock after completion** toggle — boolean, default `true` (step is locked until prior steps are complete)
- **FR-03** — The existing `isFreeGift` flag on `BundleStep` maps to: `stepMode = 'addon'` + `addonDisplayFree = true`. Migration: existing rows with `isFreeGift=true` are treated as addon steps automatically.
- **FR-04** — The existing `isDefault` (mandatory pre-selected product) remains as-is, unchanged — it is a different concept and should not be conflated with add-on mode.
- **FR-05** — In the configure UI, the Step Options section is redesigned: instead of two checkboxes, show a segmented control or radio choice: **Regular Step / Add-On Step** — selecting "Add-On Step" reveals the add-on config fields.
- **FR-06** — The storefront widget renders add-on steps distinctly:
  - The step tab uses the `stepLabel` text (not the step `name`)
  - If a step icon is uploaded, it replaces the default step icon in the timeline
  - Products in the step show as free (price badge "FREE") when `addonDisplayFree = true`
  - The step is grayed out / locked in the tab navigator until previous required steps are complete (when `addonUnlockAfterCompletion = true`)
- **FR-07** — `freeGiftName` is retired in favour of `stepLabel`. Existing data migrates: if `freeGiftName` is set and `isFreeGift` is true, `stepLabel` = `freeGiftName` on first display (no DB migration required — handled in UI read logic).
- **FR-08** — Multi-language: `stepLabel` and `stepTitle` are included in the per-bundle `textOverridesByLocale` JSON so they can be localised (consistent with existing text override system).

## Out of Scope
- Feature B (bundle-level add-on tiers with percentage discounts) — this is a separate feature (`docs/addon-upsell-bundle-panel/`).
- Gift messages system (EB's "message as Shopify product" mechanic) — future feature.
- Subscriptions or pre-order integration for add-on steps.
- Changing how the CART TRANSFORM handles add-on steps (they still MERGE into the bundle same as free gift steps).

---

## Acceptance Criteria

### FR-01
- [ ] Step Options section has a clear "Step Mode" toggle/radio: **Regular** (default) | **Add-On / Upsell**.
- [ ] Switching to Add-On mode reveals the add-on config fields; switching back hides them and clears the values.

### FR-02
- [ ] Step Label field: text input, placeholder "Add-Ons", max 40 chars, shown only in Add-On mode.
- [ ] Step Title field: text input, placeholder "Pick your free gift!", shown only in Add-On mode.
- [ ] Step Icon field: file upload component (same `FilePicker` used elsewhere), shown only in Add-On mode.
- [ ] "Display products as free (£0)" toggle: boolean, shown only in Add-On mode, default ON.
- [ ] "Unlock after completion" toggle: boolean, shown only in Add-On mode, default ON.

### FR-03
- [ ] `BundleStep` Prisma model gets new fields: `addonLabel String?`, `addonTitle String?`, `addonIconUrl String?`, `addonDisplayFree Boolean @default(true)`, `addonUnlockAfterCompletion Boolean @default(true)`.
- [ ] `isFreeGift = true` on load → UI renders in Add-On mode automatically (backward compat read).
- [ ] Saving in Add-On mode sets `isFreeGift = true` (for cart transform compat) + new addon fields.

### FR-04
- [ ] `isDefault` + `defaultVariantId` remain in Step Options, unchanged, visible regardless of step mode.

### FR-05
- [ ] The new Step Options card UI is clean and intuitive — no raw checkbox clutter.
- [ ] Polaris `ChoiceList` or `ButtonGroup` used for mode selector (not a raw checkbox).

### FR-06 — Storefront rendering (widget changes)
- [ ] Step tab displays `addonLabel` (or `name` if `addonLabel` is blank) for add-on steps.
- [ ] If `addonIconUrl` is set, the step timeline icon uses that image instead of the default.
- [ ] Products in add-on steps show a "FREE" badge and $0.00 price when `addonDisplayFree = true`.
- [ ] Add-on step tab is visually locked (dimmed, with a lock icon) until prior steps reach their min quantity, when `addonUnlockAfterCompletion = true`.
- [ ] Add-on step tab becomes active once unlock condition is met (real-time, no page reload).

### FR-07
- [ ] In the loader, if `isFreeGift === true && !addonLabel && freeGiftName`, display `freeGiftName` in the Step Label field as pre-filled value.
- [ ] No DB migration needed — handled in the route loader/transformer.

### FR-08
- [ ] `textOverridesByLocale` supports `addonStepLabel` and `addonStepTitle` keys per locale.
- [ ] The text overrides panel (if it exists for the bundle) shows these fields when an add-on step is present.

---

## UI/UX Spec

### Step Options Card — Redesign

**Current (before):**
```
Step Options
Advanced options for free gift steps and pre-selected (mandatory) products.

[ ] Free gift step
    "This step is unlocked after all regular steps are complete. Products shown at £0."
      Gift display name: [___________]

[ ] Mandatory default product
    "A specific variant is pre-selected..."
      Default variant GID: [___________]
```

**New (after):**
```
Step Type
─────────────────────────────────────────────
  ● Regular Step      ○ Add-On / Upsell Step
─────────────────────────────────────────────

[IF Add-On selected — card expands:]

  Step Label (tab name)  [___________________]  ← "Add-Ons", "Free Gift", "Extras"
                         e.g. shown in the bundle step navigator tab

  Step Title (heading)   [___________________]  ← "Pick a free gift!"
                         e.g. shown as the panel heading inside the step

  Step Icon              [📁 Upload icon] [✕ Remove]
                         Falls back to default gift icon if not uploaded

  [✓] Display products as free (£0.00)
      Customers see $0 on products in this step.

  [✓] Unlock after bundle completion
      This step tab is locked until all prior steps are filled.

─────────────────────────────────────────────
Mandatory Default Product
─────────────────────────────────────────────
  [ ] Pre-select a specific variant
      Default variant GID: [___________]
```

### Storefront Step Tab (widget)

**Regular step tab:**
```
[Icon]  Step 1: Choose Protein
```

**Add-On step tab (locked):**
```
[🔒]  Add-Ons          ← dimmed, lock icon shown
```

**Add-On step tab (unlocked):**
```
[🎁]  Add-Ons          ← active, custom icon shown if uploaded
```

---

## Data Changes

### Prisma — `BundleStep` model additions
```prisma
addonLabel                  String?    // Tab label for add-on step
addonTitle                  String?    // Heading inside the add-on step panel
addonIconUrl                String?    // URL of uploaded icon for the step tab
addonDisplayFree            Boolean    @default(true)   // Show $0.00 on products
addonUnlockAfterCompletion  Boolean    @default(true)   // Lock tab until prior steps done
```

No new Prisma relations. All new fields on existing `BundleStep` model.

### Widget JS (`bundle-widget-full-page.js`)
Add-on step rendering logic:
- Tab label: use `step.addonLabel || step.name`
- Tab icon: use `step.addonIconUrl || defaultGiftIcon` when `isFreeGift`
- Lock state: check if all prior steps have met `minQuantity`; if not, dim tab + show lock icon
- Product price: override to $0.00 display when `isFreeGift && addonDisplayFree`

### API (`/api/bundle/{id}.json`)
Include new fields in the `steps` response object.

### `bundle-config-metafield.server.ts`
Include new step fields in the metafield sync payload.

---

## Risks

| Risk | Mitigation |
|---|---|
| Existing `isFreeGift = true` data needs `addonDisplayFree` default | Field defaults to `true` in Prisma — no migration needed; existing rows get the right behavior |
| Widget rebuild required for storefront changes | Mandatory: `npm run build:widgets` after widget JS changes |
| `addonIconUrl` upload needs the existing FilePicker component | Use same `FilePicker` used for `timelineIconUrl` in step config — no new infrastructure |
| Step lock logic adds complexity to the widget state machine | Isolate in a `isAddonStepLocked(step, stepsState)` helper — pure function, easily testable |
