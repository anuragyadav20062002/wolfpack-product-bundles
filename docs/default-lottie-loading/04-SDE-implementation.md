# SDE Implementation Plan: Default Lottie Loading Animation

## Overview
Replace the CSS spinner fallback with an embedded SVG+CSS three-dot pulse animation when merchants haven't uploaded a custom loading GIF. The Lottie JSON file is stored as a design reference; the widget ships a pre-converted inline SVG with CSS keyframes.

## Phase 1: Create Default Animation Module
- Step 1.1: Create `app/assets/widgets/shared/default-loading-animation.js` with `createDefaultLoadingAnimation()` function
  - Injects CSS `@keyframes bundle-dot-pulse` idempotently via `<style>` tag
  - Returns a `<div>` wrapper containing an SVG with three animated circles
- Step 1.2: Create `app/assets/widgets/shared/default-loading-animation.json` as Lottie source reference

## Phase 2: Update Build Script
- Step 2.1: Add `default-loading-animation.js` to `SHARED_MODULES` array in `scripts/build-widget-bundles.js`

## Phase 3: Update Widget Overlay Logic
- Step 3.1: In `app/assets/bundle-widget-product-page.js` `showLoadingOverlay()`, replace spinner div with `createDefaultLoadingAnimation()` call
- Step 3.2: In `app/assets/bundle-widget-full-page.js` `showLoadingOverlay()`, replace spinner div with `createDefaultLoadingAnimation()` call

## Phase 4: Update CSS
- Step 4.1: In `extensions/bundle-builder/assets/bundle-widget.css`, replace `.bundle-loading-overlay__spinner` styles with `.bundle-loading-overlay__default-animation` styles

## Phase 5: Build & Verify
- Step 5.1: Run `npm run build:widgets` — both bundles build successfully
- Step 5.2: Verify `createDefaultLoadingAnimation` present in both bundled files
- Step 5.3: Verify old `.bundle-loading-overlay__spinner` removed from all assets

## Build & Verification Checklist
- [x] Widget bundles build without errors (`npm run build:widgets`)
- [x] `createDefaultLoadingAnimation` present in both bundled IIFE files
- [x] Old spinner class `.bundle-loading-overlay__spinner` removed from CSS and bundled JS
- [x] Bundle sizes unchanged (~196KB full-page, ~119KB product-page — only ~1KB added for animation code)
- [x] Backward-compatible: bundles with custom `loadingGif` URL are unaffected

## Files Changed
| File | Change |
|------|--------|
| `app/assets/widgets/shared/default-loading-animation.js` | **NEW** — SVG animation factory |
| `app/assets/widgets/shared/default-loading-animation.json` | **NEW** — Lottie JSON design source |
| `scripts/build-widget-bundles.js` | Added module to `SHARED_MODULES` |
| `app/assets/bundle-widget-product-page.js` | Replaced spinner with `createDefaultLoadingAnimation()` |
| `app/assets/bundle-widget-full-page.js` | Replaced spinner with `createDefaultLoadingAnimation()` |
| `extensions/bundle-builder/assets/bundle-widget.css` | Replaced spinner styles with animation styles |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Rebuilt output |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | Rebuilt output |

## Rollback Notes
To revert: restore the old `showLoadingOverlay()` with the spinner `<div>`, restore `.bundle-loading-overlay__spinner` CSS, remove `default-loading-animation.js` from `SHARED_MODULES`, and rebuild widgets.
