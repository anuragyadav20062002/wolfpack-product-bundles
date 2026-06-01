# Issue: Settings Page EB Parity
**Issue ID:** settings-page-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 17:21

## Overview
Recover and replicate the full EB Settings page flow from live Chrome evidence and deployed Settings bundle evidence, with sensitive auth/session values redacted.

## Progress Log
### 2026-06-01 17:21 - Scope narrowed to Settings parity
- User narrowed the active parity goal to the entire Settings page flow.
- Live EB Settings evidence rechecked in Chrome: landing cards, Language Configurations, and Additional Configurations.
- Next: patch the Settings route to align the visible Language flow with live EB, especially the Product Card field set and form-like controls.

## Related Documentation
- docs/competitor-analysis/05-settings-language.md
- docs/competitor-analysis/06-settings-controls.md
- docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md
- internal docs/EB Implementation Reference.md

## Phases Checklist
- [ ] Phase 1 - Settings landing visual and behavior parity
- [ ] Phase 2 - Language Configurations visual, interaction, and save/discard parity
- [ ] Phase 3 - Additional Configurations Landing Page Layout tabs and save parity
- [ ] Phase 4 - Additional Configurations Product Page Layout tabs and save parity
- [ ] Phase 5 - Chrome smoke proof and commit

### 2026-06-01 17:21 - Language visible-state parity slice patched
- Updated Settings Language view from summary cards to EB-style interactive controls: multilanguage checkbox, preferred-language selector, selected-language chip/button, section/action buttons, and text input field rendering.
- Trimmed visible Product Card language fields to the live EB evidence: `Add Product to Bundle Button` with default `Add To Box`.
- Corrected the Norwegian Bokmål language label to match EB evidence.
- Next: validate in Chrome, then continue Controls/Additional Configurations exact tab behavior and persistence.

### 2026-06-01 17:21 - Controls form-control parity slice patched
- Replaced the Settings Controls read-only detail cards with EB-style grouped form controls driven by the recovered Additional Configurations field model.
- Added checkbox rows for toggle controls, select controls for EB dropdowns, text inputs, and textarea controls for CSS/script fields.
- Added Settings-specific CSS for EB-like section dividers, form stacks, checkbox rows, help text, and multiline inputs.
- Next: compare live Chrome rendering against EB for exact spacing and complete save/discard persistence behavior for Language and Controls.

### 2026-06-01 17:21 - Settings save/discard behavior slice patched
- Added dirty-state tracking for Settings Language controls and Additional Configurations controls.
- Added an EB-style unsaved changes footer with Discard and Save actions for the in-page Settings state.
- Controls fields are now controlled inputs instead of static defaults, so checkbox/select/text/textarea edits can be discarded or saved within the page session.
- Next: persist these Settings contracts through the server/database and run Chrome comparison against live EB for exact spacing and behavior.

### 2026-06-01 17:21 - Settings persistence route slice patched
- Added a Settings route action for `saveSettingsLanguage` and `saveSettingsControls`.
- Persisted recovered Settings state under `DesignSettings.generalSettings.settingsPage`, preserving existing `generalSettings` keys.
- Loader now hydrates Settings Language and Controls values from persisted state when available, falling back to recovered EB defaults.
- Save footer now submits Language and Controls payloads to the app route before accepting the current in-page state.
- Next: validate in Chrome and continue exact EB layout/spacing plus Design card flow parity.

### 2026-06-01 17:21 - Design card Settings flow patched
- Replaced the Settings Design card behavior from navigating to the generic WPB Design Control Panel with a dedicated Settings subflow.
- Added EB-style Design Customization tabs using recovered Settings design evidence: Brand Colors, Typography, Corners, and Images & GIFs.
- Design fields now use the same editable Settings form controls and unsaved changes footer as Language and Controls.
- Added `saveSettingsDesign` persistence under `DesignSettings.generalSettings.settingsPage.design` alongside Language and Controls.
- Next: Chrome-compare the Settings landing, Design, Language, and Controls flows against EB and tighten spacing/visual details.

### 2026-06-01 17:21 - Settings save feedback slice patched
- Added Settings route save-result feedback from action responses using `useActionData`.
- Added an EB-style fixed status toast for successful and failed Settings saves.
- Toast feedback now applies across Settings landing, Design Customization, Language Configurations, and Additional Configurations.
- Next: run Chrome Settings smoke and tighten exact EB visual spacing/state behavior.

### 2026-06-01 17:21 - Settings runtime mapping slice patched
- Added clean-room runtime mappings from Settings Design values into existing `DesignSettings` columns for global colors, product card background, typography, button/card radius, and image fit.
- Added Settings Language runtime mapping from `Add Product to Bundle Button` into the existing `buttonAddToCartText` field.
- Added Settings Controls runtime mapping for cart line messaging and custom CSS into existing `bundleCartLineMessaging` and `customCss` fields.
- Kept the recovered full Settings payload persisted under `generalSettings.settingsPage` so future EB-specific fields can be mapped without losing unknown Settings state.
- Next: Chrome-save proof and exact visual comparison are required before this can be considered parity-complete.

### 2026-06-01 17:21 - Language section navigation behavior patched
- Made the Language Configurations section navigation interactive instead of static text.
- `Cart & Checkout` now switches to the shared cart/checkout fields captured from EB evidence: Bundle Contains Label, Bundle Original Price Label, and Bundle Cart Discount Display Label.
- Template Language section buttons now update the active panel; Product Card shows the captured EB field and unmapped sections clearly show that live field evidence is still pending.
- Added active/inactive button styling for the EB-like language section state.
- Next: capture more EB field lists for Bundle Cart, Bundle, Popups, Toasts, Addons, and Messages or extract them from the deployed Settings bundle before mapping those panels.

### 2026-06-01 17:21 - Language Bundle Cart and Bundle fields mapped
- Added EB-evidenced Language fields for `Bundle Cart` from `docs/competitor-analysis/05-settings-language.md`: Next Button Text, Add Bundle to Cart Button, Total Label, View Cart Products Label, Discount Badge Suffix, Cart Inclusion Title, and Subscription Selection Label.
- Added EB-evidenced Language fields for `Bundle`: No Products Available label, Choose Options Button, Load More Products Button, Preparing Bundle Label, Redirecting label, Added Label, Add Button Text, Review Button Text, and Select Bundle Products label.
- Updated the Settings Language panel so section navigation renders mapped field groups through `LANGUAGE_CONFIGURATION.templateFields` and persists their values with the existing Settings save payload.
- Remaining unmapped Language sections: Popups, Toasts, Addons, and Messages still require deployed-bundle/live EB field extraction before claiming parity.

### 2026-06-01 17:37 - Target Settings bundle evidence pass
- Narrowed active goal to full Settings UI/behavior/functionality parity only.
- Next: extract Settings-only deployed bundle keys and patch remaining Settings parity/runtime gaps without touching unrelated routes.

### 2026-06-01 17:37 - Language sections completed from Chrome evidence
- Confirmed EB Settings Language sections in Chrome: Product Card, Bundle Cart, Bundle, Popups, Toasts, Addons, and Messages.
- Added EB field groups/defaults for Popups, Toasts, Addons, and Messages.
- Updated Settings language rendering to support grouped section headings and variable-backed Show Variables controls.
- Fixed Settings runtime numeric helpers so blank EB-style inputs do not persist as zero-valued design settings.

### 2026-06-01 17:45 - Design and Controls EB evidence patch
- Captured EB Settings landing, Design Control Panel, and Additional Configurations surfaces in Chrome.
- Design evidence: Back, Preview Bundle, Bundle Design header, Brand Colors/Typography/Corners/Images & GIFs tabs, Expert Color Controls, General/Product Card/Bundle Cart/Upsell subtabs, Reset to default, color textbox + color well rows.
- Controls evidence: Landing Page Layout selector, Configuration/CSS & Scripts/Integrations/Advanced tabs, checked Cart Messaging master toggle, Edit Language shortcut, discount-format select, checkout radio choices, Execute Script, and Custom Font.
- Updated recovered Settings config/rendering to add EB color descriptions, color wells, radio controls, checked Cart Messaging master toggles, Edit Language navigation to Language > Cart & Checkout, Design preview/back chrome, expert color controls, scope subtabs, and Reset to default behavior.

### 2026-06-01 17:48 - Read Controls inventory Know More help
- Opened the EB in-app `Know More` article for `Track inventory on Add To Cart (in beta)`.
- Captured behavior: inventory tracking is a global Additional Configurations toggle, depends on Shopify product `Track Quantity`, hides zero-inventory products, and treats digital products as inventory `0 or below`.
- Added the help evidence to `internal docs/EB Implementation Reference.md`.

### 2026-06-01 17:52 - Controls Know More modal parity
- Added a Settings help modal for the `Track inventory on Add To Cart (in beta)` Know More action.
- The modal mirrors the captured help article behavior without hardcoding external helpdesk URLs in source.
- Updated toggle rendering so `Edit Language` and `Know More` render as actions rather than static helper text.

### 2026-06-01 18:02 - Controls secondary tabs parity
- Captured EB Controls `CSS & Scripts`, `Integrations`, and `Advanced` tabs in Chrome.
- Added EB CSS note for `.gbbBundle-HTML` parent class usage.
- Updated Advanced video player settings to render logo preview image, background color, upload file control, and update image action instead of generic text inputs.
- Updated Settings controls runtime mapping to combine all recovered CSS boxes into the runtime `customCss` field while retaining raw EB settings under `settingsPage.controls`.

### 2026-06-01 18:15 - Settings visual parity correction
- Compared EB Settings landing screenshot against local Settings landing screenshot.
- Replaced the oversized Wolfpack-style Settings landing with EB-style compact white card frame, centered mini-cards, blue card icons/titles, compact descriptions, and outlined Configure buttons.
- Tightened shared Settings subpage styling: normal-size page titles, compact white/outlined Back and Preview buttons, compact panel title treatment, EB-like tab buttons, and denser form headings.
- Captured local before/after screenshots under `/private/tmp`; no screenshots were added to the repo.

### 2026-06-01 18:20 - Rename recovered source files
- User flagged that `recovered` should not remain in JSX/CSS-related source filenames.
- Next: rename recovered Settings/Admin source files to neutral names and update imports.

### 2026-06-01 18:23 - Removed recovered filename prefix
- Renamed `app/lib/recovered-admin-surfaces.ts` to `app/lib/admin-configuration-surfaces.ts`.
- Renamed `app/styles/routes/recovered-admin-surfaces.module.css` to `app/styles/routes/admin-configuration-surfaces.module.css`.
- Updated Settings, Integrations, unit test, and test-spec imports/references to the neutral filename.

### 2026-06-01 18:33 - Design subpage EB visual structure
- Captured EB Design Control Panel screenshot and compared against local Design screen.
- Replaced local Design top-tab layout with EB-style two-column layout: left Bundle Design navigation card, Expert Color Controls card, Reset to default action, and right field card.
- Updated Design field rows to match EB horizontal label/description plus compact color input treatment.
- Tuned Design Back/Preview controls and sidebar nav icons toward EB's compact UI.

### 2026-06-01 18:04 - Language visual parity pass started
- Captured current EB Language Configurations screenshot and local Language Configurations screenshot.
- Confirmed the primary gap is structural: EB uses a thin top language selector card plus a second bordered editor card with language chip, left navigation rail, and right field panel; local still uses stacked full-width cards and horizontal navigation.
- Next: replace the local Language markup/CSS with the EB-style two-column editor structure.

### 2026-06-01 18:04 - Language visual structure patched
- Replaced the local Language Configurations stacked layout with EB-style top language-mode card plus lower editor card.
- Added the selected-language black chip, left Shared Components / Template Language rail, black Landing Page Layout selector, active Product Card row, and right-side field panel.
- Tightened the Language header to match EB's compact back-arrow plus page title treatment.
- Captured local after screenshot under `/private/tmp`; screenshots are not committed.

### 2026-06-01 18:15 - Official Shopify icon and control-detail pass started
- User flagged that Settings must use correct Shopify App Home icons and continue into dropdown, toggle, Preview Bundle, native back button, Controls, and storefront wiring parity.
- Checked the official Shopify `s-icon` docs: relevant valid icon types include `edit`, `language`, `adjust`, `arrow-left`, `view`, `caret-down`, `toggle-on`, and `toggle-off`.
- Next: replace custom Settings SVG/text-arrow controls with official App Home icons and tighten toggle/dropdown rendering before continuing Controls parity.

### 2026-06-01 18:15 - Icons, Controls structure, and Preview modal patched
- Replaced custom Settings card SVGs with official Shopify `s-icon` usage: `edit`, `language`, and `adjust`.
- Replaced text-arrow Back/Preview treatment with official `arrow-left`, `view`, and dropdown caret icon usage.
- Updated Settings toggle rendering to EB-style switch states while preserving checkbox semantics for accessibility and state persistence.
- Reworked Additional Configurations into EB's two-column Controls layout: left App Configurations rail, black layout selector, vertical tabs, and separate right-side cards for grouped settings.
- Captured current EB Preview Bundle behavior: Design Control Panel opens a `Bundle Preview` modal listing Bundle Name, Type, and View actions.
- Wired local Preview Bundle to open the same modal pattern using storefront-ready bundle records and product/page handles.

### 2026-06-01 18:30 - Official icon detail correction
- Corrected the Controls Integrations tab icon to use Shopify App Home's `link-list` icon instead of the generic `link` name.
- Next: compare Controls secondary tabs and Preview Bundle behavior in Chrome against EB before committing.

### 2026-06-01 18:32 - Controls secondary-tab evidence pass
- Compared EB Controls tabs in Chrome for Configuration, CSS & Scripts, Integrations, and Advanced.
- Confirmed the local CSS & Scripts tab was exposing extra JavaScript/selector editable fields that EB does not expose on the landing-layout tab.
- Next: trim local Controls tab definitions to the observed EB editable controls and retest in Chrome.

### 2026-06-01 18:34 - Preview storefront smoke and URL fix
- Tested Settings -> Design Control Panel -> Preview Bundle in Chrome and confirmed the modal opens with Bundle Name, Type, and View actions.
- Confirmed the product-page View action opens the storefront product and renders the bundle widget.
- Found the full-page/Landing Page row could fall back to a product URL when `shopifyPageHandle` is missing, causing the displayed Type and target URL to disagree.
- Next: remove product URL fallback for full-page preview rows so Landing Page rows only open page URLs when the page handle is present.

### 2026-06-01 18:35 - Preview flow retested
- Retested Settings -> Design Control Panel -> Preview Bundle after the URL fix.
- Confirmed Product Page rows still open the storefront product and render the bundle widget.
- Confirmed Landing Page rows without a page handle now show a disabled View action instead of opening an incorrect product URL.
- Next: run required lint/graph checks and commit the Settings parity slice if the worktree can be staged safely.

### 2026-06-01 18:40 - Integrations local AVIF icon pass
- User flagged that the checked-in `public/icons/*.avif` assets need to be used by the Integrations page.
- Found the Integrations card data still pointed at remote CloudFront AVIF URLs.
- Next: map available integration cards to `/icons/*.avif` and include those local assets in the next commit; leave integrations without local AVIF assets on text fallback.

### 2026-06-01 18:42 - Integrations icon smoke check
- Mapped Stoq, Zapiet, Skio, Appstle, Bold, Judge.me, PageFly, and GemPages to local `/icons/*.avif` assets.
- Removed remote logo URLs for Gokwik and Shopflo because matching local AVIF assets are not present; those cards now use the visible text fallback badge.
- Confirmed in Chrome that the Integrations page loads local icon URLs from the app server and still renders all cards.
- Next: run scoped lint/graph checks and commit the Integrations icon slice.

### 2026-06-01 18:43 - Additional Configurations control polish
- User flagged three Settings -> Additional Configurations details: lighter control label font weight, inline `Know More`, and a visible white chevron on the Landing Page layout dropdown.
- Next: patch the Controls row label/action markup and selector CSS, then smoke-check in Chrome before commit.

### 2026-06-01 18:44 - Settings modal dismiss control polish
- User flagged that Settings-page modals/popups for Design, Language, and Controls need a defined gray dismiss `X` button at the top right.
- Next: replace text close buttons in Settings dialogs with a shared top-right gray `X` dismiss control and smoke-check the Preview/Controls help modal states.

### 2026-06-01 18:46 - Design Control Panel icon parity
- User flagged that Design Control Panel navigation still needs icons copied from EB.
- Captured EB Design Control Panel visual evidence and confirmed the left navigation uses small muted line icons: brand/color mark, typography T, corners glyph, image glyph, and scoped icons for General/Product Card/Bundle Cart/Upsell.
- Next: replace placeholder first-letter/box markers with EB-style compact icons in local Settings Design Control Panel.

### 2026-06-01 18:47 - Contextual save bar wiring
- User flagged that Settings subpages need the proper Polaris contextual save bar and that Save/Discard must be wired correctly.
- Next: replace per-section custom save footer rendering with a single App Bridge `ui-save-bar`, preserving existing save intents and restoring saved snapshots on discard.

### 2026-06-01 18:52 - Design Control Panel icon E2E comparison
- Compared EB and local Design Control Panel in Chrome after the first icon pass.
- Found local icons still read as heavier box/border drawings while EB uses compact muted stroke glyphs.
- Next: replace the CSS-drawn border glyphs with SVG-backed line icons and retest the Design Control Panel against EB before committing.

### 2026-06-01 18:55 - Design Control Panel Shopify icon mapping
- User provided the exact desired Design Control Panel icon mapping.
- Replaced custom CSS-drawn DCP icons with Shopify `s-icon` glyphs: `color`, `text-font`, `corner-round`, `image-add`, `settings`, `product`, `cart`, and `button-press`.
- Next: refresh Chrome and confirm the icon glyphs render correctly before final lint/graph/commit.

### 2026-06-01 18:58 - Design Control Panel smoke comparison
- Refreshed local Settings -> Design Control Panel in Chrome and confirmed the requested Shopify icon glyphs render in the left navigation.
- Compared the local Design Control Panel screenshot against EB after the icon correction; icons now use named Shopify glyphs instead of custom placeholder drawings.
- Smoke-tested Preview Bundle locally: modal opens and exposes the gray top-right dismiss button.
- Smoke-tested contextual save bar locally: editing Primary Color shows Shopify's unsaved changes bar; Discard restores the saved value and hides the bar.
- Next: rerun scoped lint and graph rebuild, then stage only the Settings parity files for commit.

### 2026-06-01 19:00 - Expert Color Controls gating
- User flagged that EB gates base Brand Colors access when Expert Color Controls are enabled.
- Captured EB behavior in Chrome: toggling Expert Color Controls on shows the alert `Disable Expert Color Controls to access brand colors.`, and expert scope rows expose their own field panels.
- Next: add the same gating alert and Brand Colors navigation block to the local Settings Design Control Panel.

### 2026-06-01 19:03 - Remove recovery-era type names
- User flagged that source names must not use the `Recovered` prefix.
- Found `RecoveredField`, `RecoveredTab`, and `RecoveredFieldGroup` in the Settings configuration types.
- Next: rename them to neutral Settings configuration names before continuing Expert Color Controls persistence work.

### 2026-06-01 19:08 - Expert color persistence flow
- Captured EB save flow after enabling Expert Color Controls: EB posts to `pageCustomization/update` and persists expert state under `stylePresets.isExpertControlsEnabled`, while preserving base colors in `stylePresets.colors` and saving expert colors under page-customization sections such as `productCard`, `emptyStateCard`, `cartFooter`, `generalSettings`, and `mixAndMatchConfig`.
- Updated the local Settings Design save shape to store `fieldValues` plus `isExpertControlsEnabled`, and to mirror EB's base-versus-expert separation into `generalSettings.pageCustomization`.
- Updated runtime design mapping so expert product-card colors drive the storefront-facing product card/button/text runtime values when expert mode is enabled.
- Next: lint and smoke-test local Admin behavior in Chrome.

### 2026-06-01 19:12 - Expert color Admin smoke
- Verified local Settings -> Design Control Panel in Chrome.
- Enabling Expert Color Controls now shows `Disable Expert Color Controls to access brand colors.` and opens the expert field panel.
- Product Card scope shows EB-matched fields: Background Color, Product Title Text Color, Add Product Button Color, Add Product Button Text Color, Empty State Border Color, and Empty State Text Color.
- Saved the expert-enabled state through the contextual save bar and confirmed the app displayed `Settings saved successfully`.
- Reloaded the product storefront page to confirm the widget page still loads after the Admin save path.
- Scoped ESLint passed with zero errors and existing warnings only.
- Next: rebuild graph metadata, stage only this slice, and commit.
