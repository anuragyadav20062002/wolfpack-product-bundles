# Architecture Decision Record: EB Evidence UI Clone Rewrite

**Feature ID:** eb-ui-clone-rewrite
**Issue:** eb-ui-clone-rewrite-1
**Status:** Proposed
**Created:** 2026-05-26
**Author:** Feature Pipeline

## Fast-Track Note

BR/PO context comes from the completed audit in `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` and the grounded data reference in `internal docs/EB Implementation Reference.md`.

## Impact Analysis

Graph sources:
- `graphify-out/GRAPH_REPORT.md`
- `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "bundle-widget-full-page.js Widget Source" "Prisma Schema (prisma/schema.prisma)"`
- `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "BundleWidgetProductPage" "Prisma Schema (prisma/schema.prisma)"`
- `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "PDP Bundle Configure Route" "BundleWidgetProductPage"`

Findings:
- God nodes affected: `BundleWidgetFullPage`, `BundleWidgetProductPage`, `bundle-widget-full-page.js Widget Source`, `bundle-widget-full-page.css`, and likely `AppStateService`.
- Cross-community bridge: `bundle-widget-full-page.js Widget Source` connects widget, route, pricing, config, and documentation communities.
- Prisma schema is a bridge between widget/API/admin communities.
- Graph paths did not find a direct PPB configure route to PPB widget path, which means the file plan must be explicit and tests must cover the save-to-runtime boundary.

Blast radius:
- Admin configure routes and shared configure components.
- Prisma schema and migrations for direct settings.
- Bundle save handlers and metafield sync writers.
- App proxy/API bundle JSON formatting.
- FPB and PPB widget JS/CSS sources and bundled extension assets.
- Cart property serialization and widget cart add payloads.
- DCP must be preserved but not expanded unless required by parity or breakage.

## Decision

Use an evidence-gated slice architecture. Build shared pure mappers and dependency gates first, test them with unit tests, then wire them into existing Admin routes, persistence handlers, metafield writers, and storefront widgets. This avoids a speculative one-shot rewrite and creates a manifest row for each control/template before parity is claimed.

## Data Model

Direct data contracts must be represented by explicit fields where current persistence does not already provide a single authoritative source:

```typescript
type TemplateSelection =
  | { bundleType: "full_page"; bundleDesignTemplate: "FBP_SIDE_FOOTER"; bundleDesignPresetId: "DEFAULT" | "CLASSIC" | "COMPACT" | "HORIZONTAL" }
  | { bundleType: "product_page"; bundleDesignTemplate: "PDP_INPAGE"; templateId: "CASCADE" | "COGNIVE" }
  | { bundleType: "product_page"; bundleDesignTemplate: "PDP_MODAL"; templateId: "MODAL" | "SIMPLIFIED" };

type RuleDependencyState = {
  discountEnabled: boolean;
  discountMode: "PERCENTAGE" | "FIXED" | "FIXED_BUNDLE_PRICE" | "BOGO";
  ruleBasis: "quantity" | "amount";
  categoryCount: number;
  progressType: "simple" | "step";
  preselectedProductsEnabled: boolean;
  quantityValidationEnabled: boolean;
  discountDisplayEnabled: boolean;
};
```

Final Prisma column names must be chosen after reading the current schema and save handlers. No old-field fallback readers may be added.

## Options Considered

### Option A: Replace Routes And Widgets In One Rewrite

Rejected. It creates too much unverified surface and makes failures hard to isolate.

### Option B: Evidence-Gated Shared Contracts First

Chosen. Pure contracts, dependency gates, and mappers become the stable boundary. Admin, DB/metafields, widgets, and cart behavior can then be proven row by row.

## File Plan

| File | Action | What changes |
|---|---|---|
| `AGENTS.md` | modify | Add narrow custom Admin-control exception for this issue. |
| `docs/eb-ui-clone-rewrite/evidence-manifest.md` | create/maintain | Evidence row per control/template. |
| `test-spec/eb-ui-clone-rewrite.spec.md` | create | TDD spec for contracts, gates, serializers, widgets, and integrations. |
| `app/lib/bundle-config/evidence-template-mapping.ts` | create | Pure template mapping helpers with no competitor terms. |
| `app/lib/bundle-config/control-dependencies.ts` | create | Pure dependency engine for rule/control visibility and disabled states. |
| `app/lib/bundle-config/category-contracts.ts` | create | Normalize FPB/PPB category payloads into direct app contracts. |
| `app/lib/bundle-config/cart-line-messaging.ts` | create | Serialize public/private cart-line properties from global settings. |
| `tests/unit/lib/bundle-config-contracts.test.ts` | create | RED/GREEN tests for the pure helpers above. |
| `tests/integration/bundle-config-save-contract.test.ts` | create/update | Admin payload to DB/metafield contract coverage. |
| `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` | modify | FPB configure shell/section UI and save wiring. |
| `app/routes/app/app.product-bundles.configure.$offerId/route.tsx` | modify | PPB configure shell/section UI and save wiring. |
| `app/routes/app/app.bundles.create_.configure.$bundleId/handlers.server.ts` | modify | FPB direct contract serialization. |
| `app/routes/app/app.product-bundles.configure.$offerId/handlers.server.ts` | modify | PPB direct contract serialization. |
| `prisma/schema.prisma` | modify | Add direct columns only where current schema lacks an authoritative field. |
| `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts` | modify | Write updated config structure with widget parser parity. |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | modify | Update product/metafield contract writer as needed. |
| `app/assets/bundle-widget-full-page.js` | modify | FPB template/runtime parity while preserving load order. |
| `app/assets/bundle-widget-product-page.js` | modify | PPB template/runtime parity. |
| `app/assets/bundle-widget-components.js` | modify | Shared product cards, variants, BQO, progress, and cart helpers. |
| `app/assets/widgets/full-page-css/bundle-widget-full-page.css` | modify | FPB storefront template CSS. |
| `app/assets/widgets/product-page-css/bundle-widget.css` | modify | PPB storefront template CSS. |
| `extensions/bundle-builder/assets/*` | generated | Rebuilt widget and minified CSS outputs. |
| `docs/app-nav-map/APP_NAVIGATION_MAP.md` | modify if needed | Update when routes, tabs, modals, or user flows change. |
| `internal docs/EB Implementation Reference.md` | update only if new facts are learned | Add new Shopify/EB gotchas discovered during proof loop. |

## Implementation Sequencing

1. Add docs, manifest, and test spec.
2. Add RED unit tests for template mapping, dependency gates, category contracts, cart-line messaging, and config-load invariants.
3. Implement pure helpers until unit tests pass.
4. Wire helpers into save handlers and add integration tests for DB/metafield output.
5. Replace Admin configure shell and sections in narrow slices.
6. Rewrite FPB runtime slices and run widget tests/builds.
7. Rewrite PPB runtime slices and run widget tests/builds.
8. Execute Chrome evidence loop and update manifest rows.

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/lib/bundle-config-contracts.test.ts` | unit | template mappings, dependency gates, category contracts, cart messaging. |
| `tests/unit/routes/discount-pricing-ui-contract.test.ts` | existing/update | Discount controls and dependency UI contract. |
| `tests/unit/routes/ppb-bundle-settings.test.ts` | existing/update | PPB bundle settings and global cart messaging. |
| `tests/integration/bundle-config-save-contract.test.ts` | integration | Admin payload to DB/metafield config. |
| `tests/unit/extensions/widget-template-contracts.test.ts` | unit | eight template markers, desktop/mobile class markers, widget state reducers. |

Mock Prisma, Shopify Admin API, resource picker responses, and session/auth in route/integration tests. Do not mock pure mappers or pricing calculations.

## Verification Commands

Targeted during slices:
- `npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand`
- `npx jest tests/integration/bundle-config-save-contract.test.ts --runInBand`
- `npx eslint --max-warnings 9999 <modified files>`

Before handoff:
- `npm run build`
- `npm run build:widgets`
- `npm run minify:assets css`
- `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget.css`
- `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

No autonomous Shopify deploy.
