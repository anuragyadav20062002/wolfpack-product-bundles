# Issue: Discount Section UI Redesign

**Issue ID:** discount-section-ui-redesign-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 13:00

## Overview

UI/UX improvements to the Discount & Pricing section of the FPB configure page,
plus sidebar nav status indicators. All changes are scoped to route.tsx and the
CSS module. No new DB fields, API routes, or Shopify interactions.

## Changes

- Q1: Enable toggle — s-checkbox → s-switch (inline in card header)
- Q2: Discount Type + Add Rule always visible, disabled/grayed when toggle off
- Q3: Display Options card split into a separate always-visible card (grayed when off)
- Q5: Blue info tip box explaining how cart-transform discounts work
- Q6: Variables helper replaced with compact inline reference grid (no accordion)
- Q7: "None" badge on Discount & Pricing sidebar nav item when discount is disabled

## Phases Checklist

- [x] Issue file created
- [x] Q1: s-switch enable toggle (inline in card header)
- [x] Q2: Always-visible Discount Type + Add Rule (grayed at 0.45 opacity when off)
- [x] Q3: Display Options as separate always-visible card (grayed when off)
- [x] Q5: Blue info box (#e8f4fd) explaining cart-transform discount behaviour
- [x] Q6: Compact 2-column variables reference grid replaces verbose accordion
- [x] Q7: "None" badge on Discount & Pricing nav item when disabled
- [x] Lint (0 errors) + commit

## Related Documentation

- Design image: Image #15 (cached in session)
- Track A (progress bar): docs/issues-prod/fpb-discount-progress-bar-1.md

## Progress Log

### 2026-05-11 13:00 — Implementation complete
- Q1: s-switch in card header (inline with title/description)
- Q2: Discount Type select + rules always rendered; wrapper div opacity/pointer-events
- Q3: Display Options moved to its own s-section below main card, always visible
- Q5: Blue info box (background #e8f4fd, border #c4dff5, text #0c4a82)
- Q6: Replaced <details> accordion with 2-column inline grid of 6 key variables
- Q7: s-badge "None" shown next to "Discount & Pricing" nav item when disabled
- Lint: 0 errors on route.tsx

### 2026-05-11 12:30 — Starting implementation
- All changes scoped to route.tsx + CSS module
- No new DB fields, no API changes required
- No feature pipeline needed (pure UI restructure of existing section)
