# Bundle Discount Function Extension

This Shopify Function extension automatically applies discounts to cart items based on user-configured bundle conditions. It integrates with the Wolfpack Product Bundles app to provide dynamic discount generation.

## Features

### Supported Discount Types

- **Fixed Amount Off**: Apply a specific dollar amount discount
- **Percentage Off**: Apply a percentage-based discount
- **Free Shipping**: Provide free shipping when bundle conditions are met

### Bundle Condition Types

- **Product Matching**: Match specific products in the cart
- **Collection Matching**: Match products from specific collections
- **Quantity Conditions**:
  - Equal to
  - Greater than
  - Less than
  - Greater than or equal to
  - Less than or equal to

### Step-based Bundle Logic

- Multiple steps with individual product/collection requirements
- Minimum and maximum quantity per step
- Conditional logic per step
- Enable/disable individual steps

## How It Works

### 1. Bundle Configuration

Users configure bundles through the Wolfpack Product Bundles app with:

- Multiple steps containing products and/or collections
- Quantity requirements and conditions
- Discount settings (type, amount, rules)

### 2. Metafield Storage

Bundle configuration is stored in product metafields:

- **Namespace**: `bundle_discounts`
- **Key**: `discount_settings`
- **Type**: `json`

### 3. Cart Analysis

When a cart is processed, the function:

1. Scans cart items for bundle metafields
2. Parses bundle configuration
3. Validates cart contents against bundle conditions
4. Applies appropriate discounts if conditions are met

### 4. Discount Application

- **Cart Lines Discounts**: Handles fixed amount and percentage discounts
- **Delivery Options Discounts**: Handles free shipping discounts

## File Structure

```
src/
├── bundle-utils.ts                    # Shared utility functions
├── cart_lines_discounts_generate_run.ts      # Main discount logic
├── cart_delivery_options_discounts_generate_run.ts  # Free shipping logic
├── input.graphql                      # GraphQL query for cart data
└── cart_lines_discounts_generate_run.test.ts # Test suite
```

## Bundle Data Structure

```typescript
interface BundleData {
  id: string;
  name: string;
  steps: BundleStep[];
  pricing: {
    enableDiscount: boolean;
    discountMethod: "fixed_amount_off" | "percentage_off" | "free_shipping";
    rules: DiscountRule[];
  } | null;
}

interface BundleStep {
  id: string;
  name: string;
  products: BundleProduct[];
  collections: Array<{ id: string; title: string }>;
  minQuantity: number;
  maxQuantity: number;
  conditionType?: string;
  conditionValue?: number;
  enabled?: boolean;
}

interface DiscountRule {
  discountOn: string;
  minimumQuantity: number;
  fixedAmountOff: number;
  percentageOff: number;
}
```

## Usage Examples

### Example 1: Buy 2 Get 1 Free Bundle

```json
{
  "id": "bundle-1",
  "name": "Buy 2 Get 1 Free",
  "steps": [
    {
      "id": "step-1",
      "name": "Select Products",
      "products": [
        { "id": "gid://shopify/Product/123", "title": "Product A" },
        { "id": "gid://shopify/Product/456", "title": "Product B" }
      ],
      "collections": [],
      "minQuantity": 2,
      "maxQuantity": 10,
      "enabled": true
    }
  ],
  "pricing": {
    "enableDiscount": true,
    "discountMethod": "fixed_amount_off",
    "rules": [
      {
        "discountOn": "quantity",
        "minimumQuantity": 2,
        "fixedAmountOff": 15.0,
        "percentageOff": 0
      }
    ]
  }
}
```

### Example 2: Collection-based Free Shipping

```json
{
  "id": "bundle-2",
  "name": "Free Shipping on Electronics",
  "steps": [
    {
      "id": "step-1",
      "name": "Electronics Collection",
      "products": [],
      "collections": [
        { "id": "gid://shopify/Collection/789", "title": "Electronics" }
      ],
      "minQuantity": 1,
      "maxQuantity": 5,
      "enabled": true
    }
  ],
  "pricing": {
    "enableDiscount": true,
    "discountMethod": "free_shipping",
    "rules": [
      {
        "discountOn": "quantity",
        "minimumQuantity": 1,
        "fixedAmountOff": 0,
        "percentageOff": 0
      }
    ]
  }
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Development

### Building the Function

```bash
npm run build
```

### Preview the Function

```bash
npm run preview
```

### Type Generation

```bash
npm run typegen
```

## Integration with Wolfpack App

This function works in conjunction with the Wolfpack Product Bundles app:

1. **Bundle Creation**: Users create bundles through the app interface
2. **Metafield Setup**: Bundle data is stored in product metafields
3. **Cart Processing**: This function reads metafields and applies discounts
4. **Real-time Updates**: Discounts are calculated dynamically as cart contents change

## Error Handling

The function includes comprehensive error handling:

- Invalid JSON in metafields
- Missing or malformed bundle data
- Cart items without required metafields
- Graceful fallback when conditions aren't met

## Performance Considerations

- Efficient cart scanning with early returns
- Minimal GraphQL queries
- Shared utility functions to reduce code duplication
- Optimized condition checking algorithms

## Troubleshooting

### Common Issues

1. **No discounts applied**: Check that bundle metafields are properly set
2. **Wrong discount amounts**: Verify bundle pricing configuration
3. **Conditions not met**: Ensure cart contains required products/collections
4. **Free shipping not working**: Check delivery options discount function

### Debug Steps

1. Verify metafield data structure
2. Check cart contents against bundle conditions
3. Validate discount class permissions
4. Review function logs for errors

## Support

For issues or questions:

1. Check the test suite for expected behavior
2. Review bundle configuration in the Wolfpack app
3. Verify metafield data structure
4. Check Shopify Function logs
