---
title: Knip Prune Guardrails
type: operations
last_audited: 2026-07-13
---

# Knip Prune Guardrails

Use Knip as a candidate generator only. Before deleting anything from [[Operations/Knip Candidate Inventory]], check this file for known false positives and convention-loaded assets. Entries use stable search identifiers instead of line numbers.

## Current Candidate Snapshot

Generated from:

```bash
./node_modules/.bin/knip --reporter json --no-exit-code --no-progress
```

Snapshot counts from 2026-07-13:

- unused file candidates: 151
- dependency candidates: 1
- unlisted dependency reports: 1
- binary reports: 3
- unresolved package reports: 1
- unused exports: 126
- unused exported types: 236
- unused enum members: 1

## Verified Removals

Removed on 2026-07-13 after source search, focused tests, lint, `npm run build-dev`, and a follow-up Knip run:

- Dependency `@heymantle/react`
- File `app/services/subscription-guard.server.ts`
- Files `app/components/skeletons/ChartCardSkeleton.tsx` and `app/components/skeletons/ChartCardSkeleton.module.css`
- Direct `@jest/globals` imports from:
  - `tests/unit/lib/bundle-config-contracts.test.ts`
  - `tests/unit/lib/storefront-variant-inventory.test.ts`
  - `tests/unit/routes/ppb-select-template-default.test.ts`
- Export `apiVersion` and unused import `LATEST_API_VERSION` from `app/shopify.server.ts`
- Export `KPI_ACCENT_VAR` from `app/components/analytics/shared/KpiTile.tsx`; the constant remains local
- Exported wrapper `CartPropertyFixCard` from `app/components/CartPropertyFixCard.tsx`; `CartPropertyFixContent` remains the route-owned component
- File `app/components/billing/UpgradeCTACard.tsx`, its barrel export in `app/components/billing/index.ts`, and its source-reading i18n test entry in `tests/unit/i18n/billing-plan-cards-i18n.test.ts`
- Barrel exports from `app/components/analytics/index.ts` for `EngagementPulse`, `RevenueAttribution`, and analytics prop types; the lazy route still imports the components directly through `app/components/analytics/lazy.ts`

## Skip These Removals

### Remix route manifest

- Knip candidates: `app/routes.ts`, dependency `@remix-run/fs-routes`
- Stable identifiers:
  - `import { flatRoutes } from "@remix-run/fs-routes"`
  - `flatRoutes({ rootDirectory: "routes/app" })`
  - `flatRoutes({ rootDirectory: "routes/api" })`
- Why to skip: Remix/Vite loads `app/routes.ts` by convention. Removing the file or dependency breaks route discovery even though normal source imports do not reference it.
- Verification: run `npm run build-dev` after any route-manifest change.

### GraphQL config

- Knip candidate: `graphql.config.js`
- Stable identifiers:
  - `schema: "./app/types/admin-2025-07.schema.json"`
  - `documents: ["./app/**/*.{js,ts,jsx,tsx}", "./app/.server/**/*.{js,ts,jsx,tsx}"]`
  - `getExtensionProjects()`
- Why to skip: GraphQL tooling discovers this config by filename. It also enumerates extension schemas dynamically.
- Verification: run the GraphQL tooling command that motivated a change before deleting or moving it.

### Raw storefront widget entrypoints

- Knip candidates: `app/assets/bundle-widget-full-page.js`, `app/assets/bundle-widget-product-page.js`
- Stable identifiers:
  - `fullPage: join(ROOT_DIR, 'app/assets/bundle-widget-full-page.js')`
  - `productPage: join(ROOT_DIR, 'app/assets/bundle-widget-product-page.js')`
  - `SOURCES = {`
- Why to skip: these are raw widget entrypoints consumed by `scripts/build-widget-bundles.js`, not imported through the app module graph. Removing them breaks widget bundle generation and storefront runtime.
- Verification: run `node --check` on touched raw widget files and `npm run build:widgets`.

### Widget source modules concatenated by the build script

- Knip candidates: source files under `app/assets/widgets/full-page/**`, `app/assets/widgets/product-page/**`, `app/assets/widgets/shared/**`, and `app/assets/sdk/**`
- Stable identifiers:
  - `const SDK_MODULES = [`
  - `const PRODUCT_PAGE_MODULES = [`
  - `const FULL_PAGE_MODULES = [`
  - `readSharedComponents(modules = SHARED_MODULES)`
- Why to skip: the widget bundler reads these files by explicit path arrays and strips ESM syntax before concatenation. Knip does not see that file-system based ownership.
- Verification: run `npm run build:widgets`; for SDK-only changes also run `npm run build:sdk`.

### Widget source CSS shards

- Knip candidates: source CSS under `app/assets/widgets/full-page-css/**` and `app/assets/widgets/product-page-css/**`
- Stable identifiers:
  - `source: join(rootDir, 'app/assets/widgets/full-page-css/bundle-widget-full-page.css')`
  - `source: join(rootDir, 'app/assets/widgets/product-page-css/bundle-widget.css')`
  - `@import "./base/layout-tiers-timeline.css"`
  - `@import "./base/layout-steps-summary.css"`
  - `@import "./classic/base.css"`
- Why to skip: `scripts/minify-assets/targets.js` owns top-level CSS targets, and `resolveCssImports()` in the minifier pulls imported shards into generated extension assets. Removing a shard can silently remove storefront styling.
- Verification: run `npm run minify:assets css`; for storefront visual work also verify desktop and mobile after cache bypass.

### Shopify extension runtime assets

- Knip candidates: files under `extensions/bundle-builder/assets/**`
- Stable identifiers:
  - `OUTPUTS = {`
  - `bundle-widget-full-page-bundled.js`
  - `bundle-widget-product-page-bundled.js`
  - `wolfpack-bundles-sdk.js`
  - `{{ 'bundle-widget-full-page.css' | asset_url }}`
  - `{{ 'bundle-widget.css' | asset_url }}`
- Why to skip: these are generated deploy/runtime assets loaded by Liquid through Shopify `asset_url`. Knip sees no JS import edge because the browser loads them from the theme app extension.
- Verification: run `npm run build:widgets` and `npm run minify:assets css` after any source change that should affect these files.

### Shopify CLI `.shopify` bundle snapshots

- Knip candidates: files under `.shopify/dev-bundle/**` and `.shopify/deploy-bundle/**`
- Stable identifiers:
  - `.shopify/dev-bundle`
  - `.shopify/deploy-bundle`
- Why to skip: these are Shopify CLI generated local bundle snapshots, not application source. They are not normal cleanup targets and should not be used as proof that source/runtime assets are unused.
- Verification: do not edit these manually; let Shopify CLI regenerate them when needed.

### Checkout UI extension target module

- Knip candidate: `extensions/bundle-checkout-ui/src/TotalSavings.tsx`
- Stable identifiers:
  - `module = "./src/TotalSavings.tsx"`
  - `target = "purchase.checkout.reductions.render-after"`
  - `import {TotalSavingsExtension} from './Checkout'`
- Why to skip: Shopify extension targets are registered in `shopify.extension.toml`, not imported by the app. Removing this file breaks the checkout reductions target.
- Verification: run `npx tsc --noEmit -p extensions/bundle-checkout-ui/tsconfig.json --skipLibCheck`.

### Checkout UI exported target components

- Knip candidates: exported `TotalSavingsExtension` and other exported checkout target components in `extensions/bundle-checkout-ui/src/Checkout.tsx`
- Stable identifiers:
  - `export const TotalSavingsExtension: FunctionComponent = () => {`
  - `import {TotalSavingsExtension} from './Checkout'`
  - `render(h(TotalSavingsExtension, {}), document.body)`
- Why to skip: target modules import these exported components so Shopify can register each target entrypoint. Removing the export breaks the reductions-render target even when Knip reports the symbol.
- Verification: run `npx tsc --noEmit -p extensions/bundle-checkout-ui/tsconfig.json --skipLibCheck`.

### Widget component re-export surface

- Knip candidates: exported symbols from `app/assets/bundle-widget-components.js`, including `shouldRenderInlineVariantSelector`
- Stable identifiers:
  - `export { shouldRenderInlineVariantSelector } from './widgets/shared/variant-selector-policy.js'`
  - `import { shouldRenderInlineVariantSelector } from '../../shared/variant-selector-policy.js'`
  - `readSharedComponents(modules = SHARED_MODULES)`
- Why to skip: the raw widget build has file-system and bundled-runtime edges that Knip does not model. Removing re-exports from the shared component surface can break generated storefront bundles.
- Verification: run `npm run build:widgets` and `node --check` on touched raw widget files.

### Shared widget engine selector exports

- Knip candidates: exported selectors from `app/assets/widgets/shared/engine/bundle-selectors.js`, including `getSelectedEntries`
- Stable identifiers:
  - `export function getSelectedEntries(state) {`
  - `return getSelectedEntries(state).reduce((total, entry) => total + entry.quantity, 0)`
  - `getSelectedEntries,`
- Why to skip: some selector exports are used internally and also re-exported through the shared widget engine surface for generated widget bundles. Removing the export without checking bundled consumers can break storefront selection logic.
- Verification: run `npm run build:widgets` and relevant raw widget unit tests.

### Webhook lifecycle handler re-exports

- Knip candidates: lifecycle exports from `app/services/webhooks/handlers/index.ts`, including `handleAppUninstalled` and `handleScopesUpdate`
- Stable identifiers:
  - `handleAppUninstalled,`
  - `handleScopesUpdate,`
  - `result = await handleAppUninstalled(shopDomain, payload, webhookEvent.id)`
  - `result = await handleScopesUpdate(shopDomain, payload)`
- Why to skip: the webhook processor imports these through the handler barrel. Removing the re-export breaks lifecycle webhook processing.
- Verification: run `npx jest tests/unit/services/webhooks/lifecycle.test.ts tests/unit/services/webhooks/processor.test.ts --runInBand`.

### Jest JavaScript transformer

- Knip report: unresolved `babel-jest` from `jest.config.js`
- Stable identifiers:
  - `'^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }]`
- Why to skip: Jest uses this transformer for ESM `.js` widget modules in tests. It is loaded from config, not app source.
- Verification: run focused Jest tests that import raw widget JS.

### Shopify App Bridge global types

- Knip report: unlisted `@shopify/app-bridge-types` from `tsconfig.json`
- Stable identifier:
  - `"types": ["node", "jest", "@shopify/polaris-types", "@shopify/app-bridge-types"]`
- Why to skip: TypeScript loads these global types from compiler config. Do not remove the type entry unless the app no longer uses Shopify App Bridge globals.
- Verification: run `npx tsc --noEmit`.

### CLI binaries used by scripts

- Knip reports: binaries `shopify`, `rustup`, `graphql-codegen`
- Stable identifiers:
  - `"dev": "shopify app dev"`
  - `"deploy:prod": "npm run deployment:backfill && cd extensions/bundle-cart-transform-rs && rustup run stable cargo build`
  - `"graphql-codegen": "graphql-codegen"`
- Why to skip: these are CLI commands invoked through npm scripts. They are not importable dependencies and should not be pruned just because Knip reports them as binaries.
- Verification: validate the exact npm script that uses the binary. Never run deploy scripts autonomously.

## Not Yet Classified

The following current Knip groups are candidates for future small cleanup slices, but they are not proven safe merely because Knip reports them:

- unused exports and exported types listed in [[Operations/Knip Candidate Inventory]]

For each future cleanup slice, either remove the candidate with focused verification or add a new "Skip These Removals" entry here with stable search identifiers.
