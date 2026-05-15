# Issue: Edit Bundle UI Redesign — FPB Configure Page

**Issue ID:** edit-bundle-ui-redesign-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-10
**Last Updated:** 2026-05-15 17:30

## Overview

Redesign the edit bundle flow for Full-Page Bundles to align with the Figma design images
provided for the 26.05 UI changes. The edit flow currently uses a single-page form with a
left nav sidebar. The new design aligns it with the cleaner layout established by the create
flow wizard.

## Phases Checklist

- [x] Phase 1 — Step Setup right panel: chip nav, Step Configuration card (icon + pageTitle), Select Product card, Rules card, Advanced Step Options
- [x] Phase 2 — Left sidebar: Step Summary card, remove Storefront Page (move to Bundle Assets), remove Messages nav item
- [x] Phase 3 — Bundle Assets: add Storefront Page URL slug section at the top
- [x] Phase 4 — Handler: save timelineIconUrl, pageTitle, searchBarEnabled per step
- [x] Phase 5 — CSS: chip nav, card, stepConfigRow, tabRow, emptyState, rulesList, sideCard, summaryList styles
- [x] Phase 6 — Messages nav item restored; Bundle Settings + Messages headers polished (icon, weight, padding)
- [x] Phase 7 — Pricing Tiers header s-stack gap fix; nav subtitle removed; Messages s-select value binding + s-option migration
- [x] Phase 8 — Bundle Assets step image tabs: replace inline-styled buttons with tabRow/tab/tabActive CSS module classes
- [x] Phase 9 — Rename nav item "Messages" → "Widget Text" to match section header
- [x] Phase 10 — EB UX wireup: fix 8 broken controls, gift message product picker, addon tiers array, collection/product row clone
- [x] Phase 11 — Design gap fixes: icon-only category row buttons, red Remove buttons (tone=critical), full-width Add Rule/Add rule buttons, plain-link Show Variables, multi-language layout restructure
- [x] Phase 12 — Multi-language Discount Messaging: new BundlePricing.ruleMessagesByLocale column (migration), locale tabs UI, checkbox wired to state, per-locale message editing, Admin→DB→metafield→widget pipeline complete

## Key Design Decisions

- Create Bundle and Edit Bundle remain separate workflows. Edit Bundle will be implemented from the provided design images.
- Remove "Messages" nav item (defer to discount section work)
- Keep "Bundle Settings" nav item as-is
- Replace tab-based step nav with chip-based (same as create flow)
- Step Options (Free Gift, Mandatory Product) → "Advanced Step Options" card in Step Setup
- Storefront Page URL slug → moved to Bundle Assets section
- Step Summary → added to left sidebar (active-step data only)
- SaveBar (dirty-state) preserved — no Back/Next wizard buttons
- Step Clone button → in Advanced Step Options card

## Progress Log

### 2026-05-15 17:30 - Completed Phase 11 + 12: design gap fixes and multi-language discount messaging

**Phase 11 — Design gap fixes (Step Setup + Discount & Pricing):**
- ✅ Category row Clone → icon-only `icon="duplicate"` plain button
- ✅ Category row Delete → icon-only `icon="delete"` plain tone=critical button
- ✅ Rules Config "Remove" rule → `tone="critical"` (red text)
- ✅ Rules Config "+ Add Rule" → `variant="secondary"` full-width (`style={{ width: "100%" }}`)
- ✅ Discount rule "Remove" → `tone="critical"` (red text)
- ✅ Discount "Add rule" → `variant="secondary"` `icon="plus"` full-width
- ✅ Footer Messaging "Show Variables" → `variant="plain"` (link style)
- ✅ Discount Messaging "Show Variables" → moved to own right-aligned row below checkbox

**Phase 12 — Multi-language Discount Messaging (Admin → Storefront):**
- ✅ Schema: `BundlePricing.ruleMessagesByLocale Json?` column added (migration `20260515081527_add_bundle_pricing_rule_messages_by_locale`)
- ✅ Route: `discountMessagingMultiLanguageEnabled`, `ruleMessagesByLocale`, `activeDiscountLocale` state added
- ✅ UI: "Enable multi-language" checkbox wired to `discountMessagingMultiLanguageEnabled` state; locale tabs (tabRow/tab/tabActive CSS) shown when enabled; per-locale rule message editing
- ✅ Serialization: both `formData.append("discountData")` paths include `ruleMessagesByLocale` and `discountMessagingMultiLanguageEnabled`
- ✅ Handler: `handlers.server.ts` upsert create/update now writes `ruleMessagesByLocale` to DB column
- ✅ Metafield config: `buildFpbBaseConfig` includes `ruleMessagesByLocale` inside `pricing.messages`
- ✅ Widget: `updateMessagesFromBundle` checks `ruleMessagesByLocale[window.Shopify.locale]` before falling back to default `ruleMessages`
- ✅ Widget rebuilt: `npm run build:widgets`
- Files modified: `prisma/schema.prisma`, `prisma/migrations/…`, `handlers.server.ts`, `route.tsx`, `bundle-widget-full-page.js`, `bundle-widget-full-page-bundled.js`, `bundle-widget-product-page-bundled.js`

### 2026-05-15 14:00 - Completed Phase 10: EB UX wireup fixes

- ✅ Fix 1: Rules Config s-select → s-option children (dropdowns now populate)
- ✅ Fix 2: Footer Messaging "Show Variables" — was calling undefined setTemplateVariablesModalOpen; rewired to showPolarisModal(templateVariablesModalRef)
- ✅ Fix 3: Footer Messaging "Multi Language" button → disabled
- ✅ Fix 4: Step Locale "Multi Language" button → disabled
- ✅ Fix 5: s-icon type="note" → name="note" (correct Polaris attribute)
- ✅ Fix 6: Slot Icon "Reset" button now clears timelineIconUrl field
- ✅ Fix 7: Progress Bar type selector — raw <input type="radio"> → s-choice-list / s-choice
- ✅ Fix 8: Bundle Quantity Options "Multi Language" → disabled
- ✅ Decision A: Messages "Edit" button → shopify.resourcePicker (single product); stores giftMessageProductId + giftMessageProductTitle in textOverrides
- ✅ Decision B: addonTiers Json? added to BundleStep schema (migration add-step-addon-tiers); static tier 1 replaced with dynamic array render; handlers.server.ts saves addonTiers
- ✅ Decision C: Collection row Clone now duplicates selectedCollections[step.id] entry; product row Clone shows improved toast directing user to product picker
- Files modified: prisma/schema.prisma, handlers/handlers.server.ts, route.tsx, docs/issues-prod/edit-bundle-ui-redesign-1.md

### 2026-05-15 00:00 - Starting Phase 10: EB UX wireup fixes

- Full Chrome + code audit identified 11 broken/missing-handler controls across all sections.
- User decisions: A=resource picker for gift message product, B=addonTiers DB field, C=clone for all category row types.
- Files to modify: prisma/schema.prisma, handlers.server.ts, route.tsx
- Breaking changes: addonTiers DB migration required (add-step-addon-tiers); addonDisplayFree kept for backwards compat.

### 2026-05-13 10:54 - Starting Step Setup and Discount & Pricing wiring pass

- User requested wiring all merchant controls in `Step Setup` and `Discount & Pricing`, using Easy Bundles as the behavioral and UI reference.
- Scope: interact with Easy Bundles end-to-end through Shopify Admin and storefront where possible, compare against Wolfpack Bundles, inspect current persistence paths, then implement only controls that can map to the existing state/schema.
- Any feature that needs new persistence or a data model change will pause for user options before implementation.
- Storefront password for verification, if prompted: `1`.

### 2026-05-13 11:14 - Discount & Pricing wiring pass completed

- Added EB-compatible discount message template variables and tests for `{{discountConditionDiff}}`, `{{discountUnit}}`, `{{discountValue}}`, `{{discountValueUnit}}`, and `{{discountedItems}}`.
- Normalized discount rule messages from saved pricing data so the edit flow pre-populates existing templates and generates EB-style defaults for new rules without schema changes.
- Updated Discount & Pricing UI copy and control labels toward EB, including display-option copy, default discount text/success message templates, and the lighter template variables modal.
- Wired pricing display options into the edit save payload and hidden form payload; rebuilt the full-page bundled widget after widget JS changes.
- Added widget-side support for progress-bar display option metadata and EB-compatible template variables. The current storefront bar remains visually step-based until the simple-bar visual treatment is approved.
- Chrome verification attempted on page 1 after reload. The embedded Step Setup page rendered, but DevTools MCP clicks did not switch sections inside the Shopify iframe in this session; direct iframe access redirected through Shopify auth, matching the known tunnel limitation. No new screenshots were captured.
- Validation:
  - `npx jest --selectProjects unit --runTestsByPath tests/unit/assets/template-manager.test.ts tests/unit/lib/pricing-display-options.test.ts --coverage=false`
  - `npx eslint --max-warnings 9999 app/lib/pricing-display-options.ts app/hooks/useBundlePricing.ts app/hooks/useBundleConfigurationState.ts app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `npx eslint --max-warnings 9999 app/assets/widgets/shared/template-manager.js app/assets/bundle-widget-full-page.js` (widget files are ignored by repo ESLint config)
  - `git diff --check -- . ':!graphify-out/GRAPH_REPORT.md'`
- Deferred for user decision before schema/runtime changes:
  - EB `Buy X, get Y` discount method
  - weight-based Step Setup rules
  - persistent per-category rules
  - persisted per-rule `Auto Next` semantics
  - visually distinct `Simple` progress bar behavior

### 2026-05-13 01:49 - Starting final Step Setup parity pass

- User requested finalizing Step Setup parity against Easy Bundles, including the Step Setup child sections `Free Gift & Add Ons` and `Messages`.
- Scope: compare WPB page 1 and EB page 2 through Chrome DevTools, inspect current route/CSS code, then patch visible UI/UX parity gaps without data model changes unless explicitly approved.
- User also requested `CLAUDE.md` be updated so screenshots captured during Chrome investigation or verification are not committed.
- Commit requirement: commit only non-image implementation/documentation changes after verification; screenshots must remain unstaged/uncommitted.

### 2026-05-13 01:58 - Final Step Setup parity pass completed

- Added the screenshot rule to `CLAUDE.md`: Chrome investigation/verification screenshots must stay unstaged and uncommitted unless explicitly requested.
- Updated Step Setup copy and structure to more closely match Easy Bundles:
  - Step Flow copy now matches EB punctuation.
  - Step Setup helper copy now matches EB wording.
  - Category block is now the primary product-selection block and shows EB-style category rows with Clone/Delete actions.
  - Rules now render as EB-style `Rule #` cards with a Remove action and `Auto Next When rule is met`.
- Reworked `Free Gift & Add Ons` into EB's three-block structure:
  `Add-Ons and Gifting Step`, `Add-Ons with Bundles`, and `Footer Messaging`.
- Reworked `Messages` from widget-label editing into the EB-style gift-message configuration screen.
- No Prisma/schema changes were made. New controls are mapped to existing step fields or existing `textOverrides`/`ruleMessages` state.
- Chrome verified in the embedded Shopify Admin app:
  - Step Setup renders Category rows and the Auto Next rule control.
  - Free Gift & Add Ons renders the EB-style blocks and controls.
  - Messages renders the EB-style message controls.
  - Message limit toggle opens the App Bridge Save Bar and Discard restores the UI state.
  - No browser console errors appeared.

### 2026-05-13 01:59 - Removing unsupported message email UI

- User clarified that `Send message through email to the customer` should not be supported for now.
- Scope: remove the email delivery card from the `Messages` child section and remove the unused email toggle state.
- No schema, persistence, or screenshot changes.

### 2026-05-13 01:42 - Starting shared tooltip stacking fix

- User clarified that tooltip hover state should generally sit above its parent stacking layer so hover cards remain visible.
- Scope: adjust the shared EB-style rich tooltip CSS so active tooltip wrappers and cards rise together instead of relying on per-parent overrides only.
- No data model or persistence changes.

### 2026-05-13 01:44 - Shared tooltip stacking fix completed

- Updated the shared EB-style rich help CSS to define idle, active, and card stacking layers.
- Hover/focus now raises the tooltip wrapper above surrounding parent content, while the tooltip card stays above the active wrapper.
- Removed the lower Discount Display Options-specific card z-index so those tooltips inherit the shared stacking behavior.
- Chrome verified the Step Flow hover card still renders visibly in the embedded Shopify Admin app after the shared stacking change.
- Screenshot: `docs/app-nav-map/screenshots/wpb-shared-tooltip-stacking-step-flow-20260513.png`

### 2026-05-13 01:31 - Starting tooltip constants and clipping fix

- User reported Discount Display Options rich tooltips are clipping on hover and showing incorrect content.
- Scope: centralize tooltip copy/visual metadata in a constants file, make parent components choose a tooltip key, and adjust tooltip positioning for Discount Display Options.
- No data model or persistence changes.
- Commit requested after implementation and verification.

### 2026-05-13 01:38 - Tooltip constants and clipping fix completed

- Added `app/constants/help-tooltips.ts` as the canonical copy/visual source for rich help tooltips.
- Updated rich tooltip components so parent components select a typed tooltip key instead of passing inline title/description/visual copy.
- Replaced inline tooltip definitions for Step Flow, Category, Rules Configuration, Bundle Quantity Options, Progress Bar, Discount Messaging, and Loading Animation.
- Fixed Discount Display Options tooltip positioning so hover cards open inward from the row and are not clipped by the right edge.
- Chrome verified:
  - Bundle Quantity Options tooltip shows the corrected Bundle Quantity Options copy
  - Progress Bar tooltip shows the corrected Progress Bar copy
  - Progress Bar tooltip is fully visible in the app canvas and not clipped
- Validation:
  - `npx eslint --max-warnings 9999 app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx app/constants/help-tooltips.ts`
  - `git diff --check` for modified tooltip files
- Screenshot: `docs/app-nav-map/screenshots/wpb-discount-tooltip-progress-fixed-20260513.png`

### 2026-05-13 01:28 - Chrome verification resumed

- Reloaded the embedded Shopify Admin URL to refresh the app iframe after the session rollover; direct tunnel access was not used.
- Verified Step Flow and Category `?` hover cards render with EB-style visual content and explanatory copy.
- Verified dirty-section guard:
  - changing `Display variants as individual products` opens the Shopify Save Bar
  - attempting to switch to `Discount & Pricing` is blocked
  - error toast says `Save or discard your changes before moving to another section.`
  - Discard clears dirty state
  - section navigation succeeds after Discard
- Verified top `Readiness Score` button opens the existing readiness overlay/checklist entry point.
- Verified Discount Display Options controls:
  - `Progress Bar` toggles on, shows Simple/Step Based modes, and mode selection changes state
  - `Progress Bar` tooltip renders EB-style rich help
  - `Bundle Quantity Options` toggles on after clean state, shows rule option fields and the `Make this rule default` button
  - Discard restores the display option changes
- Screenshots captured:
  - `docs/app-nav-map/screenshots/wpb-step-flow-tooltip-verified-20260513.png`
  - `docs/app-nav-map/screenshots/wpb-category-tooltip-verified-20260513.png`

### 2026-05-12 20:40 - Continuing EB visual parity after Chrome comparison

- Chrome compared the current WPB edit flow with EB page 2.
- Confirmed remaining visible gaps in this slice: WPB canvas width is too wide, header lacks EB's back-arrow layout, banner still reads too thick, Sync Product/How to setup need EB-style link treatment, and left cards need tighter EB sizing.
- Next patch will keep the current data model unchanged and only adjust layout/control styling plus the existing dirty-navigation guard.

### 2026-05-12 20:22 - Starting EB left-card parity and dirty section guard

- User requested 100% accurate Bundle Product and Bundle Setup card UI/copy parity with Easy Bundles, including subtle light-gray elements.
- User requested section navigation to be blocked while the current section has unsaved changes.
- Required UX for blocked navigation: red/background error toast plus Save Bar attention/irritation animation using Shopify App Bridge Save Bar behavior.
- Scope: left-column Bundle Product/Bundle Setup cards, section-change guard, and Chrome comparison against EB page 2.
- Constraint: no autosave; merchant must Save or Discard through the Save Bar before moving sections.

### 2026-05-12 20:13 - Starting EB banner/modal copy parity

- User requested removal of the left-panel Readiness Score card.
- User requested banners and modals to follow Easy Bundles design/copy, replacing `Easy Bundles` with `Wolfpack Bundles`.
- Scope: edit-flow left rail, app embed banner copy/action styling, and visible modal headings/body/action copy in the full-page bundle configure route.
- Constraint: no data model changes; use Polaris Web Components for banners/modals and keep custom CSS only for existing layout shells.

### 2026-05-12 20:14 - Save ownership clarification

- User clarified that autosave is not required anywhere.
- Save ownership should stay with the merchant: controls mark the form dirty and show the App Bridge Save Bar, but changes should not be silently saved.
- Scope added to this pass: inspect edit-flow submit paths and remove/avoid any auto-save behavior that is not a deliberate merchant action.

### 2026-05-12 20:21 - EB banner/modal copy parity completed

- Removed the left-panel Readiness Score card while keeping the top compact readiness button and floating readiness checklist trigger.
- Updated the app embed banner to EB copy with Wolfpack naming:
  `Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle.`
- Changed the app embed banner action to `Enable here` and removed the dismiss action to match EB's persistent setup alert.
- Updated discount/pricing info banners to the EB tip copy.
- Tightened visible modal headings and body copy around Wolfpack Bundles wording:
  pricing setup warning, add-to-storefront modal, selected product/collection modals, message variables modal, and sync modal.
- Confirmed the edit flow does not perform timer/debounce autosave. Changed controls still only mark dirty and expose the App Bridge Save Bar.
- Chrome verified:
  - left rail no longer contains the Readiness Score card
  - banner copy/action render in the embedded Shopify Admin app
  - Message variables modal opens with Wolfpack Bundles copy and closes via `Done`
  - changing Discount Messaging shows the Save Bar without saving; `Discard` restores the value
- Screenshot: `docs/app-nav-map/screenshots/wpb-edit-banner-readiness-card-removed-20260512.png`.

### 2026-05-12 19:26 - Starting EB Step Flow and rich tooltip parity

- User requested the Step Setup step flow to be brought closer to Easy Bundles.
- User also requested all tooltips to follow EB's richer pattern: image/visual on top with text below in one hover component.
- Shopify App Home `s-tooltip` only supports text/paragraph/raw text content, so this pass will use Polaris Web Components for the trigger and a narrowly-scoped custom hover/focus overlay for the richer EB-style content.
- Scope: Step Flow card, reusable rich help tooltip component, and visible tooltip replacements in the edit configure page.
- Constraint: no Prisma, handler payload, metafield, or persisted-state changes.

### 2026-05-12 19:39 - EB Step Flow and rich tooltip parity completed

- Reworked Step Flow into an EB-style card with numbered step chips, a dark `Add Step` action, and active-step remove affordance.
- Added a reusable rich help tooltip component with hover/focus support, a visual timeline block, and explanatory text below it in a single overlay card.
- Replaced visible edit-route tooltip usages with the richer help component:
  Step Flow `How to setup?`, Rules `Learn More`, Discount Display Options help controls, and Bundle Assets storefront loading help.
- Chrome verified:
  - Step Flow tooltip renders the visual and text without clipping.
  - Step 2 navigation works and does not open the Save Bar.
  - No browser console errors were introduced; only existing Polaris/app warnings are present.
- Screenshot: `docs/app-nav-map/screenshots/wpb-step-flow-rich-tooltip-fixed-20260512.png`.

### 2026-05-12 14:21 - Starting iterative EB comparison pass

- User clarified that the edit flow does not require `Subscriptions` or `Select template`.
- Scope for this slice: remove those sections from the edit-flow navigation and app canvas, remove subscription-only entry points from Bundle Settings, then verify the remaining shell in Chrome against EB before making further visual changes.
- Constraint: keep the changes incremental and compare each visible result with EB page 2 through Chrome DevTools MCP.

### 2026-05-12 14:30 - EB comparison slice completed

- Removed `Subscriptions` and `Select template` from the edit-flow left rail, app canvas, and template picker modal surface.
- Removed the subscription-only integration row from Bundle Settings.
- Reworked Bundle Settings from grouped Wolfpack headings into EB-style flat setting blocks:
  Pre Selected Product, Enable Quantity Validation, Product Slots, Slot Icon, Variant Selector,
  Show Text on + Button, Bundle Cart, Cart line item discount display, Bundle Banner,
  Bundle Level CSS, product price display controls, and Bundle Status.
- Verified in Chrome:
  - section removal is visible in the embedded Shopify Admin app
  - Bundle Settings now follows EB's flat setting sequence more closely
  - Pre Selected Product checkbox opens the App Bridge Save Bar
  - Discard restores the browser test change
- Screenshots:
  - `docs/app-nav-map/screenshots/wpb-edit-step-setup-after-section-removal-20260512.png`
  - `docs/app-nav-map/screenshots/wpb-edit-bundle-settings-eb-flat-20260512.png`

### 2026-05-12 14:34 - Starting Step Setup category/rules parity slice

- EB live comparison shows Step Setup keeps category management inside the Step Setup block and uses radio choices for No rules / Step rules / Category rules.
- Scope for this slice: replace the static rule mode cards with radio controls, add EB-style helper copy/action placement, and move Category Filters into the Category List card as filter tab controls.
- Constraint: preserve existing saved `filters` data and step condition rules; do not add a new backend-only rule mode field in this UI pass.

### 2026-05-12 14:39 - Step Setup category/rules parity slice completed

- Moved category filter tab management into the Category List card under an EB-style `Category` block.
- Removed the separate `Category Filters` card from Step Setup.
- Replaced static rule mode cards with Polaris Web Components `s-choice-list` / `s-choice`, following Shopify's App Home ChoiceList docs.
- Rule mode is inferred from existing saved data:
  - no step conditions → No rules
  - step conditions without filters → Step rules
  - step conditions with filters → Category rules
- Chrome verified the embedded edit flow now exposes `No rules`, `Step rules`, and `Category rules` as real radios, with Step rules selected for the current bundle.
- Screenshot: `docs/app-nav-map/screenshots/wpb-edit-step-setup-category-rules-20260512.png`.

### 2026-05-12 19:07 - Starting EB Step Setup structure pass

- User approved the recommended no-data-model pass.
- Scope: remove the WPB-only active-step overview card, reshape the first per-step card into EB-style `Step Setup`, move icon/title controls into a lower `Step Config` card, and keep all controls mapped to existing step fields only.
- Explicit constraint: consult the user before any Prisma, handler payload, metafield, or new persisted-state changes.

### 2026-05-12 19:16 - EB Step Setup structure pass completed

- Removed the WPB-only active-step overview card from Step Setup.
- Reworked the first per-step card into EB-style `Step Setup` with enable control, helper copy, and step name.
- Moved `Display variants as individual products` under the Category block, matching EB's placement.
- Moved step icon and page title controls into a lower `Step Config` card.
- Moved previous Advanced Step Options controls out of the main Step Setup surface and into the existing `Free Gift & Add Ons` sub-item.
- Chrome verified:
  - Step Setup now renders in the order: Step Flow → Step Setup → Category List/Category → Rules Configuration → Step Config.
  - Free Gift & Add Ons opens as a separate child section.
  - Toggling `Display variants as individual products` opens the App Bridge Save Bar; test change was discarded.
- Screenshot: `docs/app-nav-map/screenshots/wpb-edit-step-setup-eb-structure-20260512.png`.

### 2026-05-12 19:21 - Starting edit readiness overlay parity

- User requested the bundle readiness score component on the edit bundle flow similarly to the create bundle overlay.
- Found create flow mounts `BundleReadinessOverlay` with its floating collapsed trigger visible.
- Found edit flow mounts the same component but passes `hideCollapsedTrigger`, so the floating trigger is hidden unless opened through custom header/rail buttons.
- Scope: remove the hidden-trigger behavior on edit while keeping the existing compact header score and left-rail checklist button.

### 2026-05-12 19:23 - Edit readiness overlay parity completed

- Removed `hideCollapsedTrigger` from the edit flow `BundleReadinessOverlay` mount.
- Edit flow now shows the same floating readiness overlay trigger used by the create bundle workflow.
- Kept the EB-style compact header readiness score and left-rail checklist entry points.
- Chrome verified on the embedded Shopify Admin URL.
- Screenshot: `docs/app-nav-map/screenshots/wpb-edit-readiness-overlay-visible-20260512.png`.

### 2026-05-12 13:49 - Starting EB design parity refinement pass

- Goal: tighten the edit bundle UI to more closely match Easy Bundles' edit page structure and spacing.
- Files to modify: full-page configure route and route CSS.
- Scope: Step Setup structure, Bundle Settings row presentation, Select template overlay-style presentation, and live Chrome verification against EB.
- Constraint: use Polaris web components first; map EB controls to existing persisted settings where possible and document data-model gaps instead of inventing silent non-persisted behaviour.

### 2026-05-12 14:10 - EB design parity refinement implemented

- Step Setup:
  - Added an EB-style active-step overview card with step number, selected product/collection counts, enabled control, product slots, variant display toggle, and preselected-product status.
  - Renamed the product picker block to `Category List` and tightened copy to match EB's category/product framing.
  - Reworked `Rules` heading into `Rules Configuration` and added EB-style mode cards for No rules / Step rules / Category rules.
  - Fixed unlabeled Polaris checkboxes in Advanced Step Options by using explicit `label` props.
- Bundle Settings:
  - Replaced loose checkbox cards with EB-style setting rows grouped into Pre Selected Product, Product Display, Bundle Cart, Design, and Bundle Status.
  - Mapped persisted controls to existing data: product slots, variant selector, add button text, cart title/subtitle, checkout redirect, product price display, compare-at price display, quantity changes, and status.
  - Added EB-placement rows that route to existing sections for icons, subscriptions, discount display, and banner management.
- Select template:
  - Replaced inline template cards with an EB-style summary row and Polaris modal template picker.
  - Verified template selection opens the App Bridge Save Bar and discarded the browser test change.
- Chrome verification:
  - Verified Step Setup, Bundle Settings, and Select template modal in the embedded Shopify Admin tab.
  - Captured screenshot: `docs/app-nav-map/screenshots/wpb-eb-parity-bundle-settings-20260512.png`.
- Remaining data-model gaps:
  - EB-specific bundle-level Product Slots / Slot Icon / Bundle Level CSS controls still map to existing step-level or design-panel controls.
  - Pre-order & Subscription Integration still opens the Subscriptions section; persisted subscription-plan integration remains future backend work.

### 2026-05-11 19:35 - Direction reset and Step Setup image map

- Direction changed: do not unify Create Bundle and Edit Bundle flows.
- Edit Bundle redesign will follow the supplied design images section by section.
- Added Step Setup image #1 control map and conflict-placement options.
- Documented controls in the image, current edit controls that fit, and extra edit features that need placement decisions.
- Chrome DevTools MCP remains blocked: direct `list_pages` returns “The selected page has been closed. Call list_pages to see open pages.”
- Files: `docs/edit-bundle-ui-redesign/step-setup-image-1-control-map.md`, `docs/issues-prod/edit-bundle-ui-redesign-1.md`

### 2026-05-11 19:45 - Chrome logged-in profile launch attempt

- Tried launching Google Chrome with the existing Default profile and `--remote-debugging-port=9222`.
- Chrome is listening on `127.0.0.1:9222`, but `/json/version` and `/json/list` return HTTP 404.
- Tried a second non-disruptive launch on port `9223` using the same Chrome user data directory; Chrome did not open a listener on that port, likely because the default profile is already locked by the running Chrome process.
- DevTools MCP still fails on direct `list_pages` with the stale closed-page error.
- Next browser recovery option requires user approval because it would involve quitting/relaunching Chrome or using a copied temporary profile.

### 2026-05-11 19:55 - Chrome verification rule added

- After Chrome restart, DevTools MCP recovered and listed Shopify Admin app tabs.
- Confirmed direct Cloudflare tunnel URLs redirect to `/auth/login` and are not usable for embedded app verification.
- Added this rule to `CLAUDE.md`: live app verification must use the Shopify Admin embedded URL, not the direct tunnel URL.

### 2026-05-11 20:05 - Live Step Setup verification

- Used Chrome DevTools MCP on the embedded Shopify Admin app URL.
- Confirmed dashboard Edit currently routes FPB edit into `/app/bundles/create/configure/:bundleId`, which conflicts with the renewed separate edit-flow direction.
- Opened the legacy FPB edit route directly through the Shopify Admin embedded URL.
- Captured current viewport screenshot: `docs/app-nav-map/screenshots/edit-step-setup-current-20260511.png`.
- Verified current Step Setup defects against Image #1:
  - Title and title-bar actions differ from target.
  - App Embed banner appears in the route but not the design image.
  - Bundle Setup nav has extra Bundle Settings and Widget Text items.
  - Nav status labels from the image are missing.
  - Custom Fields row is missing from Step Summary.
  - Category Filters and Advanced Step Options are inline cards but not shown in the target image.
  - Footer Back/Next actions are missing.
- Updated `docs/edit-bundle-ui-redesign/step-setup-image-1-control-map.md` with live findings.

### 2026-05-11 20:07 - Discount & Pricing image map

- Added Discount & Pricing image control map for the second supplied design image.
- Used Chrome DevTools MCP on the current Wolfpack edit route and Easy Bundles page 2.
- Captured current Wolfpack Discount & Pricing screenshot:
  `docs/app-nav-map/screenshots/edit-discount-pricing-current-20260511.png`
- Captured Easy Bundles Discount & Pricing screenshot:
  `docs/app-nav-map/screenshots/easy-bundles-discount-pricing-20260511.png`
- Documented controls that directly fit, current extra controls, Easy Bundles-only controls,
  and placement decisions needed before implementation.
- Files: `docs/edit-bundle-ui-redesign/discount-pricing-image-2-control-map.md`,
  `docs/issues-prod/edit-bundle-ui-redesign-1.md`

### 2026-05-11 20:31 - Discount display options confirmed

- User clarified Bundle Quantity Options should not be deferred because they are based on
  the Pricing Tiers concept.
- Bundle Quantity Options and Progress Bar Options are now required in the edit pricing
  redesign.
- Documented that both must integrate with existing step conditions and discount
  conditions.
- Verified current Polaris Web Components package includes `s-tooltip`; tooltip content is
  text/paragraph/raw text only, so implementation should use native Polaris tooltip before
  considering custom CSS.
- Captured EB hover investigation screenshot:
  `docs/app-nav-map/screenshots/easy-bundles-tooltip-hover-quantity-options-20260511.png`
- Files: `docs/edit-bundle-ui-redesign/discount-pricing-image-2-control-map.md`,
  `docs/issues-prod/edit-bundle-ui-redesign-1.md`

### 2026-05-11 23:38 - Starting app-canvas header and Discount Display Options polish

- User identified remaining edit-flow UX defects:
  - title-bar actions are still in the Shopify breadcrumb/title-bar instead of the app canvas
  - `Configure: {bundle name}` must also appear inside the iframe app canvas
  - App Embed warning banner copy needs rewrite
  - Discount Display Options copy and spacing are too heavy
  - tooltip behavior should be closer to Easy Bundles
  - Template Variables should move behind a lighter help button / modal pattern
  - component and child padding needs tightening across the current edit cards
- Next: inspect current header/action placement, App Embed banner, and Discount Display
  Options JSX before applying Polaris Web Component changes.

### 2026-05-11 23:45 - Chrome EB comparison pass

- Starting live Chrome DevTools comparison against Easy Bundles page 2.
- Goal: identify and fix remaining UI/UX gaps in the edit flow instead of relying on the
  earlier static image alone.
- Focus areas:
  - app-canvas header/action placement
  - warning banner tone/copy/action placement
  - Discount Display Options row layout and expansion pattern
  - tooltip/help behavior
  - Template Variables help modal
  - card and child padding consistency

### 2026-05-11 23:55 - Chrome-tested EB alignment fixes

- Moved Preview on Storefront, Sync Bundle, and Add to Storefront out of the Shopify
  title-bar/breadcrumb banner and into the edit app canvas header.
- Added the app-canvas `Configure: {bundle name}` heading with compact readiness score
  button; clicking the score opens the existing readiness checklist overlay.
- Rewrote the App Embed warning banner with Polaris `s-banner` and clearer copy/action.
- Reworked Discount Display Options to follow the EB row pattern:
  Bundle Quantity Options, Progress Bar, and Discount Messaging each use a left label/copy,
  native Polaris tooltip trigger, and right-side checkbox.
- Added a lightweight Template Variables help modal using Polaris modal command controls;
  Chrome verified `Show Variables` opens and `Done` closes.
- Fixed Bundle Quantity Options expansion to use `Rule #1` labels and the required
  `Make this rule default` action.
- Fixed Progress Bar mode behavior so new/enabled progress bars default to Step Based,
  preserving the existing widget implementation while still allowing Simple mode.
- Chrome verification completed against the embedded Admin page and EB reference tab:
  action placement, readiness overlay, modal open/close, Save Bar dirty state, bundle
  quantity toggle, progress toggle, radio mode switching, and tooltip hover.
- Captured after screenshot:
  `docs/app-nav-map/screenshots/edit-discount-pricing-after-eb-alignment-20260511.png`
- Validation:
  - `npx jest tests/unit/lib/pricing-display-options.test.ts tests/unit/lib/pricing-display-defaults.test.ts --runInBand` — 14 passed
  - `npx eslint --max-warnings 9999 ...` — 0 errors, existing warnings only
  - `git diff --check ...` — passed

### 2026-05-12 10:07 - Starting full EB edit-page parity pass

- User direction changed from section-by-section approximation to copying EB's edit page
  architecture and feature placement as closely as possible.
- Live Chrome page 2 EB map captured:
  - Header: `Configure Bundle Flow`, compact readiness score, `Preview Bundle`
  - App embed alert: inline warning plus `Enable here`
  - Left column: Bundle Product card, Bundle Setup rail, Readiness Score card
  - Bundle Setup rail items: Step Setup, Discount & Pricing, Bundle Visibility,
    Bundle Settings, Subscriptions, Select template
  - Step Setup has expanded subitems in EB: Free Gift & Add Ons, Messages
  - Bundle Visibility has publishing best-practice cards, bundle link, Bundle Widget CTA
  - Bundle Settings has preselected products, quantity validation, product slots, variant selector,
    show text on add button, subscription integration, bundle cart text, cart discount display,
    banner images, bundle-level CSS, bundle status
  - Subscriptions has setup help and plan fetch CTA
  - Select template opens a customization overlay with template cards
- Screenshots captured:
  - `docs/app-nav-map/screenshots/eb-step-setup-full-20260512.png`
  - `docs/app-nav-map/screenshots/eb-current-pricing-page-full-20260512.png`
  - `docs/app-nav-map/screenshots/eb-bundle-visibility-full-20260512.png`
  - `docs/app-nav-map/screenshots/eb-bundle-settings-full-20260512.png`
  - `docs/app-nav-map/screenshots/eb-subscriptions-full-20260512.png`
- Implementation priority: first patch the persistent shell and section navigation to match EB,
  then move existing Wolfpack controls into EB-compatible section placements without losing saved
  features.

### 2026-05-12 13:42 - EB shell and rail parity implemented

- Reworked the edit page app-canvas header toward EB:
  - heading changed to `Configure Bundle Flow`
  - retained compact readiness score button
  - primary header action changed to `Preview Bundle`
- Replaced the old full-page sidebar structure with EB's persistent shell:
  - Bundle Product card now appears for full-page bundles
  - Sync Product and Edit Product live in the product card
  - parent product status appears in the product card
  - Bundle Setup rail now follows EB labels: Step Setup, Discount & Pricing,
    Bundle Visibility, Bundle Settings, Subscriptions, Select template
  - Step Setup shows EB-style child links for Free Gift & Add Ons and Messages
  - Readiness Score card moved into the left rail
- Reworked Bundle Visibility around EB placement concepts:
  - Publishing Best Practices cards
  - Your Bundle Link with copy action and editable page slug
  - Bundle Widget placement CTA
  - retained Wolfpack media asset controls below the EB placement content
- Added EB-compatible Subscriptions section shell with setup/help CTA.
- Added EB-compatible Select Template section with Standard, Classic, Compact, and Horizontal cards.
- Moved Bundle Cart title/subtitle and Bundle Status into Bundle Settings, matching EB placement.
- Chrome verification on page 1:
  - verified EB shell renders after reload
  - verified Bundle Visibility, Bundle Settings, Subscriptions, and Select Template rail navigation
  - verified Select Template triggers Save Bar dirty state
  - discarded the browser test change after verification
- Captured after screenshot:
  `docs/app-nav-map/screenshots/wpb-eb-parity-shell-select-template-20260512.png`
- Remaining parity gaps:
  - Step Setup still needs deeper EB category/rules restructuring.
  - Bundle Settings still lacks persisted EB controls for preselected products, product slots,
    variant selector mode, show text on add button, subscription integration, and cart discount
    display customization.
  - Select Template uses local cards instead of EB's overlay presentation.

### 2026-05-11 14:30 - Phase 7: Minor configure page polish

- Pricing Tiers header inner `s-stack`: added `gap="small-400"` for consistent subtitle spacing
- Nav sidebar: removed stale "Set-up your bundle builder" subtitle (no longer accurate, cluttered sidebar)
- Messages language `s-select`: added `value={textOverridesLocale}` so selected locale stays visible; migrated `<option>` → `<s-option>` per Polaris web components rule
- Files: route.tsx

### 2026-05-11 14:00 - Phase 6: Messages nav + header polish

- Added `{ id: "messages", label: "Messages", fullPageOnly: false }` to `bundleSetupItems` — restores the Messages nav item that was deferred in Phase 2
- Bundle Settings header: `s-icon name="image-alt"` → `note`, fontWeight 500 → 600, padding 12 → `var(--s-space-400)`
- Messages section header: `s-icon name="list-numbered"` → `note`, fontWeight 500 → 600, padding 12 → `var(--s-space-400)`, label "Messages" → "Widget Text"
- Files: route.tsx

### 2026-05-10 12:00 - Starting Phase 1–5 implementation
- What I'm about to implement: full Step Setup redesign + sidebar + assets + handler
- Files to modify:
  - `app/styles/routes/full-page-bundle-configure.module.css`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Expected outcome: edit FPB configure page matches design image #9

### 2026-05-10 14:00 - Completed Phases 1–5
- ✅ Phase 1: Step Setup right panel — chip navigation with forward/backward slide animation, Step Configuration card (timelineIconUrl icon preview + Upload, step name, pageTitle field, Multi Language button), Select Product card (Browse Products / Browse Collections tabs with count badges, product actions), Rules card (empty state or rulesList grid, add rule button), Advanced Step Options card (free gift toggle, mandatory product toggle + variant GID + picker, Clone + Delete buttons)
- ✅ Phase 2: Left sidebar — removed Messages nav item (bundleSetupItems array), removed Storefront Page <s-section>, added Step Summary IIFE (selected products count, rules count, filters count, search bar status, Preview button)
- ✅ Phase 3: Bundle Assets — added Storefront Page URL slug `<s-section>` at the top of the images_gifs content block, with page-slug text field and View on Storefront button
- ✅ Phase 4: Handler — added searchBarEnabled parse + bundle update; added timelineIconUrl + pageTitle to step create in handleSaveBundle
- ✅ Phase 5: CSS — added ~200 lines of new classes: stepNav, stepChip, stepChipActive, addStepBtn, slideForward/Backward, @keyframes, card, cardHeader, stepConfigRow, iconColumn, iconBox, iconImg, iconPlaceholder, fieldsColumn, tabRow, tab, tabActive, tabBadge, productActions, emptyState, rulesList, ruleRow, sideCard, summaryList, summaryItem, summaryLabel, summaryValue, summaryValueActive, previewButtonWrap
- Files modified: route.tsx (~2934→~2610 lines), handlers.server.ts, full-page-bundle-configure.module.css
- ESLint: 0 errors, 880 warnings (all pre-existing any usage)
- Next: await design images for remaining sections (Discount & Pricing, Bundle Assets full, Pricing Tiers, Bundle Settings)

## Related Documentation

- Design: Image #9 provided in conversation (2026-05-10)
- Create flow reference: `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- Create flow CSS reference: `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`
