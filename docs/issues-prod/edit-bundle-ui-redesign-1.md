# Issue: Edit Bundle UI Redesign — FPB Configure Page

**Issue ID:** edit-bundle-ui-redesign-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-10
**Last Updated:** 2026-05-11 14:00

## Overview

Redesign the edit bundle flow for Full-Page Bundles to align with the Figma design images
provided for the 26.05 UI changes. The edit flow currently uses a single-page form with a
left nav sidebar. The new design aligns it with the cleaner layout established by the create
flow wizard.

## Phases Checklist

- [x] Phase 1 — Step Setup right panel: chip nav, Step Configuration card (icon + pageTitle), Select Product card, Rules card, Advanced Step Options
- [x] Phase 2 — Left sidebar: Step Summary card, remove Storefront Page (move to Bundle Assets), remove Messages nav item
- [x] Phase 3 — Bundle Assets: add Storefront Page URL slug section at the top
- [x] Phase 4 — Handler: save timelineIconUrl, pageTitle, searchBarEnabled per step
- [x] Phase 5 — CSS: chip nav, card, stepConfigRow, tabRow, emptyState, rulesList, sideCard, summaryList styles
- [x] Phase 6 — Messages nav item restored; Bundle Settings + Messages headers polished (icon, weight, padding)

## Key Design Decisions

- Remove "Messages" nav item (defer to discount section work)
- Keep "Bundle Settings" nav item as-is
- Replace tab-based step nav with chip-based (same as create flow)
- Step Options (Free Gift, Mandatory Product) → "Advanced Step Options" card in Step Setup
- Storefront Page URL slug → moved to Bundle Assets section
- Step Summary → added to left sidebar (active-step data only)
- SaveBar (dirty-state) preserved — no Back/Next wizard buttons
- Step Clone button → in Advanced Step Options card

## Progress Log

### 2026-05-11 14:00 - Phase 6: Messages nav + header polish

- Added `{ id: "messages", label: "Messages", fullPageOnly: false }` to `bundleSetupItems` — restores the Messages nav item that was deferred in Phase 2
- Bundle Settings header: `s-icon name="image-alt"` → `note`, fontWeight 500 → 600, padding 12 → `var(--s-space-400)`
- Messages section header: `s-icon name="list-numbered"` → `note`, fontWeight 500 → 600, padding 12 → `var(--s-space-400)`, label "Messages" → "Widget Text"
- Files: route.tsx

### 2026-05-10 12:00 - Starting Phase 1–5 implementation
- What I'm about to implement: full Step Setup redesign + sidebar + assets + handler
- Files to modify:
  - `app/styles/routes/full-page-bundle-configure.module.css`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Expected outcome: edit FPB configure page matches design image #9

### 2026-05-10 14:00 - Completed Phases 1–5
- ✅ Phase 1: Step Setup right panel — chip navigation with forward/backward slide animation, Step Configuration card (timelineIconUrl icon preview + Upload, step name, pageTitle field, Multi Language button), Select Product card (Browse Products / Browse Collections tabs with count badges, product actions), Rules card (empty state or rulesList grid, add rule button), Advanced Step Options card (free gift toggle, mandatory product toggle + variant GID + picker, Clone + Delete buttons)
- ✅ Phase 2: Left sidebar — removed Messages nav item (bundleSetupItems array), removed Storefront Page <s-section>, added Step Summary IIFE (selected products count, rules count, filters count, search bar status, Preview button)
- ✅ Phase 3: Bundle Assets — added Storefront Page URL slug `<s-section>` at the top of the images_gifs content block, with page-slug text field and View on Storefront button
- ✅ Phase 4: Handler — added searchBarEnabled parse + bundle update; added timelineIconUrl + pageTitle to step create in handleSaveBundle
- ✅ Phase 5: CSS — added ~200 lines of new classes: stepNav, stepChip, stepChipActive, addStepBtn, slideForward/Backward, @keyframes, card, cardHeader, stepConfigRow, iconColumn, iconBox, iconImg, iconPlaceholder, fieldsColumn, tabRow, tab, tabActive, tabBadge, productActions, emptyState, rulesList, ruleRow, sideCard, summaryList, summaryItem, summaryLabel, summaryValue, summaryValueActive, previewButtonWrap
- Files modified: route.tsx (~2934→~2610 lines), handlers.server.ts, full-page-bundle-configure.module.css
- ESLint: 0 errors, 880 warnings (all pre-existing any usage)
- Next: await design images for remaining sections (Discount & Pricing, Bundle Assets full, Pricing Tiers, Bundle Settings)

## Related Documentation

- Design: Image #9 provided in conversation (2026-05-10)
- Create flow reference: `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- Create flow CSS reference: `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`
