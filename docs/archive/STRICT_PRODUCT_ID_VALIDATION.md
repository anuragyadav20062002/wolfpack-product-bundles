# Strict Product ID Validation

## Overview

As of **2025-01-07**, the bundle configuration system now enforces **strict validation** for product IDs to prevent data corruption and ensure compatibility with Shopify's APIs.

## What Changed

### Before (Permissive)
- Product IDs were saved without validation
- UUIDs could accidentally be stored in `productId` field
- Invalid IDs only caused errors during metafield updates
- Warnings logged but save operation succeeded

### After (Strict)
- Product IDs are validated before save
- **Only Shopify GIDs are allowed**
- Invalid IDs throw errors and prevent save
- Clear error messages guide user to fix the issue

## Validation Rules

### ✅ Accepted Formats

1. **Full Shopify GID** (Recommended)
   ```
   gid://shopify/Product/10272663634214
   ```

2. **Numeric Product ID** (Auto-converted to GID)
   ```
   10272663634214  →  gid://shopify/Product/10272663634214
   ```

### ❌ Rejected Formats

1. **UUIDs** (Prisma internal IDs)
   ```
   f63df6b8-0e44-42ac-b6e6-731a4011c6f8
   ❌ Error: UUID detected. Only Shopify product IDs are allowed.
   ```

2. **Empty/Null/Undefined**
   ```
   ""    →  ❌ Error: Product ID is required
   null  →  ❌ Error: Product ID is required
   ```

3. **Non-numeric GIDs**
   ```
   gid://shopify/Product/abc-123
   ❌ Error: Shopify product IDs must be numeric
   ```

4. **Random Strings**
   ```
   not-a-valid-id
   ❌ Error: Expected Shopify GID or numeric ID
   ```

## Error Messages

When validation fails, you'll see clear, actionable error messages:

### UUID Detected
```
Invalid product ID: UUID detected "f63df6b8-0e44-42ac-b6e6-731a4011c6f8"
for product "Amber Essence".

Only Shopify product IDs are allowed.
Please re-select the product using the product picker.
```

### Invalid Format
```
Invalid product ID format: "gid://shopify/Product/abc-123"
for product "Test Product".

Shopify product IDs must be numeric.
Expected format: gid://shopify/Product/123456
```

### Missing ID
```
Invalid product ID: Product ID is required and must be a string.
Got: undefined
```

## Impact on Existing Data

### Bundles with Valid Product IDs ✅
- No action required
- Continue working normally
- Can be edited and saved

### Bundles with UUID Product IDs ❌
- **Cannot be saved** until products are re-selected
- Error shown when attempting to save
- Must migrate to continue using

## Migration Guide

### Option 1: Manual Fix (Recommended)

1. **Identify affected bundles:**
   ```bash
   npm run fix-uuids report
   ```

2. **For each bundle:**
   - Open bundle in admin interface
   - Remove products from affected steps
   - Re-add products using product picker
   - Save bundle (validation will pass)

### Option 2: Automated Cleanup

1. **Preview what will be deleted:**
   ```bash
   npm run fix-uuids delete-dry-run
   ```

2. **Delete UUID products:**
   ```bash
   npm run fix-uuids delete
   ```

3. **Reconfigure bundles:**
   - Open each bundle
   - Add products via product picker
   - Save

## Technical Implementation

### Location
**File**: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
**Lines**: 1582-1630

### Validation Logic

```typescript
create: (step.StepProduct || []).map((product: any, productIndex: number) => {
  let productId = product.id;

  // 1. Check if ID exists and is a string
  if (!productId || typeof productId !== 'string') {
    throw new Error(`Invalid product ID: Product ID is required...`);
  }

  // 2. Reject UUIDs immediately
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (isUUID) {
    throw new Error(`Invalid product ID: UUID detected...`);
  }

  // 3. Validate and normalize Shopify GID
  if (productId.startsWith('gid://shopify/Product/')) {
    const numericId = productId.replace('gid://shopify/Product/', '');
    if (!/^\d+$/.test(numericId)) {
      throw new Error(`Invalid product ID format: Shopify product IDs must be numeric...`);
    }
  } else if (/^\d+$/.test(productId)) {
    productId = `gid://shopify/Product/${productId}`;
  } else {
    throw new Error(`Invalid product ID format: Expected Shopify GID...`);
  }

  return { productId, ... };
})
```

## Testing

### Run Validation Tests
```bash
node test-strict-validation.js
```

### Expected Output
```
✅ ALL TESTS PASSED! Strict validation is working correctly.

📝 Validation Rules:
   ✅ Accept: Shopify GIDs (gid://shopify/Product/123456)
   ✅ Accept: Numeric IDs (123456) - auto-converted to GID
   ❌ Reject: UUIDs (any UUID format)
   ❌ Reject: Empty/null/undefined
   ❌ Reject: Non-numeric GIDs
   ❌ Reject: Random strings
```

## Frequently Asked Questions

### Q: Why are UUIDs rejected?
**A**: UUIDs are Prisma's internal database record IDs, not Shopify product identifiers. Using UUIDs breaks metafield updates and Shopify API queries.

### Q: What if the resource picker returns a UUID?
**A**: This indicates a frontend bug. The Shopify resource picker should always return product GIDs. Please report this issue.

### Q: Can I bypass validation?
**A**: No, and you shouldn't. Validation prevents data corruption and ensures Shopify API compatibility.

### Q: Will this break existing bundles?
**A**: Only bundles with UUID product IDs need migration. Bundles with proper Shopify GIDs are unaffected.

### Q: How do I check if my bundles need migration?
**A**: Run `npm run fix-uuids report` to see a detailed list of affected bundles.

## Related Documentation

- [UUID vs Shopify GID](../test-uuid-vs-gid.md) - Understanding the two ID systems
- [Metafield Namespace Fix](./METAFIELD_NAMESPACE_FIX.md) - Previous product ID issues
- [CLAUDE.md](../CLAUDE.md) - Complete project documentation

## Changelog

- **2025-01-07**: Implemented strict validation with error throwing
- **2025-01-07**: Added UUID detection and graceful skip for metafield operations
- **2025-01-07**: Added product ID normalization for new products
- **2025-10-06**: Initial validation to skip invalid UUIDs during metafield updates

## Support

If you encounter issues with product ID validation:

1. Check server logs for detailed error messages
2. Run `npm run fix-uuids report` to identify affected bundles
3. Follow migration guide to fix invalid product IDs
4. Contact development team if validation appears incorrect
