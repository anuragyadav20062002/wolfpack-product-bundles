# Easy Bundles SDK — Competitor Analysis & Implementation Reference

**Source:** Easy Bundles SDK: Custom Storefront Implementation Guide (Notion, April 2026)
**Purpose:** Understand EB's SDK architecture to inform our own Wolfpack custom SDK design.

---

## 1. What It Is

EB's SDK lets merchants (or their developers) build a **fully custom bundle UI** on the storefront without using EB's pre-built widget. The SDK handles backend logic; the developer owns 100% of the HTML, CSS, and state rendering.

**Architecture type:** Headless-on-Liquid
- **App handles:** backend logic, product containers, cart session, discount application, validation rules.
- **Developer handles:** Frontend HTML structure, state rendering, UI validation enforcement, price display math.

---

## 2. Prerequisites & Setup Flow

### Step 1 — Bundle must be configured in Admin first
The SDK is **read-only** at runtime. It reflects whatever the merchant configured in the App Admin. Developers cannot create bundles, discounts, or steps via JavaScript.

- Bundle type: "Product Page Bundle"
- App auto-generates a "Parent/Dummy" product in Shopify to house the bundle (developer does not manually create this)

### Step 2 — Steps & Categories
- **Step:** logical flow unit (e.g. "Step 1: Choose Base")
- **Category:** a collection of products assigned to a step
- A single Step can contain **multiple Categories** (not 1:1)
- Min/max selection limits per step are configured in Admin → SDK reads them for validation

### Step 3 — Discounts (optional)
- Discount types: Percentage Off, Fixed Price, Tiered
- Configured in Admin; SDK exposes them via `discountConfiguration` for **display purposes only**
- Actual discount is applied by the App backend at cart/checkout — not by JS

### Step 4 — SDK Loading
- SDK loads automatically via the **Theme App Extension** on product pages linked to a bundle
- No `gbbMix.init()` call required — SDK auto-detects Bundle ID from current page
- Developer mode: append `?dev=true` to URL → exposes `gbbMix` in console

---

## 3. Core Architectural Patterns

### 3.1 Manual Render Loop
The SDK has **no reactive state** and fires **no generic "state-changed" event**. DOM updates are entirely the developer's responsibility.

```
User Click → Call SDK function → Await completion → Call your render() function
```

```js
async function handleItemAdd(stepId, variantId, qty) {
  await gbbMix.sdk.f.addItem(stepId, variantId, qty);
  renderBundleUI(); // developer's own function
}
```

### 3.2 Client-Side Gatekeeping (Validation is Developer's Job)
The SDK is **permissive** — it will call `addBundleToCart` even with incomplete selections. The developer must:
- Check each step against `checkStepLevelCondition` before enabling the CTA button
- Disable the "Add to Cart" button until all step conditions pass

### 3.3 Global State Object
All bundle data lives on `window.gbbMix`:

| Path | Contents |
|------|----------|
| `gbbMix.sdk.state` | Current selections, bundle config, discount rules |
| `gbbMix.sdk.f` | Function library (add item, validate, add to cart) |
| `gbbMix.settings` | Static settings from Admin |

---

## 4. Full API Reference

### 4.1 State Properties (`gbbMix.sdk.state`)

| Property | Description |
|----------|-------------|
| `discountConfiguration` | Discount rules (% off / fixed) for frontend price display math |
| `cartData` | Current bundle cart state, includes `total_price` (raw subtotal in cents) |
| `steps` | Array of step configs: IDs, names, associated categories |

### 4.2 SDK Functions (`gbbMix.sdk.f`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `addItem` | `(stepId, variantId, qty)` | Add a variant to the bundle selection. Must manually re-render UI after. |
| `checkStepLevelCondition` | `(stepId, variantId, qty)` | Returns pass/fail for min/max rules on a step. Use before enabling CTA. |
| `addBundleToCart` | `()` | Async AJAX add-to-cart. Returns `void` but is awaitable. Does NOT redirect. |

### 4.3 Settings (`gbbMix.settings`)

| Property | Description |
|----------|-------------|
| `mixAndMatchBundleData.boxSelection` | Box size configurations (e.g. 6-pack vs 12-pack) if enabled |

### 4.4 Window Events

| Event | Description |
|-------|-------------|
| `gbb-add-bundle-to-cart-success` | Fired when bundle is successfully added via AJAX |
| `gbb-add-bundle-to-cart-failed` | Fired when add-to-cart fails (network error, etc.) |

---

## 5. Add-to-Cart Pattern (Full Reference Implementation)

```js
const handleAddToCart = async () => {
  // 1. Start loading state
  showSpinner(true);

  // 2. Register one-time event listeners before calling SDK
  const onSuccess = () => {
    console.log('Bundle added!');
    window.location.href = '/cart'; // or open drawer
  };
  const onFail = () => {
    alert('Failed to add bundle. Please try again.');
  };

  window.addEventListener('gbb-add-bundle-to-cart-success', onSuccess, { once: true });
  window.addEventListener('gbb-add-bundle-to-cart-failed', onFail, { once: true });

  // 3. Call SDK — returns void but is awaitable (use for spinner UX)
  await gbbMix.sdk.f.addBundleToCart();

  // 4. Clear loading state
  showSpinner(false);
};
```

---

## 6. Limitations

| Limitation | Detail |
|------------|--------|
| No reactivity | No state change events; developer must call render() manually after every SDK action |
| No headless support | Relies on Shopify Online Store 2.0. Not compatible with Hydrogen or React-based headless storefronts |
| No vintage theme support | Legacy Liquid themes not guaranteed |
| No framework components | SDK is framework-agnostic; plain JS recommended. Alpine/Vue/React can wrap it but no adapters provided |
| No JS discount creation | Discounts must exist in Admin; SDK only reads them |
| No HTML scaffolding | SDK provides zero HTML — developer builds everything |

---

## 7. EB SDK Developer Checklist

- [ ] Bundle configured in Admin (Steps, Categories, limits, discounts)
- [ ] Theme App Extension enabled in Theme Editor
- [ ] HTML container present in Liquid theme
- [ ] Central `render()` function implemented, called after every SDK action
- [ ] Manual price/discount calculation for display (read `discountConfiguration`)
- [ ] "Add to Cart" button gated behind `checkStepLevelCondition` for all steps
- [ ] `addBundleToCart` wrapped with `await` + success/fail event listeners

---

## 8. Key Gaps & Observations (for Wolfpack SDK Design)

### What EB does well
- Clean separation: App owns backend, SDK exposes it, Developer owns UI
- Single global namespace (`gbbMix`) — easy to inspect in DevTools
- `?dev=true` debug mode is excellent DX
- Event-based cart outcome (success/fail) decouples the async operation cleanly

### What EB is missing / where we can differentiate

| Gap in EB SDK | Wolfpack Opportunity |
|---------------|----------------------|
| No state-change events — developer must poll/re-render manually | Emit granular events (`wbp:item-added`, `wbp:step-changed`, `wbp:cart-updated`) so reactive frameworks can subscribe |
| No HTML scaffolding — pure blank canvas, steep for non-dev merchants | Optionally provide a headless-but-opinionated starter template |
| No TypeScript types published | Ship a `wolfpack-bundles.d.ts` type definition file so TS projects get autocomplete |
| No framework adapters | Consider a thin `@wolfpack/bundles-react` hook package |
| Box selection is a niche prop buried in `gbbMix.settings.mixAndMatchBundleData.boxSelection` | Surface bundle structure in a flatter, more discoverable API |
| Validation is fully manual — easy to miss steps | Provide a `validateBundle()` helper that checks ALL steps and returns a structured result |
| Discount math is left to developer | Provide a `getDisplayPrice()` helper that does the math and returns a formatted string |
| No removal API documented | We should expose `removeItem(stepId, variantId, qty)` explicitly |

### Architecture recommendation for our SDK
- Keep the same **Headless-on-Liquid** model — it's the right approach for Shopify
- Expose a `window.WolfpackBundles` global (mirrors `gbbMix` but with cleaner naming)
- Emit **DOM events** for every state change (reactivity without framework coupling)
- Provide `validateBundle()` → structured errors per step (not just pass/fail per step)
- Provide `getDisplayPrice(discountType, total)` helper
- Ship TypeScript definitions from day one
- `?wbp_debug=true` for developer mode (consistent naming convention with our brand)

---

## 9. Proposed Wolfpack SDK Global Shape (Draft)

```ts
interface WolfpackBundleSDK {
  // State
  state: {
    bundleId: string;
    steps: Step[];
    selections: Record<string, SelectedItem[]>; // stepId → items
    cartData: CartData;
    discountConfiguration: DiscountConfig;
  };

  // Actions
  addItem(stepId: string, variantId: number, qty: number): Promise<void>;
  removeItem(stepId: string, variantId: number, qty: number): Promise<void>;
  clearStep(stepId: string): Promise<void>;
  addBundleToCart(): Promise<void>;

  // Validation helpers
  validateStep(stepId: string): { valid: boolean; message: string };
  validateBundle(): { valid: boolean; errors: Record<string, string> };

  // Price helpers
  getDisplayPrice(): { original: number; discounted: number; savings: number; formatted: string };

  // Settings
  settings: BundleSettings;
}

// Window events
// 'wbp:item-added'       → { stepId, variantId, qty }
// 'wbp:item-removed'     → { stepId, variantId, qty }
// 'wbp:step-changed'     → { stepId, selections }
// 'wbp:cart-success'     → { bundleId }
// 'wbp:cart-failed'      → { error }
```

---

*Last updated: 2026-04-27*
*Source: EB Notion doc scraped via Chrome DevTools MCP*
