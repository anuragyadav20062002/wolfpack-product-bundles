# Issue: Select Template Nav Section — FPB + PPB
**Issue ID:** select-template-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-23
**Last Updated:** 2026-05-23 01:00

## Overview
Add a "Select template" nav section to both FPB and PPB configure pages. Merchants can choose from 4 visual layout presets per bundle type. Mirrors EB's Customization overlay (captured 2026-05-23 via Chrome DevTools MCP). Persists `wpbLayoutTemplate` + `wpbPresetId` to `Bundle` DB model.

## Related Documentation
- `docs/select-template/01-requirements.md`
- `docs/select-template/02-architecture.md`
- `internal docs/EB Implementation Reference.md` — template system reference
- `test-spec/select-template.spec.md`

## Progress Log

### 2026-05-23 01:00 - Phase 2 complete — parseWpbTemplate
- Added `parseWpbTemplate(formData)` export to `handlers/parsers.ts` (PPB)
- Created `tests/unit/routes/select-template.test.ts` — 12 tests, all passing
- Spec: `test-spec/select-template.spec.md`
- Next: Phase 1 — Prisma schema migration

### 2026-05-23 00:00 - Feature pipeline complete
- BR (fast-track) + PO + Architecture docs created
- Issue file created
- Next: write test spec → failing tests → implementation

## Phases Checklist
- [ ] Phase 1: Schema — add `wpbLayoutTemplate` + `wpbPresetId` to Bundle model + migration
- [x] Phase 2: Parser — add `parseWpbTemplate` to PPB parsers.ts; unit tests pass
- [ ] Phase 3: FPB handler — parse + persist new fields in FPB save handler
- [ ] Phase 4: PPB handler — spread `parseWpbTemplate` in PPB save handler
- [ ] Phase 5: FPB route — add nav item + section UI + form state + hidden inputs
- [ ] Phase 6: PPB route — same for PPB with PPB-specific templates
- [ ] Phase 7: Nav map update
- [ ] Phase 8: Lint + final commit
