# Issue: EB Quantity Validation Parity
**Issue ID:** eb-quantity-validation-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-03
**Last Updated:** 2026-06-04 02:31

## Overview
Replicate Easy Bundles' Enable Quantity Validation card in the FPB and PPB configure Bundle Settings section, covering Admin UI, behavior, persistence, and storefront runtime behavior.

## Progress Log
### 2026-06-03 23:53 - Started
- User requested complete EB parity for the Enable Quantity Validation card in FPB and PPB configure pages.
- Feature pipeline is required before implementation: BR, PO, Architect, then SDE.
- Next: gather current repo evidence, EB reference facts, and live/help-link gaps before proposing the implementation design.

### 2026-06-03 23:56 - Targeted gap-fix scope confirmed
- User approved targeted gap-fix and proof path instead of a full reimplementation.
- Added scope: Bundle Settings → Enable Quantity Validation → Slot Icon must look and behave like EB; Change Icon must not redirect to Step Setup.
- Added scope: investigate Step Setup → Step Config purpose, verify whether it works, then align UI and behavior with EB evidence.
- Known current blocker from staging regression: enabling Product Slots plus Quantity Validation returned HTTP 500 on SIT.
- Next: root-cause the save/redirect behavior, add RED tests, then patch the narrow failing contracts.

### 2026-06-04 00:01 - Completed local gap fix
- Root cause: FPB and PPB save handlers were still deriving `boxSelection.validateBoxSelectionQuantity` from `productSlotsEnabled`. EB parity requires Quantity Validation and Product Slots to be independent controls.
- Patched FPB and PPB handlers so `validateQuantityPerProduct.isEnabled` drives `boxSelection.validateBoxSelectionQuantity`; `productSlotsEnabled` now remains the empty-slot display flag only.
- Updated stale FPB Slot Icon contract test that still expected the old `stepImage`/Step Config coupling. Slot Icon now tests the EB-aligned bundle-level `productSlotIconUrl` picker.
- Added `test-spec/eb-quantity-validation-parity.spec.md` for this TDD session.
- Confirmed Step Setup → Step Config purpose: it is a separate per-step `stepImage` upload plus Step Title control. Existing FPB/PPB source and persistence contracts pass.
- Verification passed:
  - `npx jest tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand --testNamePattern "Product Slots independent|even when Product Slots|wires Bundle Settings quantity validation"`
  - `npx jest tests/unit/routes/bundle-settings-slot-icon-step-config-parity.test.ts tests/unit/routes/fpb-slot-icon-change-icon-contract.test.ts tests/unit/routes/step-setup-step-config-image-contract.test.ts tests/unit/routes/quantity-validation-eb-parity-contract.test.ts --runInBand`
  - `npx eslint --max-warnings 9999 ...` on modified handlers/tests: 0 errors, existing warnings only
  - `git diff --check`
  - `npm run build`
  - graphify rebuild via documented virtualenv
- Note: full combined route test run exposed an unrelated stale FPB expectation for category product `variants` in `fpb-save-bundle.test.ts`; not changed in this slice.
- Live SIT proof is still required after deployment because Chrome currently shows deployed SIT, not local changes, and Render MCP has no selected workspace for log inspection.

### 2026-06-04 02:31 - Reverified with broader configure parity suite
- Re-ran the combined focused configure parity suite covering FPB/PPB quantity validation save behavior alongside category accordion and PPB Place Widget contracts.
- Fixed the stale FPB category-product variants expectation under the category accordion parity slice.
- Verification passed: 9 Jest suites / 127 tests, scoped ESLint with 0 errors, `npm run build`, and `git diff --check` excluding regenerated graph output.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`

## Phases Checklist
- [x] BR: evidence-backed behavior and business requirement
- [x] PO: acceptance criteria for Admin, persistence, and storefront
- [x] Architect: ADR and file-by-file plan
- [x] SDE: TDD implementation and verification
