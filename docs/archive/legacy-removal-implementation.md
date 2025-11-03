# Legacy Removal Implementation Plan

## Step-by-Step Implementation

### Step 1: Interface Cleanup (Low Risk)

**Remove legacy fields from CartTransformInput interface:**

```typescript
// REMOVE these fields:
allBundlesConfig?: {
  value: string;
  jsonValue?: any;
};

// REMOVE from product interface:
all_bundles_data?: {
  value: string;
};
```

### Step 2: Remove Unused Legacy Functions (Medium Risk)

**Functions to completely remove:**

1. `processCartTransformWithStandardMetafields`
2. `processCartTransformWithBundleConfigs` 
3. `getExpandOperations`
4. `getMergeOperations`
5. `buildExpandOperation`
6. `buildMergeOperation`
7. `getBundleParentDefinitions`
8. `getComponentsInCart`
9. `createMergeOperationForBundle`
10. `calculateBundlePrice` (keep `calculateBundlePriceFromConfig`)

### Step 3: Simplify Main Function (High Impact)

**In `cartTransformRun` function, remove:**

```typescript
// REMOVE: Product metafield fallback
if (Object.keys(bundleConfigsMap).length === 0) {
  console.log("🔍 [CONFIG LOADING] Attempting fallback to product metafields");
  // ... entire fallback block
}

// REMOVE: Product metafield processing path
const hasProductMetafields = input.cart.lines.some(line =>
  line.merchandise?.product?.bundle_config?.value
);

if (hasProductMetafields) {
  // ... entire block
}
```

**Keep only:**
- Shop metafield loading
- Widget-based bundle processing
- Error handling

### Step 4: Simplify Widget Processing (Medium Risk)

**In `processCartTransformWithWidgetBundles`, remove:**

```typescript
// REMOVE: Product metafield priority check
for (const line of lines) {
  if (line.merchandise?.product?.bundle_config?.value) {
    // ... entire product metafield processing
  }
}

// REMOVE: shopifyProductId fallback
else if (bundleConfig?.shopifyProductId) {
  // ... entire shopifyProductId block
}
```

**Keep only:**
- Shop metafield configuration matching
- Bundle parent variant ID validation
- Merge operation creation

### Step 5: Remove Legacy Bundle Configuration Processing

**Remove `processBundleConfiguration` function entirely** - this handles legacy formats we no longer support.

### Step 6: Update Error Messages

**Replace legacy-related error messages:**

```typescript
// CHANGE FROM:
"Ensure shop.all_bundles metafield is properly set with valid JSON array"
"Or ensure product-level $app:bundle_config metafields are available"

// CHANGE TO:
"Ensure shop.all_bundles metafield is properly set with valid JSON array"
"All bundle configurations must be stored in shop metafield"
```

## Simplified Architecture After Removal

### Single Processing Path:

1. **Input Validation** → Validate cart and input structure
2. **Shop Metafield Loading** → Load from `input.shop.all_bundles.value`
3. **Configuration Validation** → Validate and sanitize configurations
4. **Widget Bundle Processing** → Process cart line attributes
5. **Merge Operations** → Create merge operations for valid bundles

### Removed Complexity:

- ❌ Product metafield fallbacks
- ❌ Legacy configuration formats
- ❌ Standard Shopify metafield processing
- ❌ Bundle product line handling
- ❌ Multiple processing paths
- ❌ Format conversion logic

## Code Size Reduction

**Before:** ~2,300 lines
**After:** ~1,500 lines
**Reduction:** ~800 lines (35% smaller)

## Implementation Order

1. **Phase 1** (Safe): Remove unused functions that aren't called
2. **Phase 2** (Medium): Remove fallback logic from main function
3. **Phase 3** (High Impact): Simplify widget processing
4. **Phase 4** (Cleanup): Remove interface fields and update types

## Testing Strategy

1. **Before Removal**: Run all existing tests to establish baseline
2. **After Each Phase**: Ensure core functionality still works
3. **Integration Tests**: Verify shop metafield + widget flow works
4. **Edge Case Tests**: Ensure error handling still works properly

## Rollback Plan

If issues are discovered:

1. **Git Revert**: Each phase should be a separate commit for easy rollback
2. **Feature Flag**: Temporarily re-enable legacy code if needed
3. **Monitoring**: Watch for increased error rates or failed operations

## Success Metrics

- ✅ All tests pass with simplified code
- ✅ Performance improves (faster execution)
- ✅ Code coverage remains high
- ✅ No production errors increase
- ✅ Easier code maintenance and debugging

## Risk Mitigation

1. **Gradual Rollout**: Remove functions in dependency order
2. **Comprehensive Testing**: Test all bundle scenarios
3. **Monitoring**: Watch production metrics closely
4. **Documentation**: Update all relevant documentation
5. **Team Communication**: Ensure team understands changes

This plan will result in a much cleaner, more maintainable cart transform function that only uses the primary shop metafield + widget-based approach.