# Issue: Secure Engagement Attribution Endpoint

**Issue ID:** attribution-engagement-security-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-06
**Last Updated:** 2026-06-06 17:32

## Overview

The storefront engagement write endpoint at `app/routes/api/api.attribution.engagement.tsx` is currently accepting unauthenticated requests from arbitrary origins and using permissive CORS headers. The endpoint also has no app-proxy signature verification, so unauthenticated actors can write arbitrary `BundleEngagement` rows.

This issue hardens the endpoint by adding app-proxy request verification, strict input validation, safer CORS behavior, and consistent logging/error handling.

Related user-reported symptom:
- Route module resolution error was reported in app logs (`Could not resolve module ID for /app/routes/app/app.attribution.tsx.bak`).
- Immediate security finding: CORS / unauthenticated write in `api.attribution.engagement.tsx`.

## Progress Log

### 2026-06-06 - In progress
- Created issue and set scope.
- Audit confirmed the endpoint has no app-proxy verification and permissive CORS.
- Plan to align with `api.bundle.$bundleId[.]json` and `api.cart-bundle-details` patterns for proxy-hardened public routes.
- Implemented route hardening for `api.attribution.engagement`:
  - Added app-proxy HMAC verification before any write.
  - Added strict payload validation and shopId/shop-domain cross-check.
  - Added explicit Origin-aware CORS headers and preflight handling on all responses.
  - Added focused unit tests for valid/invalid requests and preflight behavior.
- Added `vite` route ignore for `**/*.bak` in `vite.config.ts` to prevent stale/backup route module resolution errors.
- Next: run targeted lint/tests, then commit with issue-tagged message.

## Related Documentation
- `app/lib/app-proxy.server.ts`
- `app/routes/api/api.attribution.engagement.tsx`
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`
- `app/routes/api/api.cart-bundle-details.tsx`

## Phases Checklist

- [ ] Phase 1: Add app-proxy signature verification and strict input validation
- [x] Phase 1: Add app-proxy signature verification and strict input validation
- [x] Phase 2: Restrict CORS to request origin, keep preflight behavior
- [x] Phase 3: Update error handling to avoid leaking stack/details
- [x] Phase 4: Add focused unit tests for unsigned/signed request behavior and required fields
- [x] Phase 5: Run eslint + unit test for changed route and report results

### 2026-06-06 17:32 - Verification and validation
- Executed: `npx jest tests/unit/routes/api.attribution.engagement.test.ts --runInBand`
- Executed: `npx eslint --max-warnings 9999 app/routes/api/api.attribution.engagement.tsx tests/unit/routes/api.attribution.engagement.test.ts vite.config.ts`
- Result: tests passed, lint clean for errors (warnings only, no blocking issues).

### 2026-06-06 17:50 - Commit blocker noted
- Could not proceed with commit from this environment: write access to `.git` is blocked (`Operation not permitted` when creating `.git/index.lock`).
