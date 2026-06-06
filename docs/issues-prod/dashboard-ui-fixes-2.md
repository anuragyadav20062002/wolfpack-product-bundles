# Issue: Dashboard UI Fixes — Language, Avatar, Table, Icons

**Issue ID:** dashboard-ui-fixes-2
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-01
**Last Updated:** 2026-05-01 13:30

## Overview
Four fixes to the dashboard:
1. Language dropdown: wire to Polaris i18n via `?locale=` URL param. Polaris component
   strings (modals, pagination, etc.) will translate. Shopify Admin chrome (nav, top bar)
   is controlled by Shopify itself — we cannot override it from our embedded app.
2. Founder avatar: scale back up to 72px, vertically centre with text block.
3. Bundle table alignment: fix header left-padding mismatch vs DataTable cell padding;
   restore 2fr/1fr/1fr/1fr proportions.
4. External link icons: fix Polaris Icon vertical alignment in App Embeds card header
   and resource thumbnail footers.

## Research Findings — Language
- Shopify passes `?locale=xx` (IETF BCP 47) on every request to embedded apps.
- Polaris locale JSONs live at `@shopify/polaris/locales/{lang}.json`.
- Passing the loaded JSON to `<AppProvider i18n={...}>` translates all Polaris components.
- `@shopify/react-i18n` is deprecated — do not use.
- Shopify Admin chrome translation = NOT controllable by the app. Staff language
  is a Shopify account preference only.

## Progress Log

### 2026-05-01 10:30 - Starting implementation
- Files: app/routes/app/app.tsx, route.tsx, dashboard.module.css

### 2026-05-01 11:30 - Completed card padding equalisation
- ✅ Switched `<Card>` → `<Card padding="0">` so Polaris default padding is removed
- ✅ `.supportCard` and `.appEmbedCard` both use `padding: 20px 24px; height: 100%; box-sizing: border-box`
- ✅ `.topCardsGrid :global(.Polaris-ShadowBevel) { height: 100% }` forces Card wrapper to stretch to grid cell height
- Files modified: route.tsx, dashboard.module.css

### 2026-05-01 11:45 - Founder card top alignment + avatar size
- ✅ Changed `align-items: center` → `align-items: start` on `.supportCard` so content starts at the top
- ✅ Changed `align-self: center` → `align-self: start` on `.supportAvatarWrap` for consistent top alignment
- ✅ Avatar enlarged 72px → 84px (width, height, image dimensions, grid column 88px → 96px)
- ✅ Button remains pinned to bottom via `grid-template-rows: 1fr auto`
- Files modified: dashboard.module.css

### 2026-05-01 12:00 - Fix language dropdown navigation + remove icon
- ✅ Replaced `navigate(window.location.href + ...)` with `setSearchParams` — avoids passing stale `id_token`/`timestamp` Shopify URL params that could break `authenticate.admin` on re-fetch
- ✅ Replaced `window.location.search` locale read with `useSearchParams()` — reactive to Remix router state, no race condition
- ✅ Added `useSearchParams` import from `@remix-run/react`
- ✅ Removed `LanguageIcon` import and the `<InlineStack>`+`<Icon>` wrapper around the Select
- Files modified: route.tsx

### 2026-05-01 13:30 - Second batch of dashboard UI fixes (5-point)

1. **Language translation** — Added client-side `useEffect` in `app.tsx` watching `locale`
   from `useSearchParams`; dynamically re-imports Polaris locale JSON and calls `setI18n`
   so AppProvider re-renders with fresh translations on each locale change.
   Fixed floating-promise ESLint error by adding `void` operator.
   Files: app/routes/app/app.tsx

2. **Bundle grid column alignment** — Corrected `.bundlesTableHeader span` padding to
   `0 6px` with `12px` on first/last child — matching exact Polaris DataTable cell padding
   (`var(--p-space-150)` sides, `var(--p-space-300)` first/last).
   Files: dashboard.module.css

3. **Dashboard header top margin** — Changed `.dashboardHeader` padding-top from `0` to
   `20px` so header row has breathing room above it.
   Files: dashboard.module.css

4. **Chat with Parth button pinned to card bottom** — Added `padding-bottom: 28px` to
   `.supportCard` and used `grid-template-rows: 1fr auto` + `align-self: end` on `.supportCta`.
   Files: dashboard.module.css

5. **External link icon right-aligned** — Replaced `<InlineStack>` (content-width inside
   BlockStack) with `<div className={appEmbedCardHeader}>` using explicit `justify-content:
   space-between; width: 100%` so icon is pushed to the far right of the App Embeds header.
   Bundle Gallery card footers use same `resourceThumbnailFooter` flex layout — icons right.
   Files: route.tsx, dashboard.module.css

- Verified all 5 fixes in browser via Chrome DevTools MCP screenshots.

## Phases Checklist
- [x] app.tsx: load Polaris locale from ?locale= param, pass to AppProvider
- [x] Dashboard: re-add language dropdown, navigate to ?locale= on change
- [x] Founder avatar 72px + centre alignment
- [x] Bundle header padding 12/16px + 2fr proportions + DataTable cell widths
- [x] External link icon alignment (App Embeds + thumbnails)
- [x] Verify in browser
- [x] Remove extra padding from founder + App Embeds cards; ensure equal heights via stretch grid + height:100%
- [x] Founder card: align content to top (matching App Embeds top padding); button pinned to bottom; avatar enlarged to 84px
- [x] Language dropdown: fix navigation (useSearchParams instead of window.location); remove LanguageIcon
- [x] Language translation: client-side useEffect in app.tsx loads Polaris locale JSON on change
- [x] Bundle column alignment: corrected header span padding to match DataTable cell padding
- [x] Dashboard header top padding: 20px top on .dashboardHeader
- [x] Chat with Parth button: pinned to card bottom via grid + align-self: end
- [x] External link icon: App Embeds header div + resourceThumbnailFooter flex right-aligned
