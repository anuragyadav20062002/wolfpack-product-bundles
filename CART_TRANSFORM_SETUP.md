# 🚀 Cart Transform Activation & Setup Guide

## ✅ COMPLETED STEPS

### 1. Function ID Located
- **Function ID**: `527a500e-5386-4a67-a61b-9cb4cb8973f8` 
- **Location**: Already in your `.env` file as `SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID`
- **Status**: ✅ Function is deployed and ready

### 2. Activation Scripts Created
- **Files created**:
  - `app/routes/activate-cart-transform.tsx` - Activation route
  - `app/routes/setup-bundle-products.tsx` - Product setup route
  - `scripts/activate-cart-transform.js` - CLI activation script

## 🎯 MANUAL ACTIVATION STEPS (Do These Now)

### Step A: Activate Cart Transform Function

**Option 1: Using GraphQL Admin API**
```bash
curl -X POST \
  https://wolfpack-store-test-1.myshopify.com/admin/api/2025-01/graphql.json \
  -H 'X-Shopify-Access-Token: YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { cartTransformCreate(functionId: \"527a500e-5386-4a67-a61b-9cb4cb8973f8\") { cartTransform { id } userErrors { message } } }"
  }'
```

**Option 2: Using Your App Routes**
1. Start your app: `npm run dev` or `shopify app dev`
2. Navigate to: `https://your-app-url/activate-cart-transform`
3. Check console/network tab for results

**Option 3: Using Partner Dashboard GraphiQL**
1. Go to your app in Partner Dashboard
2. Open GraphiQL tab
3. Run this mutation:
```graphql
mutation {
  cartTransformCreate(functionId: "527a500e-5386-4a67-a61b-9cb4cb8973f8") {
    cartTransform {
      id
      functionId
    }
    userErrors {
      field
      message
    }
  }
}
```

### Step B: Create Bundle Products

**Option 1: Using Your App Route**
1. Navigate to: `https://your-app-url/setup-bundle-products`
2. This will create test products with proper metafields

**Option 2: Manual Product Creation**
Create these products in your Shopify admin:

1. **Product 1: Bundle Test T-Shirt**
   - Price: $25.00
   - Status: Active & Published

2. **Product 2: Bundle Test Hat**
   - Price: $15.00  
   - Status: Active & Published

3. **Bundle Product: T-Shirt + Hat Bundle**
   - Price: $35.00
   - Status: Active & Published
   - **CRITICAL**: Add this metafield:
     - Namespace: `bundle_discounts`
     - Key: `cart_transform_config`
     - Type: `json`
     - Value:
```json
{
  "id": "bundle_test_1",
  "name": "T-Shirt + Hat Bundle",
  "allBundleProductIds": [
    "gid://shopify/Product/TSHIRT_PRODUCT_ID",
    "gid://shopify/Product/HAT_PRODUCT_ID"
  ],
  "pricing": {
    "enableDiscount": true,
    "discountMethod": "fixed_amount_off",
    "rules": [
      {
        "discountOn": "quantity",
        "minimumQuantity": 2,
        "fixedAmountOff": 5,
        "percentageOff": 0
      }
    ]
  }
}
```

### Step C: Test Cart Transform

1. **Go to your storefront**
2. **Add bundle products to cart**:
   - Add the T-Shirt product
   - Add the Hat product  
   - OR add the Bundle product directly
3. **Check cart/checkout page**:
   - Lines should merge into single bundle line
   - Should show "T-Shirt + Hat Bundle - Save $5.00"
   - Discount should be applied

## 🔍 VERIFICATION STEPS

### Check if Cart Transform is Active
```graphql
query {
  cartTransforms(first: 5) {
    edges {
      node {
        id
        functionId
      }
    }
  }
}
```

### Check Bundle Products Have Metafields
```graphql
query {
  products(first: 10, query: "bundle") {
    edges {
      node {
        id
        title
        cartTransformConfig: metafield(namespace: "bundle_discounts", key: "cart_transform_config") {
          value
        }
      }
    }
  }
}
```

## 🐛 TROUBLESHOOTING

### Function Not Executing?
1. **Check cartTransform object exists** - Run verification query above
2. **Verify products have metafields** - Check metafield query above  
3. **Check function logs** - Look in Partner Dashboard > Functions > Logs
4. **Verify cart contents** - Make sure cart has bundle products
5. **Browser console** - Check for JavaScript errors

### Expected Behavior
- **Before**: Multiple separate cart lines
- **After**: Single merged bundle line with discount applied

## 📋 FILES CREATED
- ✅ `app/routes/activate-cart-transform.tsx` - Activation endpoint
- ✅ `app/routes/setup-bundle-products.tsx` - Product setup endpoint  
- ✅ `scripts/activate-cart-transform.js` - CLI activation script
- ✅ `scripts/variables.json` - Function ID variables
- ✅ `CART_TRANSFORM_SETUP.md` - This setup guide

## ⚡ QUICK START
1. **Activate function** using any method above
2. **Create bundle products** with metafields
3. **Test on storefront** - add products to cart
4. **Verify merging** - check cart shows single bundle line

Your cart transform function is working correctly in tests - it just needs activation and proper product setup!