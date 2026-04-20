# Issue: FPB Compact Add Button + Variant Selector

**Issue ID:** fpb-compact-card-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20 17:00

## Overview
Replace the full-width add button on FPB product cards with a 35×35px circle button.
When qty > 0 it transforms into [−] count [+] inline controls. Variant selection moves
from a modal to an inline card component: a button group for the primary variant
dimension (merchant-configurable per step) + a pill button for remaining dimensions
(tap to open dropdown panel). Variant modal removed from card interaction path.

## Related Documentation
- `docs/storefront-ui-26.05-improvements/01-requirements.md` — FR-01
- `docs/storefront-ui-26.05-improvements/02-architecture.md` — FR-01 section

## Phases Checklist
- [x] Read existing renderProductCard() + variant modal implementation
- [x] Read shared components index.js
- [x] Prisma: add `primaryVariantOption String?` to BundleStep + db push
- [x] Propagate `primaryVariantOption` through metafield-sync types + bundle-formatter
- [x] Create `app/assets/widgets/shared/variant-selector.js`
- [x] Export from `app/assets/widgets/shared/index.js`
- [x] Add to build script SHARED_MODULES
- [x] component-generator.js: `options.variantSelectorHtml` parameter
- [x] bundle-widget-full-page.js: circle button + VariantSelectorComponent
- [x] bundle-widget-full-page.js: remove image/title → modal handler
- [x] bundle-widget-full-page.js: renderVariantSelector() → VariantSelectorComponent
- [x] CSS: circle button, variant selector button group + panel styles
- [x] CSS: removed dead `.variant-selector` select styles (—1.1 KB)
- [x] CSS size: 99,974 bytes (under 100KB Shopify limit)
- [x] CSS vars generator: `--bundle-add-btn-color`, `--bundle-add-btn-radius`
- [x] Settings types: `addBtnColor`, `addBtnRadius`
- [x] Build + lint + commit

## Progress Log

### 2026-04-20 16:05 - Starting Implementation
- Reading existing renderProductCard() and variant modal code before writing

### 2026-04-20 17:00 - Completed Implementation
- ✅ Prisma: `primaryVariantOption String?` added to BundleStep, pushed to SIT DB
- ✅ Data pipeline: types.ts → bundle-product.server.ts → bundle-formatter.server.ts
- ✅ `VariantSelectorComponent` (variant-selector.js): static renderHtml + attachListeners
  - Button group for primary option (max 4 visible + "+N more" overflow panel)
  - Secondary dimension pills with tap-to-change dropdown panel
  - Preserves other option values when switching primary selection
  - Qty migration on variant change (stock clamp + toast)
- ✅ `ComponentGenerator.renderProductCard`: accepts `options.variantSelectorHtml`; `+` circle button always
- ✅ `createProductCard`: passes VariantSelectorComponent HTML + removes modal handler
- ✅ `attachProductCardListeners`: event delegation for inline qty, add btn, variant buttons
- ✅ `renderVariantSelector(product, step)`: now delegates to VariantSelectorComponent
- ✅ CSS: `.product-add-btn` → 35×35px circle with `--bundle-add-btn-color/radius` vars
- ✅ CSS: `.vs-wrapper`, `.vs-btn-group`, `.vs-btn`, `.vs-panel`, `.vs-secondary-pill` etc.
- ✅ CSS: dead `.variant-selector` select block removed (freed ~1.3KB)
- ✅ Widget rebuilt (v2.6.0)
- ✅ Lint: zero errors on modified files
- Files modified: prisma/schema.prisma, metafield-sync/types.ts, bundle-product.server.ts,
  bundle-formatter.server.ts, variant-selector.js (new), index.js, build-widget-bundles.js,
  component-generator.js, bundle-widget-full-page.js, bundle-widget-full-page.css,
  css-variables-generator.ts, types.ts
