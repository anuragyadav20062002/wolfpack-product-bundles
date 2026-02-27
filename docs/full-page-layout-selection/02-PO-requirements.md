# Product Owner Requirements: Full-Page Bundle Layout Selection

## User Stories with Acceptance Criteria

### Story 1: Layout Selection During Bundle Creation

**As a** merchant creating a full-page bundle,
**I want** to choose between "Footer at Bottom" and "Footer at Side" layouts,
**So that** I can pick the design that best fits my store.

**Acceptance Criteria:**

- [ ] Given the merchant is in the "Create New Bundle" modal and selects "Full Page Bundle" type, when the type is selected, then a layout selection section appears below the type selector showing two layout option cards.
- [ ] Given the layout selection is visible, the two options are displayed as visual cards in a 2-column grid, each with:
  - A schematic illustration/preview showing the layout structure
  - A title: "Footer at Bottom" or "Footer at Side"
  - A short description explaining the layout
- [ ] Given the layout cards are shown, the "Footer at Bottom" card is pre-selected by default (highlighted with blue border, matching `bundleTypeCardSelected` style).
- [ ] Given the merchant clicks a layout card, that card becomes selected (blue border) and the other deselects.
- [ ] Given the layout selection section is visible, when the merchant switches back to "Product Page Bundle" type, then the layout selection section disappears (layout is only relevant for full-page bundles).
- [ ] Given the merchant clicks "Create Bundle" with a full-page type, the selected layout value (`footer_bottom` or `footer_side`) is submitted alongside `bundleName`, `description`, and `bundleType`.

### Story 2: Layout Persisted in Database

**As a** system,
**I want** the selected layout to be stored on the Bundle record,
**So that** the storefront widget knows which layout to render.

**Acceptance Criteria:**

- [ ] Given a new full-page bundle is created with layout "Footer at Side", the `Bundle.fullPageLayout` field in the database is set to `footer_side`.
- [ ] Given a new full-page bundle is created without an explicit layout selection (e.g., old API call), the `fullPageLayout` field defaults to `footer_bottom`.
- [ ] Given an existing full-page bundle created before this feature, its `fullPageLayout` field is `footer_bottom` (migration default).
- [ ] Given a product-page bundle, the `fullPageLayout` field is `null` (not applicable).

### Story 3: Layout Exposed to Widget via API

**As a** storefront widget,
**I want** to receive the `fullPageLayout` value in the bundle JSON API response,
**So that** I can render the correct footer layout.

**Acceptance Criteria:**

- [ ] Given a full-page bundle with `fullPageLayout = footer_side`, when the widget fetches `/apps/product-bundles/api/bundle/{id}.json`, then the response includes `"fullPageLayout": "footer_side"`.
- [ ] Given a full-page bundle with `fullPageLayout = footer_bottom` (default), the response includes `"fullPageLayout": "footer_bottom"`.

### Story 4: Side Footer Layout on Storefront

**As a** customer browsing a full-page bundle with "Footer at Side" layout,
**I want** a persistent sidebar on the right showing my bundle summary,
**So that** I can see my selections, discount tiers, and navigation without scrolling.

**Acceptance Criteria:**

- [ ] Given the bundle's `fullPageLayout` is `footer_side`, the storefront renders a 2-column layout: product grid on the left (~66% width), side panel on the right (~34% width).
- [ ] The side panel contains (top to bottom):
  1. **Header**: "Your Bundle" title with a "Clear" button (trash icon + text) aligned right
  2. **Discount tier pills**: Horizontal row of discount rule tabs (e.g., "Box of 3 — 10% Off", "Box of 6 — 20% Off"), active tier highlighted with solid bg
  3. **Progress bar**: Visual progress toward the active discount tier
  4. **Selected products grid**: Grid of product thumbnail slots (filled slots show product image with red X remove button; empty slots show dashed border with + icon)
  5. **Footer nav**: Total price (with discount badge + strikethrough original) on the left, Back/Next buttons on the right
- [ ] The side panel is sticky (follows viewport scroll) so it remains visible while browsing products.
- [ ] On viewports narrower than 768px, the side panel collapses below the product grid (stacks vertically) and behaves like the bottom footer.
- [ ] The step timeline tabs remain above the full-width content area (not inside the side panel).

### Story 5: Bottom Footer Layout (Existing, Unchanged)

**As a** customer browsing a full-page bundle with "Footer at Bottom" layout,
**I want** the existing sticky bottom footer experience,
**So that** my current bundle experience is unchanged.

**Acceptance Criteria:**

- [ ] Given the bundle's `fullPageLayout` is `footer_bottom`, the storefront renders the existing full-width sticky bottom footer with the 3-section vertical stack (progress message → product tiles → Back|Total|Next nav).
- [ ] No visual or behavioral changes to the existing bottom footer layout.

### Story 6: Layout Setting on Configure Page

**As a** merchant editing an existing full-page bundle,
**I want** to view and change the layout setting on the configure page,
**So that** I can switch layouts after creation.

**Acceptance Criteria:**

- [ ] Given the merchant opens the configure page for a full-page bundle, a "Page Layout" setting appears in the settings sidebar (near the Bundle Status section).
- [ ] The setting shows two options: "Footer at Bottom" and "Footer at Side" as a `Select` dropdown or a segmented control.
- [ ] Given the merchant changes the layout and saves, the `fullPageLayout` field is updated in the database.
- [ ] The layout change takes effect on the storefront after save (next page load).

---

## UI/UX Specifications

### Create Modal — Layout Selection Section

**Trigger:** Appears when `bundleType` is set to `full_page`. Hidden when `product_page`.

**Component structure:**
```
<BlockStack gap="200">
  <Text variant="headingSm" as="h4">Page Layout</Text>
  <Text variant="bodySm" tone="subdued">
    Choose how the bundle summary is displayed
  </Text>
  <div className={dashboardStyles.bundleTypeGrid}>  <!-- reuse existing 2-col grid -->
    <!-- Footer at Bottom card -->
    <LayoutCard
      selected={fullPageLayout === 'footer_bottom'}
      onClick={() => setFullPageLayout('footer_bottom')}
      title="Footer at Bottom"
      description="Sticky footer bar at the bottom of the page with product tiles and navigation"
      illustration={<BottomFooterIllustration />}
    />
    <!-- Footer at Side card -->
    <LayoutCard
      selected={fullPageLayout === 'footer_side'}
      onClick={() => setFullPageLayout('footer_side')}
      title="Footer at Side"
      description="Sidebar panel showing bundle summary, discount tiers, and selected products"
      illustration={<SideFooterIllustration />}
    />
  </div>
</BlockStack>
```

**Card illustrations:** Simplified SVG/CSS schematics (not screenshots) showing:
- **Bottom footer card:** A rectangle with a horizontal bar at the bottom (representing the sticky footer), product grid above
- **Side footer card:** A rectangle split into 2 columns — wider left column (product grid), narrower right column (sidebar panel)

**Styling:** Reuse the existing `bundleTypeCard` / `bundleTypeCardSelected` CSS classes from `dashboard.module.css`.

### Configure Page — Layout Dropdown

**Component:** Polaris `Select` dropdown, placed in the settings sidebar above or below the Bundle Status section.

```tsx
<Select
  label="Page Layout"
  options={[
    { label: "Footer at Bottom", value: "footer_bottom" },
    { label: "Footer at Side", value: "footer_side" },
  ]}
  value={fullPageLayout}
  onChange={setFullPageLayout}
/>
```

### Hidden Form Field (Create Modal)

```tsx
<input type="hidden" name="fullPageLayout" value={fullPageLayout} />
```

Only included when `bundleType[0] === 'full_page'`.

---

## Data Persistence

### Database

- **New field:** `Bundle.fullPageLayout` — `FullPageLayout` enum (`footer_bottom | footer_side`)
- **Default value:** `footer_bottom`
- **Nullable:** Yes (null for product-page bundles; treated as `footer_bottom` in widget code)
- **Migration:** `ALTER TABLE Bundle ADD COLUMN fullPageLayout TEXT DEFAULT 'footer_bottom'` (Prisma handles via `@default`)

### API Response

The `/api/bundle/{id}.json` endpoint includes `fullPageLayout` in the response payload alongside existing bundle fields.

### Liquid Template

A new `data-full-page-layout` attribute is not needed on the Liquid template — the widget already fetches the bundle JSON via API and will read `fullPageLayout` from there.

---

## Backward Compatibility Requirements

- Existing full-page bundles will have `fullPageLayout = null` in the database. The widget must treat `null` and `footer_bottom` identically.
- The Prisma migration must use `@default(footer_bottom)` so new records automatically get the default.
- No changes to the product-page bundle flow.
- The `DesignSettings` DCP system continues to work — side footer uses the same CSS custom properties where applicable, with additional side-specific variables only where needed.

## Out of Scope (Explicit)

- DCP preview for the side-footer layout (future enhancement)
- Theme editor setting to override layout (layout is controlled from admin DB, not theme editor)
- Side footer for product-page bundles
- Drag-and-drop reordering of products in the side panel
- Animation/transition between layout types on the configure page
