# Architecture Decision Record: Promo Banner Image Crop Tool

**Feature ID:** promo-banner-crop
**Created:** 2026-02-20
**BR Reference:** `docs/promo-banner-crop/00-BR.md`
**PO Reference:** `docs/promo-banner-crop/02-PO-requirements.md`

---

## Context

When a merchant sets a promo banner background image, the widget uses `background-size: cover; background-position: center`, clipping unpredictably based on the source image's focal point. This feature lets the merchant drag a bounding box to define exactly which region is shown.

## Constraints

- No external crop libraries (NFR-01)
- Must work with Shopify CDN image URLs (CORS-safe — CSS only, no canvas pixel access) (NFR-02)
- Must not break existing bundles (NFR-03)
- Crop modal must render above the existing FilePicker browse modal at z-index 99999 (NFR-04)

---

## Options Considered

### Option A: Extend FilePicker props + new ImageCropEditor component ✅ Recommended

Add `cropValue?: string | null` and `onCropChange?: (crop: string | null) => void` props to `FilePicker`. Extract the crop modal into a sibling `ImageCropEditor.tsx` component. The "Adjust Image" button lives inside `FilePicker`'s selected-state trigger.

**Pros:**
- Clean separation of concerns (file picker vs. crop editor)
- FilePicker's existing interface (`value`/`onChange`) is unchanged — backward compatible
- `ImageCropEditor` is independently testable
- No changes to how the configure page calls `FilePicker` (new props are optional)

**Cons:**
- Requires a new file

**Verdict: ✅ Recommended**

### Option B: Everything inline in FilePicker.tsx

Add all crop UI inline in the existing FilePicker component.

**Pros:**
- No new file

**Cons:**
- FilePicker is already ~350 lines; adding ~200 lines of crop logic makes it unmanageable
- Harder to test crop logic independently

**Verdict: ❌ Rejected**

### Option C: Separate standalone CropModal route/page

Open the crop editor in a full Remix route.

**Pros:**
- Unlimited screen real estate

**Cons:**
- Requires navigation away from the configure page (loses in-progress state)
- Much heavier than an in-page modal

**Verdict: ❌ Rejected**

---

## Decision: Option A — new `ImageCropEditor.tsx` component + FilePicker prop extension

---

## Data Model

### Prisma schema (`prisma/schema.prisma`)

```prisma
model Bundle {
  ...
  promoBannerBgImage  String? // URL of promo banner background image
  promoBannerBgImageCrop String? // JSON: { x, y, width } as percentages
  ...
}
```

### TypeScript type (`app/services/bundles/metafield-sync/types.ts`)

```typescript
export interface BundleUiConfig {
  ...
  promoBannerBgImage?: string | null;
  promoBannerBgImageCrop?: string | null;  // JSON string
}
```

### Crop JSON format

```json
{ "x": 10.5, "y": 25.0, "width": 80.0 }
```

- `x`: left edge of crop box as % of RENDERED image container width (0–100)
- `y`: top edge of crop box as % of RENDERED image container height (0–100)
- `width`: width of crop box as % of RENDERED image container width (0–100)
- `height` is derived: `width * (3/16)` — not stored (reduces storage and avoids precision drift)

---

## CSS Computation (Widget)

The crop box has a 16:3 fixed aspect ratio, identical to the banner. This means the math always produces a perfect fill regardless of the source image's natural dimensions.

```javascript
// In createPromoBanner() in bundle-widget-full-page.js
const cropRaw = this.selectedBundle && this.selectedBundle.promoBannerBgImageCrop;
if (bgImageUrl && cropRaw) {
  try {
    const crop = JSON.parse(cropRaw);
    const cw = crop.width / 100;             // fraction of container
    const ch = cw * (3 / 16);               // same aspect ratio as banner → fills height
    const cx = crop.x / 100;
    const cy = crop.y / 100;

    // Scale image so crop width fills banner width
    const bgSize = `${(1 / cw) * 100}%`;

    // CSS background-position X%: the X% point of the IMAGE aligns with X% of the ELEMENT
    // Formula: posX = cx / (1 - cw) * 100  (clamp to [0,100])
    const posX = Math.min(100, Math.max(0, (1 - cw) === 0 ? 0 : (cx / (1 - cw)) * 100));
    const posY = Math.min(100, Math.max(0, (1 - ch) === 0 ? 0 : (cy / (1 - ch)) * 100)));

    banner.style.backgroundSize = bgSize;
    banner.style.backgroundPosition = `${posX}% ${posY}%`;
  } catch {
    // Malformed crop JSON — fall through to cover/center (already set by CSS)
  }
}
```

**Mathematical proof (concrete example):**
- Image: 1600×900 natural (16:9 ratio)
- Crop: x=10%, y=25%, width=80% → box covers 1280×240 pixels of the source
- Banner: 1200×225px (16:3 ratio)
- `bgSize = 125%` → scaled image = 1500×843px
- Crop box start at scaled image: x=10%*1500=150px, y=25%*843=210px
- Box width at scaled: 80%*1500=1200px ✓ fills banner width
- Box height at scaled: 80%*3/16*843=225px ✓ fills banner height
- `posX = (0.10 / 0.20) * 100 = 50%`
- `posY = (0.25 / 0.8125) * 100 = 30.77%`

---

## Component Architecture

### New file: `app/components/design-control-panel/settings/ImageCropEditor.tsx`

```typescript
interface ImageCropEditorProps {
  imageUrl: string;
  cropValue: string | null;  // existing JSON crop or null
  onConfirm: (crop: string) => void;  // returns new JSON crop
  onClose: () => void;
}
```

**Internal state:**
```typescript
interface CropBox {
  x: number;  // pixels in rendered image container
  y: number;
  width: number;
}
```

**Render structure (uses createPortal at z-index 199999):**
```
Overlay (fixed, full screen)
  └── Dialog (max-width 720px)
       ├── Header: "Adjust image position" + ✕
       ├── Body:
       │    ├── ImageContainer (position: relative, overflow: hidden)
       │    │    ├── <img> (width: 100%, height: auto, display: block)
       │    │    ├── Overlay-top    (position: absolute, covers above cropbox)
       │    │    ├── Overlay-left   (position: absolute, covers left of cropbox)
       │    │    ├── Overlay-right  (position: absolute, covers right of cropbox)
       │    │    ├── Overlay-bottom (position: absolute, covers below cropbox)
       │    │    └── CropBox       (position: absolute, draggable, white border)
       │    └── Helper text: "Drag the box to choose which part of the image is shown."
       └── Footer: [Cancel] [Confirm ▶]
```

**Drag implementation:**
- `useRef` for container DOM element to get `getBoundingClientRect()`
- `onMouseDown` on the CropBox → set `isDragging = true`, store initial drag offset
- `onMouseMove` on the Overlay → if dragging, compute new position, clamp to bounds, update state
- `onMouseUp` / `onMouseLeave` on Overlay → `isDragging = false`
- On Confirm: convert pixel position to percentage: `{ x: (box.x / containerWidth) * 100, y: (box.y / containerHeight) * 100, width: (box.width / containerWidth) * 100 }`

**Initial crop box state when opening:**
```javascript
// On image load callback (img onLoad):
const containerWidth = containerRef.current.clientWidth;
const containerHeight = containerRef.current.clientHeight;
if (existingCrop) {
  // Restore from saved crop
  setCropBox({ x: existingCrop.x/100 * containerWidth, y: existingCrop.y/100 * containerHeight, width: existingCrop.width/100 * containerWidth })
} else {
  // Default: 80% width, centered
  const w = containerWidth * 0.8;
  const h = w * (3 / 16);
  setCropBox({ x: (containerWidth - w) / 2, y: (containerHeight - h) / 2, width: w });
}
```

### Modified file: `app/components/design-control-panel/settings/FilePicker.tsx`

**Props change:**
```typescript
interface FilePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  cropValue?: string | null;          // NEW (optional)
  onCropChange?: (crop: string | null) => void;  // NEW (optional)
}
```

**Selected-state trigger change:**
Add "Adjust Image" button and `ImageCropEditor` import:
```tsx
<Button variant="plain" size="slim" onClick={() => setCropEditorOpen(true)}>
  Adjust Image
</Button>
```

Internal `cropEditorOpen` state manages whether `ImageCropEditor` renders.
When `onConfirm` fires from the editor: call `onCropChange?.(newCrop)`.
When image is removed (`handleRemove`): also call `onCropChange?.(null)`.

---

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `promoBannerBgImageCrop String?` to `Bundle` model |
| `app/services/bundles/metafield-sync/types.ts` | Add `promoBannerBgImageCrop?: string \| null` to `BundleUiConfig` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | Include `promoBannerBgImageCrop` in `bundleUiConfig` builder |
| `app/routes/.../handlers/handlers.server.ts` | Parse `promoBannerBgImageCrop` from FormData; persist to DB |
| `app/routes/.../route.tsx` | Add `promoBannerBgImageCrop` state, ref, discard, save, pass to FilePicker |
| `app/components/design-control-panel/settings/FilePicker.tsx` | Add `cropValue`/`onCropChange` props, "Adjust Image" button, crop editor open state |
| `app/assets/bundle-widget-full-page.js` | Read `promoBannerBgImageCrop`, compute bgSize/bgPosition in `createPromoBanner()` |

## New Files

| File | Purpose |
|------|---------|
| `app/components/design-control-panel/settings/ImageCropEditor.tsx` | Draggable bounding-box crop modal |

---

## Migration / Backward Compatibility

- `promoBannerBgImageCrop` is nullable → existing rows default to `NULL`, widget falls through to `cover/center`
- `cropValue` and `onCropChange` are optional props on `FilePicker` → all existing usages unchanged
- DB can be updated via `prisma db push` (same as `promoBannerBgImage`)

---

## Testing Approach

- Unit: `ImageCropEditor` — initial crop box sizing, drag clamping math, percentage conversion on Confirm
- Unit: Widget CSS computation — given crop `{x:10,y:25,width:80}`, assert `backgroundSize` and `backgroundPosition` values
- Unit: FilePicker with `cropValue`/`onCropChange` — "Adjust Image" button only visible when `value` is set
- Manual: open crop editor, drag box to corner positions, confirm → verify storefront renders correct region
- Manual: confirm at default position → verify image renders centered
- Manual: Remove image → verify crop is cleared in form state and after save
