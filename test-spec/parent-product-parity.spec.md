# Test Spec: Parent Product Parity
**Spec ID:** parent-product-parity  **Created:** 2026-07-14

## Purpose
Unify Full Page Bundle and Product Page Bundle parent products around one neutral Shopify product contract while preserving FPB's Shopify Page host and both bundle types' existing runtime/metafield behavior.

## Test Cases

### BundleParentProductService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Create FPB or PPB parent | Same bundle identity passed from either route | Identical `ProductCreateInput` | Bundle type does not alter the parent contract |
| 2 | Create parent | Missing `shopifyProductId` | Product is `UNLISTED` with neutral Wolfpack metadata and placeholder image | Creation-only merchant-facing metadata |
| 3 | Configure default variant | Created or existing parent | Price `0.00`, `CONTINUE`, non-taxable, and `requiresComponents: true` | Parent catalog price is not bundle total |
| 4 | Persist actual handle | Shopify returns a normalized handle | Returned handle is saved with product ID | Never persist only the requested handle |
| 5 | Preserve merchant metadata | Existing parent has merchant-edited title, description, handle, and media | No `productUpdate` mutation is issued | Only the live handle is refreshed locally |
| 6 | Recreate deleted parent | Stored product query returns `null` | One replacement product is created in the same operation | No separate failure/retry cycle |
| 7 | Retry post-create failure | Product was created and persisted, then publication or variant setup failed | Next call queries and reuses the persisted product | No duplicate product creation |
| 8 | Publish parent | Product exists or was created | Product is published to Online Store | Incompatible sales channels are excluded |
| 9 | Surface Shopify errors | Create, variant, or publication mutation returns user errors | Error identifies the failed operation and Shopify message | Successfully created product remains persisted |

### BundleStatusSeparation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Change bundle availability | Any valid Wolfpack bundle status | Only the bundle database record changes | Shopify product status is merchant-owned |
| 2 | Explain discoverability | Generated unlisted description | Copy directs status changes through Shopify Admin | Edit Product is the control path |

### RouteIntegration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sync Product for FPB or PPB | Missing, deleted, or existing parent | Shared ensure service runs before metafield writes | Compact response shape remains unchanged |
| 2 | Sync Bundle for FPB or PPB | Existing bundle | Shared ensure service runs without deleting the parent product | FPB may still recreate its Shopify Page |
| 3 | FPB host | Synced FPB with page handle | Preview/storefront remains `/pages/{handle}` | Shopify Page lifecycle is unchanged |
| 4 | PPB host | Synced PPB with product handle | Preview/storefront remains `/products/{handle}` | Product host is unchanged |
| 5 | Runtime config | Either bundle type | Parent variant ID is written to the existing metafield/runtime contract | MERGE/EXPAND behavior is preserved |

### CartTransformRegression
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | MERGE or EXPAND pricing | Parent variant catalog price is `0.00` | Totals still derive from components and discount configuration | Existing line properties remain unchanged |

## Acceptance Criteria
- [x] Shared service tests pass.
- [x] FPB and PPB focused sync tests pass.
- [x] Status, publication, metafield, preview URL, and Cart Transform tests pass.
- [x] Scoped ESLint reports zero errors.
- [x] Graphify is rebuilt after code changes.
- [ ] SIT Chrome DevTools MCP evidence is recorded without committing screenshots.
