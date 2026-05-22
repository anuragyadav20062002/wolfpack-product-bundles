# Architecture: Single Embed Bundle Architecture

## Theme Extension

The extension exposes one body app embed, `bundle-app-embed`, named `Wolfpack Bundle`. It acts as the global activation/status surface. Storefront widget placement is handled by explicit app blocks:

- `bundle-product-page` renders the direct product-page bundle builder.
- `bundle-upsell-block` renders a product-page upsell block link.
- `bundle-upsell-button` renders a product-page upsell button link.
- `bundle-full-page` remains the section block for manual FPB placement, but the default FPB storefront URL is the app proxy route.

## FPB Proxy Page

`GET /apps/product-bundles/wpb/:bundleId` maps to the Remix route `/wpb/:bundleId`. Shopify app proxy HMAC is verified before any bundle lookup. The route fetches the bundle for the verified shop, formats it with the existing widget formatter, and returns an HTML shell that loads:

- `/apps/product-bundles/api/design-settings/:shop?bundleType=full_page`
- `/apps/product-bundles/assets/bundle-widget-full-page.css`
- `/apps/product-bundles/assets/bundle-widget-full-page-bundled.js`

## Configure Pages

Both FPB and PPB loaders check `bundle-app-embed`. PPB keeps `Bundle Widget` and `Bundle Embed`; FPB keeps only `Bundle Widget`. Theme Editor links point to either the single app embed or the relevant app block handle.

## Rollout

Existing bundles require Sync Bundle after deployment. The implementation intentionally avoids old embed fallback chains and legacy routing shims.
