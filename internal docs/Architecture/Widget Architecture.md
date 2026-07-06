---
title: Widget Architecture
type: architecture
audited: 2026-06-13
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
- Registries resolve canonical app template identifiers to those target template configs. FPB Standard is stored and emitted as `STANDARD`.

Template installer/prototype patch functions have been removed. Widget entry files compose exported template method objects in the same central `Object.assign` used for controller method modules.

Source module names should describe their storefront responsibility. Avoid mechanical names such as `chunk-01.js` or `part-01.css`; those hide ownership and make stale widget code harder to spot.

The shared Bundle Product Modal is intentionally a single-image product details modal: product image, name, description, variant controls when needed, quantity, and Add To Box. Do not reintroduce modal thumbnails, image counters, or carousel/gallery controls; EB's landing-page quick-view modal does not use a gallery.

---

## Storefront Surfaces

- Theme Editor now exposes one body app embed: `bundle-app-embed` (`Wolfpack Bundle`). It is the activation/status surface and hydrates app-created full-page bundle page markers only when a dedicated full-page app block has not already rendered a widget container. Those hidden page-body markers must also carry only the compact bootstrap pointer, never a formatted full bundle payload.
- Shopify stores enabled app embed blocks in `config/settings_data.json` under `current.blocks`. Per Shopify's Theme app extension configuration docs, an app embed appears there only after first enable; if the merchant disables it later, the block remains and has `disabled: true`. App embed status detection must therefore read the active theme settings file, support both `OnlineStoreThemeFileBodyText.content` and `OnlineStoreThemeFileBodyBase64.contentBase64`, match the block `type` shape `shopify://apps/{app-or-extension-handle}/blocks/{block-handle}/{unique-id}`, and treat `disabled: true` as inactive. The configured theme extension handle is `bundle-builder`; also include Shopify Admin `currentAppInstallation.app.handle` so the checker remains aligned with the installed app identity. Do not use client/API keys for status detection. If `settings_data.json` is malformed or truncated, fail open because Shopify can return oversized theme settings incompletely and the app cannot prove the embed is disabled; missing theme/settings content still fails closed.
- The embedded Admin enable flow opens Theme Editor in a new tab and hides the configure warning plus updates Bundle Visibility status optimistically after the merchant clicks `Enable here`. Configure page-load status comes from the server loader's parallel Shopify theme settings read; do not add a client-side status request on render. Preview actions must run a live app embed status check against the active theme settings only when the configure state currently believes the app embed is enabled. That client revalidation posts to `/app/app-embed-status`, not the configure document action, so HTML document responses are not interpreted as a disabled embed. If the configure state is already disabled, preview blocks immediately and shows/shakes the warning without revalidating; if the optimistic enabled state later fails the live check, the warning banner and Bundle Visibility status are shown as disabled again.
- Product-page builder placement uses the `bundle-product-page` app block.
- Product-page upsell placement uses `bundle-upsell-block` or `bundle-upsell-button`.
- Full-page bundle public links use Shopify page URLs (`/pages/{handle}`) so the store theme and theme-extension assets own rendering. Legacy signed app-proxy links redirect to the linked Shopify page when possible.
- Storefront JS/CSS must be loaded from Shopify theme-extension assets with Liquid `asset_url`. App proxy routes are only for API/data responses, not widget asset hosting.

## FPB Load Strategy

> **Do not modify the load order** — see `CLAUDE.md` → "Do Not Touch" section.

### Shopify Page Block / Marker Stage — Bootstrap Pointer
The Liquid block and app-embed page-body marker both write a compact bootstrap marker as JSON into `data-bundle-config`:
```liquid
data-bundle-config='{"v":2,"type":"full_page","bundleType":"full_page","id":"{{ bundle_id }}"}'
```
Widget currently loads in API-first mode for full-page bundles:
1. Compact bootstrap marker (`v`, `type`, `bundleType`, `id`) is treated as a stable pointer.
2. If marker is missing or invalid → API fetch.

`data-bundle-config` is not used to transport full bundle payload for first paint in this path. A legacy full payload marker is not required and is not relied upon for initialization. This applies to both the section app block and the hidden `data-wpb-full-page-bundle` marker written by `app/services/widget-installation/widget-full-page-bundle.server.ts`.

### Legacy App Proxy Redirect — Public FPB Route

The legacy public FPB route is `GET /apps/product-bundles/wpb/{bundleId}`. Shopify forwards it to Remix as `/wpb/{bundleId}` and app-proxy HMAC verification is required before lookup.

This route must not render a standalone storefront shell or load `/apps/product-bundles/assets/...` JS/CSS. When the bundle has a linked `shopifyPageHandle`, it redirects to the Shopify page URL so the theme app block loads JS/CSS through Shopify `asset_url`. If no page is linked, it returns a setup response instead of a proxy asset shell.

### API Fallback
If metafield cache is absent/malformed → `GET /apps/product-bundles/api/bundle/{id}.json`
- Single retry after 3s for `503`/`504` responses (Render cold-start tolerance)

The full-page Liquid block and app-embed marker write only a compact bootstrap marker into `data-bundle-config`:
```liquid
{"v":2,"type":"full_page","bundleType":"full_page","id":"..."}
```
The widget hydrates current bundle data from `/api/bundle/{id}.json`. The route also supports a bootstrap projection via `?fields=bootstrap`; projection response returns compact marker shape (`v`, `type`, `bundleType`, `id`, and timestamps/template defaults) while default response remains full bundle payload.

Response headers include `Cache-Control`, `ETag`, and `Last-Modified`; unchanged bundles return `304` when validators match.

**Metafield writer**: `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts`
If bundle config structure changes → update both the server writer AND the widget parser.

## PPB Load Strategy

### Product-Page Block Stage — Marker Bootstrap
The PPB app block writes only a compact pointer into `data-bundle-config`:
```liquid
data-bundle-config='{"v":2,"type":"product_page","bundleType":"product_page","id":"{{ bundle_id }}"}'
```
`bundle_ui_config` is still read to validate bundle-type context for container detection, but it is no longer serialized as a full bundle payload into the DOM.

Runtime behavior in `app/assets/widgets/product-page/methods/config-lifecycle-methods.js`:
1. Parse `data-bundle-config` as a bootstrap marker only when `data-bundle-type="product_page"`.
2. If marker is valid, fetch from:
   - `GET /apps/product-bundles/api/bundle/{bundleId}.json`
   - accept the `response.bundle` payload and hydrate `this.bundleData`.
3. If marker is missing/invalid:
   - show theme editor preview when in editor mode and `bundleId` exists
   - otherwise hide the container on storefront
4. Preserve transient retry for `503`/`504` only (3-second delay).

### Migration intent (PPB)
- Remove full-bundle payload writes into PPB HTML attributes.
- Keep API as source of truth for runtime hydration.
- Keep non-bundle and theme-editor behavior stable.

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

## Placeholder Media Strategy

- Bundle product placeholders now render from a local AVIF artifact:
  - `/bundle-product-placeholder.avif`
- App fallback still accepts `/bundle-product-placeholder.png` for backward compatibility in browsers or clients that do not decode AVIF or when an image transport path does not support AVIF.
- The fallback is applied at image render time (`onerror`), so the UI keeps working in all supported storefront clients without regressing existing media URLs.
- `public/bundle-product-placeholder.svg` has been decommissioned and should not be used anymore.

The Liquid blocks expose template CSS URL maps and the widget runtime loads the active template stylesheet. Do not solve the limit by minifying readable source into one-line CSS; remove redundant/conflicting rules or split template CSS by ownership.

---

## Cache Busting

Shopify CDN `asset_url` filter appends `?v=HASH` — this hash only changes on `shopify app deploy`. Custom query params are NOT on the allowlist. Always deploy after widget changes.

Storefront JS/CSS loading strategy: FPB and Product Page bundle blocks load assets from Shopify theme-extension assets with Liquid `asset_url`. App proxy remains for API/data routes only.

### Dev Preview Asset 404 / ORB Failure

When a Shopify CLI dev preview asset hash expires or points at a missing theme-extension build, the storefront can still emit normal Liquid `asset_url` script/link tags while the referenced `https://cdn.shopify.com/extensions/.../dev-.../assets/...` URLs return Shopify `404` HTML. Chrome then reports the subresource loads as `net::ERR_BLOCKED_BY_ORB` or CORB because the browser requested CSS/JS but received `text/html`.

Do not diagnose that state as a widget boot or Classic template bug until the asset URL is checked directly. Required proof:
- Hard reload the storefront with cache bypass after clearing Cache Storage.
- Verify `window.__BUNDLE_WIDGET_VERSION__`; a missing value means the widget JS did not execute.
- Open or fetch the exact blocked asset URL. If it returns Shopify `404: Page not found` with `content-type: text/html`, the live proof is blocked by the dev-extension asset state, not by storefront source.
- Compare against any older already-open tab before trusting it. A stale tab can keep a previous dev asset hash and `window.__BUNDLE_WIDGET_VERSION__` while fresh tabs point at a newer missing hash.
