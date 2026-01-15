# Cart Transform Function

**Last Updated:** January 14, 2026

## Overview

The Cart Transform Function is a Shopify Function (written in Rust) that applies bundle discounts at checkout. It runs on every cart update and transforms the cart to apply bundle-specific pricing rules.

**Location:** `extensions/bundle-cart-transform-ts/`
**Language:** Rust (via Shopify Function templates)
**Runtime:** Shopify Function sandbox
**Trigger:** Cart updates (add/remove items, quantity changes)

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      Customer Cart                          │
│                                                             │
│  - T-Shirt (1x $29.99)                                     │
│  - Shorts (1x $39.99)                                      │
│  - Hat (1x $19.99)                                         │
│  _bundle_id: cm5abc123                                     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Cart Transform Function (Rust)                  │
│                                                             │
│  1. Read cart items and properties                         │
│  2. Identify bundle items via _bundle_id                   │
│  3. Fetch bundle configuration from metafield              │
│  4. Validate bundle composition                            │
│  5. Calculate applicable discount                          │
│  6. Return cart transformations                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Transformed Cart                         │
│                                                             │
│  - T-Shirt (1x $29.99) → $23.99 (20% off)                 │
│  - Shorts (1x $39.99) → $31.99 (20% off)                  │
│  - Hat (1x $19.99) → $15.99 (20% off)                     │
│  Bundle Discount: -$18.00                                  │
│  Total: $71.97 (was $89.97)                                │
└─────────────────────────────────────────────────────────────┘
```

## Input Query

The function receives cart data via GraphQL input query:

**File:** `extensions/bundle-cart-transform-ts/input.graphql`

```graphql
query Input {
  cart {
    lines {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          product {
            id
            metafield(namespace: "wolfpack", key: "bundle_config") {
              value
            }
          }
        }
      }
      attributes {
        key
        value
      }
    }
  }
}
```

**What This Queries:**
- All cart lines (items)
- Quantity per item
- Product variant ID
- Parent product ID
- Bundle configuration metafield
- Cart line attributes (`_bundle_id`, `_bundle_step_id`, etc.)

## Bundle Identification

### Cart Line Attributes

Bundle items include special attributes:

```json
{
  "attributes": [
    {"key": "_bundle_id", "value": "cm5abc123"},
    {"key": "_bundle_step_id", "value": "step-1"},
    {"key": "_bundle_product_id", "value": "gid://shopify/Product/123"}
  ]
}
```

**Attribute Purpose:**
- `_bundle_id` - Bundle identifier (links items together)
- `_bundle_step_id` - Which step this item belongs to
- `_bundle_product_id` - Product within bundle (for tracking)

### Metafield Structure

Bundle configuration stored in product metafield:

**Namespace:** `wolfpack`
**Key:** `bundle_config`

**Example Value:**
```json
{
  "bundleId": "cm5abc123",
  "bundleType": "product_page",
  "steps": [
    {
      "stepId": "step-1",
      "name": "Choose Base",
      "minQuantity": 1,
      "maxQuantity": 1
    }
  ],
  "pricing": {
    "enabled": true,
    "method": "percentage_off",
    "rules": [
      {
        "condition": {"type": "quantity", "operator": ">=", "value": 3},
        "discount": {"type": "percentage_off", "value": 20}
      }
    ]
  }
}
```

## Discount Calculation Logic

### 1. Group Cart Items by Bundle

```rust
// Pseudocode
let mut bundles: HashMap<String, Vec<CartLine>> = HashMap::new();

for line in cart.lines {
    if let Some(bundle_id) = line.attributes.get("_bundle_id") {
        bundles.entry(bundle_id).or_insert(vec![]).push(line);
    }
}
```

### 2. Validate Bundle Composition

For each bundle:

```rust
// Check each step has required items
for step in bundle_config.steps {
    let step_items = bundle_items.filter(|item| item.step_id == step.id);
    let quantity = step_items.sum(|item| item.quantity);

    if quantity < step.minQuantity || quantity > step.maxQuantity {
        // Invalid bundle - skip discount
        return None;
    }
}
```

### 3. Find Applicable Discount

```rust
// Check pricing rules in order
let total_quantity = bundle_items.sum(|item| item.quantity);
let total_amount = bundle_items.sum(|item| item.price * item.quantity);

let mut applicable_discount = None;

for rule in pricing.rules.sort_by(|a, b| b.condition.value.cmp(&a.condition.value)) {
    if rule.condition.type == "quantity" && total_quantity >= rule.condition.value {
        applicable_discount = Some(rule.discount);
        break;
    }
    else if rule.condition.type == "subtotal" && total_amount >= rule.condition.value {
        applicable_discount = Some(rule.discount);
        break;
    }
}
```

### 4. Calculate Discount Per Item

Discount is distributed proportionally across all bundle items:

**Example:**
```
Bundle Total: $100
Discount: 20% off → $20 discount
Items: 5 products

Item 1: $30 → Discount: $6 (30/100 * $20)
Item 2: $25 → Discount: $5 (25/100 * $20)
Item 3: $20 → Discount: $4 (20/100 * $20)
Item 4: $15 → Discount: $3 (15/100 * $20)
Item 5: $10 → Discount: $2 (10/100 * $20)
```

**Rust Code:**
```rust
let discount_ratio = match discount_type {
    PercentageOff(percent) => percent / 100.0,
    FixedAmountOff(amount) => amount / total_amount,
    FixedBundlePrice(price) => (total_amount - price) / total_amount,
    _ => 0.0,
};

for item in bundle_items {
    let item_discount = item.price * item.quantity * discount_ratio;
    transformations.push(CartTransformation {
        line_id: item.id,
        discount: item_discount,
    });
}
```

## Output Format

The function returns cart transformations:

```json
{
  "operations": [
    {
      "update": {
        "cartLineId": "gid://shopify/CartLine/abc123",
        "price": {
          "fixedPricePerUnit": {
            "amount": "23.99"
          }
        }
      }
    },
    {
      "update": {
        "cartLineId": "gid://shopify/CartLine/def456",
        "price": {
          "fixedPricePerUnit": {
            "amount": "31.99"
          }
        }
      }
    }
  ]
}
```

**Operation Types:**
- `update` - Modify existing cart line (apply discount)
- `merge` - Combine cart lines (not used currently)
- `expand` - Split cart line (not used currently)

## Deployment

### Local Development

```bash
cd extensions/bundle-cart-transform-ts
npm install
npm run dev
```

### Deploy to Shopify

```bash
# From project root
shopify app deploy

# Or from extension directory
cd extensions/bundle-cart-transform-ts
npm run deploy
```

**Deployment Process:**
1. Code compiled to WebAssembly
2. Uploaded to Shopify
3. Function ID generated
4. Auto-activated for shop

### Function Configuration

**File:** `extensions/bundle-cart-transform-ts/shopify.extension.toml`

```toml
api_version = "2024-10"

[[extensions]]
type = "function"
name = "bundle-cart-transform"
handle = "bundle-cart-transform"

[extensions.build]
command = "cargo wasi build --release"
path = "target/wasm32-wasi/release/bundle_cart_transform.wasm"

[extensions.ui]
enable_create = true
paths.create = "/cart-transform"
```

## Limitations

### Shopify Function Constraints

**Execution Time:** 5ms maximum
- Must complete quickly
- Heavy computations not feasible
- Use simple algorithms

**Memory:** 10MB maximum
- Minimal data structures
- No large allocations
- Stream processing preferred

**Network:** No external calls allowed
- Cannot fetch data from APIs
- All data from input query
- Pure function execution

**Size:** 1MB maximum (compiled WASM)
- Keep dependencies minimal
- Optimize bundle size

### Workarounds

**Pre-compute:** Store computed values in metafield
**Simplify Logic:** Use straightforward discount rules
**Cache:** Metafield acts as cache for bundle config
**Fallback:** Gracefully handle errors (no discount vs crash)

## Error Handling

### Validation Errors

```rust
// Invalid bundle - return empty transformations
if !is_valid_bundle(&bundle_items, &config) {
    return Ok(FunctionResult {
        operations: vec![],
        errors: vec![],
    });
}
```

**Behavior:** Failed validation = no discount applied, cart proceeds normally

### Parsing Errors

```rust
// Failed to parse metafield JSON
let config = match serde_json::from_str(&metafield_value) {
    Ok(c) => c,
    Err(e) => {
        return Ok(FunctionResult {
            operations: vec![],
            errors: vec![FunctionError {
                message: format!("Failed to parse bundle config: {}", e),
            }],
        });
    }
};
```

**Behavior:** Parsing error = logged, no discount applied

### Calculation Errors

```rust
// Division by zero, overflow, etc.
let discount = match calculate_discount(total, discount_value) {
    Ok(d) => d,
    Err(e) => {
        // Log error, continue without discount
        eprintln!("Calculation error: {}", e);
        return Ok(FunctionResult {
            operations: vec![],
            errors: vec![],
        });
    }
};
```

**Behavior:** Graceful degradation - checkout continues

## Testing

### Unit Tests

**File:** `extensions/bundle-cart-transform-ts/src/tests.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_percentage_discount() {
        let cart = mock_cart_with_bundle();
        let result = run_function(cart);

        assert_eq!(result.operations.len(), 3);
        assert_eq!(result.operations[0].discount, 6.0); // 20% of $30
    }

    #[test]
    fn test_invalid_bundle_no_discount() {
        let cart = mock_invalid_cart();
        let result = run_function(cart);

        assert_eq!(result.operations.len(), 0); // No discount
    }
}
```

### Integration Tests

**Test in Development Store:**
1. Create test bundle with known discount
2. Add bundle to cart
3. Verify discount applied correctly
4. Test edge cases (min/max quantities, multiple bundles)

**Shopify Function Test Runner:**
```bash
# Run with sample input
shopify function run --export

# Expected output shows transformations
```

## Debugging

### View Function Logs

**Shopify Admin:**
```
Settings > Apps and sales channels > Develop apps
> Your App > API credentials > Function logs
```

**Logs Show:**
- Function execution time
- Input cart data
- Output transformations
- Errors encountered

### Debug Checklist

**No Discount Applied:**
- [ ] Bundle items have `_bundle_id` attribute?
- [ ] Metafield exists on product?
- [ ] Metafield JSON valid?
- [ ] Bundle composition valid (min/max quantities)?
- [ ] Discount rule condition met?

**Wrong Discount Amount:**
- [ ] Check discount calculation logic
- [ ] Verify rule conditions
- [ ] Check for rounding errors
- [ ] Verify per-item distribution

**Function Not Running:**
- [ ] Function deployed successfully?
- [ ] Function activated in shop?
- [ ] Check function ID matches

## Performance Optimization

### Minimize Input Query

Only query necessary fields:
```graphql
# Bad: Query everything
query Input {
  cart {
    # ... 50 fields
  }
}

# Good: Query only what's needed
query Input {
  cart {
    lines {
      id
      quantity
      # Only essential fields
    }
  }
}
```

### Efficient Algorithms

```rust
// Bad: O(n²) nested loops
for item in bundle_items {
    for rule in pricing_rules {
        // Check condition
    }
}

// Good: O(n) with early exit
let applicable_rule = pricing_rules
    .iter()
    .find(|rule| matches_condition(item, rule));
```

### Avoid Allocations

```rust
// Bad: Multiple allocations
let items = bundle_items.to_vec();
let filtered = items.filter(...).collect();

// Good: Iterator chains (no allocation)
let discount = bundle_items
    .iter()
    .filter(|item| item.bundle_id == bundle_id)
    .map(|item| calculate_discount(item))
    .sum();
```

## Related Documentation

- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Feature Guide](FEATURE_GUIDE.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Deployment](DEPLOYMENT.md)
