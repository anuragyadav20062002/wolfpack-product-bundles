# Issue: Unlisted Bundle Informational Banner (Admin)

**Issue ID:** feedback-jun26-6
**Status:** In Progress
**Priority:** 🟢 Low
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

From `Feedbacks June 2026.pdf`: when a Wolfpack bundle's parent Shopify product status is "Unlisted" (auto-set on bundle creation), merchants get confused — the bundle is functional but doesn't show up in search/collection pages. The explanation currently only lives inside the Shopify product description body (`app/lib/bundle-product-description.server.ts:44-45`); it's invisible in the Wolfpack admin app.

Add a small inline banner in the Wolfpack admin (FPB + PPB configure pages) that explains the Unlisted state and links to the bundle product in Shopify Products admin so the merchant can change Status to Active.

## Approach

1. New component `app/components/UnlistedBundleBanner.tsx` — props `{ bundleProductId: string | null; shop: string }`. Renders nothing if no productId. Otherwise renders an info banner with:
   - Headline: "Your bundle is Unlisted"
   - Body: "Discounts apply, but the product is hidden from search and collection pages. Customers can still buy it via a direct link."
   - CTA: "Manage in Shopify Products" → opens `https://admin.shopify.com/store/{store}/products/{numericId}` in new tab.
2. Render conditionally inside FPB and PPB configure top of page (next to existing `AppEmbedBanner`) ONLY when `parentProductActive === false` (parent product is Unlisted/Draft/Archived).
3. Helper to build the admin product URL is in the same component file (`buildShopifyProductAdminUrl(shop, productId)`); covered by unit tests.

## Files Changed

- `app/components/UnlistedBundleBanner.tsx` (new)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — render banner above sidebar.
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same.
- (Dashboard rendering deferred — banner clutters the row list; the configure pages are where the merchant is when they care about activation.)

## Tests

- `tests/unit/components/unlisted-bundle-banner.test.ts` — render test (returns null when productId is null; renders headline + CTA when productId is present; URL constructed correctly).

## Phases Checklist

- [x] Phase 1: Failing render + URL builder tests
- [x] Phase 2: Implement component + helper
- [x] Phase 3: Wire into FPB + PPB configure routes
- [x] Phase 4: Tests + lint green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- Added `app/components/UnlistedBundleBanner.tsx` exporting both `UnlistedBundleBanner` (returns null when productId missing; otherwise an amber/warning banner with headline + CTA opening the Shopify product admin URL) and a pure helper `buildShopifyProductAdminUrl(shop, productId)` that handles full GIDs, bare numeric ids, shop slugs with/without `.myshopify.com`, and null/empty productId.
- 9 unit tests cover: URL helper across 5 input shapes; JSX contract (returns null early, renders headline, CTA wired to window.open(adminUrl), warning tone).
- Wired into FPB configure route just below `AppEmbedBanner` (line ~2667), gated on `!parentProductActive`.
- Wired into PPB configure route just above `editGrid` (line ~2148), gated on `productStatus`/`loadedBundleProduct?.status` not being "active".
- Dashboard rendering deferred — the merchant only cares about activation when they're inside a bundle's configure page.

### 2026-05-29 — Starting implementation
- Created issue file. Component skeleton + tests next.
