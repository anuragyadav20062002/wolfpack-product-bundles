# Issue: i18n for All Help Tooltips

**Issue ID:** i18n-tooltips-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-20
**Last Updated:** 2026-05-20

## Overview

Move all hardcoded English tooltip strings (title + description) from `HELP_TOOLTIPS` in `app/constants/help-tooltips.ts` into the i18n locale files. Wire `useTranslation` through both `RichHelpTooltip` and `QuestionHelpTooltip` components in FPB and PPB routes.

**Scope:** All 6 locales (en, fr, de, es, ja, pt-BR). Non-English locales use English text as placeholder — translators will update in a future pass.

**Keys to migrate (7 existing + 1 new from eb-fpb-parity-clone-3):**
- `stepFlow`, `category`, `rulesConfiguration`, `bundleQuantityOptions`
- `discountProgressBar`, `discountMessaging`, `loadingAnimation`
- `bundleVisibilityPending` (description only — no visual, no title displayed)

## Progress Log

### 2026-05-20 - Issue created, implementation starting

- Audited HELP_TOOLTIPS structure: `title`, `description`, `visual`, `accessibilityLabel`
- Plan: remove `title` and `description` from `HelpTooltipDetails` interface; add `tooltips` section to all 6 locale files; update both tooltip components to read from `t('tooltips.{key}.title')` / `t('tooltips.{key}.description')`

## Files to Change

- `app/constants/help-tooltips.ts`
- `app/i18n/locales/en.json`
- `app/i18n/locales/fr.json`
- `app/i18n/locales/de.json`
- `app/i18n/locales/es.json`
- `app/i18n/locales/ja.json`
- `app/i18n/locales/pt-BR.json`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Progress Log

### 2026-05-20 - All changes implemented

- Removed `title` and `description` from `HelpTooltipDetails` interface in `help-tooltips.ts`; updated `HELP_TOOLTIPS` record accordingly (visual + accessibilityLabel only)
- Added `tooltips` section to all 6 locale files with all 8 keys; non-English files use English text as placeholder
- FPB route: added `useTranslation` import; updated both `RichHelpTooltip` and `QuestionHelpTooltip` to read `t('tooltips.{key}.title')` / `t('tooltips.{key}.description')`; `QuestionHelpTooltip` conditionally skips title/visual when absent
- PPB route: added `useTranslation` import; updated `QuestionHelpTooltip` with same pattern
- ESLint: 0 errors on modified files

## Phases Checklist

- [x] Update `HELP_TOOLTIPS` interface — remove `title`/`description`, keep `visual`/`accessibilityLabel`; add `bundleVisibilityPending` key
- [x] Add `tooltips` section to `en.json` with all 8 tooltip strings
- [x] Add `tooltips` section to all 5 non-English locale files (English text as placeholder)
- [x] Update `RichHelpTooltip` in FPB route to use `useTranslation`
- [x] Update `QuestionHelpTooltip` in FPB route to use `useTranslation`
- [x] Update `QuestionHelpTooltip` in PPB route to use `useTranslation`
- [x] ESLint 0 errors
- [ ] E2E verify in Chrome
