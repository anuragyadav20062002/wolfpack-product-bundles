# Issue: Migrate Admin UI from @shopify/polaris React to Polaris Web Components

**Issue ID:** polaris-web-components-migration-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-01
**Last Updated:** 2026-05-02 12:00

## Overview
Replace all `@shopify/polaris` React component imports in admin routes and shared components with Shopify's native `<s-*>` Polaris web components, loaded via CDN. See architecture doc at `docs/polaris-web-components-migration/02-architecture.md`.

## Progress Log

### 2026-05-01 14:00 - Starting Phase 1 (Infrastructure)
- Install `@shopify/polaris-types`
- Add `polaris.js` CDN script (deferred) in `app.tsx`
- Remove i18n locale-loading from `app.tsx`
- Replace `<NavMenu>` with `<ui-nav-menu>`
- Files: app/routes/app/app.tsx, package.json

### 2026-05-01 14:30 - Starting Phase 2 (Dashboard migration)
- Migrate `app/routes/app/app.dashboard/route.tsx`
- Prune `dashboard.module.css`
- Files: app/routes/app/app.dashboard/route.tsx, dashboard.module.css

### 2026-05-02 12:00 - Completed Phase 2 (Dashboard migration)
- ✅ Replaced all `@shopify/polaris` React component imports with `<s-*>` web components
- ✅ Fixed TypeScript errors: removed `size` from `<s-button>`, converted modal actions to slot pattern (`slot="primaryAction"`, `slot="secondaryActions"`), replaced `<s-text-field rows>` with `<s-text-area>`
- ✅ Fixed `<s-select>` full-width stacking by wrapping in sized `<div>` containers (`.filterSelectWrap`, `.perPageSelectWrap`)
- ✅ Updated `dashboard.module.css`: removed all Polaris `:global()` selectors, added layout/table/action classes for web component structure
- ✅ Verified in Chrome: dashboard renders, Create Bundle modal opens with correct slotted actions (disabled until name typed), Cancel closes modal, filter selects render side-by-side with correct options, bundle table/pagination/resources card all correct
- Files: app/routes/app/app.dashboard/route.tsx, app/routes/app/app.dashboard/dashboard.module.css

## Phases Checklist
- [x] Phase 1: Infrastructure (polaris-types, CDN script, app.tsx simplification)
- [x] Phase 2: Dashboard page migration
- [ ] Phase 3: Simple pages (events, attribution, billing, onboarding)
- [ ] Phase 4: Pricing
- [ ] Phase 5: Bundle Config pages
- [ ] Phase 6: DCP
