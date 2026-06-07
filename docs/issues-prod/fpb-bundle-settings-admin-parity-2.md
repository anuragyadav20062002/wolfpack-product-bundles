# Issue: FPB Bundle Settings — fresh EB parity (capture + rebuild)
**Issue ID:** fpb-bundle-settings-admin-parity-2
**Status:** Blocked (awaiting EB session)
**Priority:** 🔴 High
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:45

## Overview

Reopen FPB Bundle Settings parity from scratch — copy EB's Admin UI 100%, with free-hand to use custom HTML/CSS where Polaris web components can't match. Numbering bumped to `-2` to distinguish from the earlier `fpb-bundle-settings-admin-parity-1` attempt which used Polaris primitives and diverges visually.

Treated as a port (no BR/PO pipeline) since EB is the source-of-truth spec.

## Prerequisites

- Authenticated Chrome session on the EB admin app inside an EB-installed store (NOT `wolfpack-store-test-1` — EB is not installed there).
- Bundle: an FPB bundle with every Bundle Settings control configured (default product, quantity validation + slots + slot icon, variant selector, +button text, pre-order/subscription, multi-language cart text, banner image, line-item discount display option, custom CSS, status).

## Capture protocol (Subtask 4.1)

For each control / section in EB's Bundle Settings tab:

1. Desktop screenshot (1280×800).
2. Mobile screenshot (iPhone 14, 390×844).
3. `take_snapshot` on the section's DOM root.
4. `evaluate_script` for computed CSS on the section root + key children — `width`, `padding`, `gap`, `border-radius`, `box-shadow`, `font-size`, `color`, `background`.
5. While editing each field, `list_network_requests` to capture the save payload + response.
6. Note the storefront effect of the change (compare storefront before vs after).

Save the capture into `docs/competitor-analysis/18-eb-fpb-bundle-settings-capture.md` — one numbered section per EB control containing all of the above.

## Diff EB shape vs WPB data model (Subtask 4.2)

- Read `internal docs/EB Implementation Reference.md` § Bundle Settings.
- Read `prisma/schema.prisma` Bundle model (~L88–166).
- Produce a table: EB field → WPB column → status (exists / missing / partial).
- For missing columns: Prisma migration in this issue, NOT a runtime shim (no backwards compat).

## Rebuild the Settings tab (Subtask 4.3)

- New components under `app/components/bundle-configure/bundle-settings/` — one per EB section.
- Co-located CSS in `bundle-settings/styles/`.
- Replace JSX in `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` L5207–5554 with `<BundleSettingsTab …/>`.
- Reuse: `BundleStatusSection`, `FilePicker`, `MultiLanguageTextModal`.
- Form wiring: extend the existing action handler payload parser with new field names.

## Wire storefront effects (Subtask 4.4)

- For each new/changed setting: identify storefront read site (widget JS or Liquid).
- Mirror EB behavior exactly per the capture doc.
- Bump `WIDGET_VERSION` for any storefront-side change.

## Verification

- Side-by-side EB vs WPB at desktop + mobile.
- Save each control; confirm storefront effect parity on `wolfpack-store-test-1.myshopify.com`.
- Update `docs/app-nav-map/APP_NAVIGATION_MAP.md` with new sub-controls.

## Phases Checklist

- [ ] EB session opened + EB-installed store accessible
- [ ] Subtask 4.1 — capture every control to `18-eb-fpb-bundle-settings-capture.md`
- [ ] Subtask 4.2 — diff table in this issue file
- [ ] Subtask 4.2 — Prisma migration for any missing columns
- [ ] Subtask 4.3 — Build new `BundleSettingsTab` component tree
- [ ] Subtask 4.3 — Swap into FPB route
- [ ] Subtask 4.4 — Wire storefront effects + bump `WIDGET_VERSION`
- [ ] Side-by-side desktop + mobile QA
- [ ] APP_NAVIGATION_MAP update
- [ ] Commit + deploy prompt
