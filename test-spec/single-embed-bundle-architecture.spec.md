# Test Spec: Single Embed Bundle Architecture

**Spec ID:** single-embed-bundle-architecture
**Issue:** [single-embed-bundle-architecture-1]
**Created:** 2026-05-22

## Purpose

Validate that the new single-embed architecture verifies Shopify app-proxy requests, serves full-page bundle storefront HTML through `/wpb/:bundleId`, and checks the single app embed handle.

## Test Cases

| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Valid app proxy HMAC | URL with sorted params and signature | verified shop domain | Covers shared proxy verifier |
| 2 | Invalid app proxy HMAC | URL with bad signature | null | Prevents forged storefront access |
| 3 | Missing app proxy params | URL without shop/signature | null | Prevents unsafe direct access |
| 4 | Single app embed check | settings_data block `bundle-app-embed` | enabled true | Confirms new status handle |
| 5 | FPB proxy route success | valid request and bundle | HTML widget shell | Unit mocked DB route |
| 6 | FPB proxy route invalid signature | bad request | 400 response | No data exposure |
| 7 | Explicit draft FPB selection | `full_page` bundle with `status=draft` and matching `bundleId` | selected bundle | Supports configure/public preview shell after proxy acceptance |
| 8 | Generic draft FPB rejection | `full_page` bundle with `status=draft` and no matching `bundleId` | null | Prevents generic storefront auto-selection of drafts |

## Acceptance Criteria

- [ ] Unit tests pass.
- [ ] Targeted ESLint has zero errors.
- [ ] Widget build/minification completes.
