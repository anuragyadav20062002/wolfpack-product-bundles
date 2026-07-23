---
schema_version: 1
id: widget-architecture
title: Widget Architecture
type: architecture
status: authoritative
summary: FPB and PPB bootstrap, hydration, extension-asset, and widget runtime architecture.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - storefront
systems:
  - widget-runtime
source_paths:
  - app/assets/bundle-widget-full-page.js
  - app/assets/bundle-widget-product-page.js
  - app/routes/app/app.settings/design-preview-model.ts
  - app/routes/root/wpb.$bundleId.tsx
related_docs:
  - Architecture/FPB Host Evaluation.md
tags:
  - architecture
  - widgets
keywords:
  - data-bundle-config
  - asset_url
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

## Admin Design Preview Adapter

Settings -> Design resolves its eight local preview descriptors from
`mapTemplateSelection` and the same FPB/PPB template config registries listed
above. The descriptor reads canonical product-card mode, configured columns,
timeline mode, summary mode, and slot orientation; its Admin-only adapter adds
supported surfaces, semantic fixture regions, and responsive composition.

The Admin preview must remain a local structural representation. It uses
deterministic fixture records and `buildSettingsDesignRuntime` theme values, but
does not import storefront CSS, instantiate a widget controller, fetch a bundle,
embed an iframe, mutate a cart, or persist preview state. Public template images
are reference evidence only. This boundary lets template IDs and runtime design
tokens stay canonical without coupling the Settings chunk to the storefront
runtime.

Source module names should describe their storefront responsibility. Avoid mechanical names such as `chunk-01.js` or `part-01.css`; those hide ownership and make stale widget code harder to spot.

The shared Bundle Product Modal is intentionally a single-image product details modal: product image, name, description, variant controls when needed, quantity, and Add To Box. Do not reintroduce modal thumbnails, image counters, or carousel/gallery controls; EB's landing-page quick-view modal does not use a gallery.

PPB Product List (`PDP_INPAGE + CASCADE`) owns its multi-step navigation in the Product Page layout, footer, and validation method modules. A multi-step Product List renders only `currentStepIndex`; intermediate primary actions navigate Next after current-step validation, the final step uses Add Bundle to Cart, and Back preserves selections across steps. Single-step Product List and the other PPB templates keep their existing rendering paths. Product List exact-rule over-selection is blocked before state mutation so the current step and selected-items drawer remain stable.

Before PPB category-as-step expansion, the runtime removes steps whose persisted `enabled` value is `false`. This visibility normalization also applies when category expansion is off, so a disabled Admin step can never render or prevent a single enabled multi-category step from expanding into navigable category steps.

Product Page inventory normalization preserves `sourceVariantCount` after unavailable variants are filtered. Product List uses that metadata only when a grouped product originally had multiple variants but now has one sellable variant: the shared row shows the surviving variant title as static identity while keeping the selector absent. Fully unavailable products and unavailable options remain filtered.

---

## Storefront Surfaces

- Theme Editor now exposes one body app embed: `bundle-app-embed` (`Wolfpack Bundle`). It is the activation/status surface and hydrates app-created full-page bundle page markers only when a dedicated full-page app block has not already rendered a widget container. Those hidden page-body markers must also carry only the compact bootstrap pointer, never a formatted full bundle payload.
- Shopify stores enabled app embed blocks in `config/settings_data.json` under `current.blocks`. Per Shopify's Theme app extension configuration docs, an app embed appears there only after first enable; if the merchant disables it later, the block remains and has `disabled: true`. App embed status detection must therefore read the active theme settings file, support `OnlineStoreThemeFileBodyText.content`, `OnlineStoreThemeFileBodyBase64.contentBase64`, and `OnlineStoreThemeFileBodyUrl.url`, tolerate Shopify's generated comment header before parsing the settings JSON, match the block `type` shape `shopify://apps/{app-or-extension-handle}/blocks/{block-handle}/{unique-id}`, and treat `disabled: true` as inactive. The configured theme extension handle is `bundle-builder`; also include the known deployed app handles (`wolfpack-product-bundles-4`, `wolfpack-product-bundles-sit`), `SHOPIFY_APP_HANDLE` when set, and Shopify Admin `currentAppInstallation.app.handle` so the checker remains aligned with the installed app identity. Do not use client/API keys for status detection. If `settings_data.json` is missing, malformed after comment normalization, or truncated, fail closed so merchants see the enable banner instead of a false Active state.
- The embedded Admin enable flow opens Theme Editor in a new tab and hides the configure warning plus updates Bundle Visibility status optimistically after the merchant clicks `Enable here`. Configure page-load status comes from the server loader's parallel Shopify theme settings read. Every FPB preview action requests a new stateless signed URL; the token is required for drafts and harmless for public statuses.
- Product-page builder placement uses the `bundle-product-page` app block. The app embed does not inject PPB markup because the merchant controls the widget's product-page position through this section block.
- Before opening a PPB storefront preview, the preview flow first synchronizes the selected product template, then posts to the dedicated authenticated `/validate-widget-placement` JSON resource route. That route reads the parent product's effective `templateSuffix`, inspects that product JSON template in the MAIN theme, and verifies an app block owned by the current app with handle `bundle-product-page`. The placement check must not post to the rendered configure document route because an embedded document response can be HTML rather than the JSON contract expected by the client. Missing, malformed, or unreadable template data fails closed and opens Shopify's Theme Editor deep link for that exact template and product. A parent product alone is not evidence that the PPB widget is installed.
- Product-page upsell placement uses `bundle-upsell-block` or `bundle-upsell-button`.
- Full-page bundle public links use the signed app-proxy document URL (`/apps/product-bundles/wpb/{bundleId}`). Shopify wraps `application/liquid` in the active theme layout and the app embed loads extension assets through `asset_url`.
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

### App Proxy Document — Public FPB Route

The public FPB route is `GET /apps/product-bundles/wpb/{bundleId}`. Shopify forwards it to Remix as `/wpb/{bundleId}` and app-proxy HMAC verification is required before lookup.

The route returns an escaped full `formatBundleForWidget()` payload in the existing marker, marks it with `data-bundle-config-source="app_proxy"`, and responds with `Content-Type: application/liquid` and `Cache-Control: no-store`. The widget treats only this source-marked, bundle-ID-matched full payload as authoritative and renders it without requesting bundle JSON. Unmarked legacy Page payloads and compact theme markers continue through API hydration. Active and unlisted bundles render publicly; drafts require a 15-minute shop-and-bundle-bound `wpb_preview` token. The route never emits `/apps/product-bundles/assets/...` URLs.

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

### JS/CSS Asset Skew

Do not trust `window.__BUNDLE_WIDGET_VERSION__` by itself for CSS-only or CSS-heavy storefront fixes. The value proves the served JS bundle executed, but Product Page template CSS is a separate Shopify extension asset such as `bundle-widget-product-page-cascade.css`.

Observed 2026-07-13 in SIT: the storefront served `bundle-widget-product-page-bundled.js` with `window.__BUNDLE_WIDGET_VERSION__ = "5.0.145"` while the exact Shopify CDN `bundle-widget-product-page-cascade.css` still lacked `--bw-ppb-cascade-action-radius` and still contained the older `border-radius:100px` Product List quantity-wrapper rule. The local generated CSS asset was correct.

For storefront visual proof after CSS changes:
- Hard reload after clearing Cache Storage.
- Record `window.__BUNDLE_WIDGET_VERSION__`.
- Record the exact active CSS asset URL.
- Fetch the active CSS asset URL and verify the expected token/rule is present.
- Then measure computed styles. If JS is current but CSS is stale, proof is blocked by extension asset propagation/deploy state, not by the source patch.

### Dev Preview Asset 404 / ORB Failure

When a Shopify CLI dev preview asset hash expires or points at a missing theme-extension build, the storefront can still emit normal Liquid `asset_url` script/link tags while the referenced `https://cdn.shopify.com/extensions/.../dev-.../assets/...` URLs return Shopify `404` HTML. Chrome then reports the subresource loads as `net::ERR_BLOCKED_BY_ORB` or CORB because the browser requested CSS/JS but received `text/html`.

Do not diagnose that state as a widget boot or Classic template bug until the asset URL is checked directly. Required proof:
- Hard reload the storefront with cache bypass after clearing Cache Storage.
- Verify `window.__BUNDLE_WIDGET_VERSION__`; a missing value means the widget JS did not execute.
- Open or fetch the exact blocked asset URL. If it returns Shopify `404: Page not found` with `content-type: text/html`, the live proof is blocked by the dev-extension asset state, not by storefront source.
- Compare against any older already-open tab before trusting it. A stale tab can keep a previous dev asset hash and `window.__BUNDLE_WIDGET_VERSION__` while fresh tabs point at a newer missing hash.
