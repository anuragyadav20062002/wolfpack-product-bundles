# Issue: Legacy DCP Removal
**Issue ID:** legacy-dcp-removal-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-02 00:44

## Overview
Remove the old Design Control Panel route, code, references, and repo instructions now that storefront/admin design configuration is moving to Settings Page -> Design.

## Progress Log
### 2026-06-02 00:44 - Scope started
- User requested removal of older DCP and all related functionality/code references.
- Also remove AGENTS.md and CLAUDE.md instructions that require DCP dependency checks before code generation.
- First pass: search internal docs, graph, issue docs, app code, extensions, tests, and repo guidance for DCP/design-control-panel references before editing.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/issues-prod/eb-configure-completion-parity-1.md

## Phases Checklist
- [ ] Phase 1 - Remove repo guidance DCP requirements
- [ ] Phase 2 - Remove legacy DCP routes/components/hooks/services
- [ ] Phase 3 - Remove tests/docs references or update them to Settings Page -> Design
- [ ] Phase 4 - Focused lint/test validation

### 2026-06-02 01:02 - Legacy DCP removal patch applied
- Moved the reusable media picker from `app/components/design-control-panel/settings/FilePicker.tsx` to `app/components/shared/FilePicker.tsx` with `ImageCropEditor` beside it.
- Removed the legacy `app/design-control-panel` route, DCP component directory, DCP config library, DCP hook, DCP CSS module, and old DCP-only tests.
- Repointed configure routes, onboarding, shell nav, pricing labels, and product-page Edit Defaults links to Settings / Settings -> Design instead of `/app/design-control-panel`.
- Updated AGENTS.md, CLAUDE.md, and the app navigation map to remove DCP customizability/dependency instructions.
- Next: clean any remaining active-source references, rebuild widget bundles because raw widget comments changed, then run focused lint/tests.

### 2026-06-02 01:10 - Legacy DCP removal validation
- Active-source search is clean for `design-control-panel`, `Design Control Panel`, `DCP`, legacy modal query params, DCP component imports, DCP route names, and DCP config/hook references across app, tests, AGENTS.md, CLAUDE.md, Prisma comments, scripts, extension blocks, and app navigation map.
- Removed legacy DCP preview API route and moved shared FilePicker/ImageCropEditor to `app/components/shared`.
- Bumped `WIDGET_VERSION` to `2.9.14`, ran `node --check` for modified raw widget files, and rebuilt widgets with `npm run build:widgets`.
- Focused Jest passed: `settings-landing-card-only`, `settings-design-configure-flow`, `product-page-admin-sections`, `create-bundle-configure-action`, and `theme-color-inheritance` with 38/38 tests.
- Scoped ESLint passed with 0 errors for touched source/test files; warnings are existing style/unsafe-any warnings.
