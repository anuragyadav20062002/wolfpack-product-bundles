# Issue: Select Template Nav Section — FPB + PPB
**Issue ID:** select-template-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-23
**Last Updated:** 2026-05-31

## Overview
Add a "Select template" nav section to both FPB and PPB configure pages. Merchants can choose from 4 visual layout presets per bundle type. Mirrors EB's Customization overlay (captured 2026-05-23 via Chrome DevTools MCP). Persists `wpbLayoutTemplate` + `wpbPresetId` to `Bundle` DB model.

## Related Documentation
- `docs/select-template/01-requirements.md`
- `docs/select-template/02-architecture.md`
- `internal docs/EB Implementation Reference.md` — template system reference
- `test-spec/select-template.spec.md`

## Progress Log

### 2026-05-31 — Full-viewport modal CSS + formData null bug fix + e2e verification complete

**Full-viewport modal CSS (PPB + FPB):**
- Changed template dialog from centered overlay to full-viewport (100vw × 100dvh, border-radius 0) matching EB's Customization overlay on both PPB and FPB configure routes.
- Applied to `app/styles/routes/product-page-bundle-configure.module.css` and `app/styles/routes/full-page-bundle-configure.module.css`.

**`useFetcher.formData` null bug fix (PPB + FPB):**
- Root cause: Remix clears `fetcher.formData` when state returns to `idle`. The idle effect was guarding with `formData instanceof FormData`, which always returned false at idle → confirm step never rendered.
- Fix: replaced the guard with `!lastTemplateRequestRef.current` (a ref set at submit time, cleared on success/error) in both `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` and `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`.

**E2E verification — all 8 templates confirmed:**

PPB (bundle `cmpfhk3ys0001v0t0w2r3xvls`):
- CASCADE → DB + storefront `data-ppb-template-type="PDP_INPAGE"`, `data-ppb-design-preset="CASCADE"` ✓
- COGNIVE → DB + storefront `data-ppb-template-type="PDP_INPAGE"`, `data-ppb-design-preset="COGNIVE"` ✓
- MODAL → DB + storefront `data-ppb-template-type="PDP_MODAL"`, `data-ppb-design-preset="MODAL"` ✓
- SIMPLIFIED → DB + storefront `data-ppb-template-type="PDP_MODAL"`, `data-ppb-design-preset="SIMPLIFIED"` ✓

FPB (bundle `cmpfhj2m10000v0t038osl42y`):
- DEFAULT → DB `bundleDesignTemplate:"FBP_SIDE_FOOTER"`, `bundleDesignPresetId:"DEFAULT"` ✓
- CLASSIC → DB `bundleDesignTemplate:"FBP_SIDE_FOOTER"`, `bundleDesignPresetId:"CLASSIC"` ✓
- COMPACT → DB `bundleDesignTemplate:"FBP_SIDE_FOOTER"`, `bundleDesignPresetId:"COMPACT"` ✓
- HORIZONTAL → DB `bundleDesignTemplate:"FBP_SIDE_FOOTER"`, `bundleDesignPresetId:"HORIZONTAL"` ✓

All 8 templates: admin modal → Next → confirm step ("Your bundle is ready") → DB verified. Feature fully end-to-end validated.

### 2026-05-27 18:54 - PPB Select Template response-gated confirm + inline save error
- PPB template dialog flow: `handleTemplateNext` now submits template changes without pre-advancing to confirm state.
- Added response gating via dedicated `templateFetcher` effect in `route.tsx`:
  - Wait for `intent === "updateBundleDesignTemplate"` + idle state.
  - On success: applies `bundleDesignTemplate`/`bundleDesignPresetId` and moves to `confirm`.
  - On failure/empty payload: surface inline modal error and stay on select step.
- Added dialog-level error state reset on open/close and added `templateDialogError` style.
- This change targets the partial-failure loop where route/transport errors moved UI into confirm despite not persisting.

### 2026-05-27 19:20 - Extend response-gated template save parity to FPB
- Applied the same response-gated `updateBundleDesignTemplate` behavior in FPB configure:
  - Added template-save state/error refs (`templateSaveError`, `lastTemplateRequestRef`, `lastTemplateResponseRef`).
  - Added `templateFetcher` idle-response effect to only transition `templateModalStep` on success and keep modal in select state on failure.
  - On open/close, template dialog now clears stale request/error state.
  - `Next` is now disabled when no pending preset exists and no longer optimistically updates template state.
- Added inline save error rendering inside FPB template modal and shared-close handler for clean resets.
- Kept `updateBundleDesignTemplate` backend flow unchanged (already returns `{ success: true }` or error) so UI now matches server truth before entering confirm.

### 2026-05-23 05:00 - UI redesign — EB parity, paint-brush icon, HR separator
- FPB + PPB: changed `select_template` nav icon from `product` → `paint-brush-flat`
- FPB + PPB: added `<hr>` separator (1px solid #e1e3e5) before `select_template` nav item (mirrors EB)
- FPB + PPB: redesigned template cards to match EB Customization overlay:
  - `border: isSelected ? "3px solid #1a1a1a" : "2px solid #e1e3e5"`, `borderRadius: 12`
  - Full-size `<img>` with `aspectRatio: "4/3"`, `objectFit: "cover"`, using public thumbnail assets
  - Card footer: template name (bold, left) + Select/Selected `s-button` (right)
  - Outer card `onClick` + button `e.stopPropagation()` for full card clickability
  - EB-matching header: "Customize your bundle" title + subtext + "Customize Colors & Language" button
- All 12 unit tests passing; ESLint zero new errors; 0 TS errors in changed files

### 2026-05-23 03:00 - Phases 5, 6, 7 complete — route UI + nav map
- Phase 5: FPB route — added `select_template` nav item; state vars; 2×2 FPB template grid; formData appends; useCallback deps
- Phase 6: PPB route — same as FPB, PPB-specific templates (CASCADE/COGNIVE/MODAL/SIMPLIFIED)
- Phase 7: `docs/app-nav-map/APP_NAVIGATION_MAP.md` updated for both FPB + PPB select_template sections
- All 12 unit tests passing; 0 TS errors; 0 ESLint errors

### 2026-05-23 02:00 - Phases 1, 3, 4 complete — schema + handlers
- Phase 1: Added `wpbLayoutTemplate String?` + `wpbPresetId String?` to `prisma/schema.prisma`; migration `20260523124643_add_wpb_layout_template_preset_id` applied to SIT DB
- Phase 3: FPB handler — parse inline + persist both fields in `db.bundle.update`
- Phase 4: PPB handler — import `parseWpbTemplate`; spread into `db.bundle.update`
- Next: Phase 5 (FPB route UI) + Phase 6 (PPB route UI)

### 2026-05-23 01:00 - Phase 2 complete — parseWpbTemplate
- Added `parseWpbTemplate(formData)` export to `handlers/parsers.ts` (PPB)
- Created `tests/unit/routes/select-template.test.ts` — 12 tests, all passing
- Spec: `test-spec/select-template.spec.md`
- Next: Phase 1 — Prisma schema migration

### 2026-05-23 00:00 - Feature pipeline complete
- BR (fast-track) + PO + Architecture docs created
- Issue file created
- Next: write test spec → failing tests → implementation

## Phases Checklist
- [x] Phase 1: Schema — add `wpbLayoutTemplate` + `wpbPresetId` to Bundle model + migration
- [x] Phase 2: Parser — add `parseWpbTemplate` to PPB parsers.ts; unit tests pass
- [x] Phase 3: FPB handler — parse + persist new fields in FPB save handler
- [x] Phase 4: PPB handler — spread `parseWpbTemplate` in PPB save handler
- [x] Phase 5: FPB route — add nav item + section UI + form state + hidden inputs
- [x] Phase 6: PPB route — same for PPB with PPB-specific templates
- [x] Phase 7: Nav map update
- [x] Phase 8: Lint + final commit
- [x] Phase 9: UI redesign — EB parity (icon, HR, card design)
- [x] Phase 10: Full-viewport modal CSS (PPB + FPB)
- [x] Phase 11: Fix useFetcher.formData null bug — ref-based guard in both route.tsx files
- [x] Phase 12: E2E verification — all 8 templates (4 PPB + 4 FPB) confirmed admin → DB → storefront
