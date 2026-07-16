---
schema_version: 1
id: ppb-g38-bundle-embed-evidence
title: PPB G38 Bundle Embed Evidence
type: verification-evidence
status: verified
summary: Classifies Bundle Embed as a shared Product Page Bundle visibility/runtime path with existing storefront proof and current persistence tests.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - admin
  - storefront
systems:
  - product-page-bundle-admin
  - product-page-bundle-widget
source_paths:
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbBundleEmbedSection.tsx
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbVisibilityState.ts
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
  - docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md
tags:
  - ppb
  - parity
keywords:
  - Bundle Embed
  - bundleUpsellConfig
  - Build Your Bundle
---

# PPB G38 Bundle Embed Evidence

## Classification

`G38 Bundle Embed` is a shared Product Page Bundle visibility and runtime path,
not a renderer-specific Product List / Product Grid / Horizontal Slots /
Vertical Slots permutation. The setting persists in `bundleUpsellConfig` and is
read by the product-page runtime before the active bundle design renders.

## Existing live evidence

The complete PPB configure audit records direct EB and WPB evidence for the
Bundle Embed path:

- Admin exposed `Embed Bundle Builder on Product Pages`, title/subtitle fields,
  all-products/specific-products/specific-collections targeting, add-browsed
  product, and custom placement controls.
- The saved EB payload wrote `bundleUpsellConfig.upsellConfiguration.isEnabled:
  true`, title `Build Your Bundle & Save More`,
  `displayConfiguration.showOnAllBundleProducts: true`, and
  `useLinkProductAsDefaultProduct: false`.
- Desktop and mobile storefront evidence showed the embedded bundle builder
  rendered with title `Build Your Bundle & Save More`, current category text,
  current products, and the active discount message.
- The same audit records Bundle Embed non-default persistence and storefront
  rendering as resolved for enabled/all-products states.

The EB settings replication evidence confirms the live Bundle Embed UI shape and
default title used by the implementation.

## Current focused verification

The focused persistence and runtime-selection tests were rerun on 2026-07-15:

```text
npx jest tests/unit/routes/ppb-save-bundle.test.ts tests/unit/assets/bundle-data-manager.test.ts tests/unit/lib/common-configure-page-model.test.ts --runInBand
```

Result: 3 suites passed, 43 tests passed.

The tests lock the relevant current contracts:

- PPB saves direct Bundle Visibility / `bundleUpsellConfig` state.
- Product-page runtime selection honors widget/embed targeting for all products,
  specific products, and specific collections.
- Bundle Embed remains a PPB-only visibility child in the shared configure
  model.

## Resolution

Because Bundle Embed is shared before template-specific rendering, the existing
desktop/mobile live storefront proof and current focused tests are sufficient to
mark G38 Proven for Product List, Product Grid, Horizontal Slots, and Vertical
Slots. Specific-products and specific-collections targeting are separate global
visibility rows and remain outside this G38 all-products resolution.
