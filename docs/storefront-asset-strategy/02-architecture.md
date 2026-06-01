# Architecture: Storefront Asset Strategy

## Fast-Track Note
BR context from: `internal docs/Architecture/Widget Architecture.md`, EB storefront practice discussion, and `docs/issues-prod/eb-configure-completion-parity-1.md` Phase 5 asset-proxy failure.

## Impact Analysis
- **Communities touched:** storefront widget assets, FPB page creation, FPB app-proxy route, theme app-extension Liquid, repository agent docs.
- **God nodes affected:** `app/assets/bundle-widget-full-page.js`, `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`, `scripts/build-widget-bundles.js`.
- **Blast radius:** FPB generated Shopify pages, legacy `/wpb/:bundleId` app-proxy links, storefront asset loading, SIT deploy/e2e verification.

## Decision
Storefront JS/CSS must load from Shopify theme-extension assets via Liquid `asset_url`. App proxy remains for signed API/data routes only. Generated FPB Shopify pages should carry page/metafield linkage and rely on the selected page template's full-page app block for asset loading; legacy app-proxy FPB page links should redirect to the Shopify page when a page handle exists instead of rendering a separate shell with app-proxy assets.

## Data Model
No schema changes. The existing `shopifyPageHandle`, page `bundle_id` metafield, and page `bundle_config` metafield remain the source of page placement/runtime config.

## Files
| File | Action | What changes |
|---|---|---|
| `app/services/widget-installation/widget-full-page-bundle.server.ts` | modify | Generated page body stops injecting `/apps/product-bundles/assets` JS/CSS and keeps only page content/marker handled by theme app block |
| `app/routes/root/wpb.$bundleId.tsx` | modify | Redirect legacy signed FPB app-proxy page links to the Shopify `/pages/{handle}` URL |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | modify | Keep `asset_url` loading and remove text-banner defaults from FPB block data attributes |
| `tests/unit/services/widget-full-page-bundle.test.ts` | modify | Lock generated page body against app-proxy assets |
| `tests/unit/services/widget-full-page-bundle-preview.test.ts` | modify | Lock preview refresh body against app-proxy assets |
| `tests/unit/routes/fpb-proxy-page.test.ts` | modify | Lock legacy app-proxy page route redirect behavior |
| `test-spec/storefront-asset-strategy.spec.md` | create | TDD spec for asset strategy |
| `AGENTS.md` / `CLAUDE.md` | modify | Add raw widget JS `node --check` verification rule |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/widget-full-page-bundle.test.ts` | unit | generated FPB pages do not inject app-proxy JS/CSS |
| `tests/unit/services/widget-full-page-bundle-preview.test.ts` | unit | refreshed preview pages do not inject app-proxy JS/CSS |
| `tests/unit/routes/fpb-proxy-page.test.ts` | unit | legacy app-proxy FPB page redirects to Shopify page handle |

**E2E:** After deploy to SIT, open the Shopify storefront page/product page, confirm `window.__BUNDLE_WIDGET_VERSION__`, and test FPB/PPB widget behavior from Shopify CDN assets. Do not use app-proxy asset URLs as the storefront proof path.
