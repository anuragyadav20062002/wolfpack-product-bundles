# Product Owner Requirements: Promo Banner Background Image

**Feature ID:** promo-banner-bg-image
**Created:** 2026-02-20
**Input:** docs/promo-banner-bg-image/00-BR.md
**Status:** PO Complete → Handoff to Architect

---

## User Stories with Acceptance Criteria

---

### Story 1: Pick a background image from store files

**As a** merchant configuring a full-page bundle
**I want** to select a background image from my store's Content → Files
**So that** my promo banner looks visually rich instead of a flat colour

**Acceptance Criteria:**
- [ ] Given the DCP is open on the full-page tab, when the merchant scrolls to "Promo Banner", they see a "Background Image" subsection below the existing "Background Colour" control.
- [ ] Given the subsection, when no image is selected, a button labelled "Choose from store files" is shown. No image thumbnail is displayed.
- [ ] Given the button is clicked, when the picker opens, it shows a grid of image thumbnails from the store's Content → Files, loaded via Shopify Admin GraphQL `files` query.
- [ ] Given the picker is open, each item shows: thumbnail (max 80×80px), filename (truncated at 24 chars), and date added.
- [ ] Given the picker, when the merchant types in a search box, the list filters to filenames containing that text (client-side filter on the fetched batch; server-side query filter for larger sets).
- [ ] Given the picker, when the merchant clicks an image, the picker closes and a preview thumbnail + filename appear in the subsection, replacing the "Choose" button.
- [ ] Given an image is selected and saved, the promo banner in the storefront widget renders that image as `background-image`, covering the full banner area (`background-size: cover; background-position: center`).
- [ ] Given an image is selected, the background colour control remains visible and acts as a fallback colour behind the image (useful while the image loads or if it fails).

---

### Story 2: Clear the background image

**As a** merchant
**I want** to remove the background image and revert to a solid colour
**So that** I can switch between styled and minimal looks

**Acceptance Criteria:**
- [ ] Given an image is currently selected, a "Remove image" link/button appears next to the thumbnail.
- [ ] Given "Remove image" is clicked, the thumbnail disappears and "Choose from store files" button reappears.
- [ ] Given the settings are saved with no image, the widget renders with only the solid background colour, as it does today.
- [ ] Given the settings are saved with no image, `promoBannerBgImage` is stored as `null` (not an empty string).

---

### Story 3: Load more files

**As a** merchant with a large file library
**I want** the picker to load more images beyond the initial 25
**So that** I can find the right image even in a large library

**Acceptance Criteria:**
- [ ] Given the picker has loaded 25 files and the store has more, a "Load more" button appears at the bottom of the grid.
- [ ] Given "Load more" is clicked, the next 25 files are appended to the grid using the GraphQL cursor.
- [ ] Given all files have been loaded, the "Load more" button is hidden.

---

### Story 4: Persistence and reload

**As a** merchant
**I want** my selected image to persist after saving and reloading the DCP
**So that** my settings are not lost

**Acceptance Criteria:**
- [ ] Given a background image has been selected and saved, when the DCP page is refreshed, the same image thumbnail and filename appear in the Background Image subsection.
- [ ] Given the widget CSS is regenerated after save, `--bundle-promo-banner-bg-image` is set to the CDN URL.
- [ ] Given the page is reopened, the solid background colour control still shows the currently saved colour.

---

## UI/UX Specifications

### Location
- **Panel:** DCP → Full Page tab → Promo Banner Settings section
- **Position:** Immediately below the existing "Background Colour" colour picker, above "Border Radius"

### Background Image Subsection

**Label:** "Background Image" (same style as other DCP section labels)

**State A — No image selected:**
```
[ Background Image ]
[ Choose from store files ▼ ]   ← Polaris Button, variant="plain" with icon
```

**State B — Image selected:**
```
[ Background Image ]
[ 🖼 bundle_hero.png  ×  Remove ]  ← thumbnail (48×48), filename, remove link
```

### File Picker Modal

- **Component:** Polaris `Modal` (title: "Choose background image")
- **Search:** Polaris `TextField` (placeholder: "Search files…") at top of modal
- **Grid:** Polaris `ResourceList` or simple CSS grid (3 columns on desktop, 2 on mobile)
  - Each card: 80×80 thumbnail, filename (truncated), date
  - Selected state: blue border ring
- **Footer:** "Load more" `Button` (plain) if `pageInfo.hasNextPage` is true
- **Actions:** "Select" (primary, disabled until an item is chosen), "Cancel"

### Exact labels
| Element | Label |
|---|---|
| Subsection heading | `Background Image` |
| Empty state button | `Choose from store files` |
| Modal title | `Choose background image` |
| Search placeholder | `Search files…` |
| Load more | `Load more` |
| Select action | `Select` |
| Remove link | `Remove image` |

---

## Data Persistence

| What | Where | Format |
|---|---|---|
| Selected image CDN URL | `DesignSettings.promoBannerSettings` Json column | `{ "promoBannerBgImage": "https://cdn.shopify.com/s/files/..." }` |
| No image selected | Same field | `{ "promoBannerBgImage": null }` |

- The `promoBannerSettings` Json column already exists (migration `20260128183103`). **No new migration required.**
- The new field is simply added to the object stored in that column alongside the 11 existing fields.

---

## Backward Compatibility Requirements

- All existing `DesignSettings` rows that have no `promoBannerBgImage` key must continue to render with `promoBannerBgColor` as the solid background. The CSS variable `--bundle-promo-banner-bg-image` must default to `none` when not set.
- The widget CSS rule change must not alter the appearance of banners that have no image configured — this means `background-image: none` (the default) must behave identically to the current `background: <colour>` rule.
- Widget bundle must be rebuilt and committed.

---

## Out of Scope (explicit)

- Uploading new images from within the DCP (merchant uploads separately via Shopify Admin → Content → Files).
- Product-page bundle promo banner.
- Overlay/tint colour controls on top of the image.
- Video or animated backgrounds.
- Responsive art direction (different images per breakpoint).
- The `bundle` field in `files` query (we only need public CDN URL, not product association).
