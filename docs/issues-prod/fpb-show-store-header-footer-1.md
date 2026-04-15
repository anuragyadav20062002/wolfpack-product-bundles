# Issue: Show Store Header & Footer on Full-Page Bundle

**Issue ID:** fpb-show-store-header-footer-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-07
**Last Updated:** 2026-04-07 12:00

## Overview
The full-page bundle widget hides the store's native header and footer using CSS `display: none !important` rules. This disconnects the bundle page from the store's navigation and branding. The fix removes these hiding rules so the store chrome renders normally.

## Root Cause
CSS in `bundle-widget-full-page.css` lines 2232-2259 uses `body:has(.bundle-widget-full-page)` selectors to hide header, footer, nav, breadcrumb, and announcement-bar elements, plus strips body/main margins and forces full-width.

## Progress Log

### 2026-04-07 12:00 - Starting implementation
- Removing header/footer hiding CSS rules
- Adjusting min-height from 100vh to auto
- Bumping WIDGET_VERSION from 2.4.6 to 2.4.7
- Files to modify: bundle-widget-full-page.css, build-widget-bundles.js

## Related Documentation
- Research: docs/fpb-store-header-footer/00-research.md
- Plan: .claude/plans/flickering-sauteeing-pebble.md

## Phases Checklist
- [x] Remove hiding CSS rules
- [x] Adjust widget container min-height
- [x] Bump WIDGET_VERSION (2.4.6 -> 2.4.7)
- [x] Build widgets
- [x] Verify CSS file sizes (95,103 B — under 100,000 B limit)
- [ ] Visual verification on test store (requires deploy)
