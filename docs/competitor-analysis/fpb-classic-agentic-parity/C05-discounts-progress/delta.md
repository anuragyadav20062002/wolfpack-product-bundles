# C05 Discounts Progress Delta

Date: 2026-07-04

## Current Status

Status: `fixed-amount-bqo-display-toggles-and-fixed-price-summary-matched`

EB Classic fixed-amount quantity evidence has Bundle Quantity Options enabled with `Box of 2` / `₹5 off`, while Progress Bar and Discount Messaging are disabled. WPB now matches that display contract for the fixed-amount box-selector fixture: the Box selector stays visible, and discount message/progress surfaces stay hidden on desktop and mobile.

EB Classic fixed-bundle-price evidence keeps the same visible Bundle Quantity Options text and shows the raw selected-products total in the summary after the threshold is met. It does not render the fixed bundle price as a separate final summary total. WPB now matches that Classic display contract on desktop and compact mobile while preserving the underlying pricing/cart calculation path.

## Source Fix

- `updateMessagesFromBundle()` now preserves `pricing.messages.showDiscountMessaging: false` instead of turning messaging back on whenever pricing is enabled.
- Desktop sidebar rendering now gates discount message creation on `config.showDiscountMessaging`.
- Compact mobile summary rendering no longer forces progress when `config.showDiscountProgressBar` is false.
- FPB save/runtime config serialization now canonicalizes nested `displayOptions.progressBar.enabled` from the top-level Progress Bar checkbox, preventing stale nested progress settings from reappearing on storefront.
- Classic fixed-bundle-price summary rendering now reuses the shared sidebar/mobile summary structure but displays the raw selected-products total instead of adding an original-price plus fixed-final-price pair.
- `scripts/build-widget-bundles.js` now includes the new full-page summary display helper before the method modules that call it, preventing missing-helper runtime errors in the concatenated widget bundle.

## Evidence

- EB Admin: `eb-admin-c05-before-progress-config-20260704.txt`
- EB desktop/mobile runtime: `eb-c05-post-c04-desktop-runtime-20260704.json`, `eb-c05-post-c04-mobile-expanded-runtime-20260704.json`
- EB fixed-price Admin save: `eb-c05-fixed-price-discount-update-20260704.network-request`, `eb-c05-fixed-price-discount-update-20260704.network-response`
- EB fixed-price selected state: `eb-c05-fixed-price-desktop-after-two-20260704.png`, `eb-c05-fixed-price-desktop-after-two-runtime-20260704.json`, `eb-c05-fixed-price-mobile-after-two-collapsed-20260704.png`, `eb-c05-fixed-price-mobile-after-two-runtime-20260704.json`
- WPB Admin re-save: `wpb-admin-c05-post-fix-resave-20260704.request.network-request`, `wpb-admin-c05-post-fix-resave-20260704.response.network-response`
- WPB desktop proof: `wpb-c05-post-save-desktop-20260704.png`, `wpb-c05-post-save-desktop-a11y-20260704.txt`, `wpb-c05-post-save-desktop-runtime-20260704.json`
- WPB mobile collapsed proof: `wpb-c05-post-save-mobile-collapsed-20260704.png`, `wpb-c05-post-save-mobile-collapsed-a11y-20260704.txt`, `wpb-c05-post-save-mobile-collapsed-runtime-20260704.json`
- WPB mobile expanded proof: `wpb-c05-post-save-mobile-expanded-20260704.png`, `wpb-c05-post-save-mobile-expanded-a11y-20260704.txt`, `wpb-c05-post-save-mobile-expanded-runtime-20260704.json`
- WPB fixed-price before fix: `wpb-c05-fixed-price-desktop-after-two-20260704.png`, `wpb-c05-fixed-price-desktop-after-two-runtime-20260704.json`
- WPB fixed-price after fix: `wpb-c05-fixed-price-desktop-after-fix-5034-20260704.png`, `wpb-c05-fixed-price-desktop-after-fix-a11y-5034-20260704.txt`, `wpb-c05-fixed-price-desktop-after-fix-runtime-5034-20260704.json`, `wpb-c05-fixed-price-mobile-after-fix-5034-20260704.png`, `wpb-c05-fixed-price-mobile-after-fix-a11y-5034-20260704.txt`, `wpb-c05-fixed-price-mobile-after-fix-runtime-5034-20260704.json`

## Verified

- WPB storefront serves `window.__BUNDLE_WIDGET_VERSION__ === "5.0.33"`.
- WPB root preset is `CLASSIC`.
- Desktop visible summary discount nodes are empty while `fpb-box-selection-wrapper` remains visible at `405 x 62`.
- Mobile collapsed tray has no discount-progress copy.
- Mobile expanded tray visible summary discount nodes are empty while `fpb-box-selection-wrapper fpb-mobile-summary-box-selection` remains visible at `360 x 54`.
- WPB fixed-price proof serves `window.__BUNDLE_WIDGET_VERSION__ === "5.0.34"`.
- WPB Classic fixed-price desktop summary shows `2 items`, `Total`, `$1448.00`, and no `$5.00` final-price line.
- WPB Classic fixed-price compact mobile footer shows `Add To Cart • $1448.00` and no `$5.00` fixed-final-price text.

## Remaining Gaps

- Buy-X-get-Y.
- Multiple/highest-eligible discount conflicts.
- EB progress-bar-on storefront behavior.
- Cart-line savings proof for fixed-amount and fixed-price rules.
