# Test Spec: FPB Full Page Metafield Cache
**Spec ID:** fpb-full-page-metafield-cache  **Created:** 2026-07-02

## Purpose
Verify the full-page widget uses the page metafield bundle config as a compact runtime pointer before falling back to the app-proxy API for current bundle data.

## Test Cases
### FullPageMetafieldCache
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Legacy full cached bundle payload | `data-bundle-config` contains a full `full_page` bundle with stale preset fields | `loadBundleData()` fetches the current proxy bundle and uses that payload | Prevents stale Standard first paint when page HTML has not synced |
| 2 | Bootstrap cached bundle payload | `data-bundle-config` contains `{ v: 2, type: "full_page", id }` | `loadBundleData()` uses proxy hydration | Preserves proxy fallback path |
| 3 | Bootstrap marker includes visual route hint | `refreshFullPageBundlePageBody()` receives a Classic full-page bundle | Body marker keeps compact config and includes `FBP_SIDE_FOOTER` + `CLASSIC` | Lets the app embed stamp the initial shell before proxy hydration |

## Acceptance Criteria
- [ ] Legacy full payloads do not render directly for FPB first paint.
- [ ] Bootstrap payloads still use the proxy fallback.
- [ ] Bootstrap payloads include only lightweight template/preset hints, not full bundle data.
