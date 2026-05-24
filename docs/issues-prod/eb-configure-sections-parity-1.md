# Issue: EB Configure Sections Parity — Step Flow, Bundle Visibility, Bundle Settings, Select Template

**Issue ID:** eb-configure-sections-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-23
**Last Updated:** 2026-05-24 11:30

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

## Phases Checklist

- [x] Section 1: Step Flow card + Step Setup + Category accordion (FPB + PPB)
  - [x] Audit EB screenshots
  - [x] Implement FPB changes
  - [x] Implement PPB changes
  - [ ] E2E verify in Chrome (full E2E at end of all sections)
- [x] Section 2: Bundle Visibility (FPB + PPB)
- [x] Section 3: Bundle Settings (FPB + PPB)
- [ ] Section 4: Select Template — full reaudit (FPB + PPB)
