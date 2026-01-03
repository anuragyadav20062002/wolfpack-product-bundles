# Documentation Hub
## Wolfpack Product Bundles - Complete Documentation

**Last Updated:** December 28, 2025
**Version:** 4.0
**Status:** Current and Maintained

---

## 🎯 Quick Start - Choose Your Path

### 👨‍💻 For Developers (Joining the Team)
**Start here:** [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
- Complete codebase overview in simple terms
- Architecture explanations
- Development workflows
- Troubleshooting guides

### 📖 For Understanding the App (General Overview)
**Start here:** [GITHUB_README.md](./GITHUB_README.md)
- What the app does
- Features and capabilities
- System architecture
- Installation and setup

### 🤖 For Building From Scratch (Prompt Engineering)
**Start here:** [PROMPT_ENGINEERING_GUIDE.md](./PROMPT_ENGINEERING_GUIDE.md)
- Step-by-step prompts to recreate the app
- No prior Shopify/Figma knowledge required
- Complete with AI coding assistants
- ~18-27 hours from start to finish

---

## 📚 Complete Documentation Index

### ⭐ New Core Documentation (Latest Version)

**[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - For Developers
- Complete codebase overview in simple terms
- System architecture and data flow
- Core components explained
- Development tasks and workflows
- Troubleshooting guide

**[GITHUB_README.md](./GITHUB_README.md)** - For Everyone
- App overview and features
- Installation and quick start
- Technology stack
- API reference
- Contributing guidelines

**[PROMPT_ENGINEERING_GUIDE.md](./PROMPT_ENGINEERING_GUIDE.md)** - For Recreating the App
- Step-by-step prompts for AI assistants
- No Shopify/Figma knowledge required
- 9 phases from setup to deployment
- Debugging prompts included

### Original Core Documentation

**[APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md)** ⭐
- Complete system architecture overview
- Technology stack details
- Database schema with all models
- Metafield architecture and structure
- Data flow diagrams
- Service layer documentation
- Environment variables reference
- Deployment architecture
- Security and best practices

### Deployment & Setup

**[deployment_guide_subscription_billing.md](./deployment_guide_subscription_billing.md)**
- Step-by-step deployment guide for test and production
- Render.com setup instructions
- Environment variable configuration
- Testing procedures
- Troubleshooting guide

**[google_cloud_pubsub_setup.md](./google_cloud_pubsub_setup.md)**
- Google Cloud Pub/Sub setup instructions
- Topic and subscription creation
- Service account configuration
- IAM permissions setup
- Environment variable setup
- Troubleshooting tips

### Subscription Billing

**[shopify_subscription_architecture_guide.md](./shopify_subscription_architecture_guide.md)**
- Technical architecture for subscription billing
- Database models and relationships
- Webhook processing flow
- API integration details
- Implementation patterns

**[shopify_subscription_billing_guide.md](./shopify_subscription_billing_guide.md)**
- Merchant-facing billing guide
- Plan comparison (Free vs Grow)
- Upgrade and cancellation flows
- FAQ and support information

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                                          # This file
├── APPLICATION_ARCHITECTURE.md                        # ⭐ Main architecture doc
├── deployment_guide_subscription_billing.md           # Deployment guide
├── google_cloud_pubsub_setup.md                      # Google Cloud setup
├── shopify_subscription_architecture_guide.md         # Billing architecture
├── shopify_subscription_billing_guide.md              # Merchant guide
└── archive/                                           # Old/superseded docs
    ├── DEVELOPER_GUIDE.md                             # Old dev guide
    ├── METAFIELDS_ARCHITECTURE.md                     # Old metafields doc
    ├── HYBRID_ARCHITECTURE_IMPLEMENTATION.md          # Old architecture
    └── ... (19 more archived documents)
```

---

## 🚀 Quick Start

### For Developers

1. Read **[APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md)** to understand the system
2. Review **[deployment_guide_subscription_billing.md](./deployment_guide_subscription_billing.md)** for deployment steps
3. Set up Google Cloud Pub/Sub using **[google_cloud_pubsub_setup.md](./google_cloud_pubsub_setup.md)**

### For Merchants

1. Read **[shopify_subscription_billing_guide.md](./shopify_subscription_billing_guide.md)** for billing information
2. Compare plans and features
3. Understand upgrade and cancellation processes

### For System Administrators

1. Review **[APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md)** → Environment Variables section
2. Follow **[deployment_guide_subscription_billing.md](./deployment_guide_subscription_billing.md)** for infrastructure setup
3. Configure monitoring and alerts

---

## 🏗️ System Overview

### Technology Stack
- **Frontend:** Remix + Shopify Polaris
- **Backend:** Node.js + Remix + Prisma
- **Database:** PostgreSQL
- **Hosting:** Render.com (Web Service + Background Worker)
- **Webhooks:** Google Cloud Pub/Sub
- **Functions:** Shopify Functions (Cart Transform)

### Key Features
- ✅ Multi-step bundle builder
- ✅ Real-time cart transformation
- ✅ Dynamic pricing with discount rules
- ✅ Subscription billing (Free & Grow plans)
- ✅ Google Cloud Pub/Sub webhooks
- ✅ Metafield-based configuration
- ✅ GDPR compliance
- ✅ Automatic bundle limit enforcement

### Subscription Plans
- **Free Plan:** 3 bundles, basic features
- **Grow Plan:** 20 bundles, priority support, $9.99/month

---

## 📊 Database Schema Quick Reference

### Core Tables
- **Bundle** - Bundle configurations
- **BundleStep** - Bundle builder steps
- **StepProduct** - Products within steps
- **BundlePricing** - Discount rules and pricing
- **Shop** - Shopify store records
- **Subscription** - Subscription plans and billing
- **WebhookEvent** - Webhook processing tracking
- **Session** - Authentication sessions

For detailed schema, see [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md#database-schema)

---

## 🔐 Environment Variables

### Required for Web Service
```bash
SHOPIFY_API_KEY=<app-client-id>
SHOPIFY_API_SECRET=<app-client-secret>
SHOPIFY_APP_URL=https://your-app.onrender.com
SCOPES=read_products,write_products,write_cart_transforms,write_subscriptions
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Required for Pub/Sub Worker
```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
GOOGLE_CLOUD_PROJECT=light-quest-455608-i3
PUBSUB_SUBSCRIPTION=wolfpack-webhooks-subscription
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

For complete list, see [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md#environment-variables)

---

## 🗄️ Archived Documentation

The `/archive` directory contains 19 older documents that have been superseded by the current documentation. These are kept for historical reference but are no longer maintained.

### What Was Archived

**Architecture & Guides:**
- Old developer guides and architecture proposals
- Superseded implementation plans
- Old metafield documentation (now in APPLICATION_ARCHITECTURE.md)

**Fix Documentation:**
- Specific bug fixes and patches (historical record)
- Price calculation fixes
- Progress bar fixes
- Field requirement updates

**Implementation Plans:**
- Old hybrid architecture proposals
- Scalable architecture proposals
- Multi-currency implementation plans
- Pricing standardization plans

**Why Archived:**
- Superseded by APPLICATION_ARCHITECTURE.md
- Implementation completed and integrated
- Historical reference only
- No longer reflects current architecture

---

## 📝 Contributing to Documentation

When updating documentation:

1. **Major Architecture Changes:**
   - Update APPLICATION_ARCHITECTURE.md
   - Include database schema changes
   - Update data flow diagrams
   - Document new services

2. **New Features:**
   - Update relevant sections in APPLICATION_ARCHITECTURE.md
   - Add deployment notes if needed
   - Update environment variables if added

3. **Bug Fixes:**
   - No need to create fix documents
   - Update architecture doc if behavior changes
   - Use git commit messages for tracking

4. **Deprecation:**
   - Move old docs to /archive
   - Update README.md to reflect changes
   - Add note in archived doc about replacement

---

## 🆘 Support & Resources

### Official Shopify Documentation
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Shopify Functions](https://shopify.dev/docs/api/functions)
- [Shopify Billing](https://shopify.dev/docs/apps/build/billing)
- [Shopify Webhooks](https://shopify.dev/docs/apps/build/webhooks)

### External Services
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)
- [Render Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Repository
- [GitHub Issues](https://github.com/your-org/wolfpack-product-bundles/issues)
- [GitHub Discussions](https://github.com/your-org/wolfpack-product-bundles/discussions)

---

## 🔄 Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0.0 | Dec 28, 2025 | Major documentation expansion<br>- Added TECHNICAL_DOCUMENTATION.md (developer guide)<br>- Added GITHUB_README.md (general overview)<br>- Added PROMPT_ENGINEERING_GUIDE.md (prompt-based recreation)<br>- Reorganized documentation hub |
| 2.0.0 | Nov 27, 2025 | Complete documentation restructure<br>- Created APPLICATION_ARCHITECTURE.md<br>- Archived 19 old documents<br>- Added subscription billing docs<br>- Added Google Cloud Pub/Sub guide |
| 1.0.0 | Nov 4, 2024 | Initial documentation |

---

**Last Updated:** December 28, 2025
**Maintained By:** Wolfpack Development Team
**Next Review:** January 28, 2026
