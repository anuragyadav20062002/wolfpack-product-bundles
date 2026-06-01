# Issue: EB Settings, Integrations, and Bundle Edit Replication
**Issue ID:** eb-replication-recovery-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 22:40

## Overview
Recover EB behavior from deployed runtime evidence, previous internal documentation, and live Chrome inspection so Wolfpack can replicate Settings, Integrations, and key bundle edit sections with exact UI and functionality parity.

Focus areas:
- Settings / brand configuration.
- Integrations.
- Bundle Visibility.
- Bundle Widget.
- Bundle Embed.
- Bundle Settings.
- Subscriptions.
- Select template.

Constraints:
- Redact all tokens, session identifiers, and credentials from committed artifacts.
- Use deployed bundles as behavior and schema evidence; do not commit proprietary bundled source verbatim.
- Keep competitor references in documentation only.
- Choose Polaris web components or custom components based on exact parity requirements.

## Progress Log
### 2026-06-01 14:43 - Started recovery and parity goal
- Created the issue file before making repository artifact changes.
- Confirmed the target scope: Settings, Integrations, and bundle edit sections that require 100% EB parity.
- Next steps: capture EB route maps, Settings and Integrations behavior, and bundle edit section schemas into sanitized evidence docs.

### 2026-06-01 14:46 - Captured initial Settings and Integrations evidence
- Added `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`.
- Captured EB route manifest entries for Settings and Integrations.
- Captured Settings landing cards, Design Control Panel tabs and controls, contextual save/discard behavior, and the Integrations Hub card inventory.
- Next steps: capture Language and Controls sub-flows, every integration setup action, and the targeted bundle edit sections.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`
- `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`

## Phases Checklist
- [ ] Phase 1 - Capture route and bundle asset inventory.
- [ ] Phase 2 - Capture Settings / brand configuration behavior.
- [ ] Phase 3 - Capture Integrations behavior.
- [ ] Phase 4 - Capture Bundle Visibility, Widget, Embed, Settings, Subscriptions, and Select template behavior.
- [ ] Phase 5 - Produce parity gap matrix against Wolfpack.
- [ ] Phase 6 - Prepare clean-room implementation plan and test specs.

### 2026-06-01 19:12 - Started Settings Controls content parity fix
- Refreshed live EB Additional Configurations evidence for Configuration, CSS & Scripts, Integrations, and Advanced tabs.
- Found the current route preserved tab labels but rendered generic content headings and generic developer fields instead of the live EB section labels/helper copy.
- Next: extend the recovered Controls tab contract with content headings/descriptions and exact visible field labels, then render those values from the Settings route.

### 2026-06-01 19:18 - Completed Settings Controls content parity fix
- Updated `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md` with sanitized live Additional Configurations evidence for all four Controls tabs.
- Extended `app/lib/recovered-admin-surfaces.ts` so Controls tabs can keep EB tab labels while rendering the captured content headings, helper text, and field labels.
- Updated `app/routes/app/app.settings.tsx` to render `contentTitle` and `contentDescription` from the selected Controls tab.
- Updated route/source contract coverage and the recovered Admin surfaces test spec.
- Validation not run by instruction.

### 2026-06-01 19:24 - Started Settings Controls Product Page Layout parity fix
- Refreshed live EB Additional Configurations after switching the layout selector from Landing Page Layout to Product Page Layout.
- Found Product Page Layout exposes `Configuration` and `CSS & Scripts` tabs only, with product-page-specific bundle settings, redirect settings, CSS, custom script, and selector fields.
- Next: replace the generic Product Page Layout controls contract with the captured live labels and remove non-evidenced Product Page `Integrations` and `Advanced` tabs.

### 2026-06-01 19:30 - Completed Settings Controls Product Page Layout parity fix
- Updated `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md` with sanitized Product Page Layout Additional Configurations evidence.
- Updated `app/lib/recovered-admin-surfaces.ts` so Product Page Layout exposes only `Configuration` and `CSS & Scripts`, matching the live EB branch.
- Replaced generic product-page controls with captured labels for bundle settings, cart messaging, redirect settings, Mix And Match custom CSS, custom script, and selector fields.
- Updated recovered Admin surface tests and the test spec for the Product Page Layout controls contract.
- Validation not run by instruction.

### 2026-06-01 19:36 - Started PPB Bundle Visibility overview copy parity fix
- Inspected the current Product Page Bundle configure route for Bundle Widget and Bundle Embed surfaces.
- Found the deeper sections use captured EB headings/descriptions, but the Bundle Visibility overview cards still use generic copy before navigating into those sections.
- Next: align the overview card descriptions to the captured Widget and Embed section descriptions and add source-contract coverage.

### 2026-06-01 19:42 - Completed PPB Bundle Visibility overview copy parity fix
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so the Bundle Visibility overview card for Bundle Widget uses the captured upsell-widget description.
- Updated the Bundle Embed overview card to use the captured embed-builder description from the deeper Bundle Embed section.
- Added `tests/unit/routes/ppb-bundle-visibility-overview-copy.test.ts` to prevent the generic overview copy from returning.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the PPB Widget/Embed overview-copy scenario.
- Validation not run by instruction.

### 2026-06-01 19:48 - Started PPB Bundle Embed default/save contract hardening
- Inspected PPB Bundle Widget and Bundle Embed defaults against captured evidence.
- Confirmed the captured PPB Bundle Embed title default is `Build Your Bundle & Save More` and the route currently saves Title/Sub Title through `bundleUpsellConfig.upsellConfiguration`.
- PPB Widget Button Text value was not captured in the live evidence, so no unsupported copy change will be made for that fallback.
- Next: add explicit source-contract coverage for Bundle Embed default title and save payload shape.

### 2026-06-01 19:54 - Completed PPB Bundle Embed default/save contract hardening
- Updated `tests/unit/routes/ppb-bundle-embed-copy.test.ts` to lock the captured `Build Your Bundle & Save More` default and the Bundle Embed save payload shape.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Bundle Embed default/save scenario.
- Added an implementation note to `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md` clarifying that PPB Widget Button Text value was not captured and should not be inferred from this evidence.
- No runtime source behavior was changed in this slice because the current Bundle Embed implementation already matched the captured default and payload model.
- Validation not run by instruction.

### 2026-06-01 20:00 - Started FPB Bundle Visibility Widget overview copy parity fix
- Inspected the current FPB Bundle Visibility overview and captured FPB Bundle Widget evidence.
- Found the deeper Bundle Widget section uses the captured upsell block/button wording, but the `Want more placement options` overview card still uses generic `Add a bundle button to specific product pages` copy.
- Next: align the FPB overview card description with the Bundle Widget section copy and add source-contract coverage.

### 2026-06-01 20:06 - Completed FPB Bundle Visibility Widget overview copy parity fix
- Updated `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` so the `Want more placement options` Bundle Widget card uses the captured upsell block/button description.
- Added `tests/unit/routes/fpb-bundle-visibility-overview-copy.test.ts` to prevent the generic bundle-button copy from returning.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the FPB Widget overview-copy scenario.
- Validation not run by instruction.

### 2026-06-01 20:12 - Started Settings Controls layout selector parity fix
- Inspected the current `app.settings` Additional Configurations route against live EB Settings Controls evidence.
- Found EB renders the layout choice as a selected dropdown-style control, while the current route renders both layouts as a segmented button group.
- Next: switch the route to a single layout selector that resets the active tab to the selected layout's first tab and add source-contract coverage.

### 2026-06-01 20:18 - Completed Settings Controls layout selector parity fix
- Updated `app/routes/app/app.settings.tsx` so Additional Configurations uses one `Layout selector` select control instead of rendering layout options as layout tabs.
- Preserved behavior that changing the layout resets the active Controls tab to the selected layout's first tab.
- Added selector styles in `app/styles/routes/recovered-admin-surfaces.module.css`.
- Updated Settings Controls source-contract tests and `test-spec/recovered-admin-surfaces.spec.md` for the selector behavior.
- Validation not run by instruction.

### 2026-06-01 20:24 - Started Integrations logo image parity fix
- Refreshed live EB Integrations Hub snapshot.
- Found every integration card renders a vendor logo image from the public assets CDN, while the current WPB Integrations route renders text-logo blocks.
- Next: add sanitized public logo URLs to the recovered integrations contract, render images with text fallback, and lock the route/data shape with source-contract coverage.

### 2026-06-01 20:30 - Completed Integrations logo image parity fix
- Added public vendor logo URLs from live Integrations evidence to `app/lib/recovered-admin-surfaces.ts`.
- Updated `app/routes/app/app.integrations.tsx` to render vendor logo images with text-logo fallback.
- Added `.logoImage` styling in `app/styles/routes/recovered-admin-surfaces.module.css`.
- Updated recovered Admin surface and Integrations route source-contract tests, plus the test spec.
- Updated the evidence document to record that live cards render vendor logo images.
- Validation not run by instruction.

### 2026-06-01 20:36 - Started Integrations CTA type behavior parity fix
- Inspected the current Integrations route against deployed bundle evidence for setup action behavior.
- Found the recovered contract includes `ctaType`, but the route renders every card click as the same generic guide panel.
- EB keeps the visible CTA label as `View Setup`, but routes guide cards to setup articles and Zapiet to chat.
- Next: consume `ctaType` in the route so chat cards render a chat-setup outcome while guide cards render setup guidance, without triggering external messages or copying sensitive data.

### 2026-06-01 20:42 - Completed Integrations CTA type behavior parity fix
- Updated `app/routes/app/app.integrations.tsx` so opened integration details render `Chat setup` for `ctaType: "chat"` and `Setup guide` for standard guide cards.
- Kept visible card CTA labels sourced from the recovered contract, preserving `View Setup` for every live card.
- Added `.guideHeading` styling in `app/styles/routes/recovered-admin-surfaces.module.css`.
- Updated Integrations source-contract coverage and `test-spec/recovered-admin-surfaces.spec.md`.
- Added an evidence implementation note explaining the safe clean-room handling of chat-vs-guide outcomes without triggering outbound messages.
- Validation not run by instruction.

### 2026-06-01 20:48 - Started Settings Controls CSS/JS grouping parity fix
- Inspected the current recovered Controls model and Settings route renderer against live EB Additional Configurations evidence.
- Found CSS & Scripts fields are flattened even though EB presents `CSS` and `JavaScript & Selectors` as separate sub-sections.
- Also found a malformed brace in the recovered `CONTROL_LAYOUTS` block that needs repair before further Settings work.
- Next: add field grouping metadata, render grouped sections in `DetailGroup`, and repair the Controls layout block.

### 2026-06-01 20:54 - Completed Settings Controls CSS/JS grouping parity fix
- Added `group` metadata to recovered Controls CSS & Scripts fields for `CSS` and `JavaScript & Selectors`.
- Repaired the recovered `CONTROL_LAYOUTS` block structure.
- Updated `app/routes/app/app.settings.tsx` so `DetailGroup` renders grouped field sections instead of one flat field grid.
- Added `.fieldGroup` and `.fieldGroupTitle` styles.
- Updated Settings Controls route/source coverage, recovered Admin surface tests, the test spec, and evidence notes.
- Validation not run by instruction.

### 2026-06-01 21:00 - Started Settings Controls Integrations grouping parity fix
- Using captured live EB Additional Configurations evidence for the `Integrations` tab.
- Current recovered fields include the correct labels, but they are not grouped into the live EB sections for theme script integration, cart integration, and Judge.me integration.
- Next: add grouping metadata to the Integrations tab fields and update contracts/specs.

### 2026-06-01 21:06 - Completed Settings Controls Integrations grouping parity fix
- Added `group` metadata to the recovered Settings Controls `Integrations` tab for theme script integration, cart page integration, and Judge.me integration.
- Reused the grouped `DetailGroup` renderer added in the previous slice so the route will render these as sectioned groups.
- Updated recovered Admin surface contract coverage, the test spec, and evidence notes.
- Validation not run by instruction.

### 2026-06-01 21:12 - Started Settings Controls Advanced tab contract hardening
- Inspected the recovered Advanced tab against captured live EB evidence.
- Current data has the captured `Video Player Page Settings` heading and fields, but does not group them or lock them with direct tests.
- Next: add group metadata and contract coverage for the Advanced tab's video-player settings surface.

### 2026-06-01 21:18 - Completed Settings Controls Advanced tab contract hardening
- Added `Video Player Page Settings` group metadata to Advanced tab fields in `app/lib/recovered-admin-surfaces.ts`.
- Added recovered Admin surface test coverage for Advanced content heading, description, field labels, and grouping.
- Updated `test-spec/recovered-admin-surfaces.spec.md` and the evidence document with the Advanced tab grouping expectation.
- Validation not run by instruction.

### 2026-06-01 21:24 - Started Settings Controls Configuration grouping parity fix
- Using captured live EB Additional Configurations evidence for Landing Page Layout and Product Page Layout Configuration tabs.
- Current recovered Configuration fields have the right labels, but still render as one flat field group.
- Next: add group metadata for Bundle Settings, Cart Messaging, Checkout/Redirect Settings, and Font Settings so the grouped renderer matches the live section hierarchy more closely.

### 2026-06-01 21:30 - Completed Settings Controls Configuration grouping parity fix
- Added grouping metadata to Landing Page Layout Configuration fields for Bundle Settings, Cart Messaging, Checkout Settings, and Font Settings.
- Added grouping metadata to Product Page Layout Configuration fields for Bundle Settings, Cart Messaging, and Redirect Settings.
- Updated recovered Admin surface tests, the test spec, and the evidence document with the Configuration grouping expectation.
- Validation not run by instruction.

### 2026-06-01 21:36 - Started Settings Language Product Card hierarchy parity fix
- Inspected the current Settings Language route against captured live EB Language Configurations evidence.
- Found the route renders Template Language chips and then jumps directly to `Button Configuration`, missing the captured `Product Card` content context and its description.
- Next: add the Product Card heading/description and the Button Configuration description.

### 2026-06-01 21:42 - Completed Settings Language Product Card hierarchy parity fix
- Updated `app/routes/app/app.settings.tsx` so Template Language renders `Product Card` context before `Button Configuration`.
- Added the captured description `Product card button text and action labels` to the Product Card context and Button Configuration detail group.
- Updated `tests/unit/routes/settings-language-section-copy.test.ts` and `test-spec/recovered-admin-surfaces.spec.md`.
- Validation not run by instruction.

### 2026-06-01 21:48 - Started PPB Subscriptions gating copy parity fix
- Inspected FPB and PPB configure routes against captured Subscriptions evidence.
- Current PPB Subscriptions has heading, How to setup, description, setup guide, and Get Subscription Plans action.
- Captured EB evidence also includes a BXGY discount-type warning: subscriptions cannot be enabled on bundles with Buy X, Get Y discounts.
- Next: add the captured warning as static guidance in the PPB Subscriptions section and lock it with source-contract coverage.

### 2026-06-01 21:54 - Completed PPB Subscriptions gating copy parity fix
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so PPB Subscriptions shows the captured Buy X, Get Y discount gating warning.
- Updated `tests/unit/routes/ppb-subscriptions-setup-guide.test.ts` and `test-spec/recovered-admin-surfaces.spec.md` to lock the warning copy.
- Validation not run by instruction.

### 2026-06-01 22:00 - Started PPB setup rail route contract hardening
- Inspected PPB setup navigation against captured live evidence.
- Shared `PRODUCT_PAGE_SETUP_ITEMS` already matches the captured rail order: Step Setup, Discount & Pricing, Bundle Visibility, Bundle Settings, Subscriptions, Select Template.
- Current configure route imports and uses that shared list, and defines Bundle Widget plus Bundle Embed as Bundle Visibility children.
- Next: add route-level source-contract coverage so the configure route cannot drift away from the recovered navigation shape.

### 2026-06-01 22:06 - Completed PPB setup rail route contract hardening
- Added `tests/unit/routes/ppb-setup-rail-contract.test.ts`.
- Covered route usage of `PRODUCT_PAGE_SETUP_ITEMS`, Bundle Widget and Bundle Embed child entries, Subscriptions active-section rendering, and Bundle Embed section rendering.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the setup rail reachability scenario.
- Validation not run by instruction.

### 2026-06-01 15:07 - Captured Settings Language, Controls, and Integration route evidence
- Added sanitized evidence for Language Configurations including multilingual language list, shared Cart & Checkout fields, and route-bundle key families.
- Added Controls evidence for Landing Page and Product Page layout modes, CSS/scripts, integrations, advanced video settings, and hidden deployed-bundle control key families.
- Added Integration route-bundle behavior including setup link map, chat-vs-link behavior, and Stoq article facts.
- Next: read remaining integration setup articles, then continue EB bundle edit flow evidence for Bundle Visibility, Bundle Widget, Bundle Embed, Bundle Settings, Subscriptions, and Select template.

### 2026-06-01 15:25 - Captured first pass for bundle edit target sections
- Added deployed lazy chunk ownership for Bundle Visibility, Bundle Widget/Embed, Bundle Settings, Subscriptions, and Select template.
- Captured Bundle Visibility UI and the linked quick-guide article for hero, navigation, announcement, and featured-product placements.
- Captured Bundle Widget/Upsell UI, Bundle Settings fields, Subscriptions gated state, and Select template modal state.
- Next: compare these surfaces against our app route-by-route and implement the smallest parity slice with tests/specs before code changes.

### 2026-06-01 15:34 - Starting app-side Settings and Integrations parity slice
- Scope: add first-class Settings and Integrations Admin routes using sanitized recovered evidence, without embedding competitor identifiers in source code.
- Tests first: add a contract spec and unit tests for the recovered Admin surfaces data.
- Implementation: add shared route data, render Settings/Integrations pages, link them in the app shell, and update the app navigation map.
- Constraints: no sensitive token values, no external competitor URLs in code, and no validation run unless explicitly requested.

### 2026-06-01 15:41 - Implemented first Settings and Integrations Admin route slice
- Added `app/lib/recovered-admin-surfaces.ts` as a shared, sanitized contract for recovered Settings cards, language/control evidence, and Integrations inventory/setup behavior.
- Added TDD artifacts: `test-spec/recovered-admin-surfaces.spec.md` and `tests/unit/lib/recovered-admin-surfaces.test.ts`.
- Added `/app/settings` and `/app/integrations` routes that render the recovered Admin surfaces from the shared contract.
- Updated the embedded app nav menu and `docs/app-nav-map/APP_NAVIGATION_MAP.md` for the new routes.
- Validation not run yet per user workflow; next: route-level polish and comparison against rendered app, then continue deeper Settings Language/Controls behavior or bundle-section parity.

### 2026-06-01 15:48 - Starting detailed Settings parity slice
- Scope: expand the new Settings route from high-level evidence cards into detailed recovered Design, Language, and Controls panels.
- Tests first: extend recovered Admin surface contract coverage for design tabs, shared language fields, template language sections, controls tabs, and layout branches.
- Implementation: keep source sanitized and data-driven, with no token values or external competitor URLs.
- Next after this slice: continue Integrations setup guide details or bundle edit section parity depending on remaining highest-risk gap.

### 2026-06-01 15:55 - Expanded Settings route with detailed recovered field model
- Extended `app/lib/recovered-admin-surfaces.ts` with recovered Design tabs, Language shared/template fields, and layout-specific Controls tabs/fields.
- Updated `tests/unit/lib/recovered-admin-surfaces.test.ts` and `test-spec/recovered-admin-surfaces.spec.md` to lock the detailed Settings model.
- Updated `/app/settings` to render detailed panels for Design, Language, and Controls from the shared contract.
- Added CSS for field cards, chips, layout toggles, and tabbed Controls presentation.
- Validation not run yet per workflow; next: continue Integrations setup detail expansion or bundle edit section parity implementation.

### 2026-06-01 16:05 - Captured remaining integration setup evidence
- Captured subscription setup, review-widget CSS setup, page-builder embed setup, and checkout/side-cart redirect setup help articles opened from the deployed integrations flow.
- Redaction note: external help URLs and vendor runtime names remain documentation-only evidence and are not copied into application source strings.
- Next: expand the shared Settings/Integrations contract so the app renders setup-specific behavior, not generic placeholders.

### 2026-06-01 16:12 - Expanded recovered integrations setup contract
- Updated `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md` with setup facts captured from the deployed Integrations Hub help links.
- Expanded `app/lib/recovered-admin-surfaces.ts` so integration cards now describe concrete setup behavior for subscriptions, review CSS, page-builder embeds, and checkout/side-cart callbacks.
- Updated `tests/unit/lib/recovered-admin-surfaces.test.ts` to lock the recovered settings fields, controls tabs, integrations inventory, and setup behavior summaries.
- Validation not run by instruction; next step is a live UI pass or targeted validation if requested.

### 2026-06-01 15:12 - Started FPB Bundle Settings visual parity cleanup
- Live EB FPB Bundle Settings evidence shows the section order ends with Bundle Banner, Bundle Level CSS, then Bundle Status.
- Current WPB route still renders extra WPB-only controls after Bundle Level CSS: Show product prices, Show compare-at prices, and Allow quantity changes.
- Next: remove those extra controls from the FPB Bundle Settings UI while leaving existing hidden save/runtime plumbing untouched.

### 2026-06-01 15:18 - Removed non-EB FPB Bundle Settings controls
- Updated the evidence doc with the refreshed live FPB Bundle Visibility, Bundle Widget, Bundle Settings, Select template, and deployed chunk URL observations.
- Removed the extra FPB Bundle Settings UI section for Show product prices, Show compare-at prices, and Allow quantity changes because live EB does not render those controls in this section.
- Added a route source contract assertion to keep those non-evidenced controls out of the FPB Bundle Settings UI.
- Validation not run by instruction.

### 2026-06-01 15:24 - Started PPB Select template order parity fix
- Live EB PPB Select template overlay shows template cards in this order: Product List, Horizontal Slots, Product Grid, Vertical Slots.
- Current WPB product-page route defines the cards as Product List, Product Grid, Horizontal Slots, Vertical Slots.
- Next: reorder the product-page template options to match live EB and add a contract assertion for the captured order.

### 2026-06-01 15:29 - Fixed PPB Select template card order
- Updated the evidence doc with live PPB Bundle Visibility, Bundle Widget, Bundle Embed, Bundle Settings, Subscriptions, and Select template observations.
- Reordered `productPageTemplateOptions` to match the live EB Select template overlay: Product List, Horizontal Slots, Product Grid, Vertical Slots.
- Added `tests/unit/routes/ppb-select-template-order.test.ts` as a source contract for the captured template card order.
- Validation not run by instruction.

### 2026-06-01 15:18 - Started Settings landing copy parity fix
- Refreshed live EB Settings landing evidence from `/brandConfig`.
- Found current recovered settings card copy is descriptive but not exact EB landing copy.
- Next: update the shared Settings card contract so landing titles, descriptions, and action labels match EB exactly.

### 2026-06-01 15:22 - Fixed Settings landing card copy
- Updated `app/lib/recovered-admin-surfaces.ts` so the Settings landing card descriptions and action labels match live EB exactly.
- Updated `tests/unit/lib/recovered-admin-surfaces.test.ts` to lock the captured Settings landing descriptions and `Configure` action labels.
- Chrome comparison against our rendered route was blocked by the current SIT iframe Cloudflare DNS failure; validation not run by instruction.

### 2026-06-01 15:19 - Started Integrations landing copy parity fix
- Refreshed live EB Integrations Hub evidence from `/integrations`.
- Found current recovered integration categories/card descriptions are behaviorally close but not exact EB landing copy.
- Next: update the shared integration category/card contract so visible titles, descriptions, and CTA labels match EB exactly while preserving deeper setup summaries.

### 2026-06-01 15:25 - Fixed Integrations landing copy
- Updated `app/lib/recovered-admin-surfaces.ts` so visible integration category titles, category descriptions, card descriptions, and CTA labels match live EB Integrations Hub copy.
- Updated `app/routes/app/app.integrations.tsx` so the Integrations Hub description matches live EB exactly.
- Updated `tests/unit/lib/recovered-admin-surfaces.test.ts` and added `tests/unit/routes/integrations-landing-copy.test.ts` to lock the captured visible Integrations Hub copy.
- Validation not run by instruction.

### 2026-06-01 15:21 - Started Settings Design configure flow fix
- Captured live EB behavior after clicking Settings > Design > Configure.
- EB routes the Design card Configure action into the dedicated Design Control Panel view with Back and Preview Bundle, rather than relying on an extra hero-level Open Design Control Panel action.
- Next: update our Settings route so the Design card itself opens `/app/design-control-panel`, and remove the non-EB hero helper copy/action from the landing surface.

### 2026-06-01 15:27 - Fixed Settings Design configure flow
- Updated `app/routes/app/app.settings.tsx` so clicking the Design card `Configure` action navigates to `/app/design-control-panel`, matching live EB's Design configure flow.
- Removed the extra Settings hero kicker, subtitle, and standalone Open Design Control Panel action because live EB's Settings landing only shows the Settings heading and three Configure cards.
- Added `tests/unit/routes/settings-design-configure-flow.test.ts` to lock the captured Design configure behavior and prevent the extra hero action from returning.
- Validation not run by instruction.

### 2026-06-01 15:23 - Started Settings Language configure flow fix
- Captured live EB behavior after clicking Settings > Language > Configure.
- EB opens a dedicated `Language Configurations` view with a `Settings` back action, multilingual toggle, language selector, shared components, template sections, and Product Card button configuration.
- Next: update our Settings route so the Language card opens a dedicated in-route Language Configurations view instead of only selecting an inline summary panel.

### 2026-06-01 15:31 - Fixed Settings Language configure flow
- Updated `app/routes/app/app.settings.tsx` so clicking the Language card `Configure` action opens a dedicated in-route `Language Configurations` view with a `Settings` back action.
- The dedicated view now surfaces the evidenced multilingual toggle state, preferred language selector, language chips, shared components fields, template language sections, and Product Card button configuration.
- Added `tests/unit/routes/settings-language-configure-flow.test.ts` to lock the captured Language configure behavior.
- Validation not run by instruction.

### 2026-06-01 15:26 - Started Settings Controls configure flow fix
- Captured live EB behavior after clicking Settings > Controls > Configure.
- EB opens a dedicated `Additional Configurations` view with Back, App Configurations, layout selector, Configuration/CSS & Scripts/Integrations/Advanced tabs, and bundle-level configuration fields.
- Next: update our Settings route so the Controls card opens a dedicated in-route Additional Configurations view instead of only selecting an inline summary panel.

### 2026-06-01 15:33 - Fixed Settings Controls configure flow
- Updated `app/routes/app/app.settings.tsx` so clicking the Controls card `Configure` action opens a dedicated in-route `Additional Configurations` view with an EB-style `Back` action.
- The dedicated view now surfaces the evidenced App Configurations heading, `Configure your bundle settings` description, layout selector, Configuration/CSS & Scripts/Integrations/Advanced tabs, and selected tab fields.
- Added `tests/unit/routes/settings-controls-configure-flow.test.ts` to lock the captured Controls configure behavior.
- Validation not run by instruction.

### 2026-06-01 15:38 - Started Integrations route contract-shape fix
- Current `app/routes/app/app.integrations.tsx` still renders the older integration contract shape (`category.integrations`, `integration.name`, `setupAction`).
- The recovered EB-grounded shared contract now exposes `category.cards`, `card.title`, `card.ctaLabel`, and `card.ctaType`, with all visible card actions reading `View Setup`.
- Next: update the route to render the current shared contract so visible copy/action behavior matches the deployed EB evidence and route source no longer drifts from the recovered contract.

### 2026-06-01 15:42 - Fixed Integrations route contract shape
- Updated `app/routes/app/app.integrations.tsx` to render `category.cards`, `integration.title`, and `integration.ctaLabel` from the current recovered EB-grounded contract.
- Removed the stale route assumptions for `category.integrations`, `integration.name`, `integration.logoColor`, `setupAction`, and the non-EB visible `Open Chat Setup` label.
- Added `tests/unit/routes/integrations-contract-shape.test.ts` to lock the current shared contract shape and visible `View Setup` action behavior.
- Validation not run by instruction.

### 2026-06-01 15:45 - Started PPB Place Widget copy parity fix
- Live PPB Configure evidence shows the top Bundle Visibility readiness card action text as `Place Widget`.
- Current WPB Product Page route renders `Place Widget ↗`, adding an extra arrow not present in EB's accessible/visible copy.
- Next: remove the arrow from the Product Page route and add a source contract assertion for the captured action copy.

### 2026-06-01 15:47 - Fixed PPB Place Widget copy
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so the top readiness card action reads `Place Widget` without the extra arrow glyph.
- Added `tests/unit/routes/ppb-place-widget-copy.test.ts` to lock the captured EB action copy.
- Validation not run by instruction.

### 2026-06-01 15:52 - Started Integrations landing kicker parity fix
- Live EB Integrations Hub evidence shows the page heading, description, and `Request Integration` action without an extra eyebrow/kicker above the heading.
- Current WPB Integrations route still renders a `Supported connections` kicker above `Integrations Hub`.
- Next: remove the non-EB kicker and add source contract coverage so the landing stays exact.

### 2026-06-01 15:54 - Fixed Integrations landing kicker
- Removed the non-EB `Supported connections` kicker from `app/routes/app/app.integrations.tsx`.
- Added `tests/unit/routes/integrations-no-kicker.test.ts` to lock the captured EB landing header shape.
- Validation not run by instruction.

### 2026-06-01 15:31 - Started Settings landing extra-panel parity fix
- Live EB Settings landing shows only the Settings heading plus Design, Language, and Controls cards with Configure actions.
- Current WPB Settings route still renders recovered summary/detail panels below the cards on the landing, even though Design, Language, and Controls now have dedicated configure flows.
- Next: remove the non-EB landing panels and add source contract coverage so the landing stays card-only.

### 2026-06-01 15:42 - Completed Settings landing extra-panel parity fix
- Removed the non-EB inline Settings detail panels from the landing route in favor of the three-card EB landing pattern.
- Confirmed the stale StatusPill helper was already absent after the landing cleanup.
- Added `tests/unit/routes/settings-landing-card-only.test.ts` to lock the source contract against reintroducing inline landing panels.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Settings landing card-only scenarios.
- Next: continue with Settings/Integrations deep parity, prioritizing live EB deployed bundle behavior as ground truth.

### 2026-06-01 15:55 - Started deployed bundle URL evidence capture
- Extracted EB app-owned route chunks from Chrome network traffic for Settings and Integrations.
- Sensitive document/query parameters were observed only as runtime requests and are intentionally not copied into docs.
- Capturing public hashed JS bundle URLs and derived behavior facts into the replication evidence doc.

### 2026-06-01 16:02 - Completed deployed bundle URL evidence capture
- Added public Settings and Integrations route chunk URLs to `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`.
- Added redacted backend API observations and deployed-bundle behavior facts for Settings landing, Additional Configurations, language defaults, cart-line messaging defaults, and Integration CTA handling.
- Confirmed Zapiet and Request Integration are chat-backed while other Integration cards open help article URLs.
- Next: use the captured Settings bundle defaults to tighten our Settings Controls and Language screens before moving deeper into bundle edit sections.

### 2026-06-01 16:10 - Started Settings Language and Controls bundle-default parity fix
- Current Settings route imports a non-exported `CONTROLS_CONFIGURATION` symbol instead of the shared recovered controls layout contract.
- Current Language configuration only exposes `Add To Box`; deployed Settings bundle also carries Product Card labels for Clear Selection, Search, Choose Options, Load More Products, and Loading Checkout.
- Current Controls Configuration labels are behaviorally close but miss deployed-bundle/live labels for Show Compare At Price, Track inventory on Add To Cart, Cart Messaging, Bundle Items, Original Bundle Price, Discount Display, Discount format, Checkout Settings, Execute Script, and Font Settings.
- Scope: fix the route contract mismatch, remove the stale unused helper, and expand shared Language/Controls contract coverage from deployed Settings bundle evidence.

### 2026-06-01 16:20 - Completed Settings Language and Controls bundle-default parity fix
- Updated `app/lib/recovered-admin-surfaces.ts` so `RecoveredField` supports the field metadata rendered by the Settings route: state, description, and selectable options.
- Expanded Product Card language defaults from the deployed Settings bundle: Clear Selection, Search, Add To Box, Choose Options, Load More Products, and Loading Checkout.
- Replaced generic Controls Configuration labels with deployed-bundle/live labels for Bundle Settings, Show Compare At Price, Hide Irrelevant variant images, Track inventory on Add To Cart, Redirect Collection Page Quick Add to Bundle, Cart Messaging, Bundle Items, Original Bundle Price, Discount Display, Discount format, Checkout Settings, Execute Script, and Font Settings.
- Fixed `app/routes/app/app.settings.tsx` to consume the exported `CONTROL_LAYOUTS` contract instead of the stale non-exported `CONTROLS_CONFIGURATION` symbol.
- Removed the stale unused `StatusPill` helper from the Settings route.
- Added `tests/unit/routes/settings-controls-contract-source.test.ts` and expanded `tests/unit/lib/recovered-admin-surfaces.test.ts` plus `test-spec/recovered-admin-surfaces.spec.md` for this slice.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 16:30 - Started PPB Bundle Embed placement copy parity fix
- Live EB PPB Bundle Embed evidence shows the setup description as `Directly embed the Bundle Builder block on product pages so customers can curate bundles there.`
- Live EB PPB custom placement panel includes the visible helper `Place app block on the theme` before the `Place Block` action.
- Current WPB route has a near-match description and the `Place Block` action, but omits the `Place app block on the theme` helper.
- Scope: update the PPB Bundle Embed visible copy and add a source contract assertion for the captured strings.

### 2026-06-01 16:36 - Completed PPB Bundle Embed placement copy parity fix
- Updated the PPB Bundle Embed description in `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` to match live EB copy exactly.
- Added the missing custom-placement helper text `Place app block on the theme` before the `Place Block` action.
- Added `tests/unit/routes/ppb-bundle-embed-copy.test.ts` as a source contract for the captured Bundle Embed copy.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the PPB Bundle Embed copy scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 16:42 - Started FPB Bundle Widget multilingual gate parity fix
- Live EB FPB Bundle Widget evidence shows the Widget Settings Multi Language action disabled when multilingual setup is unavailable.
- Current WPB FPB Bundle Widget always enables the Multi Language action even though this route already disables other multilingual controls when `shopLocales.length === 0`.
- Scope: gate the FPB Bundle Widget Multi Language action on locale availability and add a source contract assertion.

### 2026-06-01 16:48 - Completed FPB Bundle Widget multilingual gate parity fix
- Updated `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` so the FPB Bundle Widget `Multi Language` action is disabled when `shopLocales.length === 0`.
- Added `tests/unit/routes/fpb-bundle-widget-multilanguage-gate.test.ts` to lock the captured disabled-state behavior.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the FPB Bundle Widget multilingual gate scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 16:54 - Started PPB Bundle Embed Multi Language visibility fix
- Live EB PPB Bundle Embed evidence shows `Multi Language` as visible text in the fields area before Title and Sub Title.
- Current WPB PPB Bundle Embed renders the same action as an icon-only plain button with only accessibility/title text.
- Scope: make the Bundle Embed Multi Language action visibly match EB and add a source contract assertion.

### 2026-06-01 17:00 - Completed PPB Bundle Embed Multi Language visibility fix
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so the PPB Bundle Embed `Multi Language` action renders visible text instead of icon-only UI.
- Expanded `tests/unit/routes/ppb-bundle-embed-copy.test.ts` to lock the visible Multi Language action before Title and Sub Title fields.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the PPB Bundle Embed multilingual action scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 17:06 - Started PPB Bundle Widget default display mode parity fix
- Live EB PPB Bundle Widget evidence shows the observed saved bundle state with `Offer Upsell Block` selected.
- Current WPB PPB route falls back to `button` when `bundle.upsellWidgetDisplayMode` is absent, which makes `Offer Upsell Button` selected by default.
- Scope: change only the PPB widget fallback/default ref to `block` while preserving saved bundle values, then add source contract coverage.

### 2026-06-01 17:12 - Completed PPB Bundle Widget default display mode parity fix
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so PPB Bundle Widget state and original-ref fall back to `block` when no saved `upsellWidgetDisplayMode` exists.
- Preserved saved bundle behavior by keeping `bundle.upsellWidgetDisplayMode` as the first source.
- Added `tests/unit/routes/ppb-bundle-widget-default-mode.test.ts` to lock the captured Offer Upsell Block fallback state.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the PPB Bundle Widget default-mode scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 17:18 - Started PPB Subscriptions setup guidance parity fix
- Live EB PPB Subscriptions evidence shows a `How to setup?` action alongside `Bundle Subscriptions` and `Get Subscription Plans`.
- Current WPB PPB Subscriptions renders `How to setup?` as a plain button with no action.
- Captured setup evidence says the merchant creates a subscription plan, names it, selects all bundle products, configures frequency, saves it, then returns to fetch/select plans.
- Scope: make the `How to setup?` action reveal sanitized in-app setup guidance without adding external competitor URLs to source.

### 2026-06-01 17:24 - Completed PPB Subscriptions setup guidance parity fix
- Updated `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` so `How to setup?` toggles an in-app sanitized setup guide.
- The guide captures the evidenced flow: create and name a subscription plan, select all bundle products, configure purchase frequency, save, then return and use `Get Subscription Plans`.
- Added `tests/unit/routes/ppb-subscriptions-setup-guide.test.ts` to lock the setup action and prevent external help URLs from entering route source.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the PPB Subscriptions setup guide scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 17:30 - Started FPB Bundle Widget button text default parity fix
- Live EB FPB Bundle Widget evidence shows Button Text default `Save More With Bundle`.
- Current WPB FPB Bundle Widget falls back to `Buy with Bundle` when no saved widget button text exists.
- Scope: update only the FPB widget button-text fallback/default refs while preserving saved widget configuration and text overrides.

### 2026-06-01 17:36 - Completed FPB Bundle Widget button text default parity fix
- Updated `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` so FPB Bundle Widget button text falls back to `Save More With Bundle`.
- Preserved saved behavior by keeping `savedWidgetConfiguration.buttonText` and `textOverrides.widgetButtonText` ahead of the fallback.
- Added `tests/unit/routes/fpb-bundle-widget-button-text-default.test.ts` to lock the captured default and prevent `Buy with Bundle` from returning.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the FPB Bundle Widget button-text default scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 17:42 - Started Bundle Visibility quick-guide behavior fix
- Live EB Bundle Visibility evidence shows publishing cards with `Quick Setup Guide` actions and 5 min setup notes for Hero Banner, Navigation Menu, Announcement Banner, and Featured Product Card.
- Current WPB FPB and PPB routes render the visible action but open a generic placeholder URL instead of surfacing the captured guide behavior.
- Scope: replace the placeholder external URL with sanitized in-app quick-guide details for both FPB and PPB visibility cards.

### 2026-06-01 17:48 - Completed Bundle Visibility quick-guide behavior fix
- Updated FPB and PPB Bundle Visibility publishing cards so `Quick Setup Guide` reveals sanitized in-app guide details instead of opening the generic placeholder URL.
- Added guide details for Hero Banner, Navigation Menu, Announcement Banner, and Featured Product Card based on captured quick-guide evidence.
- Added `tests/unit/routes/bundle-visibility-quick-guide-contract.test.ts`, scoped to the Publishing Best Practices section, to keep this surface off placeholder external links.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Bundle Visibility quick-guide scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 17:54 - Started Select template modal contract coverage
- Current FPB and PPB Select template modals already show captured EB modal title `Customization`, heading `Customize your bundle`, `Customize Colors & Language`, template cards, selected-state labels, and `Next` footer action.
- Existing route tests only lock PPB template card order; they do not protect the shared EB modal shell or FPB template inventory.
- Scope: add source-contract coverage for FPB and PPB Select template modal behavior without changing route implementation.

### 2026-06-01 18:00 - Completed Select template modal contract coverage
- Added `tests/unit/routes/select-template-modal-contract.test.ts` to lock the captured FPB and PPB Select template modal shell, actions, selected-state labels, and template inventories.
- Covered FPB templates: Standard Design, Classic Design, Compact Design, Horizontal Design.
- Covered PPB captured order: Product List, Horizontal Slots, Product Grid, Vertical Slots.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with Select template modal contract scenarios.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 22:12 - Completed Select template post-Next evidence lock
- Captured live FPB Select template post-Next state from the EB Shopify overlay and confirmed it matches deployed chunk flow evidence.
- Confirmed existing FPB and PPB routes already render `View your bundle`, `View your bundle with your customizations`, `Your bundle is ready`, `Preview it now with your customizations`, and `Preview bundle`.
- Updated the sanitized evidence doc, recovered Admin test spec, and Select template source-contract test to lock the post-Next bundle-ready state.
- Lint passed for `tests/unit/routes/select-template-modal-contract.test.ts`.
- Targeted Jest passed: `npx jest tests/unit/routes/select-template-modal-contract.test.ts --runInBand --coverage=false`.

### 2026-06-01 22:20 - Started FPB configure compile fix
- Agent-store Chrome smoke check showed the local dev app failing to render with a Vite/esbuild JSX transform error in the FPB configure route around Bundle Settings.
- Scope: remove the stray closing `s-section` tag after `BundleStatusSection`, then rerun targeted lint/build smoke and agent-store Chrome check.

### 2026-06-01 22:24 - Completed FPB configure compile fix
- Removed the stray closing `s-section` tag after `BundleStatusSection` in the FPB configure route.
- Lint passed for `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` with 0 errors and existing warnings only.
- Agent-store Chrome smoke check passed: dashboard loaded, then the local FPB configure route opened and rendered `Configure Bundle Flow`, `Bundle Setup`, and `Step Setup` without the Vite transform overlay.

### 2026-06-01 22:30 - Completed FPB parity route validation
- Confirmed the staged FPB route diff also includes accumulated EB parity fixes for Bundle Visibility quick guides, Bundle Widget overview/defaults/multilanguage gating, and Bundle Settings field exclusions.
- Targeted Jest passed: `bundle-visibility-quick-guide-contract`, `fpb-bundle-settings-direct-contract`, `fpb-bundle-settings-surface-contract`, `fpb-bundle-visibility-overview-copy`, `fpb-bundle-widget-button-text-default`, and `fpb-bundle-widget-multilanguage-gate`.
- Lint passed for those six route test files with 0 errors and one existing warning in the quick-guide test.

### 2026-06-01 22:40 - Completed Settings and Integrations parity route validation
- Validated the recovered Settings and Integrations routes, shared Admin surface contract, app nav entry, and app navigation map update.
- Targeted Jest passed: recovered Admin surfaces plus Settings and Integrations route/source-contract tests, 11 suites and 17 tests.
- Lint passed for Settings/Integrations source and test files with 0 errors.
- Agent-store Chrome smoke check passed for `/app/settings` landing, Language Configurations, Additional Configurations, `/app/integrations`, and Request Integration guidance without the Vite transform overlay.

### 2026-06-01 18:06 - Started PPB Bundle Settings surface contract coverage
- Inspected the PPB Bundle Settings route block against captured evidence.
- The remaining placeholder `How to setup?` action is in Add-ons, not the requested PPB Bundle Settings surface.
- Current PPB Bundle Settings already contains the captured Pre Selected Product, Enable Quantity Validation, Pre-order & Subscription Integration, Cart line item discount display, Bundle Level CSS, and Bundle Status sections.
- Scope: add source-contract coverage to prevent PPB Bundle Settings from regressing, especially by reintroducing FPB-only Bundle Cart title/subtitle fields.

### 2026-06-01 18:12 - Completed PPB Bundle Settings surface contract coverage
- Added `tests/unit/routes/ppb-bundle-settings-surface-contract.test.ts` to lock the captured PPB Bundle Settings surface.
- Covered Pre Selected Product, Default products title, Choose default products, Browse Products, Enable Quantity Validation, Maximum allowed quantity per product, Pre-order & Subscription Integration, Cart line item discount display, Use app defaults, Customize for this bundle, Bundle Level CSS, and Bundle Status.
- Added explicit negative coverage that PPB Bundle Settings must not render FPB-only Bundle Cart Title or Bundle Cart Subtitle fields.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with PPB Bundle Settings surface scenarios.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 18:18 - Started FPB Bundle Settings surface contract coverage
- Inspected FPB Bundle Settings route labels against captured live evidence.
- Current route already contains Pre Selected Product, Enable Quantity Validation, Product Slots, Slot Icon, Variant Selector, Show Text on + Button, Bundle Cart title/subtitle, cart line item discount display, Bundle Banner desktop/mobile sizes, Bundle Level CSS, and Bundle Status.
- Existing tests only cover direct bundleTextConfig submission and removal of extra WPB-only display controls.
- Scope: add section-scoped source-contract coverage for the full captured FPB Bundle Settings surface.

### 2026-06-01 18:24 - Completed FPB Bundle Settings surface contract coverage
- Added `tests/unit/routes/fpb-bundle-settings-surface-contract.test.ts` to lock the captured FPB Bundle Settings surface.
- Covered Pre Selected Product, Enable Quantity Validation, Product Slots, Slot Icon, Variant Selector, Show Text on + Button, Bundle Cart Title, Bundle Cart Subtitle, Cart line item discount display, Bundle Banner, Bundle Level CSS, and Bundle Status.
- Added banner recommendation coverage for `1900x230` desktop and `1100x500` mobile uploads.
- Added section-scoped negative coverage that Show product prices, Show compare-at prices, and Allow quantity changes must not return to FPB Bundle Settings.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with FPB Bundle Settings surface scenarios.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 18:30 - Started Integrations Request Integration behavior fix
- Deployed Integrations bundle evidence shows `Request Integration` is chat-backed and emits an integration-intent request path.
- Current WPB Integrations route expands a request card but sends merchants to `/app/events`, which is not the captured EB behavior.
- Scope: replace the unrelated events link with sanitized in-page request guidance that mirrors the chat/request-intent behavior without sending external messages or adding sensitive data.

### 2026-06-01 18:36 - Completed Integrations Request Integration behavior fix
- Updated `app/routes/app/app.integrations.tsx` so `Request Integration` reveals sanitized request guidance instead of linking to `/app/events`.
- The route now reflects the recovered request-intent/chat-backed behavior without triggering external messages or storing sensitive request/session data.
- Added `tests/unit/routes/integrations-request-integration-flow.test.ts` to prevent unrelated event-route behavior and sensitive token strings from entering the route.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Request Integration flow scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 18:42 - Started Settings Language section-description parity fix
- Live EB Language Configurations evidence shows descriptive copy for Shared Components and Template Language.
- Current WPB Settings Language view renders the section names and fields, but misses the captured descriptions: `Customize language for components across all templates` and `Edit language for your landing page or product page template`.
- Scope: add the missing Settings Language descriptions and source-contract coverage.

### 2026-06-01 18:48 - Completed Settings Language section-description parity fix
- Updated `app/routes/app/app.settings.tsx` so Shared Components renders `Customize language for components across all templates`.
- Added Template Language heading and `Edit language for your landing page or product page template` before the template language chips.
- Added `tests/unit/routes/settings-language-section-copy.test.ts` to lock the captured Settings Language copy.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Settings Language section-copy scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.

### 2026-06-01 18:54 - Started Settings Language Shared Components action parity fix
- Live EB Language Configurations evidence shows Shared Components with the description `Customize language for components across all templates` and a visible `Cart & Checkout` action.
- Current WPB Settings Language view now includes the description, but still renders the Cart & Checkout fields without the captured action label.
- Scope: add the visible `Cart & Checkout` action/chip to Shared Components and lock it with source-contract coverage.

### 2026-06-01 19:00 - Completed Settings Language Shared Components action parity fix
- Updated `app/routes/app/app.settings.tsx` so Shared Components renders the visible `Cart & Checkout` action/chip from captured EB Language Configurations evidence.
- Expanded `tests/unit/routes/settings-language-section-copy.test.ts` to lock the `Cart & Checkout` action text.
- Updated `test-spec/recovered-admin-surfaces.spec.md` with the Shared Components action scenario.
- Validation, lint, graph rebuild, and tests were not run by instruction.
