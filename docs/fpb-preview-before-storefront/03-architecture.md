# Architecture Decision Record: Full-Page Bundle Pre-Storefront Preview

_Derived from:_
- `docs/fpb-preview-before-storefront/00-BR.md`
- `docs/fpb-preview-before-storefront/02-PO-requirements.md`

---

## Context

Full-page bundles currently have no way to preview the storefront rendering before publishing. The existing `handleValidateWidgetPlacement` handler always creates a **published** Shopify page. We need to add a "Preview" path that creates a **draft** page first, then promotes it to published when the merchant is ready.

The Shopify Admin GraphQL API supports:
- `pageCreate(page: { isPublished: false })` → creates a draft page
- `page(id:) { shareablePreviewUrl }` → returns a link to preview a draft page without publishing it
- `pageUpdate(id:, page: { isPublished: true })` → promotes a draft to published

---

## Constraints

- Must not break existing bundles with `shopifyPageHandle` set — they must continue to work as-is.
- Per CLAUDE.md: no backwards-compat shims. New Prisma columns default to `null`; no data migration.
- Widget bundle JS must NOT be modified (no storefront JS changes needed).
- No Liquid extension file changes required — draft pages use the same `templateSuffix: "full-page-bundle"` and the same metafields.
- The metafield cache (`bundle_config`) must be written to the draft page for the preview to render correctly.

---

## Options Considered

### Option A: Add `isPublished` parameter to `createFullPageBundle()`

Extend the existing `createFullPageBundle()` function with an optional `isPublished` boolean parameter (default `true`). The function already handles the full creation flow; adding `isPublished: false` and querying `shareablePreviewUrl` in the return is a small delta.

**Pros:**
- Minimal new code; reuses existing service function.
- Single responsibility stays intact.
- Handler can call `createFullPageBundle(..., false)` for preview and `createFullPageBundle(..., true)` for publish.

**Cons:**
- The function currently always returns a `pageUrl` (constructed from `handle`); for draft pages it should return `shareablePreviewUrl` instead. This means the return type becomes context-dependent.
- Promotion (draft → published) is a separate operation not covered by this function; needs a separate `publishPreviewPage()` helper.

**Verdict:** ✅ Recommended (with the addition of a `publishPreviewPage()` helper).

---

### Option B: Create a Parallel `createDraftPreviewPage()` Service Function

Write a completely separate service function `createDraftPreviewPage()` that handles only draft creation, and a `publishPreviewPage()` function for promotion.

**Pros:**
- Cleaner separation of concerns — preview logic doesn't touch the published path.
- Return types are unambiguous per function.

**Cons:**
- Significant code duplication with `createFullPageBundle()` (template ensurement, handle resolution, metafield writes are identical).
- Two places to maintain when metafield structure changes.

**Verdict:** ❌ Rejected — duplication outweighs the clarity benefit given the small delta in Option A.

---

### Option C: Unified `manageFullPageBundle()` with an `action` enum

Replace `createFullPageBundle()` with a `manageFullPageBundle(action: 'create-draft' | 'publish-draft' | 'create-published')` function.

**Pros:**
- Single entry point for all page lifecycle actions.

**Cons:**
- Over-engineering for the current use case. The existing published-create flow is stable and well-tested. Merging all paths into one function introduces risk to the existing flow.

**Verdict:** ❌ Rejected — unnecessary abstraction.

---

## Decision: Option A — Extend `createFullPageBundle()` + Add `publishPreviewPage()`

### Rationale

Option A requires the fewest lines of new code, the least risk to the existing stable creation path, and maps cleanly to the three new GraphQL operations needed (`pageCreate` with `isPublished: false`, `page.shareablePreviewUrl` query, and `pageUpdate` for promotion).

---

## Data Model

### Prisma Schema Change

```prisma
model Bundle {
  // ... existing fields ...

  shopifyPageHandle     String?   // Shopify Page handle (published) — unchanged
  shopifyPageId         String?   // Shopify Page GID (published) — unchanged

  // NEW
  shopifyPreviewPageId      String?   // GID of draft preview page (null when not previewed or after publishing)
  shopifyPreviewPageHandle  String?   // Handle of draft preview page (for URL reference and cleanup)
}
```

**Migration:** Add two nullable `String?` columns with `null` defaults. No data migration.

### Service Layer Changes — `widget-full-page-bundle.server.ts`

```typescript
// Extended return type
export interface FullPageBundleResult {
  success: boolean;
  pageId?: string;
  pageHandle?: string;
  pageUrl?: string;                  // For published pages
  shareablePreviewUrl?: string;      // NEW: For draft pages
  widgetInstallationRequired?: boolean;
  widgetInstallationLink?: string;
  slugAdjusted?: boolean;
  error?: string;
  errorType?: 'page_creation_failed' | 'metafield_failed' | 'widget_not_installed' | 'unknown';
}

// Extended createFullPageBundle signature
export async function createFullPageBundle(
  admin: any,
  session: ShopSession,
  apiKey: string,
  bundleId: string,
  bundleName: string,
  desiredSlug?: string,
  isPublished?: boolean   // NEW optional param, defaults to true
): Promise<FullPageBundleResult>

// NEW function — promote draft to published
export async function publishPreviewPage(
  admin: any,
  pageId: string         // GID of the existing draft page
): Promise<{ success: boolean; error?: string }>

// NEW function — get shareablePreviewUrl for existing draft page
export async function getPreviewPageUrl(
  admin: any,
  pageId: string         // GID of the draft page
): Promise<{ success: boolean; shareablePreviewUrl?: string; error?: string; pageNotFound?: boolean }>
```

### GraphQL Additions

**Modified `CREATE_PAGE` mutation** — add `shareablePreviewUrl` to selection when `isPublished = false`:
```graphql
mutation createPage($page: PageCreateInput!) {
  pageCreate(page: $page) {
    page {
      id
      title
      handle
      templateSuffix
      shareablePreviewUrl  # NEW: queried for draft pages
    }
    userErrors { field message }
  }
}
```

**NEW query: `GET_PREVIEW_URL`** — fetch fresh `shareablePreviewUrl` for existing draft:
```graphql
query getPagePreviewUrl($id: ID!) {
  page(id: $id) {
    id
    shareablePreviewUrl
  }
}
```

**NEW mutation: `PUBLISH_PAGE`** — promote draft to published:
```graphql
mutation publishPage($id: ID!, $page: PageUpdateInput!) {
  pageUpdate(id: $id, page: $page) {
    page {
      id
      handle
      isPublished
    }
    userErrors { field message }
  }
}
```

---

## Handler Layer Changes — `handlers.server.ts`

### New handler: `handleCreatePreviewPage()`

```typescript
export async function handleCreatePreviewPage(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string
): Promise<Response>
```

Flow:
1. Load bundle from DB (with steps + pricing for metafield cache)
2. If `bundle.shopifyPreviewPageId` is set:
   - Call `getPreviewPageUrl(admin, bundle.shopifyPreviewPageId)`
   - If page found → return `{ success: true, shareablePreviewUrl }`
   - If page not found (deleted externally) → clear `shopifyPreviewPageId`/`shopifyPreviewPageHandle` in DB, fall through to creation
3. Call `createFullPageBundle(..., isPublished: false)` with title `"[Preview] {bundle.name}"`
4. Call `writeBundleConfigPageMetafield(admin, result.pageId, bundle)` (non-fatal)
5. Write `shopifyPreviewPageId` and `shopifyPreviewPageHandle` to DB
6. Return `{ success: true, shareablePreviewUrl: result.shareablePreviewUrl }`

### Modified handler: `handleValidateWidgetPlacement()`

Before calling `createFullPageBundle`, check for an existing draft page:

```typescript
// If preview page exists, promote it to published instead of creating new
if (bundle.shopifyPreviewPageId) {
  const publishResult = await publishPreviewPage(admin, bundle.shopifyPreviewPageId);
  if (publishResult.success) {
    // Use the existing handle, clear preview fields
    await db.bundle.update({ data: {
      shopifyPageHandle: bundle.shopifyPreviewPageHandle,
      shopifyPageId: bundle.shopifyPreviewPageId,
      shopifyPreviewPageId: null,
      shopifyPreviewPageHandle: null,
      status: BundleStatus.ACTIVE
    }});
    return json({ success: true, pageHandle: bundle.shopifyPreviewPageHandle, ... });
  }
  // If promote fails (page gone), fall through to normal creation
}
// ... existing create-published-page flow unchanged
```

---

## Route Layer Changes — `route.tsx`

### New intent in action switch

```typescript
case "createPreviewPage":
  return await handleCreatePreviewPage(admin, session, bundleId);
```

### New state variable

```typescript
const [isPreviewLoading, setIsPreviewLoading] = useState(false);
```

### New `handlePreviewBundle` callback

```typescript
const handlePreviewBundle = useCallback(() => {
  const formData = new FormData();
  formData.append("intent", "createPreviewPage");
  fetcher.submit(formData, { method: "post" });
}, [fetcher]);
```

### Updated `secondaryActions`

```typescript
secondaryActions={[
  // Only show Preview when not yet on storefront
  ...(!bundle.shopifyPageHandle ? [{
    content: "Preview on Storefront",
    icon: ViewIcon,
    onAction: () => { void handlePreviewBundle(); },
    loading: fetcher.state !== 'idle' && /* intent is preview */,
    disabled: fetcher.state !== 'idle',
  }] : []),
  {
    content: "Sync Bundle",
    icon: RefreshIcon,
    destructive: true,
    onAction: () => { ... },
  },
]}
```

### Updated fetcher data `useEffect`

Add a new branch to handle `createPreviewPage` response:

```typescript
else if ('shareablePreviewUrl' in result && result.shareablePreviewUrl) {
  // Preview page created or URL retrieved
  shopify.toast.show("Opening preview in new tab…", { duration: 2000 });
  window.open(result.shareablePreviewUrl, '_blank');
  revalidator.revalidate();  // Refresh to show updated shopifyPreviewPageId
}
```

---

## Files to Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `shopifyPreviewPageId String?` and `shopifyPreviewPageHandle String?` to Bundle model |
| `prisma/migrations/` | New auto-generated migration for the two new columns |
| `app/services/widget-installation/widget-full-page-bundle.server.ts` | Add `isPublished` param to `createFullPageBundle()`; add `shareablePreviewUrl` to CREATE_PAGE return; add `publishPreviewPage()`; add `getPreviewPageUrl()` |
| `app/services/widget-installation/types.ts` | Add `shareablePreviewUrl?: string` to `FullPageBundleResult` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Add `handleCreatePreviewPage()`; modify `handleValidateWidgetPlacement()` to promote draft if exists |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `createPreviewPage` intent to action; add Preview button to secondaryActions; add fetcher data handler branch |

---

## Migration / Backward Compatibility Strategy

Per CLAUDE.md "No Backwards Compatibility Rule":
- Two new nullable columns added with `null` defaults via Prisma migration.
- All existing bundles naturally have `shopifyPreviewPageId = null` and `shopifyPreviewPageHandle = null`.
- No code paths differ for `null` values vs. absent values — the `handleValidateWidgetPlacement` check `if (bundle.shopifyPreviewPageId)` is falsy for both.
- No shims, no fallbacks, no version detection.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|---|---|---|
| `tests/unit/services/widget-full-page-bundle-preview.test.ts` | Unit | `createFullPageBundle` with `isPublished: false`; `publishPreviewPage`; `getPreviewPageUrl` — including page-not-found fallback |
| `tests/unit/routes/fpb-configure-preview.test.ts` | Unit | `handleCreatePreviewPage` handler — happy path, draft-exists path, page-deleted-externally path; `handleValidateWidgetPlacement` — draft-promotion path, fallback-to-create path |

### Behaviors to Test

Derived from PO acceptance criteria:

**`createFullPageBundle` with `isPublished: false`:**
- Given `isPublished: false`, when called, then `pageCreate` mutation is called with `isPublished: false`
- Given `isPublished: false`, when page created, then `shareablePreviewUrl` is returned in result
- Given `isPublished: true` (default), when called, then existing behaviour is unchanged (regression guard)

**`publishPreviewPage()`:**
- Given a valid draft page GID, when called, then `pageUpdate` mutation fires with `isPublished: true`
- Given `pageUpdate` returns `userErrors`, then `success: false` is returned
- Given `pageUpdate` throws, then `success: false` is returned with error message

**`getPreviewPageUrl()`:**
- Given a valid draft page GID, when called, then `GET_PREVIEW_URL` query fires and `shareablePreviewUrl` is returned
- Given the page is not found (`page` returns null), then `{ success: false, pageNotFound: true }` is returned

**`handleCreatePreviewPage()`:**
- Given no existing draft page, when called, then `createFullPageBundle` is called with `isPublished: false` and result is saved to DB
- Given existing draft page (`shopifyPreviewPageId` set), when called, then `getPreviewPageUrl` is called (not `createFullPageBundle`)
- Given existing draft page but it was deleted externally (page returns null), when called, then draft fields are cleared and `createFullPageBundle` is called
- Given `createFullPageBundle` fails, when called, then error is returned and no DB write occurs

**`handleValidateWidgetPlacement()` (modified):**
- Given bundle has `shopifyPreviewPageId`, when called, then `publishPreviewPage` is called instead of `createFullPageBundle`
- Given `publishPreviewPage` succeeds, when called, then `shopifyPreviewPageId`/`shopifyPreviewPageHandle` are cleared and `shopifyPageHandle`/`shopifyPageId` are set
- Given bundle has no `shopifyPreviewPageId`, when called, then existing flow runs unchanged (regression guard)

### Mock Strategy

- **Mock:** `admin.graphql` (Shopify Admin API), `db` (Prisma client)
- **Do NOT mock:** `publishPreviewPage` or `getPreviewPageUrl` when testing `handleCreatePreviewPage` — test the full handler composition
- **Do NOT test:** Polaris UI rendering (React component for Preview button)

### TDD Exceptions (no tests required)

- Prisma migration file (auto-generated)
- `route.tsx` UI changes (Polaris component rendering)
- `secondaryActions` array changes (UI-only)
- Toast message copy changes

---

## Build & Verification Checklist

- [ ] `npx prisma migrate dev` runs without error
- [ ] TypeScript compiles without new errors (`npm run typecheck`)
- [ ] `npm test` — all new tests pass, no regressions
- [ ] ESLint zero errors on modified files (`npx eslint --max-warnings 9999 <files>`)
- [ ] Widget bundles NOT modified → no rebuild required
- [ ] Manual: Click "Preview" on a new bundle → draft page opens in new tab with real theme
- [ ] Manual: Click "Preview" again → same tab opens instantly (no new page created in Shopify admin)
- [ ] Manual: Click "Add to Storefront" after preview → draft promoted, "View on Storefront" shown
- [ ] Manual: Existing published bundle → no "Preview" button visible, "View on Storefront" unchanged
