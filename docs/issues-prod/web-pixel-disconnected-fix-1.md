# Issue: Web Pixel "Disconnected" Fix

**Issue ID:** web-pixel-disconnected-fix-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-11
**Last Updated:** 2026-03-13

## Overview
Web pixel extension shows as "Disconnected" in Settings → Customer Events despite
`shopify app deploy` being run multiple times.

## Root Causes (Two Separate Issues)

### 1. JSON.stringify bug (PRIMARY cause)
`webPixelCreate` and `webPixelUpdate` were passing settings as a JSON **string**:
```ts
// WRONG:
const pixelSettings = JSON.stringify({ app_server_url: appUrl });
webPixel: { settings: pixelSettings }  // settings = '{"app_server_url":"..."}'
```
Shopify's Admin API `WebPixelInput.settings` is a `JSON` scalar that expects a **plain object**
in GraphQL variables, not a stringified string. When a string is passed, Shopify validates it
against the TOML schema (which expects an object with `app_server_url`), the validation fails,
`userErrors` fires silently, and the pixel record is never created → stays "Disconnected".

Evidence from Shopify API reference examples:
```json
"variables": { "webPixel": { "settings": { "trackingId": "GA-TRACKING-ID-123" } } }
```
(plain object, not `JSON.stringify`)

### 2. Stale extension linkage (SECONDARY cause)
The original extension used `handle = "wolfpack-utm-pixel"` (CLI v2 format).
After regeneration it got `uid = "9c39afc7-..."` (CLI v3 format).
Any pixel record created before regeneration may be orphaned to the old extension.
Fix: always delete+recreate in afterAuth to freshly bind to the current deployed extension.

## Fix Applied

### `app/shopify.server.ts` (afterAuth hook)
- Removed `JSON.stringify` — now passes `{ app_server_url: appUrl }` plain object
- Changed strategy from "update-if-exists / create-if-not" to "delete-then-create"
  to eliminate stale extension linkage from old handle-based extension

### `app/routes/app/app.dashboard/route.tsx` (fire-and-forget)
- Removed `JSON.stringify` — now passes `{ app_server_url: appUrl }` plain object
- Added update-if-exists path (previously only created if missing)

## Progress Log

### 2026-03-11 - Fix applied
- ✅ Removed JSON.stringify from both afterAuth and dashboard loader
- ✅ afterAuth now deletes existing pixel then recreates (fresh extension bind)
- ✅ Dashboard fire-and-forget now updates settings if pixel exists
- Files: app/shopify.server.ts, app/routes/app/app.dashboard/route.tsx

### Root Cause 3: analytics=true + marketing=true blocks pixel on first visit

With both set to `true`, Shopify's pixel manager only loads the pixel after the visitor
explicitly consents to both analytics AND marketing purposes. UTM params are in the URL
on the VERY FIRST page view — before any consent banner interaction. Result: UTMs are
silently lost for every visitor who hasn't yet consented. The pixel shows "Connected" in
admin but never fires in practice for most visitors.

Fix: set both to `false` (strictly necessary / no consent required). Justified because:
- Reads URL params only (already public)
- Stores in sessionStorage (no third-party cookies)
- Sends only to merchant's own server at checkout

### Fix 3 applied: `extensions/wolfpack-utm-pixel/shopify.extension.toml`
- Changed `analytics = true` → `analytics = false`
- Changed `marketing = true` → `marketing = false`

### 2026-03-13 - Fix: Defensive error handling for "No web pixel was found"

- Root cause: `admin.graphql()` throws a `GraphqlQueryError` when Shopify returns `{"errors": [...]}` at the transport level. The `webPixel { id }` query returns a GraphQL execution error (not `null`) when no pixel exists yet (fresh install / extension not deployed). This error propagated to the outer catch and logged as "Failed to activate UTM pixel: No web pixel was found for this app."
- ✅ Wrapped `webPixel { id }` query in its own try-catch — treats "no pixel found" as no existing pixel to delete (safe to skip delete step)
- ✅ Wrapped `webPixelCreate` mutation in its own try-catch — treats "extension not deployed" error as a non-fatal warning instead of crashing
- Files: `app/shopify.server.ts`

## Next Steps
After deploying and reinstalling (or triggering afterAuth):
1. Run `shopify app deploy` (needed to push TOML privacy settings + extension code)
2. Reinstall the app on the test store (triggers afterAuth → delete+recreate pixel)
3. Check Settings → Customer Events — should show "Connected"
4. Verify pixel fires: visit a storefront URL with `?utm_source=test`, open DevTools Network tab, complete a test checkout, check for POST to `/apps/product-bundles/api/attribution`

Note: If using a development store, disable "Development store preview" in admin
settings — a known Shopify quirk where pixel code doesn't update to newly deployed
versions when preview mode is enabled.
