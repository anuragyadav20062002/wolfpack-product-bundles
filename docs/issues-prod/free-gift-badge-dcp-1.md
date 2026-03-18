# Issue: Free Gift Badge — DCP Asset Picker

**Issue ID:** free-gift-badge-dcp-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 23:00

## Overview
Replace the plain `freeGiftBadgeUrl` text field in the DCP "Widget Style" settings with a FilePicker that browses/uploads Shopify store files (PNG/SVG). Add "Widget Style" to the DCP sidebar. Add image badge rendering to the full-page widget.

## Progress Log

### 2026-03-19 22:00 - Starting Implementation
- Feature pipeline complete (BR, PO, Architecture, SDE plan)
- Starting Phase 1: Full-page widget image badge (TDD)
- Starting Phase 2: DCP UI (FilePicker + sidebar nav)

### 2026-03-19 23:00 - Completed all phases
- Phase 1: `tests/unit/assets/bundle-widget-full-page-free-badge.test.ts` (11/11 passing) + full-page widget JS reads `--bundle-free-gift-badge-url` and renders `<img>` or "Free" text + `.fpb-free-badge-img` CSS rule
- Phase 2: `NavigationSidebar.tsx` adds "Widget Style" nav item under General; `WidgetStyleSettings.tsx` replaces manual URL TextField with `<FilePicker hideCropEditor>` outside `isBottomSheet` gate
- Phase 3: `WIDGET_VERSION` bumped `2.0.0` → `2.1.0`; `npm run build:widgets` ran OK; CSS 95,409 B (under 100 KB limit); TS + ESLint clean
- Files changed: `app/assets/bundle-widget-full-page.js`, `extensions/bundle-builder/assets/bundle-widget-full-page.css`, `app/components/design-control-panel/NavigationSidebar.tsx`, `app/components/design-control-panel/settings/WidgetStyleSettings.tsx`, `scripts/build-widget-bundles.js`, `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`, `tests/unit/assets/bundle-widget-full-page-free-badge.test.ts`

## Phases Checklist
- [x] Phase 1: Test + full-page widget image badge
- [x] Phase 2: DCP UI (FilePicker, sidebar nav)
- [x] Phase 3: Widget rebuild (v2.1.0)
- [x] Phase 4: Commit
