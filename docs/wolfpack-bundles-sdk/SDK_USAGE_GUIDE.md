# Wolfpack Bundles SDK — Developer Usage Guide

> **Version:** 2.7.0 (matches widget version)
> **Architecture:** Headless-on-Liquid — the App manages backend logic, pricing, and cart session. You own the HTML, CSS, and state rendering.

---

## Overview

The Wolfpack Bundles SDK (`window.WolfpackBundles`) lets you build a **fully custom bundle UI** on any Shopify Online Store 2.0 theme — without using the pre-built Wolfpack widget. The SDK handles:

- Reading bundle configuration (steps, conditions, discounts) from the App Admin
- Tracking product selections in browser memory
- Validating step conditions (min/max quantities)
- Adding the bundle to the Shopify cart via AJAX
- Emitting DOM events so your UI can react to every state change

You own **all HTML, CSS, and rendering logic**. The SDK is the data and action layer.

---

## Prerequisites

1. **Bundle configured in App Admin** — The SDK reflects whatever bundle the merchant created. You cannot create bundles via JavaScript.
2. **Theme App Extension active** — Enable the Wolfpack Bundle (Product) block in your Shopify Theme Editor under App Embeds.
3. **SDK mode enabled** — In the Theme Editor, open the Wolfpack Bundle (Product) block settings and toggle **Enable SDK mode** to ON. This loads the SDK instead of the pre-built widget.

> **Important:** SDK mode and the pre-built widget are mutually exclusive on the same page. Enabling SDK mode prevents the default widget JS from loading.

---

## How It Loads

When SDK mode is active, the Theme App Extension:

1. Injects a `<div id="bundle-builder-app" data-sdk-mode="true" data-bundle-config="...">` container into the page, populated with the bundle's configuration from the product metafield.
2. Loads `wolfpack-bundles-sdk.js` asynchronously.
3. On `DOMContentLoaded`, the SDK parses the config and exposes `window.WolfpackBundles`.
4. The SDK fires a `wbp:ready` event — **listen for this event** before calling any SDK methods.

---

## Quickstart (Plain JavaScript)

```html
<!-- 1. Add your custom bundle root container anywhere in the theme -->
<div id="my-bundle-root">
  <p>Loading bundle...</p>
</div>

<script>
  window.addEventListener('wbp:ready', function (e) {
    console.log('Bundle ready:', e.detail.bundleId);
    renderBundle();
  });

  function renderBundle() {
    var sdk = window.WolfpackBundles;
    var state = sdk.state;
    var root = document.getElementById('my-bundle-root');

    // Build your UI from state.steps and state.selections
    root.innerHTML = state.steps.map(function (step) {
      return '<div class="step" data-step-id="' + step.id + '">'
        + '<h3>' + step.name + '</h3>'
        + '<p>Selected: ' + Object.values(state.selections[step.id] || {}).reduce(function (s, q) { return s + q; }, 0) + '</p>'
        + '</div>';
    }).join('');
  }

  // Re-render whenever an item is added or removed
  window.addEventListener('wbp:item-added', renderBundle);
  window.addEventListener('wbp:item-removed', renderBundle);
  window.addEventListener('wbp:step-cleared', renderBundle);
</script>
```

---

## Global Object

Once `wbp:ready` fires, `window.WolfpackBundles` is available with the following interface:

```
window.WolfpackBundles
  .state                 → live read-only state snapshot
  .addItem(...)          → add a product to a step
  .removeItem(...)       → remove a product from a step
  .clearStep(...)        → clear all selections in a step
  .addBundleToCart()     → async AJAX add-to-cart
  .validateStep(...)     → validate a single step
  .validateBundle()      → validate all steps
  .getDisplayPrice()     → calculate display prices with discount
```

---

## API Reference

### `state` (read-only)

```js
var state = WolfpackBundles.state;

state.isReady              // boolean — true after init
state.bundleId             // string | null
state.bundleName           // string | null
state.steps                // Step[] — full step config from App Admin
state.selections           // Record<stepId, Record<variantId, qty>>
state.discountConfiguration // DiscountConfiguration | null
```

**Example — reading current quantity for a step:**
```js
var step1Qty = Object.values(WolfpackBundles.state.selections['step_abc123'] || {})
  .reduce(function (sum, q) { return sum + q; }, 0);
```

---

### `addItem(stepId, variantId, qty)`

Adds `qty` units of a variant to a step. Validates the step's min/max condition before mutating state. Fires `wbp:item-added` on success.

**Parameters:**
- `stepId` — string, the step's `id` from `state.steps`
- `variantId` — string or number, the Shopify variant ID
- `qty` — number, quantity to add (usually `1`)

**Returns:** `{ success: boolean, error?: string }`

```js
var result = WolfpackBundles.addItem('step_abc123', 44321001234, 1);
if (!result.success) {
  alert(result.error); // e.g. "This step allows at most 3 products."
}
```

---

### `removeItem(stepId, variantId, qty)`

Removes `qty` units from a step's selection. If quantity reaches 0, the variant is removed entirely. Fires `wbp:item-removed` on success.

```js
WolfpackBundles.removeItem('step_abc123', 44321001234, 1);
```

---

### `clearStep(stepId)`

Removes all selections from a step. Fires `wbp:step-cleared` on success.

```js
WolfpackBundles.clearStep('step_abc123');
```

---

### `addBundleToCart()`

Asynchronously adds the bundle to the Shopify cart via `fetch('/cart/add.js')`. Does **not** redirect the customer — handle the redirect or cart drawer yourself using the event listeners.

**Returns:** `Promise<void>`

**Full pattern:**
```js
async function handleAddToCart() {
  // 1. Gate behind validation
  var validation = WolfpackBundles.validateBundle();
  if (!validation.valid) {
    var firstError = Object.values(validation.errors)[0];
    alert(firstError);
    return;
  }

  // 2. Show loading state
  document.getElementById('my-atc-btn').disabled = true;
  document.getElementById('my-atc-btn').textContent = 'Adding...';

  // 3. One-time event listeners
  window.addEventListener('wbp:cart-success', function () {
    window.location.href = '/cart';
  }, { once: true });

  window.addEventListener('wbp:cart-failed', function (e) {
    alert('Could not add bundle: ' + e.detail.error);
    document.getElementById('my-atc-btn').disabled = false;
    document.getElementById('my-atc-btn').textContent = 'Add Bundle to Cart';
  }, { once: true });

  // 4. Call SDK — fires wbp:cart-success or wbp:cart-failed when done
  await WolfpackBundles.addBundleToCart();
}
```

---

### `validateStep(stepId)`

Checks if the current selections for a single step satisfy its configured condition.

**Returns:** `{ valid: boolean, message: string }`

```js
var result = WolfpackBundles.validateStep('step_abc123');
if (!result.valid) {
  document.getElementById('step-error').textContent = result.message;
  // e.g. "This step requires exactly 3 items."
}
```

---

### `validateBundle()`

Checks all required steps (skips free-gift and default steps). Use this to enable/disable the Add to Cart button.

**Returns:** `{ valid: boolean, errors: Record<stepId, string> }`

```js
function updateCartButton() {
  var validation = WolfpackBundles.validateBundle();
  var btn = document.getElementById('my-atc-btn');
  btn.disabled = !validation.valid;
  btn.textContent = validation.valid
    ? 'Add Bundle to Cart'
    : 'Complete all steps to continue';
}
```

---

### `getDisplayPrice()`

Calculates display prices for the current selections, applying any configured discount.

**Returns:** `{ original, discounted, savings, savingsPercent, formatted }`

> All numeric values are in **cents**. `formatted` is a locale-aware string (e.g. `"$80.00"`).
> Note: the actual transactional discount at checkout is applied automatically by the App's Cart Transform — this helper is for UI display only.

```js
function updatePriceDisplay() {
  var price = WolfpackBundles.getDisplayPrice();

  document.getElementById('price-original').textContent = '$' + (price.original / 100).toFixed(2);
  document.getElementById('price-discounted').textContent = price.formatted;

  if (price.savings > 0) {
    document.getElementById('price-savings').textContent =
      'You save ' + price.savingsPercent + '% ($' + (price.savings / 100).toFixed(2) + ')';
    document.getElementById('price-savings').style.display = '';
  } else {
    document.getElementById('price-savings').style.display = 'none';
  }
}
```

---

## Events Reference

All events fire on `window`. Use `addEventListener` to listen.

| Event | Fires when | `event.detail` |
|---|---|---|
| `wbp:ready` | SDK is initialized and `window.WolfpackBundles` is available | `{ bundleId, steps }` |
| `wbp:item-added` | `addItem()` succeeds | `{ stepId, variantId, qty, selections }` |
| `wbp:item-removed` | `removeItem()` succeeds | `{ stepId, variantId, qty, selections }` |
| `wbp:step-cleared` | `clearStep()` succeeds | `{ stepId }` |
| `wbp:cart-success` | `addBundleToCart()` completes successfully | `{ bundleId }` |
| `wbp:cart-failed` | `addBundleToCart()` fails (validation or network) | `{ error }` |

**Example — re-render on any selection change:**
```js
['wbp:item-added', 'wbp:item-removed', 'wbp:step-cleared'].forEach(function (name) {
  window.addEventListener(name, function () {
    updateCartButton();
    updatePriceDisplay();
  });
});
```

---

## TypeScript Usage

Add the type definitions to your project:

```json
// tsconfig.json
{
  "include": ["path/to/wolfpack-bundles.d.ts"]
}
```

Or reference in a file:
```ts
/// <reference path="path/to/wolfpack-bundles.d.ts" />
```

Now `window.WolfpackBundles` and all event detail types are fully typed:

```ts
window.addEventListener('wbp:ready', (e: CustomEvent<WbpReadyDetail>) => {
  const steps: Step[] = e.detail.steps;
});

window.addEventListener('wbp:item-added', (e: CustomEvent<WbpItemAddedDetail>) => {
  console.log(e.detail.stepId, e.detail.variantId, e.detail.qty);
});

const result: AddRemoveResult = WolfpackBundles!.addItem('step_abc', 123456, 1);
const price: DisplayPrice = WolfpackBundles!.getDisplayPrice();
const validation: BundleValidationResult = WolfpackBundles!.validateBundle();
```

---

## Debug Mode

Append `?wbp_debug=true` to any storefront URL. The SDK will:

- Log full state to the console on init
- Log every event as it fires
- Expose `window.WolfpackBundles` even on pages without a bundle (as a no-op object)

```
[WolfpackBundles SDK] Debug mode active (?wbp_debug=true)
  State: { isReady: true, bundleId: "bundle_123", steps: [...], ... }
[WolfpackBundles] Event: wbp:item-added { stepId: "step_1", variantId: "44321001234", qty: 1, ... }
[WolfpackBundles] Event: wbp:cart-success { bundleId: "bundle_123" }
```

---

## Complete Reference Implementation

This is a minimal but complete custom bundle UI:

```html
<!-- Your custom container (place anywhere in the theme) -->
<div id="my-bundle">
  <div id="bundle-loading">Loading your bundle...</div>
  <div id="bundle-ui" style="display:none">
    <div id="bundle-steps"></div>
    <div id="bundle-price"></div>
    <button id="bundle-atc" disabled>Add Bundle to Cart</button>
  </div>
</div>

<script>
  (function () {

    // ── Wait for SDK ────────────────────────────────────────────────────────
    window.addEventListener('wbp:ready', function () {
      document.getElementById('bundle-loading').style.display = 'none';
      document.getElementById('bundle-ui').style.display = '';
      renderAll();
    });

    // ── Re-render on any state change ───────────────────────────────────────
    ['wbp:item-added', 'wbp:item-removed', 'wbp:step-cleared'].forEach(function (evt) {
      window.addEventListener(evt, renderAll);
    });

    function renderAll() {
      renderSteps();
      renderPrice();
      renderCartButton();
    }

    // ── Render steps ────────────────────────────────────────────────────────
    function renderSteps() {
      var sdk = window.WolfpackBundles;
      var container = document.getElementById('bundle-steps');
      container.innerHTML = '';

      sdk.state.steps.forEach(function (step) {
        if (step.isDefault || step.isFreeGift) return;

        var stepEl = document.createElement('div');
        stepEl.className = 'bundle-step';

        var validation = sdk.validateStep(step.id);
        var stepQty = getStepQty(step.id);

        stepEl.innerHTML = '<h3>' + step.name
          + ' <span style="color:' + (validation.valid ? 'green' : '#999') + '">'
          + '(' + stepQty + '/' + (step.conditionValue || '?') + ')</span></h3>'
          + '<p style="color:red;font-size:13px">' + (validation.valid ? '' : validation.message) + '</p>';

        // Render product cards for each product in this step
        (step.products || []).forEach(function (product) {
          var selectedQty = (sdk.state.selections[step.id] || {})[String(product.variantId || product.id)] || 0;
          var card = document.createElement('div');
          card.className = 'product-card' + (selectedQty > 0 ? ' selected' : '');
          card.innerHTML = '<img src="' + (product.imageUrl || '') + '" width="80" height="80" alt="' + product.title + '">'
            + '<p>' + product.title + '</p>'
            + '<p>$' + ((product.price || 0) / 100).toFixed(2) + '</p>'
            + '<button class="add-btn" data-step="' + step.id + '" data-variant="' + (product.variantId || product.id) + '">'
            + (selectedQty > 0 ? '✓ ' + selectedQty + ' added' : 'Add') + '</button>'
            + (selectedQty > 0
              ? '<button class="remove-btn" data-step="' + step.id + '" data-variant="' + (product.variantId || product.id) + '">−</button>'
              : '');
          card.querySelector('.add-btn').addEventListener('click', function () {
            var r = sdk.addItem(this.dataset.step, this.dataset.variant, 1);
            if (!r.success) alert(r.error);
          });
          var removeBtn = card.querySelector('.remove-btn');
          if (removeBtn) {
            removeBtn.addEventListener('click', function () {
              sdk.removeItem(this.dataset.step, this.dataset.variant, 1);
            });
          }
          stepEl.appendChild(card);
        });

        container.appendChild(stepEl);
      });
    }

    // ── Render price ────────────────────────────────────────────────────────
    function renderPrice() {
      var price = window.WolfpackBundles.getDisplayPrice();
      var el = document.getElementById('bundle-price');
      if (price.original === 0) { el.innerHTML = ''; return; }
      el.innerHTML = price.savings > 0
        ? '<s>$' + (price.original / 100).toFixed(2) + '</s> '
          + '<strong>' + price.formatted + '</strong> '
          + '<span style="color:green">Save ' + price.savingsPercent + '%</span>'
        : '<strong>' + price.formatted + '</strong>';
    }

    // ── Render cart button ──────────────────────────────────────────────────
    function renderCartButton() {
      var btn = document.getElementById('bundle-atc');
      var validation = window.WolfpackBundles.validateBundle();
      btn.disabled = !validation.valid;
      btn.textContent = validation.valid ? 'Add Bundle to Cart' : 'Complete all steps';
    }

    // ── Add to cart ─────────────────────────────────────────────────────────
    document.getElementById('bundle-atc').addEventListener('click', async function () {
      this.disabled = true;
      this.textContent = 'Adding...';

      window.addEventListener('wbp:cart-success', function () {
        window.location.href = '/cart';
      }, { once: true });

      window.addEventListener('wbp:cart-failed', function (e) {
        alert('Failed: ' + e.detail.error);
        renderCartButton();
      }, { once: true });

      await window.WolfpackBundles.addBundleToCart();
    });

    // ── Helpers ─────────────────────────────────────────────────────────────
    function getStepQty(stepId) {
      return Object.values(window.WolfpackBundles.state.selections[stepId] || {})
        .reduce(function (s, q) { return s + q; }, 0);
    }

  })();
</script>
```

---

## Limitations

| Limitation | Detail |
|---|---|
| Online Store 2.0 only | SDK relies on Shopify's Liquid app embed structure. Not compatible with Hydrogen or React-based headless storefronts. |
| Single bundle per page | Only one bundle container per page is supported in SDK mode. |
| Admin-first | All bundle configuration (steps, categories, discounts) must be created in the Wolfpack App Admin before using the SDK. You cannot create bundles via JavaScript. |
| No HTML provided | The SDK provides zero HTML. All markup is your responsibility. |
| Discount display only | `getDisplayPrice()` is for UI display. The actual checkout discount is applied by the App's Cart Transform extension automatically. |

---

## Checklist

Before going live with a custom SDK implementation:

- [ ] Bundle configured in App Admin (steps, categories, min/max limits)
- [ ] SDK mode toggled on in Theme Editor block settings
- [ ] `wbp:ready` event listener registered before calling any SDK method
- [ ] `renderAll()` (or equivalent) called after every `wbp:item-*` event
- [ ] Add to Cart button gated behind `validateBundle()` result
- [ ] `addBundleToCart()` called with `wbp:cart-success` / `wbp:cart-failed` listeners
- [ ] Tested with `?wbp_debug=true` to verify event flow
- [ ] Tested on mobile viewport

---

*Wolfpack Product Bundles — SDK v2.7.0*
*Generated: 2026-04-28*
