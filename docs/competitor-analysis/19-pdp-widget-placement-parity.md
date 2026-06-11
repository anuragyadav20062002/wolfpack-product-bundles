# PDP Widget Placement — EB Parity Audit

**Issue:** feedback-jun26-7
**Created:** 2026-05-29
**Outcome:** Superseded by 2026-06-11 live evidence. EB's Product Page Bundle widget should be treated as a Buy buttons replacement/override, not as a merchant-positioned app block that must be dragged into place.

> 2026-06-11 correction: Shopify Theme Editor showed the EB PPB widget while the native **Buy buttons** block was selected. The merchant had not placed a separate EB block under Buy buttons; EB overrides/injects into the Buy buttons block itself.

## Live evidence (EB storefront)

Captured 2026-05-29 from `yash-wolfpack.myshopify.com/products/wpb-complete-audit-product-page-2026-05-25` after entering store password.

```js
// getBoundingClientRect snapshot of bundle widget + ATC area
{
  nativeATC: { exists: false },                                  // hidden by EB
  bundleATC: { tag: "DIV", className: "gbbMixCascadeFooterBtnsWrapper", top: 1092, height: 41 },
  buyItNow:  { className: "shopify-payment-button__button shopify-payment-button__button--unbranded", top: 1154, height: 47 },
}
```

Order in the product-info column: Quantity controls → bundle widget steps + product cards → bundle's own "Add Bundle to Cart" button (top 1092) → Shopify "Buy It Now" payment button (top 1154).

Earlier note, now stale: the widget was interpreted as rendering wherever the merchant placed the app block. Current evidence shows the parity frame is the native Buy buttons/product-form footprint. Product-card geometry, widget width, and CTA/payment placement must be checked inside that footprint.

## Wolfpack equivalents

| Behavior | EB | Wolfpack | Status |
|---|---|---|---|
| Global theme app embed | Easy Bundle embed | `bundle-app-embed` block (checked by `app/services/theme/app-embed-check.server.ts` via `WOLFPACK_APP_HANDLES`) | ✅ |
| Buy buttons replacement/override | EB renders inside the native product-form/Buy buttons footprint | Wolfpack currently relocates `#bundle-builder-app` next to the native product form at runtime (`_relocateContainerToProductForm`) and hides native product price. The Liquid block is still a section app block. | Needs current parity audit |
| Hide native Shopify ATC on bundle products | EB hides the native ATC in captured storefront evidence; Buy It Now remains visible on the live 2026-06-11 EB product page | Wolfpack hides native ATC and `.shopify-payment-button` via `bundle-product-page.liquid` when `hide_native_buttons` is enabled. | Needs current parity audit |
| Custom bundle ATC button | `<div class="gbbMixCascadeFooterBtnsWrapper">…Add Bundle to Cart…</div>` | Line 48: `<button class="add-bundle-to-cart">{{ block.settings.add_to_cart_label }}</button>` | ✅ |
| "Place Widget" deep-link from admin | Yes — toast "Product Page Builder added", Theme Editor opens with block pre-selected | `handlePlaceWidget` (`route.tsx:1697`) → page-selection modal → `buildProductPageThemeEditorDeepLink` (`product-page-admin-sections.ts:149`) → toast `"Opening theme editor for {template.title}. You'll be able to add the bundle widget to your theme."` | ✅ |
| Deep-link URL spec | Shopify's official `template + addAppBlockId + target + previewPath` | `https://{shop}/admin/themes/current/editor?template={handle}&addAppBlockId={apiKey}/{blockHandle}&target=newAppsSection&bundleId={id}&previewPath=/products/{handle}` — line 158 | ✅ |

## What we explicitly do NOT do (per user direction)

- Do not use the stale "merchant dragged the widget block" interpretation for future PPB parity work.
- Validate PPB inside the native Buy buttons/product-form footprint.
- Treat native ATC/payment visibility as template/theme behavior that must be measured before changing source.

## Verification on Wolfpack SIT

Manual e2e walkthrough to run after #10's modal lands (already done):

1. From PPB configure on Wolfpack SIT, click "Place Widget".
2. Confirm modal opens to select a target template.
3. Pick a template → toast `"Opening theme editor for …"` shows; Theme Editor opens with block pre-selected.
4. Drag the block above the ATC zone → save.
5. Visit `wolfpack-store-test-1.myshopify.com/products/{bundle-product-handle}` (password `1`).
6. Confirm the bundle widget renders above ATC and the native Shopify ATC is hidden (replaced by the bundle's "Add Bundle to Cart" button).
7. Drag the block to a different position → save → confirm new placement on storefront.
8. Mobile emulate iPhone 14 — repeat steps 6–7.

This verification is merchant-driven (drag in Theme Editor); no code change to ship.

## Closing the loop

The PDF feedback "by default the bundle widget should be placed above ATC button" was interpreted in the original plan as "auto-inject above ATC". After the live EB walk, the truer reading is: "place it via Theme Editor on the merchant's preferred section, then hide native ATC so the bundle ATC sits there." Wolfpack already does that — the missing piece for the merchant was just the embed enablement banner (#10) so they realize they need to actually drag the block somewhere first.
