# Test Spec: FPB Bundle UI Config Size
**Spec ID:** fpb-bundle-ui-config-size  **Issue:** [fpb-bundle-ui-config-size-1]  **Created:** 2026-06-05

## Purpose
Prevent category-backed FPB runtime payloads from exceeding Shopify's 64KB metafield limit when products contain many variants or rich admin/cache fields.

## Test Cases
### CategoryRuntimePayload
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Rich category product with many variants | Product containing variants with admin/cache-only fields | Runtime category product keeps storefront fields only | Ensures `bundle_ui_config` remains compact |
| 2 | Category product stub enriched from step product source | Category product ID plus rich source product | Runtime category product keeps source title/image/price and compact variants | Preserves existing category hydration |

## Acceptance Criteria
- [x] Category products retain IDs, title, image, price, options, and variant fields needed by storefront widgets.
- [x] Admin/cache-only product and variant fields are stripped before runtime/metafield serialization.
- [x] Existing formatter and save-bundle contracts remain valid.
