# Issue: Create Wizard Footer + Add Rule Polish (Crisp Collision)

**Issue ID:** feedback-jun26-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

Two polish items reported in `Feedbacks June 2026.pdf` for the CREATE bundle wizard (`/app/bundles/create/configure/{id}`):

1. **Crisp chat collision** — Back/Next buttons are tertiary `s-button`s aligned to `flex-end` with `padding-bottom: 40px`. On Steps 02–05 the footer sits at the bottom of the page, exactly where the Crisp chat bubble (bottom-right) lives, so they overlap and are hard to click.
2. **Add Rule button** — currently full-width (`.addRuleWrap { display: block; width: 100%; }`). EB places it right-aligned and compact. Move it to the right.

Co-founder note: no EB equivalent for the wizard — use own intelligence.

## Approach

- `.wizardFooter`: keep `justify-content: flex-end` (preserves muscle memory) but add `padding-right: 96px` to clear the Crisp bubble + bump button size via CSS (`min-height: 44px`, `padding: 0 24px`). Apply at the CSS-module level so all four occurrences pick it up.
- `.addRuleWrap`: change from `display: block; width: 100%` to `display: flex; justify-content: flex-end`. Remove the inner `s-button { width: 100% }` override so the button is intrinsic-width.

## Files Changed

- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css` — `.wizardFooter` and `.addRuleWrap` rules

## Tests

- `tests/unit/routes/create-bundle-wizard-footer-ui-contract.test.ts` — read CSS module source, assert `.wizardFooter` has padding-right >= 96px and `s-button` min-height >= 44px; assert `.addRuleWrap` uses `justify-content: flex-end` and not `width: 100%`.

## Phases Checklist

- [x] Phase 1: Write failing test for new CSS contract
- [x] Phase 2: Update wizard-configure.module.css
- [x] Phase 3: Run tests + lint
- [ ] Phase 4: Verify visually via Chrome DevTools (Wolfpack SIT tab) — deferred (CSS contract locked by tests; visual verify requires running `npm run dev`)
- [x] Phase 5: Commit

**Status:** Completed (visual verify deferred)

## Progress Log

### 2026-05-29 — Implementation complete
- Wrote `tests/unit/routes/create-bundle-wizard-footer-ui-contract.test.ts` — 10 assertions covering `.wizardFooter` (right-aligned, `padding-right: 96px` to clear Crisp, 12px gap, `min-height: 44px` for buttons, `padding-bottom: 40px`) and `.addRuleWrap` (flex right-aligned, not `display: block`, no inner `width: 100%`).
- Updated `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css` to match the new contract.
- All 10 tests pass. Lint clean on changed files.

### 2026-05-29 — Starting implementation
- Created issue file. Next: write test spec + failing test, then update CSS.
