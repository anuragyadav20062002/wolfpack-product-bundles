# Issue: Unified Edit Flow Control Audit

**Issue ID:** unified-edit-flow-control-audit-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 19:20

## Overview
Audit the currently implemented edit bundle controls and map extra edit-only capabilities onto the revamped Create Bundle wizard design before implementing a separate `edit/:bundleId` unified endpoint.

## Progress Log

### 2026-05-11 18:55 - Started audit
- Created issue file before documentation changes.
- Scope: code audit plus Chrome DevTools verification where live admin access is available.
- Goal: document create-flow controls, legacy FPB/PPB edit-flow controls, and the delta that must be discussed before merging into the unified wizard.

### 2026-05-11 19:20 - Completed code-side control inventory
- Audited create Step 01 and create configure Steps 02-05.
- Audited legacy FPB and PPB edit configure controls from route code and shared state hooks.
- Documented edit-only controls, proposed create-wizard placement, endpoint recommendation, dirty-save recommendation, and open decisions.
- Chrome live continuation is blocked: the DevTools MCP selected page is closed and the tool errors on `list_pages`, `select_page`, and `new_page`.
- Documentation added: `docs/unified-edit-configure-wizard/03-control-audit-and-placement.md`.

## Related Documentation
- `docs/unified-edit-configure-wizard/01-requirements.md`
- `docs/unified-edit-configure-wizard/02-architecture.md`
- `docs/unified-edit-configure-wizard/03-control-audit-and-placement.md`
- `docs/issues-prod/unified-edit-configure-wizard-1.md`

## Phases Checklist
- [x] Phase 1: Inventory create wizard controls
- [x] Phase 2: Inventory legacy edit FPB and PPB controls from code
- [ ] Phase 3: Verify live admin behavior in Chrome DevTools
- [x] Phase 4: Document extra edit-only controls and proposed placement in the create-flow design
