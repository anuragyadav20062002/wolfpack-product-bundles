# Issue: DCP FPB/PDP Preview — Pixel-Perfect Redesign + Footer Layout Toggle

**Issue ID:** dcp-fpb-preview-redesign-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-25 00:15

## Overview

Two DCP preview problems fixed:

**FPB Preview:**
- Both `full-page-side-panel` and `full-page-footer` were rendered simultaneously. The real
  widget only shows one based on `footerLayout` setting (sidebar vs floating).
- Added a "Sidebar | Floating Footer" toggle to `PreviewPanel` so merchants can preview both layouts.
- Split `fpbPageHtml` into `fpbSidebarHtml` (uses `.layout-sidebar` + `.sidebar-layout-wrapper`)
  and `fpbFloatingHtml` (uses `.full-page-footer.floating-card`) matching real widget layout classes.
- Route now accepts `?footerLayout=sidebar|floating` parameter.

**PDP Preview:**
- The modal was completely invisible — the preview used wrong class names (`bundle-modal-overlay`,
  `bundle-widget`) that don't exist in the CSS.
- Root cause: The real PDP widget is a **bottom drawer** (`position:fixed; bottom:0; left:0; right:0;
  height:90vh; border-radius:24px 24px 0 0`) controlled by `.bundle-builder-modal.active` class.
  The `.bundle-builder-modal { display:none }` by default; `.active` makes it `display:flex`.
- Fixed by using the correct `.bundle-builder-modal.active` structure with `.modal-overlay` + `.modal-content`.

## Files Modified

- `app/routes/api/api.preview.$type.tsx` — rewrote FPB HTML (sidebar + floating), fixed PDP HTML
- `app/components/design-control-panel/preview/PreviewPanel.tsx` — added footer layout toggle + `bundleType` usage

## TODO (separate issues to track)

- `fpb-trash-icon-remove-audit-1`: Audit if FPB trash icons correctly remove the product selection
  from **both** the product grid AND the footer area, for **both** sidebar and floating footer layouts.

- `dcp-pdp-preview-overflow-1`: Further audit if any PDP preview content overflows or clips out of
  the preview area at 1440×900 scale (observed in screenshot but may improve with bottom-drawer fix).

## Progress Log

### 2026-03-25 00:00 - Starting implementation

### 2026-03-25 00:15 - All phases completed

- ✅ Phase 1: Rewrote FPB HTML — split into sidebar + floating variants
  - `fpbSidebarHtml`: `.bundle-widget-full-page.layout-sidebar` + `.sidebar-layout-wrapper`
  - `fpbFloatingHtml`: standard layout + `.full-page-footer.floating-card.is-open`
  - Added `getFpbHtml(footerLayout)` helper
  - Loader reads `?footerLayout` URL param (default: `sidebar`)
- ✅ Phase 2: Fixed PDP HTML — `.bundle-builder-modal.active` bottom drawer structure
  - Removed fake `bundle-modal-overlay`/`bundle-widget` wrapper (not real CSS classes)
  - Uses `.bundle-builder-modal.active` → `.modal-content` (position:fixed; bottom:0; height:90vh)
  - Linted — 0 errors
- ✅ Phase 3: Added footer layout toggle to `PreviewPanel.tsx`
  - `useState<FpbFooterLayout>('sidebar')` + "Sidebar | Floating Footer" segmented button
  - Toggle appends `&footerLayout=sidebar|floating` to the iframe URL
  - Only shown for `bundleType === BundleType.FULL_PAGE`
  - Reset `iframeReadyRef` properly on `effectiveUrl` change

## Phases Checklist
- [x] Phase 1: Fix FPB HTML in preview route (sidebar + floating variants)
- [x] Phase 2: Fix PDP HTML in preview route (bottom drawer structure)
- [x] Phase 3: Add footerLayout toggle to PreviewPanel
- [x] Phase 4: Lint + commit
