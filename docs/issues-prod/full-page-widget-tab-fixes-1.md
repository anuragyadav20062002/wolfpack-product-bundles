# Issue: Full-Page Widget Tab and Instruction Text Fixes

**Issue ID:** full-page-widget-tab-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 13:30

## Overview
Three fixes needed for full-page bundle widget and admin configure page:

### Bug 1: Step name with HTML special chars breaks tab rendering
Step names containing `<` or `>` (e.g., `1<QTY<4`) are rendered via `innerHTML`, causing the browser to parse them as HTML tags. This breaks the tab display and any instruction text.

### Bug 2: Tab hint text should be on separate line
The condition hint (e.g., "Select 1+") in the step tab should be on a new line below the step name, not inline. Need to add a `tab-hint` element with the condition summary.

### Bug 3: Remove "Open in theme editor" button from full-page configure page
The "Open in theme editor" button and its references should be removed from the full-page bundle configure page.

### Bug 4: Remove instruction text setting and CSS
The `custom_instruction` theme editor setting and `.bundle-instruction` CSS class are remnants of an old design. Remove them entirely so merchants can't set instruction text.

## Progress Log

### 2026-02-24 13:00 - Starting Investigation
- Identified HTML escaping issue with step names in `createStepTimeline()` (line 838)
- Found `.tab-hint` CSS class exists but is never rendered in JS
- Need to find and fix the instruction text display
- Need to find "Open in theme editor" button in configure route

### 2026-02-24 13:30 - Completed All Fixes
- **HTML escaping**: Added `_escapeHTML()` helper to escape `&`, `<`, `>`, `"` in step names. Applied to all `tab-name` renders in `createStepTimeline()`, `getFormattedHeaderText()`, `updateModalHeaderText()`, and modal empty state cards.
- **Tab hint**: Added `_getConditionHint()` that generates short hint text (e.g., "Select 1+", "Select exactly 3", "Select up to 5") from step condition operator/value. Renders as `<span class="tab-hint">` below `tab-name` in empty step tabs (CSS class already existed).
- **Instruction text removal**: Removed `custom_instruction` setting from Liquid template schema, `data-custom-instruction` attribute from HTML, `customInstruction` from JS config, `.bundle-instruction` CSS from both CSS files, and translation strings.
- **Open in Theme Editor button**: Removed `secondaryActions` prop from `<Page>` component in configure route.
- Built widgets: `npm run build:widgets` — both bundles built successfully.
- ESLint: 0 errors (warnings are pre-existing).

Files modified:
- `app/assets/bundle-widget-full-page.js` — HTML escaping + tab-hint generation
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` — removed custom_instruction setting and data attribute
- `extensions/bundle-builder/locales/en.default.schema.json` — removed translation strings
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — removed .bundle-instruction CSS
- `extensions/bundle-builder/assets/bundle-widget.css` — removed .bundle-instruction CSS
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — rebuilt
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` — rebuilt
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — removed secondaryActions

## Phases Checklist
- [x] Phase 1: Fix HTML escaping for step names in tabs
- [x] Phase 2: Add tab-hint with condition summary below step name
- [x] Phase 3: Remove instruction text setting and CSS from full-page layout
- [x] Phase 4: Remove "Open in theme editor" from full-page configure page
- [x] Phase 5: Build widgets
