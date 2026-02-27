# Issue: DCP UI Fixes — 5 targeted improvements

**Issue ID:** dcp-ui-fixes-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 00:00

## Overview

Five focused UI fixes for the Design Control Panel and related pages:

1. **Pricing page** — add `backAction` prop to `<Page>` so merchants can navigate back to dashboard.
2. **DCP → Bundle Header → Tabs preview** — CSS classes (`bundle-header-tab`, `.active`, `.completed`) are styled in `bundle-widget.css` which is not injected by `PreviewScope`. Fix: also inject `bundle-widget.css`.
3. **Bundle Header → Header Text → conditionsTextColor default** — Both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS` have `conditionsTextColor: "#FFFFFF"`. Change to `"#000000"` so the preview is visible on white backgrounds.
4. **General → Empty State preview** — same root cause as fix 2: `.empty-state-card` styles live in `bundle-widget.css` only. Fixed by same PreviewScope change.
5. **Promo Banner font-weight buttons** — replace custom inline-styled `<div>/<button>` with Polaris `<ButtonGroup variant="segmented">` to match the Footer Discount pattern.

## Progress Log

### 2026-02-22 00:00 - Starting all 5 fixes

- Files to modify:
  - `app/routes/app/app.pricing.tsx` (Fix 1)
  - `app/components/design-control-panel/preview/PreviewScope.tsx` (Fix 2 & 4)
  - `app/components/design-control-panel/config/defaultSettings.ts` (Fix 3)
  - `app/components/design-control-panel/settings/PromoBannerSettings.tsx` (Fix 5)
- No new files needed
- Expected outcome: all 5 UI issues resolved

### 2026-02-22 00:01 - Completed all 5 fixes

- Fix 1: Added `backAction={{ content: "Back", url: "/app/dashboard" }}` to `<Page>` in `app.pricing.tsx`
- Fix 2 & 4: Added second `?raw` import for `bundle-widget.css` in `PreviewScope.tsx` and inject both stylesheets into `document.head`
- Fix 3: Changed `conditionsTextColor` from `"#FFFFFF"` to `"#000000"` in both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS`
- Fix 5: Replaced custom inline `<div>`/`<button>` font-weight picker with `<ButtonGroup variant="segmented">` + `<Button pressed>` in `PromoBannerSettings.tsx`
- Files modified: app.pricing.tsx, PreviewScope.tsx, defaultSettings.ts, PromoBannerSettings.tsx
- Next: lint, then commit

## Related Documentation

- CLAUDE.md — issue tracking and commit format rules
- `FooterDiscountProgressSettings.tsx` — reference for ButtonGroup pattern

## Phases Checklist

- [x] Fix 1: Pricing page backAction
- [x] Fix 2: Bundle Header Tabs preview CSS
- [x] Fix 3: conditionsTextColor default
- [x] Fix 4: Empty State preview CSS
- [x] Fix 5: Promo Banner font weight buttons
- [ ] Lint and commit
