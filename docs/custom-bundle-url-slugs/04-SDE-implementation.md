# SDE Implementation Plan: Custom Brandable URL Slugs for Full-Page Bundles

## Overview

Implements merchant-editable URL slugs for full-page bundle pages. No DB migration needed — `shopifyPageHandle` already exists on the `Bundle` model. Adds `app/lib/slug-utils.ts`, extends the service/handler layer, and adds a "Storefront Page" card to the configure route.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/slug-utils.test.ts` | `slugify()`, `validateSlug()`, `resolveUniqueHandle()` | Pending |
| `tests/unit/services/widget-full-page-bundle.test.ts` | `createFullPageBundle()` with slug, `renamePageHandle()` | Pending |
| `tests/unit/routes/full-page-bundle-slug.test.ts` | `handleValidateWidgetPlacement` with slug, `handleRenamePageSlug` | Pending |

---

## Phase 1: slug-utils.ts

**Tests (Red):** `tests/unit/lib/slug-utils.test.ts`
- slugify: normal input, special chars, consecutive hyphens, empty string, truncation
- validateSlug: valid, empty, too long, uppercase, leading hyphen
- resolveUniqueHandle: free handle, taken handle (suffix), rename to same (exclude self)

**Implementation (Green):** `app/lib/slug-utils.ts`
- `slugify(input: string): string`
- `validateSlug(slug: string): string | null`
- `resolveUniqueHandle(admin, desiredHandle, excludeCurrentHandle?): Promise<{handle, adjusted}>`

---

## Phase 2: Service Layer

**Tests (Red):** `tests/unit/services/widget-full-page-bundle.test.ts`
- `createFullPageBundle` with `desiredSlug` → page created with that handle
- `createFullPageBundle` without `desiredSlug` → falls back to `slugify(bundleName)`
- `createFullPageBundle` when handle taken → `slugAdjusted: true` in result
- `renamePageHandle` success → returns `{ success: true, newHandle }`
- `renamePageHandle` pageUpdate userErrors → returns `{ success: false, error }`

**Implementation (Green):**
- `app/services/widget-installation/types.ts` — add `slugAdjusted?`, `suggestedHandle?` to `FullPageBundleResult`
- `app/services/widget-installation/widget-full-page-bundle.server.ts` — add `desiredSlug?` param, `renamePageHandle()`

---

## Phase 3: Handler Layer

**Tests (Red):** `tests/unit/routes/full-page-bundle-slug.test.ts`
- `handleValidateWidgetPlacement` with `desiredSlug` → passes to service, DB updated
- `handleRenamePageSlug` happy path → calls `renamePageHandle`, DB updated
- `handleRenamePageSlug` bundle not found → 404
- `handleRenamePageSlug` service failure → 400, DB NOT updated

**Implementation (Green):**
- Modify `handleValidateWidgetPlacement` to accept optional `desiredSlug`
- Add `handleRenamePageSlug` to handlers.server.ts

---

## Phase 4: UI Layer (no TDD)

**Implementation:**
- `app/hooks/useBundleForm.ts` — add `pageSlug`, `setPageSlug`, `hasManuallyEditedSlug`
- `app/routes/.../route.tsx` — add "Storefront Page" card, wire slug into actions

---

## Phase 5: Verification

- [ ] `npm test` — all new tests pass, no regressions
- [ ] `npx eslint --max-warnings 9999` on modified files — 0 errors
- [ ] Commit with `[custom-bundle-url-slugs-1]` prefix

## Rollback Notes

All changes are additive — the new `desiredSlug` param is optional and defaults to `slugify(bundleName)`, so existing callers are unaffected. `shopifyPageHandle` was already stored; the only behaviour change is _what value_ it receives.
