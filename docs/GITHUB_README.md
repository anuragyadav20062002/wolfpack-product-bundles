# 🎁 Wolfpack Product Bundles

> A powerful Shopify app that enables merchants to create customizable product bundles with dynamic pricing and real-time cart transformation.

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/wolfpack/product-bundles)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Shopify](https://img.shields.io/badge/Shopify-App-96bf48.svg)](https://shopify.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

Wolfpack Product Bundles is a comprehensive Shopify application that allows merchants to:

- **Create Multi-Step Bundle Builders** - Guide customers through a structured product selection process
- **Apply Dynamic Pricing** - Offer percentage-based, fixed amount, or tiered discounts
- **Customize Appearance** - Control colors, fonts, spacing, and layout without code
- **Handle Complex Cart Logic** - Automatically transform carts at checkout with Shopify Functions
- **Support Multiple Bundle Types** - Product-page bundles and full-page dedicated bundle pages

### Why Choose This App?

✅ **Flexible** - Supports various bundle configurations and pricing strategies
✅ **Customizable** - Full design control through visual interface
✅ **Performant** - Optimized widget loading and efficient database queries
✅ **Scalable** - Built to handle high-traffic stores
✅ **Reliable** - Webhook processing via Google Cloud Pub/Sub

---

## ✨ Features

### For Merchants

**Bundle Creation**
- Multi-step bundle builder with unlimited steps
- Drag-and-drop product selection
- Minimum/maximum quantity controls
- Category-based product organization

**Pricing Options**
- Percentage discounts (e.g., "20% off")
- Fixed amount discounts (e.g., "$10 off")
- Tiered pricing (more products = bigger discount)
- Conditional requirements (minimum products, specific totals)

**Design Customization**
- Visual design control panel
- Separate styling for product-page and full-page widgets
- Live preview of design changes
- Pre-built color schemes

**Analytics & Insights**
- Bundle performance tracking
- Revenue attribution
- Popular product combinations
- Conversion rates

### For Customers

**Seamless Experience**
- Intuitive step-by-step builder
- Real-time price calculation
- Visual progress indicators
- Mobile-responsive design

**Flexible Selection**
- Choose from multiple product options per step
- Select variants (size, color, etc.)
- See bundle savings in real-time
- One-click add to cart

---

## 🎥 Demo

### Product-Page Bundle
![Product Page Bundle](docs/images/product-page-demo.gif)

### Full-Page Bundle
![Full Page Bundle](docs/images/full-page-demo.gif)

### Design Control Panel
![Design Panel](docs/images/design-panel-demo.gif)

> **Try it live:** Visit our [demo store](https://demo.wolfpack-bundles.com)

---

## 🚀 Installation

### Prerequisites

- Shopify Partner account
- Shopify development store
- Node.js 18+ and npm
- PostgreSQL database
- Render.com account (or similar hosting)

### Quick Install

```bash
# 1. Clone the repository
git clone https://github.com/wolfpack/product-bundles.git
cd product-bundles

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Set up database
npx prisma migrate dev
npx prisma db seed

# 5. Start development server
npm run dev
```

### Detailed Installation

See our comprehensive [Installation Guide](docs/INSTALLATION_GUIDE.md) for step-by-step instructions including:
- Shopify app setup
- Database configuration
- Google Cloud Pub/Sub setup
- Development environment configuration

---

## 🎯 Quick Start

### 1. Create Your First Bundle

```bash
# Start the app
npm run dev

# Visit: http://localhost:3000
# Login with your Shopify store
# Click "Create Bundle"
```

### 2. Configure Bundle Steps

```javascript
// Example bundle configuration
{
  "title": "Complete Skincare Set",
  "bundleType": "full_page",
  "steps": [
    {
      "title": "Choose Your Cleanser",
      "minQuantity": 1,
      "maxQuantity": 1,
      "products": ["gid://shopify/ProductVariant/123", ...]
    },
    {
      "title": "Pick a Moisturizer",
      "minQuantity": 1,
      "maxQuantity": 2,
      "products": ["gid://shopify/ProductVariant/456", ...]
    }
  ],
  "pricing": {
    "discountType": "percentage",
    "discountValue": 20,
    "requirementType": "min_products",
    "requirementValue": 3
  }
}
```

### 3. Install Widget on Storefront

**Option A: Automatic (Recommended)**
1. Click "Place Widget Now" in bundle settings
2. Select target product or page
3. Widget automatically injected

**Option B: Manual**
1. Go to Shopify Admin → Themes → Customize
2. Add "Bundle - Full Page" or "Bundle - Product Page" block
3. Configure bundle ID

### 4. Customize Appearance

1. Navigate to "Design Settings"
2. Choose bundle type (Product Page / Full Page)
3. Customize colors, fonts, spacing
4. Click "Save Changes"

---

## ⚙️ How It Works

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│                    MERCHANT ADMIN                        │
│                  (Remix Application)                     │
│                                                          │
│  1. Create bundle configuration                          │
│  2. Select products for each step                        │
│  3. Set pricing rules                                    │
│  4. Customize design                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                      DATABASE                            │
│                   (PostgreSQL)                           │
│                                                          │
│  • Bundle configuration                                  │
│  • Steps and products                                    │
│  • Pricing rules                                         │
│  • Design settings                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                SHOPIFY METAFIELDS                        │
│                                                          │
│  • Product ← bundle_id (for product-page bundles)       │
│  • Page ← bundle_id (for full-page bundles)             │
│  • Shop ← serverUrl (app URL for API calls)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              CUSTOMER STOREFRONT                         │
│                                                          │
│  1. Widget loads via Liquid template                    │
│  2. JavaScript fetches bundle data from API              │
│  3. Customer selects products                            │
│  4. Real-time price calculation                          │
│  5. Add to cart with bundle properties                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    SHOPIFY CART                          │
│                                                          │
│  Items with properties:                                  │
│  • _bundleId                                             │
│  • _bundleTitle                                          │
│  • _stepTitle                                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              CART TRANSFORM FUNCTION                     │
│              (Shopify Function)                          │
│                                                          │
│  1. Groups items by bundleId                             │
│  2. Fetches pricing configuration                        │
│  3. Calculates discount                                  │
│  4. Applies discount to bundle items                     │
│  5. Returns modified cart                                │
└─────────────────────────────────────────────────────────┘
```

### Key Components

1. **Remix Admin App**
   - Bundle CRUD operations
   - Design control panel
   - Settings management

2. **Bundle Widget** (Storefront)
   - JavaScript-based UI
   - Fetches data via App Proxy
   - Handles product selection
   - Calculates pricing in real-time

3. **Cart Transform Function**
   - Rust/TypeScript function
   - Runs on Shopify's infrastructure
   - Applies discounts at checkout
   - Validates bundle requirements

4. **Database** (PostgreSQL)
   - Stores bundle configurations
   - Manages design settings
   - Tracks webhooks and subscriptions

---

## 🛠️ Technology Stack

### Frontend
- **Remix** - Full-stack web framework
- **React 18** - UI library
- **Shopify Polaris** - Design system
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool

### Backend
- **Node.js 18+** - JavaScript runtime
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database
- **Express** - HTTP server

### Shopify Integration
- **Shopify Admin API** - GraphQL API
- **Shopify Functions** - Cart transform
- **App Proxy** - Storefront API
- **Theme App Extensions** - Widget blocks

### Infrastructure
- **Render.com** - Cloud hosting
- **Google Cloud Pub/Sub** - Webhook processing
- **GitHub Actions** - CI/CD

---

## 🏗️ Architecture

### Application Structure

```
Only-Bundles/
├── app/                          # Main application
│   ├── components/              # React components
│   │   ├── design-control-panel/  # DCP components
│   │   ├── bundle/                # Bundle management
│   │   └── settings/              # Settings UI
│   ├── routes/                  # Remix routes (pages + API)
│   │   ├── app.*.tsx           # Admin pages
│   │   ├── api.*.tsx           # API endpoints
│   │   └── webhooks.*.tsx      # Webhook handlers
│   ├── services/                # Business logic
│   │   ├── bundleService.ts    # Bundle operations
│   │   ├── shopifyService.ts   # Shopify API
│   │   └── pricingService.ts   # Pricing logic
│   ├── lib/                     # Core libraries
│   └── utils/                   # Helper functions
│
├── extensions/                   # Shopify extensions
│   ├── bundle-builder/          # Theme extension
│   │   ├── blocks/             # Liquid templates
│   │   └── assets/             # JS/CSS files
│   └── bundle-cart-transform-ts/  # Function
│       └── src/run.ts          # Transform logic
│
├── prisma/                       # Database
│   ├── schema.prisma           # Data models
│   └── migrations/             # Version history
│
└── docs/                         # Documentation
    ├── TECHNICAL_DOCUMENTATION.md
    ├── PROMPT_ENGINEERING_GUIDE.md
    └── API_REFERENCE.md
```

### Database Schema

```prisma
model Shop {
  id          String   @id @default(cuid())
  shopDomain  String   @unique
  accessToken String
  bundles     Bundle[]
}

model Bundle {
  id          String        @id @default(cuid())
  title       String
  status      BundleStatus  @default(draft)
  bundleType  BundleType
  steps       BundleStep[]
  pricing     BundlePricing?
  shopDomain  String
  shop        Shop          @relation(fields: [shopDomain])
}

model BundleStep {
  id           String         @id @default(cuid())
  title        String
  description  String?
  minQuantity  Int            @default(1)
  maxQuantity  Int?
  position     Int
  products     StepProduct[]
  bundleId     String
  bundle       Bundle         @relation(fields: [bundleId])
}

// ... see schema.prisma for complete models
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Shopify App Credentials
SHOPIFY_API_KEY=your_app_client_id
SHOPIFY_API_SECRET=your_app_client_secret
SHOPIFY_APP_URL=https://your-app.onrender.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/database
DIRECT_URL=postgresql://user:pass@host:5432/database

# API Scopes
SCOPES=read_products,write_products,write_cart_transforms,read_orders

# Session
SESSION_SECRET=your_random_secret_key

# Google Cloud (for webhooks)
GOOGLE_CLOUD_PROJECT=your-project-id
PUBSUB_SUBSCRIPTION=your-subscription-name
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

See [.env.example](.env.example) for complete list.

### App Configuration

**Shopify Partner Dashboard:**
1. App URL: `https://your-app.onrender.com`
2. Allowed redirection URL: `https://your-app.onrender.com/auth/callback`
3. App proxy:
   - Subpath prefix: `apps`
   - Subpath: `product-bundles`
   - Proxy URL: `https://your-app.onrender.com`

---

## 💻 Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev

# Seed sample data
npx prisma db seed

# Start dev server
npm run dev
```

### Development Workflow

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Deploy Shopify extensions
shopify app deploy
```

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- bundleService.test.ts

# Coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Debugging

**Enable Debug Mode:**
```javascript
// Browser console
window.BUNDLE_DEBUG = true;

// Server
LOG_LEVEL=debug npm run dev
```

---

## 🚢 Deployment

### Deploy to Render

**Automatic Deployment (Recommended):**
1. Connect GitHub repository to Render
2. Push to `main` branch
3. Render automatically builds and deploys

**Manual Deployment:**
```bash
# Commit changes
git add .
git commit -m "Your changes"
git push origin main

# Render dashboard → Manual Deploy
```

### Deploy Shopify Extensions

```bash
# Deploy theme extension (widget)
shopify app deploy

# Deploy cart transform function
cd extensions/bundle-cart-transform-ts
shopify function deploy
```

### Post-Deployment Checklist

- [ ] Verify app is running: Visit app URL
- [ ] Test admin dashboard: Create/edit bundle
- [ ] Test widget on storefront
- [ ] Test cart transform at checkout
- [ ] Check error logs in Render dashboard
- [ ] Verify webhooks are processing

---

## 📚 API Reference

### Widget API Endpoints

**Get Bundle Data**
```
GET /apps/product-bundles/api/bundle-data/:shopDomain?bundleId={id}

Response:
{
  "bundle": {
    "id": "bundle-123",
    "title": "Complete Set",
    "steps": [...],
    "pricing": {...}
  }
}
```

**Get Design Settings**
```
GET /apps/product-bundles/api/design-settings/:shopDomain?bundleType=full_page

Response: CSS file with design variables
```

### GraphQL Mutations

**Create Bundle**
```graphql
mutation CreateBundle($input: BundleInput!) {
  createBundle(input: $input) {
    id
    title
    status
  }
}
```

**Update Bundle**
```graphql
mutation UpdateBundle($id: ID!, $input: BundleInput!) {
  updateBundle(id: $id, input: $input) {
    id
    title
    status
  }
}
```

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete API documentation.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create a Pull Request**

### Development Guidelines

- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Keep PRs focused and small

### Code Style

- Use TypeScript for type safety
- Follow Prettier formatting
- Use ESLint rules
- Write meaningful variable names
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Documentation

- **Technical Docs:** [TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)
- **Prompt Guide:** [PROMPT_ENGINEERING_GUIDE.md](docs/PROMPT_ENGINEERING_GUIDE.md)
- **API Reference:** [API_REFERENCE.md](docs/API_REFERENCE.md)

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/wolfpack/product-bundles/issues)
- **Discussions:** [GitHub Discussions](https://github.com/wolfpack/product-bundles/discussions)
- **Email:** support@wolfpack.com

### Useful Links

- [Shopify Dev Docs](https://shopify.dev)
- [Remix Documentation](https://remix.run/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Polaris Components](https://polaris.shopify.com)

---

## 🙏 Acknowledgments

- Shopify for their amazing platform and developer tools
- The Remix team for the excellent framework
- Prisma for making database management a breeze
- Our beta testers and early adopters

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/wolfpack/product-bundles?style=social)
![GitHub forks](https://img.shields.io/github/forks/wolfpack/product-bundles?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/wolfpack/product-bundles?style=social)

---

**Made with ❤️ by Wolfpack**

**Last Updated:** December 28, 2025
