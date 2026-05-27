# Product Owner Requirements: Single Embed Bundle Architecture

## Acceptance Criteria

- Given a merchant opens Theme Editor App Embeds, they see `Wolfpack Bundle` as the single app embed for this app.
- Given a merchant opens FPB Bundle Visibility, the app embed status checks `bundle-app-embed` and the bundle link uses `/apps/product-bundles/wpb/:bundleId`.
- Given a merchant opens PPB Bundle Visibility, `Bundle Widget` and `Bundle Embed` remain available and use the single embed status.
- Given a shopper opens a valid FPB proxy URL, the full-page widget renders from the bundle config for that shop and bundle.
- Given a shopper opens an invalid or unsigned FPB proxy URL, the page returns an error instead of exposing data.
- Given existing bundles are stale after deployment, the merchant uses Sync Bundle to refresh storefront data.

## Explicit Decisions

- Public FPB route: `/apps/product-bundles/wpb/:bundleId`.
- Single embed handle: `bundle-app-embed`.
- Single embed merchant label: `Wolfpack Bundle`.
- PPB builder block handle: `bundle-product-page`.
- Upsell block handles: `bundle-upsell-block`, `bundle-upsell-button`.
- No competitor terms are used in code identifiers, handles, comments, or CSS classes.
