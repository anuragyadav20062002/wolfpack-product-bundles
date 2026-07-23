---
schema_version: 1
id: ppb-g03-upsell-widget-handoff-evidence
title: PPB G03 Upsell Widget Handoff Evidence
type: verification-evidence
status: verified
summary: Classifies the PPB upsell block/button handoff as a shared visibility/runtime path with existing desktop/mobile storefront proof.
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
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbBundleWidgetSection.tsx
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbVisibilityState.ts
  - app/assets/widgets/shared/bundle-data-manager.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
  - docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md
tags:
  - ppb
  - parity
keywords:
  - Bundle Widget
  - upsell widget
  - OFFER_WIDGET
---

# PPB G03 Upsell Widget Handoff Evidence

## Classification

`G03 Upsell block/button handoff` is a shared Product Page Bundle visibility and
runtime path. The upsell widget configuration is saved in
`bundleUpsellConfig.widgetConfiguration` and evaluated before Product List,
Product Grid, Horizontal Slots, or Vertical Slots render their template-specific
bundle UI.

## Existing live evidence

The complete PPB configure audit records direct EB and WPB evidence for the
Bundle Widget / upsell path:

- Admin exposed `Product Page Bundle Upsell Widgets`, Offer Upsell Block, Offer
  Upsell Button, title/description/button/image fields, all-products /
  specific-products / specific-collections targeting, add-browsed-product, and
  custom embed controls.
- The saved EB payload wrote
  `bundleUpsellConfig.widgetConfiguration.isEnabled: true`,
  `type: "OFFER_WIDGET"`, title `Bundle & Save`, button text
  `Buy With Bundle`, uploaded image URL, all-products targeting, and
  `useLinkProductAsDefaultProduct: false`.
- Desktop and mobile storefront evidence showed the Product Page Bundle Upsell
  Widget rendered on a bundle product page with title `Bundle & Save`, the
  uploaded image, and CTA `Buy With Bundle`.
- The same audit records coexistence with the embedded builder path: after
  Bundle Embed was enabled, the widget remained present.

The EB settings replication evidence confirms the live Bundle Widget UI shape,
display modes, and targeting controls.

## Current focused verification

The focused persistence and runtime-selection tests were rerun on 2026-07-15:

```text
npx jest tests/unit/routes/ppb-save-bundle.test.ts tests/unit/assets/bundle-data-manager.test.ts tests/unit/lib/common-configure-page-model.test.ts --runInBand
```

Result: 3 suites passed, 43 tests passed.

The tests lock the relevant current contracts:

- PPB saves direct Bundle Visibility / `bundleUpsellConfig` state.
- Product-page runtime selection honors widget targeting for all products,
  specific products, and specific collections.
- Bundle Widget remains a shared visibility child in the configure model.

## Resolution

Because the upsell widget is shared before template-specific bundle rendering,
the existing desktop/mobile live storefront proof and current focused tests are
sufficient to mark G03 Proven for Product List, Product Grid, Horizontal Slots,
and Vertical Slots. Specific-products and specific-collections targeting remain
covered by separate visibility rows.
