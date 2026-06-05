# Issue: FPB Add-ons Language Modal Parity
**Issue ID:** fpb-addons-language-modal-parity-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 06:18

## Overview
Match the three Free Gift & Add Ons Multi Language modal variants to EB as a dedicated parity slice, separate from the Add-ons card layout and button-density work.

## Progress Log
### 2026-06-05 06:14 - Slice split
- User clarified language modals need their own parity slice.
- EB audit already identified three distinct modal variants: rich Add-ons Step modal, compact Add-ons Section modal, and compact Footer Messaging modal.
- Next: keep modal-specific route/component assertions and Chrome verification under this issue only.

### 2026-06-05 06:18 - Modal slice verified
- Added dedicated modal parity issue, test spec, and focused unit test file.
- Verified the rich Add-ons Step modal in Chrome: Translations, Choose language to edit, Custom Text, Text Settings, Step Text, Step Subtext, and Save and Close.
- Verified the compact Add-ons Section modal in Chrome: Select Language, Add on Section title, Tier#1 Title, and Save and close.
- Verified the compact Footer Messaging modal in Chrome: Select Language, Tier 1, Message when rule not met, Success Message, and Save and close.
- Verified Polaris modal component patterns with Shopify component validation.

## Related Documentation
- `docs/issues-prod/fpb-addons-upload-giftbox-default-1.md`
- `test-spec/fpb-addons-language-modal-parity-1.spec.md`

## Phases Checklist
- [x] Phase 1: Dedicated RED/GREEN test coverage for the three Add-ons language modal variants
- [x] Phase 2: Modal route/component wiring
- [x] Phase 3: Chrome verification for all three modal variants
