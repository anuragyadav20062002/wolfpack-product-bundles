# Issue: DCP Paywall Enforcement + Owner Grant API

**Issue ID:** dcp-paywall-owner-grant-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 00:00

## Overview

The Design Control Panel (DCP) is listed as a Grow plan exclusive feature on the Pricing page, but the route `/app/design-control-panel` is fully accessible to Free plan users with no paywall enforcement. This is a direct revenue leak.

This issue covers:
1. **Paywall enforcement on the DCP route** — gated behind an active Grow subscription, skipped on SIT
2. **Owner-only grant API** — an internal endpoint that only the app owner can call to grant a merchant the Grow plan, enabling early/free invite campaigns via email

## Phases Checklist
- [ ] Phase 1: Research existing subscription/billing architecture
- [ ] Phase 2: Implement environment-aware plan gate middleware
- [ ] Phase 3: Add DCP paywall UI (Polaris upsell banner / upgrade prompt)
- [ ] Phase 4: Implement owner-only grant API endpoint
- [ ] Phase 5: Validate grant API security (owner secret header)
- [ ] Phase 6: Test on SIT (gate should NOT fire), test on PROD (gate should fire for Free users)

## Progress Log

### 2026-03-26 - Completed implementation
- ✅ Enabled `design_control_panel` in `GROW_ONLY_FEATURES` (plans.ts)
- ✅ Added `isFeatureGatingEnabled()` — reads `ENFORCE_PLAN_GATES=true` env var
- ✅ Updated `BillingService.isFeatureAvailable()` to skip gates when env var not set (SIT transparent)
- ✅ Added `BillingService.grantGrowPlan()` — creates active Grow subscription in DB with no Shopify billing charge
- ✅ Added `requireOwnerSecret()` guard to `auth-guards.server.ts` (uses `OWNER_API_SECRET` env var, constant-time compare)
- ✅ Created `POST /api/admin/grant-plan` endpoint — owner-only, grants Grow to any shopDomain
- ✅ DCP loader now checks plan gate and returns `isPaywalled: boolean`
- ✅ DCP UI shows Polaris `Banner` (warning tone) with "Upgrade to Grow" CTA when paywalled
- ✅ Customize buttons show "Upgrade to Customize" and link to /app/pricing when paywalled
- ✅ Custom CSS section visually dimmed via `opacity: 0.5` + `pointer-events: none` when paywalled
- Files modified: `app/constants/plans.ts`, `app/services/billing.server.ts`, `app/lib/auth-guards.server.ts`, `app/routes/app/app.design-control-panel/route.tsx`
- Files created: `app/routes/api/api.admin.grant-plan.tsx`, `docs/ux-gap-analysis-2026-03-26.md`
- New env vars required on PROD: `ENFORCE_PLAN_GATES=true`, `OWNER_API_SECRET=<secret>`
- SIT: leave both unset — paywall will not fire

## Related Documentation
- `docs/ux-gap-analysis-2026-03-26.md` — GAP-19 (DCP paywall), GAP-20 (analytics paywall)
- `docs/shopify_subscription_billing_guide.md`
- `docs/shopify_subscription_architecture_guide.md`
- `docs/deployment_guide_subscription_billing.md`
