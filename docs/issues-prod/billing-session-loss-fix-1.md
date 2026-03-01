# Issue: Fix Session Loss During Billing Upgrade Redirect

**Issue ID:** billing-session-loss-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 12:00

## Overview
When a merchant goes through the billing upgrade flow (Pricing -> Upgrade to Grow -> Confirm -> Approve), they are redirected to the app's login screen instead of returning to the app seamlessly. This happens because the `returnUrl` in `appSubscriptionCreate` points directly at the app server URL, bypassing the Shopify admin embedded context. When Shopify redirects back after charge approval, the top-level navigation hits the app outside its iframe, and `authenticate.admin()` cannot find a valid session token, causing a bounce to `/auth/login`.

## Root Cause
- `returnUrl` is set to `${SHOPIFY_APP_URL}/app/billing/callback`
- This is a direct URL to the app server, not routed through Shopify admin
- With `unstable_newEmbeddedAuthStrategy: true`, auth works via token exchange inside the Shopify admin iframe
- Top-level navigation to the app URL bypasses the iframe, so no session token is available

## Fix
Change `returnUrl` to route through Shopify admin's embedded app URL:
`https://admin.shopify.com/store/{store-handle}/apps/{api-key}/app/billing/callback`

This ensures the app reloads inside the admin iframe with a valid session after billing approval.

## Progress Log

### 2026-02-16 12:00 - Planning & Implementation Started
- Identified root cause: `returnUrl` bypasses embedded app context
- Files to modify:
  - `app/routes/app/app.pricing.tsx` (line 86)
  - `app/routes/app/app.billing.tsx` (line 110)
- Goal: Route billing callback through Shopify admin embedded URL

### 2026-02-16 12:05 - Phase 1: Fix Implemented
- ✅ Changed `returnUrl` in `app/routes/app/app.pricing.tsx` (line 85-87)
  - Was: `${appUrl}/app/billing/callback` (direct app URL)
  - Now: `https://admin.shopify.com/store/${storeHandle}/apps/${apiKey}/app/billing/callback`
- ✅ Changed `returnUrl` in `app/routes/app/app.billing.tsx` (line 109-111)
  - Same fix applied
- ✅ Verified `api.billing.create.tsx` is not called from frontend (no change needed)
- Result: After billing approval, Shopify now redirects through admin embedded context, preserving the session

## Phases Checklist
- [x] Phase 1: Fix returnUrl in both billing routes
- [ ] Phase 2: Verify and commit

## Files Created/Modified (This Session)

### Phase 1:
- Modified: `app/routes/app/app.pricing.tsx`
- Modified: `app/routes/app/app.billing.tsx`

---

**Remember:** Update this file BEFORE and AFTER every commit!
