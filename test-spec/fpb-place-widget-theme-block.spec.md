# Test Spec: FPB Place Widget Theme Block
**Spec ID:** fpb-place-widget-theme-block  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-02

## Purpose
Confirm FPB storefront placement follows the EB-grounded Shopify theme app block flow.

## Test Cases
### FPBPlaceWidgetThemeBlock
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Merchant selects a Shopify page in Place Widget | Page handle `my-kit` | Theme Editor URL uses `template=page`, `addAppBlockId={apiKey}/bundle-full-page`, and `previewPath=/pages/my-kit` | App block placement, not no-op install |
| 2 | FPB page is created or previewed | Bundle ID + page handle | Result returns `widgetInstallationRequired` and a page app-block Theme Editor link | Keeps assets on Shopify `asset_url` |

## Acceptance Criteria
- [ ] FPB Place Widget does not call `/api/install-fpb-widget`.
- [ ] FPB Place Widget opens Theme Editor for `bundle-full-page`.
- [ ] FPB creation/preview responses return the page app-block placement link.
