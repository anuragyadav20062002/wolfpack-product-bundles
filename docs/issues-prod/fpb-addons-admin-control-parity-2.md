# Issue: FPB Add-ons Admin Control Parity Slice 2
**Issue ID:** fpb-addons-admin-control-parity-2
**Status:** Completed
**Priority:** High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 05:39

## Overview
Run a second evidence-backed parity slice for Full Page Bundle `Step Setup -> Free Gift & Add Ons`, focused on Admin UI controls. Every visible control in the EB Add-ons implementation must be audited, mapped against WPB, and either matched or explicitly deferred with evidence. SaveBar dirty/save/discard behavior remains part of the control audit.

## Progress Log
### 2026-06-05 05:08 - Audit started
- User requested another parity slice on the Free Gift & Add Ons page with deep Admin UI focus.
- Next: audit live EB Add-ons controls/help content, compare against current WPB, and produce a scoped design before implementation.

### 2026-06-05 05:18 - Live control gap map completed
- EB evidence captured for Add-ons language modals, footer variables modal, selected-products modal, add-tier-rule behavior, add-tier accordion behavior, step-icon upload SaveBar behavior, and top switch disable confirmation.
- WPB comparison confirmed gaps: Add-ons Multi Language buttons are disabled, Show Variables opens generic discount variables, selected count is inert, empty tier-rule copy appears where EB shows no empty row, and tiers do not yet use EB's single-expanded accordion behavior.
- Implementation slice: wire scoped Add-ons language modals, add an Add-ons variables modal, add selected Add-ons products modal behavior, remove the non-reference empty rule row, and add tier accordion state with new tier expansion.

### 2026-06-05 05:28 - Tests green, implementation ready for browser verification
- Added focused test spec `test-spec/fpb-addons-admin-control-parity-2.spec.md` and RED tests for Add-ons scoped language buttons, Add-ons variables modal, selected-products modal, tier empty state, and tier accordion behavior.
- Implemented route/CSS changes for active Add-ons language controls, Add-ons-specific variables, selected Add-ons products modal, tier accordion, and top switch confirmation.
- Verification so far: focused Jest suite passes; ESLint on modified TS/TSX files exits with 0 errors and existing warnings only.

### 2026-06-05 05:34 - Tier card parity follow-up
- User requested deeper focus on making tiers collapsible cards exactly like EB.
- Next: tighten the Add-ons tier card header/body styling, active-card affordance, add-tier expansion behavior, and Add Tier Rule default state against live EB evidence.

### 2026-06-05 05:39 - Tier card parity verified
- Tightened FPB Add-ons tiers into EB-style collapsible cards with a grey header, active/inactive state hooks, icon-only delete action, single-expanded body, and stale active-index clamping after discard/reset.
- Aligned Add Tier Rule defaults to EB evidence: Quantity, `is less than or equal to`, value `1`.
- Chrome verification completed on the embedded Shopify Admin: Tier 2 creation opens SaveBar, collapses Tier 1, expands Tier 2, Add Tier Rule shows the EB defaults, Shopify discard confirmation restores saved state, and reload returns Tier 1 expanded.
- Verification commands completed: focused Jest suite passed, ESLint exited with 0 errors on modified TS/TSX files, and graphify rebuilt `graphify-out`.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/issues-prod/fpb-addons-admin-eb-parity-1.md`
- `test-spec/fpb-addons-admin-eb-parity.spec.md`

## Phases Checklist
- [x] Phase 1: Live EB Add-ons control audit
- [x] Phase 2: Current WPB Add-ons control audit
- [x] Phase 3: Gap map and scoped design
- [x] Phase 4: RED tests for uncovered controls/SaveBar wiring
- [x] Phase 5: Implementation
- [x] Phase 6: Chrome Admin/storefront verification, lint, graph, commit
