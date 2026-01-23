# Issue: Codebase Refactoring Plan - Separation of Concerns

**Issue ID:** codebase-refactoring-plan-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-01-23
**Last Updated:** 2026-01-23 08:30

---

## Progress Log

### 2026-01-23 08:30 - Phase 1: Action Handlers Extracted

**Files Created:**
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId/types.ts` - TypeScript interfaces extracted
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` - All 11 action handlers (~1,660 lines)
- `app/routes/app.bundles.full-page-bundle.configure.$bundleId/handlers/index.ts` - Re-export barrel file

**Action Handlers Extracted:**
1. `handleSaveBundle` (~490 lines) - Main bundle save logic
2. `handleUpdateBundleStatus` (~55 lines) - Status updates
3. `handleSyncProduct` (~333 lines) - Shopify product sync
4. `handleUpdateBundleProduct` (~105 lines) - Product details update
5. `handleGetPages` (~33 lines) - Fetch available pages
6. `handleGetThemeTemplates` (~278 lines) - Theme template management
7. `handleGetCurrentTheme` (~30 lines) - Current theme info
8. `handleEnsureBundleTemplates` (~107 lines) - Template creation
9. `handleCheckFullPageTemplate` (~77 lines) - Template existence check
10. `handleValidateWidgetPlacement` (~83 lines) - Widget placement validation
11. `handleMarkWidgetInstalled` (~51 lines) - Widget installation flag

**Utility Functions Extracted:**
- `safeJsonParse` - JSON parsing utility

**Next Steps:**
- Extract UI components to components/ (2,500+ lines remaining)
- Create thin route.tsx orchestrator

### 2026-01-23 09:00 - Phase 1: Main Route File Updated

**Changes Made:**
- Updated imports to use extracted handlers from `./handlers/` module
- Removed 1,662 lines of handler function definitions from main route file
- Main route file reduced from 4,469 lines to 2,807 lines

**File Size Reduction:**
- Original: 4,469 lines
- After handlers extraction: 2,807 lines
- Reduction: 1,662 lines (37%)

**TypeScript Verification:** Passed (no errors in refactored files)

## Overview

This document analyzes the codebase to identify files that need refactoring for better code organization, readability, and maintainability. The goal is to separate concerns and divide large files into smaller, focused modules without breaking existing business logic.

---

## Codebase Analysis Summary

**Total TypeScript/TSX files analyzed:** 100+
**Total lines of code:** ~54,000 lines

---

## Files Requiring Refactoring

### 🔴 CRITICAL (1000+ lines) - Immediate Priority

| File | Lines | Type | Issue |
|------|-------|------|-------|
| `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx` | 4,512 | Route | Massive monolithic file with UI, logic, and data mixed |
| `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx` | 4,028 | Route | Same issues as full-page configure |
| `app/assets/bundle-widget-full-page.js` | 3,039 | Widget | All widget logic in single file |
| `app/assets/bundle-widget-product-page.js` | 2,082 | Widget | All widget logic in single file |
| `app/routes/app.dashboard.tsx` | 1,429 | Route | Dashboard with mixed concerns |
| `app/services/webhook-processor.server.ts` | 1,168 | Service | Multiple webhook handlers in one file |
| `app/services/widget-installation.server.ts` | 1,138 | Service | Complex installation logic |
| `app/assets/bundle-widget-components.js` | 1,057 | Widget | Shared components could be split |

### 🟠 HIGH PRIORITY (500-1000 lines)

| File | Lines | Type | Issue |
|------|-------|------|-------|
| `app/services/app.state.service.ts` | 996 | Service | Global state service too large |
| `app/services/bundles/metafield-sync.server.ts` | 928 | Service | Multiple sync operations |
| `app/routes/app.bundles.cart-transform.tsx` | 795 | Route | Cart transform configuration |
| `app/routes/app.design-control-panel.tsx` | 788 | Route | DCP with embedded components |
| `api.design-settings.$shopDomain.tsx` | 761 | API | CSS generation + API logic mixed |
| `app/services/billing.server.ts` | 666 | Service | All billing operations |
| `app/routes/app.billing.tsx` | 661 | Route | Billing UI page |
| `app/routes/app.pricing.tsx` | 660 | Route | Pricing page |
| `api.bundle.$bundleId[.]json.tsx` | 593 | API | Bundle API endpoint |
| `app/hooks/useDesignControlPanelState.ts` | 586 | Hook | Large state management hook |
| `app/types/state.types.ts` | 533 | Types | All types in one file |
| `BundleFooterPreview.tsx` | 529 | Component | Large preview component |
| `app/assets/bundle-modal-component.js` | 514 | Widget | Modal component |

### 🟡 MEDIUM PRIORITY (300-500 lines)

| File | Lines | Type | Issue |
|------|-------|------|-------|
| `app/hooks/useAppState.ts` | 478 | Hook | Global app state hook |
| `app/services/metafield-validation.server.ts` | 470 | Service | Validation logic |
| `app/hooks/useBundleConfigurationState.ts` | 464 | Hook | Bundle config state |
| `ProductCardPreview.tsx` | 430 | Component | Preview component |
| `AppStateContext.tsx` | 422 | Context | State context |
| `defaultSettings.ts` | 418 | Config | Default DCP settings |
| `metafield-cleanup.server.ts` | 409 | Service | Cleanup operations |
| `pricing-calculation.server.ts` | 393 | Service | Pricing calculations |
| `app.onboarding.tsx` | 342 | Route | Onboarding flow |
| `bundle-analytics.server.ts` | 339 | Service | Analytics service |

---

## Refactoring Strategy

### Principles
1. **No breaking changes** - All existing functionality must work after refactoring
2. **One file at a time** - Refactor in phases, test after each phase
3. **Extract, don't rewrite** - Move code to new files, don't rewrite logic
4. **Maintain exports** - Keep backward-compatible exports via index files
5. **Test after each phase** - Verify functionality before moving to next phase

### Common Patterns to Apply

1. **Route Files**: Extract into:
   - `components/` - UI components
   - `hooks/` - Custom hooks for state/logic
   - `utils/` - Helper functions
   - `types.ts` - TypeScript interfaces
   - Keep route file as thin orchestrator

2. **Service Files**: Extract into:
   - Separate files per operation type
   - Shared utilities in `utils/`
   - Types in dedicated type files

3. **Widget JS Files**: Extract into:
   - `components/` - UI component classes
   - `utils/` - Helper functions
   - `state/` - State management
   - `api/` - API calls

---

## Phased Refactoring Plan

### Phase 1: Bundle Configuration Routes (Highest Impact)
**Target:** `app.bundles.full-page-bundle.configure.$bundleId.tsx` (4,512 lines)

**Proposed Structure:**
```
app/routes/app.bundles.full-page-bundle.configure.$bundleId/
├── route.tsx                 # Main route (loader, action, thin component)
├── components/
│   ├── BundleHeader.tsx
│   ├── StepEditor.tsx
│   ├── ProductSelector.tsx
│   ├── DiscountSettings.tsx
│   ├── PreviewPanel.tsx
│   └── index.ts
├── hooks/
│   ├── useFullPageBundleState.ts
│   ├── useStepManagement.ts
│   └── index.ts
├── utils/
│   ├── validation.ts
│   ├── transformers.ts
│   └── index.ts
└── types.ts
```

### Phase 2: Product Page Bundle Configure
**Target:** `app.bundles.product-page-bundle.configure.$bundleId.tsx` (4,028 lines)

**Same structure as Phase 1, with shared components extracted to:**
```
app/components/bundle-configuration/
├── shared/
│   ├── StepEditor.tsx
│   ├── ProductSelector.tsx
│   └── ...
```

### Phase 3: Widget JavaScript Files
**Target:** `bundle-widget-full-page.js` (3,039 lines)

**Proposed Structure:**
```
app/assets/widgets/full-page/
├── index.js                  # Entry point (IIFE wrapper)
├── components/
│   ├── ProductCard.js
│   ├── StepNavigation.js
│   ├── BundleFooter.js
│   ├── Modal.js
│   └── index.js
├── state/
│   ├── BundleState.js
│   └── CartState.js
├── utils/
│   ├── api.js
│   ├── dom.js
│   ├── formatting.js
│   └── index.js
└── constants.js
```

### Phase 4: Dashboard Route
**Target:** `app.dashboard.tsx` (1,429 lines)

**Proposed Structure:**
```
app/routes/app.dashboard/
├── route.tsx
├── components/
│   ├── BundlesList.tsx
│   ├── StatsCards.tsx
│   ├── QuickActions.tsx
│   ├── EmptyState.tsx
│   └── index.ts
├── hooks/
│   └── useDashboardData.ts
└── types.ts
```

### Phase 5: Webhook Processor Service
**Target:** `webhook-processor.server.ts` (1,168 lines)

**Proposed Structure:**
```
app/services/webhooks/
├── index.ts                  # Main export
├── processor.server.ts       # Core processor
├── handlers/
│   ├── product-update.server.ts
│   ├── product-delete.server.ts
│   ├── order-create.server.ts
│   └── index.ts
├── utils/
│   ├── payload-parser.ts
│   └── validation.ts
└── types.ts
```

### Phase 6: Widget Installation Service
**Target:** `widget-installation.server.ts` (1,138 lines)

**Proposed Structure:**
```
app/services/widget-installation/
├── index.ts
├── installer.server.ts
├── operations/
│   ├── theme-detection.server.ts
│   ├── block-injection.server.ts
│   ├── asset-upload.server.ts
│   └── index.ts
└── types.ts
```

### Phase 7: Design Control Panel Route
**Target:** `app.design-control-panel.tsx` (788 lines)

**Note:** Already partially refactored with extracted components. Further extraction needed for:
- Custom CSS section → dedicated component
- Remaining inline components

### Phase 8: API Design Settings
**Target:** `api.design-settings.$shopDomain.tsx` (761 lines)

**Proposed Structure:**
```
app/routes/api.design-settings.$shopDomain/
├── route.tsx                 # Thin route handler
├── css-generator.server.ts   # CSS generation logic
├── templates/
│   ├── product-page.ts
│   ├── full-page.ts
│   └── shared.ts
└── types.ts
```

### Phase 9: Billing & Pricing Routes
**Target:** `app.billing.tsx` (661 lines), `app.pricing.tsx` (660 lines)

**Extract shared billing components to:**
```
app/components/billing/
├── PlanCard.tsx
├── FeatureComparison.tsx
├── UpgradeModal.tsx
├── UsageStats.tsx
└── index.ts
```

### Phase 10: Services Cleanup
**Targets:**
- `app.state.service.ts` (996 lines)
- `metafield-sync.server.ts` (928 lines)
- `billing.server.ts` (666 lines)

---

## Phases Checklist

- [ ] Phase 1: Full Page Bundle Configure Route
- [ ] Phase 2: Product Page Bundle Configure Route
- [ ] Phase 3: Widget JavaScript Files
- [ ] Phase 4: Dashboard Route
- [ ] Phase 5: Webhook Processor Service
- [ ] Phase 6: Widget Installation Service
- [ ] Phase 7: Design Control Panel Route
- [ ] Phase 8: API Design Settings
- [ ] Phase 9: Billing & Pricing Routes
- [ ] Phase 10: Services Cleanup

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking imports | Use index.ts barrel exports for backward compatibility |
| Breaking business logic | Extract without modification, test after each phase |
| Build issues | Update build scripts for new file locations |
| Widget bundling | Update `npm run build:widgets` script for new structure |

---

## Success Metrics

- [ ] No file exceeds 500 lines (ideal) or 800 lines (acceptable)
- [ ] Each file has single responsibility
- [ ] Clear folder structure with logical grouping
- [ ] All existing tests pass
- [ ] App functionality unchanged
- [ ] Build process works correctly

---

## Notes

- Start with Phase 1 as it has the highest impact (4,500+ lines)
- Phases 1-2 can share extracted components
- Widget files (Phase 3) require special attention to bundling
- Each phase should be a separate PR for easy review

---

## Related Documentation

- CLAUDE.md - Project guidelines
- Build scripts in package.json

**Status:** Ready for implementation
