# Issue: Cart Property Visibility Fix

**Issue ID:** cart-property-visibility-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 13:58

## Overview
Merchants on custom Shopify themes see raw `_bundle_*` line item attributes exposed on their cart page. The fix is a one-line Liquid `unless` guard in the theme's cart property loop. This issue covers surfacing that snippet + instructions as a polished card on the app dashboard.

## Progress Log

### 2026-03-20 13:58 - Starting implementation
- Feature pipeline completed (BR → PO → Architect)
- Files to create: `app/components/CartPropertyFixCard.tsx`
- Files to modify: `app/routes/app/app.dashboard/route.tsx`
- No backend, no tests required (Polaris UI exception)

### 2026-03-20 14:10 - Completed implementation
- Created `app/components/CartPropertyFixCard.tsx` — dark-themed code block, 3-step guide, copy button with 2s confirmation, blue-accent note footer
- Updated `app/routes/app/app.dashboard/route.tsx` — import + new Layout.Section before demo section
- Lint: 0 errors
- Next: commit

## Related Documentation
- `docs/cart-property-visibility/00-BR.md`
- `docs/cart-property-visibility/02-PO-requirements.md`
- `docs/cart-property-visibility/03-architecture.md`

## Phases Checklist
- [x] Phase 1: Create `CartPropertyFixCard` component
- [x] Phase 2: Integrate into dashboard
- [x] Phase 3: Lint + commit
