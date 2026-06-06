# PDP Widget Placement — EB Parity Audit

**Issue:** feedback-jun26-7
**Created:** 2026-05-29
**Outcome:** ✅ Wolfpack already implements the equivalent flow end-to-end. No production code changes required.

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

The widget renders wherever the merchant placed the app block (here it's in the product-form section), and the block hides the native ATC so the bundle ATC sits in its place. **No auto-injection anywhere.**

## Wolfpack equivalents

| Behavior | EB | Wolfpack | Status |
|---|---|---|---|
| Global theme app embed | Easy Bundle embed | `bundle-app-embed` block (checked by `app/services/theme/app-embed-check.server.ts` via `WOLFPACK_APP_HANDLES`) | ✅ |
| PDP app block | Product Page Builder block | `extensions/bundle-builder/blocks/bundle-product-page.liquid`, schema `target: "section"`, `enabled_on.templates: ["product"]` (line 121) | ✅ |
| Hide native Shopify ATC on bundle products | Yes (CSS injected by block) | Lines 51–66 of `bundle-product-page.liquid`, gated on `block.settings.hide_native_buttons` (default true). Selectors include `.product-form__cart-submit`, `button[name="add"]:not(.bundle-add-to-cart)`, `.shopify-payment-button`, etc. | ✅ |
| Custom bundle ATC button | `<div class="gbbMixCascadeFooterBtnsWrapper">…Add Bundle to Cart…</div>` | Line 48: `<button class="add-bundle-to-cart">{{ block.settings.add_to_cart_label }}</button>` | ✅ |
| "Place Widget" deep-link from admin | Yes — toast "Product Page Builder added", Theme Editor opens with block pre-selected | `handlePlaceWidget` (`route.tsx:1697`) → page-selection modal → `buildProductPageThemeEditorDeepLink` (`product-page-admin-sections.ts:149`) → toast `"Opening theme editor for {template.title}. You'll be able to add the bundle widget to your theme."` | ✅ |
| Deep-link URL spec | Shopify's official `template + addAppBlockId + target + previewPath` | `https://{shop}/admin/themes/current/editor?template={handle}&addAppBlockId={apiKey}/{blockHandle}&target=newAppsSection&bundleId={id}&previewPath=/products/{handle}` — line 158 | ✅ |

## What we explicitly do NOT do (per user direction)

- ❌ No auto-injection JS in the theme app embed.
- ❌ No DCP `pdpWidgetPlacement` toggle.
- ❌ No Liquid block schema changes for placement (Shopify section editor handles drag-and-drop).
- ❌ No `WIDGET_VERSION` bump for #7 (no widget code changed).

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
