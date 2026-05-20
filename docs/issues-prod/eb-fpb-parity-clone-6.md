# Issue: Parity Round 6 — Rules fix, InfoIcon rename, Step Setup header cleanup, Discard modal fix

**Issue ID:** eb-fpb-parity-clone-6
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20

## Overview

Six targeted fixes:

1. **FPB Category Rules removal** — EB only has "No rules" and "Step rules". Remove the "Category rules" radio option from FPB and simplify `activeRuleMode` to only `"none" | "step"`.

2. **Rename PendingInfoIcon → InfoIcon** — Component was too narrowly named; rename for reusability across any description-only tooltip use case.

3. **Step Setup card header** — Keep clone button (with "Clone current step" tooltip) and s-switch; remove delete and plus buttons. FPB: clone + s-switch. PPB: clone only (no s-switch in PPB header).

4. **Discard modal Continue Editing fix** — "Continue Editing" button does not close the modal. Root cause: slotted `s-button` (slot="secondaryActions") inside `s-modal` does not reliably fire React synthetic onClick. Fix: move both action buttons out of slots into the modal body with a flex row layout.

5. **InfoIcon inside amber Pending badge** — InfoIcon must render inside the badge span so the amber background encompasses the icon; hovering anywhere on the badge opens the tooltip; popup z-index/overflow fix so it does not clip.

6. **i18n translations wired for InfoIcon tooltips** — `tooltips.bundleVisibilityPending.description` and any other tooltip keys must resolve from the i18n translation files.

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/full-page-bundle-configure.module.css`

## Progress Log

### 2026-05-20 - Initial batch implemented

- FPB: removed "Category rules" radio; simplified activeRuleMode to `ruleCount === 0 ? "none" : "step"`
- FPB + PPB: renamed PendingInfoIcon → InfoIcon with tooltipKey prop
- FPB: Step Setup card header — kept clone button + s-switch; removed delete and plus
- PPB: Step Setup card header — kept clone button only; removed delete and plus
- FPB + PPB: moved discard modal action buttons out of `slot=` into body flex row
- ESLint: 0 errors

### 2026-05-20 - InfoIcon badge + i18n fix

- FPB: InfoIcon now renders as a full amber badge ("Pending" text + info SVG + tooltip) replacing separate s-badge + icon
- Tooltip uses `position: fixed` + `getBoundingClientRect()` to bypass parent overflow clipping entirely
- Hover anywhere on the amber badge shows the tooltip; `onClick` stops propagation so clicking badge doesn't navigate
- i18n: `t('tooltips.bundleVisibilityPending.description')` was already wired; key confirmed in en.json
- CSS: replaced `.pendingInfoIcon` with `.pendingBadge` (amber badge styling); `.pendingTooltipCard` simplified to fixed-pos-compatible (no opacity/visibility transitions — React state controls visibility)
- ESLint: 0 errors

## Phases Checklist

- [x] FPB: remove Category rules radio, simplify activeRuleMode
- [x] FPB + PPB: rename InfoIcon with tooltipKey prop
- [x] FPB + PPB: Step Setup card header — clone + s-switch only (FPB); clone only (PPB)
- [x] FPB + PPB: discard modal buttons moved to body (no slots)
- [x] InfoIcon inside amber badge; hover on badge opens tooltip; fixed-pos tooltip (no clipping)
- [x] i18n translation key wired for tooltip content
- [x] ESLint 0 errors
- [ ] E2E verify in Chrome
