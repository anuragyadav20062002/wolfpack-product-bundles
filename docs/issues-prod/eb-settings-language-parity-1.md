# Issue: EB Settings Language Parity
**Issue ID:** eb-settings-language-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 08:53

## Overview
Audit Easy Bundles Settings -> Language live behavior, document every setting-to-storefront variable relationship for Landing Page and Product Page bundle types, then implement Wolfpack Settings Language propagation to match EB from Admin save through storefront runtime.

## Progress Log
### 2026-06-04 08:16 - Audit started
- Created issue log before implementation changes.
- Confirmed the local `feature-pipeline` skill file is not installed in the advertised skill roots; following the repo pipeline manually with research, requirements/architecture docs, implementation, and e2e proof.
- Next steps: inspect current WPB Settings Language implementation, audit live EB Settings -> Language by changing each control, capture network/runtime propagation, document the contract, then implement and verify in Chrome.

### 2026-06-04 08:29 - EB language contract captured
- Audited EB Settings -> Language live in Chrome across Shared Components, Landing Page Layout, and Product Page Layout panels.
- Captured EB save path: `POST /api/saveLanguage/update?shopName=...` sends the complete store-level language document; EB immediately rereads `GET /api/saveLanguage/read?shopName=...`.
- Confirmed EB storefront propagation: `easybundles_ext_data.languageData` carries the full store-level language document for both bundle types; FPB reduces active locale into `gbb.settings.languageData`; PPB flattens Product Page copy into `gbbMix.settings.pageCustomizationSettings.customTextSettings`.
- Restored the temporary EB audit field and verified the latest readback does not contain the audit marker.
- Next steps: document the EB contract, add WPB runtime builder/tests, persist settings for both bundle types, expose storefront JSON, and wire FPB/PPB widgets to consume it.

### 2026-06-04 08:34 - Implementation slice started
- Documented the EB Settings Language contract in `internal docs/EB Settings Language Reference.md` and linked it from the internal docs index.
- Identified current WPB gap: Settings Language only saves the product-page row and only maps the FPB add-to-box label into one direct design setting.
- Blast radius for implementation: Settings Language Admin config, a new language runtime builder/API response, FPB/PPB storefront widget text resolution, and widget bundle outputs.
- Next steps: add TDD spec/tests, implement EB-shaped runtime mapping, save to both bundle types, expose app-proxy JSON, then verify widgets and Admin save in Chrome.

### 2026-06-04 08:53 - Implementation and verification completed
- Added `settings-language-runtime` tests/spec and implemented an EB-shaped Settings Language runtime document with FPB active-locale data, PPB `customTextSettings`, shared cart labels, and widget text overrides.
- Expanded Settings -> Language Admin UI to include both Landing Page Layout and Product Page Layout language panels with stable field keys for duplicated EB labels.
- Updated Settings save to persist the language runtime for both `product_page` and `full_page` `DesignSettings` rows.
- Added public `/apps/product-bundles/api/language-settings/:shop` JSON and wired FPB/PPB storefront widgets to fetch it before first render.
- Updated cart line display labels in FPB/PPB widget bundle-details sync to use Settings -> Language shared cart labels.
- Verification: `npx jest tests/unit/lib/settings-language-runtime.test.ts tests/unit/lib/admin-configuration-surfaces.test.ts --runInBand`, `node --check` on both raw widgets, `npm run build:widgets`, targeted ESLint, `npm run build`, graphify rebuild.
- Chrome e2e: Settings -> Language opened in embedded SIT Admin, Product Page Layout fields rendered, a temporary PPB Product Add to Cart label saved and appeared in storefront language JSON, then restored to `Add to Cart`. PPB and FPB storefront pages both issued 200 `/apps/product-bundles/api/language-settings/...` requests through the dev tunnel.

## Related Documentation
- `docs/competitor-analysis/05-settings-language.md`
- `internal docs/EB Implementation Reference.md`

## Phases Checklist
- [x] Phase 1: Current WPB language implementation audit
- [x] Phase 2: Live EB Settings -> Language audit
- [x] Phase 3: Contract documentation
- [x] Phase 4: Implementation and tests
- [x] Phase 5: Chrome e2e verification
