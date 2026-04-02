# Issue: Pixel On By Default, Last-Touch, Track All Bundle Revenue

**Issue ID:** pixel-default-on-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 15:15

## Overview
Three related changes to the UTM pixel and attribution system:

### 1. Pixel not auto-activated on install
`afterAuth` in `shopify.server.ts` explicitly skips pixel activation with a comment.
New merchants get no tracking until they manually toggle it on the Analytics page.
Bundle revenue is silently lost from day one.

**Fix:** Auto-activate pixel in `afterAuth` so tracking is on by default.
Merchants opt-out via "Disable tracking" (toggle is already wired for this).

### 2. First-touch sessionStorage misses returning visitors
The pixel uses `browser.sessionStorage` with a first-touch guard (`if (!existing) store`).
Two problems:
- `sessionStorage` is cleared on tab close — a customer who clicks an ad, closes the
  browser, and returns next day has no UTMs tracked at all.
- First-touch ignores retargeting campaigns that closed the sale.

**Fix:** Switch to `browser.localStorage` (persists across sessions) and remove the
`if (!existing)` guard (last-touch: always overwrite with the most recent UTM click).

### 3. Bundle revenue not tracked for non-UTM checkouts
The pixel exits early (`if (!storedUtms) return`) when no UTMs are stored — so direct
traffic checkouts never reach the attribution API. The API also requires `utmSource` as a
mandatory field, rejecting any payload without it.

This means bundle revenue from organic/direct traffic is completely invisible on the
Analytics page even though the purchase was made through a bundle.

**Fix:**
- Pixel: always POST to the attribution API at checkout, passing null UTM fields when
  no UTMs are stored.
- API: remove `utmSource` from required validation — only `shopId` is required.

## Progress Log

### 2026-04-02 15:15 - Completed
- ✅ shopify.server.ts: Added `activateUtmPixel` import; replaced comment with actual
  auto-activation call in `afterAuth` (non-fatal, warns on failure)
- ✅ Pixel: switched `sessionStorage` → `localStorage`; removed first-touch guard
  (last-touch: always overwrite); removed `if (!storedUtms) return` so checkout
  always fires; UTM fields default to null when not stored
- ✅ API: removed `utmSource` from required validation; only `shopId` required now
- ✅ Lint: 0 errors
- ✅ Committed

## Files to Change
- `app/shopify.server.ts`
- `extensions/wolfpack-utm-pixel/src/index.ts`
- `app/routes/api/api.attribution.tsx`

## Phases Checklist
- [x] shopify.server.ts — auto-activate pixel in afterAuth
- [x] Pixel — localStorage, last-touch, always fire at checkout
- [x] API — remove utmSource requirement
- [x] Lint
- [x] Commit
