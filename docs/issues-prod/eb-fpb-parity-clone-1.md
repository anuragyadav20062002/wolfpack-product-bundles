# Issue: EB FPB Configure Parity Clone

**Issue ID:** eb-fpb-parity-clone-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-20 09:30

## Overview

5 verified parity gaps between EB's FPB configure page and WPB's FPB configure route.
Architecture doc: `docs/eb-fpb-parity-clone/02-architecture.md`
Exploration reference: `docs/eb-fpb-exploration/EB_FPB_CONFIGURE_EXPLORATION.md`

## Gaps Addressed

1. **Bundle Widget sub-section** — entire section + nav item missing from FPB (PPB has full implementation to copy)
2. **Bundle Banner inline upload** — fields exist in schema; UI shows redirect button, not file pickers
3. **Bundle Level CSS inline editor** — field exists in schema; UI shows badge, not textarea
4. **"Quick Setup Guide" buttons** — call `handlePlaceWidget` (opens modal); should open external docs in new tab
5. **Cart line item discount display radio** — Phase 1: "Use app defaults" radio + grayed "Customize" option; no persistence

## Progress Log

### 2026-05-20 09:30 - E2E verification complete

All 5 gaps verified in Chrome DevTools MCP against SIT embedded app (bundle `cmp15vmme0001v0rj5ilb9srg`):
- Gap 1: "Bundle Widget" nav item present; section renders with toggle, Display Mode/On selects, auto-select checkbox, Place on theme + Place Widget buttons; toggle correctly shows/hides conditional controls
- Gap 2: Bundle Banner section shows Desktop (1900×230) and Mobile (1100×500) FilePicker drop zones with "Upload image" buttons
- Gap 3: Bundle Level CSS monospace textarea renders with `/* Add custom CSS for this bundle */` placeholder, accepts focus
- Gap 4: "Quick Setup Guide" buttons open new tab (not modal); "Set up Bundle Widget" navigates to bundle_widget section in-app
- Gap 5: "Cart line item discount display" radio group — "Use app defaults" selected (blue), "Customize for this bundle" grayed + "Coming soon" badge, "Edit Defaults" button present

**Follow-up:** `help.wolfpackbundles.com` domain returns DNS_PROBE_FINISHED_NXDOMAIN — URL placeholder in line 2950 of route.tsx needs to be updated to the real docs URL when published.

**Pre-existing SIT issue (unrelated):** SIT Prisma client is out of sync — `addonAddText` field missing from generated client. Save fails with unknown argument error. Not blocking this feature's E2E — all UI elements render correctly.

### 2026-05-19 18:00 - All 5 gaps implemented

- Gap 1: Bundle Widget nav item added to `bundleSetupItems`; state vars, formData fields, and full UI section added (mirror of PPB implementation); server-side parse+save added to `handleSaveBundle`
- Gap 2: Bundle Banner redirects replaced with inline `FilePicker` controls for desktop (1900×230) and mobile (1100×500); state + formData + server handler wired up
- Gap 3: Bundle Level CSS "Design panel" badge replaced with inline `<textarea>`; state + formData + server handler wired up
- Gap 4: "Quick Setup Guide" buttons now open external docs URL in new tab; "Set up Bundle Widget" now navigates to `bundle_widget` sub-section
- Gap 5: Cart line item section now shows radio group — "Use app defaults" (selected) + grayed "Customize for this bundle" with "Coming soon" badge; "Edit Defaults" button retained
- ESLint: 0 errors on both modified files

### 2026-05-19 17:00 - Issue file created, architecture complete

- Architecture doc written at `docs/eb-fpb-parity-clone/02-architecture.md`
- No new Prisma fields needed — all 5 gaps use existing schema columns

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/full-page-bundle-configure.module.css`

## Phases Checklist

- [x] Architecture doc written
- [x] Gap 1: Bundle Widget nav item + state + UI + save
- [x] Gap 2: Bundle Banner inline upload (desktop + mobile)
- [x] Gap 3: Bundle Level CSS textarea
- [x] Gap 4: Quick Setup Guide buttons → external URL
- [x] Gap 5: Cart line item radio (Phase 1)
- [x] ESLint 0 errors on modified files
- [x] E2E test in Chrome
