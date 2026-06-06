# Issue: PPB Runtime CSS Refactor
**Issue ID:** ppb-runtime-css-refactor-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 06:59

## Overview
Move static Product Page Bundle runtime styles out of JS-generated inline styles and into product-page CSS modules. Keep JS responsible for DOM, state classes, data attributes, and dynamic CSS variables only.

## Progress Log
### 2026-06-04 06:59 - Started scoped refactor
- Identified static inline style clusters in the PPB runtime: default products, discount progress, quantity pills, gift message UI, modal slot icon styling, and vertical modal CTA override.
- Scope excludes true runtime state toggles such as hidden/display state, body scroll lock, dynamic progress width, and image URL variables.
- Next: add failing contract test, move static declarations into CSS, rebuild widget assets, and commit.

### 2026-06-04 07:00 - Moved static PPB styles into CSS
- Added a failing contract test proving the targeted static presentation was still owned by JS inline style strings.
- Moved default product, discount progress, quantity pill, and gift message static styles into `app/assets/widgets/product-page-css/bundle-widget.css`.
- Moved modal-slot icon image and vertical modal CTA static styling into `app/assets/widgets/product-page-css/templates/modal-slots.css`.
- Kept runtime-only dynamic values as CSS variables: progress width/color, quantity pill active color, and slot icon color.
- Bumped widget version to `2.9.72`, rebuilt widget JS assets, minified CSS, and rebuilt graphify outputs.
- Verification: initial focused Jest failed on the new CSS ownership contract; after implementation `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` passed with 36 tests; raw JS syntax checks passed; `npm run build:widgets` passed; `npm run minify:assets css` passed; scoped ESLint completed with zero errors.

## Related Documentation
- `docs/issues-prod/ppb-template-deep-parity-audit-1.md`
- `test-spec/ppb-runtime-css-refactor.spec.md`

## Phases Checklist
- [x] Phase 1: Add failing static-style ownership contract
- [x] Phase 2: Move targeted static styles into CSS classes
- [x] Phase 3: Rebuild/minify widget assets and run verification
- [x] Phase 4: Update issue log and commit
