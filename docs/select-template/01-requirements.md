# Requirements: Select Template — FPB + PPB Configure Routes

## Context
**FAST-TRACK** — BR covered by existing investigation.

## Audit / Prior Research Reference
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` — full EB data-flow evidence
- `internal docs/EB Implementation Reference.md` — distilled data shapes and template system
- Chrome DevTools MCP capture (2026-05-23) — EB admin Select Template overlay screenshots

Merchants currently have no way to choose between visual layout presets for their bundles from the WPB admin. The EB competitor offers a "Select template" entry point in every bundle's configure sidebar that opens a 2×2 template picker so merchants can control how their bundle renders on the storefront.

---

## Functional Requirements

- **FR-01:** FPB configure sidebar must include a "Select template" nav item that renders a 2×2 grid of 4 layout preset cards: Standard Design, Classic Design, Compact Design, Horizontal Design.
- **FR-02:** PPB configure sidebar must include a "Select template" nav item that renders a 2×2 grid of 4 template cards: Product List, Product Grid, Horizontal Slots, Vertical Slots.
- **FR-03:** Each template card shows a preview image, a display name, and a "Select"/"Selected" action button. Only one card can be selected at a time.
- **FR-04:** The selected template is persisted to the DB on save (`wpbLayoutTemplate` + `wpbPresetId` on the `Bundle` model).
- **FR-05:** A "Customize Colors & Language" shortcut button links to the Design Control Panel.
- **FR-06:** The section is additive — no existing fields are removed or renamed.

## Out of Scope
- Storefront widget rendering differences per preset (separate issue — this slice is admin-only persistence).
- DCP controls for template selection (template is per-bundle, not theme-level).
- Cart property rename (`_wolfpackProductBundle:OfferId` → WPB prefix) — separate storefront issue.
- Bundle Settings and Bundle Visibility UI rewrites — separate slices.

---

## Acceptance Criteria

### FR-01 / FR-02 — Nav item present
- [ ] Given a merchant opens FPB configure, they see "Select template" in the left nav.
- [ ] Given a merchant opens PPB configure, they see "Select template" in the left nav.
- [ ] Clicking "Select template" renders the template grid in the main content area.

### FR-03 — Template card UI
- [ ] FPB shows exactly 4 cards: Standard Design, Classic Design, Compact Design, Horizontal Design.
- [ ] PPB shows exactly 4 cards: Product List, Product Grid, Horizontal Slots, Vertical Slots.
- [ ] The currently selected template's card button shows "Selected"; all others show "Select".
- [ ] Clicking "Select" on an unselected card marks it as selected (and deselects the previous one).

### FR-04 — Persistence
- [ ] On save, `wpbLayoutTemplate` and `wpbPresetId` are written to the DB.
- [ ] On reload, the previously saved template is shown as selected.
- [ ] FPB always saves `wpbLayoutTemplate = "FBP_SIDE_FOOTER"` regardless of which preset is chosen.
- [ ] PPB saves `wpbLayoutTemplate = "PDP_INPAGE"` for Product List / Product Grid, and `"PDP_MODAL"` for Horizontal Slots / Vertical Slots.
- [ ] `wpbPresetId` is `null` when no template has been selected.

### FR-05 — DCP shortcut
- [ ] A "Customize Colors & Language" button links to the DCP route.

### FR-06 — Non-regression
- [ ] Existing nav sections (Step Setup, Discount & Pricing, Bundle Visibility, Bundle Settings) are unaffected.
- [ ] `templateName` field (Shopify theme template) is untouched.

---

## UI/UX Spec

**Section header:**
- Heading: "Customize your bundle"
- Subheading: "Choose a design that suits your needs and fits your brand"
- Top-right: `s-button variant="secondary"` → "Customize Colors & Language" → navigates to DCP

**Template grid:** 2×2 `s-grid columns="2"` inside an `s-section`.

**Each card:**
```
┌─────────────────────────────────┐
│  [preview image — 100% width]   │
│  Template Name                  │
│                 [Select button] │
└─────────────────────────────────┘
```
- `s-button variant="primary"` when selected (text: "Selected", disabled-looking)
- `s-button variant="secondary"` when not selected (text: "Select")

**FPB template card definitions:**

| Display Name     | wpbPresetId  | wpbLayoutTemplate  |
|------------------|--------------|--------------------|
| Standard Design  | STANDARD     | FBP_SIDE_FOOTER    |
| Classic Design   | CLASSIC      | FBP_SIDE_FOOTER    |
| Compact Design   | COMPACT      | FBP_SIDE_FOOTER    |
| Horizontal Design| HORIZONTAL   | FBP_SIDE_FOOTER    |

**PPB template card definitions:**

| Display Name      | wpbPresetId | wpbLayoutTemplate |
|-------------------|-------------|-------------------|
| Product List      | CASCADE     | PDP_INPAGE        |
| Product Grid      | COGNIVE     | PDP_INPAGE        |
| Horizontal Slots  | MODAL       | PDP_MODAL         |
| Vertical Slots    | SIMPLIFIED  | PDP_MODAL         |

---

## Data Changes

New fields on `Bundle` Prisma model:
```prisma
wpbLayoutTemplate  String?   // "FBP_SIDE_FOOTER" | "PDP_INPAGE" | "PDP_MODAL"
wpbPresetId        String?   // "STANDARD" | "CLASSIC" | "COMPACT" | "HORIZONTAL" | "CASCADE" | "COGNIVE" | "MODAL" | "SIMPLIFIED"
```

---

## Risks

| Risk | Mitigation |
|---|---|
| FPB handler parses inline (no parsers.ts) — new fields must follow same pattern | Add `parseWpbTemplate` shared function; FPB calls inline; PPB calls via spread |
| Preview images not available from WPB CDN | Use static placeholder divs with descriptive text initially; image URLs can be added once assets are ready |
