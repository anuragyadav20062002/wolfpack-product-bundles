# Issue: Bundle Checkout UI Extension Audit
**Issue ID:** bundle-checkout-ui-audit-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 08:14

## Overview
Audit the `bundle-checkout-ui` Shopify checkout UI extension from implementation to live checkout behavior. Establish what it does, why it exists, where Shopify places it, whether it works in the live app, and fix any implementation gaps or errors discovered through evidence.

## Progress Log
### 2026-06-04 07:52 - Audit started
- Created issue log before code changes.
- Next steps: inspect extension configuration/source, verify Shopify checkout UI target behavior, test live checkout in Chrome, then fix any confirmed gaps.

### 2026-06-04 08:04 - Source and live checkout audit
- Inspected `extensions/bundle-checkout-ui/shopify.extension.toml`: the extension is a checkout UI extension named `Bundle Pricing - Checkout` with handle `bundle-checkout-ui`.
- Confirmed declared targets:
  - `purchase.checkout.cart-line-item.render-after`
  - `purchase.thank-you.cart-line-item.render-after`
- Inspected `extensions/bundle-checkout-ui/src/Checkout.tsx`: it reads cart line attributes written by the cart transform and returns `null` for non-bundle lines.
- Confirmed cart transform writes the attributes consumed by the checkout UI extension, including `_is_bundle_parent`, `_bundle_components`, and bundle price/savings totals.
- Validation completed:
  - `npm exec -- tsc --noEmit --skipLibCheck --project extensions/bundle-checkout-ui/tsconfig.json` passed.
  - `npx eslint --max-warnings 9999 extensions/bundle-checkout-ui/src/Checkout.tsx extensions/bundle-checkout-ui/src/index.tsx` produced zero errors.
  - Shopify MCP component validation passed for target `purchase.checkout.cart-line-item.render-after`.
- Live checkout without dev preview initially did not load the extension: checkout client bundle reported no loaded extensions and no `bundle-checkout-ui` host/iframe was present.
- Dev preview with a real FPB bundle cart line did render the extension correctly:
  - Summary rendered as `Bundle (1 items)`.
  - Toggle rendered as `Show 1 Items`.
  - Expanded details rendered component title, retail price, bundle price, percentage savings, and exact savings.
- Checkout editor context showed `activatedExtensions: []` for active configuration `gid://shopify/CheckoutAndAccountsConfiguration/4571169027`.
- While dev preview was active, the editor exposed `bundle-checkout-ui` using a `version/dev-...` script URL. An unsaved test add showed the block could be added to Checkout, then the change was reverted.
- Cleaned Shopify dev preview and hard-reloaded the active checkout editor. The released app version exposed `Bundle Pricing - Checkout` with `Add block`.
- Added the block to the active checkout configuration, confirmed the editor showed it on Checkout and Thank you contexts, then saved. The editor showed `Changes saved`.
- Verified a clean isolated storefront context:
  - Storefront password entry succeeded with password `1`.
  - Initial app-proxy requests returned 504 during cold start, then a hard reload produced 200 responses for `storefront-products`, bundle config, and cart-transform heal.
  - Built a real FPB bundle cart line with `_is_bundle_parent`, `_bundle_components`, and bundle pricing attributes.
  - Checkout without any `dev` query loaded exactly one released `bundle-checkout-ui` script from `extensions.shopifycdn.com` and did not request the dev tunnel manifest.
  - The checkout order summary rendered the extension once under the bundle line as `Bundle (1 items)` with `Show 1 Items`.
  - Expanding the block rendered component title, retail price, bundle price, percentage savings, and exact savings.
- Root cause fixed in the live store configuration: the extension source was valid, but the active checkout profile had not activated/placed the block.

### 2026-06-04 08:12 - Extension lint cleanup
- Next steps: clean the extension-specific ESLint warnings found during the audit, then rerun focused TypeScript and ESLint validation.

### 2026-06-04 08:14 - Cleanup validated
- Removed extension-specific lint warnings without changing checkout UI output:
  - Replaced unsafe component JSON parsing with `unknown` handling.
  - Removed unused bundle name fallback.
  - Replaced `||` currency fallback with `??`.
  - Removed the `any` cast in the Preact extension entrypoint.
- Validation completed:
  - `npm exec -- tsc --noEmit --skipLibCheck --project extensions/bundle-checkout-ui/tsconfig.json` passed.
  - `npx eslint --max-warnings 9999 extensions/bundle-checkout-ui/src/Checkout.tsx extensions/bundle-checkout-ui/src/index.tsx` passed with zero warnings/errors.
  - Shopify MCP component validation passed for `purchase.checkout.cart-line-item.render-after`.

## Related Documentation
- Shopify checkout UI extension documentation via Shopify Dev MCP.

## Phases Checklist
- [x] Inspect local extension configuration and source
- [x] Verify live placement and behavior in Chrome
- [x] Fix confirmed gaps or errors
- [x] Run focused validation
