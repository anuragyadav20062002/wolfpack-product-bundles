# Test Spec: FPB Classic Product Loading Spinner
**Spec ID:** fpb-classic-product-loading-spinner  **Created:** 2026-07-06

## Purpose
Ensure Classic storefront product loading uses the spinner overlay until product data is populated instead of rendering product-card skeletons on desktop.

## Test Cases
### ProductGridLoadingState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic product grid enters pending state with no custom GIF | `getFullPageDesignPreset() === "CLASSIC"` and no `loadingGif` | Product-grid container receives no skeleton markup, and `showLoadingOverlay(null)` is called | Covers desktop Classic loading parity |
| 2 | Standard product grid enters pending state with no custom GIF | `getFullPageDesignPreset() === "STANDARD"` and no `loadingGif` | Existing skeleton markup remains, and no overlay is forced | Prevents accidental shared behavior change |
| 3 | Non-Classic product grid enters pending state with custom GIF | Standard preset with `loadingGif` | Existing skeleton markup remains, and `showLoadingOverlay(gifUrl)` is called | Preserves merchant GIF behavior |

## Acceptance Criteria
- [ ] Classic pending product data state shows spinner-only loading, not product-card skeletons.
- [ ] Non-Classic pending product data behavior is unchanged unless a custom GIF is configured.
