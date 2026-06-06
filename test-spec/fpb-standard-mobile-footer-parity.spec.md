# Test Spec: FPB Standard Mobile Footer Parity
**Spec ID:** fpb-standard-mobile-footer-parity  **Issue:** [fpb-standard-mobile-footer-parity-1]  **Created:** 2026-06-05

## Purpose
Lock the Standard Design mobile footer to the live Easy Bundles reference for component ownership, layout, visual hierarchy, and selection-driven behavior.

## Test Cases
### StandardMobileFooter
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Component relationship | `footer_side` + `DEFAULT` preset on mobile | Widget renders the mobile summary tray as a distinct bottom-sheet/tray element rather than showing the desktop side panel | Confirms implementation model before styling |
| 2 | Empty selection state | No products selected | Footer matches EB empty-state layout, labels, badge/count handling, and disabled/enabled CTA behavior | Needs live EB evidence before final assertions |
| 3 | Selected product state | One or more products selected | Footer count, progress/discount content, CTA label, and price update without layout shift | Selection/removal behavior must be stable |
| 4 | Step navigation state | Advance from an intermediate step to final/add-on step | Footer action area matches EB button structure and text transitions | Includes back/next/add-to-cart behavior if EB exposes it |
| 5 | Mobile geometry | 390px mobile viewport | Footer width, x/y placement, padding, height, and internal row dimensions match live EB measurements | CSS contract test should use measured values |
| 6 | Empty badge interaction | Shopper taps footer count badge with zero selected products | Footer stays collapsed and does not render the expanded products section | Fresh EB audit showed zero-item badge click keeps bundle-items clipped rather than opening the 407.5625px selected-products state |

## Acceptance Criteria
- [x] Source tests prove the Standard mobile footer is a separate tray/bottom-sheet path when EB uses one.
- [x] Source tests cover the always-visible badge, discount text wrapper, progress block, and CTA geometry for the mobile footer.
- [x] Source tests cover EB's zero-item badge behavior: no expanded product-list section without selected products.
- [ ] Chrome mobile hard reload evidence shows WPB footer matches EB after deployment.
