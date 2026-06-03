# Issue: Quantity Validation EB Parity and Create Wizard Preview Placement
**Issue ID:** quantity-validation-eb-parity-create-preview-placement-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-03
**Last Updated:** 2026-06-03 15:32

## Overview

Replicate EB's Enable Quantity Validation card behavior in FPB and PPB configure Bundle Settings from Admin through storefront runtime. Move the create bundle wizard Preview button to the top of the page next to the "How to configure?" action. Keep Slot Icon as a per-bundle Bundle Settings control only; do not reintroduce the old Design Control Panel implementation.

## Progress Log

### 2026-06-03 14:52 - Starting audit and impact analysis
- User requested 100% EB parity for Bundle Settings > Enable Quantity Validation in FPB and PPB, a create wizard Preview button placement change, and confirmed Slot Icon remains per-bundle only.
- Using `shopify-expert` because this touches embedded Admin UI, Shopify product metafield config, and storefront widget behavior.
- Worktree has unrelated Admin UI i18n changes; those will be kept separate from this issue.
- Next: review EB evidence, inspect current FPB/PPB/card/wizard code, write TDD coverage, then implement scoped changes.

### 2026-06-03 15:08 - Audit findings and Red test plan
- Chrome DevTools is disconnected, so live EB verification cannot run in this workspace.
- Used existing authenticated EB audit evidence. EB has separate controls for Enable Quantity Validation and Product Slots; Slot Icon remains bundle-level and only belongs under Bundle Settings.
- Found current FPB/PPB Admin bug: `productSlotsEnabled` is used as the Quantity Validation toggle, so quantity validation and empty-slot rendering are conflated.
- Found FPB persistence gap: the save handler stores `productSlotsEnabled` and `maxQtyPerProduct`, but not the direct `validateQuantityPerProduct` runtime object needed by the storefront widget.
- Found create wizard placement gap: Preview is rendered in the right-side Step Summary and in wizard footers instead of the top header beside "How to configure?".
- Next: add failing source-contract tests for the split settings, storefront slot flag usage, and header Preview placement.

### 2026-06-03 15:32 - Implemented and verified
- Split Quantity Validation from Product Slots in FPB and PPB Admin UI. `quantityValidationEnabled` now drives the max quantity field and `validateQuantityPerProduct`; `productSlotsEnabled` only drives empty slot storefront display.
- Added EB-aligned Product Slots helper text, Slot Icon controls, quantity-rule note, and Pro Tip banner to the card.
- Added FPB persistence for direct `validateQuantityPerProduct` and public config propagation for `productSlotsEnabled`.
- Updated PPB and FPB widgets to read `productSlotsEnabled`; FPB now uses the shared per-product quantity validation guard.
- Moved the create wizard Preview action to the page header next to "How to configure?" and removed the old footer/Step Summary placement.
- Bumped widget version from `2.9.11` to `2.9.12` and rebuilt widget assets.
- Updated the app navigation map and rebuilt graphify outputs.
- Verification: 258 focused Jest tests passed; widget/build JS syntax checks passed; ESLint completed with 0 errors; `git diff --check` passed.

### 2026-06-03 15:45 - Commit 1 preparation
- Preparing the Quantity Validation EB parity commit.
- Scope: FPB/PPB Admin split between Quantity Validation and Product Slots, runtime config propagation, storefront widget enforcement/rendering, widget version/build assets, and focused tests.
- Leaving create wizard Preview placement and DCP/Slot Icon documentation for separate commits as requested.

## Related Documentation

- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md`
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`
- `docs/issues-prod/eb-complete-configure-e2e-audit-1.md`
- `docs/issues-prod/bundle-settings-slot-icon-step-config-parity-1.md`

## Phases Checklist

- [x] Phase 1: EB evidence and impact analysis
- [x] Phase 2: TDD specs for quantity validation and preview placement
- [x] Phase 3: Admin UI parity implementation
- [x] Phase 4: Storefront runtime functionality
- [x] Phase 5: Widget rebuild, lint, tests, graph refresh
