# Issue: Dashboard UI Improvements & Bundle Config Cleanup

**Issue ID:** dashboard-ui-improvements-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-18
**Last Updated:** 2026-01-18 12:30

## Overview
UI improvements for the dashboard and bundle configuration pages:
1. Remove "Take your bundle live" card from product-page bundle config (video provided during creation)
2. Add preview button to bundle list for both full-page and product-page bundles
3. Replace "Discount" column with "Bundle Type" column
4. Redesign action buttons with professional icon groups

## Progress Log

### 2026-01-18 12:00 - Starting Implementation
- What I'm about to implement:
  - Task 1: Remove "Take your bundle live" card (lines 3385-3507)
  - Task 2: Add ViewIcon import and preview functionality
  - Task 3: Update DataTable headings and bundleRows
  - Task 4: Create professional icon-based action buttons with tooltips
- Files I'll modify:
  - `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`
  - `app/routes/app.dashboard.tsx`
- Expected outcome:
  - Cleaner bundle configuration page
  - Professional-looking dashboard with icon button groups
  - Easy bundle preview access

### 2026-01-18 12:30 - Completed Implementation
- **Task 1: Remove "Take bundle live" card** - DONE
  - Removed the entire card from lines 3385-3507
  - File: `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`

- **Task 2: Add preview button** - DONE
  - Updated loader to fetch product handles for preview URLs
  - Added `shopifyProductId` and `shopifyPageHandle` to bundle select
  - Created `handlePreviewBundle` function with proper URL construction
  - Preview opens in new tab: `/products/{handle}` for product-page, `/pages/{handle}` for full-page

- **Task 3: Replace Discount with Bundle Type** - DONE
  - Added `BUNDLE_TYPE_BADGES` constant with styled badges:
    - Product Page: `<Badge tone="info">Product Page</Badge>`
    - Full Page: `<Badge tone="attention">Full Page</Badge>`
  - Added `getBundleTypeDisplay()` helper function
  - Updated DataTable headings: "Discount" -> "Type"
  - Updated bundleRows to use `getBundleTypeDisplay(bundle.bundleType)`

- **Task 4: Redesign action buttons** - DONE
  - Added imports: `Tooltip`, `ViewIcon`, `ExternalIcon`
  - Redesigned `BundleActionsButtons` component:
    - Group 1 (segmented): Edit + Clone (neutral actions)
    - Group 2 (segmented): Preview + Delete (view/destructive actions)
  - Icon-only buttons with `accessibilityLabel` for screen readers
  - Tooltips on hover showing action names
  - Preview disabled when no handle available (shows "Save bundle to preview")

## Files Modified
1. `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`
   - Removed "Take your bundle live" card section

2. `app/routes/app.dashboard.tsx`
   - Added imports: `Tooltip`, `ViewIcon`, `ExternalIcon`
   - Updated loader to include `shopifyProductId`, `shopifyPageHandle`
   - Added GraphQL query to fetch product handles for preview URLs
   - Added `BUNDLE_TYPE_BADGES` constant
   - Redesigned `BundleActionsButtons` with segmented button groups
   - Added `handlePreviewBundle` function
   - Added `getBundleTypeDisplay` function
   - Updated bundleRows and DataTable headings

## Technical Design

### Action Button Groups (Polaris Best Practices)
Using Polaris ButtonGroup with `variant="segmented"` styling:
- Group 1: Edit + Clone (neutral actions)
- Group 2: Preview + Delete (view/destructive actions)

Button styling:
- Icon-only buttons with `accessibilityLabel`
- Tooltips via Polaris `<Tooltip>` component
- Compact/micro sizing for table cells

### Preview URLs
- Product Page: `https://{shop}/products/{handle}`
- Full Page: `https://{shop}/pages/{handle}`

### Bundle Type Badges
- `product_page`: Blue info badge "Product Page"
- `full_page`: Yellow attention badge "Full Page"

## Related Documentation
- [Polaris ButtonGroup](https://polaris.shopify.com/components/actions/button-group)
- [Polaris Tooltip](https://polaris.shopify.com/components/overlays/tooltip)
- [Polaris Icons](https://polaris.shopify.com/icons)

## Phases Checklist
- [x] Phase 1: Remove "Take bundle live" card
- [x] Phase 2: Update dashboard imports
- [x] Phase 3: Replace Discount column with Bundle Type
- [x] Phase 4: Implement professional action buttons
- [x] Phase 5: Add preview functionality
