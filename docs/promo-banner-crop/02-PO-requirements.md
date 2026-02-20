# Product Owner Requirements: Promo Banner Image Crop Tool

**Feature ID:** promo-banner-crop
**Created:** 2026-02-20
**BR Reference:** `docs/promo-banner-crop/00-BR.md`

---

## User Stories with Acceptance Criteria

### Story 1: Open the crop editor
**As a** merchant who has selected a promo banner background image
**I want** an "Adjust Image" button next to my selected image
**So that** I can open the crop editor without navigating away

**Acceptance Criteria:**
- [ ] Given an image IS selected, the FilePicker selected-state shows an "Adjust Image" button (alongside Change and Remove)
- [ ] Given NO image is selected, the "Adjust Image" button is NOT visible
- [ ] Clicking "Adjust Image" opens the crop modal (separate from the file browse modal)
- [ ] The "Adjust Image" button is visually secondary (`variant="plain"`)

---

### Story 2: Drag the bounding box to select a crop region
**As a** merchant in the crop editor
**I want** to drag a rectangular bounding box over the image
**So that** I can choose which part of the image is shown in the promo banner

**Acceptance Criteria:**
- [ ] The crop modal opens with the full source image displayed inside a container (max-height 60vh)
- [ ] A semi-transparent dark overlay covers the areas OUTSIDE the bounding box
- [ ] The bounding box has a fixed 16:3 aspect ratio
- [ ] On initial open, the bounding box is centered over the image at 80% of the image width
- [ ] The bounding box can be dragged freely but is constrained to remain fully within the image bounds
- [ ] The bounding box shows a subtle white border with corner markers to indicate it is draggable
- [ ] Mouse cursor changes to `grab` when hovering the bounding box and `grabbing` while dragging

---

### Story 3: Confirm or cancel the crop
**As a** merchant in the crop editor
**I want** to confirm my selection or cancel without changes
**So that** I have control over whether the crop is applied

**Acceptance Criteria:**
- [ ] A "Confirm" primary button and "Cancel" secondary button appear in the modal footer
- [ ] Clicking "Confirm" closes the modal and marks the form as dirty (unsaved changes indicator)
- [ ] Clicking "Cancel" closes the modal without changing the crop state
- [ ] Pressing Escape closes the modal without saving (same as Cancel)
- [ ] The crop is NOT persisted to the DB until the merchant clicks "Save" on the configure page

---

### Story 4: Save and apply the crop
**As a** merchant on the configure page
**I want** the crop data to be saved when I click "Save"
**So that** the storefront widget displays the correct image region

**Acceptance Criteria:**
- [ ] Given a crop has been set, clicking "Save" persists both `promoBannerBgImage` and `promoBannerBgImageCrop` to the DB
- [ ] The `bundle_ui_config` metafield includes `promoBannerBgImageCrop` after save
- [ ] The widget reads the crop data and applies the correct `background-position` and `background-size` on the `.promo-banner` element
- [ ] Clicking "Discard" resets the crop to the last saved value (same discard behaviour as the image URL)

---

### Story 5: Remove or reset the crop
**As a** merchant
**I want** to remove a previously saved crop so the banner uses cover/center again
**So that** I can revert to the default display without re-uploading

**Acceptance Criteria:**
- [ ] Removing the image (via "Remove") also clears the crop data
- [ ] If a crop is set and the merchant opens the crop editor and clicks "Confirm" with the bounding box centered at full-width (i.e., no visible change), the crop data is saved (it may yield the same visual result as cover/center)
- [ ] Widget: when `promoBannerBgImageCrop` is `null` or absent, falls back to `background-size: cover; background-position: center`

---

### Story 6: Widget renders correct image region
**As a** shopper viewing a full-page bundle
**I want** the promo banner to show the merchant-configured region of the background image
**So that** the bundle's branding is displayed as intended

**Acceptance Criteria:**
- [ ] Given `promoBannerBgImageCrop` is set, the widget computes and applies `background-size` and `background-position` inline on the `.promo-banner` element
- [ ] Given `promoBannerBgImageCrop` is `null`, the widget renders with CSS cover/center (existing behaviour)
- [ ] The crop calculation produces visually accurate results — the bounding-box region fills the banner

---

## UI/UX Specifications

### "Adjust Image" button placement

Inserted into the FilePicker `trigger` selected-state, after "Remove":
```
[52×52 thumb] [filename]
              [Change] [Remove] [Adjust Image]
```

- Label: **"Adjust Image"**
- Variant: `variant="plain"` (same level as Change/Remove)
- No icon needed (keep row compact)

### Crop Modal Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Adjust image position                                    [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ░                                                      ░ │  │
│  │ ░   ╔══════════════════════════════════════╗          ░ │  │
│  │ ░   ║                                      ║          ░ │  │
│  │ ░   ║     <visible banner region>          ║          ░ │  │
│  │ ░   ║                                      ║          ░ │  │
│  │ ░   ╚══════════════════════════════════════╝          ░ │  │
│  │ ░                                                      ░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Drag the box to choose which part of the image is shown.      │
├────────────────────────────────────────────────────────────────┤
│                                         [Cancel]  [Confirm] ▶  │
└────────────────────────────────────────────────────────────────┘
```

- Modal overlay: `position: fixed; inset: 0; z-index: 199999` (above FilePicker modal at 99999)
- Dialog: `max-width: 720px; width: 90vw`
- Image container: `position: relative; overflow: hidden` (bounds clamping)
- Overlay divs: 4 quadrant `<div>` elements with `background: rgba(0,0,0,0.5)` around the bounding box
- Bounding box: `position: absolute; border: 2px solid rgba(255,255,255,0.9); cursor: grab`
- Helper text below image: `"Drag the box to choose which part of the image is shown."`

### Crop box initial state
- Width: 80% of rendered image container width
- Height: `width × (3/16)`
- Position: centered horizontally and vertically within the image

---

## Data Persistence

| Field | Location | Type | Default |
|-------|----------|------|---------|
| `promoBannerBgImageCrop` | `Bundle` Prisma model | `String?` (JSON) | `null` |
| Serialised in `bundle_ui_config` metafield | `$app:bundle_ui_config` | JSON field | `null` |

**Crop JSON format:**
```json
{ "x": 10.5, "y": 25.0, "width": 80.0 }
```
- `x`: left edge of crop box as % of image rendered width (0–100)
- `y`: top edge of crop box as % of image rendered height (0–100)
- `width`: width of crop box as % of image rendered width (0–100)
- `height` is derived: `width × (3/16)` — not stored

**Widget CSS computation from crop:**
```
backgroundSize  = `${(100 / width) * 100}%`
backgroundPositionX = `${(x / (100 - width)) * 100}%`   // clamped to [0, 100]
backgroundPositionY = `${(y / (100 - height)) * 100}%`  // clamped to [0, 100]
```
Where `height = width × (3/16)`.

---

## Backward Compatibility Requirements

- All existing bundles have `promoBannerBgImageCrop = null` after migration — widget falls back to cover/center
- Removing the image (via "Remove") also clears the crop field to `null`
- The FilePicker component's existing `onChange` interface is unchanged; crop is passed via a second prop

---

## Out of Scope (explicit)

- Server-side image cropping or transformation
- Resize handles on the bounding box
- Free aspect ratio crop
- Cropping images in the FilePicker browse grid
- Crop for non-promo-banner images
- Touch/pinch-to-zoom on the crop modal image
