# Issue: Polaris Prop Types and PPB Product List Storefront Parity
**Issue ID:** polaris-prop-types-and-ppb-product-list-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 03:25

## Overview
Resolve Polaris web component prop type errors across Admin UI surfaces, then match the PPB Product List storefront template UI to the EB reference.

## Progress Log
### 2026-06-04 02:54 - Start targeted type and storefront parity work
- Reproduced TypeScript failures with `npx tsc --noEmit --pretty false`.
- Confirmed many non-Polaris TypeScript errors already exist; Phase 1 is scoped to `s-*` prop issues only.
- Loaded Shopify Polaris App Home documentation through Shopify MCP for current valid prop shapes.
- Next: fix invalid `s-*` props, validate with a filtered typecheck, then audit and implement PPB Product List storefront parity.

### 2026-06-04 03:10 - Resolve Polaris prop value failures
- Replaced invalid Admin web component prop values and slots, including banner dismissal props, modal control props, text tones, badge tones, button sizing, select options, number field min/max values, and `autocomplete` casing.
- Updated checkout UI extension `s-text` usage to remove unsupported `type="small"` values for the checkout target.
- Validated representative Admin and checkout `s-*` snippets with Shopify MCP component validation.
- Ran `npx tsc --noEmit --pretty false`; remaining failures are non-Polaris project/test type issues and no `s-*` prop failures remain in the compiler output.
- Ran `npx eslint --max-warnings 9999` on the touched application and checkout files; completed with 0 errors and existing warning volume.

### 2026-06-04 03:16 - Audit PPB Product List storefront gap
- Read EB implementation reference and captured PPB template evidence: Product List maps to `bundleDesignTemplate: "PDP_INPAGE"` with `templateId: "CASCADE"`.
- Compared `docs/select-template/eb-ppb-cascade-storefront.png` against `docs/select-template/wpb-ppb-cascade-storefront.png`, plus the current/verified cascade screenshots.
- EB Product List renders a compact sidebar widget with category pill tabs, product rows containing thumbnail/name/price, black rounded `Add +` buttons, selected item drawer chip, discount guidance, disabled Add Bundle CTA, and Buy It Now button.
- WPB Product List currently renders a sparse dashed slot/placeholder flow with generic orange CTA and no visible product row list, so the storefront asset implementation needs JS/CSS parity work.
- Next: update product-page widget rendering/CSS, rebuild widget assets, and verify against the captured EB cascade screenshot.

### 2026-06-04 03:23 - Implement PPB Product List storefront parity
- Added a CASCADE-specific Product List render path for PPB product-page widgets, including EB-style product row classes, hidden quantity controls, row add-button copy behavior, selected item drawer toggle, and discount footer messaging.
- Added CASCADE-scoped product-page CSS for compact category tabs, product rows, selected drawer chip/list, disabled bundle CTA, and Buy It Now visual treatment.
- Added `test-spec/ppb-product-list-storefront.spec.md` and a focused Jest contract covering the Product List source and CSS surface.
- Bumped `WIDGET_VERSION` to `2.9.58`, rebuilt widget JS assets, and minified storefront CSS assets.
- Verified with `node --check app/assets/bundle-widget-product-page.js`, `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand`, `npm run build:widgets`, `npm run minify:assets css`, `npx eslint --max-warnings 9999 tests/unit/assets/bundle-widget-product-page-init.test.ts scripts/build-widget-bundles.js`, and graphify rebuild.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/select-template/eb-ppb-cascade-storefront.png`
- `docs/select-template/wpb-ppb-cascade-storefront.png`

## Phases Checklist
- [x] Phase 1: Resolve Polaris `s-*` prop type errors.
- [x] Phase 2: Audit EB PPB Product List storefront reference.
- [x] Phase 3: Implement PPB Product List storefront UI parity.
- [x] Phase 4: Build/minify modified storefront assets and verify.
