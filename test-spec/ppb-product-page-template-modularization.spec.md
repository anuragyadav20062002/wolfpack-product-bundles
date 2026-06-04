# Test Spec: PPB Product Page Template Modularization
**Spec ID:** ppb-product-page-template-modularization  **Issue:** [ppb-product-page-template-modularization-1]  **Created:** 2026-06-04

## Purpose
Verify product-page bundle template code can be split into focused source modules and bundled before the main widget initializes.

## Test Cases
### ProductPageTemplateModuleBuild
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page build includes template modules | `scripts/build-widget-bundles.js` | Defines product-page module paths and places processed modules before the main widget source | Prevents initialization before module installers exist |
| 2 | CASCADE template code is externalized | `app/assets/widgets/product-page/templates/cascade-template.js` and `app/assets/bundle-widget-product-page.js` | CASCADE helper/footer methods live in the module, not inline in the god file | Establishes template-per-file pattern |
| 3 | Main widget installs CASCADE module | `app/assets/bundle-widget-product-page.js` | Imports and installs `installCascadeTemplate(BundleWidgetProductPage)` before initialization | Keeps raw source and bundle path aligned |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw product-page widget and new template module pass syntax checks.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
