# Issue: Enable Subscription UI and Fix Layout

**Issue ID:** subscription-ui-enable-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-19
**Last Updated:** 2026-01-19 12:30

## Overview
Enable the subscription/payment UI that was previously disabled and fix the subscription cards layout to be responsive (horizontal on desktop, vertical on mobile).

## Tasks
1. Enable the subscription upgrade button in `app/routes/app.pricing.tsx` (line 283)
2. Remove "(Coming Soon)" from Grow plan name in `app/constants/plans.ts`
3. Fix subscription cards layout to be responsive
4. Research Shopify subscription billing setup

## Progress Log

### 2026-01-19 12:00 - Starting Implementation
- Identified disabled button at `app/routes/app.pricing.tsx:283`
- Identified "(Coming Soon)" label at `app/constants/plans.ts:40`
- Found layout uses `InlineStack` with fixed 50% widths which doesn't handle mobile responsiveness
- Will fix disabled state, plan name, and implement responsive layout

### 2026-01-19 12:15 - Enabled Subscription Button
- Changed `disabled={true}` to `disabled={isGrowPlan}` in `app/routes/app.pricing.tsx:282`
- Button now properly enables for free plan users and disables only when already on Grow plan

### 2026-01-19 12:17 - Updated Plan Name
- Removed "(Coming Soon)" from Grow plan name in `app/constants/plans.ts:40`
- Plan name now reads "Grow Plan" instead of "Grow Plan (Coming Soon)"

### 2026-01-19 12:25 - Fixed Responsive Layout
- Added `useBreakpoints` import from `@shopify/polaris`
- Added `const { mdDown } = useBreakpoints();` hook to detect mobile screens
- Implemented conditional rendering:
  - **Mobile (mdDown=true)**: Uses `BlockStack` to stack cards vertically
  - **Desktop (mdDown=false)**: Uses `InlineStack` with `Box width="50%"` for horizontal layout
- Cards now render properly on all screen sizes

### 2026-01-19 12:30 - Completed Research on Subscription Billing

## Files Changed
- `app/routes/app.pricing.tsx` - Enabled button, added responsive layout
- `app/constants/plans.ts` - Removed "(Coming Soon)" from plan name

## Shopify Subscription Billing Research

### How Subscription Billing Works

The app already has a fully implemented billing system in `app/services/billing.server.ts`.

#### Key Components:

1. **Creating Subscriptions** (`BillingService.createSubscription`)
   - Uses `appSubscriptionCreate` GraphQL mutation
   - Requires: `name`, `returnUrl`, `test`, `lineItems`
   - Returns `confirmationUrl` for merchant approval

2. **Confirming Subscriptions** (`BillingService.confirmSubscription`)
   - Called after merchant approves on Shopify's hosted page
   - Verifies subscription status with Shopify API
   - Updates local database with active status

3. **Canceling Subscriptions** (`BillingService.cancelSubscription`)
   - Uses `appSubscriptionCancel` mutation
   - Updates local database and clears shop's current subscription

#### Flow:
```
1. User clicks "Upgrade" -> app calls createSubscription()
2. App redirects to Shopify's confirmationUrl
3. Merchant approves/declines on Shopify's page
4. Shopify redirects to returnUrl (app/billing/callback)
5. App calls confirmSubscription() to verify and activate
```

#### Environment Configuration:
- `SHOPIFY_TEST_CHARGES`: Set to "false" for production (real charges)
- Default is true (test charges for development)

#### Required Webhooks:
- `APP_SUBSCRIPTIONS_UPDATE` - Monitor subscription status changes
- `APP_PURCHASES_ONE_TIME_UPDATE` - For one-time purchases
- `APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT` - Usage billing alerts

#### API Endpoints in This App:
- `/app/billing` - Main billing management page
- `/app/billing/callback` - Callback after Shopify approval
- `/app/pricing` - Pricing comparison and upgrade page
- `/api/billing/status` - GET subscription status
- `/api/billing/create` - POST create subscription
- `/api/billing/confirm` - GET confirm subscription
- `/api/billing/cancel` - POST cancel subscription

#### Official Documentation:
- Overview: https://shopify.dev/docs/apps/launch/billing
- Time-based: https://shopify.dev/docs/apps/launch/billing/subscription-billing/create-time-based-subscriptions
- Usage-based: https://shopify.dev/docs/apps/launch/billing/subscription-billing/create-usage-based-subscriptions
- API Reference: https://shopify.dev/docs/api/admin-graphql/latest/mutations/appSubscriptionCreate

## Related Documentation
- `docs/shopify_subscription_billing_guide.md`
- `docs/shopify_subscription_architecture_guide.md`
- `docs/deployment_guide_subscription_billing.md`

## Phases Checklist
- [x] Phase 1: Enable subscription button
- [x] Phase 2: Update plan name
- [x] Phase 3: Fix responsive layout
- [x] Phase 4: Research subscription billing setup
