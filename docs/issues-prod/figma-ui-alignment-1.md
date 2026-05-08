# Issue: Figma UI Alignment — Dashboard

**Issue ID:** figma-ui-alignment-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-08
**Last Updated:** 2026-05-09 14:00

## Overview

Verifying and aligning the app's Admin UI against Figma design images, page by page.
Starting with the Dashboard. Each design image is reviewed, gaps are identified, and
implementation is updated to match while keeping Polaris web components throughout.

## Phases Checklist
- [x] Phase 1 — Dashboard gap analysis
- [x] Phase 2 — Dashboard fixes (filter pills, button icon, language selector)
- [x] Phase 3 — Step 02 Configuration gap analysis
- [x] Phase 4 — Step 02 Configuration fixes (StepSummary, s-modal, s-option, full-width Add Rule)
- [x] Phase 5 — Step 03 Pricing layout alignment
- [x] Phase 6 — Step 04 Assets layout alignment
- [x] Phase 7 — Step 05 Pricing Tiers implementation
- [x] Phase 8 — Readiness Score + Guided Tour competitor-parity redesign
- [x] Phase 9 — Create bundle wizard end-to-end flow test + bug fix

## Progress Log

### 2026-05-09 14:00 - Phase 9: Create bundle wizard end-to-end flow test + bug fix

**End-to-end test result:** All 5 wizard steps tested in SIT; full flow works correctly.
- Step 01 (Bundle Name & Description) → Step 02 (Configuration) → Step 03 (Pricing) →
  Step 04 (Assets) → Step 05 (Pricing Tiers) → Full configure page — all transitions pass.

**Bug found and fixed:**
- In the Pricing Tiers step, the Linked Bundle `<s-select>` onChange handler was reading
  `(e.currentTarget as HTMLSelectElement).value`. Polaris web component custom events can
  dispatch with `currentTarget = null` (event dispatched outside React's synthetic event
  system), causing a TypeError crash and Remix error boundary 500 page.
- Fix: changed to `(e.target as HTMLSelectElement).value` — consistent with all other
  `<s-select>` change handlers in the file.

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` (line 2025)

### 2026-05-09 12:00 - Phase 8: Readiness Score + Guided Tour redesign

**Gap analysis vs. competitor (Easy Bundle Builder):**
- Collapsed state: competitor shows only donut + chevron ∧; ours had extra "Readiness / Score" text labels
- Expanded trigger: competitor shows donut + "Readiness Score" bold + "N/M items complete" subtitle + chevron ∨; ours had same minimal trigger in both states
- Panel items: competitor uses SVG circle indicators, description text per item, green border+bg for done items, "+N Points" badge chip; ours used text "○"/"✓" characters, no description, no done-item styling
- Score color: competitor uses red (#d82c0d) for low scores; ours returned gray (#aaa)
- Status line: competitor shows plain "Your bundle isn't ready to sell yet." (no ⚠ icon); ours had ⚠ prefix
- Guided tour: two dismiss buttons (header + footer); competitor has only one action (Got it / Next)
- Guided tour bug: when `data-tour-target` element is missing from the DOM, `tooltipStyle`/`spotlightRect` were not reset — tooltip stayed frozen at previous step's position

**Changes implemented:**
- `BundleReadinessItem` interface: added `description?: string` field
- `scoreColor()`: changed < 40 branch from `#aaa` → `#d82c0d`
- Collapsed trigger: removed `.scoreLabel` text; shows only donut + chevron; chevron now `∧` when collapsed, `∨` when expanded (matches competitor convention)
- Expanded trigger: conditionally renders `.scoreLabel` block with bold "Readiness Score" title + "N/M items complete" subtitle; `.collapsedOpen` class widens trigger to match panel
- Panel items: replaced text check chars with SVG circle indicators (filled green ✓ for done, empty gray ring for pending); added `.itemContent` flex column with bold label + description text; replaced inline points text with `.itemPoints` chip badge; `.panelItemDone` adds green border + bg
- Status line: removed ⚠, plain text only; shows both ready/not-ready states
- `BundleReadinessOverlay.module.css`: full CSS rewrite — removed old `.scoreLabel`, `.checkDone`, `.checkPending`, `.itemAction`, `.statusLine` classes; added new `.scoreLabelTitle`, `.scoreLabelSub`, `.collapsedOpen`, `.panelItemDone`, `.itemIndicator`, `.itemContent`, `.itemDesc`, `.itemPointsDone` classes
- Added `description` to all 5 readiness items in route.tsx
- `BundleGuidedTour.tsx`: removed redundant "Dismiss" button from `.actions` footer (kept header "Dismiss guided tour" link only)
- `BundleGuidedTour.tsx`: fixed missing-element bug — when `document.querySelector` returns null, now resets `spotlightRect` and `tooltipStyle` to defaults before returning

**Files changed:**
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`
- `app/components/bundle-configure/BundleGuidedTour.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-09 01:00 - Step 05 Pricing Tiers implementation

**Gap analysis vs. Figma Image #6:**
- Heading "Pricing Tiers" + subtitle: "Let shoppers switch between different bundle price points on the same page."
- Tier card (bordered): "Tier N" bold label + red trash icon; 2-col grid: Label (text input, placeholder "Buy 3 @ 699", helper "Shown on the pill button (50 max characters)") + Linked Bundle (select, helper "Choose the product bundle to trigger for this tier")
- Full-width dashed "Add Rule" button
- Footer: "Back" (secondary) + "Finish" (primary dark)

**Changes implemented:**
- Added `tiersFetcher` fetcher for `saveTiers` action
- Added `tiers` state initialized from `bundle.tierConfig`
- Changed `assetsFetcher` useEffect: now advances to `wizardStep(4)` instead of navigating away
- Added `tiersFetcher` useEffect: navigates to `redirectTo` on successful `saveTiers`
- Updated `pageTitle` derived value to include "Pricing Tiers" for wizardStep 4
- Updated `isSubmitting` to use `tiersFetcher.state` for wizardStep 4
- Updated `handleNext` deps + added wizardStep 4 branch: submits `saveTiers` via `tiersFetcher`
- Renamed "Finish Setup" → "Next" on Step 04 Assets footer
- Added `wizardStep === 4` JSX: full Pricing Tiers card with tier rows, Label/Linked Bundle 2-col grid, dashed Add Rule button, Back/Finish footer

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-09 00:15 - Step 04 feature row dividers, padding, and typography fix

**Problem:** Filters/Search Bar/Custom Fields rows were cramped with no visible separators. `s-heading`/`s-text` Polaris web components inside rows caused wrong visual weight and inconsistent spacing.

**Changes implemented:**
- Replaced `<s-heading>` + `<s-text>` in all three feature rows with `<p className={styles.assetRowTitle}>` and `<p className={styles.assetRowSubtitle}>`
- Added `padding: 16px 0` to `.assetRow` for vertical breathing room
- Fixed `.displayOptionDivider` background from `#f3f4f6` (nearly invisible) → `#e5e7eb` and added `margin: 0 -24px` so dividers span full card width (counteracts card's 24px padding)
- Set `.assetRowLeft` to `align-items: flex-start` so icon pins to the top of multi-line subtitle text

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

### 2026-05-08 19:12 - Dashboard gap analysis + fixes

**Gap analysis findings:**
- Language selector present in impl, absent in design → keep as extra feature, but fix broken event handler
- Filter dropdowns: design shows pill-style outlined buttons ("Status ▾", "Bundle type ▾"); impl uses `s-select` form controls → replace with `s-button + s-popover + s-choice-list`
- Create Bundle button: design shows no icon, impl has `icon="plus"` → remove icon
- Sync Collections icon: design shows refresh icon, impl uses `icon="refresh"` → already correct, no change

**Root cause of language selector bug:**
The `change` event handler was reading `(e as CustomEvent).detail?.value` first — Polaris web
components don't fire CustomEvents with a `detail` payload. The fallback `e.target.value` may
also be unreliable due to shadow DOM event re-targeting. Fixed to use `e.currentTarget.value`
which is always the `s-select` element the listener is attached to.

**Files changed:**
- `app/routes/app/app.dashboard/route.tsx`
- `app/routes/app/app.dashboard/dashboard.module.css`

**Next:** Continue with next Figma design image (TBD by user)

### 2026-05-08 22:30 - Gap 7: FilePicker empty state redesign

**Changes implemented:**
- Added `hint` prop to FilePicker — displays recommendation text inside the drop zone (e.g. "Recommended: 1920×400px")
- Added `uploadLabel` prop — controls upload button text ("Upload image" / "Upload")
- Replaced `ImageIcon` with inline monitor SVG matching Figma design
- Replaced "Select from store files or upload" subtitle with `hint` text
- Added pill-style "Upload image" button inside the empty-state drop zone
  - Triggers direct file upload (no modal) — auto-applies the uploaded file via `onChange` on success
  - Shows inline spinner + status text in the drop zone while uploading/polling
  - Shows errors below the zone when modal is not open
- Moved `<input type="file">` outside the `<dialog>` so `.click()` is a trusted user gesture regardless of dialog open state
- Added `uploadFromTrigger` state to differentiate direct-upload path from modal-upload path
- Updated Promo Banner FilePicker: `label="Choose background image"`, `hint="Recommended: 1920×400px"`, `uploadLabel="Upload image"`, removed `<s-text>` subtitle above picker
- Updated Loading Animation FilePicker: `label="Choose loading GIF"`, `hint="Recommended: 150×150px"`, `uploadLabel="Upload"`, removed `<s-text>` subtitle above picker

**Files changed:**
- `app/components/design-control-panel/settings/FilePicker.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-08 22:05 - Step 04 Assets layout alignment

**Changes implemented:**
- Added card subtitle "Add visual media to your bundle configurator..." below Media Assets heading
- Renamed "Loading GIF" → "Loading Animation" (heading + FilePicker label)
- Added `formatChip` info pills below each FilePicker (format: JPG/PNG/WebP for banner, GIF only for animation)
- Added `assetRowLeft` wrapper with `s-icon` (filter/search/edit) to all three feature rows
- Merged Filters, Search Bar, Custom Fields from 3 separate cards into 1 card with `displayOptionDivider` separators
- Updated subtitle text: Filters → "Create filters to display on this step", Custom Fields → "Add custom input fields (like gift notes or delivery dates)..."
- Deferred: FilePicker internal empty-state UI redesign (Gap 7) — separate task

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

### 2026-05-08 21:10 - Step 03 Pricing layout alignment

**Changes implemented:**
- Replaced 2-column `styles.layout` with single-column `styles.assetsLayout` for pricing step
- Removed entire Pricing Summary right sidebar (Discounts, Type, Rules, Progress bar, Messaging summary)
- Moved Back/Next footer out of sidebar to bottom of single-column layout
- Removed `{pricing.discountEnabled && ...}` gate on `pricingContent` div — Tip banner, Discount Type select, and Add Rule button now always visible regardless of toggle state

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-08 20:45 - Step 02 Configuration fixes

**Changes implemented:**
- Created `StepSummary.tsx` — new extracted component with 5 summary rows: Selected products, Rules, Filters, Search Bar, Custom Fields; uses existing CSS classes + Polaris web components
- Replaced old 2-row inline Step Summary sideCard with `<StepSummary />` component import
- Added `filtersCount` and `customFieldsCount` derived values in route component
- Migrated Multi Language modal from custom `div.modalBackdrop` to `s-modal` (controlled via `open={localeModalOpen || undefined}`, dismiss via `onHide`)
- Replaced ALL `<option>` → `<s-option>` throughout file (10 occurrences: rule conditions/operators, bundle status, discount type/conditions/operators, locale select, filter type, custom field type)
- Wrapped "Add Rule" button (step 02 Rules card) in `.addRuleWrap` div for full-width layout
- Added `.previewButtonWrap` and `.addRuleWrap` CSS classes in `wizard-configure.module.css`

**Files changed:**
- `app/routes/app/app.bundles.create_.configure.$bundleId/StepSummary.tsx` (created)
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

## Related Documentation
- Figma designs provided incrementally by user in chat
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`
