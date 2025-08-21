# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL DEVELOPMENT RULE: MCP Server Usage

**MANDATORY**: Always use the Shopify dev MCP server as the **single source of truth** for all Shopify-related development work.

### Required MCP Server Workflow

**Before implementing ANY Shopify-related changes:**

1. **🔍 Research First**: Query the Shopify dev MCP server for official documentation and examples
2. **✅ Validate Everything**: Use MCP to verify API usage, component props, GraphQL schemas, and best practices  
3. **🚫 No Assumptions**: Never assume anything about Shopify APIs, Polaris components, or implementation patterns without MCP verification
4. **🛠️ Plan with MCP**: Base all implementation decisions on verified MCP information
5. **🔄 Verify Results**: Use MCP for troubleshooting and refinements

### MCP Server Integration Examples

```typescript
// ❌ WRONG: Implementing without MCP verification
<Thumbnail size="large" source="/image.jpg" />

// ✅ CORRECT: After MCP verification of Polaris Thumbnail props
// 1. Query MCP for Thumbnail component documentation
// 2. Verify size options and prop structure  
// 3. Validate against official Shopify Polaris docs
// 4. Then implement verified approach
```

**Key MCP Tools Available:**
- `mcp__shopify-dev-mcp__learn_shopify_api` - Initialize API context
- `mcp__shopify-dev-mcp__search_docs_chunks` - Search documentation
- `mcp__shopify-dev-mcp__validate_graphql_codeblocks` - Validate GraphQL
- `mcp__shopify-dev-mcp__introspect_graphql_schema` - Explore GraphQL schema
- `mcp__shopify-dev-mcp__fetch_full_docs` - Get complete documentation

**This rule applies to:**
- Polaris component usage and props
- GraphQL API queries and mutations  
- Shopify Functions implementation
- Admin API integration
- App Bridge functionality
- Extension development
- Best practices and patterns

---

## Development Commands

### Main Application
- `npm run dev` - Start development server with Shopify CLI (recommended)
- `npm run build` - Build the Remix application
- `npm run lint` - Run ESLint on the codebase
- `npm start` - Start production server
- `npm run setup` - Initialize Prisma and run migrations
- `npm run deploy` - Deploy app to Shopify

### Shopify Functions (Discount Functions)
- `cd extensions/bundle-discount-function-ts`
- `npm run build` - Build the discount function to WebAssembly
- `npm run test` - Run function tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run typegen` - Generate TypeScript types from GraphQL schema

### Cart Transform Functions
- `cd extensions/bundle-cart-transform-ts`
- `npm run build` - Build the cart transform function to WebAssembly
- `npm run test` - Run function tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run typegen` - Generate TypeScript types from GraphQL schema

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management

## Architecture Overview

This is a Shopify app built with Remix that provides product bundling functionality with two implementation approaches: **Discount Functions** (all Shopify plans) and **Cart Transform Functions** (Shopify Plus only). The architecture is designed based on [Shopify Functions](https://shopify.dev/docs/apps/build/functions) and follows official Shopify best practices for app development.

### Core Components

**Main App (Remix + Shopify App)**
- Built with Remix framework and Shopify App Bridge
- Uses Prisma ORM with PostgreSQL database
- Polaris design system for UI components
- Session management via Shopify App authentication

**Bundle System**
- `Bundle` - Main bundle configuration with steps and pricing
- `BundleStep` - Individual steps in bundle creation (products, collections, quantities)
- `BundlePricing` - Discount rules and pricing logic
- Bundle data stored as JSON metafields on Shopify products using [reserved namespaces](https://shopify.dev/docs/apps/build/custom-data/ownership#reserved-prefixes)

**Shopify Functions Implementation**

**1. Discount Functions (All Shopify Plans)**
- `cart_lines_discounts_generate_run.ts` - Handles cart line discounts (ORDER, PRODUCT classes)
- `cart_delivery_options_discounts_generate_run.ts` - Handles shipping discounts (SHIPPING class)
- Functions read bundle configuration from product metafields
- Built to WebAssembly for execution in Shopify's runtime
- Supports fixed amount, percentage, and free shipping discounts

**2. Cart Transform Functions (Shopify Plus Only)**
- `cart_transform_run.ts` - Real-time cart modifications
- Targets `cart.transform.run` for live bundle visualization
- Merges bundle items into single cart line with savings display
- Uses same bundle logic as discount functions for consistency

### Technical Architecture Based on Shopify Best Practices

**Function Development Workflow** (Following [Shopify Functions Guide](https://shopify.dev/docs/apps/build/functions))
1. GraphQL input queries define function inputs
2. TypeScript/JavaScript business logic processes cart data
3. Functions return operations to modify cart or apply discounts
4. WebAssembly compilation for optimal performance
5. Shopify CLI deployment and monitoring

**Metafield Strategy** (Following [Metafields Best Practices](https://shopify.dev/docs/apps/build/functions/input-output/metafields-for-input-queries))
- Reserved namespace: `$app:bundle_discounts` (automatically resolves to `app--{app-id}--bundle_discounts`)
- JSON metafields for complex bundle configurations
- Product-level metafields for function input
- Parallel change pattern for configuration migrations

**Discount Classes Implementation** (Following [Discount Function API](https://shopify.dev/docs/apps/build/discounts))
- **ORDER**: Cart-wide discounts via `orderDiscountsAdd` operations
- **PRODUCT**: Line-item discounts via `productDiscountsAdd` operations  
- **SHIPPING**: Delivery discounts via `deliveryDiscountsAdd` operations

### Key Files Structure

**App Routes**
- `app/routes/app._index.tsx` - Main dashboard
- `app/routes/app.bundles.create.tsx` - Bundle creation form
- `app/routes/app.bundles.$bundleId.tsx` - Bundle editing
- `app/routes/app.settings.tsx` - Discount implementation type settings
- `app/routes/api.create-bundle-discount.ts` - API for discount creation

**Database Models**
- `prisma/schema.prisma` - Complete database schema
- Models: Bundle, BundleStep, BundlePricing, StepProduct, BundleAnalytics, ShopSettings

**Extensions**
- `extensions/bundle-builder/` - Liquid theme extension for bundle UI
- `extensions/bundle-discount-function-ts/` - TypeScript discount functions
- `extensions/bundle-cart-transform-ts/` - TypeScript cart transform functions

### Bundle Logic Flow

**Discount Functions Flow:**
1. Bundle created in admin interface → stored in database
2. Bundle published → creates Shopify automatic discount via [`discountAutomaticAppCreate`](https://shopify.dev/docs/api/admin-graphql/2025-07/mutations/discountAutomaticAppCreate)
3. Bundle data stored in product metafields using `bundle_discounts/discount_settings` namespace
4. Customer adds bundle products → cart analyzed by discount functions at checkout
5. Functions check bundle conditions and apply appropriate discount operations

**Cart Transform Flow:**
1. Bundle data stored in same metafield format as discount functions
2. Cart transform function activated via [`cartTransformCreate`](https://shopify.dev/docs/api/admin-graphql/unstable/mutations/cartTransformCreate)
3. Real-time cart modifications merge bundle items into single line
4. Savings displayed immediately in cart without requiring checkout

### Environment Configuration

The app uses multiple Shopify configuration files following [Function Configuration](https://shopify.dev/docs/api/functions/configuration) standards:
- `shopify.app.toml` - Main app configuration with access scopes
- `shopify.extension.toml` - Function-specific configuration for each extension
- Extension targets: `cart.lines.discounts.generate.run`, `cart.delivery-options.discounts.generate.run`, `cart.transform.run`

### Testing Architecture

**Function Testing** (Following [Testing Functions Guide](https://shopify.dev/docs/apps/build/functions/testing))
- Vitest for unit testing discount logic
- Mock input data for comprehensive test coverage
- Test files: `*_test.ts` in function directories
- 17/17 discount function tests passing
- 5/5 cart transform tests passing

**Main App Testing**
- ESLint for code quality
- Build validation for deployment readiness

## Database Schema Details

### Core Entity Relationships

**Bundle Hierarchy (1:N relationships)**
```
Bundle (1) → BundleStep (N) → StepProduct (N)
Bundle (1) → BundlePricing (1)
Bundle (1) → BundleAnalytics (N)
Shop (1) → ShopSettings (1)
```

### Key Design Patterns

**1. Multi-Tenant Architecture**
- All core entities include `shopId` for shop isolation
- Session management with shop-specific scopes
- Indexed on `shopId` for query performance

**2. Flexible JSON Storage (JSONB fields)**
- `Bundle.settings` & `Bundle.matching` - Configuration data
- `BundleStep.collections` & `BundleStep.products` - Dynamic product/collection references
- `StepProduct.variants` - Shopify variant data caching
- `BundlePricing.rules` - Complex discount rule definitions
- `BundlePricing.messages` - UI customization data

**3. State Management Enums**
```typescript
enum BundleStatus { draft, active, archived }
enum JobStatus { pending, processing, completed, failed }
enum DiscountMethodType { fixed_amount_off, percentage_off, free_shipping }
enum DiscountImplementationType { discount_function, cart_transformation }
```

### JSON Field Structures

**BundlePricing.rules** stores discount rules:
```typescript
interface DiscountRule {
  discountOn: string;           // "quantity"
  minimumQuantity: number;      // 2
  fixedAmountOff: number;       // 10.00
  percentageOff: number;        // 15
}
```

**BundleStep.products** stores Shopify product references:
```typescript
interface BundleProduct {
  id: string;                   // "gid://shopify/Product/123"
  title: string;                // "Product Name"
  variants?: Array<{
    id: string;                 // "gid://shopify/ProductVariant/456"
    title: string;              // "Variant Name"
    price?: string;             // "29.99"
  }>;
}
```

### Performance & Features

**Strategic Indexing:**
- Shop-based queries: `Bundle_shopId_idx`, `BundleAnalytics_shopId_idx`
- Status filtering: `Bundle_status_idx`, `QueuedJob_status_idx`
- Time-series data: `BundleAnalytics_createdAt_idx`
- Foreign key relationships: All junction tables indexed

**Notable Features:**
- Cascade deletes maintain referential integrity
- Job queue system for async operations (publish/unpublish/sync)
- GDPR compliance tracking via `ComplianceRecord`
- Analytics tracking (view, add_to_cart, purchase events)
- Dual pricing model: structured DB storage + flattened metafield data

## Key API Operations

**Bundle Discount Creation:**
```graphql
mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
  discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
    automaticAppDiscount { discountId title }
    userErrors { field message }
  }
}
```

**Cart Transform Creation:**
```graphql
mutation cartTransformCreate($functionId: String!) {
  cartTransformCreate(functionId: $functionId) {
    cartTransform { id functionId }
    userErrors { field message }
  }
}
```

**Bundle Metafield Structure:**
- Namespace: `bundle_discounts`
- Key: `discount_settings`
- Type: JSON with bundle configuration

**Required Scopes:**
`read_content,write_discounts,write_cart_transforms,write_products,read_products,write_metafields,read_metafields,read_themes,write_themes`

## Function Limitations

**Collection-Based Bundle Matching:**
Direct collection membership queries are not supported in Shopify Functions GraphQL schema. Pre-compute product-collection relationships and store in bundle metadata.

**Implementation Comparison:**
- **Discount Functions**: Applied at checkout, available on all Shopify plans
- **Cart Transform**: Real-time in cart, Shopify Plus only

## Application Flow Documentation

### Complete User Journey Flows

#### 🚀 Primary User Flow: Bundle Setup

**Flow Path:** `/app` → `/app/dashboard` → Bundle Type Selection → Bundle Creation → Bundle Configuration → Publishing

**1. App Landing & Welcome (`/app`)**
```
app._index.tsx
├── Welcome message and feature overview
├── "Start My Bundling Journey" CTA → navigates to /app/dashboard
└── Feature comparison (Cart Transform vs Discount Functions)
```

**2. Dashboard (`/app/dashboard`)**
```
app.dashboard.tsx
├── Empty State (No bundles):
│   ├── Bundle Setup Instructions (progress tracking)
│   ├── "Quick Setup" CTA → navigates to bundle creation
│   └── Settings access for discount implementation type
└── Populated State (Has bundles):
    ├── DataTable with all bundles
    ├── Create/Edit/Delete actions
    └── Bundle type and status information
```

**3. Bundle Type Selection (`/app/bundle-type-selection`)**
```
app.bundle-type-selection.tsx
├── Cart Transform Bundles card → /app/bundles/cart-transform
├── Discount Function Bundles card → /app/bundles/discount-functions
└── Help text explaining differences and requirements
```

**4. Bundle Configuration (`/app/bundles/{bundleId}`)**
```
app.bundles.$bundleId.tsx
├── Bundle Details Tab:
│   ├── Name, description, status
│   ├── Bundle steps configuration
│   └── Product/collection selection via ResourcePicker
├── Discount Settings Tab:
│   ├── Enable/disable discounts
│   ├── Discount method (fixed, percentage, free shipping)
│   └── Minimum quantity and discount values
└── Publish Actions:
    ├── Save Draft
    ├── Publish Bundle (creates Shopify discount + metafields)
    └── Unpublish Bundle
```

#### ⚙️ Settings & Configuration Flow

**Settings Page (`/app/settings`)**
```
app.settings.tsx
├── Discount Implementation Type:
│   ├── Radio: "Discount Functions (All Plans)"
│   ├── Radio: "Cart Transformation (Shopify Plus Only)"
│   └── Save Settings → affects bundle publishing behavior
└── Future settings expansion area
```

#### 🔄 Technical Data Flow

**Bundle Publishing Pipeline:**
```
1. User clicks "Publish Bundle" in bundle editor
2. Server action processes:
   ├── Updates bundle status to "active" 
   ├── Creates Shopify automatic discount via discountAutomaticAppCreate
   ├── Stores bundle data in product metafields (bundle_discounts namespace)
   └── Activates appropriate function based on shop settings
3. Function execution at runtime:
   ├── Discount functions: Applied at checkout
   └── Cart transform: Applied in real-time to cart
```

**Route Architecture:**
- `/app` → `/app/dashboard` → Bundle Type Selection → Bundle Configuration → Publishing

**State Management:**
- React useState for UI state
- Remix loader/action for server state
- Prisma for database
- Metafields for function configuration

## Key Documentation Links

**Core Development:**
- [Shopify Functions Overview](https://shopify.dev/docs/apps/build/functions)
- [Build Discount Functions](https://shopify.dev/docs/apps/build/discounts/build-discount-function)
- [Cart Transform Functions](https://shopify.dev/docs/apps/build/product-merchandising/bundles/add-customized-bundle-function)
- [Testing Functions](https://shopify.dev/docs/apps/build/functions/testing)

**API References:**
- [Admin API - Discount Mutations](https://shopify.dev/docs/api/admin-graphql/2025-07/mutations/discountAutomaticAppCreate)
- [Admin API - Cart Transform](https://shopify.dev/docs/api/admin-graphql/unstable/mutations/cartTransformCreate)
- [Metafields API](https://shopify.dev/docs/apps/build/custom-data/metafields/definitions)
- [Function Input/Output](https://shopify.dev/docs/apps/build/functions/input-output)

---

## Quick Reference Commands

### Development Workflow
```bash
# Start development
npm run dev

# Test functions
cd extensions/bundle-discount-function-ts && npm run test
cd extensions/bundle-cart-transform-ts && npm run test

# Build and deploy
npm run build
shopify app deploy

# Database operations
npx prisma generate
npx prisma db push
```

### Function Development
```bash
# Generate types from GraphQL schema
npm run typegen

# Preview function with sample data
shopify app function run

# Watch mode for continuous testing
npm run test:watch
```

## Cart Transform Configuration ✅

**Features:**
- Multi-section navigation (Step Setup, Discount & Pricing, Bundle Settings)
- Advanced step management with collapsible cards
- ResourcePicker integration for products and pages
- Contextual save bar with comprehensive change detection
- Complete discount rule management with tiered pricing
- Bundle product synchronization

**Implementation:**
- File: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
- 920+ lines with full state management
- MCP server validated GraphQL operations
- App Bridge 3.0 integration

## Enhanced Contextual Save Bar ✅

**Universal Change Detection:**
- Detects ALL form interactions (text inputs, dropdowns, checkboxes)
- JSON comparison for complex state changes
- Immediate save bar activation on modifications

**Implementation:**
- `triggerSaveBar()` helper function
- `data-save-bar` form integration
- App Bridge 3.0 navigation blocking
- Hidden inputs for state tracking

---

## Place Widget Functionality ✅

**Dynamic Theme Editor Integration:**
- Real-time theme template discovery via GraphQL and REST APIs
- Professional theme editor deep linking with auto-activation
- Template-specific widget placement (product, collection, homepage, etc.)
- One-click theme editor access with Bundle Builder pre-loaded

**Implementation Details:**

**GraphQL Theme Discovery:**
```graphql
query getPublishedTheme {
  themes(first: 1, roles: [MAIN]) {
    nodes {
      id
      name
      role
    }
  }
}
```

**REST API Theme Assets Integration:**
```typescript
// Extract numeric theme ID from GraphQL GID format
const themeId = publishedTheme.id.replace('gid://shopify/OnlineStoreTheme/', '');

// Fetch theme assets via REST API
const assetsUrl = `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json`;
```

**Deep Link Generation:**
```typescript
// Correct app block ID format: {client_id}/{block_handle}
const appBlockId = 'bfda5624970c7ada838998eb951e9e85/bundle';

// Theme editor deep link with auto-activation
const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection`;
```

**Key Features:**
- **Template Classification**: Automatic categorization of templates (product, collection, homepage, cart, etc.)
- **Professional UI**: Modal-based template selection with visual preview
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Debug Logging**: Console logging for development troubleshooting
- **Access Scopes**: Updated with `read_themes` and `write_themes` permissions

**Technical Architecture:**
- **File**: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
- **Functions**: `handleGetThemeTemplates()`, `handlePageSelection()`, `handlePlaceWidget()`
- **API Integration**: GraphQL Admin API + REST API for comprehensive theme access
- **Authentication**: Proper Shopify session token handling for embedded app context

**User Experience:**
1. Click "Place Widget" button in bundle configuration
2. System automatically discovers all available theme templates
3. Professional modal displays templates with descriptions and recommendations  
4. Select desired template (product page, collection page, homepage, etc.)
5. Theme editor opens with Bundle Builder app block pre-activated
6. Drag and drop block to desired location in theme

**Access Scope Requirements:**
```toml
scopes = "read_content,write_discounts,write_products,read_themes,write_themes"
```

**Troubleshooting:**
- **"App block not found" errors**: Ensure app is deployed and block handle matches filename (`bundle.liquid` → `bundle`)
- **Theme ID extraction issues**: Verify GID format conversion from GraphQL to numeric ID for REST API
- **Deep link failures**: Check app block ID format and theme editor URL parameters
- **Access denied errors**: Confirm proper theme-related access scopes are configured

---

## Dual Bundle System Implementation (August 2025) ✅

### Comprehensive Metafield Architecture - Production Ready

**Overview:**
Implemented a sophisticated dual bundle system supporting both **Cart Transform Functions** (Shopify Plus) and **Discount Functions** (All Plans) with separate metafield configurations, unified UI, and seamless switching between implementation types.

**Key Features Implemented:**

**1. Dual Metafield System**
- **Cart Transform Config**: `bundle_discounts/cart_transform_config` - Real-time cart modifications
- **Discount Function Config**: `bundle_discounts/discount_function_config` - Checkout-time discounts
- **Metafield Definitions**: Automatic creation before saving bundle data
- **Backward Compatibility**: Legacy format support for existing bundles

**2. Enhanced Page Selection Modal**
- **Professional Interface**: Modal with Shopify pages API integration
- **Theme Editor Deep Links**: Direct page editing with context parameters
- **Resource Picker Pattern**: Consistent with Shopify admin patterns
- **Multi-selection Support**: Checkbox-based page selection

**3. Interactive Badge System**
- **Clickable Product Badges**: Show selected products in alert dialogs
- **Clickable Collection Badges**: Display selected collections
- **Count Indicators**: Clear visual feedback for selection counts
- **Professional Styling**: Micro buttons within badges for interaction

**4. File Organization & Naming**
- **Descriptive Prefixes**: `cart-transform-` and `discount-function-` prefixes
- **GraphQL Files**: Renamed input queries for clarity
- **Utility Functions**: Separate bundle utilities for each implementation type
- **TOML Configuration**: Updated extension configs to reference renamed files

**Technical Implementation Details:**

**Metafield Architecture:**
```typescript
// Metafield definitions creation
async function ensureBundleMetafieldDefinitions(admin: any) {
  const definitions = [
    {
      name: "Cart Transform Bundle Config",
      namespace: "bundle_discounts",
      key: "cart_transform_config",
      description: "Cart transform bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    },
    {
      name: "Discount Function Bundle Config", 
      namespace: "bundle_discounts",
      key: "discount_function_config",
      description: "Discount function bundle configuration data",
      type: "json",
      ownerType: "PRODUCT"
    }
  ];
  
  // Create definitions if they don't exist
  for (const definition of definitions) {
    await createMetafieldDefinition(admin, definition);
  }
}
```

**Bundle Data Structures:**
```typescript
// Cart Transform Config Format
interface CartTransformConfig {
  type: "cart_transform";
  bundleId: string;
  name: string;
  steps: BundleStep[];
  pricing: {
    enabled: boolean;
    method: string;
    rules: DiscountRule[];
  };
  settings: {
    displayVariantsAsIndividual: boolean;
    showDiscountMessaging: boolean;
  };
}

// Discount Function Config Format  
interface DiscountFunctionConfig {
  type: "discount_function";
  bundleId: string;
  name: string;
  steps: BundleStep[];
  pricing: {
    enabled: boolean;
    method: string;
    rules: DiscountRule[];
  };
  conditions: {
    minimumQuantity?: number;
    applicableProducts: string[];
  };
}
```

**GraphQL Queries (MCP Validated):**
```graphql
# Cart Transform Input Query
query BundleCartTransformInput {
  cart {
    lines {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          product {
            id
            metafield(namespace: "bundle_discounts", key: "cart_transform_config") {
              value
            }
          }
        }
      }
      cost {
        amountPerQuantity {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
}

# Discount Function Input Query
query BundleDiscountFunctionInput {
  cart {
    lines {
      id
      quantity
      merchandise {
        __typename
        ... on ProductVariant {
          id
          product {
            id
            title
            metafield(namespace: "bundle_discounts", key: "discount_function_config") {
              value
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    deliveryGroups {
      id
    }
  }
  discount {
    discountClasses
  }
}
```

**Enhanced UI Components:**

**Page Selection Modal:**
```tsx
// Professional page selection with theme editor integration
const handlePlaceWidget = useCallback(async () => {
  setIsPageSelectionModalOpen(true);
  await loadAvailablePages();
}, [loadAvailablePages]);

const handlePageSelection = useCallback((pages: any[]) => {
  const selectedPage = pages[0];
  if (selectedPage) {
    // Open theme editor with deep link
    const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?template=${selectedPage.handle}&section=bundle-widget`;
    window.open(themeEditorUrl, '_blank');
  }
  setIsPageSelectionModalOpen(false);
}, [session.shop]);
```

**Interactive Badge Implementation:**
```tsx
// Clickable product selection badges
<Badge tone="info">
  <Button
    variant="plain"
    size="micro"
    onClick={() => {
      const selectedProducts = step.StepProduct || [];
      const productList = selectedProducts.map(p => p.title || p.name || 'Unnamed Product').join(', ');
      alert(`Selected Products (${selectedProducts.length}):\n\n${productList}`);
    }}
  >
    {step.StepProduct.length} Selected
  </Button>
</Badge>

// Clickable collection selection badges
<Badge tone="info">
  <Button
    variant="plain"
    size="micro"
    onClick={() => {
      const collectionList = selectedCollections.map(c => c.title).join(', ');
      alert(`Selected Collections (${selectedCollections.length}):\n\n${collectionList}`);
    }}
  >
    {selectedCollections.length} Selected
  </Button>
</Badge>
```

**File Organization Results:**

**Cart Transform Files:**
- `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
- `extensions/bundle-cart-transform-ts/src/cart-transform-bundle-utils.ts`
- `extensions/bundle-cart-transform-ts/src/cart-transform-run.ts`

**Discount Function Files:**
- `extensions/bundle-discount-function-ts/src/discount-function-input.graphql`
- `extensions/bundle-discount-function-ts/src/discount-function-bundle-utils.ts`
- `extensions/bundle-discount-function-ts/src/cart-lines-discounts-generate-run.ts`
- `extensions/bundle-discount-function-ts/src/cart-delivery-options-discounts-generate-run.ts`

**Bundle Data Processing:**

**Enhanced Parsing with Backward Compatibility:**
```typescript
export function parseBundleDataFromMetafield(metafieldValue: string): BundleData | null {
  try {
    const parsedData = JSON.parse(metafieldValue);
    
    // Handle new cart transform config format
    if (parsedData.type === "cart_transform" && parsedData.bundleId) {
      return transformCartTransformConfig(parsedData);
    }
    
    // Handle new discount function config format
    if (parsedData.type === "discount_function" && parsedData.bundleId) {
      return transformDiscountFunctionConfig(parsedData);
    }
    
    // Handle legacy format (direct BundleData)
    if (parsedData.id && parsedData.name) {
      return parsedData;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse bundle metafield:", error);
    return null;
  }
}
```

**Action Handler Integration:**
```typescript
// Complete bundle publishing with metafield management
const actionData = await saveCartTransformBundle(
  bundleData,
  admin,
  session.shop,
  bundleId
);

async function saveCartTransformBundle(bundleData: any, admin: any, shopId: string, bundleId: string) {
  // 1. Ensure metafield definitions exist
  await ensureBundleMetafieldDefinitions(admin);
  
  // 2. Save bundle to database
  const updatedBundle = await updateBundleInDatabase(bundleData, shopId, bundleId);
  
  // 3. Create/update Shopify product if needed
  if (!updatedBundle.bundleProduct?.shopifyProductId) {
    await createShopifyBundleProduct(admin, updatedBundle);
  }
  
  // 4. Update product metafields with bundle configuration
  await updateProductMetafields(admin, updatedBundle, "cart_transform");
  
  return { success: true, bundle: updatedBundle };
}
```

**Extension Configuration Updates:**

**Cart Transform TOML:**
```toml
[[extensions.targeting]]
target = "purchase.cart-transform.run"
input_query = "src/cart-transform-input.graphql"
export = "cart-transform-run"
```

**Discount Function TOML:**
```toml
[[extensions.targeting]]
target = "cart.lines.discounts.generate.run"
input_query = "src/discount-function-input.graphql"
export = "cart-lines-discounts-generate-run"

[[extensions.targeting]]
target = "cart.delivery-options.discounts.generate.run"
input_query = "src/discount-function-input.graphql"
export = "cart-delivery-options-discounts-generate-run"
```

**Implementation Benefits:**

**Developer Experience:**
- **Clear Separation**: Distinct file naming prevents confusion between implementations
- **Unified Interface**: Same UI manages both bundle types seamlessly
- **Type Safety**: Full TypeScript support for both bundle formats
- **Easy Migration**: Backward compatibility ensures existing bundles continue working

**User Experience:**
- **Professional Modals**: Standard Shopify admin interface patterns
- **Interactive Elements**: Clickable badges provide immediate feedback
- **Deep Linking**: Direct access to theme editor for widget placement
- **Visual Consistency**: Unified design across both bundle types

**Maintenance Benefits:**
- **Modular Architecture**: Each bundle type has its own processing logic
- **Extensible Design**: Easy to add new bundle types in the future
- **Error Isolation**: Issues in one bundle type don't affect the other
- **Testing Separation**: Independent test suites for each implementation

**Code Quality Results:**
- ✅ All GraphQL operations validated via MCP server
- ✅ TypeScript compilation successful with enhanced type safety
- ✅ File organization improved with descriptive naming
- ✅ No linting errors after renaming and reorganization
- ✅ Extension builds successful with updated configurations

This dual bundle system implementation provides a solid foundation for supporting both Shopify plan types while maintaining code clarity, user experience consistency, and future extensibility.

---

## Cart Transform Bundle Configuration Enhancements (January 2025) ✅

### Authentication and Schema Compatibility Fixes - Production Ready

**Overview:**
Resolved critical authentication and database schema issues in the cart transform bundle configuration flow, ensuring reliable save and sync operations with proper Shopify session handling.

**Issues Resolved:**

**1. Bundle Save Authentication Errors**
- **Problem**: Raw `fetch()` calls causing "Unexpected token '<'" JSON parsing errors
- **Root Cause**: Missing Shopify session tokens in embedded app requests
- **Solution**: Replaced `fetch()` with Remix `useFetcher()` for proper authentication flow

**2. Prisma Schema Validation Errors**
- **Problem**: Frontend sending `pageTitle` and `stepNumber` fields not in database schema
- **Solution**: Added field mapping: `pageTitle` → `name`, `stepNumber` → `position`
- **Enhancement**: Added `mapDiscountMethod()` to convert `fixed_bundle_price` to `fixed_amount_off`

**3. Sync Product Functionality**
- **Problem**: Sync product action using raw fetch causing same authentication issues
- **Solution**: Unified all form submissions to use `useFetcher()` pattern
- **Enhancement**: Smart response detection for different action types in single handler

**Technical Implementation:**

**Authentication Pattern:**
```typescript
// Before (Problematic)
const response = await fetch(window.location.pathname, {
  method: "POST", 
  body: formData
});
const result = await response.json(); // HTML parsing error

// After (Fixed)  
const fetcher = useFetcher<typeof action>();
fetcher.submit(formData, { method: "post" }); // Properly authenticated

// Smart response handling
useEffect(() => {
  if (fetcher.data && fetcher.state === 'idle') {
    if (result.bundle) {
      // Handle save bundle response
    } else if (result.productId) {
      // Handle sync product response
    }
  }
}, [fetcher.data, fetcher.state]);
```

**Schema Field Mapping:**
```typescript
// Fixed Prisma field mappings
data: stepsData.map((step: any, index: number) => ({
  name: step.pageTitle || step.name, // Map pageTitle to name
  position: index + 1, // Map stepNumber to position
  displayVariantsAsIndividual: step.displayVariantsAsIndividualProducts,
  minQuantity: step.minQuantity || 1,
  maxQuantity: step.maxQuantity || 1,
  enabled: step.enabled !== false
}))

// Discount method mapping
function mapDiscountMethod(discountType: string): string {
  switch (discountType) {
    case 'fixed_bundle_price': return 'fixed_amount_off';
    case 'percentage_off': return 'percentage_off';
    case 'free_shipping': return 'free_shipping';
    default: return 'fixed_amount_off';
  }
}
```

### Professional UI Modal Implementation - UX Enhancement

**Overview:**
Replaced jarring browser alerts with professional Shopify Polaris modals for viewing selected products and collections in bundle steps.

**UI Improvements:**

**1. Products/Collections View Modals**
- **Before**: Basic `alert()` with comma-separated text
- **After**: Professional Polaris Modal with structured lists and badges

**2. Modal Features**
- **Products Modal**: Shows selected products with variant counts and blue badges
- **Collections Modal**: Displays collections with handles and green badges  
- **Polaris List Components**: Organized bullet-point presentation
- **Empty States**: Graceful handling of no selections
- **Responsive Design**: Follows Shopify admin interface patterns

**Implementation:**
```typescript
// Modal state management
const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
const [currentModalStepId, setCurrentModalStepId] = useState<string>('');

// Handler functions
const handleShowProducts = useCallback((stepId: string) => {
  setCurrentModalStepId(stepId);
  setIsProductsModalOpen(true);
}, []);

// Modal implementation
<Modal open={isProductsModalOpen} title="Selected Products">
  <Modal.Section>
    <Card>
      <List type="bullet">
        {selectedProducts.map((product: any) => (
          <List.Item key={product.id}>
            <InlineStack gap="200" align="space-between">
              <BlockStack gap="050">
                <Text variant="bodyMd" fontWeight="medium">
                  {product.title || 'Unnamed Product'}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {product.variants?.length} variants available
                </Text>
              </BlockStack>
              <Badge tone="info">Product</Badge>
            </InlineStack>
          </List.Item>
        ))}
      </List>
    </Card>
  </Modal.Section>
</Modal>
```

**Results Achieved:**

**Reliability Improvements:**
- ✅ Eliminated all authentication failures (`shop: null` errors)
- ✅ Fixed JSON parsing errors from HTML responses  
- ✅ Resolved Prisma validation errors on save operations
- ✅ Unified authentication flow across all form actions

**User Experience Enhancements:**
- ✅ Professional modal dialogs replace browser alerts
- ✅ Structured data presentation with proper badges and typography
- ✅ Consistent design system alignment with Shopify standards
- ✅ Enhanced accessibility and mobile responsiveness

**Code Quality:**
- ✅ Proper TypeScript types and error handling
- ✅ Remix pattern compliance for embedded Shopify apps
- ✅ Database schema compatibility and field mapping
- ✅ Modular, maintainable component architecture

This implementation ensures the cart transform bundle configuration is now production-ready with robust authentication, proper error handling, and professional UI components that align with Shopify's design standards.

---

## Future Development TODOs & Placeholders

### Implementation Priorities for Next Development Sessions

**High Priority Items:**

**1. Bundle Creation Error Handling**
- **Location**: `app/routes/app.bundles.create.tsx:22`
- **TODO**: Handle error: bundle name is required
- **Implementation**: Add proper form validation with toast notifications

**2. Database Error Handling**
- **Location**: `app/routes/app.bundles.create.tsx:40`  
- **TODO**: Handle database error more gracefully
- **Implementation**: Implement comprehensive error boundary with user-friendly messages

**3. Product Status Management**
- **Location**: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx:1230`
- **TODO**: Implement actual product status update via GraphQL
- **Implementation**: Add `productUpdate` mutation to sync bundle product status

**Medium Priority Items:**

**4. Documentation Updates**
- **Location**: `README.md:341`
- **TODO**: Uncomment documentation section after docs update
- **Implementation**: Update documentation with new dual bundle system

**5. Collection-Based Bundle Support**
- **Status**: Partially implemented with limitations
- **TODO**: Full collection-based bundle matching in functions
- **Implementation**: Pre-compute product-collection relationships and store in metafields

**6. Advanced Analytics Integration**
- **TODO**: Bundle performance analytics dashboard
- **Implementation**: Extend BundleAnalytics model with conversion tracking

**Low Priority Enhancements:**

**7. Multi-language Support**
- **TODO**: Internationalization for bundle messaging
- **Implementation**: Add i18n support for discount messages and UI text

**8. Bundle Templates**
- **TODO**: Pre-built bundle templates for common use cases
- **Implementation**: Template system with wizard-based bundle creation

**9. Advanced Pricing Rules**
- **TODO**: Complex pricing conditions (buy X get Y, tiered pricing)
- **Implementation**: Enhanced pricing rule engine with multiple condition types

**10. Bundle Preview**
- **TODO**: Real-time bundle preview in admin interface
- **Implementation**: Storefront preview modal with cart simulation

**Technical Debt Items:**

**11. Function Performance Optimization**
- **TODO**: Bundle matching algorithm optimization for large catalogs
- **Implementation**: Caching layer and optimized product lookup

**12. Test Coverage Enhancement**  
- **TODO**: Comprehensive end-to-end test suite
- **Implementation**: Playwright tests for complete user workflows

**13. Error Monitoring**
- **TODO**: Structured logging and error tracking
- **Implementation**: Sentry integration with function error reporting

**Future Architecture Considerations:**

**14. Bundle Variants Support**
- **TODO**: Support for variant-level bundle configuration
- **Implementation**: Extend metafield structure for variant-specific rules

**15. Third-party Integration**
- **TODO**: Integration with loyalty programs and subscription apps
- **Implementation**: Webhook system for external bundle event notifications

**16. Performance Monitoring**
- **TODO**: Function execution time monitoring and alerting
- **Implementation**: Custom metrics dashboard with performance insights

**Notes for Implementation:**
- All TODOs should be implemented following the MCP server validation workflow
- GraphQL changes must be validated using `mcp__shopify-dev-mcp__validate_graphql_codeblocks`
- UI changes should use verified Polaris component patterns
- Database changes require migration planning and backward compatibility consideration

---

This documentation is based on official Shopify documentation and follows current best practices for Shopify app development, Function implementation, and API integration patterns.