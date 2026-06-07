# Issue: FPB Compact Design — fresh storefront parity (capture + rebuild)
**Issue ID:** fpb-compact-design-storefront-parity-2
**Status:** Blocked (awaiting EB session)
**Priority:** 🔴 High
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:45

## Overview

Re-attempt FPB Compact Design storefront parity from scratch. Numbering bumped to `-2` to distinguish from prior attempt `-1`. Goal: pixel-perfect copy of EB's Compact Design template at desktop + mobile.

## Prerequisites

- EB-installed store with an FPB bundle configured with every meaningful option (3+ steps, max qty per product, default preselected products, banner image, multi-language cart text, discount, subscription option, variant selector).
- Bundle template set to **Compact**: EB params `bundleDesignTemplate: FBP_SIDE_FOOTER`, `bundleDesignPresetId: COMPACT`.
- Authenticated Chrome session with both EB admin + EB storefront accessible.

## Subtask 6.2 — Capture

For each state below, capture desktop (1280×800) and mobile (iPhone 14, 390×844):

1. Empty step (step 1, no product selected).
2. Step in progress (some products selected, button disabled / enabled).
3. Step completed (badge or state change).
4. Multi-step navigation timeline pills — current / completed / locked.
5. Summary / sticky footer state.
6. Empty cart vs full cart toggle.
7. Subscription / variant pickers.

For each state:
- `mcp__chrome-devtools__navigate_page` with `ignoreCache: true` (per CLAUDE.md storefront audit rule).
- Screenshot.
- `take_snapshot` for the DOM subtree.
- `evaluate_script` for computed CSS — spacing, typography, colors, borders, shadows on root + key children.

Save to `docs/competitor-analysis/20-eb-fpb-compact-design-capture.md` with one section per state, each holding desktop + mobile screenshots, DOM snippet, computed-style tables.

## Subtask 6.3 — Implement in WPB

- Edit `app/assets/widgets/full-page/templates/compact-template.js` (runtime style injection lives here). Match EB's spacing / typography / color tokens exactly.
- Edit `app/assets/widgets/full-page-css/bundle-widget-full-page.css` — preset-scoped rules under `[data-fpb-design-preset="COMPACT"]`.
- Adjust step-timeline / product-grid / sidebar render paths in `app/assets/bundle-widget-full-page.js` ONLY if EB's structure requires a DOM change a CSS-only patch can't cover.
- Liquid block `extensions/bundle-builder/blocks/bundle-full-page.liquid` — only edit if a new data attribute is needed.

## Subtask 6.4 — Build + ship

1. Bump `WIDGET_VERSION` (MINOR — backwards-compatible visual update).
2. `node --check app/assets/bundle-widget-full-page.js`.
3. `npm run build:widgets`.
4. `npm run minify:assets css` (CSS-only build).
5. Stop & prompt user for `npm run deploy:sit` per Shopify Deploy Rule.
6. Post-deploy: `console.log(window.__BUNDLE_WIDGET_VERSION__)` confirms new version. Storefront audit at both viewports with `ignoreCache: true` on `wolfpack-store-test-1.myshopify.com` against the EB capture.

## Phases Checklist

- [ ] EB session + EB-installed store accessible
- [ ] Configure FPB bundle in EB with COMPACT preset + every meaningful option
- [ ] Capture 7 states × 2 viewports into `20-eb-fpb-compact-design-capture.md`
- [ ] Update `compact-template.js` to match EB tokens
- [ ] Update preset-scoped CSS rules
- [ ] Bump `WIDGET_VERSION` MINOR + build widgets + minify CSS
- [ ] Lint + commit
- [ ] Prompt user for SIT deploy
- [ ] Post-deploy verification (live storefront diff vs EB capture)
