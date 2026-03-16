# Issue: Full-Page Bundle Widget Not Rendering on Storefront

**Issue ID:** full-page-bundle-widget-not-rendering-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-13
**Last Updated:** 2026-03-13 14:00

## Overview

When a merchant creates a full-page bundle and clicks "Add to Storefront", the Shopify page is created but the widget never renders. The page only shows the bundle name as plain text. The root cause is that `createFullPageBundle()` creates the page without a custom template — the default `page.json` has no app block section, so the Liquid block (`bundle-full-page.liquid`) never loads.

## Root Cause

`widget-full-page-bundle.server.ts` creates the page with `{ title, handle, body: '', isPublished: true }` — no `templateSuffix`. The page uses the default `page.json` template which has no `apps` section containing the `bundle-full-page` app block.

## Solution

1. Create a new service `widget-theme-template.server.ts` that programmatically creates `templates/page.full-page-bundle.json` in the active theme via REST Asset API
2. The template includes an `apps` section with the `bundle-full-page` block
3. Set `templateSuffix: "full-page-bundle"` when creating/updating pages

## Progress Log

### 2026-03-13 12:00 - Planning Complete
- ✅ Analyzed the full rendering pipeline (Liquid → JS → API)
- ✅ Identified root cause: missing template + templateSuffix
- ✅ Confirmed REST Asset API pattern exists in codebase
- ✅ Created implementation plan
- Next: Begin Phase 1 - Create theme template service

### 2026-03-13 12:30 - Implementation Complete
- ✅ Created `app/services/widget-installation/widget-theme-template.server.ts` (new service)
  - `ensureBundlePageTemplate()` creates `page.full-page-bundle.json` in active theme
  - Block UUID discovery by scanning existing theme templates
  - Env var fallback: `SHOPIFY_BUNDLE_BLOCK_UUID`
  - Idempotent: skips if template already exists
- ✅ Modified `app/services/widget-installation/widget-full-page-bundle.server.ts`
  - Changed signature: accepts `session` instead of `shop` (needs `accessToken` for REST API)
  - Calls `ensureBundlePageTemplate()` before page creation
  - Adds `templateSuffix: "full-page-bundle"` to page creation
  - Updates existing pages with template suffix too
- ✅ Modified `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Updated call to pass `session` instead of `session.shop`
- ✅ Lint: zero errors
- Next: Commit and test

### 2026-03-13 13:00 - Theme editor fallback + custom metafield
- ✅ Added theme editor deep link fallback when block UUID not discoverable
- ✅ Added `ensureCustomPageBundleIdDefinition()` for `custom` namespace metafield
- ✅ Updated Liquid to use `page.metafields.custom.bundle_id` as primary source
- ✅ Set BOTH `custom:bundle_id` AND `$app:bundle_id` metafields on pages
- Result: Template renders block on dev store, but bundle ID still not resolving
- Commits: 8773b35, 1d55014, 994ea48

### 2026-03-13 14:00 - Phase 4: Diagnostic logging
- ⏳ Added comprehensive console.log OUTSIDE `{% if should_show_widget %}` gate
- Logs ALL 4 bundle ID sources + page handle + metafield namespaces
- Purpose: Determine exactly which Liquid values resolve and which are nil
- Modified: `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- Next: Deploy and check browser console for diagnostic output

## Phases Checklist
- [x] Phase 1: Create `widget-theme-template.server.ts` service ✅
- [x] Phase 2: Modify `widget-full-page-bundle.server.ts` to use template ✅
- [x] Phase 3: Update handler and types ✅
- [ ] Phase 4: Diagnostic logging (bundle ID resolution)
- [ ] Phase 5: Fix root cause based on diagnostics
- [ ] Phase 6: Testing & verification

## Related Documentation
- Plan: `.claude/plans/calm-chasing-penguin.md`
- Liquid block: `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- Page creation: `app/services/widget-installation/widget-full-page-bundle.server.ts`
- Handler: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
