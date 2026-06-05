# Issue: FPB Add-ons Upload Gift Box Default
**Issue ID:** fpb-addons-upload-giftbox-default-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 06:21

## Overview
Match the Free Gift & Add Ons compact card padding, header control grouping, and Add-ons action button treatment to EB while keeping existing save behavior intact.

## Progress Log
### 2026-06-05 05:50 - Slice started
- User requested the upload file space match EB with the SVG default gift box.
- Live EB Add-ons audit confirmed the empty upload file area has a visual gift-box default and a separate Replace action.
- Next: add focused RED test, implement default gift-box SVG and CSS, verify in Chrome, lint, graphify, and commit.

### 2026-06-05 06:25 - Width correction
- User clarified the gift-box upload box must occupy the same width as the Replace button.
- Next: add a focused source guard for the Add-ons icon column width contract, then apply Add-ons-specific icon box and Replace button classes.

### 2026-06-05 06:25 - Padding and modal parity
- Audited EB's Add-ons Step, Add-ons Section, and Footer Messaging Multi Language modals in Chrome, plus the Add-ons help article opened from "How to setup?".
- Added rich vs compact Multi Language modal rendering so the Add-ons Step modal keeps the EB helper headings while the Section and Footer modals use EB's compact field-only layout.
- Scoped Add-ons card and tier body padding to the compact EB density and kept the gift-box upload area width aligned with the Replace button.
- Verified with focused unit tests, Shopify Polaris component validation, Chrome screenshots for all three modal variants, and ESLint on modified TS/TSX files.

### 2026-06-05 06:14 - Modal work split out
- User clarified language modals need their own parity slice.
- Moved modal-specific issue/spec/test tracking to `fpb-addons-language-modal-parity-1`.
- This issue now tracks Add-ons upload, card padding, toggle grouping, and button/layout treatment only.

### 2026-06-05 06:09 - Upload sizing follow-up
- User requested the gift icon and Replace button be increased slightly and the Step Name / Step Title controls use more of the available row space.
- Next: add a focused source guard for the Add-ons media row sizing, then apply Add-ons-specific grid and field-column sizing.

### 2026-06-05 06:09 - Header controls follow-up
- User clarified the top two Multi Language buttons must match the Footer Messaging Multi Language button style.
- User also clarified toggles need to be grouped with their card titles.
- Next: add focused source guards for Polaris secondary globe buttons and title-clustered Add-ons toggles, then update the header markup.

### 2026-06-05 06:09 - Tier action button follow-up
- User clarified Add Tier Rule and Add Add Ons Tier buttons must also use the same button treatment as the Footer Messaging Multi Language button.
- Next: guard those tier actions as Polaris secondary buttons, then remove the custom tier button styling path.

### 2026-06-05 06:18 - Layout slice verified
- Increased Add-ons icon/Replace control width to 96px and gift icon to 40px.
- Added an Add-ons-specific media grid so Step Name and Step Title take the remaining row width.
- Moved the Add-ons step toggle beside the card title and kept the Add-ons with Bundles toggle beside its title.
- Converted top/section Multi Language controls, Add Tier Rule, and Add Add Ons Tier to Polaris secondary button paths.
- Verified with focused unit tests, Shopify component validation, Chrome screenshot/snapshot, ESLint, and graphify rebuild.

### 2026-06-05 06:21 - Step config controls split out
- User clarified Step icon, Replace button, Step Name, and Step Title need their own parity slice.
- Moved dedicated source guard coverage to `fpb-addons-step-config-controls-parity-1`.
- This issue now remains focused on card padding, title/toggle grouping, and Add-ons action button treatment.

## Related Documentation
- `docs/issues-prod/fpb-addons-admin-control-parity-2.md`
- `test-spec/fpb-addons-admin-control-parity-2.spec.md`
- `test-spec/fpb-addons-upload-giftbox-default-1.spec.md`
- `docs/issues-prod/fpb-addons-language-modal-parity-1.md`
- `docs/issues-prod/fpb-addons-step-config-controls-parity-1.md`

## Phases Checklist
- [x] Phase 1: RED test for Add-ons Admin layout controls
- [x] Phase 2: Implement card padding, header grouping, and button treatment
- [x] Phase 3: Chrome verification, lint, graphify, and commit-ready status
