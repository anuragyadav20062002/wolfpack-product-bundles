# Test Spec: Preview Button Loading
**Spec ID:** preview-button-loading  **Created:** 2026-06-25

## Purpose
Ensure every merchant-facing Preview Bundle button gives immediate in-button loading feedback while its preview action is running.

## Test Cases
### PreviewButtonLoading
| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Dashboard preview action is in flight for one bundle | Click bundle row preview | Only that preview button receives a loading prop | Prevents table-wide loading state. |
| 2 | FPB configure header preview is in flight | Click header Preview Bundle | Header `s-button` receives loading prop | Uses shared configure preview state. |
| 3 | FPB template dialog preview is in flight | Click dialog Preview bundle | Dialog `s-button` receives loading prop | The dialog should not close before feedback can render. |
| 4 | PPB configure header preview is in flight | Click header Preview Bundle | Header `s-button` receives loading prop | Uses PPB preview readiness state. |
| 5 | PPB template dialog preview is in flight | Click dialog Preview bundle | Dialog `s-button` receives loading prop | Covers template assignment preview path. |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Existing preview behavior still opens the same URL/modal paths
