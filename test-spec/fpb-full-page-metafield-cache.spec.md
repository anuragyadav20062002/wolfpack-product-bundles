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

## Acceptance Criteria
- [ ] Legacy full payloads do not render directly for FPB first paint.
- [ ] Bootstrap payloads still use the proxy fallback.
