# Full-Page Bundle Implementation Plan

## Overview
This document outlines the implementation plan for adding Full-Page Bundle support to the Wolfpack: Product Bundles app.

## Current State
- ✅ Database has `bundleType` field with values: `product_page` | `full_page`
- ✅ Single configure route: `/app/bundles/cart-transform/configure/$bundleId`
- ✅ Single widget for all bundles
- ✅ Metafield sync system in place

## Target State
- 🎯 Two bundle types selectable at creation
- 🎯 Two configure routes:
  - `/app/bundles/product-page-bundle/configure/$bundleId`
  - `/app/bundles/full-page-bundle/configure/$bundleId`
- 🎯 Two widgets with shared components
- 🎯 Conditional widget loading based on bundleType
- 🎯 Metafields include bundleType for storefront

---

## Implementation Phases

### Phase 1: Database & Schema Review (15 min)
**Objective**: Verify database is ready for dual bundle types

**Tasks**:
- [x] Check Prisma schema for bundleType field
- [ ] Verify enum values are correct
- [ ] Test existing bundles have bundleType set
- [ ] Document any migration needs

**Files**:
- `prisma/schema.prisma`
- Database records

---

### Phase 2: Route Refactoring (45 min)
**Objective**: Split single configure route into two type-specific routes

#### 2.1 Rename Existing Route
**Current**: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
**New**: `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`

**Steps**:
1. Rename file
2. Update any internal route references
3. Test route still loads

#### 2.2 Create Full-Page Route
**New**: `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx`

**Steps**:
1. Duplicate product-page-bundle route
2. Keep identical structure initially
3. Update breadcrumbs/titles to reflect "Full Page Bundle"

#### 2.3 Update Navigation Helper
**New File**: `app/utils/bundle-routes.ts`

```typescript
export const getBundleConfigureRoute = (bundleId: string, bundleType: string) => {
  const routeBase = bundleType === 'full_page'
    ? 'full-page-bundle'
    : 'product-page-bundle';
  return `/app/bundles/${routeBase}/configure/${bundleId}`;
};
```

**Files to Update**:
- `app/routes/app.dashboard.tsx`
- `app/components/BundleSetupInstructions.tsx`
- Any component with bundle navigation

---

### Phase 3: Dashboard - Bundle Type Selection (60 min)
**Objective**: Allow users to choose bundle type during creation

#### 3.1 Update Create Bundle Modal UI
**File**: `app/routes/app.dashboard.tsx`

**UI Addition**:
```tsx
<FormLayout>
  {/* Existing fields */}
  <TextField label="Bundle name" ... />
  <TextField label="Description" ... />

  {/* NEW: Bundle Type Selection */}
  <BlockStack gap="200">
    <Text variant="headingSm" as="h4">Bundle Type</Text>
    <ChoiceList
      title=""
      choices={[
        {
          label: 'Product Page Bundle',
          value: 'product_page',
          helpText: 'Display bundle builder on existing product pages'
        },
        {
          label: 'Full Page Bundle',
          value: 'full_page',
          helpText: 'Create a dedicated landing page for your bundle'
        }
      ]}
      selected={[bundleType]}
      onChange={(value) => setBundleType(value[0])}
    />
  </BlockStack>
</FormLayout>
```

**State Management**:
```typescript
const [bundleType, setBundleType] = useState<'product_page' | 'full_page'>('product_page');
```

#### 3.2 Update Bundle Creation Action
**File**: `app/routes/app.dashboard.tsx` - action function

**Changes**:
```typescript
// Get bundleType from form
const bundleType = formData.get("bundleType") as string || 'product_page';

// Save to database
const newBundle = await db.bundle.create({
  data: {
    bundleType: bundleType,
    // ... other fields
  }
});

// Route based on type
const redirectUrl = getBundleConfigureRoute(newBundle.id, bundleType);
```

#### 3.3 Update Clone Bundle Logic
**File**: `app/routes/app.dashboard.tsx` - cloneBundle action

Preserve bundleType when cloning:
```typescript
bundleType: originalBundle.bundleType,
```

---

### Phase 4: Widget System (90 min)
**Objective**: Create separate widgets with shared components

#### 4.1 Current Structure Analysis
**Files to Review**:
- Current widget location (TBD - need to find)
- Components used by widget
- Styling approach

#### 4.2 Recommended Structure
```
app/assets/
├── bundle-widget-loader.tsx          # Main entry point
└── widgets/
    ├── shared/
    │   ├── StepSelector.tsx          # Shared component
    │   ├── ProductCard.tsx            # Shared component
    │   ├── QuantitySelector.tsx       # Shared component
    │   ├── PriceDisplay.tsx           # Shared component
    │   └── AddToCartButton.tsx        # Shared component
    ├── ProductPageBundleWidget.tsx    # Compact layout
    └── FullPageBundleWidget.tsx       # Full-width layout
```

#### 4.3 Widget Loader Implementation
**File**: `app/assets/bundle-widget-loader.tsx`

```typescript
import { ProductPageBundleWidget } from './widgets/ProductPageBundleWidget';
import { FullPageBundleWidget } from './widgets/FullPageBundleWidget';

const BundleWidgetLoader = () => {
  // Read bundleType from metafield or URL param
  const bundleData = useBundleMetafield();
  const bundleType = bundleData?.bundleType || 'product_page';

  if (bundleType === 'full_page') {
    return <FullPageBundleWidget data={bundleData} />;
  }

  return <ProductPageBundleWidget data={bundleData} />;
};
```

#### 4.4 Widget Layouts
**ProductPageBundleWidget**:
- Compact header
- Vertical step layout
- Fits in product page sidebar
- Mobile-first design

**FullPageBundleWidget**:
- Hero section with bundle image
- Horizontal step layout (desktop)
- Full-width cards
- Prominent CTA
- Trust badges
- Social proof section

---

### Phase 5: Metafields & Data Sync (45 min)
**Objective**: Ensure bundleType flows to storefront

#### 5.1 Update Metafield Sync Service
**File**: `app/services/bundles/metafield-sync.server.ts`

**Changes**:
```typescript
const bundleConfiguration = {
  bundleId: bundle.id,
  bundleType: bundle.bundleType,  // ADD THIS
  name: bundle.name,
  templateName: bundle.templateName,
  steps: [...],
  pricing: {...}
};
```

#### 5.2 Update Cart Transform Extension
**File**: `extensions/bundle-cart-transform-ts/src/run.ts`

**Read bundleType** (optional for now):
```typescript
const bundleConfig = JSON.parse(metafield.value);
const bundleType = bundleConfig.bundleType || 'product_page';

// Use for any type-specific logic
if (bundleType === 'full_page') {
  // Full page bundle logic (if needed)
}
```

---

### Phase 6: Testing & Validation (60 min)

#### 6.1 Test Bundle Creation Flow
- [ ] Create product page bundle → Routes to correct page
- [ ] Create full page bundle → Routes to correct page
- [ ] Clone product page bundle → Preserves type
- [ ] Clone full page bundle → Preserves type

#### 6.2 Test Navigation
- [ ] Dashboard "Edit" button uses correct route
- [ ] Breadcrumbs display correct type
- [ ] All links work correctly

#### 6.3 Test Widget Loading
- [ ] Product page bundle loads correct widget
- [ ] Full page bundle loads correct widget
- [ ] Metafield includes bundleType
- [ ] Widget reads bundleType correctly

#### 6.4 Test Metafield Sync
- [ ] Save bundle → Metafield updated with bundleType
- [ ] Cart transform reads bundleType
- [ ] Both types work in cart

---

## Files That Will Be Modified

### New Files
- `app/utils/bundle-routes.ts`
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx`
- `app/assets/widgets/FullPageBundleWidget.tsx`
- `app/assets/widgets/ProductPageBundleWidget.tsx`
- `app/assets/widgets/shared/` (various components)
- `FULL_PAGE_BUNDLE_IMPLEMENTATION_PLAN.md`

### Modified Files
- `app/routes/app.dashboard.tsx` (bundle type selection)
- `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx` (rename to product-page-bundle)
- `app/services/bundles/metafield-sync.server.ts` (add bundleType)
- `extensions/bundle-cart-transform-ts/src/run.ts` (read bundleType)
- `app/components/BundleSetupInstructions.tsx` (route updates)
- Any component with bundle navigation

---

## Implementation Timeline

**Estimated Total Time**: 5-6 hours

| Phase | Duration | Priority |
|-------|----------|----------|
| Database Review | 15 min | High |
| Route Refactoring | 45 min | High |
| Dashboard UI | 60 min | High |
| Widget System | 90 min | High |
| Metafield Updates | 45 min | High |
| Testing | 60 min | High |
| Documentation | 30 min | Medium |

---

## Future Enhancements (Post-MVP)

### Configure Page Differences
- [ ] Full-page specific settings
- [ ] Hero section builder
- [ ] Landing page SEO settings
- [ ] Custom layout options

### Widget Customization
- [ ] Drag-and-drop layout builder
- [ ] Template selection
- [ ] Advanced styling options

### Analytics
- [ ] Track bundle type performance
- [ ] A/B testing between types

---

## Risk Mitigation

### Potential Issues
1. **Route conflicts**: Test thoroughly after renaming
2. **Widget loading bugs**: Implement fallback to product-page widget
3. **Metafield migration**: Existing bundles may not have bundleType set

### Mitigation Strategies
1. **Comprehensive testing** before production deploy
2. **Default to product_page** for backward compatibility
3. **Database migration** to set bundleType for existing bundles

---

## Success Criteria

- [x] Users can select bundle type during creation
- [ ] Both routes work correctly
- [ ] Correct widget loads based on type
- [ ] Metafields include bundleType
- [ ] Cart transform works for both types
- [ ] No existing functionality breaks

---

## Notes

- Storefront UI for full-page widget will be provided later
- For now, both widgets can share same layout
- Focus on infrastructure first, then UI customization
- Keep both configure pages identical initially

---

**Last Updated**: 2025-12-17
**Status**: Ready for implementation
