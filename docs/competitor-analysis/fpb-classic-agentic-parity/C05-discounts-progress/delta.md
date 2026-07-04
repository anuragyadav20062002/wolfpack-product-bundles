# C05 Discounts Progress Delta

Date: 2026-07-04

## Current Status

Status: `fixed-amount-bqo-display-toggles-matched`

EB Classic fixed-amount quantity evidence has Bundle Quantity Options enabled with `Box of 2` / `₹5 off`, while Progress Bar and Discount Messaging are disabled. WPB now matches that display contract for the fixed-amount box-selector fixture: the Box selector stays visible, and discount message/progress surfaces stay hidden on desktop and mobile.

## Source Fix

- `updateMessagesFromBundle()` now preserves `pricing.messages.showDiscountMessaging: false` instead of turning messaging back on whenever pricing is enabled.
- Desktop sidebar rendering now gates discount message creation on `config.showDiscountMessaging`.
- Compact mobile summary rendering no longer forces progress when `config.showDiscountProgressBar` is false.
- FPB save/runtime config serialization now canonicalizes nested `displayOptions.progressBar.enabled` from the top-level Progress Bar checkbox, preventing stale nested progress settings from reappearing on storefront.

## Evidence

- EB Admin: `eb-admin-c05-before-progress-config-20260704.txt`
- EB desktop/mobile runtime: `eb-c05-post-c04-desktop-runtime-20260704.json`, `eb-c05-post-c04-mobile-expanded-runtime-20260704.json`
- WPB Admin re-save: `wpb-admin-c05-post-fix-resave-20260704.request.network-request`, `wpb-admin-c05-post-fix-resave-20260704.response.network-response`
- WPB desktop proof: `wpb-c05-post-save-desktop-20260704.png`, `wpb-c05-post-save-desktop-a11y-20260704.txt`, `wpb-c05-post-save-desktop-runtime-20260704.json`
- WPB mobile collapsed proof: `wpb-c05-post-save-mobile-collapsed-20260704.png`, `wpb-c05-post-save-mobile-collapsed-a11y-20260704.txt`, `wpb-c05-post-save-mobile-collapsed-runtime-20260704.json`
- WPB mobile expanded proof: `wpb-c05-post-save-mobile-expanded-20260704.png`, `wpb-c05-post-save-mobile-expanded-a11y-20260704.txt`, `wpb-c05-post-save-mobile-expanded-runtime-20260704.json`

## Verified

- WPB storefront serves `window.__BUNDLE_WIDGET_VERSION__ === "5.0.33"`.
- WPB root preset is `CLASSIC`.
- Desktop visible summary discount nodes are empty while `fpb-box-selection-wrapper` remains visible at `405 x 62`.
- Mobile collapsed tray has no discount-progress copy.
- Mobile expanded tray visible summary discount nodes are empty while `fpb-box-selection-wrapper fpb-mobile-summary-box-selection` remains visible at `360 x 54`.

## Remaining Gaps

- Fixed-price tiers.
- Buy-X-get-Y.
- Multiple/highest-eligible discount conflicts.
- EB progress-bar-on storefront behavior.
- Cart-line savings proof for the fixed-amount box rule.
