# Issue: Full-Page Bundle Pre-Storefront Preview

**Issue ID:** fpb-preview-before-storefront-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-30
**Last Updated:** 2026-03-30 18:30

## Overview

Add a "Preview on Storefront" button to the full-page bundle configure page that lets merchants preview their bundle in the real Shopify theme before adding it to the storefront. Uses a Shopify draft page and `shareablePreviewUrl`. When "Add to Storefront" is later clicked, the draft is promoted to published (no duplicate pages).

## Phases Checklist

- [x] Phase 1: Prisma schema + types (`shopifyPreviewPageId`, `shopifyPreviewPageHandle`, `shareablePreviewUrl`)
- [x] Phase 2: Service layer — draft creation, `publishPreviewPage`, `getPreviewPageUrl`
- [x] Phase 3: Handler layer — `handleCreatePreviewPage`, modified `handleValidateWidgetPlacement`
- [x] Phase 4: Route layer — intent, button, fetcher branch

## Progress Log

### 2026-03-30 00:00 - Feature Pipeline Complete, Starting Implementation

- Feature pipeline stages BR → PO → Architect → SDE all completed
- Documents in `docs/fpb-preview-before-storefront/`
- Starting Phase 1: Prisma schema changes

### 2026-03-30 18:30 - Implementation Complete

- ✅ Phase 1: Added `shopifyPreviewPageId` + `shopifyPreviewPageHandle` to Bundle Prisma model, migration applied, `shareablePreviewUrl` added to `FullPageBundleResult`
- ✅ Phase 2: `createFullPageBundle` extended with `isPublished` param; `publishPreviewPage` and `getPreviewPageUrl` added to service layer; 11 new unit tests all passing
- ✅ Phase 3: `handleCreatePreviewPage` added; `handleValidateWidgetPlacement` modified to promote draft page; 8 new handler tests all passing
- ✅ Phase 4: `createPreviewPage` intent added to route action; "Preview on Storefront" secondary button added; `shareablePreviewUrl` branch added to fetcher `useEffect`
- Files modified: `prisma/schema.prisma`, `app/services/widget-installation/types.ts`, `app/services/widget-installation/widget-full-page-bundle.server.ts`, `handlers.server.ts`, `handlers/index.ts`, `route.tsx`
- Test files: `tests/unit/services/widget-full-page-bundle-preview.test.ts`, `tests/unit/routes/fpb-configure-preview.test.ts`
- 0 ESLint errors; 0 test regressions

## Related Documentation

- `docs/fpb-preview-before-storefront/00-BR.md`
- `docs/fpb-preview-before-storefront/02-PO-requirements.md`
- `docs/fpb-preview-before-storefront/03-architecture.md`
- `docs/fpb-preview-before-storefront/04-SDE-implementation.md`
