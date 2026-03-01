# Issue: Refactor Routes Directory Organization

**Issue ID:** routes-directory-refactor-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 12:30

## Overview
Reorganize the flat `app/routes/` directory (~40 files) into category subdirectories (root, api, app, auth, assets, webhooks) and convert 4 hybrid routes into proper folder-per-route patterns. No business logic changes — purely structural refactoring.

## Progress Log

### 2026-02-16 12:00 - Starting Routes Directory Refactor
- Creating category subdirectories
- Updating routes.ts to use multiple flatRoutes() calls
- Moving all route files into appropriate categories
- Fixing import paths (../ → ../../)
- Converting hybrid routes to folder-per-route pattern

### 2026-02-16 12:30 - Completed All Phases
- ✅ Created 6 category directories: root/, api/, app/, auth/, assets/, webhooks/
- ✅ Updated app/routes.ts to use Promise.all with 6 flatRoutes() calls
- ✅ Moved 17 API routes to routes/api/
- ✅ Moved 5 webhook routes to routes/webhooks/
- ✅ Moved 7 asset routes to routes/assets/
- ✅ Moved 1 auth route to routes/auth/
- ✅ Moved 7 simple app routes to routes/app/
- ✅ Converted 4 hybrid routes (dashboard, design-control-panel, full-page-bundle, product-page-bundle) to folder-per-route pattern in routes/app/
- ✅ Moved auth.login/ to routes/auth/ and _index/ to routes/root/
- ✅ Updated all import paths to correct depth (../ → ../../ for simple routes, ../../../ for folder routes, ../../../../ for nested handler files)
- ✅ Verified all URL paths preserved via `npx remix routes`
- ✅ Verified TypeScript compilation (no new errors)
- ✅ Verified Remix build succeeds
- Files changed: app/routes.ts + all ~40 route files moved and imports updated

## Related Documentation
- Remix flat routes: https://remix.run/docs/en/v2/file-conventions/routes
- @remix-run/fs-routes flatRoutes API

## Phases Checklist
- [x] Phase 1: Create directories + update routes.ts
- [x] Phase 2: Move simple routes
- [x] Phase 3: Move hybrid routes (dashboard, design-control-panel, full-page, product-page)
- [x] Phase 4: Move folder routes (auth.login, _index)
- [x] Phase 5: Verify build and route paths
