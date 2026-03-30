# SDE Implementation Plan: Full-Page Bundle Pre-Storefront Preview

_Derived from:_
- `docs/fpb-preview-before-storefront/00-BR.md`
- `docs/fpb-preview-before-storefront/02-PO-requirements.md`
- `docs/fpb-preview-before-storefront/03-architecture.md`

---

## Overview

This plan implements the pre-storefront preview feature for full-page bundles across 4 phases. Each phase writes tests first (Red), then implements (Green), then verifies no regressions.

**Files changed in total:**
- `prisma/schema.prisma` — 2 new nullable fields
- `app/services/widget-installation/types.ts` — extend `FullPageBundleResult`
- `app/services/widget-installation/widget-full-page-bundle.server.ts` — add `isPublished` param, 2 new exported functions
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — new handler + modified existing
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — new intent, new button, new fetcher branch

**Test files created:**
- `tests/unit/services/widget-full-page-bundle-preview.test.ts`
- `tests/unit/routes/fpb-configure-preview.test.ts`

---

## Test Plan

| Test File | Tests | Status |
|---|---|---|
| `tests/unit/services/widget-full-page-bundle-preview.test.ts` | `createFullPageBundle` draft mode; `publishPreviewPage` happy + errors; `getPreviewPageUrl` happy + page-not-found | Pending |
| `tests/unit/routes/fpb-configure-preview.test.ts` | `handleCreatePreviewPage` — fresh create, re-open, page-deleted recovery; `handleValidateWidgetPlacement` — draft-promotion path, fallback-to-create regression guard | Pending |

---

## Phase 1: Prisma Schema + Types

**Goal:** Add the two new nullable fields to the Bundle model and extend the service return type.

### Implementation

**Step 1.1:** Add fields to `prisma/schema.prisma`

```prisma
shopifyPreviewPageId     String?  // GID of draft preview page (cleared after publishing)
shopifyPreviewPageHandle String?  // Handle of draft preview page
```

Add after `shopifyPageId` line in the Bundle model.

**Step 1.2:** Run migration

```bash
npx prisma migrate dev --name add-bundle-preview-page-fields
```

**Step 1.3:** Add `shareablePreviewUrl` to `FullPageBundleResult` in `app/services/widget-installation/types.ts`

```typescript
shareablePreviewUrl?: string;  // Returned for draft pages; use instead of pageUrl
```

**No tests required for Phase 1** (schema and type changes, no logic).

---

## Phase 2: Service Layer — Draft Page Functions

**Goal:** Extend `createFullPageBundle()` to support draft creation and add two new functions.

### Tests (Red first)

**File:** `tests/unit/services/widget-full-page-bundle-preview.test.ts`

Test cases:
1. `createFullPageBundle` with `isPublished: false` — mutation called with `isPublished: false`, `shareablePreviewUrl` returned
2. `createFullPageBundle` with `isPublished: true` (default) — mutation called with `isPublished: true`, `pageUrl` returned, `shareablePreviewUrl` absent (regression guard)
3. `publishPreviewPage` happy path — `pageUpdate` mutation called with `isPublished: true`, success returned
4. `publishPreviewPage` with `userErrors` — returns `{ success: false, error }`
5. `publishPreviewPage` GraphQL throws — returns `{ success: false, error }`
6. `getPreviewPageUrl` happy path — query called, `shareablePreviewUrl` returned
7. `getPreviewPageUrl` page not found (null) — returns `{ success: false, pageNotFound: true }`

### Implementation

**File:** `app/services/widget-installation/widget-full-page-bundle.server.ts`

Changes:
- Add `isPublished?: boolean` (default `true`) parameter to `createFullPageBundle()`
- Modify `CREATE_PAGE` GraphQL to always query `shareablePreviewUrl` (it's null for published pages, non-null for drafts)
- Pass `isPublished` to the `pageCreate` variables
- In the return block: if `!isPublished`, populate `shareablePreviewUrl` from the response; otherwise use existing `pageUrl` construction
- Add `GET_PREVIEW_URL` GraphQL query string (const)
- Add `PUBLISH_PAGE` GraphQL mutation string (const)
- Export `getPreviewPageUrl(admin, pageId)` function
- Export `publishPreviewPage(admin, pageId)` function

---

## Phase 3: Handler Layer — New Handler + Modified Validate

**Goal:** Add `handleCreatePreviewPage()` and modify `handleValidateWidgetPlacement()`.

### Tests (Red first)

**File:** `tests/unit/routes/fpb-configure-preview.test.ts`

Test cases for `handleCreatePreviewPage`:
1. Bundle not found — returns 404
2. No existing draft (`shopifyPreviewPageId = null`) — calls `createFullPageBundle` with `isPublished: false`, writes preview fields to DB, returns `shareablePreviewUrl`
3. Existing draft (`shopifyPreviewPageId` set) — calls `getPreviewPageUrl`, does NOT call `createFullPageBundle`, returns `shareablePreviewUrl`
4. Existing draft but page deleted externally (`getPreviewPageUrl` returns `pageNotFound: true`) — clears preview fields in DB, calls `createFullPageBundle` to create fresh draft, writes new preview fields
5. `createFullPageBundle` fails — returns error, no DB write

Test cases for `handleValidateWidgetPlacement` (modified):
6. Bundle has `shopifyPreviewPageId` — calls `publishPreviewPage`, clears preview fields, sets `shopifyPageHandle`/`shopifyPageId`, does NOT call `createFullPageBundle`
7. `publishPreviewPage` fails (page deleted) — falls back to calling `createFullPageBundle` with `isPublished: true` (existing flow)
8. Bundle has no `shopifyPreviewPageId` — calls `createFullPageBundle` with `isPublished: true` (existing behaviour, regression guard)

### Implementation

**File:** `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

**New function `handleCreatePreviewPage(admin, session, bundleId)`:**

```typescript
export async function handleCreatePreviewPage(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string
) {
  // 1. Load bundle (with steps + pricing for metafield cache)
  // 2. If bundle.shopifyPreviewPageId:
  //    a. Call getPreviewPageUrl(admin, bundle.shopifyPreviewPageId)
  //    b. If found: return { success: true, shareablePreviewUrl }
  //    c. If pageNotFound: clear preview fields in DB, fall through
  // 3. Call createFullPageBundle(..., isPublished: false)
  //    title: "[Preview] {bundle.name}"
  // 4. writeBundleConfigPageMetafield (non-fatal)
  // 5. db.bundle.update: set shopifyPreviewPageId, shopifyPreviewPageHandle
  // 6. Return { success: true, shareablePreviewUrl: result.shareablePreviewUrl }
}
```

**Modified `handleValidateWidgetPlacement()`:**

At the top of the function body, after loading the bundle, add:

```typescript
// If a draft preview page exists, promote it to published
if (bundle.shopifyPreviewPageId) {
  const publishResult = await publishPreviewPage(admin, bundle.shopifyPreviewPageId);
  if (publishResult.success) {
    await db.bundle.update({
      where: { id: bundleId, shopId: session.shop },
      data: {
        shopifyPageHandle: bundle.shopifyPreviewPageHandle,
        shopifyPageId: bundle.shopifyPreviewPageId,
        shopifyPreviewPageId: null,
        shopifyPreviewPageHandle: null,
        status: BundleStatus.ACTIVE,
      },
    });
    // Write config metafield (non-fatal)
    await writeBundleConfigPageMetafield(admin, bundle.shopifyPreviewPageId, bundle);
    // ... handle shopifyProductId sync (same as existing code)
    return json({ success: true, pageHandle: bundle.shopifyPreviewPageHandle, ... });
  }
  // Promotion failed (page deleted externally) — fall through to create a new published page
  await db.bundle.update({
    where: { id: bundleId },
    data: { shopifyPreviewPageId: null, shopifyPreviewPageHandle: null },
  });
}
// ... existing creation flow unchanged
```

---

## Phase 4: Route Layer — Intent + Button + Fetcher Branch

**Goal:** Wire up the UI: new intent in action, Preview button in secondaryActions, fetcher data handler.

**No new tests** (UI/Polaris rendering excluded per TDD exceptions).

### Implementation

**File:** `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

**Step 4.1:** Add import for `handleCreatePreviewPage` in the imports section.

**Step 4.2:** Add `createPreviewPage` case to action switch:

```typescript
case "createPreviewPage":
  return await handleCreatePreviewPage(admin, session, bundleId);
```

**Step 4.3:** Add `handlePreviewBundle` callback alongside `handleAddToStorefront`:

```typescript
const handlePreviewBundle = useCallback(() => {
  const formData = new FormData();
  formData.append("intent", "createPreviewPage");
  fetcher.submit(formData, { method: "post" });
}, [fetcher]);
```

**Step 4.4:** Add new branch in fetcher data `useEffect` (after the `pageHandle` branch):

```typescript
else if ('shareablePreviewUrl' in result && result.shareablePreviewUrl) {
  shopify.toast.show("Opening preview in new tab…", { duration: 2000 });
  window.open(result.shareablePreviewUrl as string, '_blank');
  revalidator.revalidate();
}
```

**Step 4.5:** Update `secondaryActions` on the `<Page>` component:

```typescript
secondaryActions={[
  ...(!bundle.shopifyPageHandle
    ? [{
        content: "Preview on Storefront",
        icon: ViewIcon,
        onAction: () => { void handlePreviewBundle(); },
        loading: fetcher.state !== 'idle',
        disabled: fetcher.state !== 'idle',
      }]
    : []),
  {
    content: "Sync Bundle",
    icon: RefreshIcon,
    destructive: true,
    onAction: () => { ... }, // unchanged
  },
]}
```

---

## Build & Verification Checklist

- [ ] `npx prisma migrate dev --name add-bundle-preview-page-fields` — no errors
- [ ] All new tests pass: `npm run test:unit`
- [ ] No regressions: `npm test`
- [ ] TypeScript: `npm run typecheck` — zero new errors
- [ ] ESLint: `npx eslint --max-warnings 9999 <modified files>` — zero errors
- [ ] Widget bundles NOT modified — no rebuild needed
- [ ] Manual test: New bundle → "Preview on Storefront" button visible, click → draft page opens in new tab in real theme
- [ ] Manual test: Click "Preview" again → same URL opens, no new page in Shopify admin Pages list
- [ ] Manual test: Click "Add to Storefront" after preview → bundle promoted, "View on Storefront" shown, only ONE page in Shopify admin
- [ ] Manual test: Existing published bundle → no "Preview" button visible
- [ ] Manual test: Sync Bundle on existing bundle — unchanged behaviour

---

## Issue File

Create `docs/issues-prod/fpb-preview-before-storefront-1.md` before starting implementation.

## Commit Format

```
[fpb-preview-before-storefront-1] feat: Add pre-storefront preview for full-page bundles
```

Use per-phase commits as appropriate:
```
[fpb-preview-before-storefront-1] feat: Add shopifyPreviewPageId/Handle fields to Bundle model
[fpb-preview-before-storefront-1] feat: Add draft page creation and preview URL functions to service
[fpb-preview-before-storefront-1] feat: Add handleCreatePreviewPage handler and draft promotion to validateWidgetPlacement
[fpb-preview-before-storefront-1] feat: Wire Preview button and createPreviewPage intent in route
```

---

## Rollback Notes

If the feature needs to be rolled back:
1. Revert the four modified/created files
2. Run `npx prisma migrate dev` with a migration that drops the two new columns
3. The two new columns are nullable and not read by any existing code — a rollback leaves no orphaned data concerns
