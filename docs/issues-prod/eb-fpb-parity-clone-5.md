# Issue: Parity Round 5 — Modal Polish, Add Step in Header, Pending Tooltip Icon

**Issue ID:** eb-fpb-parity-clone-5
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20

## Overview

Three targeted UI fixes across FPB and PPB configure pages:

1. **Discard modal polish** — Add content padding, button/content separation, and wire the modal X/dismiss cross to `setShowDiscardModal(false)` so React state stays in sync when the user closes via X.

2. **Add Step button in Step Setup card header** — EB shows a small circular "+" icon button in the Step Setup card header to the left of the enable/disable toggle. Add `<s-button variant="plain" icon="plus">` at that position in FPB (between delete and s-switch) and after delete in PPB.

3. **Pending badge tooltip → plain icon** — The info tooltip next to the Pending badge in the Bundle Visibility nav item should be a plain SVG icon (not an s-button), matching EB exactly. The hover popup should be small (200px), text-wrapping, right-aligned, with high z-index so it doesn't get clipped by parent components. FPB only.

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/full-page-bundle-configure.module.css`

## Progress Log

### 2026-05-20 - All changes implemented

- FPB + PPB: added `dismiss` event listener useEffect on `discardModalRef` → calls `setShowDiscardModal(false)`; wrapped modal body `<p>` in padding `<div>`
- FPB: added `PendingInfoIcon` component (SVG info icon trigger, `.pendingTooltipCard` CSS, right-aligned 200px popup, z-index 9999)
- FPB: replaced `QuestionHelpTooltip tooltipKey="bundleVisibilityPending"` with `<PendingInfoIcon />`
- FPB: added `<s-button variant="plain" icon="plus" accessibilityLabel="Add step">` between delete button and `s-switch` in Step Setup card header
- PPB: added `<s-button variant="plain" icon="plus" accessibilityLabel="Add step">` after delete button in Step Setup card header
- Added `.pendingInfoIcon` + `.pendingTooltipCard` CSS to FPB CSS module
- ESLint: 0 errors

## Phases Checklist

- [x] Discard modal: padding + dismiss event wired (FPB + PPB)
- [x] Add Step button in Step Setup header (FPB + PPB)
- [x] Pending badge tooltip → PendingInfoIcon with plain SVG (FPB only)
- [x] CSS: pendingInfoIcon + pendingTooltipCard classes
- [x] ESLint 0 errors
- [ ] E2E verify in Chrome
