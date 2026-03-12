# Issue: Analytics Pixel Toggle

**Issue ID:** analytics-pixel-toggle-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Overview

Add a toggle on the Analytics page that lets merchants explicitly enable/disable UTM pixel tracking. Shows live pixel state, calls activation/deactivation API, and displays toast feedback. Removes automatic pixel activation from afterAuth.

## Related Documentation

- `docs/analytics-pixel-toggle/00-BR.md`
- `docs/analytics-pixel-toggle/02-PO-requirements.md`
- `docs/analytics-pixel-toggle/03-architecture.md`
- `docs/analytics-pixel-toggle/04-SDE-implementation.md`

## Progress Log

### 2026-03-13 - Starting implementation

- Phase 1: Service layer (getPixelStatus + deactivateUtmPixel) + tests
- Phase 2: Action handler on attribution route + tests
- Phase 3: UI status card + toggle
- Phase 4: Remove afterAuth auto-activation

## Progress Log

### 2026-03-13 - All phases complete

- ✅ Phase 1: Added `getPixelStatus()` + `deactivateUtmPixel()` to `pixel-activation.server.ts`; 8 tests
- ✅ Phase 2: Added `action` handler to `app.attribution.tsx`; 6 tests; CSS module mock added to jest config
- ✅ Phase 3: `PixelStatusCard` component added to analytics page (empty + data states); Polaris `Card`, `Badge`, `Button`; `useFetcher` + `shopify.toast.show()` for non-blocking toggle with toast feedback
- ✅ Phase 4: Removed `activateUtmPixel()` from `afterAuth` — merchants now opt in via toggle
- 386 tests, 0 failures, 0 lint errors

## Phases Checklist

- [x] Phase 1: Service layer + tests
- [x] Phase 2: Action handler + tests
- [x] Phase 3: UI status card
- [x] Phase 4: Remove afterAuth auto-activation
