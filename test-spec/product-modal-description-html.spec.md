# Test Spec: Product Modal Description HTML
**Spec ID:** product-modal-description-html  **Created:** 2026-07-07

## Purpose
Render Shopify product descriptions in the product modal using the HTML Shopify serves through Storefront API `descriptionHtml`, while preserving plain-text fallback descriptions.

## Test Cases
### StorefrontProductPayloads
| # | Scenario | Input | Expected Output | Notes |
| 1 | Direct product fetch includes rich description | Storefront API product node has `descriptionHtml` | `/api/storefront-products` response includes `descriptionHtml` | Shopify docs define `descriptionHtml` as HTML-bearing field |
| 2 | Collection product fetch includes rich description | Collection product node has `descriptionHtml` | `/api/storefront-collections` response includes `descriptionHtml` | Required for category/collection bundles |

### WidgetNormalization
| # | Scenario | Input | Expected Output | Notes |
| 1 | FPB product has `descriptionHtml` | Product processor normalizes product | `descriptionHtml` remains HTML and `description` remains text fallback | Modal can render HTML |
| 2 | PPB product has `descriptionHtml` | Product processor normalizes product | `descriptionHtml` remains HTML | Shared modal can render HTML |
| 3 | Missing description enrichment fetches HTML | Storefront API enrichment returns `descriptionHtml` | Cached product receives `descriptionHtml` | Fixes stale/incomplete metafield cache |

### ProductModal
| # | Scenario | Input | Expected Output | Notes |
| 1 | Modal product has `descriptionHtml` | `<p>Copy <strong>bold</strong></p>` | Modal description renders HTML nodes | Do not use `textContent` for Shopify HTML |
| 2 | Modal product has only plain `description` | `Plain copy` | Modal description renders plain text safely | Existing fallback remains |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Storefront API GraphQL query validates against Shopify Storefront schema
- [x] Widget bundles are rebuilt after JS changes
