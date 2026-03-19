# Issue: DCP Federation — Separate Bundle Widget Customization Paths

**Issue ID:** dcp-federation-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 00:00

## Overview
Redesign the Design Control Panel page to federate full-page and product-page bundle CSS customizations into separate entry points. Merchants were confused by a single modal mixing settings for both widget types. The solution introduces two card-based entry points on the landing page, each opening a dedicated full-screen modal pre-configured for its bundle type. A shared Custom CSS section with per-bundle-type tabs and a CSS guide modal is retained below the cards.

## Progress Log

### 2026-03-19 00:00 - Starting DCP Federation Redesign
- Feature pipeline executed: BR → PO → Architecture → SDE documents created in `docs/dcp-federation/`
- Files to modify:
  - `app/hooks/useDesignControlPanelState.ts`
  - `app/components/design-control-panel/NavigationSidebar.tsx`
  - `app/components/design-control-panel/CustomCssCard.tsx`
  - `app/routes/app/app.design-control-panel/route.tsx`
  - `app/styles/routes/design-control-panel.module.css`

### 2026-03-19 00:00 - Completed Full Implementation
- ✅ `useDesignControlPanelState.ts` — added `initialBundleType` parameter
- ✅ `NavigationSidebar.tsx` — added `bundleType` prop; hides Promo Banner + Pricing Tier Pills for product_page
- ✅ `CustomCssCard.tsx` — rewrote with per-bundle-type tabs (Product Bundles / Landing Page Bundles), CSS Guide button, extracted `CssGuideContent` for use in App Bridge modal
- ✅ `route.tsx` — full redesign: two SVG bundle-type cards, two separate `<Modal variant="max">` instances, two SaveBars, per-modal state via two hook instances, shared CSS guide modal
- ✅ `design-control-panel.module.css` — added `landingCardsRow`, `bundleCardInner`, `bundleCardSvgWrapper` classes
- ✅ Feature pipeline docs created in `docs/dcp-federation/`
- ✅ ESLint: 0 errors on all modified files
- ✅ TypeScript: 0 new errors (pre-existing errors in unrelated files confirmed pre-existing)
- Next: Toast DCP customization feature (separate issue)

## Related Documentation
- `docs/dcp-federation/00-BR.md`
- `docs/dcp-federation/02-PO-requirements.md`
- `docs/dcp-federation/03-architecture.md`
- `docs/dcp-federation/04-SDE-implementation.md`

## Phases Checklist
- [x] Phase 1: Hook update — initialBundleType parameter
- [x] Phase 2: NavigationSidebar — bundleType filtering
- [x] Phase 3: CustomCssCard — tabs + CSS guide modal
- [x] Phase 4: CSS Module — landing page styles
- [x] Phase 5: Route redesign — two cards + two modals
- [x] Phase 6: Issue file + commit
