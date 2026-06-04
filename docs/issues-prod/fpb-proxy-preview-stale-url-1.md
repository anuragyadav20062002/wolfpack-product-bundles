# Issue: FPB Proxy Preview Opens Setup Error
**Issue ID:** fpb-proxy-preview-stale-url-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 00:10

## Overview
Full-page bundle preview/navigation code still treats `/apps/product-bundles/wpb/{bundleId}` as a standalone preview URL even when `shopifyPageHandle` is missing. The proxy route now returns a 409 setup response in that state, so dashboard/create preview flows can expose "Bundle storefront page is not linked..." to merchants.

## Progress Log
### 2026-06-05 00:03 - Investigation started
- Confirmed the proxy route only redirects when `bundle.shopifyPageHandle` is present.
- Found dashboard preview still submits preview page creation and immediately opens the stale proxy URL.
- Found wizard preview helper still always returns the FPB proxy URL.
- Next: update tests, remove stale proxy-open branch, and make dashboard open the returned preview page URL after creation.

### 2026-06-05 00:10 - Stale proxy preview removed
- Updated dashboard preview action to return `create_preview_page` when an FPB has no linked Shopify page handle.
- Updated dashboard fetcher handling to open the returned preview page URL after `createPreviewPage` succeeds instead of opening the proxy URL immediately.
- Updated create wizard preview URL helper to open `/pages/{handle}` only when a page handle exists; otherwise it returns `missing_page_handle`.
- Updated FPB Configure Bundle Visibility link field to show/copy/open only the real Shopify page URL after a page exists.
- Focused preview/proxy tests pass. Lint completed with zero errors. Full-project TypeScript remains blocked by unrelated existing errors.

## Related Documentation
- `app/routes/root/wpb.$bundleId.tsx`
- `app/lib/dashboard-preview-action.ts`
- `app/lib/wizard-preview-url.ts`
- `app/routes/app/app.dashboard/route.tsx`

## Phases Checklist
- [x] Phase 1: Add failing tests for stale FPB proxy preview behavior
- [x] Phase 2: Update preview action helpers and dashboard response handling
- [x] Phase 3: Verify focused tests, lint, and type checks
