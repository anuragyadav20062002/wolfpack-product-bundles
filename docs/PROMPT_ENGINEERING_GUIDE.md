# Prompt Engineering Guide
## Recreate Wolfpack Product Bundles App Without Technical Knowledge

**Purpose:** This document contains a series of prompts that a developer with NO Shopify or Figma knowledge can use to recreate this entire application using AI assistance (like Claude Code, ChatGPT, etc.).

**Target Audience:** Developers who know general programming but have never worked with Shopify, Figma, or bundle apps.

**How to Use This Guide:**
1. Start from Phase 1
2. Copy each prompt exactly as written
3. Paste into your AI coding assistant
4. Follow the AI's instructions
5. Move to next prompt only after completing current one
6. Don't skip prompts - they build on each other

**Important Notes:**
- Replace `{YOUR_*}` placeholders with your actual values
- Each prompt is self-contained and explains what it does
- No prior Shopify/Figma knowledge required
- Total time: ~8-12 hours if following in order

---

## Table of Contents

- [Phase 1: Initial Setup](#phase-1-initial-setup)
- [Phase 2: Database & Core Models](#phase-2-database--core-models)
- [Phase 3: Shopify App Setup](#phase-3-shopify-app-setup)
- [Phase 4: Bundle Management](#phase-4-bundle-management)
- [Phase 5: Bundle Widget (Storefront)](#phase-5-bundle-widget-storefront)
- [Phase 6: Cart Transform Function](#phase-6-cart-transform-function)
- [Phase 7: Design Control Panel](#phase-7-design-control-panel)
- [Phase 8: Advanced Features](#phase-8-advanced-features)
- [Phase 9: Testing & Deployment](#phase-9-testing--deployment)

---

## Phase 1: Initial Setup

### Prompt 1.1: Create Project Structure

```
I need to create a Shopify app that allows merchants to create product bundles. I've never built a Shopify app before.

Please:
1. Create a new Remix-based Shopify app project structure
2. Use the official Shopify CLI to scaffold the app
3. Set up TypeScript configuration
4. Include Shopify Polaris for UI components
5. Configure Vite as the build tool

Show me the exact commands to run and explain what each one does in simple terms.

After setup, explain:
- What is Remix and why we use it
- What is Shopify Polaris
- What the folder structure means
```

### Prompt 1.2: Set Up Database

```
I need to set up a PostgreSQL database for my Shopify bundle app using Prisma.

Please:
1. Install Prisma and configure it for PostgreSQL
2. Create a basic database connection
3. Show me how to set up environment variables for database URLs
4. Generate initial Prisma client
5. Create a test connection to verify it works

Explain in simple terms:
- What is Prisma and why we use it instead of raw SQL
- What is a database migration
- How to run migrations locally

I'm using {YOUR_DATABASE_PROVIDER} for hosting the database.
```

### Prompt 1.3: Authentication Setup

```
I need to set up Shopify authentication for my app so merchants can log in.

Please:
1. Configure Shopify OAuth flow
2. Set up session management
3. Create protected routes that require authentication
4. Add environment variables for Shopify API credentials
5. Show me how to test authentication locally

Explain:
- What is OAuth and why Shopify uses it
- What are API scopes and which ones I need for a bundle app
- How sessions work in Remix

Required scopes: read_products, write_products, write_cart_transforms, read_orders
```

---

## Phase 2: Database & Core Models

### Prompt 2.1: Create Database Schema

```
I need to create database models for a bundle app. A bundle has multiple steps, each step has multiple products, and bundles have pricing rules.

Please create a Prisma schema with these models:
1. Shop - stores Shopify shop information
2. Bundle - main bundle configuration
3. BundleStep - individual steps in the bundle (like "Choose cleanser", "Choose moisturizer")
4. StepProduct - products available in each step
5. BundlePricing - pricing and discount rules
6. DesignSettings - widget appearance customization

Include proper relationships and explain what each model is for in simple terms.

After creating the schema, show me how to:
- Run migrations to create tables
- Seed the database with sample data for testing
```

### Prompt 2.2: Create Service Layer

```
I need to create service files that handle business logic for bundles. I don't want to put database queries directly in my routes.

Please create these services:
1. bundleService.ts - CRUD operations for bundles
2. shopifyService.ts - calling Shopify APIs
3. metafieldService.ts - managing Shopify metafields
4. pricingService.ts - calculating bundle prices and discounts

For each service:
- Show example functions
- Explain what the service does
- Include error handling
- Add TypeScript types

Explain in simple terms:
- Why we separate business logic into services
- What are metafields in Shopify and why we need them
```

---

## Phase 3: Shopify App Setup

### Prompt 3.1: Create Admin Dashboard

```
I need to create the main admin dashboard page where merchants see their bundles.

Please create:
1. Main dashboard route (app._index.tsx in Remix)
2. Display list of all bundles
3. Add "Create Bundle" button
4. Show bundle status (active/draft)
5. Use Shopify Polaris components for UI

Include:
- Loading states
- Empty state (when no bundles exist)
- Error handling
- Basic styling with Polaris

Explain:
- How Remix routes work
- What loaders and actions are
- How to fetch data from database in a route
```

### Prompt 3.2: Shopify App Proxy Setup

```
I need to set up an App Proxy so my widget can fetch bundle data from the merchant's storefront.

Please:
1. Explain what App Proxy is and why we need it
2. Show how to configure App Proxy routes in Remix
3. Create API endpoints for:
   - GET /api/bundle-data/:shopDomain - returns bundle configuration
   - GET /api/design-settings/:shopDomain - returns CSS with design variables
4. Handle CORS properly
5. Add caching for performance

Make sure the endpoints:
- Validate the shop domain
- Return JSON for bundle data
- Return CSS for design settings
- Handle errors gracefully

Explain the URL structure: merchant-store.com/apps/product-bundles/api/...
```

### Prompt 3.3: Configure Webhooks

```
I need to set up webhooks to track when shops install/uninstall the app.

Please:
1. Explain what Shopify webhooks are
2. Show how to register these webhook topics:
   - app/uninstalled
   - products/update
   - products/delete
3. Create webhook handler routes
4. Set up Google Cloud Pub/Sub for reliable webhook processing
5. Handle webhook verification

Include:
- Webhook registration code
- Handler implementations
- Database updates based on webhook events
- Error handling and retry logic

Explain:
- Why use Pub/Sub instead of direct webhook handlers
- How to verify webhook authenticity
```

---

## Phase 4: Bundle Management

### Prompt 4.1: Create Bundle Form

```
I need to create a form where merchants can create new bundles with multiple steps and products.

Please create:
1. Bundle creation form with these fields:
   - Bundle title
   - Bundle type (product_page or full_page)
   - Status (active or draft)
2. Dynamic step builder where merchants can:
   - Add/remove steps
   - Set step title and description
   - Set min/max quantity per step
   - Reorder steps by drag-and-drop
3. Product selector for each step
4. Pricing configuration section

Use Shopify Polaris form components.

Include:
- Form validation
- Loading states during save
- Success/error messages
- Auto-save drafts functionality

Explain:
- How to handle nested forms (bundle -> steps -> products)
- How to use Shopify's Product Picker component
```

### Prompt 4.2: Product Selection Integration

```
I need to integrate Shopify's product picker so merchants can select products for each bundle step.

Please:
1. Add Shopify App Bridge for product picker
2. Create a product selection component
3. Handle variant selection (size, color, etc.)
4. Store product variant IDs in database
5. Fetch product details from Shopify API
6. Display selected products with images and prices

Include:
- Product picker modal
- Search and filter functionality
- Handle out-of-stock products
- Support for multiple variants per product

Explain:
- What is Shopify App Bridge
- Difference between Product ID and Variant ID
- How to use Shopify GraphQL API to fetch product data
```

### Prompt 4.3: Pricing Configuration

```
I need to create a pricing configuration UI where merchants set bundle discounts.

Please create a form section with these options:
1. Discount type:
   - Percentage off (e.g., 20%)
   - Fixed amount off (e.g., $10)
   - Tiered pricing (more products = bigger discount)
2. Requirement type:
   - Minimum number of products
   - Minimum total value
   - Specific product combinations
3. Custom messaging for promotions

Include:
- Visual preview of pricing rules
- Validation (discount can't exceed 100%)
- Save pricing rules to database
- Associate pricing with bundle

Explain:
- How tiered pricing works
- How to calculate discounts in different currencies
```

---

## Phase 5: Bundle Widget (Storefront)

### Prompt 5.1: Create Theme Extension Structure

```
I need to create a Shopify theme extension that displays the bundle builder on storefronts.

Please:
1. Create a theme extension using Shopify CLI
2. Set up two Liquid template blocks:
   - bundle-product-page.liquid (for product pages)
   - bundle-full-page.liquid (for dedicated bundle pages)
3. Create JavaScript file structure:
   - bundle-widget-components.js (shared utilities)
   - bundle-widget-full-page.js (full-page widget)
   - bundle-widget-product-page.js (product-page widget)
4. Create CSS file for widget styling

Show me:
- How to structure theme extension folders
- How Liquid templates work
- How to load JavaScript/CSS in theme extensions

Explain:
- What is a Shopify theme extension
- Difference between app blocks and theme sections
- How to deploy theme extensions
```

### Prompt 5.2: Widget Core Functionality

```
I need to create the JavaScript bundle widget that customers interact with.

Please create a widget that:
1. Initializes when page loads
2. Fetches bundle data from API endpoint
3. Renders step-by-step product selection interface
4. Handles product selection/deselection
5. Calculates total price in real-time
6. Validates bundle completion
7. Adds bundle to cart with proper properties

The widget should have these UI components:
- Step timeline (shows progress)
- Product grid (shows available products)
- Selected products summary
- Price display with discount
- Add to cart button
- Bottom footer with total

Use vanilla JavaScript (no frameworks) since this runs on Shopify storefront.

Include:
- Clear code comments
- Error handling
- Mobile-responsive design
- Loading states
```

### Prompt 5.3: Widget UI Components

```
I need to create the visual components for the bundle widget based on Figma designs.

Please create these components:
1. Step Timeline:
   - Shows all steps horizontally
   - Completed steps show checkmark icon
   - Current/future steps show layers icon
   - Connecting lines between steps
   - Clickable to navigate between steps

2. Product Grid:
   - Cards for each product with image, title, price
   - Variant selectors (if product has variants)
   - Add/Remove buttons
   - Quantity controls
   - Responsive layout (adapts to screen size)

3. Bottom Footer:
   - Promotional message section
   - Selected products list with thumbnails
   - Total price with original vs discounted
   - Progress bar showing completion
   - Add to cart button (enabled when complete)

For each component, provide:
- HTML structure
- CSS styling
- JavaScript functionality
- Responsive breakpoints

I have Figma designs that specify: Checkmark icon for completed, Layers icon for pending, white background, black text and buttons.
```

### Prompt 5.4: Add to Cart Functionality

```
I need to implement the "Add to Cart" functionality for bundle items.

Please create code that:
1. Validates bundle is complete (all required steps filled)
2. Collects all selected products with quantities
3. Prepares cart items with these properties:
   - _bundleId (to group bundle items)
   - _bundleTitle (for display in cart)
   - _stepTitle (which step this product is from)
   - _bundleType (product_page or full_page)
4. Sends to Shopify cart via AJAX
5. Handles success/error responses
6. Redirects to cart page
7. Shows loading state during add

Include:
- Form validation before add
- Error messages for incomplete bundles
- Success notifications
- Handle API failures gracefully

Explain:
- How Shopify cart works
- What are line item properties
- Why we need to track bundle information in properties
```

---

## Phase 6: Cart Transform Function

### Prompt 6.1: Create Shopify Function

```
I need to create a Shopify Function that applies bundle discounts at checkout.

Please:
1. Create a new Shopify Function using CLI
2. Choose "Cart Transform" function type
3. Set up the function in TypeScript
4. Configure function to run at checkout

Show me:
- Command to create function
- Basic function structure
- How to test functions locally
- How to deploy functions

Explain in simple terms:
- What are Shopify Functions
- What is Cart Transform function
- Where does this code run (Shopify's servers, not ours)
- Size and performance limitations
```

### Prompt 6.2: Implement Transform Logic

```
I need to implement the logic that processes bundle items and applies discounts.

The function should:
1. Read cart items and identify bundle items (have _bundleId property)
2. Group items by bundleId
3. Fetch bundle configuration from Shopify metafields
4. Calculate discount based on pricing rules
5. Apply discount to bundle items
6. Return modified cart with discounts

Handle these cases:
- Multiple bundles in same cart
- Mixed bundle and non-bundle items
- Invalid bundle configurations
- Products removed from bundle

Include:
- Clear comments explaining each step
- Error handling
- Logging for debugging
- Performance optimization (must be fast!)

Explain:
- How to read metafields in Functions
- How to modify cart items
- Discount calculation methods
```

### Prompt 6.3: Testing Cart Transform

```
I need to test my Cart Transform function to ensure it works correctly.

Please create:
1. Unit tests for discount calculation logic
2. Integration tests with sample cart data
3. Test cases for:
   - Single bundle in cart
   - Multiple bundles in cart
   - Percentage discount
   - Fixed amount discount
   - Tiered pricing
   - Edge cases (empty cart, invalid data)
4. Mock Shopify metafield responses

Show me:
- How to run tests locally
- How to test deployed function via Shopify CLI
- How to check function logs in Shopify admin

Include:
- Test data samples
- Expected results
- Debugging tips
```

---

## Phase 7: Design Control Panel

### Prompt 7.1: Create Design Settings UI

```
I need to create a visual design control panel where merchants can customize the widget appearance.

Please create:
1. Design settings page with tabs for:
   - Product-Page Widget design
   - Full-Page Widget design
2. For each bundle type, include controls for:
   - Colors (primary, buttons, text, backgrounds)
   - Typography (font family, sizes, weights)
   - Spacing (padding, margins, gaps)
   - Borders (radius, width, colors)
   - Shadows (enable/disable, customize)
3. Live preview pane showing changes in real-time
4. Reset to defaults button
5. Save changes button

Use Shopify Polaris components:
- ColorPicker for colors
- Select for fonts
- RangeSlider for sizes/spacing
- Tabs for organization

Include:
- Auto-save drafts
- Undo/redo functionality
- Load current settings on mount
- Visual feedback when saving
```

### Prompt 7.2: CSS Generation System

```
I need to create a system that generates CSS from design settings and injects it into the storefront.

Please create:
1. API endpoint that generates CSS:
   - Accept shopDomain and bundleType as parameters
   - Fetch design settings from database
   - Generate CSS with CSS variables
   - Return as text/css content type
   - Add caching headers

2. CSS variable structure:
   ```css
   :root {
     --bundle-primary-color: #000000;
     --bundle-button-bg: #000000;
     --bundle-font-family: 'Quattrocento Sans', sans-serif;
     /* ... all customizable properties */
   }
   ```

3. Widget CSS that uses these variables:
   ```css
   .bundle-button {
     background: var(--bundle-button-bg);
     color: var(--bundle-button-text);
   }
   ```

Include:
- Fallback values if settings not found
- CSS minification
- Cache busting via version parameter
- Support for both bundle types

Explain:
- Why use CSS variables instead of inline styles
- How CSS cascades from root to components
```

### Prompt 7.3: Design Presets

```
I need to create pre-made design presets that merchants can apply with one click.

Please create:
1. Database table for design presets
2. Pre-built themes:
   - Modern Minimal (black, white, clean)
   - Vibrant (colorful, playful)
   - Elegant (neutral, sophisticated)
   - Bold (high contrast, impactful)
3. UI to browse and preview presets
4. One-click apply functionality
5. Allow saving custom presets

Include:
- Preset thumbnails/previews
- Description of each preset
- Easy switching between presets
- Confirmation before applying

Show me:
- How to structure preset data
- How to override current settings with preset
- How to generate preview images
```

---

## Phase 8: Advanced Features

### Prompt 8.1: Multi-Currency Support

```
I need to add multi-currency support so bundle prices display in customer's currency.

Please:
1. Detect customer's currency from Shopify
2. Convert prices using Shopify's currency converter
3. Format prices correctly for each currency
4. Handle currency symbols and decimal places
5. Update widget to show prices in customer currency
6. Ensure discounts calculate correctly in all currencies

Include:
- Currency detection code
- Price conversion utilities
- Formatted display helpers
- Support for common currencies

Explain:
- How Shopify handles multi-currency
- What is Shopify Markets
- Best practices for currency conversion
```

### Prompt 8.2: Analytics & Tracking

```
I need to add analytics to track bundle performance.

Please create:
1. Database tables for analytics:
   - Bundle views
   - Bundle adds to cart
   - Bundle checkouts
   - Revenue per bundle
2. Tracking code in widget:
   - Track when bundle loads
   - Track product selections
   - Track add to cart events
3. Admin dashboard showing:
   - Top performing bundles
   - Conversion rates
   - Average bundle value
   - Popular product combinations
4. Charts and visualizations

Use:
- Chart library (like Recharts)
- Aggregate queries for performance
- Date range filters

Include:
- Privacy compliance (GDPR)
- Opt-out functionality
- Data retention policies
```

### Prompt 8.3: Automated Bundle Placement

```
I need to create a "Place Widget Now" feature that automatically adds the widget to products or pages.

Please create:
1. UI button in bundle settings: "Place Widget Now"
2. Modal showing placement options:
   - Select product (for product-page bundles)
   - Select page (for full-page bundles)
3. Shopify GraphQL mutations to:
   - Set metafield on product/page with bundleId
   - Update theme to include widget block
4. Success confirmation with link to view

Handle:
- Check if widget already placed
- Update existing placements
- Remove placements
- Validate target is correct type

Include:
- Clear instructions for merchant
- Preview of how it will look
- Undo functionality

Explain:
- How to use Shopify Admin API to modify themes
- What are metafields and how to set them
- Theme customization via API
```

---

## Phase 9: Testing & Deployment

### Prompt 9.1: Comprehensive Testing

```
I need to create a complete test suite for the bundle app.

Please create tests for:
1. Unit tests:
   - Service functions (bundleService, pricingService)
   - Utility functions
   - Discount calculations
2. Integration tests:
   - API endpoints
   - Database operations
   - Shopify API calls
3. E2E tests:
   - Bundle creation flow
   - Widget functionality
   - Cart transform process

Use:
- Vitest for unit/integration tests
- Playwright for E2E tests
- Mock Shopify API responses

Include:
- Test setup and teardown
- Database seeding for tests
- Coverage reporting
- CI/CD integration

Show me:
- How to run tests
- How to write good test cases
- How to mock external APIs
```

### Prompt 9.2: Deployment to Production

```
I need to deploy my bundle app to production.

Please provide step-by-step instructions for:
1. Set up Render.com (or similar) hosting:
   - Web service for main app
   - Background worker for webhooks
   - PostgreSQL database
2. Configure environment variables
3. Set up custom domain
4. Enable HTTPS
5. Configure auto-deployment from GitHub
6. Set up error monitoring (like Sentry)
7. Configure backup strategy

Include:
- Production checklist
- Environment variable list
- Deployment commands
- Rollback procedure
- Health check endpoints

Explain:
- What is a web service vs background worker
- Why we need separate processes
- How to monitor app health
```

### Prompt 9.3: Shopify App Store Submission

```
I want to submit my bundle app to the Shopify App Store.

Please guide me through:
1. App listing requirements
2. Creating app screenshots
3. Writing app description
4. Setting up pricing plans
5. App review preparation
6. Compliance requirements:
   - Privacy policy
   - GDPR compliance
   - Data handling disclosure

Include:
- Screenshot specifications
- Description best practices
- Pricing strategy considerations
- Review checklist

Show me:
- How to submit app for review
- Common rejection reasons
- How to handle feedback
```

---

## Bonus Prompts: Troubleshooting

### Debugging Prompt 1: Widget Not Loading

```
My bundle widget is not loading on the storefront. Help me debug this issue.

I need you to:
1. Create a debugging checklist
2. Show me how to check browser console for errors
3. Verify API endpoints are returning data
4. Check if JavaScript file is loading
5. Verify Liquid template is correct
6. Check metafield is set on product/page

Provide:
- Step-by-step debugging process
- Common issues and solutions
- How to enable debug mode
- Network request inspection guide
```

### Debugging Prompt 2: Cart Transform Not Working

```
Bundle items are added to cart but the discount is not being applied at checkout.

Help me debug:
1. Check if Cart Transform function is deployed
2. Verify function is active in Shopify admin
3. Test function with sample input data
4. Check function logs for errors
5. Verify metafields contain bundle data
6. Test discount calculation logic

Include:
- How to view function logs in Shopify admin
- How to test functions locally
- Common configuration issues
- Debug logging best practices
```

### Debugging Prompt 3: Database Connection Issues

```
I'm getting "Cannot connect to database" errors.

Please help me:
1. Verify DATABASE_URL is correct
2. Check database is running
3. Test connection with Prisma CLI
4. Check connection pool limits
5. Verify firewall/network settings
6. Check SSL certificate requirements

Show me:
- How to test database connection
- How to read connection errors
- Common connection issues
- How to fix connection string format
```

---

## Quick Reference: Important URLs & Commands

### Development Commands
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Deploy Shopify extension
shopify app deploy

# Deploy cart transform function
cd extensions/bundle-cart-transform-ts && shopify function deploy

# Database migrations
npx prisma migrate dev
npx prisma studio
```

### Important URLs (Replace {SHOP} with your shop domain)
```
Admin Dashboard: https://your-app.onrender.com
Bundle Data API: https://{SHOP}/apps/product-bundles/api/bundle-data/{SHOP}?bundleId={ID}
Design Settings API: https://{SHOP}/apps/product-bundles/api/design-settings/{SHOP}?bundleType=full_page
```

---

## Tips for Success

1. **Follow Prompts in Order** - Each builds on previous ones
2. **Test After Each Prompt** - Don't move forward if current step doesn't work
3. **Keep Notes** - Document what you change from default prompts
4. **Use Development Store** - Never test on real merchant stores
5. **Check Logs Often** - Both browser console and server logs
6. **Ask for Clarification** - If AI response is unclear, ask for simpler explanation
7. **Save Your Work** - Commit to Git after each working feature
8. **Read Errors Carefully** - Error messages usually tell you what's wrong

---

## Common Beginner Mistakes to Avoid

❌ **Don't** skip environment variables setup
✅ **Do** create .env file with all required values

❌ **Don't** hardcode shop domains or bundle IDs
✅ **Do** pass them as parameters

❌ **Don't** put business logic in route files
✅ **Do** create service files for logic

❌ **Don't** ignore TypeScript errors
✅ **Do** fix type errors as you go

❌ **Don't** forget to run database migrations
✅ **Do** run `npx prisma migrate dev` after schema changes

❌ **Don't** test only in development
✅ **Do** test in Shopify development store

---

## What You'll Learn

By following these prompts, you'll learn:
- ✅ How Shopify apps work
- ✅ Remix framework fundamentals
- ✅ Database design with Prisma
- ✅ RESTful API design
- ✅ Shopify GraphQL API usage
- ✅ Theme extensions and Liquid templates
- ✅ JavaScript widget development
- ✅ Shopify Functions (Cart Transform)
- ✅ Design systems and CSS variables
- ✅ Deployment and DevOps basics

---

## Estimated Time to Complete

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Initial Setup | 1-2 hours |
| Phase 2: Database & Models | 1-2 hours |
| Phase 3: Shopify App Setup | 2-3 hours |
| Phase 4: Bundle Management | 2-3 hours |
| Phase 5: Bundle Widget | 3-4 hours |
| Phase 6: Cart Transform | 2-3 hours |
| Phase 7: Design Panel | 2-3 hours |
| Phase 8: Advanced Features | 3-4 hours |
| Phase 9: Testing & Deployment | 2-3 hours |
| **Total** | **18-27 hours** |

---

## Support & Help

If you get stuck:
1. Read the error message carefully
2. Check the Technical Documentation (TECHNICAL_DOCUMENTATION.md)
3. Search Shopify Dev Docs: https://shopify.dev
4. Ask AI assistant to explain error in simpler terms
5. Check if environment variables are set correctly
6. Verify database is running
7. Clear cache and restart dev server

---

**Remember:** These prompts are designed to be used with an AI coding assistant like Claude Code or ChatGPT. The AI will provide the actual code and detailed explanations. You don't need to know Shopify or Figma beforehand - just follow the prompts in order and ask questions when you need clarification.

**Last Updated:** December 28, 2025
**Maintained By:** Wolfpack Team
