# Issue: FPB Standard Design Storefront Parity
**Issue ID:** fpb-standard-design-storefront-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-05 17:23

## Overview
Match the FPB Standard Design storefront template UI to the live EB reference. Current live EB Standard Design maps to `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and storefront runtime `bundleDesignPresetId: "DEFAULT_FBP"`.

## Progress Log
### 2026-06-04 04:49 - Start Standard Design parity slice
- Read EB implementation reference: all FPB presets use `FBP_SIDE_FOOTER`; Standard Design uses preset `DEFAULT`.
- Graphify identifies `BundleWidgetFullPage`, `bundle-widget-full-page.js`, and `bundle-widget-full-page.css` as high-connectivity nodes, so this slice must stay narrow and test-backed.
- Next: switch EB target FPB bundle to Standard Design, capture live storefront computed styles and any responsive behavior, add failing source-contract test, implement scoped DEFAULT preset CSS/logic, rebuild assets, and verify.

### 2026-06-04 05:47 - Completed Standard Design storefront parity
- Switched the live EB FPB reference bundle to Standard Design and confirmed storefront runtime values: `bundleDesignTemplate` = `FBP_SIDE_FOOTER`, preset = `DEFAULT`.
- Captured desktop and mobile EB computed style evidence. Key desktop contract: 1536px bundle canvas, 1455px content wrapper, 993px product column, 447px sidebar, 321px product cards, 305x240 images, visible price rows, and 35x35 icon add buttons. Key mobile contract: 2-column 177.5px cards, 264px card height, and 150px image height.
- Added a failing Jest contract test for Standard Design, then updated `app/assets/bundle-widget-full-page.js` to retain product price rows for DEFAULT, use icon-style cards for Standard independent of pricing method, and inject DEFAULT-only runtime styles.
- Kept the raw full-page CSS source unchanged to avoid pushing the Shopify CSS asset over 100,000 B; verified generated `bundle-widget-full-page.css` is 99,990 B after minification.
- Bumped `WIDGET_VERSION` to `2.9.64`, rebuilt widget assets, reran focused tests, linted modified code paths, and rebuilt graphify output.

### 2026-06-05 11:55 - Plan audit gap filled
- Audited requested plan path `.claude/plans/eb-fpb-standard-design-capture.md`; it was missing from this repo checkout, but the home-level source existed at `/Users/adityaawasthi/.claude/plans/eb-fpb-standard-design-capture.md`.
- Confirmed the matching Standard Design implementation issue was already completed and the implementation/test plan exists through this issue plus `test-spec/fpb-standard-design-storefront.spec.md`.
- Filled the repo documentation gap by adding a repo-local plan file and correcting the test spec issue link to this issue ID.
- Recorded plan audit corrections: FPB Standard must use `bundleDesignPresetId: "DEFAULT"` only, not `STANDARD`; competitor screenshots remain non-commit artifacts unless explicitly approved.
- Started the capture implementation by creating `docs/competitor-analysis/eb-fpb-standard-capture/MANIFEST.md` with the full orthogonal row matrix in `pending` status.
- No new Standard Design source code implementation was needed in this pass.

### 2026-06-05 12:02 - Standard mobile height source gap found
- Ran the Standard template verification command from the audited plan and found the Standard contract still failing because the runtime template source uses `--mh:245px` while the issue/spec evidence target is `264px`.
- Root cause: Standard runtime styles were extracted into `app/assets/widgets/full-page/templates/standard-template.js`, and that module drifted from the documented Standard mobile card height.
- Next: patch only the Standard template mobile height token, rebuild widget output, and rerun the focused Standard contract.

### 2026-06-05 12:07 - Standard source gap patched
- Updated `app/assets/widgets/full-page/templates/standard-template.js` and rebuilt `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`.
- Standard runtime styles now expose `--mh:264px`, `--mih:150px`, mobile image height via `--mih`, and Standard side-panel min-height `738px`.
- Focused Standard test passed: `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/bundle-widget-full-page-template-layout.test.ts -t "matches Standard Design DEFAULT"`.
- Syntax passed: `node --check app/assets/widgets/full-page/templates/standard-template.js` and `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`.
- Lint passed with 0 errors and 4 warnings: `npx eslint --max-warnings 9999 app/assets/widgets/full-page/templates/standard-template.js tests/unit/assets/bundle-widget-full-page-template-layout.test.ts`.
- `npm run build:widgets` completed; unrelated Product Page/SDK generated header noise was removed so only the Full Page generated output remains changed.
- Graphify rebuild completed through `/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python`.
- Browser capture remains blocked: Chrome DevTools MCP `list_pages` timed out twice, so baseline live EB capture has not started.
- Broader template-layout verification still has non-Standard failures in Horizontal/Classic/Compact and should be handled as separate template drift, not part of this Standard patch.

### 2026-06-05 14:03 - Chrome blocker cleared; baseline reset decision remains
- Retried Chrome DevTools MCP and `list_pages` succeeded, showing the authenticated `yash-wolfpack` EB Admin tab plus the EB storefront tab.
- Captured an Admin snapshot to `/private/tmp/eb-admin-yash-snapshot-2026-06-05.txt`; the current EB Admin page is the existing bundle `WPB Research Landing Bundle 2026-05-22` on `Free Gift & Add Ons`.
- Captured a storefront accessibility snapshot to `/private/tmp/eb-fpb-standard-preflight-storefront-snapshot-2026-06-05.txt` and evaluated runtime state.
- Runtime preflight confirms `window.gbb` exists and the widget template is `FBP_SIDE_FOOTER`, but the current storefront body preset is `COMPACT`, not `DEFAULT`; Add-ons are visible.
- Reloaded the EB Admin root read-only and saved the bundle-list snapshot to `/private/tmp/eb-admin-yash-home-bundle-list-2026-06-05.txt`; page 1 of 1 lists only `WPB Research Landing Bundle 2026-05-22` and `WPB Research Product Page Bundle 2026-05-22`.
- The canonical capture bundle `WPB-CAP-FPB-STANDARD` is not visible in EB.
- Added `docs/competitor-analysis/eb-fpb-standard-capture/PREFLIGHT.md` and updated the manifest with `preflight-current-state` captured.
- Marked the baseline row blocked until the canonical `WPB-CAP-FPB-STANDARD` bundle is created or the existing research bundle is explicitly reset to the Standard baseline.

### 2026-06-05 14:03 - Unrelated template gap confirmed
- Ran `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --json --outputFile=/private/tmp/wpb-template-layout-jest-2026-06-05.json`.
- Result: 6 passed, 3 failed. `matches Standard Design DEFAULT side-footer storefront contract` passed.
- Confirmed failures are non-Standard:
  - Horizontal: missing `wpb-fpb-horizontal-slots-runtime-styles`; `app/assets/widgets/full-page/templates/horizontal-template.js` currently returns early.
  - Classic: expected mobile `grid-template-columns:repeat(2,minmax(0,177.5px))`, while current Classic template uses a generic two-column `1fr` mobile grid and `245px` card height.
  - Compact: expected capped desktop `height:min(352px,...)` / `height:min(240px,...)`, while current Compact template uses uncapped `calc(...)` values and `245px` mobile cards.

### 2026-06-05 14:07 - Verification blocker cleared
- Cleared the generated `graphify-out/GRAPH_REPORT.md` trailing whitespace from the graphify rebuild output.
- `git diff --check` now passes.
- Remaining blocker is a data-state decision before live EB baseline capture: create the missing canonical `WPB-CAP-FPB-STANDARD` bundle or explicitly reset `WPB Research Landing Bundle 2026-05-22` to the Standard baseline.

### 2026-06-05 14:08 - Begin existing bundle reset
- User approved resetting the existing `WPB Research Landing Bundle 2026-05-22` bundle instead of creating the missing canonical capture bundle.
- Target state: FPB Landing Page bundle with `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and Standard Design runtime `bundleDesignPresetId: "DEFAULT_FBP"` suitable for baseline verification.
- Next: mutate EB Admin state, then verify Admin persistence and storefront runtime before marking the baseline capture row complete.

### 2026-06-05 14:13 - Existing bundle reset checked
- Reset the existing EB landing bundle through Admin: selected Standard Design, disabled `Add-Ons and Gifting Step`, disabled `Add-Ons with Bundles`, then saved successfully.
- Desktop storefront reload verified `window.gbb.settings.stepsConfigurationData.bundleDesignTemplate = "FBP_SIDE_FOOTER"`, `bundleDesignPresetId = "DEFAULT_FBP"`, body preset `DEFAULT_FBP`, and no visible `Add On` text.
- Mobile storefront reload at `390x844x3` verified the same runtime state and no visible `Add On` text.
- Stored proof outside the repo: `/private/tmp/eb-fpb-standard-reset-storefront-snapshot-2026-06-05.txt`, `/private/tmp/eb-fpb-standard-reset-storefront-desktop-2026-06-05.png`, and `/private/tmp/eb-fpb-standard-reset-storefront-mobile-2026-06-05.png`.
- Updated the capture plan, manifest, preflight note, and `internal docs/EB Implementation Reference.md` because live EB now exposes Standard Design as `DEFAULT_FBP`, not the previously documented `DEFAULT`.

### 2026-06-05 14:17 - Unrelated gap rechecked
- Reran `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --json --outputFile=/private/tmp/wpb-template-layout-jest-2026-06-05-reset-check.json`.
- Result remains 6 passed, 3 failed.
- Standard still passes: `matches Standard Design DEFAULT side-footer storefront contract`.
- Non-Standard failures remain Horizontal, Classic, and Compact template contracts.

### 2026-06-05 14:31 - Step timeline parity re-audit
- Re-audited the reset live EB Standard storefront timeline on desktop and mobile. Confirmed `FBP_SIDE_FOOTER` + `DEFAULT_FBP` and captured the exact timeline geometry.
- EB timeline contract: centered grid navigation, 40px circular image nodes, active 4px black border, inactive 2px `rgb(212,213,214)` border, one absolute 6px progress rail behind node centers, black bold labels, desktop labels `16px/28.8px`, mobile labels `12px/21.6px`.
- Measured WPB current timeline on the parity storefront. Gap: WPB uses a flex row, 44px circles, segmented 2px connectors, inline SVG icons, muted locked labels, and per-connector fills instead of the EB one-rail grid model.
- Stored current WPB before screenshot outside the repo: `/private/tmp/wpb-standard-step-timeline-before-2026-06-05.png`.
- Next: add a failing Standard step timeline source-contract test, replace the Standard timeline renderer/styles with the measured EB grid/rail structure, rebuild widget assets, and verify.

### 2026-06-05 14:37 - Step timeline parity implemented
- Added a failing source-contract test for the Standard step timeline, then implemented a Standard-only timeline renderer in `app/assets/bundle-widget-full-page.js`.
- Standard timeline now uses EB-style grid navigation with one absolute progress rail, 40px image nodes, active/inactive border states, black bold labels, and `DEFAULT_FBP` normalization to the existing Standard preset marker.
- Added Standard runtime CSS in `app/assets/widgets/full-page/templates/standard-template.js` for desktop `60%` timeline width, `76.8px` height, `16px/28.8px` labels, and mobile near-full-width `61.6px` layout with `12px/21.6px` labels.
- Bumped `WIDGET_VERSION` to `3.0.1`, rebuilt the full-page widget output, and kept generated product-page/SDK build noise out of scope.
- Verification passed: focused Standard Jest contract, raw JS syntax checks, generated full-page bundle syntax check, modified-file ESLint with 0 errors, and graphify rebuild.
- Full template-layout suite remains blocked only by the previously confirmed unrelated Horizontal, Classic, and Compact contract failures.

### 2026-06-05 14:40 - Timeline width safeguard added
- Browser geometry simulation on the current WPB parity storefront showed EB's fixed two-entry `60%` timeline width is correct for the reset EB baseline but too narrow for WPB fixtures with extra synthetic entries.
- Kept the EB `60%` width for two entries and added data-driven `--standard-timeline-width` so longer Standard timelines widen without label collisions.
- Rebuilt the full-page widget output again and restored product-page generated minifier noise out of scope.

### 2026-06-05 15:00 - Product card/grid parity re-audit started
- User requested the next Standard pass focus on product cards, grid, and related behavior/functionality.
- Re-measured live EB Standard product grid on desktop and mobile after the reset state remained `FBP_SIDE_FOOTER` + `DEFAULT_FBP`.
- Desktop EB target: body wrapper `1195.22px`, product/sidebar grid `813.94px 366.27px` with `15px` gap, category card row `352px`, card `261.31px x 352px`, inner image `245.31px x 240px`, title row `40px`, action row `35px`, CTA button `35px x 35px`.
- Mobile EB target: body wrapper `370px`, product area `370px`, two `177.5px x 264px` cards with `15px` gap, inner image `161.5px x 150px`, title row `42px`, action row `35px`, CTA button `35px x 35px`.
- Stored EB screenshots outside the repo: `/private/tmp/eb-standard-product-grid-desktop-2026-06-05.png` and `/private/tmp/eb-standard-product-grid-mobile-2026-06-05.png`.
- Next: measure current WPB product grid/card deltas, add failing source-contract coverage, then patch only the Standard runtime styles/renderer paths needed for EB card-grid parity.

### 2026-06-05 15:04 - Product card/grid parity patched
- Measured current WPB storefront and confirmed it is still serving `HORIZONTAL`, so live WPB visual comparison is not valid until the updated Standard asset is deployed.
- Added failing Standard source-contract coverage for EB product card/grid details: desktop `15px` grid gap, `240px 40px 40px` card rows, mobile `150px 42px 40px` card rows, and icon-only product CTA behavior.
- Updated Standard runtime styles so mobile card titles use EB's measured `42px` row and icon-mode product buttons hide text while rendering `+` or `✓` through CSS.
- Bumped `WIDGET_VERSION` to `3.0.2`, rebuilt the full-page widget output, and restored product-page generated minifier noise out of scope.
- Verification passed for Standard-focused tests, raw/generate syntax checks, ESLint with 0 errors, and graphify rebuild.
- Full template-layout suite remains blocked only by the already-confirmed unrelated Horizontal, Classic, and Compact template contract failures.

### 2026-06-05 15:09 - Post-deploy storefront gap found
- User manually deployed and requested a fresh live storefront comparison against EB Standard.
- Live WPB storefront now serves `window.__BUNDLE_WIDGET_VERSION__ = "3.0.2"` and `data-fpb-design-preset="DEFAULT"`, so the deployed Standard asset is active.
- Measured live WPB desktop product card internals against the EB reset baseline. Outer grid/card/image dimensions now match closely, but the product content wrapper still inherits generic/Compact text-button sizing: title, price row, action row, and button measure `284px` wide inside a `261px` card.
- User confirmed `Show Text on + Button` is enabled in Bundle Settings. EB Standard still requires the Standard card shell to stay icon-button sized, so the fix must keep other presets/settings behavior intact while forcing Standard's card internals to the EB icon CTA geometry.
- Next: add failing Standard source-contract coverage for this setting conflict, patch Standard runtime styles only, rebuild the full-page bundle, and verify desktop/mobile storefront again.

### 2026-06-05 15:38 - Post-deploy card/grid gaps patched
- Added Standard source-contract coverage for the `Show Text on + Button` conflict and mobile grid width regression.
- Patched `app/assets/widgets/full-page/templates/standard-template.js` so Standard product cards hide the deployed `product-variant-badge`, place product content into EB's two lower grid rows, constrain `product-card-action` and `.product-add-btn` to `35px x 35px`, and keep text hidden behind the CSS `+` / `✓` affordance.
- Patched Standard mobile wrapper spacing so the root 10px page padding is not doubled. Injected-css live validation measured the expected EB mobile geometry: wrapper `x=10/w=370`, grid columns `177.5px 177.5px`, card `177.5px x 264px`, image `161.5px x 150px`, title `161.5px x 42px`, and action/button `35px x 35px`.
- Bumped `WIDGET_VERSION` to `3.0.3`, rebuilt `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`, and restored unrelated Product Page/SDK generated stamp noise.
- Verification passed: focused Standard Jest contract, raw Standard JS syntax check, generated full-page bundle syntax check, ESLint with 0 errors, graphify rebuild, and `git diff --check`.
- Stored injected live-browser proof screenshots outside the repo: `/private/tmp/wpb-standard-postfix-injected-desktop-2026-06-05.png` and `/private/tmp/wpb-standard-postfix-injected-mobile-2026-06-05.png`.

### 2026-06-05 15:36 - Begin remaining Standard parity slice
- User identified remaining Standard storefront parity scope: variant-as-individual product cards, category behavior on desktop and mobile, mobile footer and step timeline, and desktop right sidebar summary card.
- This pass starts with a fresh live EB/WPB audit for those four surfaces before additional implementation.
- Next: capture EB and WPB desktop/mobile computed styles, interactions, screenshots, and runtime state; then add focused source-contract coverage and patch only the Standard storefront branch.

### 2026-06-05 15:46 - Remaining Standard parity slice patched
- Re-measured live EB Standard desktop/mobile category, variant-card, footer, timeline, and right summary surfaces. Captured EB mobile category click proof at `/private/tmp/eb-standard-remaining-slice-mobile-category2-2026-06-05.png`.
- Patched Standard expanded-variant cards so each individual variant renders EB-style product title + variant title lines while the separate variant badge remains hidden.
- Patched Standard category tabs/collapsed rows to use EB flat accordion geometry instead of boxed collapsed category buttons on desktop and mobile.
- Patched Standard mobile summary tray and desktop right summary action geometry: 370px mobile tray with 360px x 38px `Next • total` button, and desktop 157px x 41px `Next` button with EB title typography.
- Bumped `WIDGET_VERSION` to `3.0.4`, rebuilt the full-page widget bundle, and kept generated product-page/SDK stamp noise out of scope.
- Verification passed: focused Standard Jest contract, raw JS syntax checks, generated full-page bundle syntax check, modified-file ESLint with 0 errors, and injected desktop/mobile browser geometry proof.
- Stored WPB injected proof outside the repo: `/private/tmp/wpb-standard-remaining-slice-injected-desktop-2026-06-05.png` and `/private/tmp/wpb-standard-remaining-slice-injected-mobile-2026-06-05.png`.

### 2026-06-05 15:48 - Timeline icon and discount progress follow-up started
- User identified remaining Standard timeline/progress gaps: timeline step icons must stay opaque, the progress rail must not show through or under icon circles, and both discount progress modes (`simple` and `step_based`) need parity treatment.
- Relevant implementation surfaces: Standard runtime timeline CSS in `app/assets/widgets/full-page/templates/standard-template.js`, discount progress renderers in `app/assets/bundle-widget-full-page.js`, and progress CSS in `app/assets/widgets/full-page-css/bundle-widget-full-page.css`.
- Next: add focused contract coverage, patch Standard timeline stacking/opacity and discount progress markup/styles for both modes, rebuild full-page assets, and verify.

### 2026-06-05 15:53 - Timeline icon and discount progress follow-up patched
- Added failing Standard source-contract coverage for timeline icon opacity/stacking and both discount progress bar modes, then patched the Standard timeline runtime styles so the rail sits behind isolated opaque 40px white icon circles.
- Patched `app/assets/bundle-widget-full-page.js` so discount progress emits explicit `fpb-dp-simple` and `fpb-dp-step_based` mode classes based on `discountProgressBarType`.
- Patched `app/assets/widgets/full-page-css/bundle-widget-full-page.css` so simple and step-based progress bars share EB colors: empty `#C1E7C5`, filled `#15A524`, 6px rounded tracks, and no fake minimum fill at 0%.
- Bumped `WIDGET_VERSION` to `3.0.5`, rebuilt full-page widget assets, minified CSS, and confirmed generated Product Page/SDK stamp noise stayed out of scope.
- Verification passed: focused Standard Jest contract, raw JS syntax checks, generated full-page bundle syntax check, modified-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, graphify rebuild, and `git diff --check`.

### 2026-06-05 16:14 - Empty sidebar and timeline interaction parity started
- User requested a deeper desktop Standard parity pass for the right summary sidebar when the shopper has not added any products, plus step timeline behavior across add/remove actions.
- Audit target: live EB Standard desktop empty state, after first product add, after step transition, and after product removal; compare against live WPB Standard desktop.
- Next: capture EB/WPB screenshots and computed styles, add source-contract coverage for the confirmed gaps, patch only Standard storefront behavior/styles, rebuild assets, and verify.

### 2026-06-05 16:25 - Empty sidebar and timeline interaction parity patched
- Captured live EB Standard desktop empty, add, next, and remove states. EB empty summary uses a sticky `366.27px` card, `1px #e3e3e3` border, `10px` radius, visible `Clear`, `0 item(s)`, two skeleton rows inside the products container, and a black `Next` button that is not visually disabled.
- Confirmed EB add/remove behavior: adding updates item count, selected row, discount text, and total without filling the step rail; removing the item returns to `0 item(s)` and the skeleton rows. The reset EB bundle's timeline visual state remains quantity-independent through these actions.
- Patched `app/assets/bundle-widget-full-page.js` so Standard desktop sidebars always show `Clear`, render EB-style empty skeleton rows inside `.side-panel-products`, and hide WPB-only tier, box-selection, and free-gift/add-on sidebar blocks for this Standard desktop surface.
- Patched Standard runtime styles in `app/assets/widgets/full-page/templates/standard-template.js` for EB empty-sidebar geometry, selected row geometry, skeleton row dimensions, total/action row layout, and visually enabled black `Next`.
- Bumped `WIDGET_VERSION` to `3.0.6`, rebuilt full-page widget assets, minified CSS, and kept generated Product Page/SDK drift out of scope.
- Verification passed: new red/green source-contract test, focused Standard Jest contracts, raw JS syntax checks, generated full-page bundle syntax check, modified-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, graphify rebuild, and generated asset scope check.

### 2026-06-05 16:28 - Chrome cache-review and instruction update started
- User requested Chrome review for the storefront changes and asked to add a permanent rule that storefront work must empty cache and hard reload before review.
- Target documentation: `CLAUDE.md` and `AGENTS.md`, under the storefront audit guidance.
- Next: update both instruction files, hard reload the WPB storefront with cache bypass, verify the live widget version and visible Standard sidebar state, then log the result.

### 2026-06-05 16:36 - Chrome cache-review and post-review fix completed
- Added the hard reload/cache-bypass storefront review rule to `CLAUDE.md` and `AGENTS.md`: clear Cache Storage where available and reload through Chrome DevTools MCP with `ignoreCache: true` before trusting storefront parity checks.
- Reviewed the deployed WPB Standard storefront in Chrome after clearing Cache Storage and hard reloading desktop and mobile. Live `window.__BUNDLE_WIDGET_VERSION__` was `3.0.6`, so the previously deployed bundle was active.
- Chrome desktop review found the empty sidebar was still blocked by a more-specific icon-mode `min-height:738px` selector, the Standard count text still rendered `0 items` instead of EB's `0 item(s)`, and grid auto-placement left the count/action regions misaligned.
- Patched the Standard desktop sidebar source contract: the EB `639.766px` card rule now beats icon-mode specificity, header/discount/count/products/action rows are explicitly placed, products sit in the EB row offset, and Standard desktop count text uses `item(s)`.
- Bumped `WIDGET_VERSION` to `3.0.7`, rebuilt full-page widget assets, minified CSS, and restored unrelated Product Page/SDK generated drift out of scope.
- Verification passed: focused Standard empty-sidebar test, focused Standard contract suite, raw JS syntax checks, generated full-page bundle syntax check, modified-file ESLint with 0 errors, `npm run build:widgets`, `npm run minify:assets css`, graphify rebuild, and generated asset scope check.
- Live post-fix verification is pending the next manual deploy; after deploy, Chrome review must hard reload with cache bypass and confirm `window.__BUNDLE_WIDGET_VERSION__ = "3.0.7"`.

### 2026-06-05 16:37 - Commit prep
- Preparing a scoped commit for the Standard storefront parity slice, full-page widget deploy assets, cache-bypass instruction update, test spec, and graphify rebuild.
- Unrelated dirty files from other workstreams remain unstaged and out of scope for this commit.

### 2026-06-05 16:47 - Desktop layout track parity re-audit started
- User requested another FPB Standard Design parity slice focused on identifying and fixing current gaps.
- Hard reloaded WPB desktop/mobile and EB desktop/mobile after clearing Cache Storage. WPB live storefront serves `window.__BUNDLE_WIDGET_VERSION__ = "3.0.7"` and Standard preset `DEFAULT`; EB remains `FBP_SIDE_FOOTER` + `DEFAULT_FBP`.
- Desktop gap found: EB outer body grid is `813.938px 366.266px`, while WPB computes `332.938px 697.266px` even though the intended `0.6897fr 0.3103fr` selector matches. Root cause is Standard WPB sidebar min-content width: its internal panel grid computes two columns (`326px 324.266px`), forcing the outer sidebar track to ~697px.
- Mobile recheck shows WPB product grid/tray are close to EB: `370px` content width, `177.5px` card columns, `264px` cards, and `370px` summary tray. This slice will stay focused on the desktop track-width blocker.
- Next: add source-contract coverage for Standard one-column sidebar content grid, patch the Standard runtime template, bump the widget version, rebuild/minify full-page assets, and verify.

### 2026-06-05 17:02 - Product title overflow parity slice started
- User reported Standard product-card names are overflowing and getting cut.
- Hard reloaded WPB and EB storefront pages after clearing Cache Storage. WPB live `3.0.8` shows a regular product title with `scrollHeight: 44px`, `clientHeight: 40px`, and `overflow: hidden`; EB keeps the same `40px` title row and `22px` line-height but uses visible overflow, letting the second line render without clipping.
- Scope: update the Standard product-title contract so regular product names can visibly occupy the EB two-line title area without changing card height, grid rows, CTA size, or variant-card isolation.

### 2026-06-05 17:02 - Product title overflow parity completed
- Added failing Standard storefront contract coverage for EB-style visible product-title overflow on desktop and mobile, then patched `app/assets/widgets/full-page/templates/standard-template.js`.
- Bumped `WIDGET_VERSION` to `3.0.9` and rebuilt `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`.
- Verification passed: focused Standard DEFAULT test failed before implementation and passed after, Standard contract suite passed, raw Standard template syntax check passed, generated full-page bundle syntax check passed, modified-file ESLint had 0 errors, and graphify rebuild completed.
- Chrome verification after Cache Storage clear and `ignoreCache` hard reload: live WPB serves `window.__BUNDLE_WIDGET_VERSION__ = "3.0.9"`; desktop title `The Compare at Price Snowboard` keeps `height: 40px`, `scrollHeight: 44px`, `lineHeight: 22px`, and `overflowY: visible`; mobile keeps `177.5px x 264px` card geometry with `overflowY: visible`.

### 2026-06-05 17:12 - Mobile product-card overflow parity started
- User requested another FPB Standard Design parity slice only for mobile view.
- Hard reloaded WPB and EB mobile storefronts after clearing Cache Storage. WPB live `3.0.9` product cards keep the EB `177.5px x 264px` geometry, but Standard mobile `.product-card` still computes `overflow: hidden`; EB mobile `.gbbProductItem` computes `overflow: visible`.
- Gap: variant-as-individual mobile titles can still render `scrollHeight: 44px` in a `42px` title row while the parent card clips overflow, unlike EB's visible card overflow.
- Scope: patch only Standard mobile product-card overflow so card geometry, image clipping, title rows, price row, and CTA size remain unchanged.

### 2026-06-05 17:12 - Mobile footer parity scope added
- User clarified the mobile footer is the most critical mobile component.
- EB mobile footer evidence: outer `.gbbAddProductsPageFooterHTML` is `position: sticky`, `370px x 195.5625px`, `bottom: 0`, `z-index: 9999`, with a `360px` inner footer, `126.5625px` discount area using hidden overflow, `58px` action area, and a `360px x 38px` black `Next • Total` button.
- WPB mobile footer evidence: `.fpb-mobile-summary-tray` matches the broad size and button geometry but is `position: fixed`, uses `196px` height and `126px` discount row, and keeps the discount area overflow visible.
- Scope extended: keep the product-card overflow fix, and patch Standard mobile footer positioning/height/discount overflow to EB while preserving the current button width, typography, and action row geometry.

### 2026-06-05 17:23 - Mobile product-card and footer parity completed
- Patched Standard mobile product cards to keep EB `177.5px x 264px` geometry while allowing visible card overflow; product images still keep their own rounded clipping.
- Patched Standard mobile footer to EB sticky tray behavior: `370px x 195.5625px`, `bottom: 0`, `z-index: 9999`, `126.5625px` hidden-overflow discount area, `58px` action area, and `360px x 38px` black CTA.
- Bumped `WIDGET_VERSION` to `3.0.10`, rebuilt the full-page widget bundle, and restored unrelated product-page/SDK generated drift out of scope.
- Verification passed: focused Standard DEFAULT Jest contract, broader Standard Jest contract suite, raw Standard template syntax check, generated full-page bundle syntax check, modified-file ESLint with 0 errors, graphify rebuild, and `git diff --check`.
- Chrome verification after Cache Storage clear and `ignoreCache` hard reload: live WPB serves `window.__BUNDLE_WIDGET_VERSION__ = "3.0.10"` and Standard preset `DEFAULT`; mobile tray computes `position: sticky`, `370px x 195.5625px`, `bottom: 0`, `z-index: 9999`; discount area computes `360px x 126.5625px` with `overflow: hidden`; CTA computes `360px x 38px`; product card computes `177.5px x 264px` with `overflow: visible`; image remains `161.5px x 150px` with `overflow: hidden`.
- Fresh EB mobile hard-reload comparison remains aligned: EB tray `370px x 195.5781px`, discount `360px x 126.5781px`, CTA `360px x 38px`, product card `177.5px x 264px`, and card overflow `visible`.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `.claude/plans/eb-fpb-standard-design-capture.md`
- `docs/competitor-analysis/eb-fpb-standard-capture/MANIFEST.md`

## Phases Checklist
- [x] Phase 1: Switch EB target FPB bundle to Standard Design and capture live storefront style evidence.
- [x] Phase 2: Add failing Standard Design storefront contract test.
- [x] Phase 3: Match Standard Design storefront UI to EB with scoped code/CSS.
- [x] Phase 4: Build/minify modified storefront assets and verify.
- [x] Phase 5: Replace Standard step timeline with live EB-matched grid/rail timeline.
