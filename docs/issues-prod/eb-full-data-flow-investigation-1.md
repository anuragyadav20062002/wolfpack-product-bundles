# Issue: EB Full Data Flow Investigation

**Issue ID:** eb-full-data-flow-investigation-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-22
**Last Updated:** 2026-05-23 19:30

## Overview

Create fresh EB full-page and product-page test bundles in the authenticated `yash-wolfpack` store, inspect their Admin save payloads and storefront runtime data, and document the implementation-facing data-shape target for Wolfpack without changing app code.

## Progress Log

### 2026-05-23 19:30 - Phase 16 fully resolved — all FPB preset IDs confirmed via CSS/JS static analysis

- Fetched `easy-bundle-full-page-min.js` via Bash/curl and found the `insertWrapperIntoBody` class-application logic: `[DESIGN_TEMPLATE_CONFIGS[e].value, "gbbProductsCardLayoutV2"].forEach(...)` — for `FBP_SIDE_FOOTER` this adds `gbbMinimilisticLayout` + `gbbProductsCardLayoutV2`.
- Fetched `easy-bundle-full-page-min.css` and confirmed three preset-scoped CSS rules: `body[gbb-bundle-design-preset-id="CLASSIC"]`, `body[gbb-bundle-design-preset-id="COMPACT"]`, `body[gbb-bundle-design-preset-id="HORIZONTAL"]`, all scoped inside `.gbbMinimilisticLayout`.
- Since `.gbbMinimilisticLayout` is only applied when `bundleDesignTemplate === "FBP_SIDE_FOOTER"`, all four presets must use `FBP_SIDE_FOOTER`. `STANDARD` is the default style (no CSS overrides). `BUILD_FROM_SCRATCH_NEWPRODUCTCARD` is a legacy key, unused by current presets.
- Updated research doc with confirmed table and full CSS/JS evidence.
- Phase 16 is fully resolved. `bundleDesignTemplate` = `FBP_SIDE_FOOTER` for ALL four FPB design presets.

### 2026-05-23 19:00 - Completed Phase 16 — FPB non-classic preset ID investigation (inference)

- Opened the "Select template" overlay on Bundle Box (`bundleId: 1`) in the EB admin.
- Confirmed overlay shows 4 FPB templates: Standard Design, Classic Design (currently selected), Compact Design, Horizontal Design.
- Attempted to observe the template save request via CDP network panel using multiple interaction paths: Select → Next, Select → Next → Preview bundle, keyboard navigation. All paths produced only `modifyBundleFields` calls carrying UI counter resets (`previewTemplateSelectionModalCnt`, `previewBundleModalCnt`) — no `bundleDesignPresetId` value in any observed request body.
- Verified Bundle Box storefront after each attempt: `bundleDesignPresetId` remained `CLASSIC` in `window.gbb.settings.stepsConfigurationData`, confirming no save occurred through the observable path.
- Checked EB widget JS (`easy-bundle-full-page-min.js`) for preset ID constants — widget does not use `bundleDesignPresetId` at all (admin-only field).
- Attempted WebFetch of EB admin Next.js chunks — blocked (404 / SPA with dynamic chunk names).
- **Conclusion:** Preset IDs for non-classic templates inferred from CDN image filename pattern (`landing-page-template-{name}-design.avif` → uppercase `{NAME}`): Standard → `STANDARD`, Compact → `COMPACT`, Horizontal → `HORIZONTAL`. This matches the confirmed `CLASSIC` convention. `bundleDesignTemplate` for non-classic designs remains unknown.
- Updated `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` Phase 4 FPB template table with inferred values + explanation. Updated Gaps section to reflect investigation outcome.
- Phase 16 marked complete (inference). Investigation is now fully closed.

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

### 2026-05-23 00:45 - Completed Phase 4 — template enumeration and variant display DOM

- Enumerated all 4 PPB templates via `mixAndMatch/update` interception: `PDP_INPAGE`/`CASCADE` (Product List), `PDP_INPAGE`/`COGNIVE` (Product Grid), `PDP_MODAL`/`MODAL` (Horizontal Slots), `PDP_MODAL`/`SIMPLIFIED` (Vertical Slots).
- Discovered FPB uses a two-field template system: `bundleDesignTemplate` + `bundleDesignPresetId`.
- Confirmed Classic Design: `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "CLASSIC"` (confirmed on both bundleId=1 Bundle Box and bundleId=2 WPB Research Landing Bundle via API response + storefront `gbb.settings.stepsConfigurationData`).
- Extracted `DESIGN_TEMPLATE_CONFIGS` constant from `easy-bundle-full-page-min.js`: `FBP_SIDE_FOOTER → gbbMinimilisticLayout`, `BUILD_FROM_SCRATCH_NEWPRODUCTCARD → gbbProductsCardLayoutV2`.
- Documented FPB DOM rendering: `body[gbb-bundle-design-preset-id]`, `.gbbPageBody[data-template-id]`, CSS classes.
- Confirmed FPB template save fires outside CDP observable context (multiple attempts); `modifyBundleFields` only resets UI counter.
- Captured `displayVariantsAsIndividualProducts: true` DOM: Category 2 of WPB Research PPB has multi-variant products (Yellow Sofa 3 variants, 18k Pedal Ring 6 sizes). Each variant renders as its own `gbbMixCascadeProductWrapper` with `gbbMixCascadeCurrentVariantTitle` subtitle and unique `data-current-selected-variant-id`. Parent product ID repeated across all variant cards.
- Deleted 3 temp network files. Updated research doc with Phase 4 section.
- Remaining gap: FPB non-classic preset IDs (STANDARD/COMPACT/HORIZONTAL unconfirmed — no bundle in store uses them).

### 2026-05-22 22:15 - Completed Phase 3 — collection pagination and multi-step navigation

- Confirmed collection pagination architecture: no cursor-based `collection { products(first: N, after: cursor) }` queries. All IDs pre-fetched; products hydrated in batches of 24 via `nodes(ids: [...])`. Client state in `gbbAddProductsPage.state.dataForInfiniteScroll.allProductsData`, `fetchCountPerBatch: 24`, `fetchBatchStartIndex` tracks position.
- Captured Load More batch evidence: 29-product collection split across 2+9 parallel `nodes()` calls (not cursor-driven).
- Captured FPB multi-step navigation DOM in full: `gbbNavigationItemsContainer`, `gbbNavigationItem#addProductsPageN`, `gbbNavigationStepImgContainerActive` active indicator, `gbbtickMark` completed-step checkmark, `gbbStepsProgressBarFilled` fill width.
- Captured JS state transition: `currentPageId` `addProductsPage1` → `addProductsPage2`, `isLastPage` `false` → `true`.
- Captured footer transition: single "Next" (`gbbFooterNextButton`) on intermediate steps → Back + "Add To Cart" (same `gbbFooterNextButton` class) on last step.
- URL confirms full page navigation between steps: `?page=addProductsPage1` → `?page=addProductsPage2`.
- Deleted temp files. Updated research doc with Phase 3 section.

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
- [x] Phase 11: Capture collection pagination architecture (no cursor queries — `nodes(ids:[])` batches)
- [x] Phase 12: Capture multi-step navigation DOM, JS state transitions, and footer changes
- [x] Phase 13: Enumerate all 4 PPB templates (`bundleDesignTemplate` + `templateId` pairs)
- [x] Phase 14: Discover and document FPB two-field template system (`bundleDesignTemplate` + `bundleDesignPresetId`)
- [x] Phase 15: Capture `displayVariantsAsIndividualProducts: true` DOM structure with multi-variant products
- [x] Phase 16: Confirm FPB non-classic preset IDs — inferred as STANDARD/COMPACT/HORIZONTAL from naming convention; network confirmation blocked by overlay OOPIF architecture
