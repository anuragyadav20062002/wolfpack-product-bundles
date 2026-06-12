# Test Spec: FPB Slot Icon Parity
**Spec ID:** fpb-slot-icon-parity  **Created:** 2026-06-12

## Purpose
Ensure FPB empty slots render the merchant-uploaded Slot Icon wherever product slots appear, with plus/skeleton fallbacks only when no Slot Icon is configured.

## Test Cases
### SharedSelectedSlots
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Shared empty slot with icon | Empty slot with `iconUrl` | Renders an empty-slot image and not the placeholder span | Covers Classic shared sidebar slots |

### StandardSidebarEmptySlots
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard empty slots with icon | `selectedBundle.productSlotIconUrl` set | Empty slot thumbnail contains the configured image | Covers Standard summary/sidebar empty slots |

## Acceptance Criteria
- [ ] All listed test cases pass
