# Global Colors Intelligent Mapping System

## Overview

The Design Control Panel (DCP) now features an **intelligent color mapping system** that automatically cascades global colors to all relevant components throughout the bundle widget. This ensures brand consistency while maintaining the flexibility for component-specific customization.

## How It Works

### Core Principle

**Global colors act as smart defaults** that automatically apply to components unless a specific component color is explicitly set. This creates a cascading system where:

1. **Global colors** define your brand's primary color scheme
2. **Component colors** automatically inherit from global colors when not explicitly set
3. **Custom component colors** override global colors when needed

### Fallback Logic

```
Component Color = Custom Value || Global Color || Hard-coded Default
```

## Global Color Definitions

### 1. Primary Button Color (`globalPrimaryButtonColor`)
**Description:** Main color for all primary action buttons (Add to Cart, Next, etc.)

**Automatically applied to:**
- Add to Cart buttons (`buttonBgColor`)
- Quantity selector background (`quantitySelectorBgColor`)
- Footer Next button (`footerNextButtonBgColor`)
- Footer Next button border (`footerNextButtonBorderColor`)
- Active header tabs (`headerTabActiveBgColor`)
- Active tabs (`tabsActiveBgColor`)
- Tabs border (`tabsBorderColor`)
- Completed step background (`completedStepBgColor`)
- Completed step circle border (`completedStepCircleBorderColor`)
- Incomplete step circle stroke (`incompleteStepCircleStrokeColor`)
- Progress bar filled color (`stepBarProgressFilledColor`, `footerProgressBarFilledColor`)
- Toast background (`toastBgColor`)
- Footer scrollbar (`footerScrollBarColor`)
- Bundle upsell button (`bundleUpsellButtonBgColor`)
- Bundle upsell border (`bundleUpsellBorderColor`)
- Filter icon color (`filterIconColor`)

---

### 2. Button Text Color (`globalButtonTextColor`)
**Description:** Text color for all button labels and call-to-actions across the bundle

**Automatically applied to:**
- Button text (`buttonTextColor`)
- Quantity selector text (`quantitySelectorTextColor`)
- Footer Next button text (`footerNextButtonTextColor`)
- Active header tab text (`headerTabActiveTextColor`)
- Active tab text (`tabsActiveTextColor`)
- Completed step checkmark (`completedStepCheckMarkColor`)
- Add to Cart button text (`addToCartButtonTextColor`)
- Toast text (`toastTextColor`)
- Bundle upsell text (`bundleUpsellTextColor`)

---

### 3. Primary Text Color (`globalPrimaryTextColor`)
**Description:** Main text color for product titles, headings, and important content

**Automatically applied to:**
- Product card font color (`productCardFontColor`)
- Product final price color (`productFinalPriceColor`)
- Footer final price color (`footerFinalPriceColor`)
- Product page title (`productPageTitleFontColor`)
- Step name font color (`stepNameFontColor`)
- Inactive header tab text (`headerTabInactiveTextColor`)
- Inactive tab text (`tabsInactiveTextColor`)
- Filter text color (`filterTextColor`)
- Conditions text color (`conditionsTextColor`)
- Discount text color (`discountTextColor`)

---

### 4. Secondary Text Color (`globalSecondaryTextColor`)
**Description:** Supporting text for product descriptions, helper text, and subdued content

**Automatically applied to:**
- Product strike price color (`productStrikePriceColor`)
- Footer strike price color (`footerStrikePriceColor`)
- Empty state text (`emptyStateTextColor`)

---

### 5. Footer Background Color (`globalFooterBgColor`)
**Description:** Background color for all footer sections in the bundle widget

**Automatically applied to:**
- Footer background (`footerBgColor`)

---

### 6. Footer Text Color (`globalFooterTextColor`)
**Description:** Text color for all content and labels within footer sections

**Automatically applied to:**
- Footer Back button text (`footerBackButtonTextColor`)

---

## Usage Examples

### Example 1: Brand Consistency
Set your brand colors once in Global Colors, and they automatically apply across the entire widget:

```typescript
globalPrimaryButtonColor: "#7132FF"  // Purple
globalButtonTextColor: "#FFFFFF"     // White
globalPrimaryTextColor: "#111827"    // Dark Gray
```

**Result:** All buttons are purple with white text, all primary text is dark gray.

---

### Example 2: Selective Override
Use global colors but customize specific components:

```typescript
// Global colors
globalPrimaryButtonColor: "#000000"  // Black (default for all buttons)

// Component override
footerNextButtonBgColor: "#FF0000"   // Red (only Next button)
```

**Result:** Most buttons are black, but the Next button is red.

---

### Example 3: Rapid Theming
Change your entire widget theme by updating just the global colors:

**Before:**
```typescript
globalPrimaryButtonColor: "#000000"  // Black theme
```

**After:**
```typescript
globalPrimaryButtonColor: "#00FF00"  // Green theme
```

**Result:** All primary buttons, progress bars, active states, etc. instantly change to green.

---

## Benefits

### 1. **Brand Consistency**
Ensure all components follow your brand guidelines automatically

### 2. **Efficiency**
Set colors once instead of configuring each component individually

### 3. **Flexibility**
Override specific components when needed for unique designs

### 4. **Maintainability**
Update theme colors in one place to change the entire widget

### 5. **Reduced Configuration**
New components automatically inherit global colors without additional setup

---

## Component-Specific Colors

While global colors provide intelligent defaults, you can still set component-specific colors that override the global values:

| Component Setting | Global Fallback | Final Fallback |
|------------------|-----------------|----------------|
| `buttonBgColor` | `globalPrimaryButtonColor` | `#000000` |
| `buttonTextColor` | `globalButtonTextColor` | `#FFFFFF` |
| `productCardFontColor` | `globalPrimaryTextColor` | `#000000` |
| `productStrikePriceColor` | `globalSecondaryTextColor` | `#6B7280` |
| ... | ... | ... |

---

## CSS Generation

The intelligent mapping is implemented in the CSS generation function (`api.design-settings.$shopDomain.tsx`):

```typescript
function generateCSSFromSettings(s: any, bundleType: string): string {
  // Extract global colors with defaults
  const globalPrimaryButton = s.globalPrimaryButtonColor || '#000000';
  const globalButtonText = s.globalButtonTextColor || '#FFFFFF';
  const globalPrimaryText = s.globalPrimaryTextColor || '#000000';
  const globalSecondaryText = s.globalSecondaryTextColor || '#6B7280';
  const globalFooterBg = s.globalFooterBgColor || '#FFFFFF';
  const globalFooterText = s.globalFooterTextColor || '#000000';

  return `
    :root {
      /* Component colors with global fallbacks */
      --bundle-button-bg: ${s.buttonBgColor || globalPrimaryButton};
      --bundle-button-text-color: ${s.buttonTextColor || globalButtonText};
      /* ... */
    }
  `;
}
```

---

## Migration Notes

### Existing Configurations
Existing component-specific colors are preserved. The global colors only apply when component colors are **not set**.

### New Installations
New installations benefit immediately from global colors, requiring minimal configuration.

### Testing
Test your color changes in the DCP preview to ensure the desired appearance before saving.

---

## Best Practices

1. **Start with Global Colors**: Define your brand's primary colors in the Global Colors section first
2. **Preview Changes**: Use the DCP preview to see how colors apply across components
3. **Override Sparingly**: Only set component-specific colors when you need exceptions
4. **Document Custom Colors**: Keep track of which components have custom overrides
5. **Test Accessibility**: Ensure sufficient contrast between text and background colors

---

## Technical Implementation

**File:** `app/routes/api.design-settings.$shopDomain.tsx`

**Function:** `generateCSSFromSettings(s: any, bundleType: string): string`

**Mechanism:**
- Extract global colors with fallbacks
- Use JavaScript OR operator (`||`) for cascading fallbacks
- Generate CSS variables with intelligent defaults
- Apply CSS variables to component styles

---

## Future Enhancements

Potential future improvements to the global colors system:

1. **Color Presets**: Pre-defined color schemes (e.g., "Modern Dark", "Bright & Bold")
2. **Color Picker Sync**: Visual indication when a component uses a global color
3. **Override Indicators**: Show which components have custom colors vs global colors
4. **Color Harmony Suggestions**: AI-powered color palette recommendations
5. **Accessibility Checker**: Automatic contrast ratio validation

---

## Summary

The Global Colors Intelligent Mapping System provides a powerful, flexible way to manage your bundle widget's appearance. By setting global colors once, you ensure brand consistency across all components while retaining the ability to customize specific elements when needed.

**Key Takeaway:** Think of global colors as your brand's foundation—they automatically flow to all components unless you explicitly choose otherwise.