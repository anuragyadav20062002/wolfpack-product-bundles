# Issue: Dashboard UI Fixes — Language, Avatar, Table, Icons

**Issue ID:** dashboard-ui-fixes-2
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-01
**Last Updated:** 2026-05-01 11:30

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

## Phases Checklist
- [x] app.tsx: load Polaris locale from ?locale= param, pass to AppProvider
- [x] Dashboard: re-add language dropdown, navigate to ?locale= on change
- [x] Founder avatar 72px + centre alignment
- [x] Bundle header padding 12/16px + 2fr proportions + DataTable cell widths
- [x] External link icon alignment (App Embeds + thumbnails)
- [x] Verify in browser
- [x] Remove extra padding from founder + App Embeds cards; ensure equal heights via stretch grid + height:100%
