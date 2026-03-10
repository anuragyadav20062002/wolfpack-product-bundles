# Issue: Web Pixel "Disconnected" Fix

**Issue ID:** web-pixel-disconnected-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

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

## Next Steps
After deploying and reinstalling (or triggering afterAuth):
1. Run `shopify app deploy`
2. Reinstall the app on the test store (triggers afterAuth → delete+recreate pixel)
3. Check Settings → Customer Events — should show "Connected"
