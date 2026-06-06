# Wolfpack SDK — Effort Analysis & Repository Strategy

**Date:** 2026-04-28
**Context:** Analysis of what it would take to ship a custom SDK that fills all gaps identified in the EB SDK analysis (see `eb-sdk-analysis.md`).

---

## 1. What the SDK needs to do (gap-complete vs EB)

| Capability | EB has it? | Wolfpack SDK target |
|---|---|---|
| Global state object | ✅ | `window.WolfpackBundles.state` |
| `addItem()` | ✅ | `addItem(stepId, variantId, qty)` |
| `addBundleToCart()` | ✅ | `addBundleToCart()` |
| `checkStepLevelCondition()` | ✅ (per-item) | `validateStep(stepId)` — structured result |
| Cart success/fail events | ✅ | `wbp:cart-success`, `wbp:cart-failed` |
| **Reactive state events** | ❌ | `wbp:item-added`, `wbp:item-removed`, `wbp:step-changed` |
| **`validateBundle()`** | ❌ | Returns `{ valid, errors: Record<stepId, string> }` |
| **`removeItem()`** | ❌ documented | `removeItem(stepId, variantId, qty)` |
| **`getDisplayPrice()`** | ❌ | Returns `{ original, discounted, savings, formatted }` |
| **TypeScript definitions** | ❌ | `wolfpack-bundles.d.ts` shipped with build |
| **Debug mode** | `?dev=true` (console only) | `?wbp_debug=true` — full state panel + event log |
| Framework adapters | ❌ | Plain JS first; React hook later |

---

## 2. What already exists in the codebase (reusable)

This is the most important section. The widget codebase already contains ~1,878 lines of pure, modular, **already-tested** logic sitting in `app/assets/widgets/shared/`. The SDK is largely a matter of **re-exposing this logic through a clean public API**, not rebuilding it from scratch.

### Ready-to-use modules

| Module | Lines | What it gives the SDK |
|---|---|---|
| `condition-validator.js` | 199 | `isStepConditionSatisfied()`, `canUpdateQuantity()` — the entire validation engine. Already unit-tested. |
| `pricing-calculator.js` | 227 | `calculateBundleTotal()`, `calculateDiscount()` — drives `getDisplayPrice()`. Pure functions. |
| `currency-manager.js` | 118 | Currency formatting, locale-aware price display |
| `bundle-data-manager.js` | 186 | Bundle config parsing, step/product data utilities |
| `constants.js` | 54 | Condition operators, bundle type constants |
| `template-manager.js` | 307 | i18n string resolution (already handles merchant-configured copy) |

### Already-implemented logic in the widget classes

| Logic | Where it lives | SDK extraction path |
|---|---|---|
| Bundle config loading (metafield cache → proxy fallback) | `loadBundleData()` in both widgets | Lift into `sdk/core/config-loader.js` |
| Cart add via `fetch('/cart/add.js')` | `addToCart()` — `bundle-widget-product-page.js:2344` | Lift into `sdk/core/cart.js` |
| Cart item construction with `_bundle_id` | `buildCartItems()` — line 2391 | Lift into `sdk/core/cart.js` |
| `crypto.randomUUID()` bundle instance ID | `generateBundleInstanceId()` — line 2452 | Already clean, copy as-is |
| Step validation gate | `validateStep(index)` — line 2129 | Thin wrapper over `ConditionValidator` |
| Selection state (`selectedProducts` array) | Widget class instance vars | Needs lifting into a standalone state module |

### What does NOT exist yet (net-new build)

| Piece | Notes |
|---|---|
| `window.WolfpackBundles` public namespace | The SDK's outer shell |
| Event emission system | `dispatchEvent(new CustomEvent('wbp:item-added', { detail: ... }))` — simple but needs wiring at every mutation point |
| `validateBundle()` across all steps | One-liner wrapper over existing `validateStep` loop |
| `getDisplayPrice()` | Wrapper over `PricingCalculator` + `CurrencyManager` |
| TypeScript definitions (`wolfpack-bundles.d.ts`) | Written by hand, ~150-200 lines |
| SDK-specific build target | New entry in `scripts/build-widget-bundles.js` |
| Developer debug panel (`?wbp_debug=true`) | State inspector overlay — most effort in this DX piece |
| Documentation | Markdown guide for developers |

---

## 3. Effort estimate

**Assumption:** One experienced developer. All estimates in working days.

### Phase 1 — SDK Core (12–15 days)

| Task | Days | Notes |
|---|---|---|
| State module: lift `selectedProducts`, step data, bundle config into standalone `WolfpackState` | 3 | Most coupled piece — needs careful extraction from widget class |
| Cart module: lift `buildCartItems()`, `addToCart()`, `generateBundleInstanceId()` | 2 | Largely a copy-and-clean |
| Public API surface: `window.WolfpackBundles` + `addItem`, `removeItem`, `addBundleToCart` | 2 | Thin wrappers over state + cart modules |
| Reactive event emission: wire `dispatchEvent` at every state mutation | 2 | New code; needs to cover add/remove/cart |
| `validateBundle()` and `validateStep()` helpers | 1 | One-liner wrappers over existing `ConditionValidator` |
| `getDisplayPrice()` helper | 1 | Wrapper over `PricingCalculator` + `CurrencyManager` |
| SDK build pipeline (new IIFE target in build script) | 1 | Small change to `scripts/build-widget-bundles.js` |
| Auto-init: detect bundle on page, load config, expose state | 2 | Mirrors existing widget init, but without rendering HTML |

**Phase 1 total: ~14 days**

### Phase 2 — TypeScript Definitions (3–4 days)

| Task | Days |
|---|---|
| Define `Step`, `Selection`, `CartData`, `DiscountConfig` types | 1.5 |
| Define `WolfpackBundleSDK` interface | 1 |
| Define `WolfpackBundlesEvent` types for all custom events | 1 |

**Phase 2 total: ~3–4 days**

### Phase 3 — Developer Experience (5–7 days)

| Task | Days |
|---|---|
| `?wbp_debug=true` mode: console state logging, event tracing | 2 |
| State inspector overlay (floating panel, similar to Redux DevTools lite) | 3 |
| Error messages: meaningful SDK-level errors (wrong stepId, etc.) | 1 |

**Phase 3 total: ~5–7 days**

### Phase 4 — Testing (4–5 days)

| Task | Days |
|---|---|
| Unit tests for SDK public API (addItem, removeItem, validateBundle, getDisplayPrice) | 2 |
| Integration tests: full add-to-cart flow via SDK | 2 |
| Manual storefront smoke test | 1 |

**Phase 4 total: ~4–5 days**

### Phase 5 — Documentation (3–4 days)

| Task | Days |
|---|---|
| SDK implementation guide (mirrors EB's Notion doc style) | 2 |
| API reference (all methods, events, state properties) | 1 |
| "Getting started in 10 minutes" quickstart | 1 |

**Phase 5 total: ~3–4 days**

---

### Total effort: **~29–40 working days (6–8 weeks for one developer)**

The wide range exists because:
- **Lower bound (6 weeks):** The state extraction is clean on the first try and the DX panel is kept minimal.
- **Upper bound (8 weeks):** State extraction surfaces unexpected coupling in the widget classes; DX tooling gets more polished.

This is **significantly less** than building from scratch (which would be 16–20+ weeks) because the core business logic already exists and is already tested.

---

## 4. Same repo or separate repo?

### Verdict: **Start in the same repo. Plan to extract when the SDK hits v1.0.**

Here is the reasoning:

### Arguments for same repo (strong)

1. **The SDK is tightly coupled to the bundle schema.** Every time the bundle config shape changes (new step type, new discount method, new condition operator), both the SDK and the widget must update together. A separate repo means two PRs, two deploys, two version bumps every time.

2. **The shared modules already live here.** `condition-validator.js`, `pricing-calculator.js`, `currency-manager.js` are in `app/assets/widgets/shared/`. The SDK would import them directly. Moving to a separate repo means either duplicating them or publishing them as a shared package — both are overhead for a v0 SDK.

3. **No npm infrastructure needed yet.** Merchants using the SDK will load it via the Theme App Extension (same delivery mechanism as the widget JS). There is no need to publish to npm at this stage — the build script already handles bundling.

4. **Faster iteration.** If a bug is found in `ConditionValidator`, fixing it in the same repo fixes both the widget and the SDK in one commit.

5. **Versioning stays in sync.** `WIDGET_VERSION` in `scripts/build-widget-bundles.js` can be extended to cover the SDK version. One version, one deploy.

### Arguments for a separate repo (weak right now, strong later)

1. **SDK is a public-facing product.** When merchants or their developers use the SDK, they may want to file issues, read changelogs, and install it as an npm package. A separate repo gives you a cleaner public surface.

2. **Different audiences.** The app repo contains Shopify App code (Remix routes, Prisma, webhooks). Developers consuming the SDK don't need any of that context.

3. **Independent release cadence.** If you want to ship a patch fix to the SDK without touching the app, a separate repo makes that cleaner.

### Recommended structure inside this repo

```
app/assets/
├── widgets/
│   └── shared/           ← existing shared modules (shared by widget + SDK)
│       ├── condition-validator.js
│       ├── pricing-calculator.js
│       └── ...
│
├── sdk/                  ← NEW: SDK source files
│   ├── core/
│   │   ├── state.js      ← WolfpackState (lifted from widget class)
│   │   ├── cart.js       ← addItem, removeItem, addBundleToCart
│   │   ├── config-loader.js
│   │   └── events.js     ← dispatchEvent wrappers
│   ├── helpers/
│   │   ├── validate-bundle.js
│   │   └── get-display-price.js
│   ├── debug/
│   │   └── debug-panel.js
│   └── wolfpack-bundles.js   ← SDK entry point (exposes window.WolfpackBundles)
│
scripts/
└── build-widget-bundles.js   ← extend to also build sdk/wolfpack-bundles.js → IIFE

extensions/bundle-builder/assets/
├── bundle-widget-full-page-bundled.js
├── bundle-widget-product-page-bundled.js
└── wolfpack-bundles-sdk.js   ← NEW SDK build output (loaded by Theme App Extension)

types/
└── wolfpack-bundles.d.ts     ← NEW TypeScript definitions
```

### When to extract to a separate repo

Extract when **all three** of the following are true:
- SDK is at v1.0 (stable public API, no breaking changes expected imminently)
- At least one external merchant developer is actively using it
- You want to publish it to npm for framework adapter packages

Until then, the overhead of cross-repo coordination outweighs the organisational benefit.

---

## 5. Risk factors

| Risk | Likelihood | Mitigation |
|---|---|---|
| State extraction causes widget regressions | Medium | Feature-flag: SDK loads separately from widget; widget keeps its own internal state |
| Bundle schema changes break SDK consumers | Medium | Semantic versioning + migration notes in changelog |
| Merchants load SDK on non-bundle pages | Low | SDK silently no-ops if no bundle is detected on the page |
| App Proxy HMAC verification blocks SDK config fetch | Low | SDK uses same metafield-cache path as widget (no network call on happy path) |

---

## 6. Implementation order recommendation

```
Week 1–2:   Phase 1 (SDK core) — state module + cart module + public API surface
Week 3:     Phase 1 cont. — event emission + helpers + build pipeline
Week 4:     Phase 2 (TypeScript definitions) + Phase 4 (testing)
Week 5:     Phase 3 (DX tooling — debug panel)
Week 6:     Phase 5 (documentation) + internal merchant pilot
Week 7–8:   Buffer for iteration based on pilot feedback
```

---

*Last updated: 2026-04-28*
*Based on: codebase analysis of widget source files (7,813 lines total) + EB SDK competitor analysis*
