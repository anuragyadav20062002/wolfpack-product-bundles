# Design Control Panel Components

This directory contains extracted components from the `app.design-control-panel.tsx` file to improve code organization and maintainability.

## Directory Structure

```
design-control-panel/
├── common/
│   ├── ColorPicker.tsx          # Reusable color picker component
│   └── ArrowLabel.tsx            # Professional arrow label with directional support
├── preview/
│   ├── ProductCardPreview.tsx    # Product card preview component
│   ├── BundleFooterPreview.tsx   # Bundle footer preview component (4 subsections)
│   ├── BundleHeaderPreview.tsx   # Bundle header preview component (2 subsections)
│   └── GeneralPreview.tsx        # General section preview component (3 subsections)
├── icons/
│   └── index.tsx                 # Centralized SVG icons (ShoppingCartIcon, PlusIcon, ImagePlaceholderIcon)
├── settings/
│   └── (To be extracted)         # Settings panel components
├── constants.ts                  # Shared constants (options, etc.)
├── types.ts                      # TypeScript interfaces
├── NavigationItem.tsx            # Navigation sidebar item component
└── README.md                     # This file
```

## Completed Refactoring

### ✅ Extracted Components

1. **ColorPicker** (`common/ColorPicker.tsx`)
   - Standalone color picker with hex validation
   - Used throughout settings panels

2. **ArrowLabel** (`common/ArrowLabel.tsx`)
   - Professional arrow component with right-angle bends
   - Supports 4 directions: top, bottom, left, right
   - Configurable distances and offsets

3. **NavigationItem** (`NavigationItem.tsx`)
   - Reusable navigation sidebar item
   - Supports parent/child hierarchy
   - Handles active/expanded states

4. **ProductCardPreview** (`preview/ProductCardPreview.tsx`)
   - Complete product card preview with all style props
   - Includes arrows for all sub-components
   - Replaces 180+ lines of JSX in main file

5. **Constants** (`constants.ts`)
   - Bundle type options
   - Image fit options
   - Cards per row options

6. **Types** (`types.ts`)
   - DesignSettings interface
   - NavigationItemProps interface

7. **BundleFooterPreview** (`preview/BundleFooterPreview.tsx`)
   - Complete bundle footer preview with 4 subsections
   - footer, footerPrice, footerButton, footerDiscountProgress
   - Replaces 428 lines of JSX in main file
   - Uses centralized ShoppingCartIcon

8. **BundleHeaderPreview** (`preview/BundleHeaderPreview.tsx`)
   - Complete bundle header preview with 2 subsections
   - headerTabs, headerText
   - Replaces 147 lines of JSX in main file

9. **GeneralPreview** (`preview/GeneralPreview.tsx`)
   - General section preview with 3 subsections
   - emptyState, addToCartButton, toasts
   - Replaces 146 lines of JSX in main file
   - Uses centralized PlusIcon

10. **Centralized SVG Icons** (`icons/index.tsx`)
    - ShoppingCartIcon: E-commerce style shopping cart
    - PlusIcon: Plus icon for empty states
    - ImagePlaceholderIcon: Image placeholder icon
    - All icons are TypeScript components with proper typing
    - Reduces code duplication across preview components

## How to Continue Refactoring

The main file still contains several large sections that should be extracted:

### 1. Settings Components (Priority: High)

Extract settings panels into `settings/` directory:

- **GlobalColorSettings.tsx**
- **ProductCardSettings.tsx**
- **BundleFooterSettings.tsx**
- **BundleHeaderSettings.tsx**
- **GeneralSettings.tsx**

### 2. Navigation Panel (Priority: Medium)

Create **NavigationPanel.tsx** that includes:
- All NavigationItem instances
- Collapsible logic
- Section management

## Pattern to Follow

### For Preview Components:

```tsx
// BundleFooterPreview.tsx
import { Text } from "@shopify/polaris";
import { ArrowLabel } from "../common/ArrowLabel";

interface BundleFooterPreviewProps {
  footerBgColor: string;
  footerTotalBgColor: string;
  // ... other props
}

export function BundleFooterPreview(props: BundleFooterPreviewProps) {
  const { footerBgColor, footerTotalBgColor, ... } = props;

  return (
    // JSX content
  );
}
```

### For Settings Components:

```tsx
// ProductCardSettings.tsx
import { BlockStack } from "@shopify/polaris";
import { ColorPicker } from "../common/ColorPicker";

interface ProductCardSettingsProps {
  productCardBgColor: string;
  setProductCardBgColor: (value: string) => void;
  // ... other props
}

export function ProductCardSettings(props: ProductCardSettingsProps) {
  // Settings panel JSX
}
```

## Usage in Main File

After extraction, import and use components:

```tsx
import { ProductCardPreview } from "../components/design-control-panel/preview/ProductCardPreview";
import { ProductCardSettings } from "../components/design-control-panel/settings/ProductCardSettings";

// In renderPreviewContent:
return <ProductCardPreview {...props} />;

// In renderSettingsPanel:
return <ProductCardSettings {...props} />;
```

## Benefits

- **Reduced file size**: Main file reduced from 5000+ lines
- **Better organization**: Logical grouping of related components
- **Improved maintainability**: Easier to find and update specific sections
- **Reusability**: Components can be reused or tested independently
- **Type safety**: Clear prop interfaces for each component

## Testing

After each extraction:
1. Run `npm run build` to ensure no TypeScript errors
2. Test the functionality in the UI
3. Verify all arrows and styling remain intact

## Next Steps

1. ✅ ~~Extract BundleFooterPreview component (4 subsections)~~
2. ✅ ~~Extract BundleHeaderPreview component (2 subsections)~~
3. ✅ ~~Extract GeneralPreview component (3 subsections)~~
4. ✅ ~~Create centralized SVG icons module~~
5. Extract all settings panel components
6. Create NavigationPanel component
7. Update NavigationItem usages to pass isExpanded/isActive props explicitly

## Summary of Improvements

The Design Control Panel has been significantly refactored:
- **Main file reduced from 4,644 lines to ~4,000 lines** (14% reduction)
- **10 reusable components extracted** for better organization
- **Centralized SVG icons** for consistency and maintainability
- **All preview components** properly separated and testable
- **Global color system** with intelligent cascading implemented
