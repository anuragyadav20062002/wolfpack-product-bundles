# Subscription Billing Deployment Guide

## Overview
This guide covers deploying the complete subscription billing system for Wolfpack Product Bundles app to a test environment on Render.

---

## ✅ Implementation Summary

### Backend Services (Complete)
- ✅ Database models (Shop, Subscription, WebhookEvent)
- ✅ Billing service with Shopify API integration
- ✅ Subscription guard for feature gating
- ✅ Webhook processor with idempotent handling
- ✅ Pub/Sub worker for webhook delivery
- ✅ API routes for billing operations
- ✅ Google Cloud Pub/Sub integration

### UI Components (Complete)
- ✅ Billing page with plan cards (`/app/billing`)
- ✅ Upgrade prompt banner on bundles page
- ✅ Current plan display and usage tracking
- ✅ Upgrade and cancel subscription flows

---

## 📋 Pre-Deployment Checklist

### 1. Google Cloud Pub/Sub Setup (Already Done ✓)
- [x] Created Pub/Sub topic: `wolfpack-product-bundles`
- [x] Created subscription: `wolfpack-webhooks-subscription`
- [x] Granted Shopify permissions
- [x] Created service account
- [x] Downloaded service account credentials
- [x] Populated .env file

### 2. Render Test Environment Setup

#### A. Create PostgreSQL Database (if not exists)
1. Go to Render Dashboard → New → PostgreSQL
2. Name: `wolfpack-test-db`
3. Instance Type: Starter
4. Save the connection details

#### B. Create Main Web Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Branch: `feature/merchant-subscriptions` (or your test branch)
4. Name: `wolfpack-test-app`
5. Build Command:
   ```bash
   npm install && npm run build && npx prisma generate
   ```
6. Start Command:
   ```bash
   npm run start
   ```
7. Instance Type: Starter

**Environment Variables:**
```bash
# Shopify Configuration
SHOPIFY_API_KEY=<your-test-app-key>
SHOPIFY_API_SECRET=<your-test-app-secret>
SHOPIFY_APP_URL=https://wolfpack-test-app.onrender.com
SCOPES=read_content,read_product_listings,read_products,read_themes,write_themes,write_cart_transforms,write_discounts,write_products,unauthenticated_read_product_listings,unauthenticated_read_content,write_subscriptions

# Database
DATABASE_URL=<postgres-external-url-from-render>
DIRECT_URL=<postgres-internal-url-from-render>

# Node Environment
NODE_ENV=production
```

#### C. Create Pub/Sub Worker Service
1. Go to Render Dashboard → New → Background Worker
2. Connect your GitHub repo
3. Branch: Same as web service
4. Name: `wolfpack-test-pubsub-worker`
5. Build Command:
   ```bash
   npm install && npx prisma generate
   ```
6. Start Command:
   ```bash
   npm run pubsub-worker
   ```
7. Instance Type: Starter

**Environment Variables:**
```bash
# Database (same as web service)
DATABASE_URL=<postgres-external-url-from-render>
DIRECT_URL=<postgres-internal-url-from-render>

# Google Cloud Pub/Sub
GOOGLE_CLOUD_PROJECT=light-quest-455608-i3
PUBSUB_SUBSCRIPTION=wolfpack-webhooks-subscription
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste-entire-json-key-file>

# Node Environment
NODE_ENV=production
```

---

## 🚀 Deployment Steps

### Step 1: Push Code to Test Branch
```bash
# Ensure you're on the correct branch
git checkout feature/merchant-subscriptions

# Add all changes
git add .

# Commit
git commit -m "feat: Add subscription billing system"

# Push to GitHub
git push origin feature/merchant-subscriptions
```

### Step 2: Deploy Services on Render
Both services (Web and Worker) should auto-deploy when you push to the branch.

Monitor deployment logs:
- Web Service: Check build logs for any errors
- Worker Service: Should start listening for Pub/Sub messages

### Step 3: Run Database Migration
After web service is deployed:

**Option A: Via Render Shell**
1. Go to Web Service → Shell tab
2. Run:
   ```bash
   npx prisma migrate dev --name add_subscription_billing
   ```

**Option B: Run Locally (Recommended for Test)**
```bash
# Set DATABASE_URL to your test database
export DATABASE_URL="<postgres-url-from-render>"

# Run migration
npx prisma migrate dev --name add_subscription_billing

# Or use db push for quick testing
npx prisma db push
```

### Step 4: Sync Shopify Configuration
```bash
# Authenticate with test store
shopify app dev

# Then in another terminal, push config
shopify app config push
```

This will:
- Register all webhooks with Pub/Sub delivery
- Push metafield definitions
- Update app scopes

### Step 5: Verify Webhook Registration
1. Go to Shopify Partners Dashboard
2. Select your test app
3. API access → Webhooks
4. Verify these webhooks are registered with Pub/Sub:
   - `app/subscriptions_update`
   - `products/update`
   - `products/delete`
   - Compliance webhooks

---

## 🧪 Testing the System

### Test 1: Free Plan (Default)
1. Install app on test store
2. Check logs: Shop should be created with free plan
3. Go to `/app/bundles/cart-transform`
4. Create 1-2 bundles (should work)
5. Try to create 4th bundle (should be blocked with error)
6. Verify upgrade banner appears

### Test 2: Upgrade to Grow Plan
1. Click "Upgrade" button or go to `/app/billing`
2. Click "Upgrade to Grow" on Grow plan card
3. Should redirect to Shopify billing approval
4. Approve the charge (test charge, won't bill)
5. Should redirect back to app
6. Verify plan is now "Grow"
7. Verify bundle limit is now 20
8. Create additional bundles (should work)

### Test 3: Webhook Processing
1. Create a product that's used in a bundle
2. Archive the product
3. Check Pub/Sub worker logs
4. Verify bundle status changed to draft
5. Check WebhookEvent table for processed webhook

### Test 4: Subscription Cancellation
1. Go to `/app/billing`
2. Click "Cancel Subscription"
3. Confirm cancellation
4. Verify downgrade to free plan
5. If you had >3 bundles, verify excess were archived

### Test 5: App Uninstall
1. Uninstall app from test store
2. Check logs for subscription cancellation
3. Verify shop marked as uninstalled in database

---

## 📊 Monitoring and Debugging

### Logs to Monitor

**Web Service Logs:**
```bash
# Render Dashboard → Web Service → Logs
# Watch for:
- "Shop created with free plan"
- "Subscription created successfully"
- "Bundle creation blocked by subscription limit"
```

**Pub/Sub Worker Logs:**
```bash
# Render Dashboard → Worker Service → Logs
# Watch for:
- "Pub/Sub worker started"
- "Processing Pub/Sub message"
- "Message processed successfully"
- "Subscription updated to {status}"
```

**Google Cloud Pub/Sub Monitoring:**
```bash
# Check message flow
gcloud pubsub subscriptions pull wolfpack-webhooks-subscription \
  --limit=5 --project=light-quest-455608-i3

# View logs
gcloud logging read "resource.type=pubsub_subscription" \
  --project=light-quest-455608-i3 --limit=20
```

### Common Issues and Solutions

**Issue 1: Pub/Sub Worker Not Receiving Messages**
- Check GOOGLE_APPLICATION_CREDENTIALS_JSON is set correctly
- Verify service account has Subscriber role
- Check subscription name matches exactly
- Ensure worker service is running (not crashed)

**Issue 2: Webhooks Not Registered**
- Run `shopify app config push` again
- Verify write_subscriptions scope in shopify.app.toml
- Check Shopify Partners Dashboard → API access

**Issue 3: Database Connection Errors**
- Verify DATABASE_URL and DIRECT_URL are set
- Check database is running on Render
- Ensure Prisma client was generated

**Issue 4: Subscription Creation Fails**
- Check admin API token has billing permissions
- Verify returnUrl is correct (must be HTTPS)
- Check Shopify admin logs for errors

---

## 🔐 Security Checklist

- [x] Service account credentials stored as environment variable
- [x] No credentials in git repository
- [x] Test charges enabled in development
- [x] Idempotent webhook processing
- [x] Bundle limit enforcement on server-side
- [x] GDPR compliance webhooks handled

---

## 📈 Production Deployment (After Testing)

Once testing is successful:

1. **Create Production Services**
   - New production database
   - New production web service
   - New production pub/sub worker
   - Use production Shopify app credentials
   - Set `test: false` for real charges

2. **Run Production Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Update shopify.app.toml**
   - Update application_url to production URL
   - Update redirect_urls

4. **Push Config to Production App**
   ```bash
   shopify app config push
   ```

5. **Monitor First Week**
   - Watch subscription creation rate
   - Monitor webhook processing
   - Check for any failed charges
   - Review error logs daily

---

## 🆘 Support Resources

- **Google Cloud Pub/Sub**: https://cloud.google.com/pubsub/docs
- **Shopify Billing API**: https://shopify.dev/docs/apps/build/billing
- **Render Docs**: https://render.com/docs
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## 📝 Notes

- Test charges don't actually bill merchants
- Free plan is automatic for all new installs
- Webhook processing is asynchronous (may take a few seconds)
- Bundle archiving on downgrade is automatic
- All operations are logged for debugging

---

## ✅ Final Checklist Before Production

- [ ] All tests passing in test environment
- [ ] Webhooks processing correctly
- [ ] Subscription upgrade/downgrade works
- [ ] Bundle limits enforced
- [ ] UI displays correct plan information
- [ ] Upgrade banner shows appropriately
- [ ] Cancellation flow works
- [ ] Uninstall cleans up properly
- [ ] No errors in logs for 24+ hours
- [ ] Load testing completed (if high volume expected)
