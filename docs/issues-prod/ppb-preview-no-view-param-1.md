# Issue: PPB Preview Bundle should not append `?view=template-name`
**Issue ID:** ppb-preview-no-view-param-1
**Status:** In Progress — implementation complete, awaiting manual verification
**Priority:** 🟡 Medium
**Created:** 2026-06-10
**Last Updated:** 2026-06-10

## Overview

When merchants click **Preview Bundle** on the PPB configure page, the app currently appends `?view={templateName}` to the storefront URL (`app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx:1598-1601`). That makes the bundle render, but the merchant (and any link they share) ends up with an ugly query param in the URL.

The merchant's expectation:
> Regardless of whether the bundle is placed on the default product template (Preview Bundle path) or on a template the merchant explicitly chose (Place Widget path), the bundle should appear at the bare `/products/{handle}` URL. No `?view=` param.

**Constraint:** the bundle must still render on the *intended* template (whatever the merchant designed the layout for).

## Why this is fixable

Shopify only loads templates via `?view=X` *or* via the product's `template_suffix`. The Place Widget flow at `route.tsx:1914-1929` already calls `handleAssignProductTemplate` (`handlers/handlers.server.ts:2003`), which sets the product's `templateSuffix` via GraphQL `productUpdate`. After that mutation, the bare `/products/{handle}` URL loads the template that has the block — no `?view=` needed.

The Preview Bundle flow does *not* do this sync — it just appends `?view=`. The fix is to make Preview Bundle do the same `templateSuffix` sync the Place Widget flow already does.

## Plan

In `handlePreviewBundle` (`route.tsx:1558-1619`):

1. Open `about:blank` in a new tab **synchronously** from the click event (preserve the user-gesture so the browser doesn't block the popup after an async `fetch`).
2. If the chosen URL is a storefront URL (not the admin product page fallback), POST `intent=assignProductTemplate` with `templateSuffix={formState.templateName || ""}` to the current route — same handler the Place Widget flow uses. Empty string → handler treats as `null` (default template).
3. Navigate the new tab to the storefront URL **without** the `?view=` suffix (delete lines 1597-1601).
4. Keep the existing admin-product fallback path untouched.

No changes to the server-side handler — `handleAssignProductTemplate` already does exactly what's needed.

## Why no test coverage added

The change is a UI behaviour tweak inside a `useCallback` that wires `fetch` + `window.open` together — no clean seam to unit-test. The underlying server handler already exists and is exercised by the Place Widget flow, so its behaviour is implicit-tested. Verification is manual storefront load (DOM check) per `CLAUDE.md`.

## Progress Log

### 2026-06-10 - Issue opened
- Created this issue file.
- Diagnosis confirmed live on `wolfpackdemostore.myshopify.com` earlier this session: URL 1 (no param) loads template ID `20096915112124__main` with zero `#bundle-builder-app`; URL 2 (`?view=cart-transform`) loads template ID `20096915079356__main` with one. Product `template_suffix` is `null`.
- Next: implement the `templateSuffix` sync in `handlePreviewBundle`, drop the `?view=` append.

### 2026-06-10 - Implementation
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — rewrote `handlePreviewBundle` body (`enablePreviewGate.requestPreview(async () => { ... })`):
  - Open `about:blank` synchronously via `window.open(...)` before any async work so the popup keeps the user-gesture.
  - When the chosen URL is a storefront URL (not the admin fallback) and we know the Shopify product ID, `POST intent=assignProductTemplate` with `templateSuffix=(formState.templateName || "").trim()` to the current route. Empty value → handler sets suffix to `null` (default product template).
  - Navigate the new tab to `productUrl` (no `?view=` appended). Admin-fallback path is unchanged.
  - Best-effort: any thrown error from the sync is logged and ignored so preview still opens.
- Place Widget flow (`handlePageSelection`) is untouched — it already calls the same `assignProductTemplate` action.
- Lint (`npx eslint --max-warnings 9999 .../route.tsx`) → 0 errors, 791 pre-existing warnings (file is ~5700 LOC of legacy admin UI; no new warnings introduced).
- Next: manual storefront verification (Preview Bundle on a PPB → confirm bare URL renders the widget; URL bar contains no `?view=`).

## Related Documentation
- Plan file: `/Users/anuragyadav/.claude/plans/we-have-to-use-curious-stallman.md`
- PPB block (storefront): `extensions/bundle-builder/blocks/bundle-product-page.liquid`
- Server-side template-assign action: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts:2003`
- Place Widget flow (already syncs `templateSuffix`): `route.tsx:1886-1959`
- Preview gate hook: `app/hooks/useEnablePreviewGate.ts`

## Phases Checklist
- [x] Modify `handlePreviewBundle` to sync product `templateSuffix` and drop `?view=` append
- [x] Lint modified file (zero new errors)
- [ ] Manual verify on `wolfpackdemostore`: bare URL renders the bundle after clicking Preview Bundle once
- [ ] Confirm Place Widget flow still works (regression check)
