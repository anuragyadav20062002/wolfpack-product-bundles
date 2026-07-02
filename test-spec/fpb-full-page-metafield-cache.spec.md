# Test Spec: FPB Full Page Metafield Cache
**Spec ID:** fpb-full-page-metafield-cache  **Created:** 2026-07-02

## Purpose
Verify the full-page widget uses the page metafield bundle config as the first runtime source before falling back to the app-proxy API.

## Test Cases
### FullPageMetafieldCache
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full cached bundle payload | `data-bundle-config` contains a full `full_page` bundle with steps | `loadBundleData()` sets `bundleData` and does not call `fetch` | Protects metafield-first runtime boundary |
| 2 | Bootstrap cached bundle payload | `data-bundle-config` contains `{ v: 2, type: "full_page", id }` | `loadBundleData()` uses proxy hydration | Preserves proxy fallback path |

## Acceptance Criteria
- [ ] Full payloads render from metafield cache without network fallback.
- [ ] Bootstrap payloads still use the proxy fallback.
