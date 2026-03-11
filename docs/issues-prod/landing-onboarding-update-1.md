# Issue: Restore Landing Screen + Update Onboarding Page

**Issue ID:** landing-onboarding-update-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Overview
Two related changes:

1. **Restore the welcome landing screen**: `app._index.tsx` was changed in a previous
   commit (homepage-login-redirect-2) to immediately redirect to dashboard. The user
   wants every user (new or existing) to see the "Welcome to Wolfpack: Product Bundles"
   landing page when they open the app. New users' CTA goes to onboarding; existing
   users also have a "Go to Dashboard" escape hatch.

2. **Update onboarding page**: The current `app.onboarding.tsx` has 4 generic steps
   written before many features existed. It needs to be rewritten to reflect the current
   feature set (Design Control Panel, UTM analytics, full-page bundles, mix & match,
   smart pricing, etc.)

## Files to Modify
- `app/routes/app/app._index.tsx` — Show landing screen instead of redirecting
- `app/styles/routes/app-index.module.css` — Full landing CSS
- `app/routes/app/app.onboarding.tsx` — Rewritten 4-step onboarding wizard

## Progress Log

### 2026-03-11 - Completed
- ✅ Landing screen: replaced immediate redirect with full welcome page
  - Dark gradient hero (purple/navy): "Welcome to Wolfpack: Product Bundles"
  - 6-feature grid: Product Page Bundles, Full Page Bundles, Design Control Panel,
    UTM Analytics, Smart Discounts, Mix & Match Steps
  - Primary CTA "Get Started" → /app/onboarding
  - Secondary CTA "Go to Dashboard" → /app/dashboard
  - Footer strip with Support / Docs / View Plans links
- ✅ Onboarding page: full rewrite with current feature set
  - Step 1: Create Bundle — type cards (Product Page vs Full Page), feature badges
  - Step 2: Install Widget — theme editor deep link (preserved), placement options
  - Step 3: Customize Design — DCP overview with feature badges, opens DCP
  - Step 4: Track & Go Live — UTM analytics, how-it-works Banner, go to Dashboard
  - Dark branded hero header with progress counter
  - Step badges show ✓ when completed; "Current" badge on active step
- ✅ CSS module: full redesign of app-index.module.css
  - Shared hero/feature styles between landing and onboarding
- ✅ ESLint: 0 errors
- Files: app._index.tsx, app.onboarding.tsx, app-index.module.css

## Phases Checklist
- [x] Implement landing screen (app._index.tsx + CSS module)
- [x] Rewrite onboarding page (app.onboarding.tsx)
- [x] Lint + commit
