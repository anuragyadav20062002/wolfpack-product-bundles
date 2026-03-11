# Ad-Ready Bundle Infrastructure -- Feature Specification

**Status:** Approved -- Ready for Implementation
**Created:** 2026-03-09
**Last Updated:** 2026-03-09
**Author:** Aditya Awasthi
**Document Type:** Definitive feature specification (canonical reference for all implementation sessions)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Design Decisions](#2-core-design-decisions)
3. [Phase 1: Feed-Ready Product Enhancement](#3-phase-1-feed-ready-product-enhancement)
4. [Phase 2: Multi-Channel Publication + Campaign Bundles](#4-phase-2-multi-channel-publication--campaign-bundles)
5. [Phase 3: UTM Attribution](#5-phase-3-utm-attribution)
6. [Breaking Changes and Migration](#6-breaking-changes-and-migration)
7. [Data Model Changes](#7-data-model-changes)
8. [Existing Code Inventory](#8-existing-code-inventory)
9. [API Reference](#9-api-reference)
10. [Implementation Sequence](#10-implementation-sequence)
11. [Out of Scope](#11-out-of-scope)
12. [Success Criteria](#12-success-criteria)

---

## 1. Overview

Wolfpack creates **real Shopify products** for bundles. This is the key architectural advantage over competing bundle apps that create virtual bundles. Because Wolfpack bundles are real products, they can appear in catalog feeds, shopping ads, and retargeting campaigns -- but only if they meet ad platform eligibility requirements (non-zero price, managed inventory, "in_stock" availability).

This feature fills three gaps that currently prevent Wolfpack bundles from appearing in advertising channels:

1. **Bundle products have $0 price and unmanaged inventory** -- ad platforms reject them.
2. **Bundles are only published to Online Store** -- not to Google, Meta, or TikTok channels.
3. **No UTM attribution** -- merchants cannot see which ad campaigns drive bundle sales.

### How It Works (Architecture Principle)

Wolfpack does NOT integrate directly with ad platforms. It leverages Shopify's existing sales channel ecosystem:

```
Merchant creates bundle in Wolfpack
    |
Wolfpack creates bundle product in Shopify (with correct price + inventory)
    |
Bundle published to sales channels (Online Store, Google, Meta, TikTok)
    |
Shopify channel apps sync product data to ad platforms automatically
    |
Customer clicks ad --> bundle product page --> checkout
    |
Wolfpack records UTM attribution
```

This keeps the system simpler, compliant, and future-proof. Wolfpack never calls Google Ads API, Meta Marketing API, or TikTok Ads API.

### Target Advertising Channels

| Channel | Shopify App | Feed Sync |
|---------|------------|-----------|
| Google Shopping / Google Ads | Google & YouTube | Automatic via Shopify channel |
| Meta (Facebook / Instagram) | Facebook & Instagram | Automatic via Shopify channel |
| TikTok Shop / TikTok Ads | TikTok | Automatic via Shopify channel |

---

## 2. Core Design Decisions

These decisions are final and must not be revisited during implementation.

### Decision 1: No Direct Ad Platform Integration

Wolfpack relies on Shopify's sales channel apps (Google & YouTube, Facebook & Instagram, TikTok) which handle catalog sync automatically. Wolfpack's responsibility ends at making the bundle product eligible for channel publication.

### Decision 2: No Per-Channel Toggles in Wolfpack

Publishing to channels happens via Shopify's native admin UI. Wolfpack only ensures the bundle product meets feed requirements (proper price, inventory, images). The merchant controls which channels receive the product through Shopify's standard product publishing interface.

### Decision 3: No Ad Campaign Management

Merchants use Google Ads, Meta Ads Manager, and TikTok Ads Manager for campaign management. Wolfpack's role is making bundles ad-eligible and tracking which campaigns drive bundle sales via UTM attribution.

### Decision 4: Web Pixel for UTM Attribution

Shopify orders do not natively contain UTM parameters from the referring URL. A Web Pixel extension captures UTMs from the landing URL and persists them as cart attributes. This is preferred over a theme app embed because it requires no theme modification.

### Decision 5: UNLISTED Status for Campaign Bundles

Campaign bundles use Shopify's `UNLISTED` product status (API 2025-10+). UNLISTED products are hidden from storefront search, collections, and sitemap, but remain accessible via direct URL and are still published to ad channels.

---

## 3. Phase 1: Feed-Ready Product Enhancement

**Priority:** HIGH -- This is the prerequisite for all advertising functionality.
**Value:** Bundles become visible in Google Shopping, Meta Catalog, and TikTok Shop feeds.

### 3.1 Problem

Bundle parent products are currently created with:
- `price: "0.00"` (line 198 of `handlers.server.ts`)
- `inventoryManagement: null` (line 200 of `handlers.server.ts`)

Ad platforms require:
- **Price > $0** (Google Merchant Center rejects $0 products)
- **Availability = "in_stock"** (requires Shopify-managed inventory with quantity > 0)

### 3.2 Work Items

#### 3.2.1 Fix Bundle Variant Price on Creation

**Current behavior:** `handlers.server.ts` creates bundle product with `price: "0.00"`.
**Required behavior:** Set price to the calculated bundle price at creation time.

The price calculation logic already exists in `app/services/bundles/pricing-calculation.server.ts` (`calculateBundlePrice` and `updateBundleProductPrice`). The fix is to call price calculation during creation, not just during sync.

**Files to modify:**
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` -- Replace `price: "0.00"` with calculated price
- `app/routes/app/app.bundles.cart-transform.tsx` -- Same fix (also creates with `price: "0.00"`)
- `app/services/bundles/pricing-calculation.server.ts` -- Ensure it can be called during creation flow

**Cart Transform impact:** The MERGE path is unaffected because it always uses `percentageDecrease`. The EXPAND path with 0% discount will now show the calculated price instead of $0. This is a bug fix, not a behavior change.

#### 3.2.2 Enable Inventory Management on Bundle Products

**Current behavior:** `inventoryManagement: null` means Shopify does not track inventory. The product always shows as "in stock" but ad platforms may treat unmanaged inventory as unknown/unavailable.
**Required behavior:** `inventoryManagement: "SHOPIFY"` so Shopify tracks inventory quantities. Ad platform feeds will then report correct `in_stock` / `out_of_stock` availability.

**Files to modify:**
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` -- Change `inventoryManagement: null` to `"SHOPIFY"`
- `app/routes/app/app.bundles.cart-transform.tsx` -- Same change
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` -- Add inventory management fields to sync operations

#### 3.2.3 Inventory Sync Engine (New Service)

Create a new service that calculates and sets bundle inventory based on component inventory.

**Formula:**

```
bundle_stock = MIN(component_inventory[i] / component_quantity[i])
```

Where `component_quantity[i]` is the number of units of component `i` required per bundle. This accounts for bundles that include multiple units of the same component (e.g., "3x Coffee Beans").

**Example:**

| Component | Stock | Qty per Bundle | Effective |
|-----------|-------|----------------|-----------|
| Coffee Beans | 50 | 2 | 25 |
| Coffee Mug | 20 | 1 | 20 |
| Coffee Grinder | 10 | 1 | 10 |

Bundle stock = MIN(25, 20, 10) = **10**

**New file:** `app/services/bundles/inventory-sync.server.ts`

**Responsibilities:**
1. Query component variant inventory levels via Shopify Admin API
2. Calculate bundle inventory using the formula above
3. Set bundle parent variant inventory via `inventoryAdjustQuantities` mutation
4. Handle multi-location stores (calculate per-location, set per-location)

**Shopify API for setting inventory:** `inventoryAdjustQuantities` (replaces deprecated `inventoryAdjustQuantity`)

#### 3.2.4 Inventory Recalculation Triggers

Bundle inventory must be recalculated when:
- Component product inventory changes (webhook: `inventory_levels/update`)
- Bundle is purchased (component inventory decreases, triggering the above webhook)
- Component product is restocked (same webhook)
- Bundle is created or updated in Wolfpack

**Webhook registration:** Register `inventory_levels/update` webhook. When received, look up which bundles contain the affected variant and recalculate those bundles.

#### 3.2.5 Data Migration for Existing Bundles

Existing bundle products have `price: "0.00"` and `inventoryManagement: null`. A one-time migration must:

1. Query all existing bundle products from the database
2. For each bundle: calculate correct price, update Shopify product variant price
3. For each bundle: enable `inventoryManagement: "SHOPIFY"` on the variant
4. For each bundle: calculate and set initial inventory levels

This should be implemented as a batch job (not a migration script) that can be re-run safely.

### 3.3 Scope Changes Required

**New scopes to add to `shopify.app.toml`:**
- `write_inventory` -- Required for `inventoryAdjustQuantities` mutation
- `read_inventory` -- Required for querying component inventory levels

**Current scopes (from `shopify.app.toml` line 26):**
```
read_product_listings,read_products,read_publications,read_themes,
unauthenticated_read_content,unauthenticated_read_product_listings,
write_app_proxy,write_cart_transforms,write_content,write_discounts,
write_products,write_publications,write_themes
```

**Important:** Adding scopes forces ALL existing merchants to re-authenticate. See [Section 6: Breaking Changes](#6-breaking-changes-and-migration) for deployment strategy.

---

## 4. Phase 2: Multi-Channel Publication + Campaign Bundles

**Priority:** MEDIUM -- Extends Phase 1 to make bundles available on ad channels and adds campaign bundle support.
**Dependency:** Phase 1 must be complete (bundles need valid price + inventory before publishing to ad channels).

### 4.1 Multi-Channel Publication

#### 4.1.1 Discover Installed Sales Channels

Query the shop's publications to find which sales channels are installed:

```graphql
query {
  publications(first: 20) {
    edges {
      node {
        id
        name
        supportsFuturePublishing
      }
    }
  }
}
```

No new scopes needed -- `read_publications` and `write_publications` are already in the app's scope list.

#### 4.1.2 Extend Publication Logic

**Current behavior:** `handlers.server.ts` publishes bundle products only to the Online Store channel using `publishablePublish`.

**Required behavior:** Provide an option to publish to all installed ad-related channels. This could be:
- **Option A (recommended):** Automatically publish to all installed channels on bundle creation. Merchant can adjust in Shopify admin.
- **Option B:** Add a "Publish to Ad Channels" button in the Wolfpack bundle detail page.

**Files to modify:**
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` -- Extend the `PUBLISH_PRODUCT` mutation call to include additional publication IDs

**API:** `publishablePublish` (already used) and `publishableUnpublish` (for removal). These replace the deprecated `productPublicationCreate` / `productPublicationDelete`.

### 4.2 Campaign Bundles (UNLISTED Status)

#### 4.2.1 Add `unlisted` to BundleStatus Enum

**Current enum (from `prisma/schema.prisma` line 19):**
```prisma
enum BundleStatus {
  draft
  active
  archived
}
```

**New enum:**
```prisma
enum BundleStatus {
  draft
  active
  archived
  unlisted
}
```

This requires a Prisma migration. The migration is purely additive -- no existing data is affected.

#### 4.2.2 Campaign Bundle Creation Flow

When a merchant creates a campaign bundle:

1. Wolfpack creates the product in Shopify with `status: ACTIVE` (so it has a live URL)
2. Wolfpack then calls `productChangeStatus` or `productUpdate` to set `status: UNLISTED`
3. Wolfpack publishes to the selected ad channels
4. The bundle's BundleStatus in the database is set to `unlisted`

**UNLISTED product behavior (Shopify API 2025-10+):**
- Hidden from storefront search
- Hidden from collections
- Excluded from sitemap
- Accessible via direct URL (e.g., `/products/tiktok-coffee-bundle`)
- Still published to ad channels that the product is associated with

**Documentation:** https://shopify.dev/docs/apps/build/online-store/product-unlisted-status

#### 4.2.3 QA Requirement

**Manual verification required:** Confirm that UNLISTED products appear in Google Merchant Center, Meta Catalog, and TikTok Catalog feeds when published to those channels. This is a critical assumption that must be validated before shipping Phase 2.

**Files to modify:**
- `prisma/schema.prisma` -- Add `unlisted` to BundleStatus enum
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` -- Add campaign bundle creation path
- New or modified UI components for bundle detail page (channel publication controls, campaign bundle toggle)

---

## 5. Phase 3: UTM Attribution

**Priority:** MEDIUM -- Significant implementation effort but high merchant value.
**Dependency:** Phase 1 must be complete. Phase 2 is not a strict dependency but is recommended.

### 5.1 Web Pixel Extension for UTM Capture

**New extension:** `extensions/web-pixel/`

The Web Pixel captures UTM parameters from the landing URL when a customer arrives on the storefront.

**Parameters to capture:**
- `utm_source` (e.g., google, facebook, tiktok)
- `utm_medium` (e.g., cpc, social, email)
- `utm_campaign` (e.g., coffee_bundle_ads)
- `utm_content` (e.g., ad variant identifier)
- `utm_term` (e.g., search keyword)

**Flow:**

```
Customer clicks ad with UTM params
    |
Web Pixel fires on page_viewed event
    |
Captures UTMs from document.referrer or window.location
    |
Persists UTMs as cart attributes via Shopify's Cart Attributes API
    |
UTMs travel with the cart through checkout
    |
Order contains cart attributes with UTM data
```

**Why Web Pixel over theme app embed:** Web Pixel requires no theme modification, works across all themes, and is managed as a Shopify extension.

**Shopify Web Pixel API:** https://shopify.dev/docs/api/pixels

### 5.2 Order Webhook for Attribution Recording

**Webhook:** `orders/create`

When an order is created:

1. Extract cart attributes containing UTM parameters
2. Check if the order contains bundle products (match against Wolfpack's database)
3. If UTM data exists and bundle products are present, create an `OrderAttribution` record
4. Calculate revenue from the bundle line items

**New scope required:** `read_orders`

**Important:** This scope should be deployed alongside Phase 1's `write_inventory` and `read_inventory` scopes to minimize re-authentication cycles. See [Section 6](#6-breaking-changes-and-migration).

### 5.3 Attribution Dashboard

New page in the Wolfpack admin: `/app/analytics/attribution` (or similar)

**Dashboard components:**
- Bundle revenue by platform (Google, Meta, TikTok)
- Bundle revenue by campaign
- Top-performing bundles by ad-attributed revenue
- Date range filtering

**Foundation:** The `BundleAnalytics` model and `BundleAnalyticsService` already exist in the codebase and can be extended for attribution data.

### 5.4 Open Design Questions

These must be resolved before Phase 3 implementation begins:

1. **Attribution window:** How long after UTM capture should an order be attributed? (Recommended: 30 days, matching Google Ads default)
2. **Scope of tracking:** Track all orders or only orders containing bundle products? (Recommended: all orders, to provide broader value)
3. **Cart attribute key naming:** Propose `_wolfpack_utm_source`, `_wolfpack_utm_medium`, etc. (underscore prefix hides from checkout UI per Shopify convention)

---

## 6. Breaking Changes and Migration

### 6.1 HIGH RISK: Scope Additions Force Re-Authentication

Adding `write_inventory`, `read_inventory`, and `read_orders` to `shopify.app.toml` forces ALL existing merchants to re-authenticate when they next open the app.

**Deployment strategy:** Deploy all three scope additions in a single `shopify app deploy` to limit merchants to one re-authentication cycle rather than three.

**Implementation sequence:**
1. Complete all code changes for Phase 1 + register `orders/create` webhook handler (can be a no-op initially)
2. Update `shopify.app.toml` with all three new scopes at once
3. Deploy once

### 6.2 HIGH RISK: Variant Price Change

Bundle parent products currently have `price: "0.00"`. Changing to the actual calculated price is a correction that fixes feed eligibility, but it affects:

- **MERGE path bundles (majority):** Unaffected. Cart Transform always uses `percentageDecrease` to calculate the final checkout price, regardless of the parent product's display price.
- **EXPAND path bundles with no discount (0%):** Will now show the calculated price instead of $0 on the product page. This is a bug fix -- these bundles were always supposed to show their real price.

### 6.3 MEDIUM RISK: Inventory Management Change

Existing bundles have `inventoryManagement: null` (unmanaged). Switching to `"SHOPIFY"` means:
- Shopify starts tracking inventory quantities
- If initial inventory is not set, the product will show as "out of stock"
- The data migration (Section 3.2.5) must set initial inventory levels

**Mitigation:** The migration must enable inventory management AND set calculated inventory levels in the same operation. Never enable tracking without setting a quantity.

### 6.4 LOW RISK: Additive Changes

- **BundleStatus enum:** Adding `unlisted` is purely additive. No existing records are affected.
- **OrderAttribution model:** New table, no existing data affected.
- **Web Pixel extension:** Separate from existing checkout UI extension, no conflicts.

---

## 7. Data Model Changes

### 7.1 Phase 1: No New Prisma Models

Changes are to Shopify product data only:
- Bundle parent variant: `price` set to calculated value (currently `"0.00"`)
- Bundle parent variant: `inventoryManagement` set to `"SHOPIFY"` (currently `null`)
- Bundle parent variant: inventory levels managed via Shopify Inventory API

### 7.2 Phase 2: Schema Migration

```prisma
enum BundleStatus {
  draft
  active
  archived
  unlisted  // NEW -- campaign bundles hidden from storefront
}
```

### 7.3 Phase 3: New Model

```prisma
model OrderAttribution {
  id            String   @id @default(uuid())
  shopId        String
  bundleId      String?  // nullable -- may track non-bundle orders too
  orderId       String   // Shopify order GID
  orderNumber   String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmContent    String?
  utmTerm       String?
  landingPage   String?  // The URL customer landed on
  revenue       Int      // cents
  currency      String   @default("USD")
  createdAt     DateTime @default(now())

  @@index([shopId])
  @@index([bundleId])
  @@index([orderId])
  @@index([utmSource])
  @@index([utmCampaign])
  @@index([shopId, createdAt])
  @@index([bundleId, createdAt])
}
```

---

## 8. Existing Code Inventory

Code that already handles parts of this feature and must be reused or extended (not duplicated):

| Capability | Status | File |
|-----------|--------|------|
| Bundle product creation via `productCreate` | DONE | `app/routes/app/app.dashboard/handlers/handlers.server.ts` |
| Publishing to Online Store via `publishablePublish` | DONE | `app/routes/app/app.dashboard/handlers/handlers.server.ts` |
| Price calculation (`calculateBundlePrice`, `updateBundleProductPrice`) | DONE | `app/services/bundles/pricing-calculation.server.ts` |
| Metafield sync (component_reference, component_quantities) | DONE | `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` |
| BundleAnalytics model + BundleAnalyticsService | DONE | `prisma/schema.prisma`, analytics service files |
| BundleStatus enum (draft, active, archived) | DONE | `prisma/schema.prisma` line 19 |
| Cart Transform bundle creation (secondary path) | DONE | `app/routes/app/app.bundles.cart-transform.tsx` |

### Known Bug Locations

| Bug | File | Line | Current Value | Required Value |
|-----|------|------|---------------|----------------|
| Bundle created with $0 price | `handlers.server.ts` | 198 | `price: "0.00"` | Calculated bundle price |
| Bundle created with $0 price (cart transform path) | `app.bundles.cart-transform.tsx` | 195 | `price: "0.00"` | Calculated bundle price |
| Bundle inventory unmanaged | `handlers.server.ts` | 200 | `inventoryManagement: null` | `"SHOPIFY"` |
| Bundle inventory unmanaged (cart transform path) | `app.bundles.cart-transform.tsx` | 197 | `inventoryManagement: null` | `"SHOPIFY"` |

---

## 9. API Reference

| API | Used For | Phase | Notes |
|-----|----------|-------|-------|
| `productCreate` | Bundle product creation | Existing | Already used. Modify price + inventoryManagement params. |
| `productVariantsBulkUpdate` | Update existing variant prices | 1 | For data migration of existing bundles. |
| `publishablePublish` | Publish to sales channels | 1, 2 | Already used for Online Store. Extend to ad channels. |
| `publishableUnpublish` | Remove from channels | 2 | For unpublishing from specific channels. |
| `inventoryAdjustQuantities` | Set bundle inventory | 1 | **New.** Replaces deprecated `inventoryAdjustQuantity`. Requires `write_inventory` scope. |
| `inventoryItem` / `inventoryLevel` queries | Read component inventory | 1 | **New.** Requires `read_inventory` scope. |
| `publications` query | Discover installed channels | 2 | Requires `read_publications` (already have). |
| `productChangeStatus` | Set UNLISTED status | 2 | Requires API version 2025-10+. |
| Web Pixel API | UTM capture on storefront | 3 | New extension: `extensions/web-pixel/`. |
| `orders/create` webhook | Attribution recording | 3 | Requires `read_orders` scope. |

### Shopify Documentation Links

- Product creation: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate
- Inventory adjustment: https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventoryAdjustQuantities
- Publications: https://shopify.dev/docs/api/admin-graphql/latest/queries/publications
- Unlisted products: https://shopify.dev/docs/apps/build/online-store/product-unlisted-status
- Web Pixel API: https://shopify.dev/docs/api/pixels
- Sales channels overview: https://shopify.dev/docs/apps/sales-channels
- Google feed requirements: https://support.google.com/merchants/answer/7052112

### Shopify Channel App Documentation

- Google & YouTube: https://help.shopify.com/en/manual/promoting-marketing/google
- Facebook & Instagram: https://help.shopify.com/en/manual/promoting-marketing/facebook
- TikTok: https://help.shopify.com/en/manual/promoting-marketing/tiktok

---

## 10. Implementation Sequence

Each step should be its own issue file in `docs/issues-prod/` per the project's issue tracking system.

| Step | Phase | Description | Scope Change | Deployable Independently |
|------|-------|-------------|-------------|------------------------|
| 1a | 1 | Fix variant price on creation (both creation paths) | No | Yes |
| 1b | 1 | Enable `inventoryManagement: "SHOPIFY"` on creation | No | Yes (with 1a) |
| 1c | 1 | Deploy scope changes: `write_inventory`, `read_inventory`, `read_orders` | **YES -- forces re-auth** | Deploy all scopes together |
| 1d | 1 | Implement inventory sync engine + `inventory_levels/update` webhook | No | Yes (after 1c) |
| 1e | 1 | Data migration for existing bundles (price + inventory) | No | Yes (after 1d) |
| 2a | 2 | Multi-channel publication (discover channels, extend publish logic) | No | Yes (after 1e) |
| 2b | 2 | Add `unlisted` to BundleStatus enum (Prisma migration) | No | Yes |
| 2c | 2 | Campaign bundle creation flow (UNLISTED status) | No | Yes (after 2a + 2b) |
| 3a | 3 | Web Pixel extension for UTM capture | No | Yes |
| 3b | 3 | `orders/create` webhook handler + OrderAttribution model | No | Yes (after 3a, scope already deployed in 1c) |
| 3c | 3 | Attribution dashboard UI | No | Yes (after 3b) |

### Scope Deployment Strategy

All three new scopes (`write_inventory`, `read_inventory`, `read_orders`) are deployed in step 1c as a single `shopify app deploy`. This means:
- Merchants re-authenticate once (not three times)
- The `read_orders` scope is deployed early even though Phase 3 uses it later
- The `orders/create` webhook handler can start as a no-op stub, implemented fully in step 3b

---

## 11. Out of Scope

The following items from the original Feature Doc are explicitly **NOT** part of this feature specification. They are either deferred to future work or rejected.

### Rejected

| Item | Reason |
|------|--------|
| Per-channel toggles in Wolfpack UI | Duplicates Shopify admin functionality. Merchants already manage channel publishing through Shopify's native product editing UI. |
| Direct ad platform integrations (Google Ads API, Meta Marketing API, TikTok Ads API) | Violates core architecture principle. Adds maintenance burden with no clear value over Shopify's channel sync. |
| Ad campaign management from Wolfpack | Merchants use native ad platform dashboards. Building campaign management would be a separate product. |
| Feed Optimization System | Vaguely defined in original doc. Merchants can edit product titles and descriptions in Shopify admin. Bundle title quality is a content concern, not an engineering system. |
| Bundle image generation | Out of scope for initial release. Merchants upload images through Shopify admin. |

### Deferred to Future Releases

| Item | Reason |
|------|--------|
| Configurable Bundle Builder (P2 from Feature Doc) | Different product architecture entirely. Not related to ad-readiness. |
| AI Commerce Discovery (P2 from Feature Doc) | If bundles have proper Shopify product data (title, description, price, images), they are already discoverable by AI shopping assistants. No additional work needed. |
| Channel-specific bundle pricing | Potential future enhancement. Requires understanding per-channel pricing APIs. |
| Automated campaign bundle creation | Potential future enhancement. Would auto-create UNLISTED bundles for specific campaigns. |

---

## 12. Success Criteria

### Phase 1 Complete When:

- [ ] New bundles are created with calculated price (not $0)
- [ ] New bundles are created with `inventoryManagement: "SHOPIFY"`
- [ ] Bundle inventory is calculated as `MIN(component_inventory / component_quantity)` and set via Shopify API
- [ ] Bundle inventory recalculates when component inventory changes (webhook-driven)
- [ ] Existing bundles are migrated to correct price + managed inventory
- [ ] A bundle published to Google channel appears in Google Merchant Center with correct price, inventory count, and "in_stock" status

### Phase 2 Complete When:

- [ ] Wolfpack can discover installed sales channels on a shop
- [ ] Bundles can be published to ad channels (Google, Meta, TikTok) through Wolfpack
- [ ] Campaign (UNLISTED) bundles are accessible via direct URL but not visible in storefront search, collections, or sitemap
- [ ] UNLISTED bundles are confirmed to appear in ad channel feeds (manual QA verification)

### Phase 3 Complete When:

- [ ] Web Pixel extension captures UTM parameters from landing URL
- [ ] UTM parameters persist through checkout as cart attributes
- [ ] `orders/create` webhook extracts UTM data and creates OrderAttribution records
- [ ] Merchants can see which ad campaigns generate bundle revenue in the Wolfpack dashboard
- [ ] Attribution data is filterable by platform, campaign, date range, and bundle

---

## Appendix A: Example End-to-End Flow

**Scenario:** Merchant "Brewly Coffee" creates an ad-ready bundle.

**Products:**

| Product | Price | Inventory |
|---------|-------|-----------|
| Coffee Beans | $25 | 50 |
| Coffee Mug | $15 | 20 |
| Coffee Grinder | $35 | 10 |

**Step 1: Create Bundle in Wolfpack**

Merchant creates "Home Barista Starter Kit" with 35% discount.
- Calculated price: $48.75 (sum of components $75, minus 35%)
- Bundle inventory: MIN(50/1, 20/1, 10/1) = 10

**Step 2: Wolfpack Creates Shopify Product**

```
Title: Home Barista Starter Kit
Price: $48.75
inventoryManagement: SHOPIFY
Inventory: 10
Status: ACTIVE
Product Type: Bundle
```

**Step 3: Publish to Channels**

Product published to: Online Store, Google & YouTube, Facebook & Instagram

**Step 4: Google Merchant Center Feed**

```
id: shopify_US_gid_product_12345_variant_67890
title: Home Barista Starter Kit
price: 48.75 USD
availability: in_stock
link: https://brewly.com/products/home-barista-starter-kit
```

**Step 5: Merchant Creates Google Shopping Ad**

Ad links to: `https://brewly.com/products/home-barista-starter-kit?utm_source=google&utm_medium=cpc&utm_campaign=coffee_bundle_ads`

**Step 6: Customer Clicks Ad**

Web Pixel captures UTM params, stores as cart attributes.

**Step 7: Customer Purchases**

Order created. Wolfpack webhook handler records:

```
OrderAttribution {
  bundleId: "bundle-barista-kit-uuid"
  orderId: "gid://shopify/Order/8329472"
  utmSource: "google"
  utmMedium: "cpc"
  utmCampaign: "coffee_bundle_ads"
  revenue: 4875  // cents
  currency: "USD"
}
```

**Step 8: Merchant Views Dashboard**

Bundle Revenue by Platform:
- Google: $3,200
- Meta: $1,500

Bundle Revenue by Campaign:
- coffee_bundle_ads: $2,000
- holiday_gift_bundle: $1,400

---

## Appendix B: File Map

Quick reference for all files that will be created or modified across all three phases.

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `shopify.app.toml` | 1 | Add `write_inventory`, `read_inventory`, `read_orders` scopes |
| `app/routes/app/app.dashboard/handlers/handlers.server.ts` | 1, 2 | Fix price, enable inventory mgmt, extend publication logic |
| `app/routes/app/app.bundles.cart-transform.tsx` | 1 | Fix price, enable inventory mgmt |
| `app/services/bundles/pricing-calculation.server.ts` | 1 | Ensure callable during creation flow |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | 1 | Add inventory management fields |
| `prisma/schema.prisma` | 2, 3 | Add `unlisted` to BundleStatus, add OrderAttribution model |

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `app/services/bundles/inventory-sync.server.ts` | 1 | Inventory calculation engine |
| `extensions/web-pixel/` | 3 | Web Pixel extension for UTM capture |
| Route for attribution dashboard | 3 | Attribution analytics UI |
| Webhook handler for `orders/create` | 3 | UTM extraction + attribution recording |
| Webhook handler for `inventory_levels/update` | 1 | Trigger bundle inventory recalculation |
