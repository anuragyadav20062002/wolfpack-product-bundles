# Product Owner Requirements: Sync Bundle — Stale Block Cleanup

## User Stories with Acceptance Criteria

### Story 1: FPB Sync Bundle clears stale template assignment

**As a** merchant who installed the app before the embed migration
**I want** Sync Bundle to recreate my bundle page without a custom template suffix
**So that** the page uses the default `page.json` template where the app embed renders cleanly

**Acceptance Criteria:**
- [ ] Given a full-page bundle with an existing Shopify page that has `templateSuffix: 'full-page-bundle'`, when the merchant clicks "Sync Bundle", then the recreated page MUST have no `templateSuffix` (null/empty)
- [ ] Given a full-page bundle with an existing Shopify page that has no `templateSuffix`, when the merchant clicks "Sync Bundle", then the recreated page still has no `templateSuffix` (idempotent)
- [ ] Given a full-page bundle whose page was just recreated without a template suffix, when the storefront page is visited, then the bundle widget renders correctly via the app embed block
- [ ] Given a full-page bundle whose page was recreated, the page URL (`/pages/{handle}`) remains unchanged
- [ ] Given a full-page bundle whose page was recreated, all metafields (`bundle_id`, `bundle_config`) are correctly written to the new page

### Story 2: FPB "Place Widget Now" creates clean pages

**As a** merchant creating a new full-page bundle
**I want** the created page to use the default template
**So that** no stale block issues can arise in the future

**Acceptance Criteria:**
- [ ] Given a new full-page bundle, when the merchant clicks "Place Widget Now", then the created Shopify page has no `templateSuffix` set
- [ ] Given the created page uses the default template, the app embed renders the bundle widget correctly

### Story 3: PDP Sync Bundle clears stale template assignment

**As a** merchant with a product-page bundle
**I want** Sync Bundle to recreate my bundle product without a custom template suffix
**So that** the product uses the default `product.json` template where the app embed renders cleanly

**Acceptance Criteria:**
- [ ] Given a product-page bundle with an existing Shopify product that has `templateSuffix: 'product-page-bundle'`, when the merchant clicks "Sync Bundle", then the recreated product MUST have no `templateSuffix` (null/empty)
- [ ] Given a product-page bundle with an existing Shopify product that has no `templateSuffix`, when the merchant clicks "Sync Bundle", then the recreated product still has no `templateSuffix` (idempotent)
- [ ] Given a product-page bundle whose product was just recreated without a template suffix, when the product page is visited, then the bundle widget renders correctly via the app embed block
- [ ] Given a product-page bundle whose product was recreated, all metafields (component references, pricing, UI config) are correctly written to the new product

### Story 4: PDP product creation uses default template

**As a** merchant creating a new product-page bundle
**I want** the created product to use the default template
**So that** no stale block issues can arise in the future

**Acceptance Criteria:**
- [ ] Given a new product-page bundle, when the product is created (on save or sync), then the Shopify product has no `templateSuffix` set
- [ ] Given a product-page bundle product update (status change, etc.), the `templateSuffix` is NOT set in the mutation variables

## UI/UX Specifications

No UI changes required. This is a backend-only change to the Shopify API mutations used during Sync Bundle and page/product creation. The merchant experience is unchanged — they click "Sync Bundle" and the bundle works.

## Data Persistence

- **Shopify Page (FPB):** `templateSuffix` field set to `null`/empty instead of `'full-page-bundle'`
- **Shopify Product (PDP):** `templateSuffix` field set to `null`/empty instead of `'product-page-bundle'`
- **Database:** No schema changes. Existing `shopifyPageId`, `shopifyPageHandle`, `shopifyProductId` fields remain unchanged.
- **Metafields:** No changes — same metafields written in the same way.

## Backward Compatibility Requirements

- Existing bundle data in the database is unaffected
- Existing metafields are rewritten during sync (already the case)
- Page/product URLs are preserved (same handle reused)
- Stores that DON'T click Sync Bundle continue working as-is (no forced migration)
- The old custom template files (`page.full-page-bundle.json`, `product.product-page-bundle.json`) remain in themes — they just become unused. Shopify does not auto-delete template files.

## Out of Scope (explicit)

- Automatic migration of all existing stores (merchants must click "Sync Bundle" themselves)
- Cleaning or deleting the old template JSON files from themes
- Any UI changes or new banners prompting merchants to sync
- Theme API / Asset API calls
- Modifying the app embed block's Liquid template
- Changing how metafields are written
