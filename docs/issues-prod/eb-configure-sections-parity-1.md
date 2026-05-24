# Issue: EB Configure Sections Parity — Step Flow, Bundle Visibility, Bundle Settings, Select Template

**Issue ID:** eb-configure-sections-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-23
**Last Updated:** 2026-05-24 21:00

## Overview

Full EB parity pass on 4 configure-page sections, for both FPB and PPB:
1. **Step Flow card + Step Setup + Category accordion** — inner content, heading, card structure
2. **Bundle Visibility** — entire section + sub-sections
3. **Bundle Settings** — entire section
4. **Select Template** — full reaudit (modals, buttons, copy, layout)

Done section-by-section, FPB+PPB together per section. Screenshots taken at each stage to verify 100% accuracy before committing.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Progress Log

### 2026-05-24 21:00 - Step Flow card: move divider from above step tabs to below (FPB + PPB)

FPB changes:
- `full-page-bundle-configure.module.css`: `.stepNav` changed `border-top` → `border-bottom` (divider now appears after step tabs, not before them)
- `full-page-bundle-configure.module.css`: `.stepFlowCard` changed `padding-bottom: 0` → `padding-bottom: 8px` (gives the border-bottom breathing room inside the card before the card's outer border)

PPB changes:
- `product-page-bundle-configure.module.css`: `.stepNav` changed `border-top` → `border-bottom`
- `app.bundles.product-page-bundle.configure.$bundleId/route.tsx`: added `style={{ paddingTop: "16px" }}` to slide animation wrapper div so "Step Setup" heading has breathing room below the new divider

Also read EB "How to setup?" popup content in full — our implementation is aligned with EB's multi-step flow: Steps → Categories → Products, selection rules (step-level and category-level), discounts, and design.

### 2026-05-23 06:00 - Section 1 complete: Category accordion + Step Setup parity

FPB + PPB changes:
- Removed "Category Title" s-text-field from category accordion body — EB does not have this field
- Changed "Edit Products"/"Add Products" conditional → always "Add Products" (EB constant label)
- Changed "Edit Collections"/"Add Collections" conditional → always "Add Collections" (EB constant label)
- Rules Configuration: changed description bottom margin 16px → 8px
- Added "Learn More" linkButton below description (confirmed via live EB accessibility tree uid=123_63)
- Restored `{ label: "Category rules", value: "category" }` radio option — live EB has this (uid=123_68); was wrongly removed in eb-fpb-parity-clone-6
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors; all unit tests passing

### 2026-05-24 10:00 - Section 2 complete: Bundle Visibility parity (FPB + PPB)

FPB + PPB changes:
- App Embed Status: removed leading `<s-icon>` — EB has no icon before the heading
- Publishing Best Practices cards: replaced `<s-icon name="image-alt" />` placeholder with `<img src={img} alt={title} />` using WPB public images (bundleGallery.png, fpb.png, pdp.png, productPageThumbnail.png); `.visibilityGuideMedia` height raised 74px → 120px with `overflow:hidden` + `img { object-fit:cover }` in shared CSS
- Your Bundle Link: removed `<s-icon name="globe" />` before heading; changed inline stack → block stack; added "emails," to description to match EB copy exactly
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`, `app/styles/routes/bundle-configure-shared.module.css`
- ESLint: 0 errors; visually verified in Chrome (App Embed Status no icon, cards with images, Bundle Link no globe)

### 2026-05-24 12:30 - Section 4 complete: Select Template modal (FPB + PPB)

FPB + PPB changes:
- Removed inline `{activeSection === "select_template" && ...}` panel — Select Template no longer occupies main content area
- Added `selectTemplateModalRef` + `isSelectTemplateModalOpen` state to both routes
- Nav "Select Template" click now opens `<s-modal heading="Customization">` instead of switching inline section
- Modal contains: "Customize your bundle" header + subtitle + "Customize Colors & Language" secondary button; 2×2 template grid with `<h3>` card names (matching EB a11y pattern); "Next" primary button that closes modal
- `useModalHideListener` wired so Escape/backdrop/X also closes and resets state
- FPB templates: STANDARD/CLASSIC/COMPACT/HORIZONTAL with FBP_SIDE_FOOTER layout
- PPB templates: CASCADE/COGNIVE/MODAL/SIMPLIFIED with PDP_INPAGE/PDP_MODAL layouts
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 11:30 - Section 3 complete: Bundle Settings parity (FPB + PPB)

FPB + PPB changes:
- Pre Selected Product: changed `s-checkbox` → `s-switch`; added second description paragraph "These products will be added to user's box automatically on the first step."
- Enable Quantity Validation: added `productSlotsEnabled` + `maxQtyPerProduct` state/formData/handler for FPB (PPB already had it); max qty field now disabled when toggle is OFF
- Slot Icon: moved from standalone section → nested inside EQV section block
- Variant Selector + Show Text on + Button: kept as SettingsRow entries; "Show Text on + Button" now gated (text field only shown when toggle is ON; clearing addToCartButton on toggle OFF)
- Cart line item discount display: extracted into its own dedicated s-section; "Edit Defaults" button moved inline with section heading
- Redirect to checkout: kept as its own section (WPB-specific)
- Bundle Banner: changed from stacked vertical → 2-column CSS grid side-by-side ("Banner Image: Desktop" 1900x230 | "Banner Image: Mobile" 1100x500); same change applied to PPB where section was previously missing
- Bundle Level CSS: changed from always-open textarea → collapsible button (▾ chevron) revealing textarea on click
- WPB-specific rows (Show product prices, Show compare-at prices, Allow quantity changes) kept in own section
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Chrome DevTools verified: a11y tree confirmed all 13 sub-sections present; visual confirmed Bundle Banner 2-col + CSS collapsible render correctly

### 2026-05-23 - Issue created, starting Section 1: Step Flow + Step Setup + Category accordion

### 2026-05-24 14:00 - Starting Section 5: Select Template v2 — full-screen overlay + field rename + dedicated save + dismiss bug fix

New phases (extending existing Section 4 work):
- Rename DB fields: `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId` (match EB names)
- Replace `s-modal` with `position:fixed;inset:0` full-screen overlay (EB parity; z-index 2147482000)
- Dedicated `useFetcher` save on "Next" click (`intent: "updateBundleDesignTemplate"`) — independent of main form
- Dismiss bug eliminated by removing `s-modal` entirely
- Both FPB + PPB routes

### 2026-05-24 20:00 - Select Template: align modal pattern with all other modals (FPB + PPB)

- Added `isSelectTemplateModalOpen` state (initialized `false`) to both FPB + PPB
- Added `useEffect` watching `isSelectTemplateModalOpen` → `showPolarisModal`/`hidePolarisModal` — exactly the same pattern as `isSyncModalOpen`, `isProductsModalOpen`, etc.
- `openSelectTemplateModal` now calls `setIsSelectTemplateModalOpen(true)` (was direct `showPolarisModal`)
- `useModalHideListener` now calls `setIsSelectTemplateModalOpen(false)` + `setTemplateModalStep("select")`
- "Preview bundle" button calls `setIsSelectTemplateModalOpen(false)` (not `hidePolarisModal` directly)
- `size="large"` + confirm step layout retained from prior session
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 19:00 - Select Template: full-screen modal, dismiss fix, confirm step layout, divider removal (FPB + PPB)

- Added `size="large"` to `<s-modal>` — opens full-screen
- Confirm step: moved "View your bundle" heading + subtitle outside the gray card to match EB screenshot (previously they were inside)
- Removed `stepSetupDivider` HR from PPB Step Flow card (was 1px gray line between step nav chips and step content)
- Files: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 18:00 - Select Template: switch to s-modal, add confirm step (FPB + PPB)

- Replaced position:fixed custom overlay with `s-modal heading="Customization"` — Shopify Admin renders native chrome (heading + X dismiss button)
- Removed manual keyboard Escape listener (s-modal handles natively); added `useModalHideListener` to reset step on close
- "Next" no longer closes modal — transitions to "confirm" step showing "Your bundle is ready / Preview bundle" screen (EB parity)
- "Preview bundle" calls `hidePolarisModal` to close
- `openSelectTemplateOverlay` renamed `openSelectTemplateModal`; uses `showPolarisModal` imperatively

### 2026-05-24 17:30 - Post-E2E fixes: barrel export + X dismiss button (FPB + PPB)

- Fixed `handleUpdateBundleDesignTemplate` missing from PPB + FPB `handlers/index.ts` barrel re-exports — caused HTTP 500 on template save POST
- Added X dismiss button (top-right of overlay header) to both FPB + PPB overlays; calls `setIsSelectTemplateOverlayOpen(false)`

### 2026-05-24 16:30 - Section 5 complete

Files changed:
- `prisma/schema.prisma` — renamed `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId`
- `prisma/migrations/20260524081409_rename_bundle_design_template_fields/` — migration applied
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts` — renamed `parseWpbTemplate` → `parseBundleDesignTemplate`, updated field names
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — removed template fields from `handleSaveBundle`, added `handleUpdateBundleDesignTemplate`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — same; fixed stray extra `}` parsing error
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — full-screen overlay, `templateFetcher`, Escape key, pending state, removed s-modal; fixed stray extra `}` parsing error
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same
- `tests/unit/routes/select-template.test.ts` — updated to `parseBundleDesignTemplate` + new field names (12 tests, all green)

## Phases Checklist

- [x] Section 1: Step Flow card + Step Setup + Category accordion (FPB + PPB)
  - [x] Audit EB screenshots
  - [x] Implement FPB changes
  - [x] Implement PPB changes
  - [ ] E2E verify in Chrome (full E2E at end of all sections)
- [x] Section 2: Bundle Visibility (FPB + PPB)
- [x] Section 3: Bundle Settings (FPB + PPB)
- [x] Section 4: Select Template — modal (FPB + PPB)
- [x] Section 5: Select Template v2 — full-screen overlay + EB field rename + dedicated save + dismiss fix
  - [x] TDD: update tests (RED)
  - [x] Update parsers.ts (GREEN)
  - [x] Schema migration: rename DB fields
  - [x] FPB handler: remove from saveBundle, add handleUpdateBundleDesignTemplate
  - [x] PPB handler: same
  - [x] FPB route.tsx: full-screen overlay + templateFetcher
  - [x] PPB route.tsx: same
  - [x] Lint + commit
