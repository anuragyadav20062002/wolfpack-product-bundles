# Issue: CORS Headers Missing on Error Paths — api/storefront-products

**Issue ID:** cors-storefront-products-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-19
**Last Updated:** 2026-04-19

## Overview

`api/storefront-products` is called cross-origin by the bundle widget (from `myshopify.com` to `onrender.com`). The success response path had `Access-Control-Allow-Origin: *` but all error response paths (400, 404, 500) were missing the header. When the server is cold-starting or the DB lookup fails transiently, it returns a CORS-less error response → browser blocks it → widget cannot load up-to-date variant data.

## Root Cause

`Access-Control-Allow-Origin: *` was only set in the success `json()` call. Eight early-return paths (missing ids, missing shop, no valid ids, no session, token creation failure, no storefront token, Storefront API failure, GraphQL errors, internal catch) returned without CORS headers.

## Progress Log

### 2026-04-19 - Fixed

- Extracted `CORS_HEADERS` constant at module level (includes `Allow-Origin`, `Allow-Methods`, `Allow-Headers`)
- Added `headers: CORS_HEADERS` to all error return paths (400, 404, 500)
- Spread `...CORS_HEADERS` into success response (replacing single inline `Access-Control-Allow-Origin`)
- Also hardened catch block: `error.message` → `error instanceof Error ? error.message : "Unknown error"`
- Files modified: `app/routes/api/api.storefront-products.tsx`

## Related Documentation
- `docs/ui-audit-26.05.md` — P0 Bug #1

## Phases Checklist
- [x] Add CORS headers to all error return paths
- [x] Lint — 0 errors
- [x] Commit
