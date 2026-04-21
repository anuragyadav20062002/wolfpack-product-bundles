# Issue: Bundle Config Metafield Split (bundle_config + bundle_settings)

**Issue ID:** bundle-config-metafield-split-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-21
**Last Updated:** 2026-04-21 12:00

## Overview
Two-part refactor of the `custom:bundle_config` page metafield:

**Short-term**: Strip dead weight from `bundle-formatter.server.ts` —
`StepProduct` array (full duplicate of `products`), empty `handle: ''`, and
redundant `images` array (duplicates `featuredImage`). The `stepProductsAlreadyEnriched`
widget path uses `step.products` (which has `featuredImage`), so `StepProduct` is
never reached on the page-metafield path.

**Medium-term**: Split into two page metafields:
- `custom:bundle_config` — steps (products, variants, conditions), pricing, identity
- `custom:bundle_settings` — display/DCP settings: promoBannerBgImage/Crop,
  loadingGif, showStepTimeline, floatingBadgeEnabled/Text, tierConfig

All 5 call sites of `writeBundleConfigPageMetafield` are updated atomically by
batching both metafield writes into one GraphQL mutation inside the writer.

Backfill script: `scripts/backfill-bundle-settings.js` — writes `bundle_settings`
for all existing bundles. User runs this on prod immediately after deploy. No
fallback in widget code; backfill runs first.

## Phases Checklist
- [x] Create issue file (this file)
- [x] Short-term: strip StepProduct, handle, images from bundle-formatter.server.ts
- [x] Medium-term: add writeBundleSettingsPageMetafield + batch write in writeBundleConfigPageMetafield
- [x] Medium-term: remove settings from FormattedBundle + formatBundleForWidget
- [x] Medium-term: bundle-full-page.liquid — inject data-bundle-settings attr
- [x] Medium-term: widget JS — parseConfiguration + _mergeBundleSettings + init()
- [x] Medium-term: backfill script scripts/backfill-bundle-settings.js
- [x] Build + minify + lint + commit
- [ ] Run backfill on prod: node scripts/backfill-bundle-settings.js --env-file .env.prod
- [ ] Verify widget reads bundle_settings correctly on storefront

## Progress Log

### 2026-04-20 10:00 - Starting Implementation
- Short-term: StepProduct in page metafield is dead weight (stepProductsAlreadyEnriched
  path uses step.products, which always has featuredImage from formatter)
- Medium-term: settings are tiny (<1KB) but moving them out enables independent
  DCP-only writes without touching step/product data
- No fallback: backfill writes bundle_settings for all live bundles before deploy propagates

### 2026-04-20 14:30 - Deployment Fixes
- Removed chrome-devtools-mcp from dependencies, moved to devDependencies (dev-only MCP tool, node >=20.19 requirement incompatible with prod)
- Upgraded Dockerfile node:18-alpine → node:20-alpine to satisfy inngest@3.52.6 node>=20 requirement
- Made prisma migration idempotent: ALTER TABLE ADD COLUMN IF NOT EXISTS (fixes re-run failure on SIT where db push already applied columns)
- Files: Dockerfile, package.json, package-lock.json, prisma/migrations/20260420000000_add_step_image_banner_urls/migration.sql

### 2026-04-21 10:00 - FPB Storefront UI Fixes (floating footer + step timeline)
- **Discount banner full-width**: Moved banner outside `.footer-inner` padding wrapper; `.floating-card` gets `padding:0`, inner content uses new `.footer-inner` class with padding
- **Discount banner styling**: `border-radius:16px 16px 0 0` (rounded top corners match card), `overflow:hidden` on `.floating-card` clips it naturally
- **Banner text contrast**: Added `color:inherit` override so DCP `--bundle-conditions-text-color` / `--bundle-discount-text-color` (defaulting to `#000000`) don't override the white text on dark banner background
- **Step timeline connector (flex sibling)**: Moved connector DOM element to be a flex sibling of `.timeline-step` (not a child), allowing `flex:1` layout. Steps use `flex:0 0 auto`. Connector capped at `max-width:120px`
- **`_updateDiscountProgressBanner`**: Uses `insertBefore(fresh, footer.firstChild)` to keep banner at top on updates
- Widget version bumped to 2.6.1, bundles rebuilt and minified
- Files: app/assets/bundle-widget-full-page.js, extensions/bundle-builder/assets/bundle-widget-full-page.css, extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js, scripts/build-widget-bundles.js

### 2026-04-21 11:00 - Discount banner DCP controls + + button text overflow fix
- **DCP controls for banner**: Added `discountBannerBg` + `discountBannerText` fields to DesignSettings (state.types.ts), defaultSettings.ts (both presets), FooterDiscountProgressSettings.tsx (color pickers), SettingsPanel.tsx SECTION_KEYS. Defaults: bg=#1a1a1a, text=#ffffff.
- **Banner text !important**: Changed `color:inherit` → `color:inherit !important` in CSS so the overriding rule beats the inline `style="color:var(--bundle-discount-text-color,...)"` set by template-manager on span elements. Without !important, DCP black color variables made span text invisible on the dark banner.
- **+ button text overflow bug**: After add+remove cycle, `updateProductCardState` was recreating the add button with text "Add to Bundle" instead of "+". This text overflowed the 35×35 circle button (overflow:visible) and rendered "add" + "ind" visually bleeding over adjacent content. Fixed by matching ComponentGenerator: always restore with text "+".
- Files: app/assets/bundle-widget-full-page.js, app/types/state.types.ts, app/components/design-control-panel/config/defaultSettings.ts, app/components/design-control-panel/settings/FooterDiscountProgressSettings.tsx, app/components/design-control-panel/settings/SettingsPanel.tsx, extensions/bundle-builder/assets/bundle-widget-full-page.css, extensions/bundle-builder/assets/*-bundled.js

### 2026-04-21 12:00 - Step timeline connector fix + full DCP customization panel

- **CSS connector fix**: Removed `max-width:120px` cap (connector now stretches to fill available space), removed `gap:12px` from `.step-timeline` (spacing was additive with flex layout), changed `min-width:16px` → `8px`
- **CSS circle size reduction**: Default circle sizes reduced from 48/56/64px → 36/40/44px (mobile/tablet/desktop). Matches competitor sizing (~40px target). `margin-top` formula updated to use 44px default in CSS calc
- **CSS tablet connector**: Added `.timeline-connector{margin-top:19px}` in the `@media(min-width:640px)` block (40/2 - 1 = 19px)
- **CSS step caps**: Added `max-width:100px` to `.timeline-step`, reduced step-name font-size 11px→10px and margin-top 8px→6px
- **Types**: Added `StepTimelineSettings` interface (14 fields) to `state.types.ts`; added to `DesignSettings extends` list
- **DCP types**: Added `'stepTimeline'` to `DCPSectionKey` union in `dcp-config/types.ts`
- **Defaults**: Added step timeline defaults to both `PRODUCT_PAGE_DEFAULTS` (light palette) and `FULL_PAGE_DEFAULTS` (dark palette) in `defaultSettings.ts`
- **New panel**: Created `StepTimelineSettings.tsx` with 14 controls (circle size, bg, border, border-width, completed bg, line colors, line thickness, label color, label font size, active/inactive/complete colors)
- **SettingsPanel**: Added import, SECTION_KEYS entry (14 keys), and `case "stepTimeline"` switch branch
- **FPB DCP nav**: Registered `stepTimeline` as child of `bundleHeader` group in `fpb.config.ts`
- **Build**: `npm run build:widgets` + `npm run minify:assets css` — zero errors
- Files: bundle-widget-full-page.css, bundle-widget-full-page-bundled.js, bundle-widget-product-page-bundled.js, state.types.ts, defaultSettings.ts, StepTimelineSettings.tsx, SettingsPanel.tsx, fpb.config.ts, dcp-config/types.ts
- Next: deploy to SIT for visual verification

### 2026-04-21 11:30 - Remove green footer-callout-banner
- Green `footer-callout-banner` (success message with #22C55E background) was duplicating the dark slim `discount-progress-banner` at the top of the floating footer card. Removed completely: JS creation block, calloutMessage variable, and both CSS rules.
- Files: app/assets/bundle-widget-full-page.js, extensions/bundle-builder/assets/bundle-widget-full-page.css, bundled JS
