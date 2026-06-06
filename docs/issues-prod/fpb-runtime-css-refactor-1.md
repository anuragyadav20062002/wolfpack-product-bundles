# Issue: FPB Runtime CSS Refactor
**Issue ID:** fpb-runtime-css-refactor-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 07:12

## Overview
Move static Full Page Bundle runtime presentation out of JS inline styles and into full-page widget CSS. Keep JS responsible for DOM, state classes, data attributes, and dynamic CSS variables only.

## Progress Log
### 2026-06-04 07:08 - Started scoped FPB style ownership refactor
- Audited FPB runtime style usage in `app/assets/bundle-widget-full-page.js`.
- Confirmed static refactor targets: sidebar tier CTA `cssText`, promo banner background sizing/position declarations, and discount progress fill width.
- Scope excludes runtime-only display toggles, modal state, and truly dynamic values such as image URL, crop offsets, and progress percentage.
- Next: add failing contract test, move static declarations into CSS, rebuild widget assets, and commit.

### 2026-06-04 07:12 - Moved targeted FPB styles into CSS
- Added a failing full-page template contract test proving the targeted FPB static presentation was still owned by inline JS styles.
- Moved sidebar tier CTA styling into `app/assets/widgets/full-page-css/bundle-widget-full-page.css`.
- Changed promo banner runtime styling to CSS variables: `--fpb-promo-banner-bg-image`, `--fpb-promo-banner-bg-size`, and `--fpb-promo-banner-bg-position`.
- Changed discount progress fill width to `--fpb-discount-progress-width`, with `.fpb-dp-fill` owning the `width` declaration.
- Removed duplicate promo banner background overrides and a redundant discount-progress radius rule.
- Added repeat-hex shortening to `scripts/minify-assets.js` so deploy CSS stays below Shopify's 100,000 B app-block limit.
- Bumped widget version to `2.9.73`, rebuilt widget assets, minified CSS, and rebuilt graphify outputs.
- Verification: initial focused Jest failed on the new CSS ownership contract; after implementation `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand` passed with 9 tests; raw JS syntax checks passed; `npm run build:widgets` passed; `npm run minify:assets css` passed with full-page CSS at 97.6 KB; scoped ESLint completed with zero errors.

## Related Documentation
- `docs/issues-prod/ppb-runtime-css-refactor-1.md`
- `test-spec/fpb-runtime-css-refactor.spec.md`

## Phases Checklist
- [x] Phase 1: Add failing static-style ownership contract
- [x] Phase 2: Move targeted static styles into CSS classes and variables
- [x] Phase 3: Rebuild/minify widget assets and run verification
- [x] Phase 4: Update issue log and commit
