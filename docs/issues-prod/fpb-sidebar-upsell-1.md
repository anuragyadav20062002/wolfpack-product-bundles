# Issue: FPB Sidebar Upsell Slot

**Issue ID:** fpb-sidebar-upsell-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20 17:20

## Overview
Add a visually distinct `.sidebar-upsell-slot` element inside the sidebar panel,
positioned below the items list and above the total row. Shows discount progress
message (next tier incentive or success state). Hidden when discount pricing is
disabled or no rules apply.

## Related Documentation
- `docs/storefront-ui-26.05-improvements/01-requirements.md` — FR-04
- `docs/storefront-ui-26.05-improvements/02-architecture.md` — FR-04 section

## Phases Checklist
- [x] Read renderSidePanel() to find correct insertion point
- [x] Inject .sidebar-upsell-slot in renderSidePanel()
- [x] CSS for .sidebar-upsell-slot (+ .reached state)
- [x] Build + minify + lint + commit

## Progress Log

### 2026-04-20 17:10 - Starting Implementation
- Read renderSidePanel() — insertion point: after _renderFreeGiftSection, before divider

### 2026-04-20 17:20 - Completed Implementation
- ✅ `.sidebar-upsell-slot` injected in renderSidePanel() after free gift section
- ✅ Hidden when pricing disabled or no rules apply (conditional rendering)
- ✅ `.sidebar-upsell-slot--reached` state for when discount threshold is met (green)
- ✅ CSS: dashed border + accent bg for progress state; solid green for reached state
- ✅ Widget rebuilt + minified (81.3 KB CSS — well under 100KB Shopify limit)
- ✅ Lint: zero errors
- Files modified: bundle-widget-full-page.js, bundle-widget-full-page.css
