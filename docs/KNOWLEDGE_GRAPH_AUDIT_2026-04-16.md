# Knowledge Graph Audit — Wolfpack Product Bundles
**Date:** 2026-04-16  
**Sources:** `graphify-out/GRAPH_REPORT.md`, `internal docs/` vault, `docs/issues-prod/`  
**Graph stats:** 2,895 nodes · 3,903 edges · 438 communities · 332 files · ~1.1M words

---

## 1. God Nodes — Handle With Care

These are the most-connected nodes in the codebase. Any change touching them has blast radius across the entire graph. Extra review required on PRs that modify these.

| Rank | Node | Edges | What it is |
|---|---|---|---|
| 1 | `BundleWidgetFullPage` | 112 | Full-page widget class — the storefront experience |
| 2 | `bundle-widget-full-page.js Widget Source` | 82 | Source file for the FPB widget |
| 3 | `BundleWidgetProductPage` | 74 | Product-page widget class |
| 4 | `AppStateService` | 61 | Singleton state service (`app.state.service.ts`) |
| 5 | `bundle-widget-full-page.css` | 29 | FPB widget styles (subject to 100KB Shopify limit) |
| 6 | `BundleProductModal` | 28 | Variant selection modal — shared by FPB + PDP |
| 7 | `Concept: Full-Page Bundle Widget (FPB)` | 24 | Cross-cutting concept node |

**Practical rule:** Before modifying any of these, run the graph impact analysis. The widget source and CSS are especially sensitive — every community eventually depends on them.

---

## 2. Surprising Connections (Graph-Discovered, Non-Obvious)

These edges were flagged by the graph as non-obvious cross-cutting relationships. They are common root causes during debugging.

| From | Relationship | To | Why It Matters |
|---|---|---|---|
| `Remove Pixel Auto-Activation from afterAuth` | references | `app/shopify.server.ts` | Analytics pixel toggle changes touch the Shopify auth lifecycle — not just the analytics route |
| `Service: widget-theme-template.server.ts` | creates | `Issue: Full-Page Bundle Widget Not Rendering` | Widget installation service is the upstream cause of the FPB rendering failure |
| `Source: app/constants/errors.ts` | creates | `Issue: Centralize Constants (Phase 2)` | Constants extraction is tracked as an open issue — incomplete work |
| `Source: app/constants/api.ts` | creates | `Issue: Centralize Constants (Phase 2)` | Same — API constants centralization is still in-flight |
| `Source: app/constants/bundle.ts` | modifies | `Issue: Centralize Constants (Phase 2)` | This file is part of an ongoing refactor |

---

## 3. Feature Clusters (Hyperedges) — Work Packages

The graph identified these as tightly-coupled feature groups. Changes to any node in a cluster should consider the whole group.

### 3a. Ad-Ready Phase 1: Bundle Creation Price + Inventory Fix
**Status: Completed (March 2026)**  
Nodes: `handlers_server_ts`, `service_pricing_calculation`, `service_inventory_sync`, `ad_ready_bundle_price_fix`, `ad_ready_inventory_mgmt`

- Fixed `"0.00"` bundle variant price → calculated price via `calculateBundlePrice()`
- Fixed `inventoryManagement: null` → `"SHOPIFY"` with debounced MIN-of-components sync
- Added `inventorySyncedAt` / `inventoryStaleAt` fields to Bundle schema
- ⚠️ **Gap still open:** `calculateBundlePrice()` only fully supports `percentage_off`. `fixed_amount_off` and `fixed_bundle_price` need to be implemented.

### 3b. Inventory Sync Webhook Flow
**Status: Completed**  
Nodes: `ad_ready_inventory_webhook`, `service_inventory_webhook_handler`, `webhook_processor`, `route_api_inventory_sync`, `service_inventory_sync`, `ad_ready_unauthenticated_admin`

- `inventory_levels/update` webhook → `inventory.server.ts` handler → `syncBundleInventory()`
- Uses `unauthenticated.admin(shopDomain)` (exported from `app/shopify.server.ts:140`) for offline session access
- 60-second debounce on `inventorySyncedAt` to protect Admin API rate limits

### 3c. DCP Added Button State Config Chain
**Status: Completed**  
Nodes: `add_to_bundle_prisma_fields`, `css_variables_generator`, `add_to_bundle_css_var_added_bg`, `add_to_bundle_css_var_added_text`, `bundle_widget_css`, `bundle_widget_full_page_css`

- Full chain: Prisma fields (`buttonAddedBgColor`, `buttonAddedTextColor`) → CSS generator → CSS variables (`--bundle-button-added-bg`, `--bundle-button-added-text`) → widget CSS

### 3d. Admin Tier Config Data Flow (DB → API → Widget)
**Status: Completed**  
Nodes: `admin_tier_config_tierconfig_field`, `route_api_bundle_json`, `bundle_widget_full_page_js`, `admin_tier_config_validator`, `fpb_configure_route`

- `Bundle.tierConfig` JSON field → `api.bundle.$bundleId.json.tsx` → FPB widget reads tier config at runtime
- Validated server-side by `validateTierConfig`
- Architecture Decision: Option C (direct `tierConfig` field on Bundle model) was selected

### 3e. Analytics Redesign Bundle Revenue Components
**Status: Completed**  
Nodes: `analytics_redesign_bundle_kpi_row`, `analytics_redesign_bundle_trend_chart`, `analytics_redesign_bundle_leaderboard`, `analytics_helpers_ts`, `route_app_attribution`

- KPI row, trend chart, bundle leaderboard — all feed from `app.attribution.tsx` route
- Backed by `OrderAttribution` model + `orders/create` webhook handler

### 3f. Pixel Toggle Service + Action Chain
**Status: Completed**  
Nodes: `analytics_pixel_toggle_getpixelstatus`, `analytics_pixel_toggle_deactivate`, `service_pixel_activation`, `route_app_attribution`, `shopify_server_ts`

- ⚠️ **Surprising connection:** Pixel toggle touches `shopify.server.ts` — not just the analytics route. Any change to `afterAuth` hooks must check for pixel auto-activation side effects.

---

## 4. Key Community Clusters — Architecture Map

Large communities that indicate the major work domains of the codebase.

| Community | Size | Domain |
|---|---|---|
| 0 | 214 nodes | Core app: routes, API endpoints, constants, all issue tracking |
| 2 | 127 nodes | Admin Tier Config feature |
| 3 | 124 nodes | Add-to-Bundle Button Selected Color + Bottom-Sheet DCP controls |
| 6 | 85 nodes | Ad-Ready bundles, Architecture docs, Cart Transform |
| 7 | 85 nodes | Ad-Ready Phase 1 implementation, Campaign Bundles, OrderAttribution |
| 10 | 54 nodes | Storefront Collections, embed blocks, Beco design |
| 11 | 51 nodes | Design settings route, widget build system, bundle API |
| 12 | 50 nodes | afterAuth hook, cron sync, bundle auto re-sync, per-bundle images |
| 13 | 39 nodes | Bundle widget config structure, Cart Transform integration |
| 14 | 38 nodes | DB models, Admin performance, App Proxy |
| 15 | 37 nodes | Billing, dashboard, onboarding routes |
| 16 | 29 nodes | Cart attributes, EXPAND/MERGE pricing, InstructionCountLimit bugs |
| 20 | 25 nodes | Test files (integration + unit) |
| 21 | 23 nodes | DCP — preview iframe, modal, storefront font injection |
| 23 | 13 nodes | FPB configure handlers: `buildBundleBaseConfig`, `handleSaveBundle` etc. |
| 24 | 17 nodes | `AppStateService`, DCP audit findings (2026-03-27) |
| 27 | 16 nodes | Metafield namespace architecture (`$app` → `custom` fix), scalable metafield design |

---

## 5. Internal Docs Vault — Key Facts

All audited against the live codebase on 2026-04-16.

### Architecture

**Stack:**
- Framework: Remix (Shopify App template)
- Runtime: Node.js 20+ (NOT 18 — old docs were wrong)
- DB: PostgreSQL (prod), SQLite (dev) via Prisma
- Hosting: Render (cold-start: ~3–10s — widget has retry for this)
- Extensions: Shopify CDN (via `npm run deploy:prod` / `npm run deploy:sit`)

**Three Shopify extensions:**
1. `bundle-builder` — App Block / Theme App Extension (Liquid blocks)
2. `bundle-cart-transform-ts` — Cart Transform Function (TypeScript → WASM)
3. `bundle-checkout-ui` — Checkout UI Extension (Preact)

**Widget load strategy (FPB — DO NOT REORDER):**
1. Stage 1: Metafield cache (`data-bundle-config` attribute on widget container) — zero network, instant paint
2. Stage 2: Proxy API fallback (`GET /apps/product-bundles/api/bundle/{id}.json`) — single retry after 3s for 503/504

### Database Schema — Authoritative Fields

`Bundle` model key fields (beyond basics):
- `status`: `active | inactive | draft | unlisted`
- `fullPageLayout`: `CLASSIC | EDITORIAL | GRID`
- `promoBannerBgImage`: promotional banner URL
- `tierConfig`: JSON — tiered pricing config
- `showStepTimeline`: Boolean
- `inventorySyncedAt`: DateTime (debounce for inventory sync)

**Models missing from `APPLICATION_ARCHITECTURE.md`** (now updated):
- `DesignSettings` — per-bundle design/theme settings
- `OrderAttribution` — order → bundle attribution for analytics
- `BundleAnalytics` — aggregated analytics per bundle

### Cart Transform — Corrected Facts

| Topic | Fact |
|---|---|
| Language | TypeScript (NOT Rust — old doc was wrong) |
| Build | Default TS build: `cd extensions/bundle-cart-transform-ts && npm run build` |
| API version | `2025-10` |
| Target | `cart.transform.run` (migrated from deprecated `purchase.cart-transform.run`) |
| Operation names | `linesMerge`, `lineExpand`, `lineUpdate` (renamed in 2025-07) |
| WASM output | `dist/` — **gitignored**, NOT committed |

### Pricing Pipeline

```
UI (dollars) → DB (cents, via amountToCents()) → Metafield (cents) → Cart Transform (÷100 = dollars)
```

Discount methods: `percentage_off`, `fixed_amount_off`, `fixed_bundle_price`  
⚠️ `calculateBundlePrice()` only supports `percentage_off` fully — other two methods incomplete.

### Shopify API Rate Limits (Corrected)

- **Admin API:** NOT "40 req/sec". Actual: **1,000 point leaky bucket**, refills at 50 pts/sec
- **Storefront API:** ~4 req/sec unauthenticated, higher for authenticated
- Use `X-Shopify-Shop-Api-Call-Limit` header to monitor remaining capacity

### Build Commands Cheat Sheet

```bash
# Widget bundles (after editing app/assets/*.js)
npm run build:widgets              # all
npm run build:widgets:full-page    # FPB only
npm run build:widgets:product-page # PDP only

# Cart transform WASM (after editing extensions/bundle-cart-transform-ts/)
cd extensions/bundle-cart-transform-ts && npm run build

# CSS size check (must be < 100,000 B)
wc -c extensions/bundle-builder/assets/*.css

# Graphify graph rebuild (after code changes)
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"

# Lint before commit
npx eslint --max-warnings 9999 <file1> <file2>
```

### Deploy Process

```
1. Increment WIDGET_VERSION in scripts/build-widget-bundles.js
2. npm run build:widgets
3. wc -c extensions/bundle-builder/assets/*.css   (< 100,000 B)
4. npm run deploy:prod  OR  npm run deploy:sit
5. Wait 2–10 min for Shopify CDN cache
6. Verify: console.log(window.__BUNDLE_WIDGET_VERSION__) in storefront DevTools
```

**Test store:** `wolfpack-store-test-1.myshopify.com` — password: `1`

---

## 6. Open Issues — Action Required

### 🔴 ppb-state-card-cart-bugs-1 (In Progress)

**Three widget bugs** caused by CDN version (v2.3.0) being stale — local fix exists but was never deployed:
- Bug 1: Only 1 product added to cart (non-default variants silently skipped in `buildCartItems()`)
- Bug 2: Only 1 state card shown after completing all steps (`renderProductPageLayout()` same root cause)
- Bug 3: Stale pricing in modal after removing state card (downstream of Bug 2)
- Bug 4: Cart transform not merging bundle items — `component_parents` metafield missing because bundle was never re-saved after metafield sync was deployed

**Remaining phases:**
- [ ] Phase 4: Deploy `2.3.1` to Shopify (`npm run deploy:prod`)
- [ ] Phase 6: Re-save bundle in admin to trigger `component_parents` metafield write
- [ ] Phase 7: Verify cart transform merges items on storefront

---

## 7. What Was Fixed by the Audit (codebase-audit-cleanup-1, Completed 2026-04-16)

| Item | Action |
|---|---|
| `docs/CART_TRANSFORM_FUNCTION.md` | **Deleted** — was actively misleading (said Rust, wrong API version, wrong op names) |
| `docs/API_ENDPOINTS.md` rate limit | Fixed: `40 req/sec` → `1,000 point leaky bucket` |
| `docs/APPLICATION_ARCHITECTURE.md` | Updated: Node 20+, added missing models, FullPageLayout enum, `unlisted` status |
| Cart transform TOML target | Migrated: `purchase.cart-transform.run` → `cart.transform.run` |
| Graph semantic chunks 05, 08–23 | Re-extracted and rebuilt — 3,012 nodes, 1,998 edges, 4,700 Obsidian notes |

---

## 8. Known Gaps & Technical Debt

| Gap | Location | Priority |
|---|---|---|
| `calculateBundlePrice()` incomplete for `fixed_amount_off` + `fixed_bundle_price` | `app/lib/pricing.ts` | Medium |
| `centralize-constants-phase2-1` still in-flight | `app/constants/errors.ts`, `api.ts` | Low |
| `bundle-cart-transform-ts/dist/` is gitignored — WASM must be rebuilt on each deploy | `extensions/bundle-cart-transform-ts/` | Ops |
| `ppb-state-card-cart-bugs-1` phases 4, 6, 7 not yet done | Widget deploy + metafield sync | 🔴 High |
| Checkout UI Extension: order status page uses `customer-account` extensions (separate app type) — not yet built | None yet | Future |

---

## 9. Key Gotchas — Quick Reference

1. **Shopify MERGE consolidation**: `linesMerge` results with same `parentVariantId` + `title` are auto-collapsed. Append `" (2)"`, `" (3)"` suffix to make titles unique per bundle instance.

2. **`$app` vs `custom` namespace**: Metafields written with `$app` namespace are NOT readable in Liquid (`page.metafields.custom.*`). Must use `custom` namespace for Liquid-accessible metafields.

3. **Checkout UI default export**: Preact checkout extensions require a `default` export. Named exports cause build failure. Both checkout and thank-you targets share the same default export entry point.

4. **`inventoryAdjustQuantities`**: Use the plural form. `inventoryAdjustQuantity` (singular) is deprecated.

5. **`unauthenticated.admin(shopDomain)`**: For webhooks/background jobs without an active request. Exported from `app/shopify.server.ts:140`.

6. **Never run `shopify app deploy` directly**: Use `npm run deploy:prod` or `npm run deploy:sit` — the npm scripts stamp the correct app handle into extension templates first.

7. **Widget CDN cache**: Only invalidated by `shopify app deploy`. Custom `?v=` params do nothing. Always deploy after widget changes and wait 2–10 min.

8. **Render cold-starts**: ~3–10s. Widget has a 3s retry on 503/504. This is intentional — don't remove it.

9. **`_bundle_id` cart attribute**: Every add-to-cart generates a `crypto.randomUUID()`. Cart transform groups component lines by this attribute for MERGE. Shopify's `/cart/add.js` won't merge lines with different properties — instances stay separate.

10. **CSS 100KB limit**: Shopify enforces this on app block CSS assets. Run `wc -c extensions/bundle-builder/assets/*.css` before every deploy.
