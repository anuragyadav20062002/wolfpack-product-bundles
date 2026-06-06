# Issue: Configure Pages Nav + PPB UI Parity

**Issue ID:** configure-nav-ui-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-16
**Last Updated:** 2026-05-16 08:30

## Overview

Two UI parity fixes for the bundle configure pages:

1. **FPB nav icons** — Add semantic `s-icon` icons to the FPB sidebar nav items (replacing `●`/`○` text dots). Matches EB's icon-per-section pattern.
2. **PPB nav redesign** — Replace the `s-button` nav list in PPB configure with the same HTML `button` + CSS class pattern used in FPB. The `s-button` toggle buttons look like a button group, not a navigation sidebar.

The PPB CSS module has only 65 lines vs FPB's 1,443 lines. The fix ports FPB's nav CSS classes to the PPB module and updates the PPB JSX to use HTML buttons with proper styling.

## Files in Scope

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/product-page-bundle-configure.module.css`

## Phases Checklist

- [x] Phase 1: FPB nav icons — add iconType to bundleSetupItems + replace ●/○ with s-icon
- [x] Phase 2: PPB nav redesign — port FPB CSS nav classes + replace s-button nav with button elements

## Progress Log

### 2026-05-16 08:00 - Issue Created, Implementation Starting
- ✅ Gap analysis: FPB uses ●/○ text in setupNavIcon span; PPB uses s-button variant=primary/tertiary
- ✅ Fix plan: (1) add iconType to FPB bundleSetupItems, replace dot span with s-icon; (2) port FPB CSS nav to PPB module, replace s-button with HTML button elements
- Next: Phase 1 — FPB nav icons

### 2026-05-16 08:30 - Phases 1 + 2: Nav Icons + PPB Nav Redesign — Completed

**Phase 1 — FPB nav icons (`app.bundles.full-page-bundle.configure.$bundleId/route.tsx`):**
- `bundleSetupItems`: Added `iconType` field — `note` (Step Setup), `filter` (Discount & Pricing), `view` (Bundle Visibility), `edit` (Bundle Settings)
- Nav `setupNavIcon` span: replaced `●`/`○` text with `<s-icon type={item.iconType} />` — shows icon when available, falls back to dot

**Phase 2 — PPB nav redesign:**
- `product-page-bundle-configure.module.css`: Added `setupNavList`, `setupNavItem`, `setupNavItemActive`, `setupNavIcon`, `setupNavLabel`, `setupNavMeta` classes (ported from FPB CSS module)
- `app.bundles.product-page-bundle.configure.$bundleId/route.tsx`: Replaced `s-button` toggle nav list with HTML `button` elements using the new CSS classes — 3-column grid (icon | label | badge), hover/active states, same visual pattern as FPB

- ✅ Lint: 0 errors on both route.tsx files
- Commit: [to be added]
