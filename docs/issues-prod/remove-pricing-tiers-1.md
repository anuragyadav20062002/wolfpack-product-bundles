# Issue: Remove Pricing Tiers from App
**Issue ID:** remove-pricing-tiers-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 01:00

## Overview
Remove Pricing Tiers entirely from the app UI. This includes:
- Step 05 "Pricing Tiers" from the bundle creation wizard (both create and configure routes)
- PricingTiersSection from the full-page bundle configure route
- tierConfig form submission and server-side processing
- stepsTiersWarning modal in the configure route

## Progress Log
### 2026-06-01 00:00 - Removing Pricing Tiers
- Removing step 05 from STEPS_META in create and configure wizard routes
- Removing tier state, fetcher, action handler, and UI block from configure wizard route
- Removing PricingTiersSection, tierConfig state, and stepsTiersWarning from full-page configure route
- Removing tierConfigData parsing and DB write from handlers.server.ts

## Related Documentation
N/A

## Phases Checklist
- [x] Remove step 05 from create wizard STEPS_META
- [x] Remove tier logic from configure wizard route
- [x] Remove PricingTiersSection from full-page configure route
- [x] Remove tierConfig from handlers.server.ts
