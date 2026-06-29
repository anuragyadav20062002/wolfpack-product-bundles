# Test Spec: Dashboard Edit Button Loading Spinner
**Spec ID:** dashboard-edit-button-loading  **Created:** 2026-06-27

## Purpose
Provide immediate in-button feedback on dashboard edit actions so merchants see loading state while navigating to the bundle configure page.

## Test Cases
### Dashboard Route / Row Actions
| # | Scenario | Input | Expected Output | Notes |
| - | - | - | - | - |
| 1 | Edit button clicked for a row | User clicks a row’s edit action | The row edit button enters loading/disabled state while navigation is in flight and resets once dashboard navigation settles | Ensure spinner is row-scoped, not global |

### Component Contract
| # | Scenario | Input | Expected Output | Notes |
| - | - | - | - | - |
| 2 | Action prop wiring | Edit row component receives `isEditing` | The edit `s-button` renders with `loading` and `disabled` set from `isEditing` | Keep text/icon semantics unchanged |

## Acceptance Criteria
- [ ] Edit state is driven per-row in `DashboardPage`
- [ ] `BundleActionsButtons` accepts and applies `isEditing` to the edit button
- [ ] Added unit test asserts the loading prop wiring from route source
