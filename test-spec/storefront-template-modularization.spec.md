# Test Spec: Storefront Template Modularization
**Spec ID:** storefront-template-modularization  **Issue:** [storefront-template-modularization-1]  **Created:** 2026-06-04

## Purpose
Preserve storefront behavior while moving FPB template code and FPB/PPB template CSS into maintainable template modules.

## Test Cases
### StorefrontTemplateModuleContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB template installer modules exist | Full-page widget source and bundler source | Full-page widget imports `installStandardTemplate`, `installClassicTemplate`, `installCompactTemplate`, and `installHorizontalTemplate`; bundler inlines those files before the full-page widget entry | Mirrors PPB installer pattern |
| 2 | FPB template runtime methods move out of the main widget | Full-page widget source | Main widget installs template modules and no longer contains the large runtime style method bodies | Keeps `bundle-widget-full-page.js` focused |
| 3 | CSS minifier resolves modular source imports | Temporary CSS file with local `@import` | Minifier output includes imported CSS and excludes the raw import statement | Needed before splitting template CSS |
| 4 | FPB and PPB CSS entry files import template modules | CSS entry files | Full-page and product-page CSS entries include template module imports | Keeps deploy targets unchanged while source is modular |

## Acceptance Criteria
- [x] RED tests fail before implementation and pass after implementation
- [x] Raw widget JS syntax checks pass
- [x] Widget bundles rebuild successfully
- [x] CSS minification resolves imports and stays under Shopify size limits
