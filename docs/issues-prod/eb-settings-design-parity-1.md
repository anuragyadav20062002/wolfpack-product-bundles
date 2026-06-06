# Issue: EB Settings Design Parity
**Issue ID:** eb-settings-design-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 07:44

## Overview
Audit Easy Bundles Settings -> Design controls end-to-end, document each setting's Admin payload/data field/storefront variable relationship for Landing Page and Product Page bundle types, then wire Wolfpack to match the observed behavior.

## Progress Log
### 2026-06-04 07:18 - Started EB Settings Design parity audit
- Created issue log before repo modifications.
- Scope: inspect existing EB references, perform live EB Chrome audit of every Design subpage setting, document propagation from Admin save to storefront runtime/CSS for FPB and PPB templates, then implement and verify with e2e Chrome testing.
- Next steps: read existing DCP and EB implementation docs, inspect current Wolfpack DCP data flow, then run live EB Settings -> Design experiments.

### 2026-06-04 07:32 - Completed EB Settings Design evidence pass
- Read existing DCP references and current WPB Settings/CSS flow.
- Audited EB Settings -> Design controls in Chrome: Brand Colors, Typography, Corners, Images & GIFs, Expert General, Expert Product Card, Expert Bundle Cart, and Expert Upsell.
- Opened every visible Design guide image link: Bundle, Categories, Product Card, Bundle Cart, and Upsell previews.
- Captured EB save/read endpoint behavior: Settings Design persists through `pageCustomization/update` and feeds both FPB `window.easybundles_ext_data.pageCustomizationData` and PPB `window.gbbMix.settings.pageCustomizationSettings`.
- Confirmed current WPB gap: Settings Design saves only the `product_page` row and maps only a subset of EB fields.
- Next steps: write the reference document and implement a tested EB-style mapper reused by both bundle types.

### 2026-06-04 07:44 - Implemented EB-style Settings Design runtime wiring
- Added `internal docs/EB Settings Design Reference.md` with the EB save endpoints, `stylePresets` shape, control-to-field mappings, FPB/PPB runtime globals, guide image links, and PPB CSS variable bridge.
- Added TDD spec and unit tests for the EB Settings Design mapper and CSS alias layer.
- Added `app/lib/settings-design-runtime.ts` to map Settings -> Design payloads into EB-style `pageCustomization`, `stylePresets`, direct design columns, JSON settings, and flattened CSS settings.
- Updated Settings -> Design save action to upsert the design runtime into both `product_page` and `full_page` `DesignSettings` rows, matching EB's store-level design behavior within WPB's two-row schema.
- Added missing Design UI options for EB corner style controls and image fit choices.
- Added EB-compatible CSS aliases (`--product-card-*`, `--tabs-*`, `--footer-*`) and the `body[gbb-mix-consolidated-design="true"]` / `PDP_INPAGE` bridge selectors.
- Verification: `npx jest tests/unit/lib/settings-design-eb-parity.test.ts --runInBand` passed; modified-file ESLint completed with zero errors; `npm run build` passed; graphify rebuild completed.
- Chrome smoke: local built app served `text/css` for both product-page and full-page design CSS endpoints, and both contained the EB alias layer and bridge selectors. The local DB query timed out and served defaults, so this did not verify a full Admin-save-to-storefront persistence cycle.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/04-settings-design.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Phases Checklist
- [x] Phase 1: Existing-docs and code context audit
- [x] Phase 2: Live EB Settings -> Design control inventory and help-link audit
- [x] Phase 3: Live Admin save/network/storefront variable mapping for FPB
- [x] Phase 4: Live Admin save/network/storefront variable mapping for PPB
- [x] Phase 5: Write EB Settings Design reference document
- [x] Phase 6: Implement Wolfpack parity wiring
- [ ] Phase 7: E2E Chrome verification on Admin and storefront desktop/mobile
