---
title: Theme App Extensions
type: shopify-integration
audited: 2026-07-10
sources: shopify.dev ThemeRole, shopify.dev themes query, shopify.dev theme app extension configuration
---

# Theme App Extensions

Shopify stores app embed activation per theme. `ThemeRole.MAIN` is the currently published storefront theme, and Shopify allows only one main theme at a time. Unpublished and development themes can also have the app embed enabled, but that does not make the live storefront embed active.

The Wolfpack app embed status check reads the MAIN theme's `config/settings_data.json` via Admin GraphQL theme files using `themes(first: 1, roles: [MAIN])`. The returned `appEmbedEnabled` boolean is based only on the active published storefront theme, matching EB-style app embed gating. Non-main enabled themes are not part of the Preview/banner hot path because a draft-theme activation does not make the live storefront embed active.

App embed detection depends on the app handle and app embed block handle in Shopify's settings data, not the extension UID alone. For production, the expected app embed type is:

```text
shopify://apps/wolfpack-product-bundles-4/blocks/bundle-app-embed/<theme-extension-uid>
```

Current production identifiers:

- App handle: `wolfpack-product-bundles-4`
- Legacy app handle retained in some active theme settings: `wolfpack-product-bundles`
- Theme extension handle: `bundle-builder`
- App embed block handle: `bundle-app-embed`
- Theme extension UID: `23b807f7-472d-4f93-e241-5a1e079d6b51548daaf2`

2026-07-10 production proof on `wolfpackdemostore.myshopify.com`: MAIN theme `wolfpack-dawn-branded` (`gid://shopify/OnlineStoreTheme/150981345468`) had an enabled `bundle-app-embed` block stored as `shopify://apps/wolfpack-product-bundles/blocks/bundle-app-embed/...`, while Shopify reported the current app installation handle as `wolfpack-product-bundles-4`. App embed detection must include the legacy handle or the Admin banner will falsely report that the app embed is disabled.
