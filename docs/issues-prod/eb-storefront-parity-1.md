# Issue: EB Storefront Parity for FPB and PPB
**Issue ID:** eb-storefront-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** {ts}

## Overview
Align FPB and PPB storefront behavior with EB end-to-end across APIs, DTOs, consumed JSON, metafields, template dispatch/designs, cart behavior, and per-template e2e proof.

## Progress Log
### 2026-06-02 16:32 IST - Started PPB modal shell gating parity slice
- EB PPB modal templates keep selection UI gated behind the slot trigger; WPB creates the bottom-sheet dialog during initialization.
- Current SIT smoke exposed the modal shell in the page accessibility tree before a customer opens a slot, which is not EB-aligned behavior.
- Scope: gate the existing PPB bottom-sheet panel with hidden/inert/aria-hidden until open, then restore the gate on close without changing product hydration or cart contracts.
### 2026-06-02 16:39 IST - PPB modal shell gating parity slice completed
- Created the PPB bottom-sheet dialog as `hidden`, `aria-hidden`, and `inert` until a slot is clicked.
- Opening a slot now removes the gate before applying the open class; closing through Escape restores hidden/inert state after the close transition window.
- Bumped widget version to `2.9.39` and rebuilt storefront widget assets.
- Verification: `node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js` passed.
- Verification: `npm run build:widgets` passed.
- Verification: targeted ESLint completed with 0 errors; the checked JS files are ignored by the current ESLint config.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.
- Chrome SIT PPB smoke on `wpb-sit-sanity-ppb-2026-06-02`: closed modal is hidden/inert and absent from the accessibility tree; slot click opens the dialog, hydrates the Cross Necklace card, and Escape restores hidden/inert state.
### 2026-06-02 16:44 IST - Started PPB MODAL slot orientation parity slice
- EB MODAL screenshot shows the closed PDP state as the compact vertical slot card, while WPB fresh SIT MODAL rendered the SIMPLIFIED-style horizontal row when `renderFilledSlotsAsHorizontalStacked` was missing.
- Scope: keep explicit merchant/runtime `renderFilledSlotsAsHorizontalStacked` behavior when present, but default missing data from the selected PPB template so MODAL and SIMPLIFIED do not collapse into the same closed-state layout.
### 2026-06-02 16:50 IST - PPB MODAL slot orientation parity slice completed
- Updated the PPB modal slot orientation fallback: explicit `renderFilledSlotsAsHorizontalStacked` still wins, but missing data now defaults from the selected template preset.
- Fresh MODAL bundles now default to the EB-style compact slot grid instead of the SIMPLIFIED horizontal row; SIMPLIFIED remains the vertical-row fallback when selected.
- Bumped widget version to `2.9.40` and rebuilt storefront widget assets.
- Verification: `node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js` passed.
- Verification: `npm run build:widgets` passed.
- Verification: targeted ESLint completed with 0 errors; the checked JS files are ignored by the current ESLint config.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.
- Chrome SIT PPB smoke on `wpb-sit-sanity-ppb-2026-06-02`: widget version `2.9.40`, template `PDP_MODAL/MODAL`, `data-ppb-slot-orientation="horizontal"`, slot grid measured `104.32px 104.32px 104.32px`, first slot card measured `104.32px x 178px`, modal remained hidden before slot open.
### 2026-06-02 16:50 IST - Started PPB SIMPLIFIED closed-state parity slice
- Live EB SIMPLIFIED storefront measured as a single 345px-wide dashed slot row: 104px tall, 10px radius, centered 16px/700 label, no visible slot image/icon, and a black 345px CTA.
- WPB SIMPLIFIED CSS path measured as a two-column 345px row with a visible pink visual block, 114px height, left-aligned 14px label, and gray disabled CTA.
- Scope: align the SIMPLIFIED closed PDP state to EB while leaving MODAL horizontal slot cards unchanged.
### 2026-06-02 16:50 IST - PPB SIMPLIFIED closed-state parity slice completed
- Updated SIMPLIFIED/vertical PPB closed-state CSS to a single 345px row with 104px height, centered 16px/700 label, hidden slot visual/icon, 10px dashed card border, and black primary CTA rules.
- Added a widget runtime CTA style sync so persisted SIMPLIFIED templates get the EB black primary CTA even if Shopify serves a stale CSS revision.
- Bumped widget version to `2.9.41`, rebuilt widget assets, and regenerated CSS assets.
- Verification: `npm run build:widgets`, `npm run minify:assets css`, and `node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js` passed.
- Verification: targeted ESLint completed with 0 errors; checked widget JS/CSS files are ignored by the current ESLint config.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.
- Chrome proof on fresh SIT PPB with SIMPLIFIED attributes forced after reload: widget version `2.9.41`, slot row measured `345px x 104px`, grid columns `345px`, card padding `0px`, visual `display:none`, label `16px/700` centered.
- E2E caveat: the persisted fresh SIT PPB fixture remains `PDP_MODAL/MODAL`; the cross-origin Admin shell POST did not update it. A real persisted SIMPLIFIED fixture/template smoke remains open.
### 2026-06-02 17:02 IST - PPB SIMPLIFIED persisted template smoke completed
- Updated the fresh SIT PPB fixture row and its Shopify parent variant `$app.bundle_ui_config` metafield to `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignPresetId: "SIMPLIFIED"`, `bundleDesignTemplateData.templateId: "SIMPLIFIED"`, and `renderFilledSlotsAsHorizontalStacked: false`.
- Storefront reload on `wpb-sit-sanity-ppb-2026-06-02` loaded the persisted config as widget version `2.9.41`, `data-ppb-template-type="PDP_MODAL"`, `data-ppb-design-preset="SIMPLIFIED"`, `data-ppb-slot-orientation="vertical"`, and body `gbbmix-template-id="SIMPLIFIED"`.
- Closed-state persisted measurements matched the EB SIMPLIFIED target: grid `345px`, slot card `345px x 104px`, dashed black `2px` border, `10px` radius, `0px` padding, visual hidden, centered `16px/700` label, and black `345px x 45px` CTA.
- Slot click opened the gated modal, hydrated the Cross Necklace product card, selecting it changed the modal button to `SELECTED` and enabled the main CTA as `Add Bundle to Cart • $4.97`.
- This closes the prior SIMPLIFIED e2e caveat for the fresh SIT fixture; remaining PPB template work still includes persisted MODAL, CASCADE, and COGNIVE per-template smoke and visual comparison.
### 2026-06-02 17:06 IST - Started PPB CASCADE persisted template smoke
- Updated the fresh SIT PPB fixture row and Shopify parent variant `$app.bundle_ui_config` metafield to `bundleDesignTemplate: "PDP_INPAGE"`, `bundleDesignPresetId: "CASCADE"`, and `bundleDesignTemplateData.templateId: "CASCADE"`.
- Storefront reload loaded the persisted config as widget version `2.9.41`, `data-ppb-template-type="PDP_INPAGE"`, `data-ppb-design-preset="CASCADE"`, and body `gbbmix-template-id="CASCADE"`.
- CASCADE product row rendered and hydrated Cross Necklace with `$4.97` and black `Add +` CTA, but the in-page category tabs were absent because WPB suppressed tabs when a step has only one category.
- EB CASCADE evidence keeps category/tab UI as part of the in-page product-list surface; scope this slice to render the category tabs whenever at least one category exists.
### 2026-06-02 16:11 IST - SIT fixture storefront sanity
- Created fresh SIT PPB and FPB fixtures after the Render DB reset and activated both through the normal configure save flow.
- PPB storefront product URL bootstrapped `bundle-widget-product-page-bundled.js` at widget version 2.9.36 with product-page markers and compare-at text gated off.
- FPB parent product URL incorrectly bootstrapped the product-page block/assets because `bundle-product-page.liquid` rendered any bundle container product, including `full_page` configs.
- Next: gate the product-page Liquid block to product-page bundles only, then re-test FPB product URL and proceed to the documented FPB page/app-embed placement path.
### 2026-06-02 16:11 IST - FPB placement flow gap
- Verified the FPB app-proxy link returns the documented setup response when no Shopify page is linked.
- Found the existing `validateWidgetPlacement` action and `handleAddToStorefront` client handler were not exposed in the Bundle Visibility UI, leaving fresh FPB fixtures without a direct page creation action.
- Next: wire the existing Add-to-storefront handler into the Visibility link card and test page creation plus storefront hydration.
### 2026-06-02 16:11 IST - FPB page marker cache and reuse
- FPB page hydration loaded the correct full-page assets from Shopify CDN but used the proxy JSON fallback because the app-created marker carried `data-bundle-config="null"`.
- Updated page marker generation so the app-created marker carries the formatted bundle config and display settings, matching the metafield cache payload used by the section block.
- Rerunning placement exposed duplicate page creation because the handler did not reuse an already linked `shopifyPageId`; added a refresh-in-place path for linked pages.
### 2026-06-02 16:11 IST - PPB modal category hydration gap
- PPB storefront bootstrapped correctly, but clicking the Product 1 slot opened an empty modal and never called the storefront-products API.
- Root cause: `loadStepProducts` skipped hydration whenever `stepProductData[stepIndex]` was non-empty; category-only DTOs can seed raw product stubs without variants/prices, so the modal rendered no usable product cards.
- Next: only skip hydration when cached modal products already contain hydrated storefront data, then rebuild widget assets and re-test PPB selection/cart.
### 2026-06-02 16:11 IST - PPB cart redirect handling gap
- PPB selection worked after category hydration, but Add Bundle to Cart showed a false failure.
- Network evidence showed `/cart/add` accepted the multipart payload and redirected to `/cart`; the widget treated the successful HTML redirect as an error because it required a JSON response body.
- Next: treat successful HTTP responses from Shopify cart add as success for the multipart PPB path and rebuild widget assets.
### 2026-06-02 16:11 IST - SIT storefront smoke result
- FPB fixture: active bundle, linked Shopify page, full-page assets served from Shopify CDN, embedded marker config/settings present, product selection worked, Add to Cart succeeded, and cart redirect completed.
- PPB fixture: product-page widget served version 2.9.38, category product hydrated through storefront-products API, modal selection worked, multipart cart add redirected to `/cart`, and cart showed the new bundle line.
- Remaining known gaps: EB pixel/template parity still needs deeper per-template comparison; this pass covered bootstrap, marker/config flow, product hydration, and base cart add for fresh SIT fixtures.
### 2026-06-02 16:11 IST - Post-commit graph drift
- The commit hook rebuilt graphify after the storefront smoke commit and dirtied `graphify-out/GRAPH_REPORT.md`.
- Next: commit the graph report refresh separately without amending the completed storefront smoke commit.






### 2026-06-02 11:50 - Started PPB discount tier pill DTO parity slice
- EB PPB storefront templates show inline discount tier pills using merchant-configured pricing rule copy from the consumed bundle JSON.
- Current WPB PPB widget renders tier pills from index-based `bundleQuantityOptions.labels` / `subtexts`, which can drift when rules are keyed by id.
- Scope: read rule-id keyed display DTO text first, keep existing index arrays as compatibility within the current consumed JSON shape, and use structured threshold/discount labels only as the final non-marketing fallback.

### 2026-06-02 11:50 - PPB discount tier pill DTO parity slice completed
- Added `getProductPageTierPillContent()` so PPB quantity/tier pills read `bundleQuantityOptions.optionsByRuleId[rule.id]` first, then `pricing.messages.tierTextByRuleId[rule.id]`.
- Kept current index-based `labels[index]` / `subtexts[index]` as a consumed-JSON compatibility path and made the final fallback structured threshold/discount text only.
- Bumped storefront widget version to `2.9.36` and rebuilt widget JS assets.
- Added `test-spec/ppb-discount-tier-pill-dto.spec.md` and focused source-contract coverage.
- Verification: `node --check app/assets/bundle-widget-product-page.js` completed successfully.
- Verification: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` passed with 29 tests.
- Verification: `npm run build:widgets` completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-product-page-init.test.ts` completed with 0 errors and warnings only.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.
- E2E status: live storefront remains deploy-gated for this slice because Shopify CDN serves the last deployed widget until manual app deploy/cache propagation.

### 2026-06-02 13:44 - Started PPB compare-at price visibility parity slice
- EB PPB runtime settings include `showProductComparedAtPrice` with default `false`.
- Current WPB PPB widget renders compare-at strike prices whenever product data includes `compareAtPrice`.
- Added `showProductComparedAtPrice` to the product-page storefront DTO with EB's default `false`.
- Added `_shouldShowProductComparedAtPrice()` in the PPB widget and gated both in-page and modal product-card compare-at strike markup behind the setting.
- Bumped storefront widget version to `2.9.35` and rebuilt widget JS assets.
- Added `test-spec/ppb-compare-at-price-visibility.spec.md` and focused source-contract coverage.
- Verification: `node --check app/assets/bundle-widget-product-page.js` completed successfully.
- Verification: `npx jest tests/unit/assets/bundle-widget-product-page-compare-at-price.test.ts --runInBand` passed with 2 tests.
- Verification: `npm run build:widgets` completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-product-page.js app/services/bundles/metafield-sync/types.ts app/services/bundles/metafield-sync/operations/bundle-product.server.ts scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-product-page-compare-at-price.test.ts` completed with 0 errors; warnings are pre-existing unsafe-any warnings in the metafield sync file plus ignored asset JS.

### 2026-06-02 13:25 - Started FPB sidebar CTA label parity slice
- EB storefront audit shows the FPB sidebar primary CTA uses bundle tier language such as the selected box/discount label, while WPB still used generic `Add to Cart` / `Next Step` text in the dark button.
- Current source already has `createSidebarTierCta(nextRule)` using configured box/tier DTO text; scope is to reuse that source for the primary add-to-cart button label without changing cart behavior.
- Intermediate navigation must keep `Next Step`; only add-to-cart states should use tier label/subtext.

### 2026-06-02 13:34 - FPB sidebar CTA label parity slice completed
- Added `getSidebarTierCtaContent()` so the sidebar summary card and primary add-to-cart button share the same configured EB-style tier/box DTO text.
- The main dark sidebar button now renders tier label/subtext spans only in add-to-cart states; intermediate step navigation remains `Next Step`.
- Bumped storefront widget version to `2.9.34` and rebuilt widget JS assets.
- Added `test-spec/fpb-sidebar-tier-cta.spec.md` and focused source-contract coverage.
- Verification: `node --check app/assets/bundle-widget-full-page.js` completed successfully.
- Verification: `npx jest tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand` passed with 10 tests.
- Verification: `npm run build:widgets` completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-full-page-discount-display.test.ts` completed with 0 errors and warnings only.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.

### 2026-06-02 13:06 - Started PPB single-step categories-as-steps slice
- EB evidence confirms `useSingleStepCategoriesAsBundleSteps` is a store-level PPB setting and maps into storefront runtime settings.
- Current WPB server writes `useSingleStepCategoriesAsBundleSteps`, but the PPB widget does not consume it and still renders multi-category single steps as tabs.
- Added `ppbExpandSingleStepCategoriesAsSteps()` to normalize a single non-default, non-free multi-category PPB step into one visible step per category before `initializeDataStructures()`.
- Each expanded step keeps only its source category, preserving category product/collection filtering while preventing category tabs from rendering for the expanded steps.
- Bumped storefront widget version to `2.9.33` and rebuilt widget JS assets.
- Added `test-spec/ppb-single-step-categories-as-steps.spec.md` and focused source-contract coverage.
- Verification: `node --check app/assets/bundle-widget-product-page.js` completed successfully.
- Verification: `npx jest tests/unit/assets/bundle-widget-product-page-single-step-categories.test.ts --runInBand` passed with 3 tests.
- Verification: `npm run build:widgets` completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-product-page-single-step-categories.test.ts` completed with 0 errors; asset JS files are ignored by the current ESLint config.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.

### 2026-06-02 12:55 - Started FPB promo discount-tier badge parity slice
- EB storefront audit shows CLASSIC, COMPACT, and HORIZONTAL FPB templates display a horizontal discount tier badge row near the hero/promo area.
- Current source already inserts `createPromoBanner()` in sidebar FPB layout, but the banner only shows one best-rule message and does not render EB-style per-tier badges.
- Scope: derive promo tier badges from existing pricing rules and configured tier text/subtext where present; do not hardcode merchant marketing copy or template names.

### 2026-06-02 13:05 - FPB promo discount-tier badge parity slice completed
- Added `createPromoDiscountTierBadges()` and `formatPromoDiscountTierLabel()` to render EB-style promo tier badge rows from existing FPB pricing rules.
- Configured `pricing.messages.tierTextByRuleId` values win; fallback labels are structured threshold/discount values only, avoiding fabricated merchant marketing copy.
- Kept badge styling inline in the widget HTML to avoid increasing the Shopify app-block CSS asset beyond the 100,000 B limit.
- Bumped storefront widget version to `2.9.32`, rebuilt widget JS assets, and regenerated minified CSS assets.
- Verification: `node --check app/assets/bundle-widget-full-page.js` completed successfully.
- Verification: `npx jest tests/unit/assets/bundle-widget-full-page-discount-display.test.ts` passed with 9 tests.
- Verification: `npm run build:widgets` and `npm run minify:assets css` completed successfully; `bundle-widget-full-page.css` generated at 97.6 KB.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/full-page-css/bundle-widget-full-page.css scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-full-page-discount-display.test.ts` completed with 0 errors and warnings only.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.

### 2026-06-02 12:40 - Started PPB EB template body marker slice
- Live storefront remains deploy-gated: FPB serves widget `2.9.17`, PPB serves widget `2.9.21`, while local source is `2.9.30`.
- EB evidence confirms PPB writes `gbbmix-template-id`, `gbbmix-template-type`, and consolidated design state onto `document.body` after bundle data loads.
- Added EB-aligned PPB body markers: `gbbmix-template-id`, `gbbmix-template-type`, and `gbb-mix-consolidated-design="true"`.
- Added EB-style `template-id` and `template-type` attributes on the widget container while preserving existing `data-ppb-*` markers.
- Updated the PPB missing-template fallback to EB's `PDP_MODAL` default, bumped widget version to `2.9.31`, and rebuilt widget deployables.
- Verification: `node --check app/assets/bundle-widget-product-page.js`, `npm run build:widgets`, and graphify rebuild completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js` completed with 0 errors; both files are ignored by the current ESLint config.

### 2026-06-02 12:28 - Started PPB SDK cart contract parity slice
- Grounded the gap in EB cart evidence: PPB uses multipart `/cart/add`, public `_easyBundle:OfferId` properties, and post-add `bundle_details` cart metafield sync.
- Found SDK mode still emitted `_bundle_id`, `_bundle_name`, and `_step_index` with JSON `/cart/add.js`, which breaks the EB PPB storefront contract when `bundle_ui_config.sdkMode` is true.
- Updated SDK state/config to carry `offerId`, changed SDK cart lines to EB-compatible public properties, switched SDK add-to-cart to multipart `/cart/add`, and reused the app-proxy `bundle_details` sync route.
- Added `test-spec/sdk-cart-eb-contract.spec.md` and updated focused SDK cart tests for the EB contract.

### 2026-06-02 12:39 - PPB SDK cart contract parity slice completed
- Bumped storefront widget version to `2.9.30` and rebuilt all widget JS assets so FPB, PPB, and SDK deployables report the same version.
- Verification: `node --check app/assets/sdk/cart.js && node --check app/assets/sdk/state.js && node --check app/assets/sdk/config-loader.js` completed successfully.
- Verification: `npx jest tests/unit/assets/sdk-cart.test.ts` passed with 8 tests.
- Verification: `npm run build:sdk` and `npm run build:widgets` completed successfully.
- Verification: `npx eslint --max-warnings 9999 app/assets/sdk/cart.js app/assets/sdk/state.js app/assets/sdk/config-loader.js scripts/build-widget-bundles.js tests/unit/assets/sdk-cart.test.ts` completed with 0 errors and warnings only.
- Verification: graphify rebuild completed; existing graphify invalid `file_type 'source'` warning remains unrelated.

### 2026-06-02 11:10 - FPB COMPACT card density parity slice
- Grounded the next storefront template fix in EB COMPACT screenshot evidence and current FPB CSS.
- Real source gap: COMPACT overrides the product grid to 220px columns, but generic icon-mode card/image rules still force 300px cards and 284px images.
- Moved COMPACT card/image/content sizing into a tiny runtime stylesheet injected only for the COMPACT preset so the Shopify app-block CSS asset stays under the 100,000 byte limit.
- Bumped widget version to `2.9.29`, rebuilt widget bundles, regenerated CSS assets, and verified `node --check app/assets/bundle-widget-full-page.js`.
- Lint command completed with 0 errors; both changed JS files are ignored by the current ESLint ignore patterns.

### 2026-06-02 01:21 - Goal started and fast-track architecture initiated
- User set the active goal to 100% EB storefront parity for FPB and PPB.
- Stage 1 requirements are fast-tracked from existing EB evidence docs instead of re-researching known behavior.
- Live SIT evidence confirmed PPB already loads through the product page app block and initialized widget container, while FPB marker hydration is a separate full-page issue.
- Next: implement in small template/contract slices, with e2e proof after each template.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md
- docs/issues-prod/eb-complete-configure-e2e-audit-1.md
- docs/issues-prod/select-template-1.md
- docs/eb-storefront-parity/02-architecture.md

## Phases Checklist
- [ ] Phase 1 - FPB storefront bootstrap and config contract
- [ ] Phase 2 - FPB templates: DEFAULT, CLASSIC, COMPACT, HORIZONTAL
- [ ] Phase 3 - PPB storefront bootstrap and config contract
- [ ] Phase 4 - PPB templates: CASCADE, COGNIVE, MODAL, SIMPLIFIED
- [ ] Phase 5 - Cart payload/metafield parity for FPB and PPB
- [ ] Phase 6 - Final desktop/mobile e2e parity pass

### 2026-06-02 01:32 - FPB proxy API category DTO gap patched
- SIT FPB bootstrap smoke passed: marker hydrated, FPB CSS/JS requested, bundle JSON fetched, view tracking fired.
- Found next storefront gap: `/apps/product-bundles/api/bundle/{id}.json` returned the step with `categoriesLen: 0`, causing "No products available in this step".
- Root cause: public bundle API loaded `StepProduct` but did not include ordered `StepCategory`, while the formatter emits category runtime data from `step.StepCategory`.
- Patched the API loader to include ordered `StepCategory` and added focused route coverage plus `test-spec/fpb-storefront-category-api.spec.md`.
- Next: run focused verification, commit, deploy, then re-smoke FPB storefront JSON/render.

### 2026-06-02 01:36 - FPB proxy API category DTO verification passed
- Added focused test coverage proving the public bundle API query loads ordered `StepCategory` rows along with `StepProduct`.
- Verification passed: `npx jest tests/unit/routes/api.bundle.free-gift.test.ts --runInBand`.
- Verification passed: `npx eslint --max-warnings 9999 'app/routes/api/api.bundle.$bundleId[.]json.tsx' tests/unit/routes/api.bundle.free-gift.test.ts` with 0 errors.

### 2026-06-02 01:40 - FPB storefront category smoke passed on SIT/dev proxy
- Live storefront JSON now returns two categories for bundle `cmpfhj2m10000v0t038osl42y`, with product-backed category entries.
- Reloaded FPB page and confirmed `#bundle-builder-app` initializes with FPB `DEFAULT` markers and product cards render.
- Confirmed `No products available in this step.` is no longer present.
- Network proof: FPB page document 200, FPB CSS/JS 200, bundle JSON 200, storefront-products hydration 200, view tracking 200.
- Remaining non-goal-complete work: template-by-template visual parity and cart/metafield e2e for FPB and PPB.

### 2026-06-02 01:43 - FPB DEFAULT category tab parity slice started
- Existing EB select-template evidence shows FPB DEFAULT category tabs are text-only underline tabs, while WPB renders filled/outlined pills.
- Scope this slice to the DEFAULT preset only so CLASSIC/COMPACT/HORIZONTAL pill-style category tabs are not regressed.
- Patched raw FPB CSS with a `data-fpb-design-preset=DEFAULT` scoped underline-tab treatment.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: FPB CSS/JS 200, bundle JSON 200, product hydration 200, view tracking 200.
- Computed style proof: active category tab has transparent background, `0px` radius, and `3px solid rgb(0, 0, 0)` bottom border; inactive category tab is transparent with transparent bottom border.

### 2026-06-02 01:50 - FPB DEFAULT page background parity slice started
- Existing EB select-template evidence shows FPB DEFAULT uses a light gray page background, while WPB computes white on both `body` and `#bundle-builder-app`.
- Chrome ancestor inspection shows the widget ancestors are transparent up to `body`, so the narrow fix is a DEFAULT-scoped body/root background rule.
- Patched raw FPB CSS with `body:has([data-fpb-design-preset=DEFAULT])` and root background rules.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: body and `#bundle-builder-app` both compute to `rgb(241, 241, 241)`.
- Regression check: FPB DEFAULT category tabs still compute as transparent text tabs with active `3px solid rgb(0, 0, 0)` bottom border.

### 2026-06-02 02:00 - FPB full-bleed storefront layout slice started
- Existing EB DEFAULT evidence shows a broad full-page content/sidebar layout, while WPB's marker-rendered widget is constrained by the theme page content to `672px`.
- Chrome probe with a temporary full-bleed root rule expanded the FPB root to viewport width, content to `842px`, and sidebar to `366px` without changing PPB.
- Scope this slice to the FPB widget root via `data-bundle-type=full_page`; product card sizing remains a separate gap because `fpbCardCtaMode=icon` still forces compact cards.
- Patched raw FPB CSS with a `data-bundle-type=full_page` full-bleed root rule.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit after selector compaction.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: temporary probe style absent, FPB root width `1512px`, content width `842px`, sidebar width `366px`.
- Network proof: FPB CSS 200, FPB bundled JS 200, bundle JSON 200, storefront product hydration 200, view tracking 200.
- Regression check: DEFAULT background remains `rgb(241, 241, 241)` and active category tab remains transparent with `3px solid rgb(0, 0, 0)` bottom border.

### 2026-06-02 02:12 - FPB desktop product card sizing slice started
- Existing EB DEFAULT evidence shows two larger product cards in the left content area; Chrome computed WPB as four `182px` desktop columns with `166px` images.
- Local CSS inspection found the desktop `fpbCardCtaMode=icon` rule hardcodes `repeat(4, 182px)`, `182px` cards, and `166px` product images.
- Scope this slice to replacing the existing desktop compact-card dimensions with two larger cards; mobile rules are left unchanged.
- Patched raw FPB CSS and generated CSS to use two `300px` desktop columns with `284px` product images.
- Chrome initially showed Shopify's dev CSS CDN stayed on the previous 99,995-byte revision even after the local generated CSS changed to the larger-card constants.
- Forced a byte-distinct generated CSS asset under the Shopify 100,000 byte limit; subsequent Chrome reload served the updated CSS.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: grid computes to `300px 300px`, first product card computes to `300px x 420px`, first product image computes to `284px x 284px`.
- Network proof: FPB CSS 200, FPB bundled JS 200, bundle JSON 200, storefront product hydration 200.

### 2026-06-02 02:32 - FPB sidebar tier CTA slice started
- Existing EB DEFAULT evidence shows a prominent black sidebar tier CTA with merchant text such as `Box of 2` and discount subtext above the progress messaging.
- Current WPB sidebar only shows discount messaging/progress and a narrow action button.
- Live storefront JSON already carries the EB-style source data at `pricing.messages.displayOptions.bundleQuantityOptions.optionsByRuleId`, including `label: "Box of 2"` and `subtext: "₹5 off"`.
- Scope this slice to rendering that consumed JSON as a black sidebar tier CTA; no merchant-facing fallback copy will be fabricated when option text is absent.
- Implemented `createSidebarTierCta(nextRule)` in the FPB widget using `bundleQuantityOptions.optionsByRuleId` first and `tierTextByRuleId` second, with no fabricated fallback copy.
- Bumped `WIDGET_VERSION` to `2.9.15` and rebuilt widget assets with `npm run build:widgets`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js` returned 0 errors; both files are ignored by ESLint and reported warnings only.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check scripts/build-widget-bundles.js`.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: served JS contains `createSidebarTierCta`, live `window.__BUNDLE_WIDGET_VERSION__` is `2.9.15`, and `.fpb-sidebar-tier-cta` renders `Box of 2` / `₹5 off`.
- Computed style proof: CTA width `326px`, black background, white text, black border, `8px` radius, centered text.
- Next gap observed: clicking `Add To Box` did not populate the sidebar selected product rows; handle selected-item/sidebar thumbnail parity as the next slice.

### 2026-06-02 02:45 - FPB selected-item variant fallback slice started
- Chrome click proof showed `Add To Box` fires but is blocked by `This item is out of stock.` and the sidebar stays at `0 items`.
- Public `/api/storefront-products` response for the FPB fixture returns products with empty `variants` arrays, so the widget has no sellable variant ID and treats cards as unavailable.
- Existing EB rewrite evidence documents this stock-gate class: sellable Storefront variants must not be blocked when inventory details are missing or zero, and selected-state sidebar proof depends on usable variant data.
- Scope this slice to the storefront-products DTO source: include a non-inventory first-variant fallback in the main product query and use it when paginated variant hydration fails, instead of returning `variants: []`.
- Patched `api.storefront-products` to include `variants(first: 1)` in the main product query and map that fallback variant when `fetchAllVariants` fails.
- Live API proof: `/apps/product-bundles/api/storefront-products` now returns fallback variants for the FPB fixture; unavailable first product remains unavailable, while second and third products return available variant IDs.
- Verification passed: `npx eslint --max-warnings 9999 app/routes/api/api.storefront-products.tsx` returned 0 errors and warnings only.
- Chrome storefront smoke: after reload, the visible available card uses variant ID `48191701188867`; clicking `Add To Box` selects it, sidebar changes to `1 item`, renders the product thumbnail/title/price row, removes skeleton rows, and enables the action button.

### 2026-06-02 03:02 - FPB sidebar action button width slice started
- EB DEFAULT evidence shows a wider, more prominent black sidebar action button in the bottom total/action row.
- Current selected WPB sidebar action row computes to `174px 140px`, with the button only `140px` wide.
- Scope this slice to CSS sizing only: widen the existing action column/button without changing Add to Cart vs Next behavior.
- Patched the existing sidebar action CSS to reserve a `198px` action column and `198px` CTA min-width.
- Generated minified storefront CSS with `npm run minify:assets css`; local generated full-page CSS is under Shopify's 100,000 byte limit.
- Chrome selected-state smoke: after selecting the available card, the action row computes to `116px 198px`, button width computes to `198px`, and the sidebar still shows the selected product row/thumbnail.

### 2026-06-02 03:18 - FPB DEFAULT product price visibility slice started
- Existing EB DEFAULT evidence says product card prices are not shown, while CLASSIC/COMPACT/HORIZONTAL show prices.
- Current Chrome proof after the variant fallback shows DEFAULT product cards rendering compare-at and final prices.
- Scope this slice to CSS hiding product-card price rows only when `data-fpb-design-preset=DEFAULT`; sidebar totals and selected-row prices remain visible.

### 2026-06-02 03:19 - FPB fixed-amount discount message currency slice started
- Chrome selected-state proof showed the FPB sidebar message rendering `$5.00` while the consumed pricing DTO already carries EB-style merchant display text: `bundleQuantityOptions.optionsByRuleId[ruleId].subtext` = `₹5 off`.
- Existing EB reference confirms discount messaging is template-driven via `{{discountValue}}` and `{{discountValueUnit}}`, with compact storefront discount data mirrored from the admin configuration.
- Scope this slice to discount variable generation: prefer rule-bound DTO display text for fixed-amount reward variables, without hardcoding currency symbols or merchant-facing copy.
- Implemented shared `TemplateManager` logic to derive fixed-amount reward variables from rule-bound `bundleQuantityOptions` / `tierTextByRuleId` text before falling back to storefront currency formatting.
- Bumped `WIDGET_VERSION` to `2.9.17` and rebuilt storefront bundles with `npm run build:widgets`.
- Verification passed: `node --check app/assets/widgets/shared/template-manager.js`, `node --check scripts/build-widget-bundles.js`, and modified-file ESLint with 0 errors.
- Local runtime proof: a fixed-amount rule with DTO subtext `₹5 off` now renders `Add 1 product(s) to save ₹5!` even when `currencyInfo.display.symbol` is `$`.
- Chrome DevTools page listing timed out twice at 120 seconds, so live Chrome e2e for this slice is still pending and must be retried when the DevTools connection recovers.
- CSS-only hiding exceeded Shopify's 100,000 byte full-page CSS limit, so the final patch removes `.product-price-row` while rendering FPB DEFAULT product cards instead.
- Bumped `WIDGET_VERSION` to `2.9.16` and rebuilt widget assets with `npm run build:widgets`; CSS minification also passed.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js` returned 0 errors and ignore-pattern warnings only.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: served widget version is `2.9.16`, visible DEFAULT product card text is `2024 Summer Slides / Add To Box` with `0` price rows, and selected sidebar still shows product row price plus total after adding the card.

### 2026-06-02 03:34 - FPB CLASSIC evidence-backed layout slice started
- Current EB CLASSIC screenshot evidence shows a gray full-page background and no product search box above category pills.
- Existing WPB CLASSIC screenshot showed a white page and a visible search box, while DEFAULT had already been moved to a gray background.
- Patched the FPB storefront CSS background selector to apply the gray page background to every FPB design preset marker, not just DEFAULT.
- Patched full-page sidebar rendering so `FBP_SIDE_FOOTER` presets do not render the product search box.
- Built widget assets with `npm run build:widgets` and generated CSS with `npm run minify:assets css`; full-page CSS output stayed under Shopify's 100,000 byte limit.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/widgets/shared/template-manager.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/shared/template-manager.js scripts/build-widget-bundles.js` returned 0 errors and ignore-pattern warnings only.
- Admin e2e: opened Select Template for FPB bundle `cmpfhj2m10000v0t038osl42y`, selected Classic Design, and advanced to the preview-ready modal state.
- Storefront e2e: public bundle JSON returned `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "CLASSIC"`; runtime markers matched `CLASSIC`, bundle-scoped search was absent, body/root backgrounds computed `rgb(241, 241, 241)`, product-card prices rendered, and `.fpb-sidebar-tier-cta` rendered `Box of 2` / `₹5 off`.
- Interaction smoke: clicking an available CLASSIC product populated the sidebar selected row, updated the count to `1 item`, showed `Total $5.00`, and enabled `Add to Cart`.

### 2026-06-02 03:58 - FPB COMPACT grid parity slice started
- Current EB COMPACT screenshot evidence shows a compact two-column portrait product grid beside the sidebar.
- Existing WPB COMPACT screenshot showed oversized single-column cards, and the CSS forced `grid-template-columns: 1fr` for the COMPACT preset.
- Patched the COMPACT desktop grid rule to render two compact columns with tighter spacing.
- Generated CSS with `npm run minify:assets css`; full-page CSS output stayed under Shopify's 100,000 byte limit.
- Admin e2e: reopened Select Template for FPB bundle `cmpfhj2m10000v0t038osl42y`, selected Compact Design, and submitted through the preview-ready modal flow.
- Storefront e2e: public bundle JSON returned `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "COMPACT"`; runtime markers matched `COMPACT`, bundle-scoped search was absent, body/root backgrounds computed `rgb(241, 241, 241)`, grid computed `220px 220px` with `12px` gap, product-card prices rendered, and `.fpb-sidebar-tier-cta` rendered `Box of 2` / `₹5 off`.
- Interaction smoke: clicking an available COMPACT product populated the sidebar selected row, updated the count to `1 item`, and enabled `Add to Cart`.

### 2026-06-02 04:18 - FPB HORIZONTAL tab parity slice started
- Current EB HORIZONTAL screenshot evidence shows text category tabs with an underline active state, not filled pill tabs.
- Existing WPB HORIZONTAL screenshot showed pill category tabs.
- Patched the HORIZONTAL preset to reuse the FPB underline tab treatment while keeping the horizontal product-card layout.
- Added runtime `data-fpb-tab-style` markers so DEFAULT and HORIZONTAL use underline tabs while CLASSIC and COMPACT keep pill tabs.
- Bumped `WIDGET_VERSION` to `2.9.18`, rebuilt widget bundles with `npm run build:widgets`, and regenerated CSS with `npm run minify:assets css`.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js`, `node --check scripts/build-widget-bundles.js`, and modified-file ESLint with 0 errors and ignore-pattern warnings only.
- Chrome storefront read-only proof: current live FPB bundle remains COMPACT (`data-fpb-design-preset="COMPACT"`), so HORIZONTAL browser proof is still pending.
- Admin e2e blocker: the SIT embedded app iframe currently returns Cloudflare `Error 1016 Origin DNS error` for the dev tunnel, preventing template switching through Select Template.

### 2026-06-02 09:46 - PPB SIMPLIFIED modal product-loading slice started
- Chrome storefront proof shows the PPB app block now renders on `WPB Complete Audit Product Page 2026-05-25` with `data-ppb-template-type="PDP_MODAL"` and `data-ppb-design-preset="SIMPLIFIED"`.
- Clicking the visible `Product 1` slot opens the modal, but the modal shows `Could not load products. Please check your connection and try again.`
- Root-cause candidate: PPB `resolveStorefrontApiBase()` falls back to the shop origin when `window.Shopify.shop` is absent and `window.__BUNDLE_APP_URL__` is null, producing `/api/storefront-products` instead of EB-aligned app-proxy data loading via `/apps/product-bundles/api/storefront-products`.
- Scope this slice to align PPB storefront data fetches with the app-proxy API strategy already used by FPB.

### 2026-06-02 10:04 - PPB SIMPLIFIED modal product-loading app-proxy fix prepared
- Updated PPB storefront widget API base resolution so missing `window.__BUNDLE_APP_URL__` now uses Shopify app-proxy paths instead of shop-origin `/api/...` paths.
- Rebuilt widget bundles with `WIDGET_VERSION=2.9.19`; generated PPB bundled asset contains the same app-proxy fallback.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, and modified-file ESLint with 0 errors and ignore-pattern warnings only.
- Chrome storefront retry after reload still shows the old product-loading error modal; live asset proof is pending until the Shopify extension/CDN serves the rebuilt `2.9.19` widget.
- Follow-up Chrome proof after live `2.9.19` served: the modal now requests `/apps/product-bundles/api/storefront-products`; the API returns `200` with the configured product DTO, but the widget still shows the load error because the only returned variant is unavailable and PPB filters it into an empty list.
- Patched PPB product normalization so unavailable configured products remain visible as out-of-stock cards instead of becoming a false product-loading failure.
- Patched PPB stock lookup so `available:false` from the Storefront DTO disables the card as out of stock even when `quantityAvailable` is null.
- Rebuilt widget bundles and re-smoked live PPB after SIT served the new extension asset path: SIMPLIFIED computes to a single 345px slot column, clicking the slot opens the modal, `fetchErrorVisible=false`, and the configured product renders in the product grid.
- Chrome storefront proof on live widget `2.9.20`: SIMPLIFIED modal product card renders `Out of stock`, card class includes `is-out-of-stock`, CTA text is `OUT OF STOCK`, CTA is disabled, and the product hydration request uses `/apps/product-bundles/api/storefront-products`.

### 2026-06-02 10:17 - PPB SIMPLIFIED slot-grid CSS parity slice started
- EB reference confirms MODAL and SIMPLIFIED both use `PDP_MODAL`; MODAL is a 3-column mini-slot grid and SIMPLIFIED is a single-column full-width slot row.
- Live Chrome proof on the SIT PPB page shows `data-ppb-design-preset="SIMPLIFIED"` but computed `.bw-ppb-modal-slot-grid` remains `104.32px 104.32px 104.32px`.
- Root cause: `.bw-ppb-modal-slot-grid--simplified` is declared before the base `.bw-ppb-modal-slot-grid`, so the base grid rule wins.
- Scope this slice to increase SIMPLIFIED selector specificity/order without changing MODAL behavior.

### 2026-06-02 10:29 - PPB SIMPLIFIED slot-grid CSS parity fix prepared
- Added a high-specificity SIMPLIFIED grid override after the base PPB modal grid so SIMPLIFIED resolves to one column while MODAL stays three columns.
- Added SIMPLIFIED empty-slot row overrides after the base modal empty-card styles so EB's label-left/icon-right short row can win after minification.
- Bumped `WIDGET_VERSION` to `2.9.20`, rebuilt widget bundles, and minified CSS assets.
- Verification passed: `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, `npm run minify:assets css`, and `npx eslint --max-warnings 9999 scripts/build-widget-bundles.js` with 0 errors and an ignore-pattern warning only.
- Chrome storefront reload still serves the older Shopify CDN stylesheet; computed SIMPLIFIED grid remains `104.32px 104.32px 104.32px`, so live e2e proof is pending after SIT deploy/CDN propagation.

### 2026-06-02 10:54 - PPB MODAL/SIMPLIFIED empty-slot visual parity slice started
- EB screenshot evidence shows PDP modal empty slots render a visual placeholder block with the label, not a standalone plus icon.
- Live consumed PPB JSON has no slot image fields on the fixture, so the empty visual must use the widget styling fallback unless a merchant image URL is present.
- Patched PPB modal empty cards to render `.bw-slot-card__empty-visual`; non-modal empty cards keep the previous plus icon.
- Patched SIMPLIFIED CSS so the empty row uses label-left and visual-right layout with a taller EB-like row.
- Chrome storefront proof on live widget `2.9.21`: `data-ppb-template-type="PDP_MODAL"`, `data-ppb-design-preset="SIMPLIFIED"`, slot card computes `345px x 100px`, dashed black border, label left, and right visual block computes `76px x 76px` with salmon background.
- Bumped `WIDGET_VERSION` to `2.9.21`, rebuilt widget bundles, and minified CSS assets.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, `npm run minify:assets css`, and modified-file ESLint with 0 errors and ignore-pattern warnings only.

### 2026-06-02 10:09 - PPB MODAL empty-slot visual parity slice started
- Ground truth: `internal docs/EB Implementation Reference.md` confirms PPB `PDP_MODAL` + `MODAL` and `SIMPLIFIED` share the same modal widget path, with visual differences driven by CSS/classing.
- EB screenshot evidence: `docs/select-template/eb-ppb-modal-storefront.png` shows a narrow vertical dashed slot with a salmon visual block above the `Product 1` label.
- Planned change: patch PPB modal-slot CSS only, keeping SIMPLIFIED's horizontal row override separate.

### 2026-06-02 10:13 - PPB CASCADE/COGNIVE in-page product rendering implemented
- EB ground truth: `PDP_INPAGE` dispatches to the CASCADE renderer for both Product List and Product Grid; COGNIVE is a CSS variant of the same inline product renderer.
- Current WPB code path rendered slot state cards for product-page bundles instead of inline product cards when the template type is `PDP_INPAGE`.
- Patched PPB `PDP_INPAGE` layout to load the same Storefront DTOs and render selectable products inline, reusing existing product selection handlers.
- Patched CASCADE CSS toward compact row cards and COGNIVE CSS toward three-column square image product cards.
- Bumped `WIDGET_VERSION` to `2.9.22` and rebuilt widget/CSS assets.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, and `npm run minify:assets css`.
- Modified-file ESLint returned 0 errors and ignored-file warnings only.
- Live CASCADE/COGNIVE e2e remains pending until the PPB fixture is switched from the current `PDP_MODAL`/`SIMPLIFIED` live template to `PDP_INPAGE`.

### 2026-06-02 10:09 - PPB MODAL empty-slot visual parity fix prepared
- Changed PPB `PDP_MODAL` base slot CSS to match EB's MODAL screenshot: narrow vertical dashed card, salmon visual block, and label below the visual.
- Kept the existing `SIMPLIFIED` horizontal row override separate so Vertical Slots continue to render as the EB SIMPLIFIED row.
- Ran `npm run minify:assets css`; generated `extensions/bundle-builder/assets/bundle-widget.css` from the raw product-page widget CSS.
- Ran `npx eslint --max-warnings 9999 app/assets/widgets/product-page-css/bundle-widget.css`; ESLint reported the CSS file is ignored by config and produced 0 errors.
- Chrome Admin e2e switching is currently blocked: the SIT embedded app iframe loads `chrome-error://chromewebdata/` and reports the Cloudflare origin refused to connect. Storefront MODAL smoke must be rerun after the dev preview origin is healthy or after the next SIT deploy.

### 2026-06-02 10:18 - PPB in-page category tabs slice started
- Ground truth: EB PPB CASCADE and COGNIVE screenshots show category tabs inside the in-page widget before products.
- Live WPB storefront config proof: the PPB fixture has one step with two `categories`, so tabs must be rendered from step categories rather than separate step sections.
- Planned change: add in-page category tab rendering and filter product cards to the active category while preserving the existing app-proxy product loader and DTO shape.

### 2026-06-02 10:17 - PPB modal slot orientation JSON contract slice started
- EB ground truth: `PDP_MODAL` uses the modal widget path for both Horizontal Slots and Vertical Slots, while consumed runtime JSON exposes `renderFilledSlotsAsHorizontalStacked` to drive selected-slot orientation.
- Current WPB widget coupled vertical slot layout to `templateId: SIMPLIFIED`; this is weaker than EB's consumed-JSON contract.
- Added RED tests/spec for the shared template-runtime helper, formatted bundle JSON, product metafield sync payload, widget source contract, CSS orientation selector, and duplicated in-page quantity button regression.
- Implementation target: expose `renderFilledSlotsAsHorizontalStacked` in PPB runtime JSON/metafields and make the widget read that field for modal slot orientation.

### 2026-06-02 10:18 - PPB in-page category tabs fix prepared
- Added EB-style in-page category tabs for PPB `PDP_INPAGE` templates, derived from `step.categories` in the existing storefront DTO.
- Active tab now filters visible product cards to that category's configured product IDs while preserving the existing app-proxy product fetch and normalized `stepProductData` cache.
- Added scoped CASCADE/COGNIVE tab styles matching EB's active black pill and inactive outlined pill layout.
- Bumped widget version to `2.9.23` and ran `npm run build:widgets && npm run minify:assets css`.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js` and `node --check scripts/build-widget-bundles.js`.
- Modified-file ESLint returned 0 errors and ignored-file warnings only for widget/script files.
- Live CASCADE/COGNIVE e2e remains pending because the Admin iframe is currently refusing the Cloudflare origin and the live storefront is still serving widget `2.9.21`.

### 2026-06-02 10:18 - PPB modal slot orientation JSON contract fix prepared
- Completed server/runtime JSON parity for EB's `renderFilledSlotsAsHorizontalStacked` modal-slot orientation field.
- Added the field to formatted widget JSON and bundle product metafield sync so Admin saves and storefront consumed JSON stay aligned.
- Added TDD coverage and `test-spec/ppb-modal-slot-orientation.spec.md` for the orientation contract.
- Verification passed: `npx jest tests/unit/lib/bundle-config-contracts.test.ts tests/unit/lib/bundle-formatter.test.ts tests/unit/routes/ppb-select-template-metafield-sync.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` (4 suites, 73 tests).
- ESLint on modified DTO/metafield/test files returned 0 errors and pre-existing warnings only.

### 2026-06-02 10:17 - PPB modal slot orientation JSON contract implemented
- Added shared template-runtime mapping for EB's `renderFilledSlotsAsHorizontalStacked` PPB modal slot orientation field.
- Added the field to formatted bundle JSON and product metafield sync payloads so PPB metafield/API config exposes the consumed JSON flag.
- Updated the PPB widget to set `data-ppb-slot-orientation` from `renderFilledSlotsAsHorizontalStacked` and key vertical slot layout from that orientation marker instead of coupling CSS to `templateId: SIMPLIFIED`.
- Confirmed the PPB in-page product renderer contains a single quantity increase button in its card markup.
- Bumped `WIDGET_VERSION` to `2.9.23`, rebuilt widget assets, and minified CSS assets.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, focused Jest for bundle config contracts, bundle formatter, PPB select-template metafield sync, and product-page widget source contracts, `npm run build:widgets`, `npm run minify:assets css`, and modified-file ESLint with 0 errors.
- Live modal-orientation e2e remains pending until the rebuilt widget is deployed to SIT and the PPB product metafield is rewritten through Select Template or bundle sync.

### 2026-06-02 10:18 - PPB configure save/sync orientation contract fix prepared
- Extended the PPB configure handler's save and sync bundle configuration builders to emit `renderFilledSlotsAsHorizontalStacked` from the EB template mapping.
- Kept template resolution data-driven from `bundleDesignTemplate` + merchant-selected `bundleDesignPresetId` instead of hardcoded template names.
- Generated storefront assets already reflect the widget/CSS orientation contract and are included with this slice.

### 2026-06-02 10:26 - PPB in-page category tabs contract coverage started
- Live storefront proof still shows widget `2.9.21`; source-side parity coverage continues while deployed e2e is pending.
- Planned change: add focused tests/spec that PPB in-page templates render category tabs from `step.categories`, track active tab state, and filter products by active category.

### 2026-06-02 10:26 - PPB in-page category tabs contract coverage completed
- Added `test-spec/ppb-inpage-category-tabs.spec.md` for the EB PPB in-page category tab contract.
- Added widget source/CSS contract coverage that verifies category tabs are rendered from `step.categories`, active category state is tracked, products are filtered by category product IDs, and active tabs use EB-style black/white states.
- Verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` (25 tests).
- ESLint on the modified test file returned 0 errors and existing warnings only.

### 2026-06-02 10:27 - PPB multipart cart API parity slice started
- EB ground truth: PPB posts selected component lines to `/cart/add` as multipart form fields, while FPB posts JSON to `/cart/add.js`.
- Current WPB PPB storefront widget still posts JSON to `/cart/add.js`, which diverges from EB's PPB Cart Transform `OVERWRITE_LINE_ITEM` flow.
- Scope: change only PPB storefront add-to-cart transport to EB-style multipart `/cart/add` fields while preserving existing selected component DTOs and line properties.

### 2026-06-02 10:26 - PPB multipart cart-add spec reconciled
- Confirmed current PPB widget source posts EB-style multipart `FormData` to `/cart/add` and keeps FPB on JSON `/cart/add.js`.
- Confirmed `tests/unit/assets/bundle-widget-product-page-init.test.ts` already covers the PPB multipart field contract.
- Added the missing `test-spec/ppb-multipart-cart-add.spec.md` to keep the required TDD spec artifact with the existing source/test contract.

### 2026-06-02 10:27 - PPB multipart cart API parity implemented
- Updated PPB storefront `addToCart()` to submit multipart `FormData` to `/cart/add`, matching EB's PPB cart transport.
- Added explicit EB field names for `items[index][id]`, `items[index][quantity]`, `items[index][properties][Box]`, `items[index][properties][_easyBundle:OfferId]`, and `items[index][properties][_easyBundle:prodQty]`.
- Preserved existing private `_bundle_id` grouping properties so the current WPB Cart Transform path does not regress while PPB transport moves toward EB.
- Bumped `WIDGET_VERSION` to `2.9.24`, rebuilt widget assets, and minified CSS assets.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts`, `npm run build:widgets`, `npm run minify:assets css`, and modified-file ESLint with 0 errors.
- Live cart/network e2e remains pending until SIT serves the rebuilt widget and Chrome access is stable.

### 2026-06-02 10:32 - PPB multipart cart-add implementation committed
- Implemented EB-aligned PPB cart-add transport in the product-page widget: `FormData` POST to `/cart/add` instead of JSON `/cart/add.js`.
- Added multipart fields for `items[index][id]`, `items[index][quantity]`, `items[index][properties][Box]`, `items[index][properties][_easyBundle:OfferId]`, and `items[index][properties][_easyBundle:prodQty]`.
- Kept FPB widget cart-add transport unchanged on JSON `/cart/add.js`.
- Bumped `WIDGET_VERSION` to `2.9.24` and rebuilt widget bundles.
- Verification passed: `npm run build:widgets`, `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, and `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` (27 tests).
- ESLint returned 0 errors with ignored-file/existing warnings only.

### 2026-06-02 10:33 - FPB/PPB EB cart-line property DTO slice started
- EB ground truth: FPB and PPB cart component lines send `Box`, `_bundleName`, `_easyBundle:prodQty`, and `_easyBundle:OfferId`; step/category details are client-only and not sent to cart.
- Current WPB widgets still send private `_step_index` and FPB sends `_step_name`; these diverge from EB cart DTOs.
- Scope: add EB public cart properties to FPB and PPB line payloads and remove step attribution from cart properties, while retaining `_bundle_id` and `_bundle_display_properties` for the current WPB Cart Transform until the transform itself is migrated.

### 2026-06-02 10:36 - Bundle details cart metafield parity slice started
- EB reference confirms FPB and PPB both merge a `bundle_details` cart metafield through the Storefront API around cart add.
- Current WPB widgets send EB-style `_easyBundle:OfferId` line properties but do not write the accumulated `bundle_details` cart metafield.
- Live Storefront API probing showed cart metafield access is currently denied, and app config is missing Storefront cart access scopes.
- Scope: add required storefront cart scopes and implement non-fatal EB-style `bundle_details` merge for both FPB and PPB widgets.

### 2026-06-02 10:37 - FPB/PPB EB cart-line property DTO slice completed
- Aligned FPB cart JSON public line properties with EB evidence: `Box`, `_bundleName`, `_easyBundle:prodQty`, `_easyBundle:OfferId`.
- Aligned PPB multipart cart form properties with EB evidence while preserving private `_bundle_id` needed by the current Cart Transform grouping.
- Removed step attribution from storefront cart payloads for this slice (`_step_index` / `_step_name` are no longer emitted in the touched FPB/PPB cart paths).
- Bumped storefront widget version to `2.9.25` and rebuilt widget deploy assets.
- Verification: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js && npx jest tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` passed with 29 tests.
- Verification: `npm run build:widgets` completed and regenerated FPB/PPB bundled widget assets.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` completed with 0 errors and warnings only.
- Graph: default `python3` could not import `graphify`; reran with `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python` and graph rebuild completed.

### 2026-06-02 10:39 - Bundle details cart metafield parity implemented
- Added Storefront cart read/write scopes to PROD and SIT app configs so delegated Storefront tokens can access cart metafields after deploy/reauthorization.
- Implemented EB-style `bundle_details` merge helpers in both FPB and PPB storefront widgets using `GetCartMetafield` plus `cartMetafieldsSet` with the default app-reserved key `bundle_details`.
- FPB now syncs `bundle_details` after successful JSON `/cart/add.js`; PPB syncs before multipart `/cart/add`, matching EB's observed sequencing.
- Sync failures are intentionally non-fatal so stores that have not reauthorized the new scopes still complete cart add.
- Added `test-spec/bundle-details-cart-metafield.spec.md` and expanded widget source-contract tests for FPB/PPB cart metafield behavior and app scopes.
- Bumped `WIDGET_VERSION` to `2.9.25` and rebuilt storefront widget assets.
- Verification passed: `npm run build:widgets`.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx jest tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` (28 tests).
- Verification passed: modified-file ESLint returned 0 errors with ignored-file/existing warnings only.
- Live e2e remains pending until SIT deploy/reauthorization refreshes the new Storefront cart scopes and serves widget `2.9.25`.

### 2026-06-02 10:52 - Cart `bundle_details` metafield route fix started
- EB ground truth: both FPB and PPB merge `{offerId}_{sessionKey}` entries into the cart `bundle_details` JSON metafield after each add flow.
- Current WPB gap: widgets attempt direct Storefront GraphQL at `/api/{version}/graphql.json` without a Storefront access token, so the token-bearing cart metafield operation is expected to fail on storefront.
- Scope: replace direct widget GraphQL with one signed app-proxy route that reads and writes the same `bundle_details` Storefront API metafield server-side using the stored Storefront access token.
- Test plan: route unit coverage for signed request, merge behavior, invalid signature, and widget source tests for FPB/PPB proxy calls.

### 2026-06-02 11:02 - Cart `bundle_details` metafield route fix completed
- Added signed app-proxy route `/apps/product-bundles/api/cart-bundle-details` to merge EB-style cart `bundle_details` entries server-side with the stored Storefront access token.
- Replaced FPB and PPB widget direct tokenless Storefront GraphQL calls with app-proxy POSTs carrying only `cartToken`, `{offerId}_{sessionKey}` key, and display properties.
- Preserved EB key semantics: `_easyBundle:OfferId` remains `{offerId}_{sessionKey}_{itemIndex}`, while `bundle_details` stores under `{offerId}_{sessionKey}`.
- Updated API navigation map and bumped widget version to `2.9.26`.
- Verification: Storefront GraphQL `cart(id).metafields(identifiers: [{ key: "bundle_details" }])` query and `cartMetafieldsSet` mutation were validated with Shopify MCP.
- Verification: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js && npx jest tests/unit/routes/cart-bundle-details.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` passed with 37 tests.
- Verification: `npm run build:widgets` completed and regenerated FPB/PPB bundled widget assets.
- Verification: modified-file ESLint completed with 0 errors and warnings only.
- Graph: `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` completed; graph output changed but remains unstaged with prior graph working-tree drift.

### 2026-06-02 11:18 - Cart `bundle_details` hardening follow-up started
- Current worktree contains useful post-commit hardening for the EB cart metafield route: widgets now require `{ ok: true }` from the proxy route, and the route creates a Storefront access token on-demand when the offline session lacks one.
- Scope: validate and commit those hardening changes with focused route/source tests, widget rebuild, and version bump.
- Added focused route coverage for on-demand Storefront token creation and widget source coverage for checking the proxy route response body.
- Rebuilt FPB/PPB widget bundles at `WIDGET_VERSION=2.9.26`.
- Verification passed: `npm run build:widgets`.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx jest tests/unit/routes/cart-bundle-details.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts --runInBand` (38 tests).
- Verification passed: modified-file ESLint returned 0 errors with warnings only.

### 2026-06-02 11:23 - Cart `bundle_details` hardening follow-up completed
- Widgets now parse the cart-bundle-details proxy response and treat anything other than `{ ok: true }` as a non-fatal sync failure, instead of accepting any 2xx response.
- The proxy route now creates a Storefront access token on-demand when the offline session has an Admin access token but no stored Storefront token, matching the existing storefront product hydration route practice.
- Bumped storefront widget version to `2.9.27` and rebuilt generated widget deploy assets.
- Verification: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js` passed.
- Verification: `npx jest tests/unit/routes/cart-bundle-details.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` passed with 38 tests.
- Verification: `npx eslint --max-warnings 9999 app/routes/api/api.cart-bundle-details.tsx app/assets/bundle-widget-full-page.js app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js tests/unit/routes/cart-bundle-details.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` completed with 0 errors and warnings only.

### 2026-06-02 11:36 - EB OfferId Cart Transform grouping slice started
- EB ground truth: component cart lines are identified by `_easyBundle:OfferId` in `{offerId}_{sessionKey}_{itemIndex}` format and display name comes from `_bundleName`.
- Current WPB gap: Cart Transform still queried/grouped by private `_bundle_id`, and FPB/PPB widget cart payloads still emitted that private attribute.
- Scope: migrate Function input/grouping to `_easyBundle:OfferId` base, use `_bundleName`, remove `_bundle_id`/`_bundle_name` from touched FPB/PPB component line payloads, update internal docs, and rebuild widgets.

### 2026-06-02 11:45 - EB OfferId Cart Transform grouping slice completed
- Cart Transform input now reads EB public cart attributes: `_easyBundle:OfferId` and `_bundleName`.
- Merge grouping now derives the bundle instance from the `_easyBundle:OfferId` base, for example `MIX-894502_K1K_1` and `MIX-894502_K1K_2` merge as `MIX-894502_K1K`.
- FPB and PPB component cart payloads no longer emit private `_bundle_id` / `_bundle_name` in the touched widget paths; public EB properties remain `_bundleName`, `_easyBundle:prodQty`, `_easyBundle:OfferId`, and `Box`.
- Updated internal Cart Transform and bundle instance tracking docs to the EB OfferId contract.
- Bumped storefront widget version to `2.9.28` and rebuilt widget deploy assets.
- Verification: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/bundle-widget-product-page.js && node --check scripts/build-widget-bundles.js` passed.
- Verification: `npx jest tests/unit/extensions/cart-transform-run-query.test.ts tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts` passed with 38 tests.
- Verification: `cargo test` in `extensions/bundle-cart-transform-rs` passed with 38 Rust tests.
- Verification: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/bundle-widget-product-page.js scripts/build-widget-bundles.js tests/unit/assets/bundle-widget-full-page-cart-properties.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts tests/unit/extensions/cart-transform-run-query.test.ts` completed with 0 errors and warnings only.

### 2026-06-02 12:04 - FPB COMPACT card density parity slice completed
- Added COMPACT-specific desktop icon-mode sizing through compact CSS variables: 220px product cards, 332px card height, 208px images, 12px grid gap, and 6px card padding.
- Preserved the existing generic icon-mode layout for other FPB templates while letting COMPACT override the later desktop icon-mode rule through variables.
- Removed a redundant icon-mode selected-card override to keep the generated full-page CSS below Shopify's app-block asset limit.
- Verification: `npm run minify:assets css` completed successfully; `extensions/bundle-builder/assets/bundle-widget-full-page.css` generated under the 100,000 B Shopify limit.

### 2026-06-02 17:10 IST - Completed PPB CASCADE single-category storefront smoke
- Persisted SIT PPB fixture remained on PDP_INPAGE/CASCADE and storefront loaded widget version 2.9.42.
- Confirmed the CASCADE in-page product list now renders the category tab even when the bundle has a single category.
- Confirmed the Cross Necklace product row still renders with price and Add control, and selecting it updates the product button to Selected and enables the main Add Bundle to Cart CTA with .97 total.
- Checks completed: npm run build:widgets, node --check for modified JS files, eslint on modified JS files, graphify code rebuild, and Chrome SIT PPB CASCADE smoke.

### 2026-06-02 17:14 IST - Completed PPB COGNIVE persisted storefront smoke
- Persisted SIT PPB fixture to EB Product Grid contract: bundleDesignTemplate PDP_INPAGE and bundleDesignTemplateData.templateId COGNIVE.
- Storefront loaded widget version 2.9.42 with body marker COGNIVE, a three-column in-page product grid, square product image crop, centered product title/price, and full-width black Add button.
- Confirmed selecting Cross Necklace changes the product button to Selected and enables Add Bundle to Cart with .97 total.
- No code changes were required for this slice; this validates the existing COGNIVE grid rendering after the CASCADE tab fix.

### 2026-06-02 17:19 IST - Completed PPB MODAL persisted storefront smoke and CTA color fix
- Persisted SIT PPB fixture to EB Horizontal Slots contract: bundleDesignTemplate PDP_MODAL, bundleDesignTemplateData.templateId MODAL, and renderFilledSlotsAsHorizontalStacked true.
- Storefront loaded widget version 2.9.42 with body marker MODAL and PDP_MODAL type; closed state kept the modal shell hidden/inert and rendered the horizontal 104px slot card with gray disabled Add Bundle to Cart CTA.
- Found a parity gap after selection: the parent Add Bundle to Cart CTA became enabled but kept the disabled gray background.
- Fixed the PPB MODAL base CTA CSS so enabled state is black while disabled state remains gray; regenerated minified CSS asset.
- Chrome proof after fix: selecting Cross Necklace closes the modal, fills the slot, enables Add Bundle to Cart • .97, and computes the enabled CTA background as rgb(0, 0, 0).
- Checks completed: npm run minify:assets css, graphify code rebuild, and Chrome SIT persisted PPB MODAL smoke.

### 2026-06-02 17:33 IST - Completed FPB fresh-SIT preset sanity and stale metafield fallback fix
- Fresh SIT FPB DEFAULT app-proxy smoke passed: Shopify page preserved store header/footer, widget loaded FBP_SIDE_FOOTER/DEFAULT, gray page background, category tab, product card, selection summary, and cart add produced a cart line for Cross Necklace with Box: 1 and .97.
- While cycling presets, found DB and Shopify Admin page metafield updated to CLASSIC but Liquid still injected a stale custom.bundle_config payload with null bundleDesignTemplate and null bundleDesignPresetId, causing the widget to keep DEFAULT.
- Fixed the FPB loader to treat cached full-page config without bundleDesignTemplate and bundleDesignPresetId as incomplete/malformed, preserving metafield-first loading while using the existing proxy fallback when critical template keys are missing.
- Extended the background layout refresh to compare and update bundleDesignTemplate, bundleDesignPresetId, and bundleDesignTemplateData, not only fullPageLayout.
- Rebuilt widget version 2.9.43 and verified CLASSIC, COMPACT, and HORIZONTAL by updating the SIT DB row plus page custom.bundle_config metafield, then hard reloading the storefront.
- CLASSIC proof: marker CLASSIC, header/footer present, compare/current prices rendered, selected product summary rendered, and 198px black Add to Cart CTA enabled.
- COMPACT proof: marker COMPACT, header/footer present, selected product summary rendered, and 198px black Add to Cart CTA enabled.
- HORIZONTAL proof: marker HORIZONTAL, header/footer present, product card used horizontal grid sizing, selected product summary rendered, and wide black Add to Cart CTA enabled.
- Checks completed: npm run build:widgets, npm run minify:assets css, node --check for modified JS files, eslint on modified JS files, graphify code rebuild, and Chrome SIT FPB storefront smokes.
