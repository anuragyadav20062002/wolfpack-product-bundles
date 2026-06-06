# Architecture: Wolfpack Bundles Custom SDK

## Impact Analysis

- **Communities touched:** Community 1 (CurrencyManager, PricingCalculator), Community 4/8 (BundleWidgetProductPage helpers), Community 15 (build pipeline, extension assets)
- **God nodes affected:**
  - `BundleWidgetFullPage` (125 edges) — **NOT touched**. SDK is additive and separate.
  - `BundleWidgetProductPage` (78 edges) — **NOT touched**. SDK is additive and separate.
  - `scripts/build-widget-bundles.js` (Community 15) — **MODIFIED** to add SDK build target. Low risk: additive only, existing build paths unchanged.
- **Blast radius:** Minimal. All new files. The only modification to existing files is adding a new `buildSdk()` function to the build script and a conditional load path in the Liquid embed block. No existing widget logic changes.

---

## Decision

The SDK is a **new, standalone IIFE** built by the existing `scripts/build-widget-bundles.js` pipeline. It reuses the shared modules from `app/assets/widgets/shared/` (via inline concatenation, same as the widget build) and exposes a single `window.WolfpackBundles` global. State is managed by a module-level singleton object (not a class), keeping it compatible with the IIFE build pattern and easy to test with `require()`. The SDK is opt-in via `data-sdk-mode="true"` on the widget container, enforcing mutual exclusion with the pre-built widget on the same page.

**Rejected alternative:** Shipping as an npm package with a proper bundler (Rollup/ESBuild). Rejected because: (1) no npm distribution infrastructure exists yet, (2) SDK consumers load it via Theme App Extension like the widget JS, (3) adding a second bundler adds dev tooling overhead for v0. Revisit at v1.0.

---

## Data Model

```typescript
// New types (all in wolfpack-bundles.d.ts)

interface WolfpackBundleSDK {
  readonly state: WolfpackBundleState;
  addItem(stepId: string, variantId: string | number, qty: number): AddRemoveResult;
  removeItem(stepId: string, variantId: string | number, qty: number): AddRemoveResult;
  clearStep(stepId: string): { success: boolean };
  addBundleToCart(): Promise<void>;
  validateStep(stepId: string): ValidationResult;
  validateBundle(): BundleValidationResult;
  getDisplayPrice(): DisplayPrice;
}

interface WolfpackBundleState {
  isReady: boolean;
  bundleId: string | null;
  bundleName: string | null;
  steps: Step[];
  selections: Record<string, Record<string, number>>; // stepId → variantId → qty
  discountConfiguration: DiscountConfiguration | null;
}

interface AddRemoveResult {
  success: boolean;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

interface BundleValidationResult {
  valid: boolean;
  errors: Record<string, string>; // stepId → error message
}

interface DisplayPrice {
  original: number;     // cents
  discounted: number;   // cents
  savings: number;      // cents
  savingsPercent: number;
  formatted: string;    // locale-aware e.g. "$80.00"
}

// CustomEvent detail types
interface WbpItemAddedDetail { stepId: string; variantId: string; qty: number; selections: Record<string, Record<string, number>>; }
interface WbpItemRemovedDetail { stepId: string; variantId: string; qty: number; selections: Record<string, Record<string, number>>; }
interface WbpStepClearedDetail { stepId: string; }
interface WbpCartSuccessDetail { bundleId: string; }
interface WbpCartFailedDetail { error: string; }
interface WbpReadyDetail { bundleId: string; steps: Step[]; }
```

---

## Files

### New Files — SDK Source

| File | Action | What it contains |
|---|---|---|
| `app/assets/sdk/state.js` | create | Module-level `WolfpackState` singleton: `selections` map, `bundleData`, `steps`, `isReady`. Getters only — mutations go through `addItem`/`removeItem`/`clearStep`. |
| `app/assets/sdk/config-loader.js` | create | `loadBundleConfig(container)` — reads `data-bundle-config` JSON, validates shape, populates state. Same logic as widget's `loadBundleData()` but without UI side-effects. |
| `app/assets/sdk/cart.js` | create | `buildCartItems(state)`, `addBundleToCart(state)` — lifted from `BundleWidgetProductPage.buildCartItems()` and `addToCart()`. Fires `wbp:cart-success`/`wbp:cart-failed` events. |
| `app/assets/sdk/events.js` | create | `emit(eventName, detail)` — thin wrapper over `window.dispatchEvent(new CustomEvent(...))`. Central event registry. |
| `app/assets/sdk/validate-bundle.js` | create | `validateStep(stepId, state)` and `validateBundle(state)` — wrappers over `ConditionValidator.isStepConditionSatisfied()`. |
| `app/assets/sdk/get-display-price.js` | create | `getDisplayPrice(state)` — calls `PricingCalculator.calculateBundleTotal()` + `calculateDiscount()` + `CurrencyManager` to produce `DisplayPrice` object. |
| `app/assets/sdk/debug.js` | create | `initDebugMode()` — when `?wbp_debug=true`, logs all state/events to console with structured output. |
| `app/assets/sdk/wolfpack-bundles.js` | create | SDK entry point. On `DOMContentLoaded`: finds `[data-sdk-mode="true"]` container, calls `loadBundleConfig`, assembles and exposes `window.WolfpackBundles`. |

### New Files — Types & Tests

| File | Action | What it contains |
|---|---|---|
| `types/wolfpack-bundles.d.ts` | create | All public TypeScript definitions (see Data Model above). |
| `tests/unit/assets/sdk-state.test.ts` | create | Unit tests for state mutations: addItem, removeItem, clearStep, validation guards. |
| `tests/unit/assets/sdk-cart.test.ts` | create | Unit tests for buildCartItems: correct `_bundle_id`, correct properties, unavailable products skipped. |
| `tests/unit/assets/sdk-validate-bundle.test.ts` | create | Unit tests for validateStep and validateBundle across all operator types. |
| `tests/unit/assets/sdk-get-display-price.test.ts` | create | Unit tests for getDisplayPrice: percentage off, fixed amount, no discount, zero selections. |

### New Files — Extension & Docs

| File | Action | What it contains |
|---|---|---|
| `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js` | create (generated) | IIFE build output. Not hand-edited — produced by `npm run build:sdk`. |
| `docs/wolfpack-bundles-sdk/SDK_USAGE_GUIDE.md` | create | Comprehensive merchant/developer-facing guide. |

### Modified Files

| File | Action | What changes |
|---|---|---|
| `scripts/build-widget-bundles.js` | modify | Add `buildSdkBundle()` function + new `SOURCES.sdk` + `OUTPUTS.sdk` entries. Add `'sdk'` as a valid CLI argument. SDK shares same `SHARED_MODULES` array as widgets. |
| `extensions/bundle-builder/blocks/bundle-product-page-embed.liquid` | modify | Add conditional: when `data-sdk-mode` setting is `true` in block settings, skip loading `bundle-widget-product-page-bundled.js` and load `wolfpack-bundles-sdk.js` instead. Add block setting `sdk_mode` (checkbox, default false). |

---

## SDK Internal Architecture (IIFE structure)

```
(function (window) {
  'use strict';

  // === Shared modules (inlined by build script) ===
  // ConditionValidator  (condition-validator.js)
  // BUNDLE_WIDGET       (constants.js)
  // CurrencyManager     (currency-manager.js)
  // PricingCalculator   (pricing-calculator.js)

  // === SDK modules (inlined by build script) ===
  // WolfpackState       (sdk/state.js)
  // loadBundleConfig    (sdk/config-loader.js)
  // emit                (sdk/events.js)
  // buildCartItems      (sdk/cart.js)
  // addBundleToCart     (sdk/cart.js)
  // validateStep        (sdk/validate-bundle.js)
  // validateBundle      (sdk/validate-bundle.js)
  // getDisplayPrice     (sdk/get-display-price.js)
  // initDebugMode       (sdk/debug.js)

  // === Entry point (wolfpack-bundles.js) ===
  // DOMContentLoaded → find container → loadBundleConfig → expose window.WolfpackBundles

})(window);
```

## Build Command

```bash
npm run build:sdk        # new npm script → node scripts/build-widget-bundles.js sdk
npm run build:widgets    # unchanged — does NOT build SDK
```

Add to `package.json`:
```json
"build:sdk": "node scripts/build-widget-bundles.js sdk"
```

---

## Test Plan

| Test file | Scope | Key behaviours |
|---|---|---|
| `tests/unit/assets/sdk-state.test.ts` | unit | addItem increments qty; addItem blocked when step condition exceeded; removeItem decrements to 0 removes key; clearStep empties step; invalid stepId returns error |
| `tests/unit/assets/sdk-cart.test.ts` | unit | buildCartItems produces correct `id`, `quantity`, `properties._bundle_id`; unavailable products excluded and throws; UUID bundle instance ID format |
| `tests/unit/assets/sdk-validate-bundle.test.ts` | unit | validateStep passes when condition met; fails with message when not; validateBundle returns all errors; free gift/default steps skipped |
| `tests/unit/assets/sdk-get-display-price.test.ts` | unit | percentage_off discount math; fixed_amount_off; no discount (returns original=discounted); zero selections returns all zeros |

**Mock:** `fetch` (for cart tests) — use Jest `global.fetch` mock.
**Do not mock:** ConditionValidator, PricingCalculator, CurrencyManager — all are pure functions.
**No tests needed:** Liquid block changes, SDK IIFE build output, debug panel console output.

---

## Sequence: SDK Init Flow

```
DOMContentLoaded
  └─ find [data-sdk-mode="true"] container
       ├─ not found → no-op (or expose stub in debug mode)
       └─ found → loadBundleConfig(container)
            ├─ parse data-bundle-config JSON
            ├─ populate WolfpackState
            ├─ expose window.WolfpackBundles = { state, addItem, removeItem, ... }
            └─ emit('wbp:ready', { bundleId, steps })
```

## Sequence: addItem Flow

```
WolfpackBundles.addItem(stepId, variantId, qty)
  ├─ validate stepId exists in state.steps → error if not
  ├─ ConditionValidator.canUpdateQuantity(step, currentSelections, variantId, qty)
  │    ├─ blocked → return { success: false, error: '...' }
  │    └─ allowed → mutate state.selections[stepId][variantId] += qty
  │                  emit('wbp:item-added', { stepId, variantId, qty, selections })
  │                  return { success: true }
```

## Sequence: addBundleToCart Flow

```
WolfpackBundles.addBundleToCart()
  ├─ validateBundle() → if invalid, emit wbp:cart-failed, return
  ├─ buildCartItems(state) → [ { id, quantity, properties } ]
  ├─ fetch('/cart/add.js', { method: 'POST', body: JSON.stringify({ items }) })
  │    ├─ ok → emit('wbp:cart-success', { bundleId })
  │    └─ error → emit('wbp:cart-failed', { error: message })
```
