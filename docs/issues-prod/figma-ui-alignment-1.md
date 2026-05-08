# Issue: Figma UI Alignment — Dashboard

**Issue ID:** figma-ui-alignment-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-08
**Last Updated:** 2026-05-08 19:12

## Overview

Verifying and aligning the app's Admin UI against Figma design images, page by page.
Starting with the Dashboard. Each design image is reviewed, gaps are identified, and
implementation is updated to match while keeping Polaris web components throughout.

## Phases Checklist
- [x] Phase 1 — Dashboard gap analysis
- [x] Phase 2 — Dashboard fixes (filter pills, button icon, language selector)
- [ ] Phase 3 — Next page (TBD by user)

## Progress Log

### 2026-05-08 19:12 - Dashboard gap analysis + fixes

**Gap analysis findings:**
- Language selector present in impl, absent in design → keep as extra feature, but fix broken event handler
- Filter dropdowns: design shows pill-style outlined buttons ("Status ▾", "Bundle type ▾"); impl uses `s-select` form controls → replace with `s-button + s-popover + s-choice-list`
- Create Bundle button: design shows no icon, impl has `icon="plus"` → remove icon
- Sync Collections icon: design shows refresh icon, impl uses `icon="refresh"` → already correct, no change

**Root cause of language selector bug:**
The `change` event handler was reading `(e as CustomEvent).detail?.value` first — Polaris web
components don't fire CustomEvents with a `detail` payload. The fallback `e.target.value` may
also be unreliable due to shadow DOM event re-targeting. Fixed to use `e.currentTarget.value`
which is always the `s-select` element the listener is attached to.

**Files changed:**
- `app/routes/app/app.dashboard/route.tsx`
- `app/routes/app/app.dashboard/dashboard.module.css`

**Next:** Continue with next Figma design image (Create Bundle wizard or Bundle Configure page)

## Related Documentation
- Figma designs provided incrementally by user in chat
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`
