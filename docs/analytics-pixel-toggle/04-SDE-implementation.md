# SDE Implementation Plan: Analytics Pixel Toggle

## Overview

Three phases: service layer → action handler (with tests) → UI card on analytics page.
No DB migrations. Removes auto-activation from afterAuth.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/services/pixel-activation.test.ts` | getPixelStatus (3), deactivateUtmPixel (3), activateUtmPixel (2) | Pending |
| `tests/unit/routes/app.attribution.action.test.ts` | enable intent (3), disable intent (2), bad intent (1) | Pending |

## Phase 1: Service layer — getPixelStatus + deactivateUtmPixel

**Tests (Red):** `tests/unit/services/pixel-activation.test.ts`
**Implementation (Green):** `app/services/pixel-activation.server.ts`

## Phase 2: Action handler on attribution route

**Tests (Red):** `tests/unit/routes/app.attribution.action.test.ts`
**Implementation (Green):** `app/routes/app/app.attribution.tsx` (add action + loader pixel query)

## Phase 3: UI — status card + toggle

**No tests** (Polaris UI rendering — TDD exception)
**Implementation:** `app/routes/app/app.attribution.tsx` (add PixelStatusCard component)

## Phase 4: Remove afterAuth auto-activation

**No tests** (one-line config change)
**Implementation:** `app/shopify.server.ts`

## Build & Verification Checklist
- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without new errors
- [ ] Toggle shows correct initial state on analytics page
- [ ] Enable → success toast, toggle flips ON
- [ ] Disable → success toast, toggle flips OFF
- [ ] afterAuth no longer activates pixel on reinstall

## Rollback Notes
Revert `shopify.server.ts` to re-add auto-activation. Remove action handler from attribution route. Revert pixel-activation.server.ts.
