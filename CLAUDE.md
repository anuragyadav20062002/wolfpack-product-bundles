# CLAUDE.md

## 🚨 MCP Server Usage

**MANDATORY**: Always use the Shopify dev MCP server as the **single source of truth** for all Shopify-related development work.

### Required MCP Server Workflow

**Before implementing ANY Shopify-related changes:**

1. **🔍 Research First**: Query the Shopify dev MCP server for official documentation and examples
2. **✅ Validate Everything**: Use MCP to verify API usage, component props, GraphQL schemas, and best practices  
3. **🚫 No Assumptions**: Never assume anything about Shopify APIs, Polaris components, or implementation patterns without MCP verification
4. **🛠️ Plan with MCP**: Base all implementation decisions on verified MCP information
5. **🔄 Verify Results**: Use MCP for troubleshooting and refinements

**Key MCP Tools Available:**
- `mcp__shopify-dev-mcp__learn_shopify_api` - Initialize API context
- `mcp__shopify-dev-mcp__search_docs_chunks` - Search documentation
- `mcp__shopify-dev-mcp__validate_graphql_codeblocks` - Validate GraphQL
- `mcp__shopify-dev-mcp__introspect_graphql_schema` - Explore schema

---

## Development Commands

### Main Application
- `npm run dev` - Start development server
- `npm run build` - Build the Remix application
- `npm run lint` - Run ESLint

### Functions
- `cd extensions/bundle-discount-function-ts && npm run test` - Test discount functions
- `cd extensions/bundle-cart-transform-ts && npm run test` - Test cart transform functions
- `npm run typegen` - Generate TypeScript types from GraphQL schema

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database

## Architecture Overview

Shopify bundling app with dual implementation approaches:

**Core Components:**
- **Discount Functions** (All Shopify plans) - Applied at checkout
- **Cart Transform Functions** (Shopify Plus only) - Real-time cart modifications
- **Bundle System** - Database models: Bundle, BundleStep, BundlePricing, StepProduct
- **Metafield Storage** - Bundle configurations stored in product metafields

**Key Implementation Details:**
- **Metafields**: `bundle_discounts` namespace for function configuration
- **Discount Classes**: ORDER (cart-wide), PRODUCT (line-item), SHIPPING (delivery)
- **Dual Metafield System**: Separate configs for cart transform and discount functions

**Key Files:**
- `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx` - Main bundle configuration UI
- `extensions/bundle-builder/` - Liquid theme extension with widget, CSS, and JavaScript
- `extensions/bundle-discount-function-ts/` - Discount functions
- `extensions/bundle-cart-transform-ts/` - Cart transform functions
- `prisma/schema.prisma` - Database schema

**Bundle Flow:**
1. Create bundle in admin → Store in database
2. Publish → Create Shopify discount + store metafields
3. Customer shops → Functions apply discounts or transform cart

## Database Schema

**Core Models:**
- `Bundle` - Main bundle configuration
- `BundleStep` - Individual steps with products/collections
- `BundlePricing` - Discount rules and pricing logic
- `StepProduct` - Product selections with variants
- `ShopSettings` - Shop-specific configuration

**Key Features:**
- Multi-tenant architecture with `shopId` isolation
- JSON fields for flexible configuration storage
- Status tracking: draft, active, archived

## Key API Operations

**Required Scopes:**
`read_content,write_discounts,write_cart_transforms,write_products,read_products,write_metafields,read_metafields,read_themes,write_themes`

**Bundle Metafields:**
- Cart Transform: `bundle_discounts/cart_transform_config`
- Discount Function: `bundle_discounts/discount_function_config`

## Bundle Widget System

**Theme Integration:**
- **Liquid Template**: `extensions/bundle-builder/blocks/bundle.liquid`
- **CSS Styling**: `extensions/bundle-builder/assets/bundle-widget.css`
- **JavaScript Logic**: `extensions/bundle-builder/assets/bundle-widget.js`

**Key Features:**
- **Product Matching**: Cart Transform bundles only show on configured Bundle Product
- **Step Cards**: Visual representation of bundle steps with product images
- **Modal Interface**: Interactive product selection with tabs and navigation
- **Preview URLs**: Automatic generation using `onlineStorePreviewUrl` for draft products
- **Development Store Support**: Compatible with both `shopifypreview.com` and `myshopify.com`

## Function Limitations

- Collection membership queries not supported in Functions GraphQL
- **Discount Functions**: Checkout-time, all plans
- **Cart Transform**: Real-time cart, Shopify Plus only

## User Flow

**Main Path:** Dashboard → Bundle Creation → Configuration → Publishing

**Key Routes:**
- `/app` - Dashboard with bundle overview
- `/app/bundles/cart-transform/configure/{bundleId}` - Main configuration UI
- `/app/settings` - Implementation type selection

---

## Current Implementation Status

**✅ Production Ready Features:**
- Dual bundle system (Cart Transform + Discount Functions)
- Professional UI with Polaris modals
- Theme editor integration with deep linking
- Authentication fixes for embedded app context
- Comprehensive metafield architecture

**🆕 Recent Enhancements (Latest):**
- **Enhanced Bundle Widget**: Step cards with product images and modal selection
- **Smart Product Matching**: Widget only displays on configured Bundle Products
- **Preview URL Generation**: Proper preview links for draft/unpublished products using `onlineStorePreviewUrl`
- **JavaScript Error Fixes**: Resolved syntax errors in bundle-widget.js
- **Improved UX**: Better visual feedback, debugging, and error handling
- **MCP Integration**: All GraphQL queries validated using Shopify dev MCP server

**🔧 High Priority TODOs:**
1. Bundle creation error handling (app/routes/app.bundles.create.tsx:22)
2. Database error handling (app/routes/app.bundles.create.tsx:40)
3. Product status management (app/routes/app.bundles.cart-transform.configure.$bundleId.tsx:1230)





This documentation is based on official Shopify documentation and follows current best practices for Shopify app development.