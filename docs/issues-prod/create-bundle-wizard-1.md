# Issue: Create Bundle Wizard — Step 01

**Issue ID:** create-bundle-wizard-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-02
**Last Updated:** 2026-05-02 20:00

## Overview
Replace the dashboard Create Bundle modal with a full-page multi-step wizard at `/app/bundles/create`. Step 01 collects bundle name, description, bundle type, and page layout. Also adds `data-tour-target` attributes to FPB and PPB configure pages per guided-tour-reference.md Section 3.

## Progress Log

### 2026-05-02 20:00 - Starting Implementation
- Writing tests first (TDD), then implementing new route, then dashboard modal removal, then data-tour-target attrs
- Files to create: `app/routes/app/app.bundles.create/route.tsx`, `create-bundle.module.css`, `tests/unit/routes/create-bundle-wizard.test.ts`
- Files to modify: dashboard route, useDashboardState, FPB configure route, PPB configure route, APP_NAVIGATION_MAP.md

## Related Documentation
- `docs/create-bundle-wizard/01-requirements.md`
- `docs/create-bundle-wizard/02-architecture.md`
- `docs/guided-tour-reference.md` — Section 3

## Phases Checklist
- [ ] Phase 1: TDD — write failing tests for create-bundle action
- [ ] Phase 2: New wizard route + CSS module
- [ ] Phase 3: Remove dashboard modal, update Create Bundle button, strip useDashboardState
- [ ] Phase 4: Add data-tour-target attrs to FPB configure page
- [ ] Phase 5: Add data-tour-target attrs to PPB configure page
- [ ] Phase 6: Update APP_NAVIGATION_MAP.md
