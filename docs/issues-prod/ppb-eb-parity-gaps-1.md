# Issue: PPB EB Parity Gaps — Bundle Visibility Nav + Free Gift Fields

**Issue ID:** ppb-eb-parity-gaps-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-19 00:00

## Overview

Three parity gaps identified via Chrome DevTools EB audit:

1. **Bundle Visibility not in nav** — section is fully built (lines 2402–2532) but missing from `bundleSetupItems`. `handlePlaceWidget` is also defined but never called from the UI.
2. **Free Gift: "Add On" and "Replace" text fields missing** — EB shows 4 fields (Step Name, Add On, Step Title, Replace); WPB only has 2 (Step Name, Step Title).
3. **"Take your bundle live" left column card** — EB has Place on theme + Place Widget buttons in a left-column card. WPB modal exists but no left-column entry point.

## Progress Log

### 2026-05-19 00:00 - Starting Gap 1: Bundle Visibility nav
- Add `bundle_visibility` to `bundleSetupItems` between Discount & Pricing and Bundle Settings
- Add "Pending" badge when `!appEmbedEnabled || !upsellWidgetEnabled`
- Wire "Place Widget" button in the Bundle Visibility section

## Files to Change
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [ ] Gap 1: Bundle Visibility in nav + Pending badge + Place Widget button
- [ ] Gap 2: Free Gift "Add On" + "Replace" text fields
- [ ] Gap 3: "Take your bundle live" left column card
- [ ] E2E test in Chrome after each gap
