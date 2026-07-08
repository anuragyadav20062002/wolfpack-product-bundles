# EB-Style Save And Preview Flow Plan

## Summary
- Match EB's observable contract: no queue-based save or preview path, no polling, no `queued/syncing/attemptId/stats` response data.
- Make Save, Sync Product, Sync Bundle, and Preview direct server actions that finish the required Shopify work before returning.
- Keep API responses compact and UI feedback EB-like: one success toast on save/sync, preview button spinner while the preview request runs, error toast on failure.

## Key Changes
- Replace configure-save queue behavior with direct synchronous publishing:
  - `saveBundle` persists DB state, writes required Shopify storefront/cart-transform assets immediately, then returns.
  - If Shopify publishing fails, return a compact failure response so the UI shows an error toast.
  - Remove `enqueueBundleStorefrontSync` from FPB/PPB save handlers.
- Replace preview readiness polling with one EB-style preview action:
  - Add a compact server preview endpoint.
  - It ensures the current bundle is published synchronously and returns `{ success, statusCode, ready, message? }`.
  - Remove `awaitStorefrontSyncReady`, bounded DB polling, hardcoded wait attempts, and client-side status checks.
- Slim response contracts:
  - `saveBundle`: `{ success: true, statusCode: 200, message: "Updated Successfully!", bundle: <minimal handles/id/status only> }`
  - `syncProduct`: `{ success: true, statusCode: 200, message: "Updated Successfully!", productId, productHandle? }`
  - `/prepare-preview`: `{ success: true, statusCode: 200, ready: true, message: "success" }`
  - Error responses stay compact: `{ success: false, statusCode, error }`
- Update UI behavior:
  - Remove "Storefront sync queued" and similar queue/status UI.
  - Remove secondary queue info toasts.
  - Keep the Preview Bundle button as the retry surface.

## Test Plan
- Add/update `test-spec/eb-style-save-preview-flow.spec.md` before code changes.
- Unit-test direct sync service, compact route actions, compact save responses, compact sync-product responses, and the preview client helper.
- Run focused Jest suites, ESLint on touched files, and `npm run graphify:rebuild`.

## Assumptions
- EB parity wins over the earlier async queue design.
- Configure Save, Sync Product, Sync Bundle, and Preview should be queue-free.
- No backwards-compatible status polling fallback will be kept.
- No `shopify app deploy` will be run automatically.
