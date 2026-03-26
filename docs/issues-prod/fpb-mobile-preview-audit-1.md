# Issue: FPB Mobile Preview Audit — Sidebar & Floating Footer Layouts

**Issue ID:** fpb-mobile-preview-audit-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 19:30

## Overview

Mobile viewport audit (375px) of both FPB layout previews (Sidebar and Floating Footer)
surfaced two concrete layout bugs in bundle-widget-full-page.css.

## Phases Checklist

- [x] Phase 1: Sidebar step tabs full-width on mobile + floating discount badge overflow
- [x] Phase 2: Floating footer preview accuracy — callout banner state, CTA text, badge tier

## Progress Log

### 2026-03-26 19:30 - Starting Phase 1
- Audited mobile 375px via Chrome DevTools emulation on both preview pages
- Two bugs found:

**Bug 1 — Sidebar: step tabs 240px width on mobile (should be 100%)**
- Root cause: `.sidebar-layout-wrapper .step-tabs-container` has `width: 240px; min-width: 240px`
  for the desktop column layout. When `.sidebar-layout-wrapper` goes to `flex-direction: column`
  at ≤768px, there is no mobile override for the step tabs width.
- Result: step tabs only fill 240px of the 375px viewport, leaving a ~135px white gap
  to the right. The gray background + right border creates a visually broken half-width box.
- Fix: at ≤768px, override to `width: 100%; min-width: 0; flex-direction: row;
  overflow-x: auto` so tabs become a horizontal scrollable row spanning the full width.

**Bug 2 — Floating footer: discount badge overflows behind Next Step button at ≤480px**
- Root cause: `.footer-discount-badge` has `white-space: nowrap` and is inside
  `.footer-total-prices` flex row. At 375px, the footer bar has too little horizontal
  room for thumbstrip + toggle label + "$62.98" + "10% OFF" + Next Step button.
  The badge renders partially behind the CTA button.
- Fix: hide `.footer-discount-badge` at ≤480px (same breakpoint that already hides
  `footer-total-label` and `footer-total-original`). The callout banner above already
  communicates the discount info.

- Files changed: extensions/bundle-builder/assets/bundle-widget-full-page.css

### 2026-03-26 19:30 - Completed Phase 1
- ✅ Sidebar step tabs: `width: 100%; min-width: 0; flex-direction: row; overflow-x: auto` at ≤768px — tabs now span full viewport width as a horizontal scrollable row; border-right removed, border-bottom added; each tab `flex-shrink: 0; width: auto; min-width: 130px`
- ✅ Floating footer badge: `.footer-discount-badge { display: none }` inside existing `@media (max-width: 480px)` block — eliminates overflow behind Next Step button; callout banner still communicates the discount
- Files changed: extensions/bundle-builder/assets/bundle-widget-full-page.css

### 2026-03-27 - Completed Phase 2: Floating footer preview accuracy
- Root cause analysis: cross-referenced preview HTML against live widget JS (_createFooterBar line 2197, callout banner line 2094)
- ✅ Callout banner: "Add 1 more item..." → "🎉 You unlocked 20% off!" — live widget only shows footer-callout-banner in success state (discountInfo.hasDiscount = true)
- ✅ Footer toggle: "2/3 Products" → "3/3 Products" — consistent with success/unlocked state
- ✅ Thumbstrip: 3 product images (no overflow span) to match 3/3 state
- ✅ Discount badge: "10% OFF" → "20% OFF" — matches the 3-item tier (Buy 3 — Save 20%)
- ✅ Prices: $89.97 → $71.98 (3 items at 20% off) for accuracy
- ✅ CTA button: "Next Step" → "Next" — widget JS line 2264 uses 'Next' for floating footer CTA
- ✅ Removed is-open class — chevron should point down (panel closed by default)
- Note: tier pills section-awareness + step tabs hiding already correctly coded in Phase 7 (DCP_SECTION_CHANGE handler); pending SIT deployment
- Files changed: app/routes/api/api.preview.$type.tsx
