# Architecture: EB Storefront Parity for FPB and PPB

## Fast-Track Note
Stage 1 requirements are skipped. Business and behavior context comes from:
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/issues-prod/eb-complete-configure-e2e-audit-1.md`
- `docs/issues-prod/select-template-1.md`

## Impact Analysis
- **Communities touched:** Storefront theme app extension, FPB widget runtime, PPB widget runtime, metafield sync, bundle formatter, cart transform.
- **God nodes affected:** `bundle-widget-full-page.js Widget Source`, `bundle-widget-product-page.js`, `scripts/build-widget-bundles.js`, `prisma/schema.prisma` only if a proven DTO gap requires schema change.
- **Blast radius:** storefront rendering, theme extension placement, app-proxy asset loading, product/page metafield payloads, cart add payloads, cart transform discounts, template-specific layout CSS.

## Decision
Use EB as the behavior source of truth but keep Wolfpack's transport where already intentionally chosen and documented: FPB uses page marker/metafield/proxy-backed config; PPB uses product app block and product variant `$app.bundle_ui_config`. Do not collapse PPB into FPB marker hydration because EB evidence shows PPB is a separate `gbbMix`/SDK product-page runtime.

## Data Model
No schema changes by default. Add or change Prisma fields only when EB evidence proves the current persisted model cannot represent a storefront-visible behavior. No backward-compat shims.

## Storefront Contracts

### FPB
- EB runtime: `window.gbb`, `window.gbb.settings.stepsConfigurationData`, full-page renderer asset, body preset marker.
- Wolfpack target: page marker hydrates `#bundle-builder-app`, loads FPB CSS/JS, consumes `data-bundle-config` when available, otherwise uses `/apps/product-bundles/api/bundle/{id}.json` fallback.
- Template fields: `bundleDesignTemplate = FBP_SIDE_FOOTER`, `bundleDesignPresetId = DEFAULT | CLASSIC | COMPACT | HORIZONTAL`.

### PPB
- EB runtime: `window.gbbMix`, `GbbMixState`, `initFlow: SDK`, product-page template dispatch.
- Wolfpack target: product page app block renders `#bundle-builder-app` from variant `$app.bundle_ui_config`, loads product-page widget or SDK according to config.
- Template fields: `bundleDesignTemplate = PDP_INPAGE | PDP_MODAL`, `templateId/bundleDesignPresetId = CASCADE | COGNIVE | MODAL | SIMPLIFIED` as already documented in select-template proof.

## Files
| File | Action | What changes |
|---|---|---|
| `extensions/bundle-builder/blocks/bundle-app-embed.liquid` | modify | FPB marker hydration only; do not hydrate PPB here without new evidence. |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | inspect/modify as needed | Ensure FPB block and marker contracts emit the same DTO consumed by widget. |
| `extensions/bundle-builder/blocks/bundle-product-page.liquid` | inspect/modify as needed | Ensure PPB product block emits EB-aligned DTO and template fields. |
| `app/services/bundles/metafield-sync/*` | modify as needed | Align page/product metafield payloads with EB-supported runtime fields. |
| `app/lib/bundle-formatter*` | modify as needed | Normalize Admin model to storefront DTO without hardcoded critical values. |
| `app/assets/bundle-widget-full-page.js` | modify per FPB slice | Template/runtime/cart behavior parity. |
| `app/assets/bundle-widget-product-page.js` | modify per PPB slice | Template/runtime/cart behavior parity. |
| `app/assets/widgets/full-page-css/bundle-widget-full-page.css` | modify per FPB template | Pixel/layout parity. |
| `app/assets/widgets/product-page-css/bundle-widget.css` | modify per PPB template | Pixel/layout parity. |
| `scripts/build-widget-bundles.js` | modify for widget deploys | Bump `WIDGET_VERSION` per widget change. |
| `tests/unit/**` and `tests/integration/**` | add/update | Contract tests for DTO/metafields/cart behavior. |
| `docs/issues-prod/eb-storefront-parity-1.md` | update | Slice-by-slice proof log. |

## Test Plan
| Test scope | Required proof |
|---|---|
| DTO/metafield unit tests | Admin model serializes to exact storefront contract fields for FPB and PPB. |
| Widget syntax/build | `node --check` touched raw widget JS, `npm run build:widgets`, CSS minifier when CSS changes. |
| Per-template e2e | For each FPB/PPB template: Admin save → metafield/config payload → storefront desktop render → storefront mobile render → network check → cart/add where relevant. |
| EB comparison | Use EB reference screenshots/runtime/network from existing docs or fresh Chrome capture if the doc has a gap. |

## Implementation Order
1. Finish and verify FPB bootstrap fix already identified from network: marker present, no renderer request.
2. FPB DEFAULT e2e contract and visual pass.
3. FPB CLASSIC, COMPACT, HORIZONTAL one template per commit.
4. PPB contract audit against live page: confirm no bootstrap gap, then CASCADE e2e.
5. PPB COGNIVE, MODAL, SIMPLIFIED one template per commit.
6. Cross-cutting cart/metafield parity pass for both bundle types.
