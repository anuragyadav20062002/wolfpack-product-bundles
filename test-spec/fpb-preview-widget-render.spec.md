# Test Spec: FPB Preview Widget Render
**Spec ID:** fpb-preview-widget-render  **Issue:** [fpb-preview-widget-render-1]  **Created:** 2026-06-05

## Purpose
Prevent full-page bundle preview pages from rendering only the Shopify theme shell by ensuring page-body marker hydration is clean, current, and initialized.

## Test Cases
### PreviewPageBody
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Create preview page | Bundle with steps/pricing | Page body is refreshed with bundle config after page creation | Prevents ID-only marker on first preview |
| 2 | Existing preview page | Stored preview page ID | Page body refresh receives the full bundle object | Keeps marker config current after edits |
| 3 | Marker HTML | Refresh page body with bundle | Single hidden marker, escaped config, no app-proxy asset URLs | Avoids malformed body HTML |
| 4 | Embed hydration | Marker inserted after script asset exists | Embed calls global full-page initializer | Prevents hydrated container staying uninitialized |

## Acceptance Criteria
- [ ] New preview pages refresh page body with the resolved bundle config before returning URL.
- [ ] Existing preview pages refresh page body with the resolved bundle config before returning URL.
- [ ] Page marker HTML is not duplicated or malformed.
- [ ] Body app embed can initialize a hydrated container when the widget script is already loaded.
