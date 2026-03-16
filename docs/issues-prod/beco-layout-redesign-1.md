---
name: beco-layout-redesign-1
description: Transform full-page bundle widget to match Beco BYOB layout and design
type: project
---

# Issue: Beco BYOB Layout Transformation for Full-Page Bundle Widget

**Issue ID:** beco-layout-redesign-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 10:00

## Overview

Transform the full-page bundle widget's visual design to match the Beco BYOB layout:
- Neutral white background (not #ECF4EC green)
- Centered max-width content container
- Square aspect-ratio product images
- Pill-shaped ATC and quantity buttons
- Floating cart card footer (fixed bottom, rounded, shadowed)
- Retain DCP (Design Control Panel) integration
- Retain loading GIF feature
- Keep all event-listener class names intact (no JS event wiring changes)

## Reference
- Beco BYOB page analyzed: https://www.letsbeco.com/pages/BYOB_13May
- Analysis doc: docs/beco-bundle-design-analysis.md
- Transformation plan: docs/beco-layout-transformation-plan.md

## Files to Modify
1. `extensions/bundle-builder/assets/bundle-widget-full-page.css` — main CSS changes
2. `app/lib/css-generators/css-variables-generator.ts` — new DCP variables
3. `scripts/build-widget-bundles.js` — version bump 1.3.4 → 1.4.0
4. `app/assets/bundle-widget-full-page.js` — build rebuilt after CSS changes
5. `app/assets/widgets/shared/component-generator.js` — optional rating row

## Phases Checklist

- [ ] Phase 1: CSS — Background, centering, card radius, image aspect-ratio
- [ ] Phase 2: CSS — Pill ATC button, pill qty controls, floating footer card
- [ ] Phase 3: CSS — New DCP variables added to css-variables-generator.ts
- [ ] Phase 4: Version bump and widget build
- [ ] Phase 5: Testing and commit

## Progress Log

### 2026-03-17 10:00 - Planning Complete
- ✅ Analyzed Beco live DOM via Chrome DevTools MCP
- ✅ Read all source files (CSS ~2400 lines, JS ~2100 lines, component-generator.js)
- ✅ Created transformation plan in docs/beco-layout-transformation-plan.md
- ✅ Created analysis doc in docs/beco-bundle-design-analysis.md
- Next: Begin Phase 1 — CSS changes

### 2026-03-17 10:05 - Phases 1–4 Completed
- ✅ Widget background: `#ECF4EC` → `#FFFFFF` (CSS + DCP default)
- ✅ Content section: `max-width: 1280px; margin: 0 auto; padding-bottom: 140px` (room for floating footer)
- ✅ Product card: `background #F8F8F8`, `border-radius 16px`, `border #ECECEC` (CSS + DCP)
- ✅ Product image: Removed fixed heights → `aspect-ratio: 1 / 1` square (like Beco)
- ✅ ATC button: `border-radius 50px` (pill), `background #111111` (neutral, CSS + DCP)
- ✅ Inline qty controls: `border-radius 50px` (pill), `background #333333`
- ✅ Footer: `.full-page-footer.redesigned` → `position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); width: min(860px, 94vw); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.18)`
- ✅ Footer nav buttons: pill shape (border-radius 50px), neutral colors (#111111 next, white back)
- ✅ DCP css-variables-generator.ts defaults updated to match new design
- ✅ Widget version bumped: 1.3.4 → 1.4.0
- ✅ Widget bundles rebuilt (build:widgets)
- ✅ ESLint: 0 errors on modified files
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (multiple sections)
  - `app/lib/css-generators/css-variables-generator.ts` (lines 25, 41-45, 65, 68, 249-250, 322-326)
  - `scripts/build-widget-bundles.js` (line 39: version bump)
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (regenerated)
### 2026-03-17 10:30 - Admin UI Alignment Completed
- ✅ Configure page SVG (route.tsx): "Footer at bottom" SVG updated to show floating card layout; description updated to "Floating cart card"
- ✅ DCP BundleFooterPreview.tsx: `FullPageFooterLayout` wrapper updated to floating card style (border-radius 16px, box-shadow 0 10px 40px, border instead of top-only)
- ✅ DCP footer nav buttons: `borderRadius || 50` fallback for pill shape in preview
- ✅ DCP nav section padding matches new CSS (12px 24px)
- Files Modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` (SVG + description text)
  - `app/components/design-control-panel/preview/BundleFooterPreview.tsx` (floating card style)
- ✅ ESLint: 0 errors on all modified files
- Next: Commit
