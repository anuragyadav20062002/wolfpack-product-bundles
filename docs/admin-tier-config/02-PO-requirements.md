# Product Owner Requirements: Admin UI Tier Configuration for Full-Page Bundle Widget

## Reference

- BR: `docs/admin-tier-config/00-BR.md`
- Recommended approach: Option C (store `tierConfig` JSON on `Bundle`, expose through existing API, widget reads from API response)

---

## User Stories with Acceptance Criteria

---

### Story 1: View the Pricing Tiers section on the configure page

**As a** merchant
**I want** to see a "Pricing Tiers" section on the full-page bundle configure page
**So that** I know where to manage my tier pill configuration without leaving the admin app

**Acceptance Criteria:**

- [ ] Given I am on the full-page bundle configure page (`/app/bundles/full-page-bundle/configure/:bundleId`), the left-hand navigation includes a "Pricing Tiers" entry.
- [ ] When I click "Pricing Tiers" in the nav, the section scrolls into view / activates.
- [ ] The section header reads "Pricing Tiers".
- [ ] A description paragraph beneath the header reads: "Configure up to 4 pricing tier pills. Shoppers can switch between tiers on the bundle page. Requires 2 or more tiers to display."
- [ ] When no tiers are configured, the section shows an empty state with the text: "No tiers configured. Add your first tier below." and an "Add tier" button.
- [ ] When at least one tier exists, the section shows the configured tiers and an "Add tier" button (disabled when 4 tiers are already configured).

---

### Story 2: Add a pricing tier

**As a** merchant
**I want** to add a tier by providing a label and selecting a bundle
**So that** shoppers on the bundle page can switch to that tier with a single click

**Acceptance Criteria:**

- [ ] Given I click "Add tier", a new tier row appears with two fields: a text field labelled "Tier label" and a bundle selector labelled "Linked bundle".
- [ ] The "Tier label" text field accepts any non-empty string up to 50 characters (e.g., "Buy 3 @ ₹499 ›").
- [ ] The "Linked bundle" selector shows a dropdown populated with all `full_page` bundles belonging to the shop that have status `draft` or `active`.
- [ ] Each option in the dropdown displays the bundle name (not the ID).
- [ ] The dropdown includes a placeholder option "Select a bundle…" that is not selectable.
- [ ] Given I have not filled both fields for a tier row, that tier is not considered complete and is not saved.
- [ ] Given I click "Add tier" when 4 tiers already exist, the button is visually disabled and clicking it has no effect.

---

### Story 3: Remove a pricing tier

**As a** merchant
**I want** to remove a tier I no longer need
**So that** my bundle page only shows the tiers I intend to offer

**Acceptance Criteria:**

- [ ] Each tier row has a "Remove" icon button (trash icon, Polaris `DeleteIcon`) aligned to the right of the row.
- [ ] Given I click "Remove" on a tier row, that row is immediately removed from the UI.
- [ ] After removing, remaining tiers are renumbered sequentially (Tier 1, Tier 2, …) in their display order.
- [ ] No confirmation dialog is shown for removal (the save bar commit/discard flow provides undo capability).

---

### Story 4: Save tier configuration

**As a** merchant
**I want** the tier configuration to be persisted when I save the bundle
**So that** my storefront reflects my changes immediately after saving

**Acceptance Criteria:**

- [ ] The "Pricing Tiers" section participates in the existing Polaris `SaveBar` dirty-state tracking — any change to tiers marks the page as dirty and triggers the "Unsaved changes" save bar.
- [ ] Given I click "Save" in the save bar, the tier config (all complete tier rows) is submitted together with the main bundle save payload.
- [ ] The save action uses `intent: "saveBundle"` (or a dedicated `intent: "saveTierConfig"`) — see architecture for decision.
- [ ] A tier row is included in the save payload only if both `label` (non-empty) and `linkedBundleId` are set.
- [ ] The server validates that each `linkedBundleId` belongs to the authenticated shop before persisting.
- [ ] On successful save, a success toast reads: "Bundle saved" (existing behavior — no new toast needed for tiers specifically).
- [ ] On validation error (e.g., a bundle ID does not belong to the shop), the save fails with a toast: "Tier configuration contains an invalid bundle. Please review and try again."

---

### Story 5: Load existing tier configuration

**As a** merchant
**I want** the existing tier configuration to be pre-populated when I open the configure page
**So that** I can review and edit tiers without re-entering them from scratch

**Acceptance Criteria:**

- [ ] Given a bundle has saved `tierConfig` data in the DB, when I open the configure page, the "Pricing Tiers" section pre-populates all saved tier rows with their labels and linked bundle names.
- [ ] If a saved `linkedBundleId` no longer corresponds to an existing bundle (deleted bundle), that tier row shows an inline warning: "This bundle no longer exists. Please select a replacement." The row remains editable.
- [ ] If `tierConfig` is null or empty, the section shows the empty state described in Story 1.

---

### Story 6: Widget renders tier pills from admin-saved config

**As a** shopper
**I want** to see the tier pill bar on the bundle page reflecting what the merchant configured in the admin
**So that** I can switch between pricing tiers without the merchant needing to touch the Theme Editor

**Acceptance Criteria:**

- [ ] Given a bundle has `tierConfig` with 2 or more complete tiers, the bundle page widget renders the tier pill bar sourcing data from the bundle API response (not from `data-tier-config` block settings).
- [ ] Given a bundle has `tierConfig` with fewer than 2 complete tiers (or `null`), no tier pill bar is rendered.
- [ ] Given a bundle has no admin-configured `tierConfig` but the Liquid block has `tier_N_label` / `tier_N_bundle_id` block settings set (legacy path), the widget falls back to reading `data-tier-config` and renders pills as before.
- [ ] Given a bundle has both admin-configured `tierConfig` (via DB/API) and `data-tier-config` block settings, the admin-configured tiers take precedence.

---

## UI/UX Specifications

### Pricing Tiers section placement

- **Location:** Left navigation of the full-page configure page, added as a new nav item after "Images & GIFs".
- **Nav item label:** "Pricing Tiers"
- **Nav item icon:** `PriceListIcon` (or `DiscountIcon` if `PriceListIcon` is unavailable in the installed Polaris version)
- **Section ID:** `pricing_tiers`

### Tier row layout

Each tier row is rendered inside a Polaris `Card` component with `padding="400"`.

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 1                                              [🗑 Remove] │
│                                                              │
│  Tier label *          Linked bundle *                       │
│  [________________]    [Select a bundle…        ▼]          │
└─────────────────────────────────────────────────────────────┘
```

- Tier number heading: Polaris `Text variant="headingSm"` e.g., "Tier 1"
- "Tier label" TextField: `maxLength={50}`, `autoComplete="off"`
- "Linked bundle" Select: options derived from fetched bundles list
- Remove button: Polaris `Button variant="plain" tone="critical"` with `DeleteIcon`

### Add tier button

- Polaris `Button variant="secondary"` with `PlusIcon`, label "Add tier"
- Disabled state when `tiers.length >= 4`

### Empty state

- Polaris `EmptyState` component inside the Card, heading "No tiers configured", description "Add your first tier below." and action button "Add tier"

### Bundle selector options format

```
[Bundle name]  — e.g., "Summer Bundle (3-piece)"
```

No ID shown in the dropdown. The ID is used internally.

---

## Data Persistence

### What is saved

`Bundle.tierConfig` (JSON, nullable) stores an ordered array of tier objects:

```json
[
  { "label": "Buy 3 @ ₹499 ›", "linkedBundleId": "clxzy12ab0000def" },
  { "label": "Buy 5 @ ₹799 ›", "linkedBundleId": "clxzy12ab0001ghi" }
]
```

- Maximum 4 entries.
- Entries without both `label` and `linkedBundleId` are stripped before persisting.
- Stored in the existing `Bundle` DB record — no new table.

### Where it is read

- Admin configure page loader: reads `bundle.tierConfig` from DB and passes it in loader data.
- Bundle proxy API (`/api/bundle/:bundleId.json`): includes `tierConfig` in the response JSON.
- Widget JS: reads `tierConfig` from the API response after bundle data fetch.

---

## Backward Compatibility Requirements

- **Existing bundles:** `Bundle.tierConfig` defaults to `null`. No existing bundle is affected.
- **Existing Theme Editor config:** The Liquid block continues to build `data-tier-config` from block settings. The widget checks for API-sourced tier config first; if absent, it falls back to `data-tier-config`. Merchants who configured tiers in the Theme Editor see no change until they configure tiers in the admin (at which point the admin config takes precedence).
- **Migration strategy:** A single nullable JSON column addition (`ALTER TABLE "Bundle" ADD COLUMN "tierConfig" JSONB`) — zero-downtime on PostgreSQL.

---

## Out of Scope (explicit)

- Drag-and-drop tier reordering.
- Per-tier images or metadata beyond label and bundle ID.
- Tier pills for product-page bundles.
- Analytics per tier.
- Writing tier config to a Shopify page metafield.
- More than 4 tiers.
- Tier configuration in the Shopify Theme Editor (existing behavior is preserved but not enhanced).
