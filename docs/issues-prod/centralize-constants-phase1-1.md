# Issue: Centralize Constants & Mappings (Phase 1)

**Issue ID:** centralize-constants-phase1-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-28
**Last Updated:** 2026-02-28 12:00

## Overview
Centralize scattered constants, enums, and select-option arrays into dedicated constants files. Bundle enums (status, type, layout), form select options, and metafield keys are duplicated across ~15 files.

## Progress Log

### 2026-02-28 12:00 - Starting Implementation
- Creating `app/constants/bundle.ts` with BundleStatus, BundleType, FullPageLayout enums and form option arrays
- Creating `app/constants/metafields.ts` with METAFIELD_NAMESPACE and METAFIELD_KEYS
- Updating ~15 consuming files to import from centralized constants
- Files to modify: routes, hooks, contexts, handlers, metafield services, DCP components

### 2026-02-28 12:30 - Completed Implementation
- Created `app/constants/bundle.ts` with BundleStatus, BundleType, FullPageLayout enums and 7 form option arrays
- Created `app/constants/metafields.ts` with METAFIELD_NAMESPACE and METAFIELD_KEYS
- Updated 15 files to import from centralized constants
- ESLint: 0 errors, TypeScript: no new errors introduced
- Files modified: route.tsx (full-page + product-page), handlers.server.ts (full-page + dashboard), constants.ts (DCP), BundleHeaderPreview.tsx, BundleFooterPreview.tsx, useDesignControlPanelState.ts, useBundleConfigurationState.ts, AppStateContext.tsx, definitions.server.ts, component-product.server.ts, metafield-validation.server.ts, metafield-cleanup.server.ts, api.cleanup-metafields.ts

## Phases Checklist
- [x] Create app/constants/bundle.ts
- [x] Create app/constants/metafields.ts
- [x] Update configure routes (full-page + product-page)
- [x] Update DCP components and constants
- [x] Update hooks and contexts
- [x] Update handler files
- [x] Update metafield service files
- [x] Lint and verify
- [ ] Commit
