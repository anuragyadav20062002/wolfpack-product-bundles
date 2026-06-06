# Issue: FPB Bundle Settings Admin Parity
**Issue ID:** fpb-bundle-settings-admin-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 17:57

## Overview
Fresh parity slice for the full-page bundle Bundle Settings section. The target is 100% EB Admin UI surface parity and matching save behavior for settings that EB exposes in this section.

## Progress Log
### 2026-06-05 17:41 - Fresh EB audit
- Audited EB FPB Bundle Settings in Chrome on `yash-wolfpack`.
- Confirmed no visible Bundle Settings help/setup links in the section.
- Captured EB controls: Pre Selected Product, Quantity Validation, Product Slots, Slot Icon, Variant Selector, Show Text on + Button, selling-plan incompatibility warning, Pre-order & Subscription Integration, Bundle Cart, cart discount display, Bundle Banner, Bundle Level CSS, and Bundle Status.
- Identified WPB gaps: missing selling-plan warning/control, visible WPB-only Redirect to checkout control, and missing FPB save wiring for `individualSellingPlanSelection`.
- Next: add focused tests, wire the direct config, adjust the visible Admin surface, then verify in Chrome.

### 2026-06-05 17:57 - Implemented parity slice
- Added FPB surface tests for EB's Pre-order & Subscription Integration control and removal of the visible WPB-only redirect checkout row.
- Added FPB save-contract coverage for `individualSellingPlanSelection` alongside direct quantity validation and product slots config.
- Updated the FPB Bundle Settings UI to render the selling-plan control after Show Text on + Button and reveal the Apply to products selector when enabled.
- Removed the non-EB Quantity Validation conversion-rate banner from the visible FPB Bundle Settings surface.
- Wired `individualSellingPlanSelection` through FPB save parsing, database update, and bundle metafield config.
- Verified in Chrome after ignore-cache reload: Bundle Settings section opens, the EB-positioned selling-plan control appears, enabling it shows Apply to products, and the temporary change was discarded.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `internal docs/EB Integrations Reference.md`
- `internal docs/EB Edit Settings Gap Audit 2026-06-04.md`

## Phases Checklist
- [x] Phase 1: Fresh EB Bundle Settings audit
- [x] Phase 2: Add surface and save-contract tests
- [x] Phase 3: Implement FPB Admin UI parity changes
- [x] Phase 4: Run focused tests and lint
- [x] Phase 5: Chrome E2E verification
