# Test Spec: PPB Widget Placement Validation

**Spec ID:** ppb-widget-placement-validation **Created:** 2026-07-22

## Purpose

Prevent Product Page Bundle previews from opening a storefront product whose effective theme template does not contain the Wolfpack Product Page app block.

## Test Cases

### ProductBundleWidgetPlacement

| #   | Scenario                                          | Input                                                                                  | Expected Output                                                               | Notes                                       |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Effective product template contains the PPB block | Product with default template and MAIN theme template containing `bundle-product-page` | Widget is installed and storefront URL is returned                            | Reads the live MAIN theme                   |
| 2   | Effective product template lacks the PPB block    | Product with default template and MAIN theme template without the block                | One-time setup is required and the correct Theme Editor deep link is returned | Matches `pdp-ayg` failure                   |
| 3   | Product uses a custom template suffix             | Product with `templateSuffix: custom`                                                  | Validator reads `templates/product.custom.json`                               | Must validate the product's actual template |
| 4   | Theme template cannot be read                     | Missing or malformed theme response                                                    | Validation fails closed and requires setup                                    | Never report a false ready state            |
| 5   | Another app uses the same block handle            | Effective template contains `bundle-product-page` owned by another app                 | Validation fails closed and requires setup                                    | Ownership must match the current app        |

### PpbPreviewPlacementGate

| #   | Scenario                         | Input                                                    | Expected Output                                       | Notes                                             |
| --- | -------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| 1   | Server confirms placement        | Successful validation response                           | Preview may continue                                  | Uses existing configure action                    |
| 2   | Server reports missing placement | `requiresOneTimeSetup` response                          | Preview is blocked and installation link is preserved | Theme Editor can be opened                        |
| 3   | Validation request fails         | Error or invalid response                                | Preview is blocked                                    | Fail closed                                       |
| 4   | Parent product is not ready      | Validator reports `widgetInstalled: false` without setup | Preview action returns an error                       | Do not open a storefront without a target product |

## Acceptance Criteria

- [x] The effective MAIN-theme product template is inspected before PPB preview.
- [x] Missing `bundle-product-page` placement is never reported as installed.
- [x] The setup URL targets `bundle-product-page` on the product's effective template.
- [x] A failed placement check blocks preview rather than opening a blank bundle product.
- [x] All listed test cases pass.
