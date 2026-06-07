# Issue: PPB Bundle Settings — fresh EB parity (capture + rebuild)
**Issue ID:** ppb-bundle-settings-admin-parity-1
**Status:** Blocked (awaiting FPB completion + EB session)
**Priority:** 🔴 High
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:45

## Overview

Mirror of `fpb-bundle-settings-admin-parity-2` against the PPB (Product Page Bundle) editor's Settings tab. Sequenced second per the plan — FPB ships first, primitives carry over.

## Prerequisites

- FPB parity (`fpb-bundle-settings-admin-parity-2`) complete and shipped — shared components reused.
- Authenticated Chrome session on EB admin with a PPB bundle configured.

## Capture protocol

Same as FPB capture protocol → output to `docs/competitor-analysis/19-eb-ppb-bundle-settings-capture.md`.

PPB-specific controls to capture:
- Pre-selected product (step-scoped vs bundle-scoped)
- Conditions (`displayVariantsAsIndividualProducts`, `displayVariantsAsSwatches` per EB reference)
- Any PPB-only fields documented in `internal docs/EB Implementation Reference.md`

## Rebuild

- Reuse identical controls from FPB's `app/components/bundle-configure/bundle-settings/`.
- PPB-only controls go under `app/components/bundle-configure/bundle-settings/ppb/`.
- Replace JSX in `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` L4351–4667.

## Wire storefront effects

- Mirror EB behavior against `bundle-widget-product-page.js` + PPB Liquid block.
- Bump `WIDGET_VERSION` for any storefront-side change.

## Phases Checklist

- [ ] FPB parity merged
- [ ] EB session opened
- [ ] Capture every PPB control to `19-eb-ppb-bundle-settings-capture.md`
- [ ] Diff EB shape vs WPB Bundle model
- [ ] Prisma migration for PPB-only fields
- [ ] Build PPB-specific components; reuse FPB shared
- [ ] Swap into PPB route
- [ ] Wire storefront effects + bump `WIDGET_VERSION`
- [ ] Side-by-side QA at both viewports
- [ ] APP_NAVIGATION_MAP update
- [ ] Commit + deploy prompt
