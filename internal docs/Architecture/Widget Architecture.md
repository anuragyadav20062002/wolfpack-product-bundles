---
title: Widget Architecture
type: architecture
audited: 2026-04-16
sources: app/assets/bundle-widget-full-page.js, app/assets/bundle-widget-product-page.js, CLAUDE.md
---

# Widget Architecture

## Two Widgets

| Widget | Source file | Bundle output | Shopify block |
|---|---|---|---|
| Full-Page Bundle (FPB) | `app/assets/bundle-widget-full-page.js` | `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | `bundle-full-page.liquid` |
| Product-Page (PDP) | `app/assets/bundle-widget-product-page.js` | `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | `bundle-product-page.liquid` |

Shared runtime modules live under `app/assets/widgets/shared/`. The build script inlines them into both storefront bundles. `app/assets/bundle-widget-components.js` remains a source-level import barrel only; storefronts do not load it as a separate asset.

Template behavior is resolved through plain config modules and method modules:

- FPB configs: `app/assets/widgets/full-page/templates/{standard,classic,compact,horizontal}.config.js`
- PPB configs: `app/assets/widgets/product-page/templates/{grid,list,horizontal-slots,vertical-slots}.config.js`
- Registries normalize legacy EB-compatible identifiers to those target template configs.

Template installer/prototype patch functions have been removed. Widget entry files compose exported template method objects in the same central `Object.assign` used for controller method modules.

Source module names should describe their storefront responsibility. Avoid mechanical names such as `chunk-01.js` or `part-01.css`; those hide ownership and make stale widget code harder to spot.

The shared Bundle Product Modal is intentionally a single-image product details modal: product image, name, description, variant controls when needed, quantity, and Add To Box. Do not reintroduce modal thumbnails, image counters, or carousel/gallery controls; EB's landing-page quick-view modal does not use a gallery.

---

## Storefront Surfaces

- Theme Editor now exposes one body app embed: `bundle-app-embed` (`Wolfpack Bundle`). It is the activation/status surface and hydrates app-created full-page bundle page markers only when a dedicated full-page app block has not already rendered a widget container.
- Product-page builder placement uses the `bundle-product-page` app block.
- Product-page upsell placement uses `bundle-upsell-block` or `bundle-upsell-button`.
- Full-page bundle public links use Shopify page URLs (`/pages/{handle}`) so the store theme and theme-extension assets own rendering. Legacy signed app-proxy links redirect to the linked Shopify page when possible.
- Storefront JS/CSS must be loaded from Shopify theme-extension assets with Liquid `asset_url`. App proxy routes are only for API/data responses, not widget asset hosting.

## FPB Load Strategy

> **Do not modify the load order** — see `CLAUDE.md` → "Do Not Touch" section.

### Shopify Page Block Stage — Metafield Cache
The Liquid block writes bundle config as JSON into `data-bundle-config` on the widget container:
```liquid
data-bundle-config="{{ page.metafields.custom.bundle_config | escape }}"
```
Widget reads this on init → instant first paint, no API call needed.

### Legacy App Proxy Redirect — Public FPB Route

The legacy public FPB route is `GET /apps/product-bundles/wpb/{bundleId}`. Shopify forwards it to Remix as `/wpb/{bundleId}` and app-proxy HMAC verification is required before lookup.

This route must not render a standalone storefront shell or load `/apps/product-bundles/assets/...` JS/CSS. When the bundle has a linked `shopifyPageHandle`, it redirects to the Shopify page URL so the theme app block loads JS/CSS through Shopify `asset_url`. If no page is linked, it returns a setup response instead of a proxy asset shell.

### API Fallback
If metafield cache is absent/malformed → `GET /apps/product-bundles/api/bundle/{id}.json`
- Single retry after 3s for `503`/`504` responses (Render cold-start tolerance)

**Metafield writer**: `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts`
If bundle config structure changes → update both the server writer AND the widget parser.

---

## Build Process

Source files use ES modules. Shopify extensions require bundled IIFEs.

```bash
npm run build:widgets          # build all
npm run build:widgets:full-page
npm run build:widgets:product-page
```

**Forgetting to build = storefront sees old code.**

---

## Widget Version

`WIDGET_VERSION` is at the top of `scripts/build-widget-bundles.js`.
Embedded as `window.__BUNDLE_WIDGET_VERSION__` in every bundled file.

Verify live version in DevTools:
```javascript
console.log(window.__BUNDLE_WIDGET_VERSION__)
```

Version bump rules:
| Change | Bump |
|---|---|
| Bug fix | PATCH |
| New storefront feature | MINOR |
| Breaking change / redesign | MAJOR |

**Mandatory before every deploy**: increment version → build → check CSS file sizes → deploy.

### CSS Size Limit
Shopify enforces **100,000 B** on app block CSS assets.
```bash
wc -c extensions/bundle-builder/assets/*.css
```

Keep base CSS below the limit by moving template-specific rules into separate extension assets:
- FPB base: `bundle-widget-full-page.css`
- FPB templates: `bundle-widget-full-page-{standard,classic,compact,horizontal}.css`
- PPB base: `bundle-widget.css`
- PPB templates: `bundle-widget-product-page-{cascade,cognive,modal}.css`

The Liquid blocks expose template CSS URL maps and the widget runtime loads the active template stylesheet. Do not solve the limit by minifying readable source into one-line CSS; remove redundant/conflicting rules or split template CSS by ownership.

---

## Cache Busting

Shopify CDN `asset_url` filter appends `?v=HASH` — this hash only changes on `shopify app deploy`. Custom query params are NOT on the allowlist. Always deploy after widget changes.

Storefront JS/CSS loading strategy: FPB and Product Page bundle blocks load assets from Shopify theme-extension assets with Liquid `asset_url`. App proxy remains for API/data routes only.
