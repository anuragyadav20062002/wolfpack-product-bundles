# Issue: Simplify Widget Installation UI in Configure Routes

**Issue ID:** simplify-widget-installation-ui-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-17
**Last Updated:** 2026-02-17 12:30

## Overview
Replace the complex widget installation banner system (warning banners, polling, localStorage tracking, state machine) with a simple "Open in Theme Editor" button. The metafield flags backing this UI were removed, and `getBundleInstallationContext()` now always returns `widgetInstalled: true`, making all this UI dead code.

## Progress Log

### 2026-02-17 12:00 - Starting Implementation
- Removing widget installation banners, polling, and status tracking from both configure routes
- Simplifying loaders to remove `getBundleInstallationContext()` and `generateProductBundleInstallationLink()` calls
- Adding simple "Open in Theme Editor" button to both routes
- Cleaning up types, hooks, and service layer
- Files to modify:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/types.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts`
  - `app/hooks/useBundleConfigurationState.ts`
  - `app/services/widget-installation/widget-installation-core.server.ts`
  - `app/services/widget-installation/types.ts`
  - `app/services/widget-installation/index.ts`

### 2026-02-17 12:30 - Completed Implementation
- Removed `WidgetInstallationInfo` type and `widgetInstallation` from `LoaderData` in both types files
- Removed `isCheckingWidgetStatus`, `widgetInstallationLink`, `widgetInstallationInitiated` state from `useBundleConfigurationState` hook
- Removed `getBundleInstallationContext()`, `shouldShowInstallationPrompt()`, and `BundleInstallationContext` type from service layer
- Simplified both route loaders: removed `getBundleInstallationContext()` and deep link generation calls
- Removed all widget installation banners (install_widget, add_bundle, configured, auto-placement) from both routes
- Removed polling useEffects, window focus revalidation, localStorage tracking, handleDismissBanner, handlePlaceWidgetNow
- Removed Widget Installation Modal from full-page route
- Added "Open in Theme Editor" as secondary action on both routes
- For full-page: "Add to Storefront" as primary action (when no page exists) which creates a Shopify page
- For product-page: simple deep link to theme editor with `addAppBlockId` param
- Removed unused `Banner` import from both routes
- Removed `WidgetInstallationService` import from both routes (no longer needed in loaders)
- TypeScript compilation passes with no new errors

## Phases Checklist
- [x] Phase 1: Clean up types files
- [x] Phase 2: Clean up useBundleConfigurationState hook
- [x] Phase 3: Clean up service layer
- [x] Phase 4: Simplify product-page-bundle route
- [x] Phase 5: Simplify full-page-bundle route
- [x] Phase 6: Verify TypeScript compilation
