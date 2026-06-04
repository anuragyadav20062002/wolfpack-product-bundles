# Issue: FPB Add-ons and Messages Email Capture EB Parity
**Issue ID:** fpb-addons-messages-email-capture-parity-1
**Status:** In Progress
**Priority:** High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 02:25

## Overview
Rebuild the Full Page / Landing Page bundle Admin sections for Free Gift & Add Ons and Messages to match EB behavior and visual treatment. Scope includes contextual SaveBar behavior for every control, direct `personalizationData` persistence, storefront rendering, cart payload capture, and email capture fields. Outbound email delivery is not part of this slice; captured email data must be stored on the storefront/cart path without pretending to send email.

## Progress Log
### 2026-06-05 02:15 - Design gate started
- Read current repo instructions and Superpowers workflow.
- Reviewed EB reference for FPB Add-ons and Messages contracts.
- Confirmed user wants email controls included, with Option 2 selected: capture UI/data only, no outbound email provider.
- Created design spec: `docs/superpowers/specs/2026-06-05-fpb-addons-messages-email-capture-parity-design.md`.
- Next: get user review, then write the implementation plan before code changes.

### 2026-06-05 02:25 - Implementation plan started
- User approved the design spec.
- Creating Superpowers implementation plan with TDD, EB Chrome audit, SaveBar verification, storefront capture, and widget build gates.
- Plan file: `docs/superpowers/plans/2026-06-05-fpb-addons-messages-email-capture-parity.md`.
- Next: review plan and choose execution mode.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/eb-ui-clone-rewrite/evidence-manifest.md`
- `docs/superpowers/specs/2026-06-05-fpb-addons-messages-email-capture-parity-design.md`

## Phases Checklist
- [x] Phase 1: Define approved scope and design
- [x] Phase 2: Write implementation plan
- [ ] Phase 3: Add TDD test spec and failing tests
- [ ] Phase 4: Implement Admin parity and SaveBar wiring
- [ ] Phase 5: Implement storefront email capture and cart payload behavior
- [ ] Phase 6: Verify with tests, lint, widget build, and Chrome DevTools
