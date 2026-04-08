# Issue: Hide Empty Theme Main-Page Section on Full-Page Bundle Pages

**Issue ID:** fpb-empty-main-section-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-08
**Last Updated:** 2026-04-08 10:05

## Overview
On full-page bundle pages (e.g. /pages/test1), the Dawn theme renders a "Main page" section
(`shopify-section-*__main`) that contains a hidden `<h1>` and an empty `<div class="rte">`.
This section's padding (21px top + 21px bottom) produces a 56px blank gray gap at the top of
the page, between the navbar and the bundle widget.

The existing `hide_page_title` setting in `bundle-full-page-embed.liquid` already hides the
`<h1>` via CSS, but does not collapse the section's padding, leaving the gray gap visible.

## Root Cause
- Dawn theme's main-page section always renders on `page` templates with `padding-top: 21px; padding-bottom: 21px`
- The bundle widget embed block hides the h1 via `.main-page-title { display: none }` but does
  not hide the parent section
- Result: 56px of blank padded gray space above the bundle widget

## Fix
Extend the existing `hide_page_title` CSS block in `bundle-full-page-embed.liquid` to also
hide the parent `shopify-section` using `.shopify-section:has(.main-page-title)`.

## Progress Log

### 2026-04-08 10:05 - Fix applied and verified
- Extended `hide_page_title` CSS in `extensions/bundle-builder/blocks/bundle-full-page-embed.liquid`
- Added `.shopify-section:has(.main-page-title) { display: none !important; }`
- Verified via Chrome DevTools: section hidden, widget now flush against navbar
- No widget rebuild needed (Liquid-only change)

## Related Documentation
- `extensions/bundle-builder/blocks/bundle-full-page-embed.liquid`

## Phases Checklist
- [x] Phase 1: Add CSS to hide empty section
- [x] Phase 2: Verify in storefront via Chrome DevTools
- [ ] Phase 3: Commit and deploy
