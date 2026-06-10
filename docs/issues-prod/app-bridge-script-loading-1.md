# Issue: Load latest App Bridge as first script in document head
**Issue ID:** app-bridge-script-loading-1
**Status:** In Progress — implementation complete, awaiting manual verification
**Priority:** 🟡 Medium
**Created:** 2026-06-10
**Last Updated:** 2026-06-10

## Overview

Since 13 March 2024 Shopify mandates that every embedded app load the auto-updating App Bridge from `https://cdn.shopify.com/shopifycloud/app-bridge.js` as a static `<script>` tag in the document `<head>`, before any other `<script>` tag.

Today this app does not satisfy that rule:
- `app/root.tsx` has no App Bridge script tag in `<head>` — only Inter-font links, inline `<style>`, `<Meta />`, `<Links />`, then `<Scripts />` at the bottom of `<body>`.
- `app/routes/app/app.tsx:66` uses `<AppProvider isEmbeddedApp apiKey={apiKey}>` from `@shopify/shopify-app-remix/react` v3.8.5. That provider does inject a script tag at runtime, but as a React child inside `<body>` — not in `<head>`, and not guaranteed to render before Remix's hydration scripts.

This change emits the static App Bridge script (plus its `<meta name="shopify-api-key">` companion) as the first head children in `app/root.tsx`. `AppProvider` stays for Polaris/i18n; the duplicate script load is harmless (browser cache + idempotent init in the CDN script).

## Progress Log

### 2026-06-10 - Issue opened & implementation
- Created this issue file.
- Plan saved at `/Users/anuragyadav/.claude/plans/we-have-to-use-curious-stallman.md`.
- `app/root.tsx`: added root `loader` exposing `SHOPIFY_API_KEY`; inserted `<meta name="shopify-api-key">` + `<script src=".../app-bridge.js">` as the first scripts in `<head>` of both `App` (via `useLoaderData`) and `ErrorBoundary` (via `useRouteLoaderData("root")` with `""` fallback). Imports updated.
- `app/routes/app/app.tsx`: refreshed stale comment (App Bridge is now loaded from root, not by AppProvider). `<AppProvider isEmbeddedApp>` kept for Polaris/i18n; its runtime script injection coexists (duplicate request → browser cache hit; CDN script is idempotent).
- Lint: `npx eslint app/root.tsx app/routes/app/app.tsx` → 0 errors, 1 pre-existing warning on an untouched line.
- Note: declined SRI (`integrity=`/`crossorigin=`) on both Shopify CDN scripts because the unversioned URLs are auto-updating by design; pinning would break the app the moment Shopify rolls a new version.
- Next: manual DOM + smoke verification in admin per plan §Verification.

## Related Documentation
- Shopify docs: "App Bridge installation" — https://shopify.dev/docs/api/app-bridge-library
- Plan file: `/Users/anuragyadav/.claude/plans/we-have-to-use-curious-stallman.md`
- Affected files: `app/root.tsx`, `app/routes/app/app.tsx`

## Phases Checklist
- [x] Add root `loader` exposing `SHOPIFY_API_KEY` and inject `<meta>` + `<script>` at top of `<head>` in `App`
- [x] Mirror `<meta>` + `<script>` at top of `<head>` in `ErrorBoundary` (via `useRouteLoaderData("root")`)
- [x] Update stale comment in `app/routes/app/app.tsx:71`
- [x] Lint modified files
- [ ] Manual DOM + smoke verification in admin (`/app/dashboard`, configure pages, `/auth/login`)
