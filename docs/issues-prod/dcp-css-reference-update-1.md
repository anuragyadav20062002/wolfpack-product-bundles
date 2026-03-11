# Issue: Update DCP CSS Reference + Fix Onboarding Support Button

**Issue ID:** dcp-css-reference-update-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

## Overview

1. **CSS Reference** — Both `CustomCssSettings.tsx` and `CustomCssCard.tsx` have
   stale class names that no longer match the widgets (e.g. `.bundle-modal`,
   `.bundle-next-button`, `.bundle-footer` — none exist in the current widget JS).
   Audited class names from source JS; replacing with accurate list including
   full-page-specific classes, CSS variables, and better categorization.

2. **Onboarding support button** — Currently links to `mailto:support@wolfpack-bundles.com`.
   Should open Crisp chat (`window.$crisp.push(["do", "chat:open"])`) like the
   billing page and dashboard already do.

## Files to Modify
- `app/components/design-control-panel/settings/CustomCssSettings.tsx`
- `app/components/design-control-panel/CustomCssCard.tsx`
- `app/routes/app/app.onboarding.tsx`

## Progress Log

### 2026-03-11 - Completed
- ✅ Audited actual CSS classes from bundle-widget-full-page.js + bundle-widget-product-page.js
- ✅ Audited CSS variables from css-variables-generator.ts (170+ variables)
- ✅ CustomCssSettings.tsx: complete rewrite with Chip + RefGroup components;
  accurate classes organized in 12 groups across Shared / Product-Page / Full-Page;
  CSS variables section with 8 groups; updated placeholder showing variable override pattern
- ✅ CustomCssCard.tsx: same update with multi-column auto-fill grid;
  12 class groups + 12 CSS variable groups (Global, Cards, Buttons, Footer x2,
  Step Timeline, Tabs, Promo Banner, Discount, Qty, Modal, Full-Page General)
- ✅ app.onboarding.tsx: "Email Support" → "Chat with Support" using Crisp;
  window.$crisp.push(["do", "chat:open"]); + Window type declaration added
- ✅ ESLint: 0 errors (2 pre-existing any-access warnings from $crisp, same as billing/dashboard)

## Phases Checklist
- [x] Update CustomCssSettings.tsx reference
- [x] Update CustomCssCard.tsx reference
- [x] Fix onboarding support button → Crisp
- [x] Lint + commit
