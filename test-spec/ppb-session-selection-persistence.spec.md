# Test Spec: PPB Session Selection Persistence

**Spec ID:** ppb-session-selection-persistence **Created:** 2026-07-13

## Purpose

Keep Product Page Bundle selections across a hard reload in the current
storefront tab, matching the EB offer-scoped session behavior for all four PPB
templates.

## Test Cases

### ProductPageSessionSelectionPersistence

| #   | Scenario                     | Input                                                       | Expected Output                                   | Notes                                           |
| --- | ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| 1   | Build storage key            | Bundle with `offerId`                                       | Stable offer-scoped key                           | Session storage is already origin-scoped        |
| 2   | Restore valid selections     | Versioned payload and current step count                    | Positive integer quantities are restored per step | Unknown extra steps are discarded               |
| 3   | Reject invalid payload       | Malformed JSON, wrong version, or invalid selection shape   | Initial configured selections remain unchanged    | No initialization failure                       |
| 4   | Preserve configured defaults | Existing default selection plus restored customer selection | Both selections remain                            | Session state cannot remove required defaults   |
| 5   | Persist a selection mutation | Widget is ready and quantity changes                        | Current selections are written to the offer key   | Shared by every PPB template                    |
| 6   | Preload restored steps       | Restored selections exist in selected steps                 | Only those step product datasets are loaded       | Filled cards and cart data resolve after reload |
| 7   | Build the storefront widget  | Product Page module manifest                                | Persistence module is inlined                     | Prevents runtime `ReferenceError`               |

## Acceptance Criteria

- [ ] Product List, Product Grid, Horizontal Slots, and Vertical Slots use the same persistence path.
- [ ] State is isolated by PPB offer within the current storefront tab.
- [ ] Configured default products remain compulsory after restoration.
- [ ] Malformed or stale storage cannot prevent widget initialization.
- [ ] All listed test cases pass.
