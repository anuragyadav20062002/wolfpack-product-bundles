# Product Owner Requirements: FPB Layout Selection at Creation Step

## User Stories with Acceptance Criteria

---

### Story 1: Layout Selection in Create Bundle Modal

**As a** merchant
**I want** to choose between "Floating Cart Card" and "Sidebar Panel" layouts when creating a Full Page bundle
**So that** my bundle is built with the correct structure from the start

**Acceptance Criteria:**
- [ ] Given the Create Bundle modal is open and "Full Page Bundle" is selected as the type, when the UI renders, then a layout selection step appears below the type selection.
- [ ] Given the layout step is visible, when it renders, then both "Floating Cart Card" and "Sidebar Panel" options are shown with their SVG illustrations and labels.
- [ ] Given the layout step is visible, when no option has been explicitly selected, then "Floating Cart Card" (`footer_bottom`) is pre-selected as the default.
- [ ] Given the layout step is visible, when the merchant clicks an option, then it becomes visually selected (highlighted border + background) and the other is deselected.
- [ ] Given a layout is selected and the merchant submits the creation form, then the bundle is created with `fullPageLayout` set to the chosen value.
- [ ] Given "Product Page Bundle" is selected as the type, when the UI renders, then the layout selection step is NOT shown.

---

### Story 2: Remove Layout Picker from Configure Page

**As a** merchant configuring a full-page bundle
**I want** the configure page to focus on step/product configuration
**So that** I'm not distracted by structural choices I already made at creation time

**Acceptance Criteria:**
- [ ] Given a FPB configure page loads, when the left sidebar renders, then the "Page Layout" Card (with SVG options) is no longer present.
- [ ] Given a FPB bundle with any `fullPageLayout` value saved in the DB, when the configure page loads, then the widget still renders with the correct layout (no regression).

---

### Story 3: Backward Compatibility for Existing Bundles

**As a** merchant with existing full-page bundles
**I want** my bundles to continue working as before
**So that** the UI change doesn't affect live storefronts

**Acceptance Criteria:**
- [ ] Given an existing FPB bundle with `fullPageLayout = "footer_side"`, when the configure page loads, then the bundle continues to work with sidebar layout on the storefront.
- [ ] Given an existing FPB bundle with `fullPageLayout = "footer_bottom"` (or null/default), when the configure page loads, then the bundle continues to work with floating footer on the storefront.

---

## UI/UX Specifications

### Create Bundle Modal — Layout Step

**Placement:** Below the bundle type selection cards (Product Page / Full Page), shown only when Full Page is selected. No separate "step" indicator needed — it flows naturally as an extension of the type selection.

**Container:** A `BlockStack` with a label "Choose your layout" using `Text` component (`variant="headingMd"`).

**Layout cards:**

| Property | Floating Cart Card | Sidebar Panel |
|---|---|---|
| Value | `footer_bottom` | `footer_side` |
| Label | `"Floating Cart Card"` | `"Sidebar Panel"` |
| Sub-label | `"Products grid with a floating cart footer"` | `"Products grid with a side panel cart"` |
| SVG | Existing 140×96 footer_bottom SVG | Existing 140×96 footer_side SVG |
| Default selected | ✅ Yes | ❌ No |

**Selection state (same pattern as existing configure page):**
- Selected: `border: 2px solid var(--p-color-border-interactive)`, `background: var(--p-color-bg-surface-selected)`
- Unselected: `border: 2px solid transparent`, `background: var(--p-color-bg-surface)`
- Cursor: `pointer`
- Border radius: `8px`
- Padding: `12px`

**Cards layout:** Side by side using `InlineGrid columns={2} gap="300"`.

### Form submission

A hidden input `<input type="hidden" name="fullPageLayout" value={selectedLayout} />` is appended to the create bundle form alongside the existing `bundleType` hidden input.

### Configure Page — Removal

Remove the entire `<Card>` block (lines 1516–1623 in `route.tsx`) that contains the "Page Layout" heading and the two SVG option cards. No replacement UI is added.

---

## Data Persistence

- **Field:** `Bundle.fullPageLayout` (existing Prisma field, `FullPageLayout?`, default `footer_bottom`)
- **Written at:** Bundle creation via `handleCreateBundle` in `handlers.server.ts`
- **Read by:** Widget JS (`this.selectedBundle.fullPageLayout`) — unchanged
- **No migration required** — field already exists on all bundles

---

## Backward Compatibility Requirements

- All existing FPB bundles have `fullPageLayout` set (default `footer_bottom`). No data migration needed.
- The configure page removal only affects the UI — the saved value in DB is unaffected.
- The widget reads `fullPageLayout` from the bundle config metafield — this pipeline is unchanged.

---

## Out of Scope (explicit)

- Adding a third layout option
- Making layout editable on the configure page (it's set at creation; a future "change layout" flow can be added separately)
- Any Prisma schema changes
- Widget JS changes
- Changing the configure page tab/navigation structure
