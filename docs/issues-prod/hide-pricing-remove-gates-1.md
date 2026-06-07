# Issue: Hide Pricing Page and Remove Pricing Gates
**Issue ID:** hide-pricing-remove-gates-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-08
**Last Updated:** 2026-06-08 10:30

## Overview
Hide the pricing page from navigation and remove all subscription/plan enforcement gates so all merchants have unrestricted access to all features.

## Scope
- Remove pricing nav link from app shell (`app.tsx`)
- Remove "Upgrade" / pricing navigate buttons from dashboard index
- Remove `SubscriptionGuard.enforceBundleLimit` calls from cart-transform and dashboard handlers (allow all bundle creation)
- Remove `UpgradePromptBanner` renders from dashboard and cart-transform pages
- Remove billing redirect-to-pricing in `app.billing.tsx`

## Files to Modify
- `app/routes/app/app.tsx` — remove pricing nav `<a>` tag
- `app/routes/app/app._index.tsx` — remove upgrade/pricing navigate button
- `app/routes/app/app.billing.tsx` — remove navigate to pricing
- `app/routes/app/app.bundles.cart-transform.tsx` — remove enforceBundleLimit + UpgradePromptBanner
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — remove enforceBundleLimit calls
- `app/routes/app/app.dashboard/route.tsx` — remove UpgradePromptBanner

## Progress Log
### 2026-06-08 10:00 - Planning Complete
- ✅ Identified all pricing gates and nav references
- Next: Implement changes

### 2026-06-08 10:30 - All Phases Completed
- ✅ `app/routes/app/app.tsx` — removed pricing nav `<a>` tag
- ✅ `app/routes/app/app._index.tsx` — removed "View Plans" footer button
- ✅ `app/routes/app/app.bundles.cart-transform.tsx` — removed SubscriptionGuard import, both enforceBundleLimit calls, UpgradePromptBanner import and render
- ✅ `app/routes/app/app.dashboard/handlers/handlers.server.ts` — removed SubscriptionGuard import and both enforceBundleLimit calls (clone + create)
- ✅ `app/routes/app/app.dashboard/route.tsx` — removed UpgradePromptBanner import and render
- ✅ `app/routes/app/app.billing.tsx` — removed handleViewPricing callback, UpgradeCTACard import and render, "View Plans" button, onRetry changed to dismissErrorBanner
- Result: No plan gates remain; pricing page hidden from nav; all merchants have unrestricted bundle creation

## Phases Checklist
- [x] Phase 1: Remove nav link and index button ✅
- [x] Phase 2: Remove enforceBundleLimit gates ✅
- [x] Phase 3: Remove UpgradePromptBanner renders ✅
- [x] Phase 4: Remove billing→pricing redirect ✅
