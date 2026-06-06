# Issue: FPB Add-ons Admin EB Parity
**Issue ID:** fpb-addons-admin-eb-parity-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 04:49

## Overview
Make Full Page Bundle `Step Setup -> Free Gift & Add Ons` Admin UI match EB's Landing Page Add-ons implementation, including control order, switch behavior, SaveBar dirty/discard/save wiring, and end-to-end Admin-to-storefront proof. Keep the existing direct `personalizationData.addonProducts` contract and storefront runtime behavior unless parity verification exposes a functional gap.

## Progress Log
### 2026-06-05 04:38 - Implementation started
- User approved the EB Add-ons Admin parity design.
- Live EB Chrome audit captured current Add-ons controls and help article content.
- Live WPB Chrome audit captured current Admin section before changes.
- Next: add RED source-level tests for EB layout markers and SaveBar dirty wiring.

### 2026-06-05 04:49 - Completed and verified
- Added EB-style Add-ons Admin shell markers, switch controls, setup action wiring, selected-products control, footer card styling, and footer message dirty-state wiring.
- Verified Admin in Chrome: toggles, text fields, selected product count, discount field, footer message fields, SaveBar appearance, SaveBar busy state, and SaveBar clearing after save.
- Verified persistence with a read-only SIT Postgres query for bundle `cmpznom360001v0wqjqm3cv3a`: `personalizationData.addonProducts` saved title `Add ON`, step text `Add On`, subtext `Choose your add-on`, selected product `Revitalizing Glow Massage Tool™`, quantity eligibility `1`, discount `10`, and footer messages.
- Verified storefront in Chrome: saved Add-ons title and ineligible/success footer messages rendered, Add-ons step displayed the selected product, selected add-on appeared in bundle summary, and checkout included the add-on line in the bundle item metadata with 10% savings.
- Verification commands: focused Jest suites passed, ESLint completed with 0 errors and 937 existing warnings, graphify rebuild completed.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/superpowers/specs/2026-06-05-fpb-addons-admin-eb-parity-design.md`
- `docs/superpowers/plans/2026-06-05-fpb-addons-admin-eb-parity.md`
- `test-spec/fpb-addons-admin-eb-parity.spec.md`

## Phases Checklist
- [x] Phase 1: RED tests for Add-ons Admin parity and dirty wiring
- [x] Phase 2: Admin UI/CSS parity patch
- [x] Phase 3: SaveBar and persistence verification
- [x] Phase 4: Storefront/cart E2E verification
- [x] Phase 5: Build, lint, graph, and commit
