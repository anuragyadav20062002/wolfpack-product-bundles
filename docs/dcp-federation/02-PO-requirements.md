# Product Owner Requirements: DCP Federation

## User Stories with Acceptance Criteria

### Story 1: DCP Landing Page — Bundle Type Entry Cards
**As a** merchant
**I want** to see two distinct cards on the Design Control Panel landing page
**So that** I can navigate directly to the customization interface for the specific widget type I want to style

**Acceptance Criteria:**
- [ ] Given I visit `/app/design-control-panel`, I see two side-by-side cards in a `Layout` with two `Layout.Section` columns.
- [ ] Card 1 has title "Landing Page Bundles", description "Customize storefront UI for full page bundles", a "Customize" button, and an SVG illustration representing a full-page layout (multi-step page layout).
- [ ] Card 2 has title "Product Bundles", description "Customize storefront UI for product page bundles", a "Customize" button, and an SVG illustration representing a product page modal/drawer.
- [ ] Both cards use Polaris `Card` component with consistent spacing.
- [ ] On mobile viewports the two cards stack vertically.
- [ ] The page no longer shows a top-level "Open Customisations" page action button.
- [ ] The page title remains "Design Control Panel" with subtitle "Customize the appearance of your bundles".

---

### Story 2: Full-Page Bundle Customization Modal
**As a** merchant
**I want** a dedicated modal for customizing full-page bundle appearance
**So that** I only see settings relevant to the full-page widget

**Acceptance Criteria:**
- [ ] Clicking the "Customize" button on the "Landing Page Bundles" card opens a full-screen modal (`variant="max"`, `id="dcp-full-page-modal"`).
- [ ] The modal NavigationSidebar shows: Global Colors, Product Card (with all 8 sub-sections), Bundle Footer (all 5 sub-sections), Bundle Header (Tabs, Header Text), General (Empty State, Add to Cart Button, Toasts, Modal Close Button, Accessibility), Promo Banner, Pricing Tier Pills.
- [ ] The SaveBar inside this modal has `id="dcp-full-page-save-bar"`.
- [ ] Saving targets `bundleType: "full_page"` in the action POST body.
- [ ] The preview panel renders using `full_page` defaults and settings.
- [ ] Discarding reverts only full-page settings to their last-saved state.

---

### Story 3: Product Bundle Customization Modal
**As a** merchant
**I want** a dedicated modal for customizing product-page bundle appearance
**So that** I only see settings relevant to the product-page (modal/drawer) widget

**Acceptance Criteria:**
- [ ] Clicking the "Customize" button on the "Product Bundles" card opens a full-screen modal (`variant="max"`, `id="dcp-product-page-modal"`).
- [ ] The modal NavigationSidebar shows: Global Colors, Product Card (with all 8 sub-sections), Bundle Footer (all 5 sub-sections), Bundle Header (Tabs, Header Text), General (Empty State, Add to Cart Button, Toasts, Modal Close Button, Accessibility). It does NOT show Promo Banner or Pricing Tier Pills.
- [ ] The SaveBar inside this modal has `id="dcp-product-page-save-bar"`.
- [ ] Saving targets `bundleType: "product_page"` in the action POST body.
- [ ] The preview panel renders using `product_page` defaults and settings.
- [ ] Discarding reverts only product-page settings to their last-saved state.

---

### Story 4: Custom CSS Section — Per-Bundle-Type with Guide Modal
**As a** merchant
**I want** a Custom CSS section on the landing page with separate tabs for each bundle type and an accessible CSS guide
**So that** I can apply advanced CSS overrides to a specific widget without affecting the other

**Acceptance Criteria:**
- [ ] A Custom CSS section is rendered below the two bundle cards on the landing page.
- [ ] The section has two tabs: "Landing Page Bundles" and "Product Bundles", allowing the merchant to switch which bundle type's `customCss` they are editing.
- [ ] The active tab's `customCss` value is loaded from the loader data for that bundle type and editable in a monospaced textarea.
- [ ] A "CSS Guide" button opens a modal (`id="css-guide-modal"`) listing all CSS classes and variables, organized by bundle type (Shared, Product-Page Widget, Full-Page Widget, CSS Variables) — identical content to the current `CustomCssCard` collapsible reference panel.
- [ ] A "Save Custom CSS" button saves only the `customCss` field for the currently active tab's bundle type.
- [ ] The CSS guide modal is dismissible via a close button or pressing Escape.
- [ ] The security banner (warning about JS URLs and @import being stripped) is visible in the Custom CSS section.

---

### Story 5: Preview Fidelity
**As a** merchant
**I want** the preview in each customization modal to exactly match the live storefront widget appearance
**So that** I can be confident my changes are accurate before saving

**Acceptance Criteria:**
- [ ] The full-page modal preview uses `PreviewScope` with `settings` from `full_page` state and the full-page CSS files.
- [ ] The product-page modal preview uses `PreviewScope` with `settings` from `product_page` state and the product-page CSS files.
- [ ] Changing a setting in the settings panel updates the preview in real time without a page reload.
- [ ] Preview components are identical to those used in the current single-modal DCP (no regression).

---

## UI/UX Specifications

### Landing Page Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Page: "Design Control Panel"                                         │
│ Subtitle: "Customize the appearance of your bundles"                │
│ Back action: "Go to Bundles" → /app/dashboard                       │
├──────────────────────────────┬──────────────────────────────────────┤
│ Card: Landing Page Bundles   │ Card: Product Bundles                │
│  [Full-Page SVG illustration]│  [Product Page SVG illustration]     │
│  Title: Landing Page Bundles │  Title: Product Bundles              │
│  Desc: Customize storefront  │  Desc: Customize storefront UI for   │
│  UI for full page bundles    │  product page bundles                │
│  [Customize button]          │  [Customize button]                  │
├──────────────────────────────┴──────────────────────────────────────┤
│ Custom CSS Card                                                       │
│  Tabs: [Landing Page Bundles] [Product Bundles]                      │
│  [CSS Guide button]    [Security banner]                             │
│  [Monospaced textarea]                                               │
│  [Save Custom CSS button]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### SVG Illustrations
- **Landing Page Bundles SVG**: Represents a multi-step full-page layout. Show a simplified browser window outline with a left step-bar column and a right product grid. Colors: `#7132FF` accent (matches full-page defaults).
- **Product Bundles SVG**: Represents a modal/drawer overlay on a product page. Show a simplified product page background with a floating modal/drawer overlay containing tabs and product cards. Colors: `#FF6B35` or neutral black accent (matches product-page defaults).
- Both SVGs: ~160px height, centered in the card, inline SVG (not external image files).

### Navigation Sidebar — Section Visibility Rules

| Section | Full-Page Modal | Product-Page Modal |
|---------|----------------|--------------------|
| Global Colors | ✅ | ✅ |
| Product Card (+ 8 children) | ✅ | ✅ |
| Bundle Footer (+ 5 children) | ✅ | ✅ |
| Bundle Header (+ 2 children) | ✅ | ✅ |
| General (+ 5 children) | ✅ | ✅ |
| Promo Banner | ✅ | ❌ |
| Pricing Tier Pills | ✅ | ❌ |

### Custom CSS Tabs
- Use Polaris `Tabs` component
- Tab 0: "Landing Page Bundles" → edits `full_page.customCss`
- Tab 1: "Product Bundles" → edits `product_page.customCss`
- Default selected: Tab 1 (Product Bundles) — most merchants start with product-page bundles

### CSS Guide Modal
- Uses App Bridge `<Modal id="css-guide-modal">` (not `variant="max"`)
- Large modal variant or default size (not full-screen, scrollable)
- Content: identical to current `CustomCssCard` collapsible reference panel
- Has a "Close" button in the modal footer

---

## Data Persistence

### What is saved and where
- Each modal saves a `DesignSettings` row for its specific `bundleType`.
- Custom CSS: saved as `customCss` field on the `DesignSettings` row for the active tab's `bundleType`.
- The `handleSaveSettings` server action is unchanged — it already accepts `{ bundleType, settings }`.

### Backward Compatibility
- Existing `DesignSettings` rows (both `product_page` and `full_page`) remain valid.
- No Prisma schema changes required.
- No data migration required.
- The loader continues to load both bundle types; the UI simply presents them differently.

---

## Out of Scope (explicit)
- Merging the two DesignSettings rows into one
- Adding new settings fields or CSS variables
- Changing the CSS delivery API
- Changing widget JS/CSS source files
- A/B testing or feature flags
- Animation or complex transitions on the landing page cards
