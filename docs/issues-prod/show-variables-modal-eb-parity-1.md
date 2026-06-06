# Issue: Show Variables Modal — EB Parity (Discount & Pricing)

**Issue ID:** show-variables-modal-eb-parity-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 00:35

## Overview

The "Show Variables" modal in Discount & Pricing → Discount Display Options needs to be copied 100% from EB. The variables are the same; the layout and modal size need to match EB precisely. Starting point: increase modal size from `small` to give more space for the information inside.

## Progress Log

### 2026-06-01 00:00 - Planning Complete
- ✅ Located current modal: `discount-variables-modal` in FPB configure route (~line 5662)
- ✅ Current modal is `size="small"`, no intro text, no Done button, description-first layout
- ✅ Reference: `template-variables-modal` (same file, ~line 5637) has better layout
- ✅ Competitor reference: `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` (variables table)
- ✅ EB screenshot ref: `fpb-admin-discount-messaging-variables-modal.png` (not locally present)
### 2026-06-01 00:30 - Phase 1: EB Modal Inspected
- ✅ Navigated to EB Discount & Pricing section, clicked Show Variables
- ✅ Confirmed layout: heading "Variables", X close button only, 5 rows
- ✅ Each row: description (left, wraps), `{{variable}}` plain text (right, right-aligned)
- ✅ Thin s-divider between every row (not after last)
- ✅ No badge/chip on variable — plain text
- ✅ No intro paragraph, no footer Done button
- ✅ Modal is medium width

### 2026-06-01 00:35 - Phase 2: Implementation Complete
- ✅ FPB route: changed size="small" → size="medium", removed s-badge, added s-divider between rows, new discountVariableRow/discountVariableCode classes
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` (~line 5662)
- ✅ PPB route: same changes
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` (~line 5230)
- ✅ FPB CSS: added .discountVariableRow and .discountVariableCode
  - `app/styles/routes/full-page-bundle-configure.module.css` (~line 1036)
- ✅ PPB CSS: added .discountVariableRow and .discountVariableCode
  - `app/styles/routes/product-page-bundle-configure.module.css` (~line 1506)
- ✅ Verified in WPB admin — modal renders identically to EB
- ✅ ESLint: 0 errors

## Related Documentation
- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` — EB variables table (lines 269-275)
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` — Discount & Pricing section

## Phases Checklist

- [x] Phase 1: Inspect EB modal via Chrome DevTools for exact layout ✅
- [x] Phase 2: Increase modal size + restructure layout to match EB ✅
- [x] Phase 3: Verify in admin UI ✅

## Files Created/Modified (This Session)

### Phase 2:
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` (~line 5662)

---

**Remember:** Update this file BEFORE and AFTER every commit!
