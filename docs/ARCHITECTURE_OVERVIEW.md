# Architecture Overview

**Last Updated:** January 14, 2026

## Table of Contents
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Key Components](#key-components)
- [Integration Points](#integration-points)

## System Overview

Wolfpack Product Bundles is a Shopify app that enables merchants to create customizable product bundles. The application supports two bundle types:

- **Product-Page Bundles:** Widget embedded in product pages
- **Full-Page Bundles:** Dedicated standalone bundle pages

The app uses Shopify's Cart Transform API to apply bundle discounts and handle bundle logic at checkout.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Shopify Storefront                      │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │  Product Page    │              │   Full Page      │       │
│  │  Bundle Widget   │              │   Bundle Page    │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
│           │                                  │                  │
│           └──────────────┬───────────────────┘                  │
│                          │                                      │
│                    Bundle Data API                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    Remix Admin App                               │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────┐     │
│  │  Admin UI (React)     │                               │     │
│  │  ┌─────────────┐  ┌──┴──────────┐  ┌──────────────┐ │     │
│  │  │   Bundle    │  │   Design    │  │  Pricing     │ │     │
│  │  │   Builder   │  │   Control   │  │  Rules       │ │     │
│  │  │             │  │   Panel     │  │              │ │     │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │     │
│  └───────────────────────┬───────────────────────────────┘     │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────┐     │
│  │  Server-Side Routes (Remix Actions)                    │     │
│  │                       │                                │     │
│  │  ┌─────────────┐  ┌──┴────────┐  ┌──────────────┐   │     │
│  │  │  Bundle     │  │  Design   │  │  Theme       │   │     │
│  │  │  CRUD       │  │  Settings │  │  Installation│   │     │
│  │  │  API        │  │  API      │  │  API         │   │     │
│  │  └──────┬──────┘  └──────┬────┘  └──────┬───────┘   │     │
│  └─────────┼────────────────┼───────────────┼────────────┘     │
│            │                │               │                  │
│  ┌─────────┼────────────────┼───────────────┼────────────┐     │
│  │         │    Prisma ORM  │               │            │     │
│  │         ▼                ▼               ▼            │     │
│  │  ┌──────────────────────────────────────────────┐    │     │
│  │  │         PostgreSQL Database                   │    │     │
│  │  │  - Bundles  - DesignSettings  - Sessions    │    │     │
│  │  │  - Shops    - Subscriptions   - Analytics   │    │     │
│  │  └──────────────────────────────────────────────┘    │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                Shopify Extensions                                │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────┐     │
│  │  Cart Transform Function (Rust)                       │     │
│  │                       │                                │     │
│  │  Input: Cart + Bundle Metafield Data                  │     │
│  │  Process: Apply discounts, validate bundles          │     │
│  │  Output: Transformed cart with applied discounts      │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework:** React 18
- **UI Library:** Shopify Polaris (Admin UI)
- **Styling:** CSS Modules + CSS Variables
- **Storefront Widgets:** Vanilla JavaScript (no framework)

### Backend
- **Framework:** Remix (Full-stack React)
- **Runtime:** Node.js 20+
- **API:** REST + GraphQL (Shopify Admin API)
- **Session Management:** Shopify App Bridge Session Tokens

### Database
- **Database:** PostgreSQL (Hosted on Neon/Render)
- **ORM:** Prisma 5.x
- **Migrations:** Prisma Migrate

### Shopify Extensions
- **Cart Transform:** Rust (Shopify Functions)
- **Theme App Extensions:** Liquid + JavaScript

### Infrastructure
- **Hosting:** Render.com
- **CDN:** Shopify CDN (for assets)
- **Webhooks:** Google Cloud Pub/Sub
- **Monitoring:** Shopify App Logs

## Architecture Layers

### 1. Presentation Layer

#### Admin UI (React/Polaris)
- Bundle creation and management
- Design Control Panel for customization
- Analytics dashboard
- Subscription management

#### Storefront Widgets (Vanilla JS)
- Product-page widget embedded via Theme App Extension
- Full-page bundle rendered on standalone pages
- Cart drawer integration

### 2. Application Layer

#### Remix Routes (`app/routes/`)
- **Public API Routes:** `/api/*` - Data endpoints for widgets
- **Admin Routes:** `/app/*` - Authenticated admin pages
- **Webhook Routes:** `/webhooks/*` - Shopify webhook handlers

#### Services (`app/services/`)
- `bundleService.ts` - Bundle CRUD operations
- `shopifyService.ts` - Shopify API wrapper
- `designSettingsService.ts` - DCP settings management
- `subscriptionService.ts` - Billing operations

### 3. Data Layer

#### Prisma Models
- `Bundle` - Bundle configuration
- `BundleStep` - Multi-step bundle steps
- `StepProduct` - Products within steps
- `BundlePricing` - Discount rules
- `DesignSettings` - Visual customization per shop
- `Shop` - Store metadata
- `Subscription` - Billing records
- `Session` - Shopify OAuth sessions

#### Shopify Resources
- **Metafields:** Store bundle configuration on products/pages
- **Pages:** Dedicated pages for full-page bundles
- **Files:** Store widget JavaScript/CSS assets

### 4. Extension Layer

#### Cart Transform Function
- **Language:** Rust
- **Trigger:** Every cart update
- **Input:** Cart + bundle metafield data
- **Processing:**
  1. Parse bundle configuration from metafields
  2. Identify bundle items in cart
  3. Validate bundle composition
  4. Calculate and apply discounts
  5. Return transformed cart
- **Output:** Cart with bundle discounts applied

## Data Flow

### Bundle Creation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │────▶│  Remix   │────▶│  Prisma  │────▶│   DB     │
│   UI     │     │  Action  │     │   ORM    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                  │
     │                  ▼
     │           ┌──────────┐
     │           │ Shopify  │
     │           │   API    │
     │           └──────────┘
     │                  │
     │                  ▼
     │           ┌──────────────────────┐
     │           │  Create/Update:      │
     │           │  - Product Metafield │
     │           │  - Page (full-page)  │
     │           │  - Theme Files       │
     │           └──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  Success/Error       │
│  Feedback to Admin   │
└──────────────────────┘
```

### Storefront Purchase Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Customer  │────▶│ Widget   │────▶│  Bundle  │────▶│  Add to  │
│Opens Page│     │ Loads    │     │ Data API │     │   Cart   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                           │
                                                           ▼
                                                    ┌──────────┐
                                                    │  Cart    │
                                                    │Transform │
                                                    │ Function │
                                                    └──────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  - Validate  │
                                                    │  - Calculate │
                                                    │  - Apply     │
                                                    │  Discounts   │
                                                    └──────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────┐
                                                    │ Checkout │
                                                    │  with    │
                                                    │ Discounts│
                                                    └──────────┘
```

### Design Settings Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Design  │────▶│ Settings │────▶│ Prisma   │────▶│   DB     │
│  Control │     │  Action  │     │          │     │          │
│  Panel   │     └──────────┘     └──────────┘     └──────────┘
└──────────┘            │
     ▲                  │
     │                  ▼
     │           ┌──────────┐
     │           │   CSS    │
     │           │   API    │
     │           └──────────┘
     │                  │
     │                  ▼
     │           ┌──────────────────┐
     │           │  Generate CSS    │
     │           │  Variables from  │
     │           │  Settings        │
     │           └──────────────────┘
     │                  │
     │                  ▼
     │           ┌──────────┐
     │           │ Widget   │
     │           │ Loads    │
     │           │ CSS API  │
     │           └──────────┘
     │                  │
     │                  ▼
     │           ┌──────────────────┐
     │           │  Styles Applied  │
     │           │  to Storefront   │
     └───────────┤  Preview Updates │
                 └──────────────────┘
```

## Key Components

### 1. Bundle Builder
**Location:** `app/routes/app.bundles.*`

Creates and manages bundle configurations with:
- Multi-step bundle creation
- Product/collection selection
- Quantity constraints
- Conditional logic

### 2. Design Control Panel (DCP)
**Location:** `app/routes/app.design-control-panel.tsx`

Visual customization system with:
- Live preview component
- 50+ customizable settings
- Per-bundle-type configurations
- CSS variable generation

### 3. Pricing Rules Engine
**Location:** `app/routes/app.bundles.$id.pricing.tsx`

Discount configuration with:
- Multiple discount methods (%, $, fixed price, free shipping)
- Tiered pricing rules
- Condition-based discounts
- Progress bar messaging

### 4. Bundle Widgets
**Locations:**
- `app/assets/bundle-widget-product-page.js`
- `app/assets/bundle-widget-full-page.js`

Frontend bundle interfaces with:
- Product selection
- Variant selection
- Quantity controls
- Cart integration
- Real-time price calculation

### 5. Cart Transform Function
**Location:** `extensions/bundle-cart-transform-ts/`

Shopify Function that:
- Validates bundle composition
- Calculates discounts
- Applies transformations
- Ensures checkout integrity

### 6. Theme Installation System
**Location:** `app/routes/app.bundles.$id.product-page.tsx`

Automated widget installation with:
- Metafield creation
- Theme file injection
- Liquid snippet generation
- Theme editor integration

## Integration Points

### Shopify Admin API
- **GraphQL API:** Product queries, metafield operations, page management
- **REST API:** Asset uploads, theme modifications
- **App Bridge:** Embedded app navigation, toast notifications

### Shopify Storefront
- **Theme App Extensions:** Block-based widget injection
- **Metafields:** Bundle configuration storage
- **Ajax API:** Cart operations

### Shopify Functions
- **Cart Transform:** Bundle discount application
- **Input Queries:** Access to cart and bundle data
- **Run Target:** `shopify.cart-transform`

### External Services
- **Google Cloud Pub/Sub:** Webhook queue (subscription events)
- **Neon/Render PostgreSQL:** Database hosting
- **Shopify CDN:** Asset delivery

## Security Considerations

### Authentication
- OAuth 2.0 for merchant authentication
- Session token validation on every request
- CSRF protection via Remix

### Authorization
- Shop-scoped data isolation
- Session verification middleware
- API endpoint protection

### Data Protection
- Encrypted database connections
- Environment variable secrets
- GDPR compliance webhooks

## Performance Optimizations

### Database
- Indexed queries on `shopId`, `bundleType`, `status`
- Composite indexes for common query patterns
- Connection pooling

### API
- Shopify API rate limiting handling
- Retry logic with exponential backoff
- Bulk operations where possible

### Storefront
- Asset minification and bundling
- CSS variable-based theming
- Lazy loading for modals
- Debounced search and filtering

## Scalability

### Horizontal Scaling
- Stateless server architecture
- Session storage in database
- Load balancer compatible

### Vertical Scaling
- Database connection pooling
- Background job processing
- Webhook queue with Pub/Sub

## Monitoring & Observability

### Logging
- Shopify app logs for errors
- Database query logging (development)
- Webhook event tracking

### Metrics
- Bundle creation rate
- Widget load times
- Cart transform execution time
- API response times

### Alerts
- Failed cart transforms
- Database connection errors
- Subscription billing failures

## Next Steps

For more detailed information, see:
- [Feature Guide](FEATURE_GUIDE.md) - Complete feature documentation
- [Database Schema](DATABASE_SCHEMA.md) - Database model reference
- [API Endpoints](API_ENDPOINTS.md) - API route documentation
- [Deployment](DEPLOYMENT.md) - Deployment procedures
