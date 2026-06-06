# Test Spec: FPB Pending Preview Standard Template
**Spec ID:** fpb-pending-preview-standard-template  **Issue:** [fpb-pending-preview-standard-template-1]  **Created:** 2026-06-05

## Purpose
Ensure FPB preview pages generated while Bundle Visibility is Pending render the current Standard Design instead of falling back to an old floating-bar layout.

## Test Cases
### PreviewConfig
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full-page bundle has no saved template fields | `bundleType=full_page`, `bundleDesignTemplate=null`, `bundleDesignPresetId=null` | Formatter emits `FBP_SIDE_FOOTER` and `DEFAULT` | Keeps `data-bundle-config` accepted by widget cache path |
| 2 | Preview page body uses default full-page bundle | `refreshFullPageBundlePageBody()` receives bundle with null template fields | Body `data-bundle-config` contains explicit Standard Design fields | Prevents stale proxy/fallback preview rendering |
| 3 | Configure-page Preview clicked while FPB visibility is Pending | `shopifyPageHandle=null`, app embed/visibility gate would otherwise block | Preview submits `createPreviewPage` directly | Pending remains a visibility/setup state, not a merchant-preview blocker |
| 4 | Dashboard Preview clicked for FPB while visibility is Pending | FPB row has no Shopify Page yet | Dashboard submits `createPreviewPage` directly | Shopper discovery still depends on publishing/linking separately |

## Acceptance Criteria
- [x] Pending FPB preview cached config includes explicit Standard Design template fields.
- [x] Product-page template mapping remains unchanged.
- [x] Existing explicit FPB presets still pass through unchanged.
- [x] Pending Bundle Visibility does not block merchant preview page creation/opening.
- [x] The Pending visibility modal still auto-shows as a setup nudge on edit pages.
