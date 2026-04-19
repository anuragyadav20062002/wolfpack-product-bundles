# Wolfpack Product Bundles - Application Architecture

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Metafield Architecture](#metafield-architecture)
6. [Data Flow](#data-flow)
7. [Service Layer](#service-layer)
8. [Environment Variables](#environment-variables)
9. [Deployment Architecture](#deployment-architecture)
10. [Security & Best Practices](#security--best-practices)

---

## Overview

Wolfpack Product Bundles is a Shopify app that enables merchants to create and sell product bundles with automatic cart transformation and real-time pricing. The app uses a subscription billing model with two tiers (Free and Grow) and integrates deeply with Shopify's Admin API, Storefront API, and Functions API.

**Core Features:**
- Multi-step bundle builder with product selection
- Real-time cart transformation via Shopify Functions
- Dynamic pricing with multiple discount methods
- Subscription billing with automatic limit enforcement
- Google Cloud Pub/Sub webhook processing
- Metafield-based configuration storage

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Merchant Admin                               │
│                    (Shopify Admin + App Embed)                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Remix Web Application                           │
│  ┌────────────────┬──────────────────┬──────────────────────────┐  │
│  │  Routes Layer  │  Services Layer  │  Component Layer         │  │
│  │                │                  │                          │  │
│  │  • app.*       │  • Billing       │  • Polaris UI            │  │
│  │  • api.*       │  • Bundle Mgmt   │  • UpgradeBanner         │  │
│  │  • webhooks.*  │  • Cart Transform│  • BundleSetup           │  │
│  └────────────────┴──────────────────┴──────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌────────────┐ ┌──────────────────┐
│  PostgreSQL DB   │ │ Shopify    │ │ Google Cloud     │
│                  │ │ Admin API  │ │ Pub/Sub          │
│  • Bundles       │ │            │ │                  │
│  • Subscriptions │ │ • Products │ │ • Topic          │
│  • Shops         │ │ • Orders   │ │ • Subscription   │
│  • WebhookEvents │ │ • Metafields│ │ • Worker Service │
└──────────────────┘ └────────────┘ └──────────────────┘
          │                 │                 │
          │                 │                 ▼
          │                 │         ┌───────────────┐
          │                 │         │  Pub/Sub      │
          │                 │         │  Worker       │
          │                 │         │               │
          │                 │         │  Processes:   │
          │                 │         │  • Webhooks   │
          │                 │         │  • Subscr.    │
          └─────────────────┴─────────┴─ Updates     │
                                        └───────────────┘
                                                │
                                                ▼
                            ┌──────────────────────────────┐
                            │   Shopify Storefront         │
                            │                              │
                            │   • Theme Extension          │
                            │   • Bundle Widget            │
                            │   • Cart Transform Function  │
                            └──────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** Remix (React-based, server-side rendering)
- **UI Library:** Shopify Polaris (official design system)
- **State Management:** Remix loaders/actions (built-in)
- **App Bridge:** @shopify/app-bridge-react (embedded app)

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Remix (full-stack)
- **ORM:** Prisma (PostgreSQL adapter)
- **API Client:** @shopify/shopify-app-remix

### Infrastructure
- **Database:** PostgreSQL (Render.com)
- **Hosting:** Render.com (Web Service + Background Worker)
- **Webhooks:** Google Cloud Pub/Sub
- **Functions:** Shopify Functions (Cart Transform)

### External Services
- **Shopify Admin API:** GraphQL (2025-04)
- **Shopify Storefront API:** GraphQL (for product fetching)
- **Google Cloud Pub/Sub:** Webhook delivery
- **Shopify Functions:** Runtime execution

---

## Database Schema

### Core Models

#### Bundle
Represents a product bundle configuration.

```prisma
model Bundle {
  id               String            @id @default(cuid())
  name             String
  description      String?
  shopId           String            // Shopify shop domain
  shopifyProductId String?           // Shopify Product GID (container)
  templateName     String?           // Template for rendering
  bundleType       BundleType        @default(product_page)
  status           BundleStatus      @default(draft)
  active           Boolean           @default(false)
  publishedAt      DateTime?
  settings         Json?             // UI settings
  matching         Json?             // Product matching rules
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  // Relations
  steps            BundleStep[]
  pricing          BundlePricing?
  analytics        BundleAnalytics[]

  @@index([shopId])
  @@index([status])
  @@index([bundleType])
}

enum BundleStatus {
  draft
  active
  inactive
  unlisted    // Hidden from merchant list (archive/template use)
}

enum BundleType {
  product_page  // Widget embedded in product page
  full_page     // Dedicated bundle page
}

enum FullPageLayout {
  CLASSIC    // Standard step-by-step layout
  EDITORIAL  // Rich media / editorial style
  GRID       // Compact grid layout
}
```

**Key Fields:**
- `shopifyProductId`: Links to the Shopify product that represents this bundle (container product)
- `settings`: Stores UI configuration (colors, fonts, layout)
- `matching`: Stores product matching rules for dynamic bundles
- `bundleType`: Determines how the bundle is displayed

#### BundleStep
Represents a single step in the bundle builder flow.

```prisma
model BundleStep {
  id                          String        @id @default(uuid())
  name                        String        // Step title (e.g., "Choose Size")
  icon                        String?       @default("box")
  position                    Int           @default(0)
  minQuantity                 Int           @default(1)
  maxQuantity                 Int           @default(1)
  enabled                     Boolean       @default(true)
  productCategory             String?       // Optional category filter
  collections                 Json?         // Array of collection IDs
  products                    Json?         // Array of product IDs
  displayVariantsAsIndividual Boolean       @default(false)
  conditionType               String?       // For conditional logic
  conditionOperator           String?
  conditionValue              Int?
  bundleId                    String

  // Relations
  bundle                      Bundle        @relation(...)
  StepProduct                 StepProduct[]

  @@index([bundleId])
}
```

**Key Concepts:**
- Each step can have multiple products
- `minQuantity`/`maxQuantity` control selection constraints
- `collections` and `products` define product pool
- `conditionType` enables conditional step visibility

#### StepProduct
Represents a product within a bundle step.

```prisma
model StepProduct {
  id          String     @id @default(uuid())
  stepId      String
  productId   String     // Shopify Product GID
  title       String
  imageUrl    String?
  variants    Json?      // Variant information
  minQuantity Int        @default(1)
  maxQuantity Int        @default(1)
  position    Int        @default(0)

  @@index([stepId])
  @@index([productId])
}
```

#### BundlePricing
Stores discount rules and pricing configuration.

```prisma
model BundlePricing {
  id              String             @id @default(uuid())
  bundleId        String             @unique
  enabled         Boolean            @default(false)
  method          DiscountMethodType @default(percentage_off)
  rules           Json?              // Array of pricing rules
  showFooter      Boolean            @default(true)
  showProgressBar Boolean            @default(false)
  messages        Json?              // Progress messages

  @@index([bundleId])
}

enum DiscountMethodType {
  fixed_amount_off      // $10 off
  percentage_off        // 20% off
  fixed_bundle_price    // $99 flat
  free_shipping
}
```

**Rules Structure (JSON):**
```json
{
  "rules": [
    {
      "id": "rule-1",
      "condition": {
        "type": "total_quantity",
        "operator": "greater_than_or_equal",
        "value": 3
      },
      "discount": {
        "type": "percentage_off",
        "value": 15
      }
    }
  ]
}
```

### Subscription Billing Models

#### Shop
Represents a Shopify store using the app.

```prisma
model Shop {
  id                    String         @id @default(uuid())
  shopDomain            String         @unique
  name                  String?
  email                 String?
  installedAt           DateTime       @default(now())
  uninstalledAt         DateTime?
  subscriptions         Subscription[]
  currentSubscriptionId String?

  @@index([shopDomain])
  @@index([currentSubscriptionId])
}
```

#### Subscription
Tracks subscription plans and billing.

```prisma
model Subscription {
  id                    String             @id @default(uuid())
  shopId                String
  shopifySubscriptionId String?            @unique
  plan                  SubscriptionPlan   @default(free)
  status                SubscriptionStatus @default(pending)
  name                  String
  price                 Float              @default(0)
  currencyCode          String             @default("USD")
  trialDaysRemaining    Int?
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelledAt           DateTime?
  test                  Boolean            @default(false)
  confirmationUrl       String?
  returnUrl             String?

  @@index([shopId])
  @@index([status])
  @@index([plan])
}

enum SubscriptionPlan {
  free  // 3 bundles max
  grow  // 20 bundles max, $9.99/month
}

enum SubscriptionStatus {
  pending
  active
  cancelled
  frozen
  expired
  declined
}
```

**Plan Limits:**
- **Free Plan**: 3 bundles, basic features
- **Grow Plan**: 20 bundles, priority support, $9.99/month

#### WebhookEvent
Tracks processed webhooks for idempotency.

```prisma
model WebhookEvent {
  id            String   @id @default(uuid())
  shopDomain    String
  topic         String
  webhookId     String?
  payload       Json
  processed     Boolean  @default(false)
  processedAt   DateTime?
  error         String?
  retryCount    Int      @default(0)

  @@unique([shopDomain, topic, webhookId])
  @@index([shopDomain])
  @@index([topic])
  @@index([processed])
}
```

**Purpose:** Prevents duplicate webhook processing using unique constraint.

### Additional Models

#### DesignSettings
Per-bundle design/theme settings. Stores all visual customisation (colors, fonts, layout overrides) as direct Prisma columns rather than JSON blob. Linked to `Bundle`.

#### OrderAttribution
Tracks order → bundle attribution for analytics. Records which orders originated from bundle purchases.

#### BundleAnalytics
Aggregated analytics data per bundle (views, conversions, revenue).

### Supporting Models

#### Session
Manages Shopify authentication sessions.

```prisma
model Session {
  id                     String    @id
  shop                   String
  state                  String
  isOnline               Boolean   @default(false)
  scope                  String?
  expires                DateTime?
  accessToken            String
  storefrontAccessToken  String?
  userId                 BigInt?
  // ... additional Shopify session fields
}
```

#### QueuedJob
Background job queue (for future use).

```prisma
model QueuedJob {
  id          String    @id @default(uuid())
  shopId      String
  type        JobType   @default(publish)
  status      JobStatus @default(pending)
  data        Json?
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
}
```

#### ComplianceRecord
GDPR compliance tracking.

```prisma
model ComplianceRecord {
  id          String    @id @default(uuid())
  shop        String
  type        String    // customer_data_request, customer_redact, shop_redact
  payload     Json
  status      String    @default("pending")
  processedAt DateTime?
}
```

---

## Metafield Architecture

The app uses Shopify's declarative metafield definitions (defined in `shopify.app.toml`) to store configuration data.

### Product-Level Metafields

#### 1. Bundle Configuration (`app.bundleConfig`)
**Type:** `json`
**Access:** `public_read` (storefront accessible)
**Purpose:** Primary configuration for bundle widget display

**Structure:**
```json
{
  "bundleId": "bundle_abc123",
  "name": "Build Your Kit",
  "description": "Customize your perfect bundle",
  "steps": [
    {
      "id": "step_1",
      "name": "Choose Size",
      "minQuantity": 1,
      "maxQuantity": 1,
      "products": [
        {
          "id": "gid://shopify/Product/123",
          "title": "Small Size",
          "variants": [...],
          "minQuantity": 1
        }
      ]
    }
  ],
  "pricing": {
    "enabled": true,
    "method": "percentage_off",
    "rules": [...]
  },
  "settings": {
    "theme": {
      "primaryColor": "#000000",
      "fontFamily": "Helvetica"
    }
  }
}
```

#### 2. Cart Transform Config (`app.cartTransformConfig`)
**Type:** `json`
**Access:** `merchant_read_write` (not public)
**Purpose:** Configuration for cart transform function

**Structure:**
```json
{
  "bundleId": "bundle_abc123",
  "componentProductIds": [
    "gid://shopify/Product/123",
    "gid://shopify/Product/456"
  ],
  "pricingRules": [
    {
      "condition": { "type": "total_quantity", "value": 3 },
      "discount": { "type": "percentage_off", "value": 15 }
    }
  ]
}
```

#### 3. Bundle Isolation Metafields

**`app.ownsBundleId`**
**Type:** `single_line_text_field`
**Purpose:** Links container product to bundle

```
Value: "bundle_abc123"
```

**`app.bundleProductType`**
**Type:** `single_line_text_field`
**Purpose:** Identifies product type

```
Value: "product_page" | "full_page"
```

**`app.isolationCreated`**
**Type:** `single_line_text_field`
**Purpose:** Timestamp of isolation creation

```
Value: "2025-11-27T10:30:00Z"
```

#### 4. Component Tracking Metafields

**`app.componentVariants`**
**Type:** `list.variant_reference`
**Purpose:** Lists all variant IDs in bundle

```json
[
  "gid://shopify/ProductVariant/123",
  "gid://shopify/ProductVariant/456"
]
```

**`app.componentQuantities`**
**Type:** `list.number_integer`
**Purpose:** Quantities for each component

```json
[1, 2, 1]
```

**`app.componentParents`**
**Type:** `json`
**Purpose:** Reverse lookup for component products

```json
{
  "bundles": ["bundle_abc123", "bundle_def456"]
}
```

**`app.priceAdjustment`**
**Type:** `number_decimal`
**Purpose:** Bundle discount amount

```
Value: -10.50
```

### Shop-Level Metafields

#### 1. Bundle Index (`app.bundleIndex`)
**Type:** `json`
**Purpose:** Global list of active bundles for cart transform

```json
{
  "bundles": [
    {
      "id": "bundle_abc123",
      "productId": "gid://shopify/Product/789",
      "componentIds": ["gid://shopify/Product/123", ...]
    }
  ],
  "lastUpdated": "2025-11-27T10:30:00Z"
}
```

#### 2. App Configuration

**`app.serverUrl`**
**Type:** `single_line_text_field`
**Purpose:** App server URL for API calls

```
Value: "https://wolfpack-app.onrender.com"
```

**`app.lastSync`**
**Type:** `single_line_text_field`
**Purpose:** Last successful sync timestamp

```
Value: "2025-11-27T10:30:00Z"
```

---

## Data Flow

### 1. Bundle Creation Flow

```
Merchant creates bundle in admin
          ↓
Creates bundle record in database (draft status)
          ↓
Adds steps and products to bundle
          ↓
Configures pricing rules
          ↓
Clicks "Publish"
          ↓
┌─────────────────────────────────┐
│  Bundle Publication Process     │
├─────────────────────────────────┤
│ 1. Create Shopify Product       │ ← Container product
│ 2. Set metafields on product    │ ← bundleConfig, cartTransformConfig
│ 3. Update bundle index          │ ← Shop-level bundleIndex
│ 4. Set isolation metafields     │ ← ownsBundleId, bundleProductType
│ 5. Activate cart transform      │ ← Shopify Function
│ 6. Mark bundle as active        │ ← Update DB
└─────────────────────────────────┘
          ↓
Bundle appears on storefront
```

### 2. Customer Purchase Flow

```
Customer visits product page
          ↓
Theme extension reads bundleConfig metafield
          ↓
Renders bundle widget with steps
          ↓
Customer selects products from each step
          ↓
Clicks "Add to Cart"
          ↓
┌─────────────────────────────────┐
│  Cart Transform Process         │
├─────────────────────────────────┤
│ 1. Cart updated with items      │
│ 2. Cart Transform Function runs │ ← Shopify Function
│ 3. Function reads metafields    │ ← cartTransformConfig
│ 4. Merges items into bundle     │
│ 5. Applies pricing rules        │
│ 6. Returns transformed cart     │
└─────────────────────────────────┘
          ↓
Cart shows single bundle line item with discount
          ↓
Customer completes checkout
```

### 3. Subscription Billing Flow

```
Shop installs app
          ↓
afterAuth hook creates Shop record
          ↓
Creates FREE subscription (3 bundle limit)
          ↓
Merchant creates bundles
          ↓
Reaches limit (3/3 bundles)
          ↓
Upgrade banner appears
          ↓
Merchant clicks "Upgrade to Grow"
          ↓
┌─────────────────────────────────┐
│  Subscription Upgrade Process   │
├─────────────────────────────────┤
│ 1. Create subscription in Shopify│ ← appSubscriptionCreate
│ 2. Save pending subscription DB │
│ 3. Redirect to billing approval │ ← Shopify billing page
│ 4. Merchant approves charge     │
│ 5. Shopify sends webhook        │ ← APP_SUBSCRIPTIONS_UPDATE
│ 6. Pub/Sub worker processes     │
│ 7. Update subscription to active│
│ 8. Increase bundle limit to 20  │
└─────────────────────────────────┘
          ↓
Merchant can create 20 bundles
```

### 4. Webhook Processing Flow

```
Shopify sends webhook
          ↓
Publishes to Google Cloud Pub/Sub
          ↓
┌─────────────────────────────────┐
│  Pub/Sub Worker                 │
├─────────────────────────────────┤
│ 1. Pull message from subscription│
│ 2. Check WebhookEvent for dupe  │ ← Idempotency
│ 3. Route to appropriate handler │
│    • APP_SUBSCRIPTIONS_UPDATE   │ → Update subscription status
│    • PRODUCTS_UPDATE            │ → Check bundle integrity
│    • PRODUCTS_DELETE            │ → Remove from bundles
│    • GDPR webhooks              │ → Compliance handling
│ 4. Process webhook              │
│ 5. Mark as processed in DB      │
│ 6. Acknowledge message          │
└─────────────────────────────────┘
```

### 5. Product Update Impact Flow

```
Merchant updates product (archives it)
          ↓
Shopify sends PRODUCTS_UPDATE webhook
          ↓
Pub/Sub worker receives message
          ↓
Finds bundles using this product
          ↓
Checks if product is now unavailable
          ↓
Sets affected bundles to DRAFT status
          ↓
Sends notification to merchant (future)
```

---

## Service Layer

### Core Services

#### 1. BillingService (`app/services/billing.server.ts`)
**Responsibilities:**
- Create and manage subscriptions
- Check bundle limits
- Handle subscription confirmations
- Cancel subscriptions

**Key Methods:**
```typescript
createSubscription(admin, params)     // Create Shopify subscription
getSubscriptionInfo(shopDomain)       // Get current plan details
canCreateBundle(shopDomain)           // Check if can create more
confirmSubscription(shopDomain, id)   // Activate after approval
cancelSubscription(admin, shopDomain) // Cancel and downgrade
ensureShop(shopDomain)                // Create shop with free plan
```

#### 2. SubscriptionGuard (`app/services/subscription-guard.server.ts`)
**Responsibilities:**
- Enforce bundle creation limits
- Check feature access
- Return 403 when limit reached

**Key Methods:**
```typescript
checkBundleCreation(shopDomain)       // Check if allowed
enforceBundleLimit(shopDomain)        // Middleware enforcement
getFeatureAccess(shopDomain)          // Get available features
hasPaidPlan(shopDomain)               // Check if paid
```

#### 3. WebhookProcessor (`app/services/webhook-processor.server.ts`)
**Responsibilities:**
- Process all incoming webhooks
- Idempotent handling
- Route to specific handlers
- Update database

**Key Methods:**
```typescript
processPubSubMessage(message)         // Main entry point
handleSubscriptionUpdate(shop, data)  // Process subscription webhooks
handleProductUpdate(shop, data)       // Handle product changes
handleProductDelete(shop, data)       // Handle deletions
handleGDPR(shop, data)                // GDPR compliance
```

#### 4. CartTransformService (`app/services/cart-transform-service.server.ts`)
**Responsibilities:**
- Activate/deactivate cart transform function
- Sync bundle configurations
- Update shop-level bundleIndex

**Key Methods:**
```typescript
completeSetup(admin, shop)            // Initial setup
activateCartTransform(admin, shop)    // Activate function
deactivateCartTransform(admin, shop)  // Deactivate function
```

#### 5. BundleProductManagerService (`app/services/bundle-product-manager.server.ts`)
**Responsibilities:**
- Create container products
- Manage product metafields
- Handle bundle publishing

**Key Methods:**
```typescript
createAndPublishBundleProduct(admin, bundle, components)
updateBundleProductConfiguration(admin, productId, bundle)
```

#### 6. BundleIsolationService (`app/services/bundle-isolation.server.ts`)
**Responsibilities:**
- Set isolation metafields
- Track bundle ownership
- Reverse product lookups

**Key Methods:**
```typescript
createBundleProductIsolationMetafields(admin, productId, bundleId)
updateBundleProductMetafield(admin, productId, bundle)
getBundleForProduct(admin, productId, shop)
```

#### 7. MetafieldCleanupService (`app/services/metafield-cleanup.server.ts`)
**Responsibilities:**
- Clean up on bundle deletion
- Remove orphaned metafields
- Shop uninstall cleanup

**Key Methods:**
```typescript
cleanupBundleMetafields(admin, bundleId, productId, componentIds)
```

### Worker Services

#### PubSubWorker (`app/services/pubsub-worker.server.ts`)
**Responsibilities:**
- Pull messages from Pub/Sub
- Forward to WebhookProcessor
- Handle acknowledgments
- Graceful shutdown

**Configuration:**
```typescript
{
  maxMessages: 10,
  ackDeadline: 600,
  flowControl: {
    maxMessages: 100,
    allowExcessMessages: false
  }
}
```

---

## Environment Variables

### Required for All Services

```bash
# Shopify Configuration
SHOPIFY_API_KEY=<app-client-id>
SHOPIFY_API_SECRET=<app-client-secret>
SHOPIFY_APP_URL=https://your-app.onrender.com
SCOPES=read_products,write_products,write_cart_transforms,write_subscriptions,...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db  # For migrations

# Node Environment
NODE_ENV=production|development
```

### Web Service Only

```bash
# Shop Configuration (optional)
SHOP_CUSTOM_DOMAIN=custom-domain.myshopify.com
```

### Pub/Sub Worker Only

```bash
# Google Cloud Pub/Sub
GOOGLE_CLOUD_PROJECT=light-quest-455608-i3
PUBSUB_SUBSCRIPTION=wolfpack-webhooks-subscription
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### Shopify Function Extensions

```bash
# Function Extension IDs (for activation)
SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID=<function-extension-id>
```

### Optional

```bash
# Additional Configuration
PUBSUB_TOPIC=wolfpack-product-bundles  # For reference only
```

---

## Deployment Architecture

### Production Setup on Render

```
┌────────────────────────────────────────────────┐
│                 GitHub Repo                     │
│     wolfpack-product-bundles                   │
└─────────────────┬──────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  Web Service     │  │ Background       │
│                  │  │ Worker           │
│  Build:          │  │                  │
│  npm install &&  │  │ Build:           │
│  npm run build &&│  │ npm install &&   │
│  npx prisma      │  │ npx prisma       │
│  generate        │  │ generate         │
│                  │  │                  │
│  Start:          │  │ Start:           │
│  npm run start   │  │ npm run          │
│                  │  │ pubsub-worker    │
│                  │  │                  │
│  Env Vars:       │  │ Env Vars:        │
│  • SHOPIFY_*     │  │ • GOOGLE_*       │
│  • DATABASE_URL  │  │ • DATABASE_URL   │
│  • SCOPES        │  │ • PUBSUB_*       │
└────────┬─────────┘  └──────┬───────────┘
         │                   │
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌───────────────────┐
         │  PostgreSQL DB    │
         │                   │
         │  Tables:          │
         │  • Bundle         │
         │  • Shop           │
         │  • Subscription   │
         │  • WebhookEvent   │
         │  • Session        │
         └───────────────────┘
```

### External Services

```
┌─────────────────────────────────────────────┐
│           Shopify Platform                   │
├─────────────────────────────────────────────┤
│  • Admin API (GraphQL)                      │
│  • Storefront API (GraphQL)                 │
│  • App Bridge (Embedded App)                │
│  • Functions Runtime (Cart Transform)       │
│  • Billing API (Subscription Charges)       │
│  • Webhook Registry                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Google Cloud Platform                 │
├─────────────────────────────────────────────┤
│  • Pub/Sub Topic (wolfpack-product-bundles) │
│  • Pub/Sub Subscription                     │
│  • Service Account (IAM)                    │
│  • Cloud Logging (monitoring)               │
└─────────────────────────────────────────────┘
```

---

## Security & Best Practices

### Authentication & Authorization

1. **Shopify OAuth:**
   - All admin requests authenticated via Shopify App Bridge
   - Session tokens validated on every request
   - Scopes enforced at API level

2. **Webhook Verification:**
   - Pub/Sub messages don't need HMAC (secured by Google Cloud IAM)
   - Idempotency via WebhookEvent table
   - Unique constraint prevents duplicate processing

3. **API Security:**
   - All admin API routes require authentication
   - Subscription guards prevent unauthorized bundle creation
   - Feature access based on subscription plan

### Data Protection

1. **Sensitive Data:**
   - Access tokens stored encrypted in database
   - Service account credentials in environment variables only
   - No credentials in git repository

2. **GDPR Compliance:**
   - Customer data request handling
   - Customer redaction on request
   - Shop redaction on uninstall
   - Compliance records tracked in database

### Performance Optimization

1. **Caching:**
   - Storefront access token for faster product fetching
   - Bundle configurations cached in metafields
   - Shop-level bundleIndex for quick lookups

2. **Background Processing:**
   - Webhooks processed asynchronously via Pub/Sub
   - Heavy operations queued for background processing
   - Rate limiting on API calls

3. **Database Optimization:**
   - Indexes on frequently queried fields
   - Cascading deletes for data integrity
   - Connection pooling via Prisma

### Error Handling

1. **Webhook Processing:**
   - Failed webhooks logged with error details
   - Retryable errors trigger message nack
   - Non-retryable errors marked as processed with error

2. **API Operations:**
   - Comprehensive error logging via AppLogger
   - User-friendly error messages in UI
   - Graceful degradation on external service failures

3. **Monitoring:**
   - All operations logged with context
   - Error tracking in application logs
   - Google Cloud Logging for Pub/Sub monitoring

---

## Additional Documentation

For more specific information, refer to:

- **Deployment:** `deployment_guide_subscription_billing.md`
- **Google Cloud Setup:** `google_cloud_pubsub_setup.md`
- **Subscription Architecture:** `shopify_subscription_architecture_guide.md`
- **Billing Guide:** `shopify_subscription_billing_guide.md`

---

**Last Updated:** 2026-04-16
**Version:** 2.1.0 (corrected Node version, added DesignSettings/OrderAttribution/BundleAnalytics models, FullPageLayout enum, unlisted BundleStatus)
