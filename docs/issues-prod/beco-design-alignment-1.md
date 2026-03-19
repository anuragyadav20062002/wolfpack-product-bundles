# Issue: Beco BYOB Design Alignment — Full-Page Bundle Widget

**Issue ID:** beco-design-alignment-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 16:30

## Overview

Align our full-page bundle widget design with Beco BYOB (letsbeco.com) identified gaps via
Chrome DevTools MCP screenshot + DOM analysis. Both desktop and mobile improvements.

## Gap Analysis (Beco vs Ours)

### Implemented gaps:
1. **Mobile step tabs** — Ours stack vertically at <600px; Beco's scroll horizontally → fix to horizontal scroll
2. **Card dimming when step is full** — Beco dims unselected cards when step quota is met; we don't → add `dimmed` state
3. **Footer "Best Deal Unlocked!" banner** — Beco shows prominent green banner at top of footer on discount unlock; ours is inline text → add dedicated banner
4. **Footer discount badge** — Beco shows "38% OFF" badge next to total; we don't → add badge when discount active
5. **Step tab quantity hint** — Add "Pick 2" / "Pick 2–5" sub-text to step tabs showing quantity requirement

### Not implemented (requires external data):
- Star ratings / review counts (no Shopify native ratings API)
- Video promo banner (would need video URL per bundle — out of scope)

## Phases Checklist

- [x] Phase 1: CSS fixes (mobile tabs, dimmed card, footer banner, badge) ✅ Completed
- [x] Phase 2: JS logic (dimming, footer banner, discount badge, tab hints) ✅ Completed
- [x] Phase 3: DCP preview updates ✅ Completed
- [x] Phase 4: Widget rebuild + commit ✅ Completed

## Progress Log

### 2026-03-17 14:00 - Analysis Complete, Starting Implementation
- ✅ Captured Beco desktop + mobile screenshots via Chrome DevTools MCP
- ✅ Inspected Beco DOM structure (card HTML, footer callout, step tabs, grid)
- ✅ Read all relevant source files (widget JS, CSS, DCP preview components)
- Next: Implement CSS and JS changes

### 2026-03-17 15:30 - Phase 1 & 2: CSS + JS Completed
- ✅ CSS: Mobile step tabs `@media (max-width: 600px)` changed to horizontal scroll (`flex-wrap: nowrap; overflow-x: auto`)
- ✅ CSS: `.product-card.dimmed` state (opacity 0.42, pointer-events none, grayscale 15%)
- ✅ CSS: `.footer-discount-badge` (green pill, "N% OFF")
- ✅ CSS: `.footer-success-banner` with slide-in animation
- ✅ CSS: `.tab-quantity-hint` styles
- ✅ JS: `getStepQuantityHint(step)` helper — reads conditionOperator/Value, returns "Pick 2", "Pick 2–5", "Up to 5" etc.
- ✅ JS: Step tabs now render `<span class="tab-quantity-hint">` with hint text
- ✅ JS: `createFullPageProductGrid()` detects step capacity via `ConditionValidator.canUpdateQuantity` and adds `.dimmed` to unselected cards
- ✅ JS: `renderFullPageFooter()` — success banner element prepended to footer when discount unlocked, discount badge in total section
- ✅ Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `app/assets/bundle-widget-full-page.js`

### 2026-03-17 16:30 - Phase 3: DCP Preview Updates Completed
- ✅ `ProductCardPreview.tsx`: Added third "dimmed" card to preview grid, updated caption
- ✅ `BundleFooterPreview.tsx`:
  - Added `successMessageBgColor/TextColor/FontSize/FontWeight` props to `FullPageFooterLayout`
  - Added SECTION 0: Success Banner (green) shown when `showSuccessBanner=true`
  - Added discount badge (20% OFF pill) to total prices row in full-page preview
  - Added dedicated `footerDiscountProgress` + FULL_PAGE handler: shows both "in progress" and "when discount unlocked" states vertically
- ✅ Files Modified:
  - `app/components/design-control-panel/preview/ProductCardPreview.tsx`
  - `app/components/design-control-panel/preview/BundleFooterPreview.tsx`

### 2026-03-17 16:30 - Phase 4: Widget Rebuild + Commit
- ✅ Widget rebuilt: `npm run build:widgets` → full-page bundle 222.3 KB, product-page 127.8 KB
- ✅ ESLint: no new errors on modified TS/TSX files
- ✅ Committed all changes

### Key Achievements:
- ✅ Mobile step tabs now scroll horizontally matching Beco's UX
- ✅ Card dimming when step quota is full — visual feedback matching Beco
- ✅ Prominent green success banner at top of footer on discount unlock
- ✅ Discount badge (N% OFF) shown next to total price when discount active
- ✅ Step tabs show quantity hint ("Pick 2", "Pick 2–5", "Up to 5") from step conditions
- ✅ DCP preview updated for Product Cards (dimmed state) and Footer (banner + badge)

### Impact:
- Full-page bundle widget now visually matches Beco BYOB on all major UX patterns
- Both desktop and mobile improved
- DCP lets merchants preview all new states accurately before publishing

**Status:** Ready for testing and review
