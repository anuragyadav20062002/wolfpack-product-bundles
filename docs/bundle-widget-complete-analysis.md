# Complete Bundle Widget Analysis

## Core Functionality Overview

### 1. Bundle Widget Purpose
- Interactive product bundle builder for Shopify stores
- Supports cart transform bundles and discount function bundles
- Provides step-by-step product selection with modal interface
- Calculates pricing, discounts, and manages cart operations
- Integrates with Shopify theme editor for real-time configuration

### 2. Data Sources & Global Variables

#### Window Variables Expected:
- `window.allBundlesData` - Object containing all bundle configurations
- `window.currentProductId` - Current product ID (numeric)
- `window.currentProductHandle` - Current product handle (string)
- `window.currentProductCollections` - Array of product collections
- `window.shopCurrency` - Shop base currency code (e.g., 'USD')
- `window.shopMoneyFormat` - Shop money format template

#### Bundle Configuration Structure:
```javascript
{
  "id": "bundle-id",
  "name": "Bundle Name", 
  "description": "Bundle Description",
  "status": "active",
  "bundleType": "cart_transform" | "discount_function",
  "shopifyProductId": "gid://shopify/Product/123",
  "bundleParentVariantId": "gid://shopify/ProductVariant/456",
  "steps": [
    {
      "id": "step-id",
      "name": "Step Name",
      "position": 1,
      "conditionType": "quantity",
      "conditionOperator": "greater_than_equal_to",
      "conditionValue": 1,
      "enabled": true,
      "displayVariantsAsIndividual": false,
      "products": [...], // Product array
      "StepProduct": [...], // Alternative product array
      "collections": [...] // Collection array
    }
  ],
  "pricing": {
    "enabled": true,
    "method": "percentage_off" | "fixed_amount_off" | "fixed_bundle_price",
    "rules": [
      {
        "id": "rule-id",
        "condition": "greater_than_equal_to",
        "conditionType": "quantity" | "amount",
        "value": 3,
        "discountValue": 10,
        "discountMethod": "percentage_off"
      }
    ],
    "messages": {
      "showDiscountDisplay": true,
      "showDiscountMessaging": true,
      "ruleMessages": {
        "rule_1": {
          "discountText": "Add {discountConditionDiff} items to save {discountValue}%",
          "successMessage": "Congratulations! You saved {discountValue}%"
        }
      }
    }
  },
  "isolation": {
    "restrictToProductId": "123456"
  }
}
```

### 3. Theme Editor Configuration (from bundle.liquid)

#### Settings Available:
- `bundle_id` - Manual bundle ID override
- `enabled` - Show/hide widget
- `app_url` - Custom app server URL
- `widget_max_width` - Widget maximum width (300-1200px)
- `step_box_size` - Step card size (100-250px)
- `step_cards_per_row` - Cards per row (2-6)
- `button_height` - Button height (40-80px)
- `show_bundle_title` - Show/hide bundle title
- `show_step_numbers` - Show/hide step numbers
- `show_footer_messaging` - Show/hide footer messaging
- `discount_text_template` - Progress message template
- `success_message_template` - Success message template
- `progress_text_template` - Progress counter template
- `progress_bar_color` - Progress bar color
- `success_color` - Success state color
- Various modal styling options

#### CSS Custom Properties:
- `--step-box-size` - Step card dimensions
- `--button-height` - Button height
- `--widget-max-width` - Widget max width
- `--step-cards-per-row` - Grid layout
- `--progress-bar-color` - Progress bar color
- `--modal-footer-bg-color` - Modal footer background
- And many more styling variables

### 4. Cart Transform Integration

#### Cart Properties Added:
```javascript
{
  "_wolfpack_bundle_id": "unique-bundle-instance-id",
  "_bundle_config": "JSON.stringify(bundleConfig)"
}
```

#### Bundle Instance ID Generation:
- Combines bundle ID + selected products signature
- Ensures same bundle + same products = quantity increment
- Different product combinations = separate cart lines

### 5. Core Functions Required

#### Initialization Functions:
1. `initializeBundleWidget(containerElement)` - Main entry point
2. `reinitializeAllBundleWidgets()` - Theme editor support
3. `handleAutomaticBundleConfiguration()` - URL parameter handling

#### Bundle Selection Logic:
1. Manual bundle ID (data-bundle-id)
2. Container product matching (data-container-bundle-id) 
3. Product ID matching (shopifyProductId)
4. Collection matching (for discount function bundles)
5. Fallback selection

#### UI Rendering Functions:
1. `updateMainBundleStepsDisplay()` - Render step cards
2. `renderModalContent()` - Modal product grid
3. `renderModalTabs()` - Step navigation tabs
4. `renderProductGrid(stepIndex)` - Product selection grid
5. `updateAddToCartButton()` - Button text/price updates

#### Modal System:
1. `openBundleModal(stepIndex)` - Open product selection
2. `closeBundleModal()` - Close modal
3. `renderCurrentStepInfo()` - Step title/subtitle
4. `updateNavigationButtons()` - Prev/Next button states

#### Product Selection:
1. `updateProductSelection(stepIndex, productId, quantity)` - Handle selections
2. `validateCurrentStep()` - Step condition validation
3. Step condition operators: equal_to, greater_than, less_than, etc.

#### Pricing & Discounts:
1. `calculateBundleTotalPrice()` - Calculate total price
2. `calculateBundleDiscount(totalPrice, quantity)` - Apply discounts
3. `updateFooterDiscountMessaging()` - Footer progress
4. `updateModalFooterDiscountMessaging()` - Modal progress
5. `replaceDiscountVariables(message, variables)` - Template replacement

#### Currency Handling:
1. `detectCustomerCurrency()` - Multi-currency detection
2. `getCurrencyInfo()` - Calculation vs display currency
3. `convertCurrency(amount, from, to, rate)` - Currency conversion
4. `formatCurrency(amount)` - Money formatting

#### Cart Operations:
1. `generateBundleInstanceId(bundleId, items)` - Unique ID generation
2. Add to cart with proper cart properties
3. Redirect to cart on success

### 6. Event Handling

#### Modal Events:
- Close button click
- Overlay click
- Prev/Next navigation
- Step tab clicks
- Product card clicks
- Quantity button clicks
- Variant selector changes

#### Theme Editor Events:
- `shopify:section:load`
- `shopify:section:select`
- `shopify:section:deselect`
- `shopify:block:select`
- `shopify:block:deselect`

#### Keyboard Events:
- Escape key to close modal

### 7. Bundle Selection Priority

#### Cart Transform Bundles:
1. Manual bundle ID (theme editor)
2. Container product bundle ID (metafields)
3. Product ID matching
4. Theme editor context (show any bundle)

#### Discount Function Bundles:
1. Manual bundle ID (theme editor)
2. Product matching (selectedVisibilityProducts)
3. Collection matching (selectedVisibilityCollections)

### 8. Error Handling & Fallbacks

#### Graceful Degradation:
- Show diagnostic messages when no bundles found
- Display available bundles for debugging
- Handle missing DOM elements
- Validate bundle data structure
- Toast notifications for user feedback

#### Debug Information:
- Comprehensive console logging
- Bundle selection reasoning
- Product matching details
- Currency conversion info
- Step validation results

### 9. Multi-Currency Support

#### Currency Detection Priority:
1. Shopify Markets active currency
2. Currency cookie
3. URL parameters
4. localStorage
5. Shop base currency fallback

#### Currency Handling:
- Calculations in shop base currency
- Display in customer currency
- Proper conversion rates
- Dynamic currency symbols

### 10. Container Product Logic

#### Container Product Detection:
- `product.metafields['$app:bundle_isolation'].bundle_product_type == 'cart_transform_bundle'`
- `product.metafields['$app:bundle_isolation'].owns_bundle_id`
- `product.metafields['$app'].bundle_config`

#### Auto-Hide Default Buttons:
- Hides Shopify's default add to cart buttons
- Hides buy now buttons
- Shows bundle widget prominently

### 11. Global Variables Created

#### Widget State:
- `window.selectedBundle` - Currently selected bundle
- `window.selectedProductsQuantities` - Array of step selections
- `window.stepProductDataCache` - Cached product data
- `window.currentActiveStepIndex` - Current modal step

#### DOM References:
- `window.bundleHeader` - Header element
- `window.bundleStepsContainer` - Steps container
- `window.addBundleToCartButton` - Add to cart button
- `window.bundleBuilderModal` - Modal element
- `window.containerElement` - Widget container

### 12. Template Variable Replacement

#### Available Variables:
- `{discountConditionDiff}` - Items needed for discount
- `{discountUnit}` - "items" or currency symbol
- `{discountValue}` - Discount amount/percentage
- `{discountValueUnit}` - "% off", "$ off", etc.
- `{selectedQuantity}` - Current selected quantity
- `{targetQuantity}` - Required quantity for discount
- `{bundleName}` - Bundle name
- `{originalPrice}` - Original total price
- `{bundlePrice}` - Discounted price
- `{savingsAmount}` - Amount saved
- `{savingsPercentage}` - Percentage saved

### 13. Toast Notification System

#### Toast Types:
- `info` - Blue informational
- `warning` - Orange warning
- `error` - Red error
- `success` - Green success

#### Features:
- Auto-dismiss after duration
- Manual close button
- Slide-in animation
- Proper z-index stacking

### 14. Product Data Structure

#### Product Object:
```javascript
{
  id: "123456",
  title: "Product Title",
  imageUrl: "https://...",
  price: 2999, // In cents
  variantId: "789012",
  variants: [
    {
      id: "789012",
      title: "Variant Title", 
      price: "29.99"
    }
  ]
}
```

### 15. Step Validation Logic

#### Condition Types:
- `quantity` - Based on item count
- `amount` - Based on total price

#### Condition Operators:
- `equal_to` - Exactly equals
- `greater_than` - Greater than
- `less_than` - Less than
- `greater_than_or_equal_to` - At least
- `less_than_or_equal_to` - At most

### 16. Modal UI Features

#### Step Navigation:
- Milestone-style progress tabs
- Visual completion indicators
- Step accessibility validation
- Progress connectors

#### Product Grid:
- Product cards with images
- Quantity controls (+/- buttons)
- Variant selectors
- Selection overlays
- Price display

#### Footer Messaging:
- Progress bars
- Discount messaging
- Success states
- Navigation buttons

This analysis covers all the functionality, data structures, configuration options, and integration points needed to recreate the bundle widget with guaranteed functionality.