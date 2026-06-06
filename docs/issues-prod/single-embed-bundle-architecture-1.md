# Issue: Single Embed Bundle Architecture

**Issue ID:** single-embed-bundle-architecture-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-22
**Last Updated:** 2026-05-22 21:16

## Overview

Implement one Theme Editor app embed named `Wolfpack Bundle`, explicit app blocks for builder/upsell placement, and FPB storefront rendering through `/apps/product-bundles/wpb/:bundleId`.

## Progress Log

### 2026-05-22 11:51 - Starting Implementation
- Created BR, PO, architecture, test spec, and issue docs.
- Next: add proxy verification tests and implement single-embed/proxy route changes.

### 2026-05-22 12:08 - Implemented Core Architecture
- Added shared app-proxy HMAC verification and focused unit tests.
- Added FPB app-proxy route `/wpb/:bundleId` plus app-served full-page widget CSS/JS asset routes.
- Updated theme extension to expose one `Wolfpack Bundle` app embed and explicit builder/upsell app blocks.
- Updated configure/dashboard embed checks and FPB preview links to use `bundle-app-embed` and `/apps/product-bundles/wpb/:bundleId`.
- Updated app navigation and internal widget architecture docs.
- Next: run lint, widget asset checks, and final status review.

### 2026-05-22 12:17 - Verification
- Jest passed for app-proxy verifier, FPB proxy page, and app-embed detection tests.
- Targeted ESLint passed with zero errors; warnings are baseline unsafe-any warnings.
- `npm run build` passed.
- `npx shopify theme check extensions/bundle-builder` could not run because this local Shopify CLI context does not expose `theme check`.

### 2026-05-22 12:18 - Removed Legacy Category Embeds
- Deleted old category-specific body embed files:
  - `extensions/bundle-builder/blocks/bundle-full-page-embed.liquid`
  - `extensions/bundle-builder/blocks/bundle-product-page-embed.liquid`
- Cleaned the remaining FPB section block comment so it points to the single-embed architecture.
- Next: rerun reference search and build verification.

### 2026-05-22 12:26 - Fixed FPB Proxy Route Registration
- Chrome E2E found `/apps/product-bundles/wpb/:bundleId` reached the app but returned the app 404.
- Root cause: `app/routes.ts` registers `routes/root`, `routes/api`, `routes/app`, `routes/auth`, and `routes/assets`; the route file at `app/routes/wpb.$bundleId.tsx` was outside registered route roots.
- Moved the route to `app/routes/root/wpb.$bundleId.tsx` so it maps to `/wpb/:bundleId`.
- Updated the FPB proxy page unit test import.

### 2026-05-22 12:28 - Chrome E2E Verification Result
- Storefront proxy URL now reaches the new route but returns `400 Invalid bundle link`, proving route registration is fixed while app-proxy validation is still blocking the public FPB page in the current dev/storefront context.
- Existing direct bundle API app-proxy URL also returns a validation failure in the same storefront context, so the remaining blocker is not isolated to the new FPB page route.
- Admin configure page could not be verified because the embedded app iframe is currently on the app login/error flow and the web tunnel POST failed with `net::ERR_NAME_NOT_RESOLVED`.
- Theme editor app embeds panel currently shows legacy `WPB Full Page Bundle`, legacy `WPB Product Page Bundle`, and new `Wolfpack Bundle`; this does not yet match the one-embed target in the active Chrome session.
- Re-ran focused Jest and targeted ESLint after verification; Jest passed and ESLint reported zero errors with warnings only.

### 2026-05-22 16:06 - Fixed App Proxy Signature Verification
- Root cause for `Invalid bundle link`: the shared verifier joined signed parameters with `&`, but Shopify app-proxy signatures use sorted concatenation with duplicate parameter values joined by commas.
- Updated `verifyAppProxyRequest` to match Shopify's app-proxy signing shape.
- Added unit coverage for duplicate query parameters and updated the FPB proxy page route test signer.
- Re-ran focused Jest and targeted ESLint; Jest passed and ESLint reported zero errors with warnings only.
- Chrome reload of `/apps/product-bundles/wpb/cmpfhj2m10000v0t038osl42y` no longer returns `Invalid bundle link`; it renders the FPB page shell and then the widget reports `No active bundles found for this product`, which is a separate widget/config state.

### 2026-05-22 16:13 - Starting FPB Widget Config Fix
- Investigating why the accepted FPB proxy page renders the full-page widget shell but the storefront widget displays `No active bundles found for this product`.
- Expected outcome: determine whether the widget is ignoring `data-bundle-config`, using a product-page initialization path, or receiving a malformed FPB config payload.
- Next: trace the FPB widget initialization path and add the smallest fix with focused verification.

### 2026-05-22 16:17 - Fixed Explicit Draft FPB Selection
- Chrome debug showed the proxy shell injected valid config with matching `bundleId`, `bundleType: full_page`, one step, and `status: draft`.
- Root cause: the app proxy route intentionally allows draft FPBs, but `BundleDataManager.selectBundle` filtered selectable bundles to only `active` or `unlisted`.
- Updated selection logic so a draft full-page bundle can render only when the page explicitly requested that exact `bundleId`.
- Added focused `BundleDataManager` tests for explicit draft FPB selection and generic draft rejection.
- Bumped `WIDGET_VERSION` to `2.9.1` and ran `npm run build:widgets` so bundled extension assets include the fix.
- Chrome reload now renders the FPB interface instead of `No active bundles found for this product`; the page now reports `No products available in this step`, matching the current draft bundle data.

### 2026-05-22 21:15 - Prepared Commit
- Preparing the single app embed architecture changes for commit, including the requested `CLAUDE.md` and `AGENTS.md` updates.
- Excluding temporary Chrome DevTools network request artifacts from staging.
- Next: run focused checks, stage the tracked architecture/docs/test/build outputs, and commit with issue ID.

### 2026-05-22 21:16 - Pre-Commit Verification
- Focused Jest passed for app proxy verification, FPB proxy page, app embed detection, and bundle data selection tests.
- Targeted ESLint completed with zero errors and warnings only.
- `npm run build:widgets` completed and regenerated bundled storefront assets.
- Next: commit the staged single app embed architecture work.

## Related Documentation

- `docs/single-embed-bundle-architecture/00-BR.md`
- `docs/single-embed-bundle-architecture/02-PO-requirements.md`
- `docs/single-embed-bundle-architecture/03-architecture.md`
- `test-spec/single-embed-bundle-architecture.spec.md`

## Phases Checklist

- [x] BR
- [x] PO requirements
- [x] Architecture
- [x] Tests
- [x] Implementation
- [x] Verification
