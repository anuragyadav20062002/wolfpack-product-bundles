---
title: EB Settings Language Reference
type: reference
last_audited: 2026-06-04
---

# EB Settings Language Reference

This document captures live EB behavior from `yash-wolfpack.myshopify.com` for Settings -> Language. Evidence came from Chrome DevTools snapshots, a saved-field network capture, and FPB/PPB storefront runtime globals.

## Admin Data Flow

EB Settings -> Language is store-level, not bundle-level. A save posts the complete language document to:

```text
POST https://prod.backend.giftbox.giftkart.app/api/saveLanguage/update?shopName={shop}
```

Immediately after save, EB rereads:

```text
GET https://prod.backend.giftbox.giftkart.app/api/saveLanguage/read?shopName={shop}
```

The update payload is the full persisted language document, not a patch. Top-level roots:

```text
_id
shopName
__v
createdAt
updatedAt
languageMode
en
mixAndMatchTextData
sharedComponents
```

`languageMode` is `"MULTIPLE"` when Enable Multilanguage is checked. The observed active language was English, stored under `en`.

## Admin UI Grouping

Top controls:

- Enable Multilanguage checkbox controls `languageMode`.
- Add preferred languages selects the active editing language.
- Active language chip displays the current language.

Shared Components:

- Cart & Checkout maps to `sharedComponents.{locale}.cartAndCheckout`.

Template Language has two layouts:

- Landing Page Layout maps to `en`.
- Product Page Layout maps to `mixAndMatchTextData.en`.

Landing Page Layout panels:

- Product Card
- Bundle Cart
- Bundle
- Popups
- Toasts
- Addons
- Messages

Product Page Layout panels:

- Product Card
- Bundle Cart
- Bundle
- Toasts

## Storefront Propagation

Both FPB and PPB storefronts receive the complete store-level document at:

```js
window.easybundles_ext_data.languageData
```

FPB then reduces the active locale into:

```js
window.gbb.settings.languageData
```

This active FPB object contains `landingPage`, `navigationSteps`, `productPage`, `giftBoxPage`, `videoMessage`, `personalizePage`, `reviewPage`, `discountRules`, `sortBy`, `conditions`, `general`, `multipleCategoriesPage`, `multipleCategories`, `addons`, `modals`, and `sharedComponents`.

PPB also exposes the active FPB-style locale at:

```js
window.gbbMix.settings.languageData
```

For actual PPB widget copy, EB flattens Product Page language into:

```js
window.gbbMix.settings.pageCustomizationSettings.customTextSettings
```

Shared cart labels are also available at:

```js
window.gbbMix.constants.cartLineLabels
```

## Field Roots

Shared Cart & Checkout has 3 fields:

- `bundleContainsLabel` -> cart/checkout bundle item label, default `Items`
- `bundleOriginalPriceLabel` -> original price line label, default `Retail Price`
- `bundleDiscountDisplayLabel` -> savings line label, default `You Save`

Landing Page / FPB (`en`) has 135 leaf text fields across these roots:

- `landingPage`
- `navigationSteps`
- `productPage`
- `giftBoxPage`
- `videoMessage`
- `personalizePage`
- `reviewPage`
- `discountRules`
- `sortBy`
- `conditions`
- `general`
- `multipleCategoriesPage`
- `addons`
- `modals.clearCart`

Product Page / PPB (`mixAndMatchTextData.en`) has 30 leaf text fields:

- `productCard`
- `general`
- `footer`
- `conditions.amount`
- `conditions.quantity`

Runtime PPB `customTextSettings` values are plain strings. Runtime FPB `languageData` values remain EB field objects with `{id,label,type,value}`.

## Variable Tokens

Admin fields display variable tokens in double braces, for example:

```text
{{conditionQuantity}}
{{conditionAmount}}
{{conditionWeight}}
{{boxSelectionDifference}}
{{quantityDifference}}
{{allowedQuantity}}
{{stepName}}
{{maxAllowedAddons}}
```

The raw `saveLanguage/read` document uses double braces. In the observed FPB active runtime object, some condition/toast variables were normalized to `##token##`. PPB `customTextSettings` kept double braces.

## WPB Implementation Target

WPB should persist one EB-shaped language document in `DesignSettings.generalSettings.settingsLanguage` for both `full_page` and `product_page`.

The storefront should receive a single app-proxy JSON response with:

- `languageMode`
- full `languageData`
- active FPB locale object
- PPB `customTextSettings`
- shared cart labels

Widgets should consume this runtime data before rendering text. FPB should resolve Settings Language before per-bundle text fallback. PPB should use separate keys for product-card add text and bundle add-to-cart text because EB controls them independently.
