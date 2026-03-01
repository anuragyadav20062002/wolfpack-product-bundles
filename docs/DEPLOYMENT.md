# Deployment Guide

**Last Updated:** January 14, 2026

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Shopify Setup](#shopify-setup)
- [Deployment Platforms](#deployment-platforms)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Rollback](#rollback)

## Prerequisites

### Required Accounts
- [ ] Shopify Partner Account
- [ ] Render.com Account (or alternative hosting)
- [ ] Google Cloud Account (for Pub/Sub webhooks)
- [ ] PostgreSQL Database (Neon/Render)

### Required Tools
```bash
# Node.js 20+ and npm
node --version  # v20.x.x or higher
npm --version   # v10.x.x or higher

# Shopify CLI
npm install -g @shopify/cli @shopify/app

# Prisma CLI
npm install -g prisma

# Git
git --version
```

## Environment Setup

### 1. Environment Variables

Create `.env` file in project root:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SCOPES="write_products,write_customers,write_draft_orders,write_discounts"
HOST="https://your-app.onrender.com"

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Session Storage
SESSION_SECRET="random_32_character_string"

# Google Cloud Pub/Sub (optional, for webhooks)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
PUBSUB_TOPIC_NAME="shopify-webhooks"
PUBSUB_SUBSCRIPTION_NAME="shopify-webhooks-sub"

# Subscription Billing
BILLING_ENABLED="true"

# Feature Flags
ENABLE_ANALYTICS="true"
ENABLE_FULL_PAGE_BUNDLES="true"
```

### 2. Generate Secrets

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

### 3. Shopify OAuth Scopes

Required scopes:
```
write_products          # Create/update products and metafields
read_products           # Read product data
write_pages             # Create bundle pages (full-page bundles)
read_pages              # Read page data
write_themes            # Install widget in theme
read_themes             # Read theme data
write_discounts         # Cart transform function
read_discounts          # Read discount data
write_own_subscription_contracts  # Subscription billing
read_own_subscription_contracts   # Read subscription status
```

## Database Setup

### 1. Create PostgreSQL Database

**Using Neon:**
```bash
# Sign up at https://neon.tech
# Create new project
# Copy connection string
```

**Using Render:**
```bash
# Sign up at https://render.com
# Create new PostgreSQL database
# Copy internal and external URLs
```

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma studio  # Opens GUI at http://localhost:5555
```

### 3. Seed Database (Optional)

```bash
# Create seed script: prisma/seed.ts
# Run seed
npx prisma db seed
```

## Shopify Setup

### 1. Create Shopify App

```bash
# Navigate to https://partners.shopify.com
# Apps > Create app > Create app manually

# Fill in:
Name: Wolfpack Product Bundles
App URL: https://your-app.onrender.com
Allowed redirection URL(s):
  https://your-app.onrender.com/auth/callback
  https://your-app.onrender.com/api/auth
```

### 2. Configure App Extensions

**Cart Transform Function:**
```bash
# Deploy function
cd extensions/bundle-cart-transform-ts
npm install
npm run deploy

# Note the function ID - add to .env if needed
```

**Theme App Extensions:**
```bash
# Deploy extension
shopify app deploy

# Extensions auto-install when app installed
```

### 3. Set Up Webhooks

**Via Shopify Partner Dashboard:**
```
Webhooks:
- app/subscriptions/update → https://your-app.onrender.com/api/webhooks/pubsub
- app/uninstalled → https://your-app.onrender.com/webhooks/app/uninstalled
- products/update → https://your-app.onrender.com/webhooks/products/update
- products/delete → https://your-app.onrender.com/webhooks/products/delete
- app/scopes_update → https://your-app.onrender.com/webhooks/app/scopes_update
```

**Or via API:**
```graphql
mutation {
  webhookSubscriptionCreate(
    topic: APP_SUBSCRIPTIONS_UPDATE
    webhookSubscription: {
      format: JSON
      callbackUrl: "https://your-app.onrender.com/api/webhooks/pubsub"
    }
  ) {
    webhookSubscription {
      id
    }
    userErrors {
      message
    }
  }
}
```

## Deployment Platforms

### Render.com (Recommended)

**1. Create Web Service**

```bash
# Sign in to Render Dashboard
# New > Web Service

# Connect GitHub repository
Repository: wolfpack-product-bundles
Branch: main

# Configuration:
Name: wolfpack-bundles
Environment: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

**2. Add Environment Variables**

```
SHOPIFY_API_KEY=abc123
SHOPIFY_API_SECRET=xyz789
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=...
HOST=https://your-app.onrender.com
SCOPES=write_products,...
```

**3. Deploy**

```bash
# Automatic deployment on git push
git push origin main

# Manual deployment
# Render Dashboard > Manual Deploy > Deploy latest commit
```

**4. Custom Domain (Optional)**

```bash
# Render Dashboard > Settings > Custom Domain
# Add: bundles.yourdomain.com
# Update DNS: CNAME to your-app.onrender.com
```

---

### Vercel (Alternative)

**1. Install Vercel CLI**

```bash
npm install -g vercel
```

**2. Deploy**

```bash
# First time
vercel

# Production
vercel --prod

# Set environment variables
vercel env add SHOPIFY_API_KEY
vercel env add DATABASE_URL
# ... add all variables
```

**3. Configuration**

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install && npx prisma generate",
  "framework": "remix",
  "env": {
    "DATABASE_URL": "@database-url",
    "SESSION_SECRET": "@session-secret"
  }
}
```

---

### Heroku (Alternative)

**1. Install Heroku CLI**

```bash
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli
```

**2. Create Heroku App**

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
```

**3. Configure Environment**

```bash
heroku config:set SHOPIFY_API_KEY=abc123
heroku config:set SHOPIFY_API_SECRET=xyz789
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)
heroku config:set SCOPES=write_products,...
```

**4. Deploy**

```bash
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-app.onrender.com/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-14T10:00:00Z"
}
```

### 2. Test App Installation

```bash
# Install on development store
# https://your-app.onrender.com/install?shop=dev-store.myshopify.com

# Verify:
1. OAuth flow completes
2. App appears in Shopify admin
3. Database session created
4. Free subscription created
```

### 3. Test Cart Transform

```bash
# Admin UI > Bundles > Create Test Bundle
# Add bundle to cart
# Check cart transform applied discount

# Debug endpoint:
curl https://your-app.onrender.com/api/check-cart-transform?shop=dev-store.myshopify.com
```

### 4. Test Webhooks

```bash
# Trigger test webhook from Shopify admin
# Extensions > Webhooks > Send test webhook

# Verify in database:
SELECT * FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 10;
```

### 5. Test Billing Flow

```bash
# Admin UI > Upgrade to Grow Plan
# Complete approval in Shopify
# Verify subscription status updated

# Check:
SELECT * FROM "Subscription" WHERE "shopId" = '...';
```

## Monitoring

### Application Logs

**Render:**
```bash
# Dashboard > Logs
# Real-time log streaming
# Download logs for analysis
```

**Heroku:**
```bash
heroku logs --tail
heroku logs --source app --dyno web
```

### Database Monitoring

**Prisma Studio:**
```bash
# Development
npx prisma studio

# Production (via tunnel)
# Connect to production DB temporarily
```

**PostgreSQL Queries:**
```sql
-- Active sessions
SELECT * FROM "Session" WHERE "expires" > NOW();

-- Recent bundles
SELECT * FROM "Bundle" ORDER BY "createdAt" DESC LIMIT 20;

-- Subscription status
SELECT s."shopDomain", sub."plan", sub."status"
FROM "Shop" s
JOIN "Subscription" sub ON s."currentSubscriptionId" = sub."id";

-- Webhook processing
SELECT * FROM "WebhookEvent"
WHERE "processed" = false
ORDER BY "createdAt" ASC;
```

### Error Tracking

**Setup Sentry (Optional):**
```bash
npm install @sentry/remix

# app/entry.server.tsx
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

**Key Metrics:**
- API response times
- Database query times
- Cart transform execution time
- Webhook processing time
- Session creation time

**Tools:**
- Render metrics dashboard
- PostgreSQL slow query log
- Shopify app logs

### Alerts

**Set up alerts for:**
- [ ] High error rate (>5% of requests)
- [ ] Slow response times (>2s p95)
- [ ] Database connection failures
- [ ] Webhook processing failures
- [ ] Cart transform errors

## Rollback

### 1. Code Rollback

**Render:**
```bash
# Dashboard > Deploys
# Find previous successful deploy
# Click "Redeploy"
```

**Git-based:**
```bash
# Revert to previous commit
git log  # Find commit hash
git revert <commit-hash>
git push origin main
```

### 2. Database Rollback

**Prisma Migrate:**
```bash
# WARNING: Be very careful with production data

# Revert last migration
npx prisma migrate rollback

# Or restore from backup
# Use your database provider's backup restore
```

### 3. Verification

```bash
# Check app is working
curl https://your-app.onrender.com/health

# Check database
npx prisma studio

# Test critical flows
1. Bundle creation
2. Widget loading
3. Cart transform
4. Billing
```

## Production Checklist

Before going live:

**Security:**
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Webhook HMAC validation active

**Performance:**
- [ ] Database indexes created
- [ ] Assets minified and bundled
- [ ] CDN configured for static assets
- [ ] Connection pooling enabled

**Reliability:**
- [ ] Database backups configured
- [ ] Error tracking enabled
- [ ] Monitoring and alerts set up
- [ ] Health check endpoint working

**Functionality:**
- [ ] All webhooks registered
- [ ] Cart transform deployed
- [ ] Theme extensions deployed
- [ ] Billing flow tested
- [ ] GDPR compliance webhooks configured

**Documentation:**
- [ ] API endpoints documented
- [ ] Deployment runbook created
- [ ] Incident response plan ready
- [ ] Team access configured

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check connection string
npx prisma db execute --stdin <<< "SELECT 1"

# Verify SSL mode
# Add ?sslmode=require to DATABASE_URL
```

**2. OAuth Loop**
```bash
# Clear sessions
DELETE FROM "Session" WHERE "shop" = 'problem-store.myshopify.com';

# Check redirect URLs match in Shopify Partner Dashboard
# Verify HOST environment variable is correct
```

**3. Cart Transform Not Working**
```bash
# Verify function deployed
shopify app function info

# Check function ID
curl https://your-app.onrender.com/api/get-function-id?shop=store.myshopify.com

# Redeploy if needed
cd extensions/bundle-cart-transform-ts
npm run deploy
```

**4. Webhook Not Processing**
```bash
# Check webhook endpoint
curl -X POST https://your-app.onrender.com/api/webhooks/pubsub \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"test"}}'

# Check WebhookEvent table
SELECT * FROM "WebhookEvent" WHERE "processed" = false;

# Manually process stuck webhooks
UPDATE "WebhookEvent" SET "processed" = true WHERE "id" = '...';
```

## Backup Strategy

### Database Backups

**Automated (Recommended):**
- Neon: Automatic daily backups (7 day retention)
- Render: Configure backup schedule in dashboard
- Heroku Postgres: `heroku pg:backups:schedule`

**Manual Backups:**
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260114.sql
```

### Application Backups

```bash
# Git tags for releases
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# Document deployment
echo "Deployed v1.0.0 on $(date)" >> DEPLOYMENT_LOG.md
```

## Related Documentation

- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Subscription Billing Guide](shopify_subscription_billing_guide.md)
- [Google Cloud Pub/Sub Setup](google_cloud_pubsub_setup.md)
