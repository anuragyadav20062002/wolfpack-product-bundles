# Design Control Panel Components

This directory contains extracted components from the `app.design-control-panel.tsx` file to improve code organization and maintainability.

## Directory Structure

```
design-control-panel/
├── common/
│   ├── ColorPicker.tsx        # Reusable color picker component
│   └── ArrowLabel.tsx          # Professional arrow label with directional support
├── preview/
│   └── ProductCardPreview.tsx  # Product card preview component
├── settings/
│   └── (To be extracted)       # Settings panel components
├── constants.ts                # Shared constants (options, etc.)
├── types.ts                    # TypeScript interfaces
├── NavigationItem.tsx          # Navigation sidebar item component
└── README.md                   # This file
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

## How to Continue Refactoring

The main file still contains several large sections that should be extracted:

### 1. Preview Components (Priority: High)

Extract these preview sections into `preview/` directory:

- **BundleFooterPreview.tsx** - Extract all footer subsections:
  - `if (activeSubSection === "footer")`
  - `if (activeSubSection === "footerPrice")`
  - `if (activeSubSection === "footerButton")`
  - `if (activeSubSection === "footerDiscountProgress")`

- **BundleHeaderPreview.tsx** - Extract header subsections:
  - `if (activeSubSection === "headerTabs")`
  - `if (activeSubSection === "headerText")`

- **GeneralPreview.tsx** - Extract general subsections:
  - `if (activeSubSection === "emptyState")`
  - `if (activeSubSection === "addToCartButton")`
  - `if (activeSubSection === "toasts")`
  - `if (activeSubSection === "filters")`

### 2. Settings Components (Priority: High)

Extract settings panels into `settings/` directory:

- **GlobalColorSettings.tsx**
- **ProductCardSettings.tsx**
- **BundleFooterSettings.tsx**
- **BundleHeaderSettings.tsx**
- **GeneralSettings.tsx**

### 3. Navigation Panel (Priority: Medium)

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

1. Extract BundleFooterPreview component (4 subsections)
2. Extract BundleHeaderPreview component (2 subsections)
3. Extract GeneralPreview component (4 subsections)
4. Extract all settings panel components
5. Create NavigationPanel component
6. Update NavigationItem usages to pass isExpanded/isActive props explicitly
