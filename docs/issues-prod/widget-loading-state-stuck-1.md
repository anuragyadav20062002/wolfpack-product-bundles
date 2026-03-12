# Issue: Product Page Widget Stuck in Loading State

**Issue ID:** widget-loading-state-stuck-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 20:30

## Overview

Product page widget permanently shows a dark loading overlay after init, even after page reload.

## Root Cause

Race condition between `requestAnimationFrame` in `showLoadingOverlay()` and the microtask-resolved `hideLoadingOverlay()` call during init.

`loadBundleData()` is `async` but does **no actual I/O** — it synchronously JSON-parses `dataset.bundleConfig`. When `await`-ed, it resolves in the microtask queue, which settles **before** the next animation frame.

Timeline:
1. `showLoadingOverlay()` queues `requestAnimationFrame(() => overlay.classList.add('is-visible'))`
2. `await loadBundleData()` resolves synchronously (microtask)
3. `hideLoadingOverlay()` removes `is-visible` — class was never added, `transitionend` never fires, overlay stays in DOM
4. rAF fires → adds `is-visible` → overlay turns opaque
5. Widget permanently stuck in loading state

## Fix

Replaced `requestAnimationFrame` with `overlay.offsetHeight` (forced synchronous reflow) in `showLoadingOverlay()`. This ensures the browser applies the initial `opacity: 0` before the class is added, without deferring to the next animation frame.

## Progress Log

### 2026-03-12 20:30 - Fixed

- ✅ `app/assets/bundle-widget-product-page.js` — replaced `requestAnimationFrame` with `offsetHeight` reflow
- ✅ `scripts/build-widget-bundles.js` — bumped `WIDGET_VERSION` from `1.3.2` → `1.3.3`
- ✅ Rebuilt: `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- Next: `shopify app deploy` to push updated JS to Shopify CDN

## Phases Checklist

- [x] Phase 1: Identify race condition
- [x] Phase 2: Fix and rebuild widget
- [ ] Phase 3: Deploy with shopify app deploy
