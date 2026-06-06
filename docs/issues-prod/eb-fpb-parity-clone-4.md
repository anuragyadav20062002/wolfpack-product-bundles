# Issue: Discard Confirmation Modal — FPB + PPB

**Issue ID:** eb-fpb-parity-clone-4
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20

## Overview

Add a "Discard all unsaved changes" confirmation modal that appears when the merchant clicks the "Discard" button in the Shopify SaveBar. Matches EB behavior exactly.

**EB audit findings:**
- Modal heading: "Discard all unsaved changes"
- Body: "If you discard changes, you'll delete any edits you made since you last saved."
- "Continue Editing" button (secondary) — closes modal, no action
- "Discard Changes" button (primary destructive) — actually discards and resets state
- Close (X) button on modal — same as Continue Editing

**Current WPB behavior:** Clicking SaveBar "Discard" immediately calls `handleDiscard()` with no confirmation.

**Target:** Both FPB and PPB configure pages.

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Progress Log

### 2026-05-20 - All changes implemented

- FPB: added `showDiscardModal` state + `discardModalRef` + `useEffect` wired to `showPolarisModal`/`hidePolarisModal`
- FPB: SaveBar Discard button and form `onReset` now call `setShowDiscardModal(true)` instead of `handleDiscard()` directly
- FPB: added `s-modal` with heading "Discard all unsaved changes", body copy matching EB, "Continue Editing" (secondary) and "Discard Changes" (`tone="critical" variant="primary"`) buttons
- PPB: same three changes, using the inline `(ref.current as any)?.show?.()`/`?.hide?.()` pattern matching PPB's existing style
- ESLint: 0 errors on modified files

## Phases Checklist

- [x] FPB: add `showDiscardModal` state + ref + useEffect
- [x] FPB: change Discard onClick to open modal
- [x] FPB: add discard confirmation modal JSX
- [x] PPB: same three changes
- [x] ESLint 0 errors
- [x] E2E verify in Chrome — modal renders correctly (heading, body, both buttons confirmed via screenshot + a11y tree); button interaction verified via code review (same pattern as sync/products/collections modals); OOPIF boundary prevents CDP click dispatch into cross-origin iframe
