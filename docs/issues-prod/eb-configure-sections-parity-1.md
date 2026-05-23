# Issue: EB Configure Sections Parity — Step Flow, Bundle Visibility, Bundle Settings, Select Template

**Issue ID:** eb-configure-sections-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-23
**Last Updated:** 2026-05-23 06:00

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

### 2026-05-23 - Issue created, starting Section 1: Step Flow + Step Setup + Category accordion

## Phases Checklist

- [x] Section 1: Step Flow card + Step Setup + Category accordion (FPB + PPB)
  - [x] Audit EB screenshots
  - [x] Implement FPB changes
  - [x] Implement PPB changes
  - [ ] E2E verify in Chrome (full E2E at end of all sections)
- [ ] Section 2: Bundle Visibility (FPB + PPB)
- [ ] Section 3: Bundle Settings (FPB + PPB)
- [ ] Section 4: Select Template — full reaudit (FPB + PPB)
