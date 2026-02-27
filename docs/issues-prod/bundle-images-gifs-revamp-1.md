# Issue: Images & GIFs Section Minimal Card Revamp

**Issue ID:** bundle-images-gifs-revamp-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 02:20

## Overview

The Images & GIFs section in the full-page bundle configure page is too verbose — it has
redundant headings ("Promo Banner Background" + "Background Image"), two lines of description
text, and a heavy locked "More media options" block. Revamp to be minimal and card-based:
one compact card per media type, no redundant labels.

## Progress Log

### 2026-02-21 02:15 - Starting Implementation

Changes:
1. `FilePicker.tsx` — remove hardcoded "Background Image" label (the card header provides context)
2. `route.tsx` — replace verbose `images_gifs` section with compact card-based layout:
   - Card: icon + "Promo Banner" heading + aspect ratio hint + FilePicker
   - Simple locked row for "More media options coming soon"

Files to modify:
- `app/components/design-control-panel/settings/FilePicker.tsx`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

### 2026-02-21 02:20 - Completed

- ✅ Removed hardcoded "Background Image" label from `FilePicker.tsx` (card header provides context)
- ✅ Replaced verbose `images_gifs` block with compact card-based layout:
  - `<Card>` with ImageIcon + "Promo Banner" heading + "16:3 · 1600×280px" hint + FilePicker
  - Simple `<Box>` row with LockIcon + "More media options coming soon"
- ✅ 0 ESLint errors (265 pre-existing warnings)
- Files modified: `FilePicker.tsx`, `route.tsx`

## Phases Checklist

- [x] Remove label from FilePicker
- [x] Revamp images_gifs section in route.tsx
- [x] Lint both files
- [x] Commit
