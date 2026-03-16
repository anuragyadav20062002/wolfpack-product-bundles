# Architecture Decision Record: Custom Brandable URL Slugs for Full-Page Bundles

## Reference
- BR: `docs/custom-bundle-url-slugs/00-BR.md`
- PO: `docs/custom-bundle-url-slugs/02-PO-requirements.md`

---

## Context

Full-page bundles are placed on Shopify Pages. The page URL handle is currently auto-generated from the internal DB ID (`bundle-{mongoId}`), producing non-brandable, opaque URLs. We need to let merchants supply a custom slug before or after placement, while keeping the existing metafield-based bundle ID resolution intact.

---

## Constraints

- Must not break existing placed bundles (those with `bundle-{id}` handles continue to work — metafield is primary).
- Must work within the current stack: Remix + Prisma + Shopify Admin GraphQL + `useBundleForm` hook.
- No new Prisma migration if avoidable — prefer reusing existing `shopifyPageHandle` column.
- `pageUpdate` Admin GraphQL mutation is already present in the service — extend rather than rewrite.
- Bundle ID resolution in `bundle-full-page.liquid` is metafield-based; changing the page handle is safe.

---

## Options Considered

### Option A: New Prisma column `customPageSlug` (separate from `shopifyPageHandle`)

Store the merchant's desired slug in a NEW column. On placement, use it as the handle. `shopifyPageHandle` continues to mirror the live Shopify handle.

**Pros:**
- Clean separation of intent (desired slug) vs. reality (live handle including collision suffix).
- Easier to detect "merchant has set a custom slug" vs. "still using auto-default".

**Cons:**
- Requires a new DB migration.
- Two columns that must stay in sync after a rename.
- Over-engineered: the distinction between desired slug and live handle is only ever relevant in the moment of collision; the auto-suffix is surfaced as a notice, not stored separately.

**Verdict:** ❌ Rejected — adds migration complexity for minimal benefit.

---

### Option B: Reuse `shopifyPageHandle` as both the desired slug and the live handle (no new column)

Pre-fill the slug input from `shopifyPageHandle` (if already placed) or slugify the bundle name (if not yet placed). On save/placement, write the result back to `shopifyPageHandle`. The field continues to serve both as the merchant's choice and as the stored live handle.

**Pros:**
- Zero DB migration.
- Single source of truth: `shopifyPageHandle` always reflects the live page URL.
- Simple: one field, one place, one update path.

**Cons:**
- Cannot distinguish "merchant explicitly set this" from "auto-generated" — but this doesn't matter for any product behaviour.
- Collision suffix is applied server-side; the client shows a notice but the final handle (with suffix) is what gets persisted.

**Verdict:** ✅ **Recommended** — pragmatic, zero schema change, fully consistent with existing code.

---

### Option C: Read-only slug display + separate "rename" modal

Show the current handle read-only; provide a "Rename URL" button that opens a modal.

**Pros:** Less cognitive load for casual merchants.
**Cons:** Breaks normal Shopify mental model (all page settings are inline); adds modal complexity for no real gain.
**Verdict:** ❌ Rejected — over-complicated UX.

---

## Decision: Option B — Reuse `shopifyPageHandle`, no migration

---

## Architecture Overview

```
Configure Page (route.tsx)
  └─ useBundleForm (hook)          ← adds `pageSlug` + `setPageSlug` state
       └─ "Storefront Page" Card   ← new UI card with TextField + preview
            ├─ "Add to Storefront" action → handleValidateWidgetPlacement (passes slug)
            └─ "Save" action       → handleSaveBundleConfig (calls renamePageHandle if slug changed)

Service Layer
  ├─ createFullPageBundle()        ← accepts optional `desiredSlug` param; uses it as handle
  │     └─ resolveUniqueHandle()   ← new helper: checks uniqueness, appends suffix if taken
  └─ renamePageHandle()            ← new function: calls pageUpdate with new handle

Utilities
  └─ app/lib/slug-utils.ts         ← pure functions: slugify(), validateSlug(), resolveUniqueHandle()
```

---

## Data Model

**No Prisma schema change required.**

`shopifyPageHandle String?` on the `Bundle` model already stores the live page handle. It will continue to do so — the merchant-supplied slug becomes the handle value.

The only change is **when and how `shopifyPageHandle` is populated**:
- Previously: only on `validateWidgetPlacement`, always from the UUID-based formula.
- After: also editable from the form on Save, and defaults to slugified bundle name.

---

## New / Modified Files

| File | Change | Type |
|------|--------|------|
| `app/lib/slug-utils.ts` | **CREATE** — `slugify()`, `validateSlug()`, `resolveUniqueHandle()` pure functions | New utility |
| `app/hooks/useBundleForm.ts` | **MODIFY** — add `pageSlug`, `setPageSlug`, `hasManuallyEditedSlug` flag to state | Hook extension |
| `app/services/widget-installation/widget-full-page-bundle.server.ts` | **MODIFY** — `createFullPageBundle()` accepts optional `desiredSlug`; add `renamePageHandle()` function | Service extension |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | **MODIFY** — add "Storefront Page" card UI; pass `pageSlug` to placement/save actions | UI + action wiring |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | **MODIFY** — `handleValidateWidgetPlacement` accepts `desiredSlug`; new `handleRenamePageSlug` handler | Handler extension |

---

## Detailed Design

### `app/lib/slug-utils.ts`

```typescript
// Converts any string to a valid Shopify page handle
export function slugify(input: string): string

// Returns null if valid, or an error message string
export function validateSlug(slug: string): string | null

// Checks if handle is available (queries Shopify via admin), returns final handle
// (same as desired, or desired + numeric suffix if taken)
export async function resolveUniqueHandle(
  admin: any,
  desiredHandle: string,
  excludeCurrentHandle?: string   // skip the bundle's own current handle during rename
): Promise<{ handle: string; adjusted: boolean }>
```

**`slugify()` rules:**
1. Lowercase
2. Trim whitespace
3. Replace spaces and underscores with `-`
4. Strip all characters that are not `[a-z0-9-]`
5. Collapse consecutive `-` to single `-`
6. Strip leading/trailing `-`
7. Truncate to 255 characters

**`validateSlug()` rules:**
- Not empty
- Max 255 chars
- Matches `/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/` (only alphanumeric + internal hyphens)

**`resolveUniqueHandle()` algorithm:**
```
1. Query: pages(first: 1, query: "handle:{desiredHandle}")
2. If no match → return { handle: desiredHandle, adjusted: false }
3. If match AND match.handle === excludeCurrentHandle → return { handle: desiredHandle, adjusted: false }
4. Try desiredHandle-2, desiredHandle-3, ... up to desiredHandle-10
5. Return first available
```

---

### `app/hooks/useBundleForm.ts` additions

```typescript
// New initial data field
interface BundleFormData {
  // ... existing fields ...
  pageSlug: string  // pre-filled from shopifyPageHandle or slugify(name)
}

// New state
const [pageSlug, setPageSlugRaw] = useState(initialData.pageSlug)
const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(
  // true if the stored handle does NOT equal slugify(bundleName)
  // i.e. merchant has previously customised it
  initialData.pageSlug !== slugify(initialData.name)
)

// When bundleName changes and merchant has NOT manually edited slug:
// auto-update pageSlug = slugify(newBundleName)
// (implemented via useEffect in the hook)

const setPageSlug = useCallback((value: string) => {
  setPageSlugRaw(value)
  setHasManuallyEditedSlug(true)  // any manual edit locks the slug
  onStateChange?.()
}, [onStateChange])
```

---

### `widget-full-page-bundle.server.ts` changes

**Modified `createFullPageBundle()` signature:**
```typescript
export async function createFullPageBundle(
  admin: any,
  session: ShopSession,
  apiKey: string,
  bundleId: string,
  bundleName: string,
  desiredSlug?: string  // NEW: optional custom slug; falls back to slugify(bundleName)
): Promise<FullPageBundleResult>
```

**Slug resolution inside `createFullPageBundle()`:**
```typescript
const rawSlug = desiredSlug?.trim() || slugify(bundleName) || `bundle-${bundleId}`
const { handle: pageHandle, adjusted } = await resolveUniqueHandle(admin, rawSlug)
// If adjusted === true, result will include a `slugAdjusted: true` flag
// and `suggestedHandle: pageHandle` so the caller can surface the notice
```

**New `renamePageHandle()` function:**
```typescript
export async function renamePageHandle(
  admin: any,
  pageId: string,           // Shopify GID of the page
  desiredSlug: string,
  currentSlug: string       // to skip self in uniqueness check
): Promise<{ success: boolean; newHandle?: string; adjusted?: boolean; error?: string }>
```

---

### Handler changes — `handlers.server.ts`

**Modified `handleValidateWidgetPlacement()`:**
```typescript
export async function handleValidateWidgetPlacement(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  desiredSlug?: string    // NEW param, passed from form
)
```
Passes `desiredSlug` through to `createFullPageBundle()`. If `result.slugAdjusted` is true, includes `slugAdjusted` and `finalHandle` in the JSON response so the UI can surface the notice.

**New `handleRenamePageSlug()` handler:**
```typescript
export async function handleRenamePageSlug(
  admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  newSlug: string
)
```
Called when the main Save action detects `pageSlug !== bundle.shopifyPageHandle`. Calls `renamePageHandle()`, updates DB on success.

---

### Route changes — `route.tsx`

**New action intent:** `"renamePageSlug"` — triggers `handleRenamePageSlug`.

**Pass `pageSlug` to existing `"validateWidgetPlacement"` intent** via form data.

**New "Storefront Page" Card** (rendered only for `bundle.bundleType === 'full_page'`):
- `TextField` with `prefix` and `helpText` showing live URL preview
- `InlineStack` with "View on Storefront" button (moved from current position)
- Inline error from slug `validateSlug()`

**Wire slug into main Save handler** — if bundle is placed and `pageSlug !== bundle.shopifyPageHandle`, include `renamePageSlug` intent alongside the normal save.

---

## Backward Compatibility Strategy

| Scenario | Behaviour |
|----------|-----------|
| Existing bundle with `shopifyPageHandle = "bundle-clxyabc123"` | Configure page pre-fills slug input with `"bundle-clxyabc123"`. Merchant can leave as-is or rename. No automatic change. |
| `bundle-{id}` handle extraction fallback in Liquid | Remains in place as dead code for old bundles. For new custom slugs (e.g., `my-kit`), the extraction returns `my-kit` (handle minus `bundle-` which doesn't match) → falls through to metafield (correct). No breakage. |
| Existing bundles with `shopifyPageHandle = null` (not yet placed) | Slug input pre-fills with `slugify(bundleName)`. |

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/lib/slug-utils.test.ts` | Unit | `slugify()`, `validateSlug()`, `resolveUniqueHandle()` |
| `tests/unit/services/widget-full-page-bundle.test.ts` | Unit | `createFullPageBundle()` with custom slug; `renamePageHandle()` success/fail; collision suffix logic |
| `tests/unit/routes/full-page-bundle-slug.test.ts` | Unit | `handleValidateWidgetPlacement` with desiredSlug; `handleRenamePageSlug` happy path + pageUpdate failure |

### Behaviours to Test (from PO acceptance criteria)

**slug-utils.test.ts:**
- `slugify("Build Your Own Kit")` → `"build-your-own-kit"`
- `slugify("SUMMER SALE 2024!")` → `"summer-sale-2024"`
- `slugify("  --hello--  ")` → `"hello"`
- `slugify("")` → `""` (returns empty, caller handles empty case)
- `validateSlug("build-your-own-kit")` → `null` (valid)
- `validateSlug("")` → error message
- `validateSlug("A_B")` → error message (uppercase, underscore)
- `validateSlug("-leading")` → error message
- `validateSlug("a".repeat(256))` → error message (too long)
- `resolveUniqueHandle(admin, "my-kit")` when handle free → `{ handle: "my-kit", adjusted: false }`
- `resolveUniqueHandle(admin, "my-kit")` when handle taken → `{ handle: "my-kit-2", adjusted: true }`
- `resolveUniqueHandle(admin, "my-kit", "my-kit")` (rename to same) → `{ handle: "my-kit", adjusted: false }`

**widget-full-page-bundle.test.ts:**
- `createFullPageBundle(admin, session, apiKey, id, "Kit", "my-kit")` → page created with handle `"my-kit"`
- `createFullPageBundle(admin, session, apiKey, id, "Kit", undefined)` → page created with handle `"kit"` (slugify(name) fallback)
- `createFullPageBundle` when `resolveUniqueHandle` adjusts → `result.slugAdjusted === true`, `result.pageHandle === "my-kit-2"`
- `renamePageHandle(admin, pageId, "new-slug", "old-slug")` → calls `pageUpdate` with `handle: "new-slug"`; returns `{ success: true, newHandle: "new-slug" }`
- `renamePageHandle` when `pageUpdate` returns userErrors → returns `{ success: false, error: "..." }`

**full-page-bundle-slug.test.ts:**
- `handleValidateWidgetPlacement(admin, session, id, "custom-slug")` → passes `"custom-slug"` to `createFullPageBundle`; DB updated with returned handle
- `handleRenamePageSlug(admin, session, id, "new-slug")` → bundle has `shopifyPageId`; calls `renamePageHandle`; DB updated on success
- `handleRenamePageSlug` when bundle not found → 404
- `handleRenamePageSlug` when `renamePageHandle` fails → 400 with error message, DB NOT updated

### Mock Strategy
- **Mock:** Prisma `db.bundle.findUnique`, `db.bundle.update`; Shopify `admin.graphql` calls
- **Do NOT mock:** `slugify()`, `validateSlug()` — pure functions, test directly
- **Do NOT test:** Polaris TextField rendering, React hook state updates
