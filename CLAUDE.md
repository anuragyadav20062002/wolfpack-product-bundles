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

## Bundle Step Conditions System

**Implementation Status:** ✅ Production Ready

**Key Features:**
- **Step-Level Conditions**: Each bundle step can have quantity/amount-based conditions
- **Operator Support**: `equal_to`, `greater_than`, `less_than`, `greater_than_or_equal_to`, `less_than_or_equal_to`
- **Database Schema**: Added `conditionType`, `conditionOperator`, `conditionValue` fields to BundleStep model
- **Function Integration**: Conditions propagate to discount/cart transform functions via metafields

**Technical Architecture:**
```javascript
// Database Storage
{
  conditionType: "quantity",        // Type of condition (quantity/amount)
  conditionOperator: "equal_to",    // Comparison operator
  conditionValue: 2                 // Numeric value to compare against
}
```

**Debug Logging:** Comprehensive logging system tracks condition flow from UI → database → functions

---

## Recent Technical Improvements (Latest)

**✅ Type Safety & Validation Fixes:**
- Fixed PrismaClientValidationError for integer field type mismatches
- Added `parseInt()` conversions for `minQuantity`, `maxQuantity`, `conditionValue`
- Resolved form syntax errors preventing proper data submission

**✅ App Bridge Save Bar Modernization:**
- Updated to modern `data-save-bar` attribute approach (App Bridge 4.x)
- Removed complex manual save bar triggering logic
- Improved change detection for configuration updates

**✅ Step Conditions Data Flow:**
- Verified end-to-end propagation from UI → database → metafields → functions
- Fixed operator value mismatches between UI and function expectations
- Added comprehensive debug logging for troubleshooting

**✅ Code Quality & Consistency:**
- Synchronized UI components between cart transform and discount function pages
- Removed outdated console logs and replaced with structured debug logging
- Fixed JavaScript syntax errors in bundle widget components

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
- **Theme Editor Configuration**: Comprehensive widget configuration with improved UX
- **Widget Positioning**: Fixed theme block positioning using proper Shopify architecture
- **Configuration Options**: Added 20+ new configuration options with intuitive names and tooltips
- **Prisma Validation Fixes**: Resolved PrismaClientValidationError with proper type conversions
- **Bundle Step Conditions System**: Complete implementation with quantity/amount-based rules
- **App Bridge Save Bar Modernization**: Updated to modern data-save-bar approach
- **Database Schema Evolution**: Added conditionOperator field for proper function integration
- **UI Synchronization**: Aligned cart transform and discount function configure pages

**✅ Recently Completed Tasks:**
1. **Fix Liquid syntax validation errors in theme extension** - Removed double curly braces from template defaults
2. **Deploy theme extension with fixes** - Successfully deployed version bundle-discount-functions-43
3. **Verify new config options appear in theme editor** - All configuration sections now visible
4. **Improve configuration option names and tooltips for better UX** - Enhanced labels and added helpful tooltips
5. **Add width configuration options for widget elements** - Added responsive sizing controls
6. **Verify widget positioning functionality using MCP server** - Confirmed proper theme block architecture
7. **Resolve Prisma validation errors** - Fixed syntax and type conversion issues preventing application functionality
8. **Implement bundle step conditions system** - Added complete quantity/amount-based condition logic with database integration
9. **Modernize App Bridge save bar** - Updated from manual triggering to modern data-save-bar approach
10. **Synchronize UI components** - Aligned cart transform and discount function configuration pages
11. **Implement toast notification system** - Replaced browser alert dialogs with professional toast notifications
12. **Enable line-item discount support** - Added PRODUCT class discount functionality alongside ORDER class discounts
13. **Fix cart line discount application** - Resolved issues with bundle discounts not applying to individual cart items
14. **Enhance bundle condition enforcement UX** - Improved user feedback with contextual toast messages

**📋 Recent Technical Improvements:**

**Bundle Step Conditions System:**
- **Database Schema**: Added `conditionOperator` field to BundleStep model for proper function integration
- **Type Safety**: Implemented parseInt() conversions for quantity/amount fields (minQuantity, maxQuantity, conditionValue)
- **Operator Synchronization**: Fixed UI-function mismatch by updating from 'is_equal_to' to 'equal_to' format
- **Debug Logging**: Added comprehensive logging system for condition flow verification
- **End-to-End Verification**: Confirmed conditions propagate correctly from UI through database to functions

**App Bridge Save Bar Modernization:**
- **Modern Approach**: Replaced manual save bar triggering with data-save-bar attribute approach
- **MCP Research**: Used Shopify dev MCP server to verify current best practices
- **Simplified Implementation**: Removed complex hidden field logic in favor of React state management
- **Improved UX**: Better responsiveness to configuration changes

**Database and Type Safety:**
- **Prisma Validation**: Fixed PrismaClientValidationError with proper syntax and type conversions
- **Schema Evolution**: Added conditionOperator field for complete step condition support  
- **Integer Conversion**: Implemented proper parseInt() handling for numeric database fields
- **Error Prevention**: Added comprehensive validation to prevent future type mismatch issues

**Toast Notification System:**
- **Modern UX**: Replaced all browser alert() dialogs with professional toast notifications
- **Multiple Types**: Support for info, warning, error, and success messages with distinct styling
- **Smart Positioning**: Fixed positioning (top-right) with proper z-index stacking
- **Auto-Dismiss**: Configurable timeout with manual close option
- **Smooth Animations**: CSS transitions for slide-in effects and fade-out

**Line-Item Discount Enhancement:**
- **PRODUCT Class Support**: Added individual cart line targeting alongside ORDER class discounts
- **Proportional Distribution**: Smart allocation of fixed amount discounts across multiple items
- **Enhanced GraphQL**: Updated input queries to capture line attributes for bundle detection
- **Test Coverage**: All discount function tests updated and passing for new functionality

**🔧 High Priority TODOs:**
1. **Bundle Creation Error Handling** - Implement comprehensive error handling for bundle creation workflow
2. **Database Error Handling** - Add robust error recovery and user feedback for database operations  
3. **Product Status Management** - Enhance product synchronization and status tracking
4. **Performance Optimization** - Review and optimize bundle widget JavaScript for large product catalogs
5. **Fixed Bundle Price Support** - Complete implementation of fixed bundle pricing in discount functions

**🎯 Medium Priority TODOs:**
1. **Bundle Analytics Dashboard** - Add metrics and reporting for bundle performance
2. **Bulk Bundle Operations** - Enable batch creation, editing, and publishing of bundles
3. **Advanced Step Conditions** - Add amount-based conditions and complex logic operators
4. **Theme Compatibility Testing** - Verify widget compatibility across popular Shopify themes
5. **Mobile UX Enhancement** - Optimize bundle widget for mobile devices and touch interactions

**📱 Future Enhancements:**
1. **A/B Testing Framework** - Enable testing different bundle configurations
2. **AI-Powered Bundle Suggestions** - Recommend optimal bundle combinations
3. **Customer Behavior Tracking** - Analytics for bundle interaction patterns
4. **Multi-Language Support** - Internationalization for global stores
5. **Advanced Discount Rules** - Tiered pricing, buy-X-get-Y offers, and seasonal promotions





This documentation is based on official Shopify documentation and follows current best practices for Shopify app development.