# Technical Documentation
## Wolfpack Product Bundles - Complete Developer Guide

**Last Updated:** December 28, 2025
**Version:** 4.0
**For Developers:** Future team members and maintainers

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Codebase Structure](#codebase-structure)
4. [Core Components](#core-components)
5. [Database Architecture](#database-architecture)
6. [Bundle Widget System](#bundle-widget-system)
7. [Shopify Integration](#shopify-integration)
8. [Design Control Panel](#design-control-panel)
9. [Common Development Tasks](#common-development-tasks)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

### What Is This App?

This is a Shopify app that allows merchants to create product bundles. Think of it like this:
- A merchant wants to sell a "Complete Skincare Set"
- Instead of selling 5 products separately, they create 1 bundle
- Customers build their bundle by selecting products from different categories
- The app handles pricing, discounts, and adding everything to the cart

### Technology Stack (In Simple Terms)

**Frontend (What Users See):**
- **Remix**: Modern web framework (like Next.js but better for Shopify)
- **Shopify Polaris**: Pre-built UI components from Shopify
- **React**: JavaScript library for building user interfaces

**Backend (Server Logic):**
- **Node.js**: JavaScript runtime (runs JavaScript on the server)
- **Prisma**: Database tool (makes talking to database easier)
- **PostgreSQL**: Database (stores all our data)

**Shopify Integration:**
- **Shopify Functions**: Special code that runs in Shopify's system
- **Cart Transform**: Modifies the cart when bundles are added
- **GraphQL API**: How we communicate with Shopify

**Deployment:**
- **Render.com**: Cloud hosting (runs our app 24/7)
- **Google Pub/Sub**: Message queue (handles webhooks reliably)

---

## System Architecture

### High-Level Flow

```
┌─────────────────┐
│  Merchant Admin │ ← Merchant creates bundles
│   (Remix App)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │ ← Stores bundle configuration
│   (PostgreSQL)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Shopify Store  │ ← Metafields store which products have bundles
│   (Metafields)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Customer Sees  │ ← Product/Page with bundle widget
│  Bundle Widget  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Customer Adds  │ ← Bundle added to cart
│   to Cart       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cart Transform  │ ← Shopify Function processes bundle
│   Function      │    (applies discounts, groups products)
└─────────────────┘
```

### How Data Flows

**1. Bundle Creation (Admin):**
```
Merchant → Remix Admin → Database → Shopify Metafields
```

**2. Customer Interaction:**
```
Storefront → Widget Load → Fetch Bundle Data → Display Builder
```

**3. Add to Cart:**
```
Customer Selection → Cart with Properties → Cart Transform → Final Cart
```

---

## Codebase Structure

### Directory Layout (The Important Parts)

```
Only-Bundles/
├── app/                              # Main application code
│   ├── components/                   # Reusable UI components
│   │   ├── design-control-panel/   # Design customization UI
│   │   ├── bundle/                 # Bundle management components
│   │   └── settings/               # Settings components
│   │
│   ├── routes/                      # All app pages/endpoints
│   │   ├── app._index.tsx          # Main admin dashboard
│   │   ├── app.bundles.*.tsx       # Bundle CRUD pages
│   │   ├── api.*.tsx               # API endpoints
│   │   └── webhooks.*.tsx          # Webhook handlers
│   │
│   ├── services/                    # Business logic layer
│   │   ├── bundleService.ts        # Bundle operations
│   │   ├── shopifyService.ts       # Shopify API calls
│   │   ├── metafieldService.ts     # Metafield management
│   │   └── pricingService.ts       # Pricing calculations
│   │
│   ├── lib/                         # Utility libraries
│   │   └── shopify.server.ts       # Shopify authentication
│   │
│   └── utils/                       # Helper functions
│
├── extensions/                      # Shopify theme extensions
│   ├── bundle-builder/             # Main bundle widget
│   │   ├── blocks/                 # Liquid template blocks
│   │   │   ├── bundle-full-page.liquid      # Full-page bundle
│   │   │   └── bundle-product-page.liquid   # Product-page bundle
│   │   └── assets/                 # Widget JavaScript/CSS
│   │       ├── bundle-widget-full-page-bundled.js
│   │       ├── bundle-widget-full-page.css
│   │       └── bundle-widget-components.js
│   │
│   └── bundle-cart-transform-ts/   # Cart modification function
│       └── src/run.ts              # Main transform logic
│
├── prisma/                          # Database management
│   ├── schema.prisma               # Database schema definition
│   └── migrations/                 # Database version history
│
└── docs/                            # Documentation (you are here!)
```

### File Naming Conventions

**Routes (pages):**
- `app._index.tsx` = Main dashboard page
- `app.bundles.new.tsx` = Create new bundle page
- `app.bundles.$id.tsx` = Edit bundle page (dynamic ID)
- `api.bundle-data.$shopDomain.tsx` = API endpoint for bundle data

**Components:**
- `PascalCase.tsx` = React components (BundleCard.tsx)
- `camelCase.ts` = Utilities and services (bundleService.ts)

---

## Core Components

### 1. Bundle Management System

**Location:** `app/routes/app.bundles.*`

**What It Does:**
- Creates/edits/deletes bundles
- Manages bundle steps (Step 1: Pick Category, Step 2: Pick Color, etc.)
- Handles product selection within steps
- Saves pricing rules and discounts

**Key Files:**
```typescript
// Create new bundle
app/routes/app.bundles.new.tsx

// Edit existing bundle
app/routes/app.bundles.$id.tsx

// List all bundles
app/routes/app._index.tsx

// Delete bundle
app/routes/app.bundles.$id.delete.tsx
```

**How It Works:**
1. Merchant fills out bundle form
2. Form data sent to backend via Remix action
3. Service layer validates and saves to database
4. Metafields updated on Shopify product/page
5. Success response returned to UI

### 2. Bundle Widget (Storefront)

**Location:** `extensions/bundle-builder/`

**What It Does:**
- Displays bundle builder to customers
- Shows product selection interface
- Calculates pricing in real-time
- Handles "Add to Cart" functionality

**Architecture:**

```javascript
// Main Components
BundleWidgetFullPage     // For dedicated bundle pages
BundleWidgetProductPage  // For product pages with bundles

// Shared Components (bundle-widget-components.js)
CurrencyManager          // Multi-currency support
PricingCalculator        // Price calculations
ToastManager             // User notifications
ComponentGenerator       // UI generation

// Rendering Flow
1. Liquid template loads → Sets up container
2. JavaScript loads → Fetches bundle data from API
3. Renders UI → Shows steps, products, pricing
4. User interacts → Updates selection, recalculates prices
5. Add to cart → Sends to Shopify cart with properties
```

**Widget Types:**

**Product-Page Widget:**
- Shows on individual product pages
- Compact layout (modal-based)
- Attached to specific product via metafield

**Full-Page Widget:**
- Shows on dedicated bundle pages
- Full-screen layout (horizontal tabs)
- More space for complex bundles

### 3. Design Control Panel (DCP)

**Location:** `app/components/design-control-panel/`

**What It Does:**
- Allows merchants to customize widget appearance
- Controls colors, fonts, spacing, borders
- Separate settings for Product-Page and Full-Page widgets
- Injects CSS variables into storefront

**How It Works:**

```typescript
// 1. Merchant changes color in admin
DesignControlPanel.tsx → Updates form

// 2. Form submission
onSubmit() → Saves to DesignSettings table

// 3. Widget loads on storefront
<link rel="stylesheet" href="/api/design-settings/{shop}?bundleType=full_page">

// 4. API returns CSS
GET /api/design-settings → Generates CSS with variables

// 5. CSS applied
:root {
  --bundle-primary-color: #000000;
  --bundle-button-bg: #000000;
  ...
}
```

**Key Concept:**
- Design settings stored in database, NOT in widget code
- Changes apply instantly without redeploying widget
- Each bundle type can have different styling

### 4. Cart Transform Function

**Location:** `extensions/bundle-cart-transform-ts/src/run.ts`

**What It Does:**
- Runs when customer clicks "Checkout"
- Modifies cart to apply bundle discounts
- Ensures bundle products stay together
- Validates bundle requirements

**Process:**

```typescript
// Input: Cart with bundle items
{
  lines: [
    { productId: "123", properties: { _bundleId: "bundle-1" } },
    { productId: "456", properties: { _bundleId: "bundle-1" } },
  ]
}

// Function processes
1. Groups items by bundleId
2. Fetches bundle configuration from database
3. Calculates discount based on pricing rules
4. Applies discount to bundle items
5. Adds special properties for identification

// Output: Modified cart
{
  lines: [
    {
      productId: "123",
      price: originalPrice * 0.8,  // 20% off
      properties: {
        _bundleId: "bundle-1",
        _bundleDiscount: "20%"
      }
    },
    ...
  ]
}
```

**Important Notes:**
- Function runs on Shopify's servers (not ours!)
- Must be FAST (< 5 seconds)
- Limited to 256KB code size
- Cannot use external APIs directly (uses metafields instead)

---

## Database Architecture

### Core Tables (In Simple Terms)

**1. Shop**
```
Stores information about each Shopify store using our app
- shopDomain: "example.myshopify.com"
- accessToken: Token to access their Shopify API
- isActive: Whether they're still using the app
```

**2. Bundle**
```
Main bundle configuration
- title: "Complete Skincare Set"
- bundleType: "full_page" or "product_page"
- status: "active" or "draft"
- discountType: "percentage" or "fixed"
```

**3. BundleStep**
```
Each step in the bundle builder
- title: "Step 1: Choose Your Cleanser"
- description: "Pick your favorite cleanser"
- minQuantity: 1 (must select at least 1)
- maxQuantity: 2 (can select up to 2)
- position: 1 (ordering)
```

**4. StepProduct**
```
Products available in each step
- variantId: Shopify product variant ID
- position: Display order
- Available through: BundleStep relationship
```

**5. BundlePricing**
```
Discount rules for the bundle
- enabled: true/false
- discountType: "percentage" | "fixed" | "tiered"
- discountValue: 20 (for 20% off)
- requirementType: "min_products" | "specific_total"
- requirementValue: 5 (need 5 products)
```

**6. DesignSettings**
```
Widget appearance customization
- shopDomain: Which store
- bundleType: "full_page" or "product_page"
- settings: JSON of all color/font/spacing values
```

### Relationships

```
Shop
 └── Bundle (one shop has many bundles)
      ├── BundleStep (one bundle has many steps)
      │    └── StepProduct (one step has many products)
      ├── BundlePricing (one bundle has pricing rules)
      └── DesignSettings (one bundle type has design settings)
```

---

## Bundle Widget System

### Widget Loading Flow

**1. Liquid Template Initialization:**

```liquid
<!-- bundle-full-page.liquid -->

<!-- Container with data attributes -->
<div id="bundle-builder-app"
     data-bundle-id="{{ bundle_id }}"
     data-bundle-type="full_page">
</div>

<!-- Load widget JavaScript -->
<script src="{{ 'bundle-widget-full-page-bundled.js' | asset_url }}"></script>

<!-- Load design settings CSS -->
<link rel="stylesheet" href="/api/design-settings/{{ shop.domain }}?bundleType=full_page">
```

**2. JavaScript Initialization:**

```javascript
// Widget auto-initializes when loaded
(function() {
  'use strict';

  // Find container
  const container = document.getElementById('bundle-builder-app');

  // Get configuration from data attributes
  const bundleId = container.dataset.bundleId;
  const bundleType = container.dataset.bundleType;

  // Initialize widget
  const widget = new BundleWidgetFullPage(container);
  await widget.init();
})();
```

**3. Data Fetching:**

```javascript
async loadBundleData() {
  // Fetch from API
  const response = await fetch(
    `/apps/product-bundles/api/bundle-data/${shopDomain}?bundleId=${bundleId}`
  );

  const data = await response.json();

  // Data structure:
  {
    bundle: {
      title: "Complete Set",
      steps: [
        {
          title: "Step 1",
          products: [...],
          minQuantity: 1
        }
      ],
      pricing: {
        discountType: "percentage",
        discountValue: 20
      }
    }
  }
}
```

### Widget Components

**Step Timeline (Top Navigation):**
```javascript
createStepTimeline() {
  // Shows: ✓ Step 1 → ○ Step 2 → ○ Step 3
  // Completed = checkmark icon
  // Current/Future = layers icon
  // Clicking navigates between steps
}
```

**Product Grid:**
```javascript
renderProductGrid(step) {
  // Shows all products for current step
  // Each product has:
  // - Image
  // - Title
  // - Price
  // - Variant selector (if multiple sizes/colors)
  // - Add/Remove buttons
}
```

**Bottom Footer:**
```javascript
renderBottomFooter() {
  // Promotional message (if any)
  // Selected products list with thumbnails
  // Total price
  // "Add to Cart" button
  // Progress bar
}
```

### Pricing Calculation

```javascript
calculateBundlePrice() {
  // 1. Get all selected products
  const selectedProducts = this.getAllSelectedProductsData();

  // 2. Calculate subtotal
  let subtotal = selectedProducts.reduce((sum, p) => {
    return sum + (p.price * p.quantity);
  }, 0);

  // 3. Apply discount if requirements met
  if (this.selectedBundle.pricing?.enabled) {
    const discount = this.calculateDiscount(selectedProducts);
    subtotal = subtotal - discount;
  }

  // 4. Format with currency
  return formatMoney(subtotal);
}
```

### Add to Cart

```javascript
async addToCart() {
  // 1. Validate bundle is complete
  if (!this.isBundleComplete()) {
    showError("Please complete all steps");
    return;
  }

  // 2. Prepare cart items with properties
  const items = this.getAllSelectedProductsData().map(product => ({
    id: product.variantId,
    quantity: product.quantity,
    properties: {
      _bundleId: this.selectedBundle.id,
      _bundleTitle: this.selectedBundle.title,
      _stepTitle: product.stepTitle,
      _bundleType: this.selectedBundle.bundleType
    }
  }));

  // 3. Add to Shopify cart
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  // 4. Redirect to cart
  window.location.href = '/cart';
}
```

---

## Shopify Integration

### Metafields (Data Storage in Shopify)

**What are Metafields?**
- Extra data fields on Shopify objects (products, pages, shop)
- We use them to connect bundles to products/pages
- Format: `namespace.key = value`

**Our Metafields:**

```typescript
// On Products (Product-Page Bundles)
{
  namespace: "$app",
  key: "bundle_id",
  type: "single_line_text_field",
  value: "bundle-123"
}

// On Pages (Full-Page Bundles)
{
  namespace: "$app",
  key: "bundle_id",
  type: "single_line_text_field",
  value: "bundle-456"
}

// On Shop (Server URL)
{
  namespace: "$app",
  key: "serverUrl",
  type: "single_line_text_field",
  value: "https://your-app.onrender.com"
}
```

**Why We Use Them:**
- Widget needs to know which bundle to load
- Cart Transform needs bundle configuration
- Faster than making API calls during checkout

### GraphQL API Usage

**Creating/Updating Metafields:**

```typescript
// app/services/metafieldService.ts

async setProductMetafield(productId: string, bundleId: string) {
  const mutation = `
    mutation {
      metafieldsSet(metafields: [{
        ownerId: "${productId}",
        namespace: "$app",
        key: "bundle_id",
        type: "single_line_text_field",
        value: "${bundleId}"
      }]) {
        metafields {
          id
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopify.graphql(mutation);
  return response;
}
```

**Reading Product Data:**

```typescript
async getProductsByIds(variantIds: string[]) {
  const query = `
    query {
      nodes(ids: [${variantIds.map(id => `"${id}"`).join(',')}]) {
        ... on ProductVariant {
          id
          title
          price
          product {
            title
            featuredImage {
              url
            }
          }
        }
      }
    }
  `;

  return await shopify.graphql(query);
}
```

### App Proxy (Widget API)

**What is it?**
- Allows our app to serve content on merchant's domain
- URL: `merchant-store.com/apps/product-bundles/api/...`
- Configured in Shopify Partner Dashboard

**Our Proxy Routes:**

```typescript
// Serve bundle data
GET /apps/product-bundles/api/bundle-data/:shopDomain
→ Returns bundle configuration as JSON

// Serve design settings
GET /apps/product-bundles/api/design-settings/:shopDomain
→ Returns CSS with design variables
```

**Why We Use It:**
- Avoids CORS issues
- Data loads from same domain as store
- Looks more integrated to customers

---

## Design Control Panel

### How Design Settings Work

**1. Storage:**
```typescript
// Database: DesignSettings table
{
  shopDomain: "example.myshopify.com",
  bundleType: "full_page",
  settings: {
    colors: {
      primaryColor: "#000000",
      buttonBackground: "#000000",
      buttonText: "#FFFFFF"
    },
    typography: {
      fontFamily: "'Quattrocento Sans', sans-serif",
      fontSize: {
        title: "24px",
        price: "18px"
      }
    },
    spacing: {
      containerPadding: "80px",
      gridGap: "24px"
    }
  }
}
```

**2. CSS Generation:**
```typescript
// app/routes/api.design-settings.$shopDomain.tsx

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Get bundle type from URL
  const url = new URL(request.url);
  const bundleType = url.searchParams.get('bundleType');

  // Fetch settings from database
  const settings = await getDesignSettings(shopDomain, bundleType);

  // Generate CSS
  const css = `
    :root {
      --bundle-primary-color: ${settings.colors.primaryColor};
      --bundle-button-bg: ${settings.colors.buttonBackground};
      --bundle-font-family: ${settings.typography.fontFamily};
      ...
    }

    .bundle-widget-container {
      padding: var(--bundle-container-padding);
      font-family: var(--bundle-font-family);
    }
  `;

  // Return as CSS
  return new Response(css, {
    headers: { 'Content-Type': 'text/css' }
  });
}
```

**3. Widget Usage:**
```css
/* Widget automatically uses CSS variables */
.bundle-button {
  background: var(--bundle-button-bg);
  color: var(--bundle-button-text);
  font-family: var(--bundle-font-family);
}
```

### Design Panel Architecture

**Component Structure:**
```
DesignControlPanel/
├── index.tsx                    # Main container
├── ColorControls.tsx            # Color pickers
├── TypographyControls.tsx       # Font settings
├── SpacingControls.tsx          # Padding/margins
├── PreviewPane.tsx              # Live preview
└── hooks/
    └── useDesignSettings.ts     # Settings management
```

**Live Preview:**
```typescript
function PreviewPane({ settings }) {
  // Renders sample widget with current settings
  return (
    <div style={{
      '--bundle-primary-color': settings.colors.primaryColor,
      '--bundle-button-bg': settings.colors.buttonBackground,
      ...settings
    }}>
      <BundleWidgetPreview />
    </div>
  );
}
```

---

## Common Development Tasks

### Adding a New Bundle Type

**1. Update Database Schema:**
```prisma
// prisma/schema.prisma
enum BundleType {
  product_page
  full_page
  popup        // ← New type
}
```

**2. Create Widget File:**
```javascript
// extensions/bundle-builder/assets/bundle-widget-popup.js
class BundleWidgetPopup {
  // Implement popup-specific UI
}
```

**3. Create Liquid Template:**
```liquid
<!-- extensions/bundle-builder/blocks/bundle-popup.liquid -->
{% schema %}
{
  "name": "Bundle - Popup",
  "target": "section"
}
{% endschema %}
```

**4. Update Design Settings:**
```typescript
// Add popup-specific design options
const POPUP_DESIGN_DEFAULTS = {
  modalWidth: '600px',
  overlayColor: 'rgba(0,0,0,0.5)',
  ...
};
```

### Adding a New Pricing Rule Type

**1. Update Pricing Model:**
```typescript
// Update BundlePricing type
type DiscountType =
  | 'percentage'
  | 'fixed'
  | 'tiered'
  | 'bogo';      // ← New type
```

**2. Update Calculation Logic:**
```typescript
// app/services/pricingService.ts
calculateDiscount(products, pricing) {
  switch (pricing.discountType) {
    case 'bogo':
      return this.calculateBogoDiscount(products, pricing);
    // ... other cases
  }
}
```

**3. Update Widget:**
```javascript
// extensions/bundle-builder/assets/bundle-widget-components.js
calculateDiscount() {
  if (pricing.discountType === 'bogo') {
    // BOGO logic
  }
}
```

**4. Update Admin UI:**
```typescript
// app/components/bundle/PricingSettings.tsx
<Select
  options={[
    { label: "Percentage Off", value: "percentage" },
    { label: "Fixed Amount", value: "fixed" },
    { label: "Tiered Discount", value: "tiered" },
    { label: "Buy One Get One", value: "bogo" }  // ← New option
  ]}
/>
```

### Adding a Design Setting

**1. Update Settings Type:**
```typescript
// app/types/design-settings.ts
interface DesignSettings {
  colors: {
    primaryColor: string;
    accentColor: string;   // ← New setting
  };
}
```

**2. Add Control to DCP:**
```typescript
// app/components/design-control-panel/ColorControls.tsx
<ColorPicker
  label="Accent Color"
  value={settings.colors.accentColor}
  onChange={(color) => updateSetting('colors.accentColor', color)}
/>
```

**3. Add to CSS Generation:**
```typescript
// app/routes/api.design-settings.$shopDomain.tsx
--bundle-accent-color: ${settings.colors.accentColor};
```

**4. Use in Widget:**
```css
.bundle-highlight {
  border-color: var(--bundle-accent-color);
}
```

### Debugging Widget Issues

**1. Enable Debug Mode:**
```javascript
// Add to widget initialization
window.BUNDLE_DEBUG = true;

// Widget logs detailed information
console.log('[BUNDLE_WIDGET] Loading bundle:', bundleId);
console.log('[BUNDLE_WIDGET] Data fetched:', bundleData);
console.log('[BUNDLE_WIDGET] Price calculated:', price);
```

**2. Check Browser Console:**
```javascript
// Common errors and solutions:

"Cannot read property 'steps' of undefined"
→ Bundle data didn't load. Check API endpoint.

"Invalid variant ID"
→ Product was deleted from Shopify. Update bundle.

"Maximum call stack size exceeded"
→ Circular reference in data. Check bundle configuration.
```

**3. Inspect Network Requests:**
```
1. Open DevTools → Network tab
2. Reload page
3. Look for:
   - bundle-widget-full-page-bundled.js (should load successfully)
   - api/bundle-data/... (should return JSON)
   - api/design-settings/... (should return CSS)
```

**4. Test Cart Transform:**
```javascript
// Add items to cart with bundle properties
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{
      id: variantId,
      quantity: 1,
      properties: {
        _bundleId: 'test-bundle-1',
        _bundleTitle: 'Test Bundle'
      }
    }]
  })
});

// Go to checkout
// Check if discount applied
// If not, check Cart Transform function logs in Shopify admin
```

---

## Troubleshooting Guide

### Widget Not Loading

**Symptom:** Widget container shows but content doesn't load

**Checklist:**
1. ✅ Check browser console for JavaScript errors
2. ✅ Verify bundle ID is set correctly in Liquid template
3. ✅ Check API endpoint returns data: `/apps/product-bundles/api/bundle-data/...`
4. ✅ Verify bundle status is "active" in database
5. ✅ Check if bundle has at least one step with products

**Common Fix:**
```javascript
// Widget expects bundleId to be set
<div id="bundle-builder-app"
     data-bundle-id="{{ bundle_id }}">  ← Make sure this exists
</div>
```

### Prices Not Calculating

**Symptom:** Widget loads but prices show as $0.00 or NaN

**Checklist:**
1. ✅ Check product variant IDs are valid (not deleted from Shopify)
2. ✅ Verify pricing configuration in bundle settings
3. ✅ Check currency formatting settings
4. ✅ Look for JavaScript errors in price calculation

**Debug:**
```javascript
// Add to widget code
console.log('Selected products:', this.getAllSelectedProductsData());
console.log('Pricing config:', this.selectedBundle.pricing);
console.log('Calculated total:', this.calculateBundlePrice());
```

### Cart Transform Not Working

**Symptom:** Bundle items added to cart but discount not applied

**Checklist:**
1. ✅ Verify Cart Transform function is deployed
2. ✅ Check function status in Shopify Admin → Settings → Functions
3. ✅ Ensure bundle properties are passed correctly
4. ✅ Check function logs for errors

**Debug:**
```typescript
// Add logging to run.ts
console.log('Input cart:', JSON.stringify(input.cart));
console.log('Bundle items found:', bundleGroups);
console.log('Discount calculated:', discount);
```

### Design Settings Not Applying

**Symptom:** Widget doesn't reflect design changes

**Checklist:**
1. ✅ Clear browser cache (Ctrl+Shift+R)
2. ✅ Check CSS is loading: `/apps/product-bundles/api/design-settings/...`
3. ✅ Verify settings saved to database
4. ✅ Check bundleType parameter matches

**Common Issue:**
```typescript
// Wrong: Missing bundleType parameter
<link rel="stylesheet" href="/api/design-settings/shop.myshopify.com">

// Correct: Include bundleType
<link rel="stylesheet" href="/api/design-settings/shop.myshopify.com?bundleType=full_page">
```

### Database Connection Errors

**Symptom:** "Cannot connect to database" errors

**Quick Fixes:**
1. Check `DATABASE_URL` environment variable
2. Verify database is running (Render dashboard)
3. Check connection pool limits
4. Restart application

**Connection String Format:**
```bash
# Correct format:
DATABASE_URL=postgresql://user:pass@host:5432/database?connection_limit=5

# Common mistakes:
# - Missing ?connection_limit=5
# - Wrong password (url-encoded?)
# - Wrong database name
```

---

## Performance Optimization

### Widget Loading Speed

**Techniques Used:**
1. **Bundled JavaScript:** All code in one file (no multiple requests)
2. **CSS Variables:** Design settings loaded once, cached
3. **Lazy Loading:** Product images loaded on demand
4. **Debounced Calculations:** Price recalculated only when needed

**Code Example:**
```javascript
// Debounce price calculations
let priceCalcTimeout;
updatePrice() {
  clearTimeout(priceCalcTimeout);
  priceCalcTimeout = setTimeout(() => {
    this.calculateAndDisplayPrice();
  }, 300); // Wait 300ms after last change
}
```

### Database Query Optimization

**Use Prisma Select:**
```typescript
// Bad: Loads entire bundle with all relations
const bundle = await prisma.bundle.findUnique({
  where: { id },
  include: { steps: true, pricing: true }
});

// Good: Load only what's needed
const bundle = await prisma.bundle.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    steps: {
      select: {
        id: true,
        title: true,
        products: {
          select: { variantId: true }
        }
      }
    }
  }
});
```

**Use Indexes:**
```prisma
model Bundle {
  shopDomain String

  @@index([shopDomain])  // ← Faster lookups by shop
}
```

### API Response Caching

```typescript
// Cache bundle data for 5 minutes
import { cache } from '~/utils/cache';

export async function getBundleData(shopDomain: string, bundleId: string) {
  const cacheKey = `bundle:${shopDomain}:${bundleId}`;

  return cache.get(cacheKey, async () => {
    return await fetchBundleFromDatabase(shopDomain, bundleId);
  }, { ttl: 300 }); // 5 minutes
}
```

---

## Security Considerations

### Authentication

**Shopify Session Validation:**
```typescript
// All admin routes protected
export async function loader({ request }: LoaderFunctionArgs) {
  // Authenticate with Shopify
  const { session } = await authenticate.admin(request);

  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Continue with route logic
}
```

**API Endpoint Protection:**
```typescript
// Validate shop domain
export async function loader({ params }: LoaderFunctionArgs) {
  const { shopDomain } = params;

  // Verify shop exists and is active
  const shop = await prisma.shop.findUnique({
    where: { shopDomain }
  });

  if (!shop || !shop.isActive) {
    throw new Response('Shop not found', { status: 404 });
  }
}
```

### Input Validation

**Sanitize User Input:**
```typescript
import { z } from 'zod';

// Define schema
const bundleSchema = z.object({
  title: z.string().min(1).max(255),
  status: z.enum(['active', 'draft']),
  discountValue: z.number().min(0).max(100)
});

// Validate
const validated = bundleSchema.parse(formData);
```

**Prevent XSS:**
```typescript
// DON'T do this:
innerHTML = userInput;

// DO this:
textContent = userInput;

// Or sanitize:
import DOMPurify from 'dompurify';
innerHTML = DOMPurify.sanitize(userInput);
```

### SQL Injection Prevention

**Prisma handles this automatically:**
```typescript
// Safe: Prisma parameterizes queries
await prisma.bundle.findMany({
  where: {
    shopDomain: userProvidedShop  // ✅ Safe
  }
});

// Never use raw SQL with user input:
await prisma.$queryRaw`
  SELECT * FROM Bundle WHERE shop = ${userInput}  // ❌ Dangerous!
`;
```

---

## Testing

### Manual Testing Checklist

**Before Deploying:**

**Bundle Creation:**
- [ ] Create new bundle with all fields
- [ ] Edit existing bundle
- [ ] Delete bundle
- [ ] Duplicate bundle

**Widget Functionality:**
- [ ] Widget loads on product page
- [ ] Widget loads on full page
- [ ] Step navigation works
- [ ] Product selection works
- [ ] Variant selectors work
- [ ] Price calculates correctly
- [ ] Add to cart works

**Cart & Checkout:**
- [ ] Bundle items in cart
- [ ] Discount applied at checkout
- [ ] Bundle properties visible
- [ ] Can remove individual items

**Design Control Panel:**
- [ ] Change colors
- [ ] Change fonts
- [ ] Preview updates live
- [ ] Save changes
- [ ] Changes reflect on storefront

### Automated Testing

**Run Tests:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- bundleService.test.ts

# Run with coverage
npm test -- --coverage
```

**Example Test:**
```typescript
// tests/services/bundleService.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBundlePrice } from '~/services/pricingService';

describe('Pricing Service', () => {
  it('calculates percentage discount correctly', () => {
    const products = [
      { price: 1000, quantity: 1 },
      { price: 2000, quantity: 1 }
    ];

    const pricing = {
      enabled: true,
      discountType: 'percentage',
      discountValue: 20
    };

    const result = calculateBundlePrice(products, pricing);

    expect(result).toBe(2400); // 3000 - 20% = 2400
  });
});
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] Run all tests: `npm test`
- [ ] Check for TypeScript errors: `npx tsc --noEmit`
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Test on development store
- [ ] Verify environment variables are set

### Deploy to Render

**Automatic Deployment:**
```bash
# 1. Commit changes
git add .
git commit -m "Description of changes"

# 2. Push to main branch
git push origin main

# 3. Render auto-deploys
# Check Render dashboard for status
```

**Manual Deployment:**
```bash
# 1. Login to Render
# 2. Go to service
# 3. Click "Manual Deploy" → "Deploy latest commit"
```

### Deploy Shopify Extension

**Bundle Widget:**
```bash
# Deploy theme extension
shopify app deploy

# This creates a new version
# Version number shown in output
```

**Cart Transform Function:**
```bash
# Deploy function
cd extensions/bundle-cart-transform-ts
shopify function deploy

# Activate in Shopify Admin:
# Settings → Apps and sales channels → Develop apps
# → Your App → Cart transform
```

### Post-Deployment Verification

**1. Check App is Running:**
```bash
curl https://your-app.onrender.com/healthcheck
# Should return: { "status": "ok" }
```

**2. Test Widget Loads:**
- Visit development store
- Check product page with bundle
- Verify widget appears
- Test add to cart

**3. Test Cart Transform:**
- Add bundle to cart
- Go to checkout
- Verify discount applied

**4. Check Logs:**
```bash
# Render dashboard → Logs tab
# Look for errors or warnings
```

---

## Environment Variables Reference

### Required (Web Service)

```bash
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# App URLs
SHOPIFY_APP_URL=https://your-app.onrender.com
HOST=your-app.onrender.com

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Shopify API
SCOPES=read_products,write_products,write_cart_transforms

# Session
SESSION_SECRET=random_secret_key
```

### Required (Pub/Sub Worker)

```bash
# Database
DATABASE_URL=postgresql://...

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
PUBSUB_SUBSCRIPTION=your-subscription-name
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### Optional

```bash
# Development
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_DEBUG_MODE=true
```

---

## Additional Resources

### Important Links

- **Shopify Admin API:** https://shopify.dev/docs/api/admin-graphql
- **Shopify Functions:** https://shopify.dev/docs/api/functions
- **Remix Docs:** https://remix.run/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Polaris Components:** https://polaris.shopify.com/components

### Getting Help

1. Check existing documentation
2. Search closed GitHub issues
3. Ask in team chat
4. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs

---

**Last Updated:** December 28, 2025
**Maintained By:** Wolfpack Development Team
**Questions?** Contact: dev@wolfpack.com
