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
| 6 | FPB Preview validates app embed before opening preview | Click Preview Bundle while app embed is believed enabled | The same loading state remains active across validation and preview/open work | Prevents spinner blink between app-embed validation and page opening. |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Existing preview behavior still opens the same URL/modal paths
