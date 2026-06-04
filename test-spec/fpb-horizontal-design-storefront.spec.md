# Test Spec: FPB Horizontal Design Storefront
**Spec ID:** fpb-horizontal-design-storefront  **Issue:** [fpb-horizontal-design-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Lock the storefront source contract for the FPB Horizontal Design template against the measured live EB desktop, wide, and mobile layout.

## Test Cases
### FullPageTemplateLayoutContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Horizontal preset root and two-column shell | `bundleDesignPresetId: HORIZONTAL` | Root caps at 1536px, wrapper caps at 1455px, body uses `0.65fr 0.35fr` with 15px gap | Matches live EB desktop and wide measurements |
| 2 | Horizontal product cards on desktop | Horizontal product grid | Grid has two responsive columns; cards are 156px high with responsive 28.1% image column and 35px icon CTA | Matches measured EB card geometry |
| 3 | Horizontal product cards on mobile | 390px viewport | Grid becomes one column; cards are 136px high, image is 103.8px by 120px, CTA remains 35px | Matches measured EB mobile geometry |
| 4 | Horizontal side-panel slots | Selected products in side panel | Slot thumbnails remain 70px square with overlay remove buttons | Preserves existing selected-slot behavior |

## Acceptance Criteria
- [x] Source-contract test fails before implementation and passes after implementation
- [x] Widget JS syntax check passes
- [x] Widget assets rebuild successfully
- [x] CSS minification stays within Shopify app-block asset limits
