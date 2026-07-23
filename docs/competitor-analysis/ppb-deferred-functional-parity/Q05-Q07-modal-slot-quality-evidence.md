---
schema_version: 1
id: ppb-q05-q07-modal-slot-quality-evidence
title: PPB Modal Slot Accessibility and Runtime Quality Evidence
type: verification-evidence
status: verified
summary: Verifies keyboard focus, request health, and typography isolation for Horizontal and Vertical Slots on desktop and mobile.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/inpage-render-methods.js
  - app/assets/widgets/product-page/methods/modal-state-methods.js
  - app/assets/widgets/product-page/templates/modal-slot-template.js
  - app/assets/widgets/product-page-css/base/bottom-sheet-modal.css
  - app/assets/widgets/product-page-css/base/layout-steps-summary.css
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - accessibility
  - runtime-health
keywords:
  - Horizontal Slots
  - Vertical Slots
  - modal focus
  - keyboard access
---

# PPB Modal Slot Accessibility and Runtime Quality Evidence

## Fixture and protocol

- Store: `agent-5sfidg3m.myshopify.com`
- Bundle: `PPB Modal Shared Card Test`
- Bundle ID: `cmrf19c8d0000v0xpj8rz2wgh`
- Widget version: `5.0.181`
- Viewports: desktop `1280x800`; mobile `390x844`

Every storefront pass cleared Cache Storage and used a cache-bypassed hard
reload before evidence collection. Chrome DevTools MCP was used directly; no
screenshots were written to the repository.

## Q05 keyboard access and modal focus

Horizontal Slots and Vertical Slots passed the same desktop and mobile replay:

1. Filled slots were keyboard-focusable and opened the picker with Enter.
2. Empty slots were labelled native buttons and opened the picker with Enter
   or Space.
3. Filled-slot remove actions were labelled native buttons.
4. Initial modal focus landed on the visible breakpoint-specific close button:
   desktop used `.bw-bs-close-desktop`; mobile used `.bw-bs-close-mobile`.
5. Shift+Tab remained inside the open modal.
6. Escape closed the modal and restored focus to the matching slot after the
   main slot collection rerendered.

The live replay found and closed two focus defects: hidden desktop controls
were previously eligible for mobile initial focus, and focus restoration ran
before `renderSteps()` replaced the opener. Focusability now filters controls
with no rendered client rects and restores the matching rerendered slot after
the main UI update.

## Q06 request and console health

Both templates completed their desktop and mobile passes with successful
app-owned document, configuration, design-settings, product, stylesheet, and
widget-script requests. The only console error resolved to the theme-store
request `GET /favicon.ico`, which returned `404`; it is not app-owned.

The Admin template update request returned `200` and `success: true` with:

```text
intent=updateBundleDesignTemplate
bundleDesignTemplate=PDP_MODAL
bundleDesignPresetId=MODAL
```

After the Horizontal Slots replay, the fixture was restored to Vertical Slots
with a second successful Admin response using `bundleDesignPresetId=SIMPLIFIED`.
The final cache-bypassed mobile reload rendered two simplified sections and no
horizontal sections.

## Q07 typography and selector isolation

Computed styles on both viewports confirmed:

- Widget root typography: `Inter, sans-serif`.
- Add-to-cart typography: `Inter, sans-serif`.
- Horizontal overflow: `0px`.
- Horizontal Slots rendered the modal-slot sections without the simplified
  modifier; Vertical Slots rendered the simplified modifier.
- Visible desktop and mobile close controls followed their own breakpoint
  rules, with the hidden peer reporting no client rects.

No Shopify theme button selector changed the widget CTA font, and the two
modal presets did not leak into one another.

## Automated coverage

- `tests/unit/assets/ppb-modal-slot-keyboard-access.test.ts`
- `tests/unit/assets/ppb-product-page-modal-accessibility.test.ts`
- `tests/unit/assets/ppb-horizontal-slots-empty-placeholders.test.ts`
- `tests/unit/assets/ppb-vertical-slots-shared-shell.test.ts`
- `tests/unit/assets/ppb-template-registry-integration.test.ts`
- `tests/unit/assets/bundle-widget-product-page-init.test.ts`
