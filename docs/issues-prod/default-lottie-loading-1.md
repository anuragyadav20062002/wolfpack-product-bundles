# Issue: Default Lottie Loading Animation

**Issue ID:** default-lottie-loading-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 10:30

## Overview
Replace the plain CSS spinner fallback with a polished animated SVG loading animation (designed from Lottie) that plays by default when a merchant hasn't uploaded a custom loading GIF for their bundle. Both product-page and full-page widgets are affected.

## Progress Log

### 2026-02-24 10:00 - Starting Implementation
- Feature pipeline completed (BR → PO → Architecture)
- Architecture decision: Embedded SVG+CSS keyframes (zero library overhead)
- Files to create: `default-loading-animation.js`, `default-loading-animation.json`
- Files to modify: `build-widget-bundles.js`, both widget JS files, `bundle-widget.css`
- Next: Implement all changes

### 2026-02-24 10:30 - Completed Implementation
- ✅ Created `app/assets/widgets/shared/default-loading-animation.js` — SVG animation factory with idempotent CSS injection
- ✅ Created `app/assets/widgets/shared/default-loading-animation.json` — Lottie JSON design source reference
- ✅ Updated `scripts/build-widget-bundles.js` — added new module to SHARED_MODULES array
- ✅ Updated `app/assets/bundle-widget-product-page.js` — replaced spinner with `createDefaultLoadingAnimation()`
- ✅ Updated `app/assets/bundle-widget-full-page.js` — replaced spinner with `createDefaultLoadingAnimation()`
- ✅ Updated `extensions/bundle-builder/assets/bundle-widget.css` — replaced spinner styles with animation styles
- ✅ Built widgets successfully — both bundles compile, ~1KB size increase
- ✅ Verified: old spinner class removed, new animation present in both bundles
- ✅ Lint passed (zero errors)
- Files changed: 8 files (2 new, 6 modified)

## Related Documentation
- `docs/default-lottie-loading/00-BR.md`
- `docs/default-lottie-loading/02-PO-requirements.md`
- `docs/default-lottie-loading/03-architecture.md`
- `docs/default-lottie-loading/04-SDE-implementation.md`

## Phases Checklist
- [x] Phase 1: Feature pipeline (BR → PO → Architecture)
- [x] Phase 2: Create default animation module + Lottie JSON source
- [x] Phase 3: Update build script
- [x] Phase 4: Update widget showLoadingOverlay() in both widgets
- [x] Phase 5: Add CSS keyframe styles
- [x] Phase 6: Build widgets and verify
- [x] Phase 7: Lint, write SDE doc, commit
