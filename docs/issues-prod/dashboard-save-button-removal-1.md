# Issue: Dashboard Save Button Removal
**Issue ID:** dashboard-save-button-removal-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-06-03
**Last Updated:** 2026-06-03 23:52

## Overview
Remove the disabled Save button shown at the top of the Dashboard near the language dropdown.

## Progress Log
### 2026-06-03 23:49 - Started
- Confirmed scope is the Dashboard header UI.
- Impact: Dashboard route/header only; no route, modal, tab, or user-flow change expected.
- Next: remove the disabled Save control, update dashboard navigation documentation if needed, then lint modified files.

### 2026-06-03 23:52 - Completed
- Removed the Dashboard header language Save button from `app/routes/app/app.dashboard/route.tsx`.
- Kept language persistence by submitting the existing `saveAdminLocale` intent directly from the language selector change handler.
- Updated `docs/app-nav-map/APP_NAVIGATION_MAP.md`, `test-spec/admin-ui-i18n.spec.md`, and `tests/unit/i18n/admin-ui-i18n.test.ts` to reflect the buttonless language selector.
- Rebuilt graphify code graph via the documented virtualenv.
- Verified locale-specific assertions with `npx jest --runTestsByPath tests/unit/i18n/admin-ui-i18n.test.ts --runInBand --testNamePattern "dashboard save intent|language dropdown|dropdown change handler|save response"`.
- Ran `npx eslint --max-warnings 9999 app/routes/app/app.dashboard/route.tsx tests/unit/i18n/admin-ui-i18n.test.ts` with 0 errors and existing warnings only.
- Note: full `admin-ui-i18n.test.ts` still has an unrelated stale navigation expectation for `nav.designControlPanel` in the app shell.

## Related Documentation
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`

## Phases Checklist
- [x] Remove the Dashboard header Save button
- [x] Update docs that still describe the removed control
- [x] Run focused lint on modified files
