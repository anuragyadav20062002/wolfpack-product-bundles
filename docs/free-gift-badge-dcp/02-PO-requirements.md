# Product Owner Requirements: Free Gift Badge — DCP Asset Picker

## User Stories with Acceptance Criteria

### Story 1: Discover and access the Widget Style / Free Gift Badge section
**As a** merchant customizing their bundle widget via the DCP
**I want** a "Widget Style" entry in the DCP navigation sidebar
**So that** I can find and configure the free gift badge without knowing a hidden subsection key

**Acceptance Criteria:**
- [ ] Given the DCP modal is open for a product-page bundle, when I look at the left sidebar, then I see a "Widget Style" navigation item in the appropriate section group
- [ ] Given the DCP modal is open for a full-page bundle, when I look at the left sidebar, then I also see a "Widget Style" navigation item (free gift badges apply to full-page too)
- [ ] Given I click "Widget Style" in the sidebar, then the right panel shows the Widget Style settings including the free gift badge picker

### Story 2: Browse and select an existing store file as the badge
**As a** merchant
**I want** to open a file browser showing my Shopify store's image library
**So that** I can select an existing PNG or SVG as my free gift badge

**Acceptance Criteria:**
- [ ] Given the Widget Style panel is open, when I see the "Free Gift Badge" field, then a file picker UI is shown (not a raw text input)
- [ ] Given I click the file picker, when it loads, then it shows thumbnails of my store's image files (PNG and SVG)
- [ ] Given I click a thumbnail, when I confirm the selection, then the image URL is stored and a thumbnail preview is shown in the DCP
- [ ] Given no badge is selected, then the field shows an empty/dashed upload zone with a "Select image" or "Upload" label

### Story 3: Upload a new image as the badge
**As a** merchant
**I want** to upload a new PNG or SVG directly from the DCP
**So that** I don't have to leave Shopify admin or pre-upload files separately

**Acceptance Criteria:**
- [ ] Given the file picker is open, when I click "Upload", then I can select a local PNG or SVG file
- [ ] Given I select a valid file, when upload begins, then a loading indicator is shown
- [ ] Given the upload completes, when Shopify processes the file, then the new image appears in the file grid and can be selected
- [ ] Given the file exceeds 5MB or is not PNG/SVG, when validation runs, then an error message is shown and the file is not uploaded

### Story 4: Remove the badge image
**As a** merchant
**I want** to remove a previously set badge image
**So that** the widget reverts to the built-in default (SVG ribbon for product-page, "Free" text for full-page)

**Acceptance Criteria:**
- [ ] Given a badge image is set, when I click "Remove", then the preview disappears and the field returns to the empty state
- [ ] Given the badge is removed and I save, when the widget renders, then the default built-in badge is shown instead

### Story 5: Badge persists and applies to the storefront widget
**As a** merchant
**I want** my badge image selection to be saved and applied to both bundle widget types
**So that** shoppers see my branded badge on free gift slots

**Acceptance Criteria:**
- [ ] Given I select a badge and click Save in the DCP, when the save bar completes, then `freeGiftBadgeUrl` is persisted to the database
- [ ] Given a badge URL is saved, when the product-page widget renders a free gift step, then the `<img>` badge is shown on the slot card ribbon
- [ ] Given a badge URL is saved, when the full-page widget renders a free gift step, then the badge image is shown on the product card overlay (replacing or alongside the "Free" text)
- [ ] Given no badge URL is saved (empty string), when either widget renders, then the default built-in badge is displayed

### Story 6: Badge picker visible in all widget style modes
**As a** merchant using the "classic" (accordion) widget layout
**I want** the free gift badge picker to be visible even without switching to "bottom-sheet" mode
**So that** I can brand my free gift slots regardless of my chosen widget layout

**Acceptance Criteria:**
- [ ] Given the Widget Style panel is open and `widgetStyle` is "classic", when I look at the panel, then the "Free Gift Badge" picker is visible
- [ ] Given the Widget Style panel is open and `widgetStyle` is "bottom-sheet", when I look at the panel, then the "Free Gift Badge" picker is still visible
- [ ] The badge picker must NOT be inside an `{isBottomSheet && ...}` conditional block

---

## UI/UX Specifications

### Navigation Sidebar
- **Section group:** "General" (same group as Accessibility, Loading State, etc.)
- **Label:** "Widget Style"
- **Subsection key:** `"widgetStyle"`
- **Icon/indicator:** Standard sidebar item (no special icon needed)
- **Visibility:** Show for both `product_page` and `full_page` DCP modals

### Widget Style Settings Panel (`WidgetStyleSettings.tsx`)
Existing controls remain unchanged (Layout Mode toggle, bottom-sheet sub-controls).

**New / changed section — Free Gift Badge:**
- **Section label (Text variant="headingMd"):** "Free Gift Badge"
- **Description text:** "Shown on locked gift-step slot cards. Leave blank to use the built-in ribbon."
- **Component:** `<FilePicker>` (reuse existing `app/components/design-control-panel/settings/FilePicker.tsx`)
- **FilePicker props:**
  - `value={settings.freeGiftBadgeUrl ?? ""}`
  - `onChange={(url) => onUpdate("freeGiftBadgeUrl", url)}`
  - `label="Free Gift Badge"`
  - `hideCropEditor={true}` (badge is small; crop not needed)
  - `accept="image/png,image/svg+xml"`
- **Placement:** Below the bottom-sheet sub-controls section (at the bottom of the panel), outside any conditional block
- **Divider:** Add `<Divider />` above the section

### Storefront Rendering — Full-Page Widget
When `--bundle-free-gift-badge-url` is set (not `none`):
- The `.fpb-free-badge` element renders an `<img src="..." alt="Free gift" class="fpb-free-badge-img">` inside it instead of (or alongside) the "Free" text
- CSS: `.fpb-free-badge-img { width: 100%; height: 100%; object-fit: contain; }`
- When not set: existing "Free" text label behavior unchanged

---

## Data Persistence
- **Field:** `DesignSettings.freeGiftBadgeUrl String? @default("")` — already exists, no migration needed
- **Save path:** `onUpdate("freeGiftBadgeUrl", url)` → DCP state → `buildSettingsData` → `prisma.designSettings.upsert`
- **CSS variable:** `--bundle-free-gift-badge-url: url("${freeGiftBadgeUrl}")` (or `none` if empty) — already emitted by `css-variables-generator.ts`
- **Widget reads:** `getComputedStyle(document.documentElement).getPropertyValue('--bundle-free-gift-badge-url')`

## Backward Compatibility Requirements
- Existing merchants with `freeGiftBadgeUrl = ""` continue to see the built-in badge — no change
- Existing merchants who manually pasted a URL into the old TextField will see it appear as a thumbnail in the new FilePicker (the URL is still valid)
- No DB migration required

## Out of Scope (explicit)
- Crop/adjust editor for badge images (FilePicker's `hideCropEditor={true}`)
- Animated GIF badges
- Per-step badge differentiation
- Promo banner changes
- Any changes to the `app.store-files` or `app.upload-store-file` routes (reused as-is)
