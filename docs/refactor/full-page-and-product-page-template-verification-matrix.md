---
schema_version: 1
id: final-template-verification-matrix
title: Full Page and Product Page Bundle Template Verification Matrix
type: verification-matrix
status: active
summary: Tracks live post-refactor verification for all FPB and PPB storefront designs.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - bundle-widgets
source_paths:
  - app/assets/bundle-widget-full-page.js
  - app/assets/bundle-widget-product-page.js
related_docs:
  - docs/refactor/full-page-and-product-page-template-baseline-matrix.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - verification
  - templates
keywords:
  - Full Page Bundle
  - Product Page Bundle
---

# Full Page and Product Page Bundle Template Verification Matrix

Updated: 2026-07-14

Scope: final stop condition for `bundle_widget_refactor_agentic_loop_all_templates.md`.

## Local Refactor Evidence

The local source/bundle refactor is built as widget version `3.0.24`.

Verified locally:

- All widget source JS/CSS files under `app/assets` and `scripts` are under 500 lines.
- FPB and PPB template installer functions are removed from production sources and generated bundles.
- Runtime widget style-tag injection scans return no matches.
- Template CSS is split into Shopify extension assets and each generated CSS asset is below Shopify's 100,000 B app-block limit.
- Focused Jest coverage for the refactor passes.
- Production Remix build passes.
- Targeted ESLint on the final installer-removal slice has zero errors.
- Graphify code graph was rebuilt with the documented pipx interpreter.

## Storefront Verification Status

The original refactor evidence recorded local widget version `3.0.24`. The current PPB storefront replay below served widget version `5.0.174`; the FPB rows remain pending because this session was scoped to PPB designs.

| Template | Desktop 1440 | Tablet 768 | Mobile 390 | Empty | Selected | Qty +/- | Remove | Discount | Add to Cart | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| FPB Standard | pending | pending | pending | pending | pending | pending | pending | pending | pending | Pending replay |
| FPB Classic | pending | pending | pending | pending | pending | pending | pending | pending | pending | Pending replay |
| FPB Compact | pending | pending | pending | pending | pending | pending | pending | pending | pending | Pending replay |
| FPB Horizontal | pending | pending | pending | pending | pending | pending | pending | pending | pending | Pending replay |
| PPB Product Grid | pass | historical only | pass | pass | pass | N/A; selected action toggles | pass | pass | validation path pass | Verified on `5.0.174` |
| PPB Product List | pass | historical only | pass | pass | pass | pass | pass | pass | step progression pass | Verified on `5.0.174` |
| PPB Horizontal Slots | pass | historical only | pass | pass | pass | modal selected state | pass | pass | incomplete-step enforcement pass | Verified on `5.0.174` |
| PPB Vertical Slots | pass | historical only | pass | pass | pass | modal selected state | pass | pass | incomplete-step enforcement pass | Verified on `5.0.174` |

## Verification Procedure

For each template:

1. Confirm live version:
   ```javascript
   window.__BUNDLE_WIDGET_VERSION__
   ```
   Record the version served during the replay. The 2026-07-14 PPB replay served `5.0.174`.
2. Confirm the active template CSS asset is loaded from Shopify CDN.
3. Check console errors and failed network requests.
4. Capture desktop, tablet, and mobile screenshots.
5. Exercise empty, selected, quantity increase/decrease, remove, discount progress, timeline/step state, and add-to-cart.
6. Record screenshot paths and pass/fail details in `docs/refactor/loop-ledger.md`.

## 2026-07-14 Product Page Bundle Replay

Direct Chrome DevTools verification used the active agent-store fixture at desktop `1280x800` and mobile `390x844`. Cache Storage was cleared and every evidence pass used a cache-bypassed hard reload.

- Product List loaded `PDP_INPAGE + CASCADE`, completed two selections, showed the 5% discount state, advanced to Step 2, preserved selected items, and had no horizontal overflow.
- Product Grid loaded `PDP_INPAGE + COGNIVE`, retained its active validation action, and showed the required unmet-rule toast instead of silently disabling Next.
- Horizontal Slots loaded `PDP_MODAL + MODAL`; the slot opened the picker, accepted a product, updated the total/count, and kept the parent CTA blocked until all required slots were complete.
- Vertical Slots loaded `PDP_MODAL + SIMPLIFIED`; desktop and mobile slot stacks opened the picker and retained the same selection and incomplete-step safety behavior.
- Each design loaded only its matching template stylesheet plus the shared base stylesheet from Shopify CDN. The live widget version was `5.0.174`.
- No design produced horizontal page overflow. The sole console resource error was not an app-owned widget asset or proxy request.

Evidence screenshots remain outside the repository under `/private/tmp/ppb-template-design-verification-20260714`.

## Remaining FPB Verification Gate

The historical FPB rows were not replayed in this PPB-focused session. A future FPB storefront change still requires a cache-bypassed desktop/mobile replay before those rows can be promoted.
