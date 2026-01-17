# Database Schema Reference

**Last Updated:** January 14, 2026

## Table of Contents
- [Overview](#overview)
- [Enumerations](#enumerations)
- [Core Models](#core-models)
- [Design Models](#design-models)
- [Subscription Models](#subscription-models)
- [System Models](#system-models)
- [Relationships Diagram](#relationships-diagram)
- [Indexes](#indexes)

## Overview

The application uses **PostgreSQL** as the primary database, managed through **Prisma ORM**.

**Database:** PostgreSQL 15+
**ORM:** Prisma 5.x
**Hosting:** Neon/Render
**Migrations:** Prisma Migrate

### Connection

```typescript
// Connection via environment variables
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname" // For migrations
```

## Enumerations

### BundleStatus
```prisma
enum BundleStatus {
  draft    // Bundle created but not published
  active   // Bundle published and visible
  archived // Bundle hidden/disabled
}
```

### BundleType
```prisma
enum BundleType {
  product_page  // Widget embedded in product page
  full_page     // Dedicated bundle page
}
```

### DiscountMethodType
```prisma
enum DiscountMethodType {
  fixed_amount_off   // $X off bundle
  percentage_off     // X% off bundle
  fixed_bundle_price // Total bundle = $X
  free_shipping      // Waive shipping costs
}
```

### DiscountImplementationType
```prisma
enum DiscountImplementationType {
  cart_transformation // Applied via Shopify Cart Transform Function
}
```

### JobStatus
```prisma
enum JobStatus {
  pending    // Job queued
  processing // Job in progress
  completed  // Job finished successfully
  failed     // Job failed with error
}
```

### JobType
```prisma
enum JobType {
  publish   // Publish bundle to storefront
  unpublish // Remove bundle from storefront
  sync      // Sync bundle data with Shopify
}
```

### SubscriptionStatus
```prisma
enum SubscriptionStatus {
  pending   // Awaiting merchant approval
  active    // Active and billing
  cancelled // Cancelled by merchant
  frozen    // Shop billing frozen
  expired   // Subscription expired
  declined  // Merchant declined
}
```

### SubscriptionPlan
```prisma
enum SubscriptionPlan {
  free  // 3 bundles max, free
  grow  // 20 bundles max, $9.99/month
}
```

## Core Models

### Bundle

**Purpose:** Main bundle configuration

```prisma
model Bundle {
  id               String            @id @default(cuid())
  name             String
  description      String?
  shopId           String
  shopifyProductId String?           // For product-page bundles
  shopifyPageHandle String?          // For full-page bundles
  shopifyPageId    String?           // For full-page bundles
  templateName     String?           // Template identifier
  bundleType       BundleType        @default(product_page)
  status           BundleStatus      @default(draft)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  // Relations
  steps            BundleStep[]
  pricing          BundlePricing?
  analytics        BundleAnalytics[]
}
```

**Fields:**
- `id` - Unique bundle ID (cuid format: `cm5abc123`)
- `name` - Bundle display name
- `description` - Optional description
- `shopId` - Shop domain (e.g., `store.myshopify.com`)
- `shopifyProductId` - Shopify Product GID (product-page type)
- `shopifyPageHandle` - URL slug (full-page type, e.g., `build-your-box`)
- `shopifyPageId` - Shopify Page GID (full-page type)
- `templateName` - Theme template identifier
- `bundleType` - `product_page` or `full_page`
- `status` - `draft`, `active`, or `archived`

**Indexes:**
- `shopId` - Queries by shop
- `status` - Filter by status
- `bundleType` - Filter by type
- `shopifyPageHandle` - Full-page lookups
- `shopifyProductId` - Product-page lookups
- Composite: `[shopId, status]`, `[shopId, bundleType, status]`, `[shopId, updatedAt]`

---

### BundleStep

**Purpose:** Individual steps in a multi-step bundle

```prisma
model BundleStep {
  id                          String        @id @default(uuid())
  name                        String
  icon                        String?       @default("box")
  position                    Int           @default(0)
  minQuantity                 Int           @default(1)
  maxQuantity                 Int           @default(1)
  enabled                     Boolean       @default(true)
  collections                 Json?         // Collection IDs
  products                    Json?         // Product IDs
  displayVariantsAsIndividual Boolean       @default(false)
  conditionType               String?       // "subtotal", "quantity"
  conditionOperator           String?       // ">=", ">", "=="
  conditionValue              Int?          // Threshold value
  bundleId                    String
  createdAt                   DateTime      @default(now())
  updatedAt                   DateTime      @updatedAt

  // Relations
  bundle                      Bundle        @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  StepProduct                 StepProduct[]
}
```

**Fields:**
- `id` - Unique step ID (UUID)
- `name` - Step display name (e.g., "Choose Base")
- `icon` - Icon identifier
- `position` - Step order (0-indexed)
- `minQuantity` - Minimum items to select
- `maxQuantity` - Maximum items to select
- `enabled` - Step visibility toggle
- `collections` - JSON array of collection IDs
- `products` - JSON array of product IDs
- `displayVariantsAsIndividual` - Show variants as separate products
- `conditionType` - Conditional step trigger type
- `conditionOperator` - Comparison operator
- `conditionValue` - Trigger threshold
- `bundleId` - Parent bundle ID

**Conditional Logic Example:**
```json
{
  "conditionType": "subtotal",
  "conditionOperator": ">=",
  "conditionValue": 50
}
// Step visible only if previous steps total >= $50
```

**Indexes:**
- `bundleId` - Queries by bundle
- Composite: `[bundleId, position]`, `[bundleId, enabled]`

---

### StepProduct

**Purpose:** Products within a bundle step

```prisma
model StepProduct {
  id          String     @id @default(uuid())
  stepId      String
  productId   String     // Shopify product ID
  title       String
  imageUrl    String?
  variants    Json?      // Variant data
  minQuantity Int        @default(1)
  maxQuantity Int        @default(1)
  position    Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  step        BundleStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id` - Unique step product ID
- `stepId` - Parent step ID
- `productId` - Shopify product GID
- `title` - Product title (cached)
- `imageUrl` - Product image URL (cached)
- `variants` - JSON array of variant data
- `minQuantity` - Min quantity for this product
- `maxQuantity` - Max quantity for this product
- `position` - Display order within step

**Variants JSON Example:**
```json
[
  {
    "id": "gid://shopify/ProductVariant/123",
    "title": "Small / Red",
    "price": "29.99",
    "available": true
  }
]
```

**Indexes:**
- `stepId` - Queries by step
- `productId` - Queries by product
- Composite: `[stepId, position]`, `[productId, stepId]`

---

### BundlePricing

**Purpose:** Discount rules and pricing configuration

```prisma
model BundlePricing {
  id             String             @id @default(uuid())
  bundleId       String             @unique
  enabled        Boolean            @default(false)
  method         DiscountMethodType @default(percentage_off)
  rules          Json?              // Pricing rules array
  showFooter     Boolean            @default(true)
  showProgressBar Boolean           @default(false)
  messages       Json?              // Progress messages
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  // Relations
  bundle         Bundle             @relation(fields: [bundleId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id` - Unique pricing ID
- `bundleId` - Parent bundle ID (unique - one pricing per bundle)
- `enabled` - Pricing rules active toggle
- `method` - Discount method type
- `rules` - JSON array of pricing rules
- `showFooter` - Display bundle footer
- `showProgressBar` - Display progress bar
- `messages` - JSON object with progress/qualified messages

**Rules JSON Example:**
```json
[
  {
    "condition": {
      "type": "quantity",
      "operator": ">=",
      "value": 2
    },
    "discount": {
      "type": "percentage_off",
      "value": 10
    }
  },
  {
    "condition": {
      "type": "quantity",
      "operator": ">=",
      "value": 4
    },
    "discount": {
      "type": "percentage_off",
      "value": 20
    }
  }
]
```

**Messages JSON Example:**
```json
{
  "progressMessages": [
    {
      "text": "Add {{remaining}} more items to save 10%",
      "threshold": 2
    }
  ],
  "qualifiedMessages": [
    {
      "text": "You're saving 10%!",
      "threshold": 2
    }
  ],
  "showInCart": true
}
```

**Indexes:**
- `bundleId` - Queries by bundle

---

### BundleAnalytics

**Purpose:** Track bundle engagement events

```prisma
model BundleAnalytics {
  id        String   @id @default(uuid())
  bundleId  String
  shopId    String
  event     String   // "view", "add_to_cart", "purchase"
  metadata  Json?
  createdAt DateTime @default(now())

  // Relations
  bundle    Bundle   @relation(fields: [bundleId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id` - Unique event ID
- `bundleId` - Bundle that triggered event
- `shopId` - Shop domain
- `event` - Event type (`view`, `add_to_cart`, `purchase`)
- `metadata` - JSON object with event details
- `createdAt` - Event timestamp

**Metadata JSON Example:**
```json
{
  "items": 5,
  "total": 99.99,
  "discount": 20.00,
  "products": ["gid://shopify/Product/123", "gid://shopify/Product/456"]
}
```

**Indexes:**
- `bundleId` - Queries by bundle
- `shopId` - Queries by shop
- `event` - Filter by event type
- `createdAt` - Time-series queries
- Composite: `[shopId, event, createdAt]`, `[bundleId, event, createdAt]`

## Design Models

### DesignSettings

**Purpose:** Visual customization settings per shop per bundle type

```prisma
model DesignSettings {
  id                    String     @id @default(uuid())
  shopId                String
  bundleType            BundleType @default(product_page)

  // Product Card (50+ fields)
  productCardBgColor          String? @default("#FFFFFF")
  productCardFontColor        String? @default("#000000")
  productCardFontSize         Int?    @default(16)
  productCardFontWeight       Int?    @default(400)
  productCardImageFit         String? @default("cover")
  productCardsPerRow          Int?    @default(3)
  productPriceVisibility      Boolean @default(true)
  productPriceBgColor         String? @default("#F0F8F0")
  productStrikePriceColor     String? @default("#8D8D8D")
  productStrikeFontSize       Int?    @default(14)
  productStrikeFontWeight     Int?    @default(400)
  productFinalPriceColor      String? @default("#000000")
  productFinalPriceFontSize   Int?    @default(18)
  productFinalPriceFontWeight Int?    @default(700)

  // Product Card Layout (Phase 6)
  productCardWidth            Int?    @default(280)
  productCardHeight           Int?    @default(420)
  productCardSpacing          Int?    @default(20)
  productCardBorderRadius     Int?    @default(8)
  productCardPadding          Int?    @default(12)
  productCardBorderWidth      Int?    @default(1)
  productCardBorderColor      String? @default("rgba(0,0,0,0.08)")
  productCardShadow           String? @default("0 2px 8px rgba(0,0,0,0.04)")
  productCardHoverShadow      String? @default("0 8px 24px rgba(0,0,0,0.12)")

  // Product Image (Phase 6)
  productImageHeight          Int?    @default(280)
  productImageBorderRadius    Int?    @default(6)
  productImageBgColor         String? @default("#F8F8F8")

  // Product Modal (Phase 6)
  modalBgColor                String? @default("#FFFFFF")
  modalBorderRadius           Int?    @default(12)
  modalTitleFontSize          Int?    @default(28)
  modalTitleFontWeight        Int?    @default(700)
  modalPriceFontSize          Int?    @default(22)
  modalVariantBorderRadius    Int?    @default(8)
  modalButtonBgColor          String? @default("#000000")
  modalButtonTextColor        String? @default("#FFFFFF")
  modalButtonBorderRadius     Int?    @default(8)

  // Button
  buttonBgColor               String? @default("#000000")
  buttonTextColor             String? @default("#FFFFFF")
  buttonFontSize              Int?    @default(16)
  buttonFontWeight            Int?    @default(600)
  buttonBorderRadius          Int?    @default(8)
  buttonHoverBgColor          String? @default("#333333")
  buttonAddToCartText         String? @default("Add to cart")

  // Quantity Selector
  quantitySelectorBgColor     String? @default("#000000")
  quantitySelectorTextColor   String? @default("#FFFFFF")
  quantitySelectorFontSize    Int?    @default(16)
  quantitySelectorBorderRadius Int?   @default(8)

  // JSON Settings (Complex Structures)
  globalColorsSettings        Json?   // Global color palette
  footerSettings              Json?   // Footer configuration
  stepBarSettings             Json?   // Step navigation bar
  generalSettings             Json?   // General widget settings

  // Advanced
  customCss                   String? // Custom CSS injection

  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
}
```

**Unique Constraint:** One design config per shop per bundle type
`@@unique([shopId, bundleType])`

**Indexes:**
- `shopId` - Queries by shop
- `bundleType` - Queries by type

**JSON Settings Examples:**

**globalColorsSettings:**
```json
{
  "primaryColor": "#000000",
  "secondaryColor": "#333333",
  "accentColor": "#FF6B6B"
}
```

**footerSettings:**
```json
{
  "show": true,
  "backgroundColor": "#FFFFFF",
  "totalFormat": "Total: {{price}}",
  "showBackButton": true,
  "showNextButton": true
}
```

**stepBarSettings:**
```json
{
  "show": true,
  "style": "tabs",
  "backgroundColor": "#F5F5F5",
  "activeColor": "#000000",
  "inactiveColor": "#999999"
}
```

## Subscription Models

### Shop

**Purpose:** Shopify store metadata

```prisma
model Shop {
  id                    String         @id @default(uuid())
  shopDomain            String         @unique
  name                  String?
  email                 String?
  installedAt           DateTime       @default(now())
  uninstalledAt         DateTime?
  currentSubscriptionId String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  // Relations
  subscriptions         Subscription[]
}
```

**Fields:**
- `id` - Unique shop ID
- `shopDomain` - Unique shop domain (e.g., `store.myshopify.com`)
- `name` - Shop name
- `email` - Shop contact email
- `installedAt` - App installation timestamp
- `uninstalledAt` - App uninstallation timestamp (if applicable)
- `currentSubscriptionId` - Active subscription ID
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp

**Indexes:**
- `shopDomain` - Unique constraint and queries
- `currentSubscriptionId` - Active subscription lookups

---

### Subscription

**Purpose:** Track app subscription status and billing

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
  confirmationUrl       String?
  returnUrl             String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  shop                  Shop               @relation(fields: [shopId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id` - Unique subscription ID
- `shopId` - Parent shop ID
- `shopifySubscriptionId` - Shopify's subscription GID (unique)
- `plan` - `free` or `grow`
- `status` - Subscription status (see enum)
- `name` - Display name (e.g., "Grow Plan")
- `price` - Monthly price in USD
- `currencyCode` - Currency code (default USD)
- `trialDaysRemaining` - Trial days left (null if no trial)
- `currentPeriodStart` - Billing period start
- `currentPeriodEnd` - Billing period end
- `cancelledAt` - Cancellation timestamp
- `confirmationUrl` - Shopify approval URL
- `returnUrl` - Post-approval return URL

**Indexes:**
- `shopId` - Queries by shop
- `shopifySubscriptionId` - Shopify integration
- `status` - Filter by status
- `plan` - Filter by plan

---

### WebhookEvent

**Purpose:** Track processed webhooks for idempotency

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
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Fields:**
- `id` - Unique event ID
- `shopDomain` - Shop that sent webhook
- `topic` - Webhook topic (e.g., `APP_SUBSCRIPTIONS_UPDATE`)
- `webhookId` - Shopify webhook ID (for idempotency)
- `payload` - Full webhook payload (JSON)
- `processed` - Processing status
- `processedAt` - Processing completion timestamp
- `error` - Error message (if failed)
- `retryCount` - Number of retry attempts
- `createdAt` - Event creation timestamp
- `updatedAt` - Last update timestamp

**Unique Constraint:** Prevent duplicate processing
`@@unique([shopDomain, topic, webhookId])`

**Indexes:**
- `shopDomain` - Queries by shop
- `topic` - Filter by topic
- `processed` - Find unprocessed webhooks
- `createdAt` - Time-series queries

## System Models

### Session

**Purpose:** Shopify OAuth session storage

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
  firstName              String?
  lastName               String?
  email                  String?
  accountOwner           Boolean   @default(false)
  locale                 String?
  collaborator           Boolean?  @default(false)
  emailVerified          Boolean?  @default(false)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

**Fields:**
- `id` - Session ID
- `shop` - Shop domain
- `state` - OAuth state parameter
- `isOnline` - Online vs offline session
- `scope` - Granted OAuth scopes
- `expires` - Session expiration timestamp
- `accessToken` - Shopify API access token
- `storefrontAccessToken` - Storefront API token (if delegated)
- `userId` - Shopify user ID
- `firstName` - User first name
- `lastName` - User last name
- `email` - User email
- `accountOwner` - Is shop owner
- `locale` - User locale
- `collaborator` - Is staff account
- `emailVerified` - Email verification status
- `createdAt` - Session creation timestamp
- `updatedAt` - Last update timestamp

**Indexes:**
- `shop` - Queries by shop
- Composite: `[shop, expires]`, `[shop, storefrontAccessToken]`

---

### QueuedJob

**Purpose:** Background job queue

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
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Fields:**
- `id` - Unique job ID
- `shopId` - Shop initiating job
- `type` - Job type (see enum)
- `status` - Job status (see enum)
- `data` - Job payload (JSON)
- `error` - Error message (if failed)
- `startedAt` - Job start timestamp
- `completedAt` - Job completion timestamp
- `createdAt` - Job creation timestamp
- `updatedAt` - Last update timestamp

**Indexes:**
- `shopId` - Queries by shop
- `status` - Find pending jobs
- `type` - Filter by job type

---

### ComplianceRecord

**Purpose:** GDPR compliance webhook tracking

```prisma
model ComplianceRecord {
  id          String    @id @default(uuid())
  shop        String
  type        String    // "customer_data_request", "customer_redact", "shop_redact"
  payload     Json
  status      String    @default("pending")
  processedAt DateTime?
  createdAt   DateTime  @default(now())
}
```

**Fields:**
- `id` - Unique record ID
- `shop` - Shop domain
- `type` - Compliance webhook type
- `payload` - Full webhook payload (JSON)
- `status` - Processing status (`pending`, `processing`, `completed`)
- `processedAt` - Processing completion timestamp
- `createdAt` - Record creation timestamp

**Indexes:**
- `shop` - Queries by shop
- `type` - Filter by webhook type
- `status` - Find pending records

## Relationships Diagram

```
Shop
 ├── Subscription (1:many)
 └── Bundle (via shopId string reference)

Bundle
 ├── BundleStep (1:many)
 ├── BundlePricing (1:1)
 └── BundleAnalytics (1:many)

BundleStep
 └── StepProduct (1:many)

DesignSettings
 └── (Shop-scoped, referenced via shopId + bundleType unique constraint)

Session
 └── (Shop-scoped, referenced via shop string)

WebhookEvent
 └── (Shop-scoped, referenced via shopDomain string)

QueuedJob
 └── (Shop-scoped, referenced via shopId string)

ComplianceRecord
 └── (Shop-scoped, referenced via shop string)
```

## Indexes

### Performance Optimization

**Common Query Patterns:**
1. `Bundle.findMany({ where: { shopId, status: 'active', bundleType } })`
   - Indexed: `[shopId, bundleType, status]`

2. `BundleStep.findMany({ where: { bundleId }, orderBy: { position: 'asc' } })`
   - Indexed: `[bundleId, position]`

3. `BundleAnalytics.aggregate({ where: { shopId, event, createdAt: { gte, lte } } })`
   - Indexed: `[shopId, event, createdAt]`

4. `Subscription.findUnique({ where: { shopifySubscriptionId } })`
   - Indexed: `shopifySubscriptionId` (unique)

5. `Session.findFirst({ where: { shop, expires: { gt: now() } } })`
   - Indexed: `[shop, expires]`

### Index Strategy

**Single Column Indexes:**
- Foreign keys (auto-indexed in most DBs)
- Unique constraints
- High-cardinality columns frequently queried alone

**Composite Indexes:**
- Multiple columns frequently queried together
- Order matters: most selective column first
- Cover common WHERE + ORDER BY patterns

**Example Composite Index:**
```prisma
@@index([shopId, bundleType, status])
```
Supports queries:
- `WHERE shopId = ? AND bundleType = ? AND status = ?` ✅
- `WHERE shopId = ? AND bundleType = ?` ✅
- `WHERE shopId = ?` ✅
- `WHERE bundleType = ?` ❌ (doesn't start with first column)

## Migrations

### Running Migrations

```bash
# Development: Create and apply migration
npx prisma migrate dev --name add_new_field

# Production: Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate
```

### Migration Best Practices

1. **Always backup production before migrating**
2. **Test migrations on staging first**
3. **Keep migrations small and focused**
4. **Use descriptive migration names**
5. **Add default values for new non-nullable columns**
6. **Create indexes in separate migrations if heavy**

### Recent Migrations

**20260114130800_add_full_page_phase6_settings:**
- Added 22 Phase 6 design settings fields
- Card dimensions, spacing, modal styling

For migration history, see `prisma/migrations/` directory.

## Related Documentation

- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Feature Guide](FEATURE_GUIDE.md)
- [API Endpoints](API_ENDPOINTS.md)
