# Test Spec: Dashboard Modal Deferral
**Spec ID:** dashboard-modal-deferral  **Created:** 2026-06-28

## Purpose
Keep Dashboard modal subtrees out of the initial render path until the merchant opens the relevant modal, preserving existing delete and preview flows.

## Test Cases
### DashboardModalState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Delete modal is closed on initial load | `bundleToDelete: null` | `false` | Prevents unused modal subtree from mounting. |
| 2 | Delete modal opens after a bundle is selected | `bundleToDelete: "gid://shopify/Product/1"` | `true` | Preserves delete flow. |
| 3 | Preview modal is closed on initial load | `isOpen: false` | `false` | Prevents unused modal subtree from mounting. |
| 4 | Preview modal opens when requested | `isOpen: true` | `true` | Preserves enable-preview flow. |

## Acceptance Criteria
- [ ] Delete modal renders only after a bundle is selected for deletion.
- [ ] Enable-preview modal renders only after the preview gate opens.
- [ ] Initial Dashboard render excludes closed modal subtrees.
