# SDE Implementation Plan: DCP Federation

## Overview
Federation of the DCP page into two separate bundle-type entry points. All changes are UI-only. No DB schema changes, no new settings, no API changes.

## Phase 1: Hook update — initialBundleType parameter
- `app/hooks/useDesignControlPanelState.ts` — add optional `initialBundleType: BundleType` param

## Phase 2: NavigationSidebar — bundleType filtering
- `app/components/design-control-panel/NavigationSidebar.tsx` — add `bundleType` prop, hide Promo Banner + Tier Pills for product_page

## Phase 3: CustomCssCard — tabs + CSS guide modal
- `app/components/design-control-panel/CustomCssCard.tsx` — add tab switcher, expose `onOpenCssGuide` callback

## Phase 4: CSS Module — landing page styles
- `app/styles/routes/design-control-panel.module.css` — add landing page card styles

## Phase 5: Route redesign — two cards + two modals
- `app/routes/app/app.design-control-panel/route.tsx` — full redesign per architecture

## Build & Verification Checklist
- [ ] `npx eslint --max-warnings 9999 <modified files>` — zero errors
- [ ] `npx tsc --noEmit` — zero new TypeScript errors
- [ ] `npm test` — all existing tests pass
- [ ] Manual: DCP landing page renders two cards
- [ ] Manual: Each card opens its own modal
- [ ] Manual: Full-page modal shows Promo Banner + Tier Pills; product-page modal does not
- [ ] Manual: Custom CSS tabs switch between bundle types
- [ ] Manual: Save in each modal targets the correct bundleType
- [ ] Manual: Preview updates live when settings change
- [ ] Manual: Discard reverts only the relevant modal's settings
