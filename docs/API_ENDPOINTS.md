# API Endpoints Reference

**Last Updated:** 2026-04-16

## Table of Contents
- [Overview](#overview)
- [Public API (Storefront)](#public-api-storefront)
- [Admin API (Protected)](#admin-api-protected)
- [Billing API](#billing-api)
- [Utility API](#utility-api)
- [Webhooks](#webhooks)
- [Error Responses](#error-responses)

## Overview

The application exposes several categories of endpoints:

**Public APIs:** Accessible from storefront (no authentication)
**Admin APIs:** Require Shopify App Bridge session token
**Billing APIs:** Subscription management (requires session)
**Utility APIs:** Internal tools and maintenance
**Webhooks:** Shopify webhook handlers

### Base URLs

**Production:** `https://your-app.onrender.com`
**Development:** `http://localhost:3000`

### Authentication

**Admin Endpoints:**
```typescript
// Session token required in header
Authorization: Bearer <session-token>
// Validated via Shopify App Bridge
```

**Storefront Endpoints:**
```typescript
// No authentication required
// Rate limited by Shopify CDN
```

**Webhook Endpoints:**
```typescript
// HMAC validation required
X-Shopify-Hmac-SHA256: <hmac>
X-Shopify-Shop-Domain: <shop>
X-Shopify-Webhook-Id: <id>
```

## Public API (Storefront)

### GET `/api/bundle/:bundleId.json`

**Purpose:** Get bundle configuration for storefront widget

**Authentication:** None (public)

**Parameters:**
- `bundleId` (path) - Bundle ID (cuid format)

**Query Parameters:**
- `shop` (required) - Shop domain

**Response:**
```json
{
  "id": "cm5abc123",
  "name": "Complete the Look Bundle",
  "bundleType": "product_page",
  "steps": [
    {
      "id": "step-1",
      "name": "Choose Base",
      "position": 0,
      "minQuantity": 1,
      "maxQuantity": 1,
      "products": [
        {
          "id": "gid://shopify/Product/123",
          "title": "T-Shirt",
          "price": "29.99",
          "imageUrl": "https://cdn.shopify.com/...",
          "variants": [...]
        }
      ]
    }
  ],
  "pricing": {
    "enabled": true,
    "method": "percentage_off",
    "rules": [...],
    "messages": {...}
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Bundle not found
- `500` - Server error

**Usage:**
```javascript
// Widget loads bundle data
fetch(`/api/bundle/${bundleId}.json?shop=${shop}`)
  .then(res => res.json())
  .then(bundle => {
    // Render bundle widget
  });
```

---

### GET `/api/bundles.json`

**Purpose:** List bundles for a shop (public access)

**Authentication:** None

**Query Parameters:**
- `shop` (required) - Shop domain
- `type` (optional) - Filter by bundle type (`product_page` | `full_page`)
- `status` (optional) - Filter by status (default: `active`)

**Response:**
```json
{
  "bundles": [
    {
      "id": "cm5abc123",
      "name": "Build Your Box",
      "bundleType": "full_page",
      "shopifyPageHandle": "build-your-box",
      "status": "active"
    }
  ]
}
```

**Usage:**
```javascript
// Full-page widget discovers available bundles
fetch(`/api/bundles.json?shop=${shop}&type=full_page&status=active`)
  .then(res => res.json())
  .then(data => {
    // Display bundle list
  });
```

---

### GET `/api/design-settings/:shopDomain`

**Purpose:** Get CSS design settings for shop

**Authentication:** None (public, but generates CSS)

**Parameters:**
- `shopDomain` (path) - Shop domain

**Query Parameters:**
- `bundleType` (required) - `product_page` | `full_page`

**Response:** CSS file with custom properties
```css
:root {
  /* Product Card */
  --bundle-product-card-bg: #FFFFFF;
  --bundle-product-card-font-color: #000000;
  --bundle-product-card-font-size: 16px;

  /* Buttons */
  --bundle-button-bg: #000000;
  --bundle-button-text: #FFFFFF;
  --bundle-button-radius: 8px;

  /* ... 50+ CSS variables */
}
```

**Usage:**
```html
<!-- Widget loads shop-specific styles -->
<link rel="stylesheet" href="/api/design-settings/store.myshopify.com?bundleType=product_page">
```

---

### GET `/api/storefront-products`

**Purpose:** Search products for storefront (via Storefront API)

**Authentication:** None

**Query Parameters:**
- `shop` (required) - Shop domain
- `query` (required) - Search query
- `first` (optional) - Number of results (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": "gid://shopify/Product/123",
      "title": "Cool T-Shirt",
      "handle": "cool-t-shirt",
      "images": [
        {
          "url": "https://cdn.shopify.com/...",
          "altText": "Cool T-Shirt"
        }
      ],
      "priceRange": {
        "minVariantPrice": {
          "amount": "29.99",
          "currencyCode": "USD"
        }
      },
      "variants": [...]
    }
  ]
}
```

**Usage:**
```javascript
// Widget product search
fetch(`/api/storefront-products?shop=${shop}&query=${query}`)
  .then(res => res.json())
  .then(data => {
    // Display search results
  });
```

---

### GET `/api/storefront-collections`

**Purpose:** List collections for storefront

**Authentication:** None

**Query Parameters:**
- `shop` (required) - Shop domain
- `first` (optional) - Number of results (default: 20)

**Response:**
```json
{
  "collections": [
    {
      "id": "gid://shopify/Collection/123",
      "title": "Summer Collection",
      "handle": "summer",
      "image": {
        "url": "https://cdn.shopify.com/..."
      }
    }
  ]
}
```

## Admin API (Protected)

All admin endpoints require Shopify App Bridge session token authentication.

### Bundle Management

Detailed bundle CRUD operations are handled through Remix actions in:
- `/app/bundles/new` - Create bundle
- `/app/bundles/:id` - View/edit bundle
- `/app/bundles/:id/steps` - Manage steps
- `/app/bundles/:id/pricing` - Configure pricing
- `/app/bundles/:id/product-page` - Product-page settings
- `/app/bundles/:id/full-page` - Full-page settings

See [Feature Guide](FEATURE_GUIDE.md) for UI workflows.

### Design Settings Management

Design Control Panel endpoints are handled through:
- `/app/design-control-panel` - DCP UI and actions
- Actions: `create`, `update`, `delete`

## Billing API

### POST `/api/billing/create`

**Purpose:** Create new subscription charge

**Authentication:** Session token required

**Request Body:**
```json
{
  "plan": "grow",
  "shop": "store.myshopify.com"
}
```

**Response:**
```json
{
  "confirmationUrl": "https://store.myshopify.com/admin/charges/123/confirm",
  "subscriptionId": "sub_abc123"
}
```

**Flow:**
1. Merchant clicks "Upgrade" in admin
2. App calls `/api/billing/create`
3. App redirects to `confirmationUrl`
4. Merchant approves in Shopify admin
5. Shopify redirects to `/api/billing/confirm`
6. Webhook `APP_SUBSCRIPTIONS_UPDATE` activates subscription

---

### GET `/api/billing/status`

**Purpose:** Get current subscription status

**Authentication:** Session token required

**Query Parameters:**
- `shop` (required) - Shop domain

**Response:**
```json
{
  "subscription": {
    "id": "sub_abc123",
    "plan": "grow",
    "status": "active",
    "price": 9.99,
    "currentPeriodEnd": "2026-02-14T00:00:00Z"
  },
  "bundleCount": 15,
  "bundleLimit": 20,
  "canCreateBundle": true
}
```

---

### GET `/api/billing/confirm`

**Purpose:** Confirm subscription after merchant approval

**Authentication:** Session token required

**Query Parameters:**
- `shop` (required) - Shop domain
- `charge_id` (required) - Shopify charge ID

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_abc123",
    "status": "active",
    "plan": "grow"
  }
}
```

**Flow:**
1. Shopify redirects here after approval
2. App fetches charge details from Shopify API
3. App updates subscription status to `pending`
4. Webhook `APP_SUBSCRIPTIONS_UPDATE` will change to `active`

---

### POST `/api/billing/cancel`

**Purpose:** Cancel active subscription

**Authentication:** Session token required

**Request Body:**
```json
{
  "shop": "store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled"
}
```

**Notes:**
- Cancellation is immediate
- Merchant downgraded to free plan
- Extra bundles (>3) archived, not deleted

## Utility API

### GET `/api/check-bundles`

**Purpose:** Check bundle count and limits for shop

**Authentication:** Session token required

**Query Parameters:**
- `shop` (required) - Shop domain

**Response:**
```json
{
  "bundleCount": 5,
  "bundleLimit": 20,
  "plan": "grow",
  "canCreateBundle": true
}
```

---

### GET `/api/check-cart-transform`

**Purpose:** Verify cart transform function is installed

**Authentication:** Session token required

**Query Parameters:**
- `shop` (required) - Shop domain

**Response:**
```json
{
  "installed": true,
  "functionId": "gid://shopify/Function/123",
  "title": "Bundle Cart Transform"
}
```

---

### POST `/api/activate-cart-transform`

**Purpose:** Install/activate cart transform function

**Authentication:** Session token required

**Request Body:**
```json
{
  "shop": "store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "functionId": "gid://shopify/Function/123",
  "message": "Cart transform activated"
}
```

**Notes:**
- Required for bundle discounts to work
- Only needs to be done once per shop
- Function deployed via Shopify CLI

---

### GET `/api/get-function-id`

**Purpose:** Get cart transform function ID for shop

**Authentication:** Session token required

**Query Parameters:**
- `shop` (required) - Shop domain

**Response:**
```json
{
  "functionId": "gid://shopify/Function/123"
}
```

---

### POST `/api/ensure-product-template`

**Purpose:** Ensure product template exists for bundle installation

**Authentication:** Session token required

**Request Body:**
```json
{
  "shop": "store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "templateExists": true
}
```

---

### POST `/api/cleanup-metafields`

**Purpose:** Clean up orphaned metafields for a shop

**Authentication:** Session token required

**Request Body:**
```json
{
  "shop": "store.myshopify.com"
}
```

**Response:**
```json
{
  "success": true,
  "cleaned": 5,
  "message": "Cleaned 5 orphaned metafields"
}
```

---

### POST `/api/cleanup-all-orphaned-metafields`

**Purpose:** Clean up orphaned metafields across all shops (admin only)

**Authentication:** Internal use only

**Response:**
```json
{
  "success": true,
  "shopsProcessed": 10,
  "totalCleaned": 25
}
```

## Webhooks

### POST `/api/webhooks/pubsub`

**Purpose:** Receive webhooks via Google Cloud Pub/Sub

**Authentication:** Pub/Sub push authentication

**Request Body:**
```json
{
  "message": {
    "data": "<base64-encoded-webhook-payload>",
    "attributes": {
      "X-Shopify-Topic": "app/subscriptions/update",
      "X-Shopify-Shop-Domain": "store.myshopify.com",
      "X-Shopify-Webhook-Id": "abc123"
    }
  }
}
```

**Supported Topics:**
- `app/subscriptions/update` - Subscription status changes
- `app/uninstalled` - App uninstallation
- `products/update` - Product updates (for bundle sync)
- `products/delete` - Product deletions (cleanup)

**Processing:**
1. Decode base64 message
2. Verify HMAC signature
3. Check idempotency (WebhookEvent table)
4. Route to appropriate handler
5. Update database
6. Send acknowledgment

---

### POST `/webhooks/app/uninstalled`

**Purpose:** Handle app uninstallation

**Handler:** Direct webhook (backup to Pub/Sub)

**Processing:**
1. Mark shop as uninstalled
2. Cancel active subscription
3. Archive bundles
4. Keep data for 30 days (GDPR compliance)

---

### POST `/webhooks/app/scopes_update`

**Purpose:** Handle OAuth scope changes

**Handler:** Direct webhook

**Processing:**
1. Update session scopes
2. Validate required scopes still granted
3. Log scope changes

---

### POST `/webhooks/products/update`

**Purpose:** Sync product changes to bundles

**Handler:** Direct webhook

**Processing:**
1. Find bundles using this product
2. Update cached product data (title, image, price)
3. Regenerate metafield if needed

---

### POST `/webhooks/products/delete`

**Purpose:** Handle product deletion

**Handler:** Direct webhook

**Processing:**
1. Find bundles using this product
2. Remove product from steps
3. Mark bundle for review if critical product deleted
4. Notify merchant

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

**404 Not Found:**
```json
{
  "error": "Bundle not found",
  "code": "NOT_FOUND"
}
```

**422 Unprocessable Entity:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Name is required",
    "steps": "At least one step required"
  }
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### Shopify API Errors

When Shopify API calls fail:

```json
{
  "error": "Shopify API error",
  "code": "SHOPIFY_API_ERROR",
  "details": {
    "shopifyError": "Product not found",
    "statusCode": 404
  }
}
```

## Rate Limiting

### Storefront Endpoints
- **Limit:** 100 requests/minute per shop
- **Enforced by:** Shopify CDN

### Admin Endpoints (Shopify GraphQL Admin API)
- **Limit:** 1,000 points leaky bucket, restores 50 points/second
- **Cost per query:** varies (1–1,000 points depending on complexity)
- **Monitor:** `X-Shopify-Shop-Api-Call-Limit` response header shows remaining points
- **Enforced by:** Shopify Admin API (per-store, per-app)

### Webhook Endpoints
- **Limit:** No limit (Shopify controls delivery rate)
- **Retry:** Exponential backoff on failure

## CORS Configuration

**Storefront Endpoints:**
```typescript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Admin Endpoints:**
```typescript
Access-Control-Allow-Origin: https://admin.shopify.com
Access-Control-Allow-Credentials: true
```

## Testing

### Using cURL

**Public API:**
```bash
curl https://your-app.com/api/bundle/cm5abc123.json?shop=store.myshopify.com
```

**Admin API (with session token):**
```bash
curl -H "Authorization: Bearer <session-token>" \
  https://your-app.com/api/check-bundles?shop=store.myshopify.com
```

**Webhook (with HMAC):**
```bash
curl -X POST \
  -H "X-Shopify-Hmac-SHA256: <hmac>" \
  -H "X-Shopify-Shop-Domain: store.myshopify.com" \
  -H "X-Shopify-Webhook-Id: abc123" \
  -H "Content-Type: application/json" \
  -d '{"id":123}' \
  https://your-app.com/webhooks/products/update
```

## Related Documentation

- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Feature Guide](FEATURE_GUIDE.md)
- [Database Schema](DATABASE_SCHEMA.md)
