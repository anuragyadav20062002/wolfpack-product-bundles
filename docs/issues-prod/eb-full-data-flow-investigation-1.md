# Issue: EB Full Data Flow Investigation

**Issue ID:** eb-full-data-flow-investigation-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-22
**Last Updated:** 2026-05-22 20:30

## Overview

Create fresh EB full-page and product-page test bundles in the authenticated `yash-wolfpack` store, inspect their Admin save payloads and storefront runtime data, and document the implementation-facing data-shape target for Wolfpack without changing app code.

## Progress Log

### 2026-05-22 17:22 - Started EB data-flow investigation
- Reviewed repo instructions, existing EB competitor docs, internal widget/database docs, graph report, and prior parity memory.
- Confirmed Chrome DevTools has authenticated `yash-wolfpack` EB Admin and storefront tabs available.
- Files expected to change: this issue file and a new competitor research document under `docs/competitor-analysis/`.
- Next: create two fresh EB test bundles, capture Admin/storefront network and runtime state, then write the DTO/schema/theme-extension plan.

### 2026-05-22 17:31 - Captured EB FPB and PPB data flow
- Created fresh EB test artifacts:
  - `WPB Research Landing Bundle 2026-05-22` (`bundleId: 2`)
  - `WPB Research Product Page Bundle 2026-05-22` (`offerId: MIX-894502`)
- Captured Admin create/save/update endpoints, storefront globals, DOM attributes, app-proxy/product-page requests, and Storefront API product/collection hydration requests.
- Added `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` and linked it from `docs/competitor-analysis/00-index.md`.
- Documented the implementation-facing target DTO: bundle -> steps -> category map -> direct products / selected collections.
- Blockers: EB Admin iframe interactions prevented complete condition/discount/default-product/template-variant coverage in this run. The core category-first data-flow conclusion is still supported by both saved bundle types.

### 2026-05-22 17:44 - Reopened blockers for keyboard/a11y verification
- Reopening the EB Admin investigation to retry quantity/amount conditions, discount rules, defaults, and related controls with accessibility-tree targets and keyboard Tab navigation.
- Files expected to change: this issue file and `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`.
- Next: use the fresh EB bundles created for this issue, save any newly captured rule/default payloads, verify storefront/runtime impact, and update the research doc.

### 2026-05-22 17:49 - Completed keyboard/a11y blocker follow-up
- Used Tab/Space navigation in the EB embedded Admin iframe to enable PPB step rules after direct radio clicks failed.
- Saved quantity and amount step conditions, percentage discount rules, and a preselected product on `WPB Research Product Page Bundle 2026-05-22`.
- Captured `mixAndMatch/update` payloads showing populated `productsData1.conditions`, `discountConfiguration`, `metafieldData.discount`, and `defaultProductsData`.
- Updated `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` with the new serialized shapes and removed the stale blocker language for PPB conditions, discounts, and defaults.
- Remaining limits: did not add a second step, did not complete box/sidebar/footer/cart settings, and did not change PPB variant-display toggle values.

### 2026-05-22 20:30 - Completed Phase 2 storefront investigation

- Captured complete `window.easybundles_ext_data` structure (6 top-level keys: `userData`, `languageData`, `pageCustomizationData`, `bundleLinkData`, `bundleUpsellData`, `mixAndMatchData`).
- Captured FPB JS runtime state (`window.gbb.state`): offerId format `FBP-{bundleId}`, `isLastPage`, `navigationItems`, `giftBoxCartData` with per-item cart properties schema.
- Captured FPB `POST /cart/add.js` payload: component items with `_easyBundle:OfferId: "FBP-2_K6C_1"`, followed by `GetCartMetafield` + `cartMetafieldsSet` Storefront API sequence writing `bundle_details` metafield.
- Captured PPB JS runtime state (`window.gbbMix.gbbMixAndMatchBundle.state`): `initFlow: "SDK"`, `useSingleStepCategoriesAsBundleSteps: false`, `selectedProductsViewState`, pagination limits.
- Captured PPB `POST /cart/add` payload (multipart/form-data): component items with `_easyBundle:OfferId: "MIX-894502_K1K_1"`. Cart Transform OVERWRITE_LINE_ITEM operation converts component item to parent bundle product in response.
- Confirmed both FPB and PPB use identical `bundle_details` cart metafield accumulation pattern with key `{offerId}_{sessionKey}`.
- Updated `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` with Phase 2 Extended Configuration and Phase 2 Extended Storefront Evidence sections.
- Remaining: multi-step storefront nav DOM, alternative template IDs, collection pagination, `displayVariantsAsIndividualProducts` multi-variant DOM.

## Related Documentation

- `docs/competitor-analysis/00-index.md`
- `docs/competitor-analysis/15-single-embed-template-architecture.md`
- `docs/competitor-analysis/eb-sdk-analysis.md`
- `internal docs/Architecture/Widget Architecture.md`
- `internal docs/Architecture/Database Schema.md`

## Phases Checklist

- [x] Phase 1: Configure fresh EB FPB and PPB bundles
- [x] Phase 2: Capture Admin save/update requests
- [x] Phase 3: Capture storefront globals, DOM attributes, and network requests
- [x] Phase 4: Write competitor research evidence doc
- [x] Phase 5: Write implementation-facing data-shape plan
- [x] Phase 6: Complete PPB iframe blockers through keyboard/a11y paths
- [x] Phase 7: Capture `window.easybundles_ext_data` full shape
- [x] Phase 8: Capture FPB JS runtime state and cart add payload
- [x] Phase 9: Capture PPB JS runtime state and cart add payload
- [x] Phase 10: Document FPB vs PPB cart add comparison and `bundle_details` metafield pattern
