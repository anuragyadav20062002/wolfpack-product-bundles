# Issue: Phase 1 Competitive Parity Improvements

**Issue ID:** phase1-competitive-parity-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-24
**Last Updated:** 2026-04-24 19:45

## Overview

Implement Phase 1 quick-win competitive gaps identified in the Wolfpack vs EB gap analysis
(docs/competitor-analysis/13-wolfpack-gap-analysis-phases.md).

Items:
1. Unlock DCP on free plan + update pricing model to revenue-based thresholds
2. Gamified setup score on dashboard (replace BundleSetupInstructions)
3. Bundle views event tracking (widget → API → analytics page)
4. Bundle Settings panel per bundle (compare-at price, cart redirect, cart messaging, etc.)
5. Analytics CSV export (respects date range filter)
6. Pricing page updates (DESCOPED)

## Progress Log

### 2026-04-24 18:16 - Starting all Phase 1 items
- Crawled EB app live for pricing model (revenue-based: $0/<$500/mo, $49/<$5k, $149/<$20k, $399/<$75k)
- Crawled EB dashboard (gamified score lives as "2-Step Checklist" concept; will build scored version)
- Crawled EB bundle settings panel for toggle inventory
- Read all relevant source files: DCP route, plans constants, pricing-data, dashboard loader, analytics route, schema
- No architectural changes needed for items 1, 2, 5
- Items 3 and 4 require new Prisma migration

## Related Documentation
- docs/competitor-analysis/13-wolfpack-gap-analysis-phases.md
- docs/competitor-analysis/08-pricing.md
- docs/competitor-analysis/03-bundle-editor.md

## Phases Checklist
- [x] Item 1: DCP unlock + pricing model (plans.ts, pricing-data.ts, GrowPlanCard, FreePlanCard)
- [x] Item 2: Gamified score component + dashboard loader data
- [ ] Item 3: View tracking API + widget instrumentation + analytics display
- [ ] Item 4: Bundle settings Prisma migration + editor tab + widget reads
- [ ] Item 5: Analytics CSV export action

### 2026-04-24 19:45 - Completed Item 1 + Item 2

**Item 1 — DCP Unlock + Revenue-Based Pricing:**
- ✅ `app/constants/plans.ts`: Removed DCP from GROW_ONLY_FEATURES; added DCP to free plan features
- ✅ `app/constants/pricing-data.ts`: Added revenue threshold row; changed DCP row to free: true; updated VALUE_PROPS and GROW_PLAN_BENEFITS
- ✅ `app/components/billing/FreePlanCard.tsx`: Updated subtitle to revenue-based framing
- ✅ `app/components/billing/GrowPlanCard.tsx`: Updated subtitle to revenue-based framing
- ✅ `app/routes/app/app.design-control-panel/route.tsx`: Hardcoded isPaywalled: false; removed BillingService call

**Item 2 — Gamified Setup Score:**
- ✅ `app/routes/app/app.dashboard/route.tsx`: Added setupScore queries (bundlesExist, hasProductsAdded, hasDiscount, hasActiveBundleOnStore, hasDcpConfigured) to loader; replaced BundleSetupInstructions import with SetupScoreCard; replaced both UI usages
- ✅ `app/components/SetupScoreCard.tsx`: New component — SVG circular ring (score/100), 5-step checklist with green checks / numbered circles, +20 pts badges, CTA button when no bundles

Next: Item 3 — Bundle view tracking
