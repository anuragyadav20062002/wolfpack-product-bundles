# Issue: FPB Widget UI Redesign — Clone Target Designs

**Issue ID:** ui-redesign-fpb-clone-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 19:00

## Overview
Implement UI/UX changes to make the FPB floating footer and sidebar layouts match the target reference designs. Based on gap analysis in `ui-comparison-floating-footer-1.md` and `ui-comparison-sidebar-1.md`. No pricing logic touched.

## Changes

### Floating Footer Bar
- Make thumbnails circular (border-radius 50%) and slightly larger
- Restructure bar layout: [thumbstrip] [column: toggle/total+badge] [CTA]
- Hide back button on floating-card (not in reference)
- Discount badge already exists — visible when discount conditions met

### Sidebar
- Add "N item(s)" count label below header
- Show quantity (×N) inline with price in product rows
- Style sidebar remove button as trash icon (was ×)
- Style clear button with icon

## Progress Log

### 2026-03-20 19:00 - Starting implementation
- Audit complete: most elements exist, need wiring/CSS fixes
- Files to change: bundle-widget-full-page.js, bundle-widget-full-page.css
- Must rebuild widget bundles after JS change

### 2026-03-20 19:30 - Completed Phase 1 + 2
- Footer bar JS restructured: thumbstrip standalone (left) + centreCol stacking toggle/total (centre) + CTA (right). Back button removed from floating-card bar.
- Thumbnails now circular (border-radius 50%, 40px, box-shadow)
- New `.footer-centre` CSS class with flex-direction column
- Sidebar: item count label (`N item(s)`) added above product list
- Sidebar: qty inline with price (`×N`) in all product rows
- Sidebar: remove button upgraded to trash icon SVG
- Lint: 0 errors, build: 246.0 KB

## Phases Checklist
- [x] Phase 1: Footer bar layout restructure (JS + CSS)
- [x] Phase 2: Sidebar item count + qty display (JS + CSS)
- [x] Phase 3: Build + verify
- [ ] Phase 4: Deploy + visual test on store
