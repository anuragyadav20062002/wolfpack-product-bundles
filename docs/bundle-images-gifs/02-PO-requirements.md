# Product Owner Requirements: Per-Bundle Images & GIFs

**Feature ID:** bundle-images-gifs
**Created:** 2026-02-20
**BR Reference:** `docs/bundle-images-gifs/00-BR.md`

---

## User Stories with Acceptance Criteria

### Story 1: Images & GIFs nav item
**As a** merchant on the full-page bundle configure page
**I want** to see an "Images & GIFs" section in the Bundle Setup card
**So that** I can find all media settings in one place

**Acceptance Criteria:**
- [ ] Given I am on the full-page bundle configure page, the Bundle Setup card nav includes "Images & GIFs" after "Discount & Pricing"
- [ ] Given I am on the product-page bundle configure page, "Images & GIFs" does NOT appear
- [ ] Clicking "Images & GIFs" activates that section and shows the right-panel content
- [ ] The nav item uses an appropriate icon (e.g., `ImageIcon`)

---

### Story 2: Set a promo banner background image
**As a** merchant
**I want** to select a background image for the promo banner from my Shopify store files
**So that** my bundle has on-brand imagery in the promo banner

**Acceptance Criteria:**
- [ ] Given I am in the "Images & GIFs" section, I see a "Promo Banner Background" label and an image picker control
- [ ] When no image is set, the control shows a dashed upload zone: icon + "Choose background image" + "Select from store files or upload"
- [ ] Clicking the upload zone opens the FilePicker modal (browse + upload)
- [ ] Selecting an image from the picker and clicking "Select" closes the modal and shows a thumbnail preview + filename
- [ ] The section has unsaved-changes indicator consistent with the rest of the configure page
- [ ] Clicking Save persists the image URL to the bundle record

---

### Story 3: Upload a new image directly
**As a** merchant
**I want** to upload a new image to Shopify Files from within the configure page
**So that** I don't need to navigate away to Shopify Admin → Content → Files

**Acceptance Criteria:**
- [ ] Given the FilePicker modal is open, I see an "Upload image" button alongside the search field
- [ ] When I select a file ≤ 20 MB and a supported format (JPEG, PNG, WebP, GIF, SVG, AVIF), a spinning progress circle and "Uploading…" → "Processing…" label appear
- [ ] When processing completes, the circle shows a green checkmark + "Upload complete!" for 1.5s, then auto-selects the new image in the grid
- [ ] When a file > 20 MB is selected, an inline error "File must be under 20 MB." appears immediately with no server call
- [ ] When upload fails, a red error Banner appears; the user can try again

---

### Story 4: Remove the background image
**As a** merchant
**I want** to remove the promo banner background image
**So that** the banner reverts to using only the background color

**Acceptance Criteria:**
- [ ] Given an image is set, the control shows a thumbnail + filename + a "Remove" button (critical tone)
- [ ] Clicking "Remove" clears the image immediately (optimistic UI) and marks the form as dirty
- [ ] Saving after removal persists `null` to the DB and clears the image from the metafield
- [ ] After removal, the promo banner renders without a background image (CSS `background-image: none`)

---

### Story 5: Widget renders the per-bundle image
**As a** shopper viewing a full-page bundle
**I want** the promo banner to show the merchant-configured background image
**So that** the bundle feels visually branded

**Acceptance Criteria:**
- [ ] Given a bundle has `promoBannerBgImage` set, the promo banner renders with that image as background-image (cover, centered)
- [ ] Given a bundle has `promoBannerBgImage: null`, the promo banner renders with the background color only (no broken image)
- [ ] Image updates take effect after the next configure page save (no widget rebuild needed)

---

## UI/UX Specifications

### Bundle Setup nav item
- Label: **"Images & GIFs"**
- Icon: `ImageIcon` (from `@shopify/polaris-icons`)
- Position: 3rd in `bundleSetupItems`, after "Discount & Pricing"
- Visibility: rendered only when `bundle.bundleType === 'full_page'`

### "Images & GIFs" right-panel section
```
Images & GIFs
─────────────────────────
Promo Banner Background
[FilePicker control]

─────────────────────────
More media options
Coming soon: hero images, step illustrations, and GIF overlays.
```

- Section heading: `Text variant="headingMd"` — "Images & GIFs"
- Divider after heading
- Sub-heading: `Text variant="headingSm"` — "Promo Banner Background"
- Helper text: `Text tone="subdued"` — "Sets the background image for the promo banner at the top of this bundle page."
- FilePicker component (existing, unchanged)
- Divider
- Coming soon card: Polaris `Box` with muted background, lock icon, subdued text

### FilePicker (existing component — no changes needed)
- Empty state: dashed border zone, `ImageIcon`, "Choose background image", "Select from store files or upload"
- Selected state: 52×52 thumbnail + filename + Change + Remove buttons
- Modal: custom portal at `z-index: 99999`, renders above App Bridge modal

---

## Data Persistence

| Field | Location | Type | Default |
|-------|----------|------|---------|
| `promoBannerBgImage` | `Bundle` Prisma model | `String?` (nullable) | `null` |
| Serialised in `bundle_ui_config` metafield | `$app:bundle_ui_config` on bundle product variant | JSON field | `null` |

- Saved: on "Save" via the existing `saveBundle` form submission flow
- Cleared: setting to `null` on "Remove" + save

---

## Backward Compatibility Requirements

- All existing full-page bundles have `promoBannerBgImage = null` after migration — no visible change
- Widget falls back to `background-image: none` (already in CSS) when field is absent or null
- No changes to product-page bundles

## Out of Scope (explicit)

- Per-step images
- Hero image above the product grid
- Animated GIFs in the promo banner (infrastructure ready; UI deferred)
- Image transformation / CDN resizing
- DCP global background image
