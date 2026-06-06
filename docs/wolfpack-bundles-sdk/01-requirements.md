# Requirements: Wolfpack Bundles Custom SDK

## Context

Wolfpack currently provides a pre-built bundle widget that merchants drop into their Shopify themes. This covers the majority of use cases, but merchants with custom storefronts, bespoke design systems, or headless-adjacent (Liquid + JS) setups cannot use the widget without fighting its opinionated HTML/CSS. Easy Bundles solves this with a developer-facing SDK (`gbbMix`) — we need an equivalent that goes further: reactive events, full TypeScript support, structured validation, and a debug panel. This directly unlocks a developer-merchant segment we currently cannot serve and positions Wolfpack ahead of EB on DX.

## Audit / Prior Research Reference

- Competitor analysis: `docs/competitor-analysis/eb-sdk-analysis.md`
- Effort analysis + repo strategy: `docs/competitor-analysis/wolfpack-sdk-effort-analysis.md`
- Shopify bundle API: https://shopify.dev/docs/apps/build/product-merchandising/bundles
- Shopify custom storefront events pattern: Shopify Dawn theme, `document.addEventListener('cart:updated', ...)`

---

## Functional Requirements

### Core SDK Exposure
- **FR-01:** A global `window.WolfpackBundles` object is exposed on any storefront product page where the Theme App Extension is active and a bundle is detected via `data-bundle-config` attribute.
- **FR-02:** The SDK auto-initializes — no manual `WolfpackBundles.init()` call required. It reads bundle config from the `data-bundle-config` metafield cache (same mechanism as the pre-built widget).
- **FR-03:** `WolfpackBundles.state` exposes: `bundleId`, `bundleName`, `steps[]`, `selections` (map of stepId → variantId → qty), `cartData`, `discountConfiguration`, `isReady` boolean.

### Item Management
- **FR-04:** `WolfpackBundles.addItem(stepId, variantId, qty)` — adds or increments a variant in a step's selection. Validates against step condition (min/max) before mutating state. Returns `{ success, error? }`.
- **FR-05:** `WolfpackBundles.removeItem(stepId, variantId, qty)` — decrements or removes a variant from a step's selection. Returns `{ success, error? }`.
- **FR-06:** `WolfpackBundles.clearStep(stepId)` — clears all selections in a step. Returns `{ success }`.

### Cart Operations
- **FR-07:** `WolfpackBundles.addBundleToCart()` — async AJAX add-to-cart using `fetch('/cart/add.js')`. Builds cart items with `_bundle_id` property (UUID) for Cart Transform MERGE. Returns `Promise<void>`. Fires `wbp:cart-success` or `wbp:cart-failed` window events on completion.

### Reactive Events
- **FR-08:** Every state mutation dispatches a `CustomEvent` on `window`:
  - `wbp:item-added` → `{ detail: { stepId, variantId, qty, selections } }`
  - `wbp:item-removed` → `{ detail: { stepId, variantId, qty, selections } }`
  - `wbp:step-cleared` → `{ detail: { stepId } }`
  - `wbp:cart-success` → `{ detail: { bundleId } }`
  - `wbp:cart-failed` → `{ detail: { error: string } }`
  - `wbp:ready` → `{ detail: { bundleId, steps } }` — fired once SDK is initialized

### Validation Helpers
- **FR-09:** `WolfpackBundles.validateStep(stepId)` — returns `{ valid: boolean, message: string }`. Uses existing `ConditionValidator.isStepConditionSatisfied()` internally.
- **FR-10:** `WolfpackBundles.validateBundle()` — checks all non-free-gift, non-default steps. Returns `{ valid: boolean, errors: Record<stepId, string> }`.

### Price Helpers
- **FR-11:** `WolfpackBundles.getDisplayPrice()` — returns `{ original: number, discounted: number, savings: number, savingsPercent: number, formatted: string }`. Prices in cents internally; `formatted` is locale-aware string. Uses existing `PricingCalculator` and `CurrencyManager` internally.

### TypeScript Support
- **FR-12:** A `wolfpack-bundles.d.ts` file is shipped alongside the SDK build, defining all public types: `WolfpackBundleSDK`, `Step`, `StepSelection`, `CartData`, `DiscountConfiguration`, `ValidationResult`, `BundleValidationResult`, `DisplayPrice`, and all CustomEvent detail types.

### Developer Experience
- **FR-13:** When `?wbp_debug=true` is present in the URL, the SDK logs all state mutations and events to the browser console with structured output. `window.WolfpackBundles` is also exposed even on pages without a bundle for inspection.
- **FR-14:** On invalid `stepId` or `variantId` inputs, SDK methods return descriptive error objects rather than throwing silently. Example: `{ success: false, error: 'stepId "step_99" not found in bundle' }`.

### Build & Delivery
- **FR-15:** The SDK is built as a separate IIFE file (`wolfpack-bundles-sdk.js`) by the existing `scripts/build-widget-bundles.js` pipeline. It is served via the Theme App Extension at `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`.
- **FR-16:** A new Liquid snippet (`bundle-sdk-loader.liquid`) conditionally loads the SDK JS on product pages — but only when `data-sdk-mode="true"` is present on the container, ensuring merchants must explicitly opt into SDK mode (the pre-built widget remains the default).
- **FR-17:** SDK mode and widget mode are mutually exclusive on the same page. When SDK mode is active, the pre-built widget JS is not loaded.

### Documentation
- **FR-18:** A comprehensive usage doc (`docs/wolfpack-bundles-sdk/SDK_USAGE_GUIDE.md`) is written, covering: overview, prerequisites, HTML setup, all API methods, all events, TypeScript usage, price display, validation, add-to-cart pattern, debug mode, and a complete reference implementation example.

---

## Out of Scope

- Framework-specific adapters (React hook, Vue composable, Alpine directive) — v2 roadmap
- Headless/Hydrogen support — SDK relies on Online Store 2.0 Liquid structure
- Multi-bundle support on a single page — v2 roadmap
- Creating or modifying bundles via JavaScript — must be configured in App Admin first
- Free gift step management via SDK — free gift unlock is handled by Cart Transform; SDK exposes the state but does not need special unlock methods
- Cart drawer integration — developer's responsibility; SDK fires `wbp:cart-success` and they handle redirect/drawer

---

## Acceptance Criteria

### FR-01 / FR-02 — Auto-init & Global Object
- [ ] Given a product page with `data-bundle-config` attribute set, when page loads, then `window.WolfpackBundles` is defined and `WolfpackBundles.state.isReady === true` within 500ms
- [ ] Given a product page without a bundle, when page loads, then `window.WolfpackBundles` is undefined (or no-op in debug mode)
- [ ] Given `?wbp_debug=true`, when page loads without a bundle, then `window.WolfpackBundles` is still exposed as a no-op object with a console warning

### FR-04 / FR-05 — addItem / removeItem
- [ ] Given step allows max 3 items, when `addItem` is called a 4th time, then it returns `{ success: false, error: 'This step allows at most 3 products' }`
- [ ] Given a variant is in selections with qty 2, when `removeItem(stepId, variantId, 1)` is called, then qty becomes 1
- [ ] Given a variant is in selections with qty 1, when `removeItem(stepId, variantId, 1)` is called, then variant is removed from selections entirely
- [ ] Given an invalid stepId, when `addItem` is called, then returns `{ success: false, error: 'stepId not found' }`

### FR-08 — Reactive Events
- [ ] Given a listener on `wbp:item-added`, when `addItem` succeeds, then event fires with correct `{ stepId, variantId, qty, selections }` detail
- [ ] Given a listener on `wbp:cart-success`, when `addBundleToCart` succeeds, then event fires with `{ bundleId }`
- [ ] Given a listener on `wbp:cart-failed`, when `addBundleToCart` fails (network error), then event fires with `{ error }` string

### FR-09 / FR-10 — Validation
- [ ] Given step requires exactly 3 items and 2 are selected, when `validateStep` is called, then returns `{ valid: false, message: 'This step requires exactly 3 items' }`
- [ ] Given all required steps are complete, when `validateBundle` is called, then returns `{ valid: true, errors: {} }`
- [ ] Given one step is incomplete, when `validateBundle` is called, then returns `{ valid: false, errors: { [stepId]: 'message' } }`

### FR-11 — getDisplayPrice
- [ ] Given a 20% off bundle with items totalling 10000 cents, when `getDisplayPrice` is called, then returns `{ original: 10000, discounted: 8000, savings: 2000, savingsPercent: 20, formatted: '$80.00' }`

### FR-15 / FR-16 — Build & Delivery
- [ ] `npm run build:widgets` produces `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- [ ] The SDK file is a self-contained IIFE — no external dependencies
- [ ] SDK file is under Shopify's 100,000 B asset limit after minification

### FR-18 — Documentation
- [ ] `SDK_USAGE_GUIDE.md` covers all public methods, all events, TypeScript usage, and includes a complete working reference implementation

---

## Data Changes

None — SDK is a read/write layer over existing bundle config (loaded from metafield) and Shopify's `/cart/add.js`. No new Prisma fields, no new API routes, no DB migrations.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| SDK file exceeds Shopify 100 KB asset limit after minification | Low | Monitor in build script; existing minifier already enforces limit |
| `data-bundle-config` attribute absent when SDK loads (race condition) | Medium | SDK uses `DOMContentLoaded` + MutationObserver fallback to wait for container |
| Merchant loads both widget and SDK on same page | Low | FR-17: Loader snippet enforces mutual exclusion via `data-sdk-mode` attribute |
| Cart Transform not active when SDK adds to cart | Low | Existing `_scheduleCartTransformSelfHeal()` mechanism covers this; SDK inherits it |
| Breaking change in bundle config schema invalidates SDK state shape | Medium | Semantic version bump + sync-bundle prompt banner (per No Backwards Compat rule) |
