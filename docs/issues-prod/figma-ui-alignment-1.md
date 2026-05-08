# Issue: Figma UI Alignment — Dashboard

**Issue ID:** figma-ui-alignment-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-08
**Last Updated:** 2026-05-08 22:30

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
- [ ] Phase 7 — Next page (TBD by user)

## Progress Log

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
