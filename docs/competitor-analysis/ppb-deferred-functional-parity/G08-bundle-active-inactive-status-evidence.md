---
schema_version: 1
id: ppb-g08-bundle-active-inactive-status-evidence
title: PPB Bundle Active and Inactive Status Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack bundle active-to-draft status behavior and storefront restoration for G08.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/save-bundle.server.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/Architecture/Bundle Parent Product.md
tags:
  - ppb
  - bundle-status
  - inactive
keywords:
  - G08
  - draft
  - active
---

# PPB bundle active/inactive status evidence

## Scope

G08 covers the bundle-level status gate. This is a global runtime gate before template-specific PPB rendering: active/unlisted bundles may render, while draft bundles must not expose the selectable bundle UI or mutate cart state.

Because the gate happens before template dispatch, one active-to-draft-to-active replay closes Product List, Product Grid, Horizontal Slots, and Vertical Slots when both EB and WPB show the same saved-status behavior.

## EB evidence

On 2026-07-15, EB bundle `WPB PPB Product List Parity 2026-07-11` was verified from the embedded admin app and storefront with cache/storage/cart cleared before each storefront pass.

Active baseline:

- Admin `Bundle Status`: `Active`.
- Storefront hard reload at `1280 x 800`: product page rendered the PPB widget.
- Runtime/template markers: `templateType: "PDP_INPAGE"`, `templateId: "COGNIVE"`, `offerId: "MIX-156854"`.
- Bundle text was visible and horizontal overflow was `0`.

Draft transition:

- Admin `Bundle Status` changed to `Draft`.
- EB confirmation copy stated that customers can still land on the bundle link but will not be able to see any content.
- Save completed with draft messaging in admin.
- Storefront cache/storage/cart was cleared and hard reloaded.
- Product URL resolved to a `404 Not Found` page; no EB template/runtime markers were present and bundle text was absent.

Restore:

- EB `Activate Bundle` restored the same bundle to `Active`.
- Storefront cache/storage/cart was cleared and hard reloaded.
- Product page rendered again with `templateType: "PDP_INPAGE"`, `templateId: "COGNIVE"`, `offerId: "MIX-156854"`, visible bundle text, and horizontal overflow `0`.

## WPB evidence

The WPB fixture was `PPB Modal Shared Card Test` on `agent-5sfidg3m.myshopify.com`, using the SIT embedded app and storefront. Cache Storage, WPB/GBB/bundle storage keys, and cart state were cleared before each storefront pass; each storefront pass used a hard reload with cache bypass.

Active baseline before the fix:

- Admin `Parent Product Status`: `Active`.
- Admin PPB `Bundle Status`: `Active`.
- Storefront widget version: `5.0.186`.
- Visible PPB content rendered: `Step 1`, `Product 1`, `Product 2`, `Category 2Long Label Empty Category`, and `Add Bundle to Cart`.
- Horizontal overflow was `0`.

Defect found:

- Saving `Bundle Status: Draft` initially left the storefront bundle visible after cache-cleared hard reload.
- Root cause: `handleSaveBundle` auto-promoted a draft PPB bundle with configured steps back to `active`.
- Fix: removed the PPB auto-activation branch so the saved `bundleStatus` is persisted exactly.
- Focused unit coverage: `tests/unit/routes/ppb-save-bundle.test.ts` now proves draft status is preserved with direct step products and category products, and active saves remain active.

Draft verification after the fix:

- Admin `Bundle Status: Draft` persisted after save and reload.
- Storefront hard reload kept the native Shopify product page visible but suppressed visible PPB bundle UI.
- The page did not show `Step 1`, `Product 1`, `Product 2`, or visible `Add Bundle to Cart` bundle content.
- Only hidden app-block scaffolding remained (`#bundle-builder-app` and `.add-bundle-to-cart` measured `0 x 0` and not visible).
- Horizontal overflow was `0`.

Restore:

- Admin `Bundle Status` was restored to `Active` and saved.
- Storefront cache/storage/cart was cleared and hard reloaded.
- Visible PPB content rendered again with widget version `5.0.186`, `Step 1`, `Product 1`, `Product 2`, `Category 2Long Label Empty Category`, and `Add Bundle to Cart`.
- Horizontal overflow was `0`.

## Matrix resolution

All four G08 cells are terminal **P**:

- EB blocks draft bundles before any PPB template renders.
- WPB now preserves draft status and suppresses visible bundle UI before shopper interaction.
- Active restoration remounts the saved WPB fixture.
- The status gate is global and does not depend on Product List, Product Grid, Horizontal Slots, or Vertical Slots renderer internals.
