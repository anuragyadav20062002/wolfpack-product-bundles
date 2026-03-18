# Issue: PDP Widget — Theme Template Write Fails with 404

**Issue ID:** pdp-widget-template-write-failure-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 00:45

## Overview
`ensureProductBundleTemplate` fails with `404 {"errors":"Not Found"}` when trying to write
`templates/product.product-page-bundle.json` via the Shopify REST Assets API.

Root cause: the app is configured with `removeRest: true` and `unstable_newEmbeddedAuthStrategy: true`
in `shopify.server.ts`. Under the new embedded auth strategy, `session.accessToken` may not be
populated (or may be a short-lived token that differs from the offline token). REST API calls using
`X-Shopify-Access-Token: ""` return 404 "Not Found" on the themes/assets endpoint.

The `admin.graphql()` client — already used for `getActiveThemeId()` — always works correctly
because it handles token refresh internally. Fix: replace all REST `fetch()` calls in
`widget-theme-template.server.ts` with Admin GraphQL API mutations/queries.

## Progress Log

### 2026-03-20 00:30 - Starting fix
- Root cause identified: `removeRest: true` + new embedded auth strategy = session.accessToken unavailable
- Fix: switch `themeAssetExists`, `readThemeAsset`, and `writeThemeAsset` to use `admin.graphql`
  - Check existence: `theme { files(filenames: ...) { nodes { filename } } }`
  - Read content: same query with body `... on OnlineStoreThemeFileBodyText { content }`
  - Write: `themeFilesUpsert(themeId, files: [{ filename, body: { asString: ... } }])`
- No change to function signatures (admin already a param)
- `session` param kept for shop-name in logs only

### 2026-03-20 00:45 - Completed
- Replaced all REST `fetch()` calls with `admin.graphql()` mutations/queries:
  - `getActiveThemeGid` — returns full GID (was: numeric ID only)
  - `themeAssetExists` — `theme { files(filenames) { nodes { filename } } }` query
  - `readThemeAsset` — same query with `body { ... on OnlineStoreThemeFileBodyText { content } }`
  - `writeThemeAsset` — `themeFilesUpsert` mutation with `{ filename, body: { asString } }`
  - `readBasePageTemplate` / `readBaseProductTemplate` — use new `readThemeAsset`
- Removed `SHOPIFY_REST_API_VERSION` import (no longer needed)
- `session` param kept in public signatures for backward compat (unused internally)
- Files: `app/services/widget-installation/widget-theme-template.server.ts`

## Phases Checklist
- [x] Phase 1: Refactor `widget-theme-template.server.ts` to use Admin GraphQL
- [x] Phase 2: Lint + test, commit
