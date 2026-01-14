# Full-Page Bundle Preview Fix

**Date:** December 29, 2024
**Status:** ✅ Complete

## Problem

When clicking the "Preview Bundle" button for a full-page bundle, users were being redirected to `/products/some-endpoint` (product page) instead of `/pages/some-endpoint` (the actual bundle page).

## Root Cause

1. **Missing Database Fields**: The `Bundle` model didn't have fields to store the Shopify page handle/ID where the full-page widget was placed
2. **Data Not Saved**: When "Place Widget Now" created a page, the page handle wasn't saved to the bundle record
3. **Wrong URL Logic**: The preview button always opened the bundle product URL, never checking for page URLs for full-page bundles

## Solution

### Step 1: Database Schema Update

Added two new fields to the `Bundle` model to store page information:

```prisma
model Bundle {
  // ... existing fields
  shopifyProductId String? // For product-page bundles
  shopifyPageHandle String? // For full-page bundles (e.g., "build-your-bundle")
  shopifyPageId String? // For full-page bundles
  // ... rest of fields

  @@index([shopifyPageHandle])
}
```

**Files Changed:**
- `prisma/schema.prisma`

**Migration Required:**
```bash
npx prisma migrate dev --name add_page_handle_to_bundle
npx prisma generate
```

---

### Step 2: Save Page Handle on Widget Placement

Updated `handleValidateWidgetPlacement` to save the page handle and page ID after creating a page:

```typescript
// Save page handle and page ID to bundle record
await db.bundle.update({
  where: { id: bundleId, shopId: session.shop },
  data: {
    shopifyPageHandle: result.pageHandle,
    shopifyPageId: result.pageId
  }
});
```

**Files Changed:**
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx` (lines 1883-1890)

---

### Step 3: Update Preview Button Logic

Updated `handlePreviewBundle` to detect bundle type and use the appropriate URL:

**For Full-Page Bundles:**
- Check if `bundle.bundleType === 'full_page'`
- Verify `bundle.shopifyPageHandle` exists
- Construct page URL: `https://{shop}/pages/{pageHandle}`
- Open page in new tab

**For Product-Page Bundles:**
- Keep existing product URL logic
- Open product page in new tab

```typescript
// FOR FULL-PAGE BUNDLES: Use page URL instead of product URL
if (bundle.bundleType === 'full_page') {
  if (!bundle.shopifyPageHandle) {
    shopify.toast.show("Bundle page not created yet. Please use 'Place Widget Now' first.", {
      isError: true,
      duration: 5000
    });
    return;
  }

  const pageUrl = `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`;
  window.open(pageUrl, '_blank');
  shopify.toast.show("Bundle page opened in new tab", { isError: false });
  return;
}

// FOR PRODUCT-PAGE BUNDLES: Use product URL
// ... existing product URL logic
```

**Files Changed:**
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx` (lines 2364-2475)

---

## Behavior After Fix

### Full-Page Bundles:

1. **Before clicking "Place Widget Now":**
   - Preview button shows error: "Bundle page not created yet. Please use 'Place Widget Now' to create the bundle page first."

2. **After clicking "Place Widget Now":**
   - Page handle is saved to database
   - Preview button opens: `https://{shop}.myshopify.com/pages/{page-handle}`
   - User sees the actual full-page bundle widget

### Product-Page Bundles:

- No changes - continues to open product page as before
- Preview button opens: `https://{shop}.myshopify.com/products/{product-handle}`

---

## Testing Checklist

- [ ] **Database Migration**
  - [ ] Run migration successfully
  - [ ] Verify `shopifyPageHandle` and `shopifyPageId` fields exist

- [ ] **Full-Page Bundle - New Widget Placement**
  - [ ] Create new full-page bundle
  - [ ] Click "Place Widget Now"
  - [ ] Verify page handle saved to database
  - [ ] Click "Preview Bundle"
  - [ ] Verify opens `/pages/...` URL (not `/products/...`)

- [ ] **Full-Page Bundle - Existing Bundles**
  - [ ] Open existing full-page bundle
  - [ ] If no page handle: Shows "Place Widget Now" message
  - [ ] Click "Place Widget Now"
  - [ ] Verify page handle saved
  - [ ] Click "Preview Bundle"
  - [ ] Verify opens correct page URL

- [ ] **Product-Page Bundle**
  - [ ] Create/open product-page bundle
  - [ ] Click "Preview Bundle"
  - [ ] Verify still opens product URL (no regression)

---

## Migration Notes

### For Existing Full-Page Bundles

Existing full-page bundles created before this fix won't have a `shopifyPageHandle` saved. When users click "Preview Bundle":

1. They'll see: "Bundle page not created yet. Please use 'Place Widget Now' to create the bundle page first."
2. They need to click "Place Widget Now" once
3. After that, preview will work correctly

**Alternative Solution (Optional):**
If you want to avoid re-placing the widget, you could write a migration script to populate the page handles for existing bundles by querying Shopify pages with the bundle metafield.

---

## Technical Details

### URL Construction Logic

**Full-Page Bundle URL:**
```typescript
const shopDomain = shop.includes('.myshopify.com')
  ? shop.replace('.myshopify.com', '')
  : shop.split('.')[0];

const pageUrl = `https://${shopDomain}.myshopify.com/pages/${bundle.shopifyPageHandle}`;
```

**Product-Page Bundle URL:**
```typescript
// Uses existing logic:
// 1. onlineStorePreviewUrl (from Shopify)
// 2. onlineStoreUrl (from Shopify)
// 3. Constructed URL: https://{shop}/products/{handle}
// 4. Admin URL fallback: https://admin.shopify.com/store/{shop}/products/{id}
```

### Error Messages

| Scenario | Error Message |
|----------|--------------|
| Full-page bundle, no page handle | "Bundle page not created yet. Please use 'Place Widget Now' to create the bundle page first." |
| Product-page bundle, no product | "Bundle product not found. Please select a bundle product first." |
| Unsaved changes | "Please save your changes before previewing the bundle" |
| Invalid URL | "Unable to determine bundle product URL. Please check bundle product configuration." |

---

## Files Modified

1. **Database Schema:**
   - `prisma/schema.prisma`

2. **Configuration Routes:**
   - `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx`

3. **Database Migration (Auto-generated):**
   - `prisma/migrations/YYYYMMDDHHMMSS_add_page_handle_to_bundle/migration.sql`

---

## Related Documentation

- [Full-Page Widget Fixes](./FULL_PAGE_WIDGET_FIXES.md) - Bundle title and loading spinner fixes
- [Widget Loading Upgrade](./WIDGET_LOADING_UPGRADE.md) - Dynamic injection and bundling

---

## Notes

- The page handle is automatically extracted from the page URL when created
- Page handles follow Shopify's URL-safe format (lowercase, hyphens, no spaces)
- For development stores, the URL format is the same: `https://{shop}.myshopify.com/pages/{handle}`
- The fix maintains backward compatibility with product-page bundles
