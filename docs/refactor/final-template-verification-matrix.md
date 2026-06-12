# Bundle Widget Refactor Final Verification Matrix

Updated: 2026-06-11

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

## Deploy-Gated Storefront Verification

The current Shopify storefront still needs a manual SIT deploy before final visual verification can prove the new assets. The most recent live browser check showed the storefront serving widget version `3.0.23`; local generated assets are `3.0.24`.

After deploy and CDN propagation, verify each row below on the live storefront using Chrome DevTools MCP.

| Template | Desktop 1440 | Tablet 768 | Mobile 390 | Empty | Selected | Qty +/- | Remove | Discount | Add to Cart | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| FPB Standard | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| FPB Classic | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| FPB Compact | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| FPB Horizontal | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| PPB Grid | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| PPB List | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| PPB Horizontal Slots | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |
| PPB Vertical Slots | pending | pending | pending | pending | pending | pending | pending | pending | pending | Deploy-gated |

## Verification Procedure

For each template:

1. Confirm live version:
   ```javascript
   window.__BUNDLE_WIDGET_VERSION__
   ```
   Expected: `3.0.24`.
2. Confirm the active template CSS asset is loaded from Shopify CDN.
3. Check console errors and failed network requests.
4. Capture desktop, tablet, and mobile screenshots.
5. Exercise empty, selected, quantity increase/decrease, remove, discount progress, timeline/step state, and add-to-cart.
6. Record screenshot paths and pass/fail details in `docs/refactor/loop-ledger.md`.

## Current Blocker

Manual Shopify deploy is required. Do not run `shopify app deploy` autonomously.

Use:

```bash
npm run deploy:sit
```

Then wait for Shopify CDN propagation before running the matrix.
