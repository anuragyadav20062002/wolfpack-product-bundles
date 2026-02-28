# Issue: Fix Design Defaults Divergence & Migrate Error Constants

**Issue ID:** design-defaults-error-constants-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 12:00

## Overview
Two sub-tasks from Phase 2 constants centralization:
1. Fix design defaults divergence between inline `getDefaultSettings()` in `useDesignControlPanelState.ts` hook and canonical `defaultSettings.ts`
2. Migrate inline error message strings to use centralized `ERROR_MESSAGES` from `app/constants/errors.ts`

## Progress Log

### 2026-03-01 12:00 - Completed Implementation

#### Design Defaults Divergence Fix
- Removed 165-line inline `getDefaultSettings()` from `useDesignControlPanelState.ts` (lines 46-212)
- Now imports `getDefaultSettings` from canonical `../components/design-control-panel/config/defaultSettings`
- Removed orphaned `BundleType` type export from `defaultSettings.ts` and `config/index.ts` barrel
- Key divergences eliminated:
  - `conditionsTextColor`: was `#FFFFFF` (white/invisible), now `#000000` (black)
  - `productCardFontSize`: was 16/18, now 20/20 (canonical)
  - `productCardFontWeight`: was 400/500, now 600/600 (canonical)
  - `productCardPadding`: was 12, now 0 (canonical)
  - `productCardBorderColor`: was `rgba(0,0,0,0.08)`, now `#E5E7EB` (canonical)
  - `buttonBgColor`: was `#7132FF`/`#000000`, now `#FF9000` (canonical orange)
  - `quantitySelectorBgColor`: was `#7132FF`/`#000000`, now `#5f5d5d` (canonical)
  - Missing promo banner settings now included from canonical defaults

#### Error Constants Migration
- Migrated 13 files to use `ERROR_MESSAGES` from `app/constants/errors.ts`
- Replaced inline string literals for: BUNDLE_NOT_FOUND, BUNDLE_ID_REQUIRED, AUTH_REQUIRED, UNKNOWN_ACTION, SHOP_NOT_FOUND, FAILED_TO_SELECT_PRODUCTS, FAILED_TO_SYNC_PRODUCT, FAILED_TO_SELECT_BUNDLE_PRODUCT, CANNOT_DELETE_LAST_STEP, FAILED_TO_SELECT_COLLECTIONS, FAILED_TO_SAVE_CONFIGURATION

### Files Modified (13)
- `app/hooks/useDesignControlPanelState.ts` — Removed inline defaults, import from canonical source
- `app/components/design-control-panel/config/defaultSettings.ts` — Removed orphaned `BundleType` type export
- `app/components/design-control-panel/config/index.ts` — Removed `BundleType` re-export
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — ERROR_MESSAGES migration
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — ERROR_MESSAGES migration
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — ERROR_MESSAGES migration
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — ERROR_MESSAGES migration
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — ERROR_MESSAGES migration
- `app/routes/api/api.bundle.$bundleId[.]json.tsx` — ERROR_MESSAGES migration
- `app/routes/api/api.bundles.json.tsx` — ERROR_MESSAGES migration
- `app/services/billing.server.ts` — ERROR_MESSAGES migration
- `app/services/webhooks/handlers/subscription.server.ts` — ERROR_MESSAGES migration
- `app/hooks/useBundleSteps.ts` — ERROR_MESSAGES migration

## Verification
- ESLint: 0 errors (1693 pre-existing warnings)
- TypeScript: No new errors introduced (pre-existing errors unchanged)

## Phases Checklist
- [x] Fix design defaults divergence
- [x] Migrate error message constants
- [x] Lint and verify
- [x] Commit
