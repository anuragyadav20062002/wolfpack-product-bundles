---
title: Theme App Extensions
type: shopify-integration
audited: 2026-07-10
sources: shopify.dev ThemeRole, shopify.dev themes query, shopify.dev theme app extension configuration
---

# Theme App Extensions

Shopify stores app embed activation per theme. `ThemeRole.MAIN` is the currently published storefront theme, and Shopify allows only one main theme at a time. Unpublished and development themes can also have the app embed enabled, but that does not make the live storefront embed active.

The Wolfpack app embed status check scans paginated theme results and reads each theme's `config/settings_data.json` via Admin GraphQL theme files. The returned `appEmbedEnabled` boolean is intentionally based on the MAIN theme only. Non-main enabled themes are retained as diagnostics so a draft-theme activation does not hide the live storefront warning.

App embed detection depends on the app handle and app embed block handle in Shopify's settings data, not the extension UID alone. For production, the expected app embed type is:

```text
shopify://apps/wolfpack-product-bundles-4/blocks/bundle-app-embed/<theme-extension-uid>
```

Current production identifiers:

- App handle: `wolfpack-product-bundles-4`
- Theme extension handle: `bundle-builder`
- App embed block handle: `bundle-app-embed`
- Theme extension UID: `23b807f7-472d-4f93-e241-5a1e079d6b51548daaf2`
