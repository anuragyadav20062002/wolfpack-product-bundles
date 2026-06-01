# Issue: EB Storefront Parity for FPB and PPB
**Issue ID:** eb-storefront-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-02 01:21

## Overview
Align FPB and PPB storefront behavior with EB end-to-end across APIs, DTOs, consumed JSON, metafields, template dispatch/designs, cart behavior, and per-template e2e proof.

## Progress Log
### 2026-06-02 01:21 - Goal started and fast-track architecture initiated
- User set the active goal to 100% EB storefront parity for FPB and PPB.
- Stage 1 requirements are fast-tracked from existing EB evidence docs instead of re-researching known behavior.
- Live SIT evidence confirmed PPB already loads through the product page app block and initialized widget container, while FPB marker hydration is a separate full-page issue.
- Next: implement in small template/contract slices, with e2e proof after each template.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md
- docs/issues-prod/eb-complete-configure-e2e-audit-1.md
- docs/issues-prod/select-template-1.md
- docs/eb-storefront-parity/02-architecture.md

## Phases Checklist
- [ ] Phase 1 - FPB storefront bootstrap and config contract
- [ ] Phase 2 - FPB templates: DEFAULT, CLASSIC, COMPACT, HORIZONTAL
- [ ] Phase 3 - PPB storefront bootstrap and config contract
- [ ] Phase 4 - PPB templates: CASCADE, COGNIVE, MODAL, SIMPLIFIED
- [ ] Phase 5 - Cart payload/metafield parity for FPB and PPB
- [ ] Phase 6 - Final desktop/mobile e2e parity pass
