---
schema_version: 1
id: ppb-g07-g35-product-page-custom-css-scope-evidence
title: PPB G07/G35 Product Page Custom CSS Scope Evidence
type: parity-evidence
status: verified
summary: Proves Product Page custom CSS is persisted, served, applied, and restored through the EB and WPB Product Page CSS runtime.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/lib/settings-controls-runtime.ts
  - app/routes/app/app.settings.tsx
  - app/routes/api/api.design-settings.$shopDomain.tsx
  - app/assets/bundle-widget-product-page.js
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - internal docs/EB Edit Settings Gap Audit 2026-06-04.md
  - internal docs/EB Settings Design Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - g07
  - g35
  - custom-css
keywords:
  - Custom CSS for Mix And Match Bundles
  - Product Page custom CSS
  - design-settings
  - Product Page Layout CSS and Scripts
---

# PPB G07/G35 Product Page Custom CSS Scope Evidence

## Result

G07 and G35 are terminal **P** for all PPB templates.

The relevant EB control is a Product Page Layout control, not a per-template control. Its helper text says: "The CSS written here will be applied to all product page bundles." The storefront runtime exposes the saved value through `window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings.customStyle` and applies it before the Product Page template-specific body attributes are consumed.

## EB admin save proof

Fixture: `yash-wolfpack.myshopify.com`, EB Settings → Controls → Product Page Layout → CSS & Scripts.

The EB iframe form-fill blocker was eventing-only. Writing the textarea value through Chrome DevTools changed the visible value but did not mark the page dirty until the native textarea setter was followed by an `InputEvent`. After using the native setter plus input/change events:

- Shopify save bar appeared with `Unsaved changes`.
- Save posted `POST /api/user/updategeneralsettings?shopName=yash-wolfpack.myshopify.com` with status 200.
- Save posted `POST /api/pageCustomization/update?shopName=yash-wolfpack.myshopify.com` with status 200.

Test CSS:

```css
body::before{content:"EB-G07-G35-CSS";position:fixed;top:0;left:0;z-index:2147483000;background:#ff00ff;color:#0033ff;padding:4px 8px;font:700 13px monospace;}
```

## EB storefront proof

Fixture: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Before each pass, Cache Storage, localStorage, and sessionStorage were cleared, then the page was hard reloaded with cache ignored.

Desktop `1280x800x1`:

```json
{
  "bodyTemplateType": "PDP_INPAGE",
  "bodyTemplateId": "COGNIVE",
  "cssHasSentinel": true,
  "customStyle": "body::before{content:\"EB-G07-G35-CSS\";position:fixed;top:0;left:0;z-index:2147483000;background:#ff00ff;color:#0033ff;padding:4px 8px;font:700 13px monospace;}",
  "beforeContent": "\"EB-G07-G35-CSS\"",
  "beforeBg": "rgb(255, 0, 255)",
  "beforeColor": "rgb(0, 51, 255)",
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "bodyTemplateType": "PDP_INPAGE",
  "bodyTemplateId": "COGNIVE",
  "cssHasSentinel": true,
  "customStyle": "body::before{content:\"EB-G07-G35-CSS\";position:fixed;top:0;left:0;z-index:2147483000;background:#ff00ff;color:#0033ff;padding:4px 8px;font:700 13px monospace;}",
  "beforeContent": "\"EB-G07-G35-CSS\"",
  "beforeBg": "rgb(255, 0, 255)",
  "beforeColor": "rgb(0, 51, 255)",
  "overflowX": 0
}
```

EB fixture restore:

- The Product Page custom CSS textarea was cleared with the same native setter plus `InputEvent`.
- Restore save posted `POST /api/user/updategeneralsettings?shopName=yash-wolfpack.myshopify.com` with status 200.
- Restore save posted `POST /api/pageCustomization/update?shopName=yash-wolfpack.myshopify.com` with status 200.
- Desktop hard reload: `cssHasSentinel:false`, `customStyle:null`, `beforeContent:"none"`, `overflowX:0`.
- Mobile hard reload: `cssHasSentinel:false`, `customStyle:null`, `beforeContent:"none"`, `overflowX:0`.

## WPB storefront proof

Fixture: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

The SIT `product_page` DesignSettings row was backed up before mutation and restored after proof. The sentinel was written through the Product Page settings-controls runtime into `DesignSettings.customCss` and `productPage.css.mixAndMatchBundles`.

Test CSS:

```css
body::before{content:"WPB-G07-G35-CSS";position:fixed;top:0;left:0;z-index:2147483000;background:#ff00ff;color:#0033ff;padding:4px 8px;font:700 13px monospace;}
```

Desktop `1280x800x1`, after cache-clear hard reload:

```json
{
  "cssStatus": 200,
  "cssHasSentinel": true,
  "beforeContent": "\"WPB-G07-G35-CSS\"",
  "beforeBg": "rgb(255, 0, 255)",
  "beforeColor": "rgb(0, 51, 255)",
  "version": "5.0.189",
  "overflowX": 0,
  "linkHrefs": [
    "https://agent-5sfidg3m.myshopify.com/apps/product-bundles/api/design-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page"
  ]
}
```

Mobile `390x844x3`, after cache-clear hard reload:

```json
{
  "cssStatus": 200,
  "cssHasSentinel": true,
  "beforeContent": "\"WPB-G07-G35-CSS\"",
  "beforeBg": "rgb(255, 0, 255)",
  "beforeColor": "rgb(0, 51, 255)",
  "version": "5.0.189",
  "overflowX": 0,
  "linkHrefs": [
    "https://agent-5sfidg3m.myshopify.com/apps/product-bundles/api/design-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page"
  ]
}
```

After restore, a mobile cache-clear hard reload returned `cssStatus:200`, `cssHasSentinel:false`, `beforeContent:"none"`, and `overflowX:0`.

## Classification rationale

G07 and G35 represent the same PPB Product Page custom CSS surface for this matrix pass:

- EB labels the field `Custom CSS for Mix And Match Bundles` and states that it applies to all product page bundles.
- EB persists and serves it through the Product Page page-customization runtime, not through an individual product card or template setting.
- WPB serves PPB custom CSS through `/apps/product-bundles/api/design-settings/{shop}?bundleType=product_page`, loaded by the Product Page widget before template-specific rendering.
- The CSS is scoped to Product Page bundles and remains distinct from Full Page/Landing Page CSS fields.

Therefore one Product Page CSS replay closes G07 and G35 across Product List, Product Grid, Horizontal Slots, and Vertical Slots without requiring additional product-source fixture changes.
