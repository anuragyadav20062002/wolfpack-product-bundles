# STAGING to PROD Merge Checklist

## Overview
STAGING branch is **247 commits ahead** of PROD (main) with major new features including:
- Subscription billing system with Google Cloud Pub/Sub
- Design Control Panel (DCP)
- Enhanced cart transform functionality
- PostgreSQL database migration (completed)
- Metafield standardization
- Storefront API integration

---

## ⚠️ CRITICAL CHANGES REQUIRED

### 1. Environment Variables (.env)

**Current Staging Values → Required Production Values:**

```bash
# API Credentials
SHOPIFY_API_KEY=63077bb0483a6ce08a2d6139b14d170b → a383172f42c2ab283901a663d485a03d
SHOPIFY_API_SECRET=shpss_[STAGING_SECRET] → [PRODUCTION_SECRET]

# App URL
SHOPIFY_APP_URL=https://wolfpack-product-bundle-app-sit.onrender.com → https://wolfpack-product-bundle-app.onrender.com
HOST=https://wolfpack-product-bundle-app-sit.onrender.com → https://wolfpack-product-bundle-app.onrender.com

# Database
DATABASE_URL=[STAGING_POSTGRES_URL] → [PRODUCTION_POSTGRES_URL]
DIRECT_URL=[STAGING_POSTGRES_URL] → [PRODUCTION_POSTGRES_URL]

# ⚠️ CRITICAL: Billing Mode
SHOPIFY_TEST_CHARGES=true → false  # MUST BE FALSE IN PRODUCTION

# Google Cloud Pub/Sub
PUBSUB_TOPIC= → wolfpack-product-bundles  # Currently empty in staging
PUBSUB_SUBSCRIPTION=wolfpack-webhooks-staging → wolfpack-webhooks-production
GOOGLE_APPLICATION_CREDENTIALS_JSON=[MAY NEED DIFFERENT SERVICE ACCOUNT FOR PROD]

# Extension IDs (verify these exist in production)
SHOPIFY_BUNDLE_BUILDER_ID=[PRODUCTION_EXTENSION_ID]
SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID=[PRODUCTION_EXTENSION_ID]
```

---

## 2. Extension IDs Review

### Current Extension UIDs (from .toml files):
```toml
# bundle-builder extension
uid = "23b807f7-472d-4f93-e241-5a1e079d6b51548daaf2"

# bundle-cart-transform-ts extension
uid = "06d00551-8da0-9b28-79e8-63af90adb1019dc2f112"
```

**✅ Good News:**
- Extension UIDs are NOT hardcoded in app code
- App uses `process.env.SHOPIFY_API_KEY` dynamically for theme editor deep links
- No changes needed to extension files

**Action Required:**
- Verify production extensions are deployed with these UIDs
- Ensure `SHOPIFY_BUNDLE_BUILDER_ID` and `SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID` env vars exist in production

---

## 3. Hardcoded URLs Found

### ⚠️ ONE Hardcoded Production URL Found:

**File:** `extensions/bundle-builder/assets/bundle-widget.js`
**Line:** 45

```javascript
const productionUrl = "https://wolfpack-product-bundle-app.onrender.com";
```

**Status:** ✅ **SAFE** - This is already set to production URL as a fallback
**Action:** No change needed, but verify this matches your production URL

**Context:** This is a fallback URL used when:
1. No app URL is configured in shop metafields
2. No app URL is set in theme editor settings
3. The widget needs to load the full bundle script

---

## 4. Google Cloud Pub/Sub Configuration

### Production Topic Configuration Required:

**Staging:**
```
Topic: wolfpack-product-bundles-staging
Subscription: wolfpack-webhooks-staging
Project: light-quest-455608-i3
```

**Production Required:**
```
Topic: wolfpack-product-bundles
Subscription: wolfpack-webhooks-production (or similar)
Project: light-quest-455608-i3
```

**Action Items:**
- [ ] Create production Pub/Sub topic: `wolfpack-product-bundles`
- [ ] Create production subscription (update `PUBSUB_SUBSCRIPTION` env var)
- [ ] Verify service account has proper IAM permissions
- [ ] Update `shopify.app.toml` webhook URI if needed (currently set to `pubsub://light-quest-455608-i3:wolfpack-product-bundles`)

---

## 5. Database Migration

**Status:** No migration files exist (using `prisma db push`)

**Pre-Deployment Steps:**
```bash
# 1. Install dependencies (new packages added)
npm install

# 2. Generate Prisma client
npm run generate:prisma

# 3. Push schema to production database
npm run push:db
```

**New Database Tables Added:**
- `DesignSettings` - Design Control Panel settings
- `Shop` - Shop management for billing
- `Subscription` - Subscription billing
- `WebhookEvent` - Webhook idempotency tracking
- `ComplianceRecord` - GDPR compliance

---

## 6. Shopify App Configuration Review

### shopify.app.toml (Production)

**Current Production Config:**
```toml
client_id = "a383172f42c2ab283901a663d485a03d"
application_url = "https://wolfpack-product-bundle-app.onrender.com"
api_version = "2025-10" ✅

# Webhooks
uri = "pubsub://light-quest-455608-i3:wolfpack-product-bundles"
topics = [
  "app_subscriptions/update",
  "app_purchases_one_time/update",
  "products/update",
  "products/delete"
]
```

**Action Required:**
- [ ] Verify Pub/Sub URI topic name matches production topic
- [ ] Confirm all webhook topics are needed
- [ ] Test webhook delivery to Pub/Sub in production

---

## 7. New npm Dependencies

**New packages that will be installed:**
```json
"@google-cloud/pubsub": "^4.11.0"
"@tailwindcss/postcss": "^4.1.12"
"autoprefixer": "^10.4.21"
"crisp-sdk-web": "^1.0.25"
"dotenv": "^17.2.1"
"graphql-request": "^7.2.0"
"postcss": "^8.5.6"
"tailwindcss": "^4.1.12"
"tsx": "^4.19.2"
"@types/jest": "^29.5.12"
"jest": "^29.7.0"
```

**Removed:**
```json
"@prisma/extension-accelerate": "^2.0.1" (no longer used)
```

---

## 8. Pre-Merge Testing Checklist

### Environment Setup:
- [ ] Create production `.env` file with all correct values
- [ ] Verify `SHOPIFY_TEST_CHARGES=false`
- [ ] Confirm production database connection works
- [ ] Test Google Cloud Pub/Sub credentials

### Billing System:
- [ ] Test subscription creation flow in production mode
- [ ] Verify Shopify billing confirmation URL callback
- [ ] Test webhook processing for `app_subscriptions/update`
- [ ] Confirm Pub/Sub message delivery

### Extensions:
- [ ] Deploy cart transform function to production
- [ ] Deploy bundle builder theme extension to production
- [ ] Verify extension UIDs match production extensions
- [ ] Test theme editor deep linking

### Database:
- [ ] Run `npm run push:db` to sync schema
- [ ] Verify all tables created successfully
- [ ] Test metafield definitions creation in `afterAuth`

### Widget & Storefront:
- [ ] Test bundle widget loading on storefront
- [ ] Verify Storefront API token generation
- [ ] Test cart transform functionality
- [ ] Verify Design Control Panel CSS loading

### Webhooks:
- [ ] Test product update webhook → Pub/Sub → processing
- [ ] Test product delete webhook → Pub/Sub → processing
- [ ] Verify webhook idempotency (duplicate prevention)
- [ ] Test GDPR webhooks (customers/redact, shop/redact)

---

## 9. Deployment Steps

### Pre-Deploy:
1. Review and approve all code changes in PR
2. Ensure all environment variables are set in Render
3. Create production Pub/Sub topic and subscription
4. Backup production database

### Deploy:
1. Merge STAGING → main (PROD)
2. Render will auto-deploy
3. Run database migrations: `npm run push:db`
4. Deploy extensions: `shopify app deploy`
5. Start Pub/Sub worker as separate service on Render

### Post-Deploy:
1. Monitor logs for errors
2. Test critical flows (bundle creation, cart, checkout)
3. Verify webhook processing in Pub/Sub
4. Test billing flows end-to-end
5. Monitor Sentry/error tracking

---

## 10. Rollback Plan

If issues occur:
1. Revert to previous deployment in Render
2. Restore database backup if needed
3. Pause Pub/Sub worker
4. Investigate logs and fix issues
5. Re-deploy when ready

---

## 11. Key Files to Review Before Merge

**Configuration Files:**
- `.env` (create new for prod)
- `shopify.app.toml`
- `prisma/schema.prisma`

**Critical Service Files:**
- `app/services/billing.server.ts`
- `app/services/pubsub-worker.server.ts`
- `app/services/webhook-processor.server.ts`
- `app/services/cart-transform-service.server.ts`

**Extension Files:**
- `extensions/bundle-builder/shopify.extension.toml`
- `extensions/bundle-cart-transform-ts/shopify.extension.toml`

---

## Summary

### ✅ Safe to Merge (No Code Changes Needed):
- Extension IDs are dynamic (use env vars)
- No staging API keys hardcoded in app code
- Hardcoded URL in widget.js is already production URL

### ⚠️ Critical Actions Required:
1. Update `.env` with all production values
2. Set `SHOPIFY_TEST_CHARGES=false`
3. Create production Pub/Sub topic
4. Run database migrations
5. Deploy extensions to production
6. Test billing flows thoroughly

### 🚀 Major Features Being Deployed:
- Complete subscription billing system
- Design Control Panel with live preview
- Enhanced cart transform with bundle grouping
- Metafield standardization per Shopify best practices
- Google Cloud Pub/Sub webhook processing
- Storefront API integration

---

**Estimated Deployment Time:** 2-3 hours including testing
**Risk Level:** Medium-High (major billing system changes)
**Recommended:** Deploy during low-traffic period with monitoring
