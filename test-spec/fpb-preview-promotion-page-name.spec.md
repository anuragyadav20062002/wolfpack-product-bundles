# Test Spec: FPB Preview Promotion Page Name
**Spec ID:** fpb-preview-promotion-page-name  **Created:** 2026-07-07

## Purpose
Ensure a full-page bundle preview page does not keep preview-only title or handle after the merchant adds it to storefront.

## Test Cases
### PreviewPromotion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Promote existing preview page with merchant slug | Preview handle `preview-my-kit`, desired slug `Custom Slug` | Published page uses title `My Kit` and handle `custom-slug` | Prevents storefront URL/title pollution |
| 2 | Promote existing preview page without merchant slug | Preview handle `preview-my-kit`, bundle name `My Kit` | Published page uses title `My Kit` and handle `my-kit` | Default final URL follows bundle name |
| 3 | Promotion route persists clean handle | Service returns `custom-slug` | Bundle stores and returns `custom-slug` | Keeps DB, redirect metadata, response aligned |

## Acceptance Criteria
- [x] All listed test cases pass.
- [x] Preview-only labels remain limited to preview flow and do not become final storefront page metadata.
