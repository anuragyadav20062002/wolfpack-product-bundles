# Issue: Template CSS Redundancy Cleanup
**Issue ID:** template-css-redundancy-cleanup-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 23:14

## Overview
Audit storefront template CSS files for redundant declarations and remove only properties that are provably unnecessary, such as duplicated properties inside the same rule block or template-specific declarations immediately overridden by later rules in the same file.

Scope:
- `app/assets/widgets/full-page-css/templates/*.css`
- `app/assets/widgets/product-page-css/templates/*.css`

This is a cleanup pass only. It must not change template visual behavior.

## Progress Log
### 2026-06-04 23:06 - Work started
- User requested analysis and removal of redundant CSS properties throughout template files.
- Prior runtime CSS refactor issues were already completed and focused on moving JS inline styles into CSS. This issue is scoped to template CSS redundancy only.
- Impact analysis: touches storefront template CSS modules and generated extension CSS assets if source CSS changes are made.
- Next steps: run a parser-style audit for duplicate declarations, manually verify candidate removals against cascade order, patch only safe redundancies, rebuild/minify CSS assets, run diff checks, and commit if source changes are made.

### 2026-06-04 23:08 - Audit results
- Parsed product-page and full-page template CSS files with PostCSS; no same-rule duplicate properties were found.
- Found template isolation redundancies in product-page CSS:
  - `inpage-cognive.css` contains a `PDP_MODAL` mobile block that belongs to modal slot styling.
  - `modal-slots.css` contains a CASCADE `PDP_INPAGE` dynamic-checkout rule that belongs to cascade styling.
- Found cascade redundancies in `modal-slots.css`:
  - Early vertical `.bw-slot-card--empty` declarations are fully superseded by later vertical/simplified empty-slot blocks.
  - Later SIMPLIFIED CTA background blocks duplicate earlier SIMPLIFIED CTA rules.
- Next edit: move misplaced rules to their owning template files, remove only the superseded modal-slot declarations, then rebuild minified product-page CSS.

### 2026-06-04 23:10 - CSS cleanup applied
- Moved the CASCADE dynamic-checkout visual rule from `modal-slots.css` into `inpage-cascade.css`.
- Removed the misplaced `PDP_MODAL` mobile block from `inpage-cognive.css` and placed it under modal-slot CSS ownership.
- Removed the superseded early vertical empty-slot rule from `modal-slots.css`.
- Removed duplicate later SIMPLIFIED CTA background/disabled blocks from `modal-slots.css`; the earlier SIMPLIFIED CTA rules already own those values.
- Rebuilt minified product-page CSS with `npm run minify:assets css`; `extensions/bundle-builder/assets/bundle-widget.css` is now 90.4 KB.

### 2026-06-04 23:14 - Verification completed
- Re-ran PostCSS parsing over all template CSS files; all template files parse successfully.
- Re-ran template selector isolation checks; all template selectors are owned by the expected template files after moving misplaced blocks.
- Rebuilt the graph with graphify after CSS source changes and trimmed generated trailing whitespace.
- Ran `git diff --check`; whitespace checks passed.
- Smoke-tested the current PPB COGNIVE storefront template in Chrome at 390px mobile width; template attributes still resolve to `PDP_INPAGE` / `COGNIVE`, two-column product grids remain container-sized, and there is no horizontal overflow.
- ESLint is not applicable to this CSS-only source change.
- Ready to commit the scoped cleanup files and generated CSS asset.

## Related Documentation
- `docs/issues-prod/ppb-runtime-css-refactor-1.md`
- `docs/issues-prod/fpb-runtime-css-refactor-1.md`

## Phases Checklist
- [x] Phase 1: Audit template CSS redundancy candidates
- [x] Phase 2: Remove safe redundant declarations
- [x] Phase 3: Rebuild/minify generated CSS assets
- [x] Phase 4: Run verification checks
- [x] Phase 5: Commit relevant changes
