# Architecture Decision Record: Analytics Pixel Toggle

## Context

The analytics page (`app/routes/app/app.attribution.tsx`) is currently a read-only Remix route — loader only, no action handler. We need to:
1. Query live pixel status from Shopify Admin API in the loader
2. Add an action handler that enables or disables the pixel
3. Add a status card + toggle UI at the top of the page
4. Add a `deactivateUtmPixel()` service function alongside the existing `activateUtmPixel()`
5. Remove the automatic `activateUtmPixel()` call from `afterAuth` in `shopify.server.ts`

## Constraints

- Must not break existing analytics data display
- No new DB columns — pixel state read directly from Shopify API
- Toggle must be non-blocking (no full page reload) — use `useFetcher`
- Toast notifications via `shopify.toast.show()` (App Bridge pattern, consistent with existing routes)
- Must work with `authenticate.admin(request)` already used in the loader (not `requireAdminSession`)

## Options Considered

### Option A: Separate API route (`/api/toggle-pixel`) + fetcher pointing to it

Add a new `api.toggle-pixel.tsx` route with `action`. The analytics page fetcher posts to `/api/toggle-pixel?shop=...`.

- **Pros:** Keeps analytics route focused; reusable from other pages.
- **Cons:** Requires passing shop context via URL or body; `useFetcher` pointing to a different route needs explicit `action` URL; harder to type-check response shape shared across routes.
- **Verdict:** ❌ Rejected — unnecessary complexity for a single-consumer action.

### Option B: Action handler on the analytics route itself

Add `export async function action()` directly to `app.attribution.tsx`. The fetcher submits to the same route (default behaviour when `action` is omitted from `fetcher.submit`).

- **Pros:** Collocated with the UI; loader data and action response share the same route type; simplest wiring.
- **Cons:** Analytics route grows slightly; but the action is small (~20 lines).
- **Verdict:** ✅ Recommended — matches existing patterns (e.g., design-control-panel, billing route).

### Option C: Remix resource route + SWR-style polling for status

Separate route for status polling, toggle via action.

- **Pros:** Real-time status updates if pixel gets disconnected externally.
- **Cons:** Over-engineered for the use-case; polling adds unnecessary API calls.
- **Verdict:** ❌ Rejected — status on load is sufficient.

## Decision: Option B — Action handler on the analytics route

Rationale: Keeps all pixel-toggle concerns in one file, matches the established Remix pattern for this codebase, and requires the least new surface area.

## Data Flow

```
Loader (server):
  authenticate.admin(request)
  → admin.graphql(`query { webPixel { id } }`)
  → pixelActive: boolean, pixelId: string | null
  → returned as part of loaderData

Component (client):
  useLoaderData() → pixelActive (initial state)
  useFetcher<typeof action>() → for non-blocking enable/disable
  useEffect([fetcher.data]) → shopify.toast.show() on result

Action (server):
  intent = "enable" | "disable"
  "enable"  → activateUtmPixel(admin, appUrl)
  "disable" → deactivateUtmPixel(admin)
  → returns { success, pixelActive, message, error?, errorCode? }
```

## Service Layer Changes

### New: `deactivateUtmPixel(admin)` in `pixel-activation.server.ts`

```typescript
export interface PixelDeactivationResult {
  success: boolean;
  error?: string;
}

export async function deactivateUtmPixel(admin: any): Promise<PixelDeactivationResult>
// Queries webPixel { id }, deletes it if present.
// If no pixel exists, returns success: true (already inactive).
```

### New: `getPixelStatus(admin)` in `pixel-activation.server.ts`

```typescript
export interface PixelStatus {
  active: boolean;
  pixelId: string | null;
}

export async function getPixelStatus(admin: any): Promise<PixelStatus>
// Queries webPixel { id }. Returns active:false on error (treat as inactive).
```

### Changed: `shopify.server.ts` — remove `activateUtmPixel()` from `afterAuth`

The pixel must no longer be auto-activated. The afterAuth call is deleted.

## Files to Modify

| File | Change |
|------|--------|
| `app/services/pixel-activation.server.ts` | Add `getPixelStatus()` and `deactivateUtmPixel()` |
| `app/routes/app/app.attribution.tsx` | Add pixel status to loader; add `action` handler; add status card UI |
| `app/shopify.server.ts` | Remove `activateUtmPixel()` call from `afterAuth` |

## Action Response Shape

```typescript
type ToggleActionResult =
  | { success: true;  pixelActive: boolean; message: string }
  | { success: false; pixelActive: boolean; error: string; errorCode?: string }
```

`pixelActive` reflects the **new** state after the action so the component can update the toggle without re-fetching.

## Component State Machine

```
initialPixelActive (from loaderData)
       │
       ▼
[idle]  toggle clicked
       │
       ▼
[submitting] — button disabled, loading spinner
       │
       ▼
fetcher.data received
       ├─ success: true  → pixelActive = fetcher.data.pixelActive
       │                 → shopify.toast.show(message)
       └─ success: false → pixelActive unchanged
                        → shopify.toast.show(error, { isError: true })
```

The component tracks `pixelActive` in local state (initially from loader), updated only on successful action response. On failure the local state stays unchanged (toggle bounces back).

## Migration / Backward Compatibility Strategy

- Shops with an existing active pixel: loader returns `pixelActive: true` → toggle shows ON. No action needed.
- Shops where pixel was never created: loader's `webPixel` query throws/returns null → `pixelActive: false` → toggle shows OFF. Correct.
- Removing auto-activation from `afterAuth`: safe — active pixels persisted in Shopify are not affected.

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/services/pixel-activation.test.ts` | Unit | `getPixelStatus`, `deactivateUtmPixel`, `activateUtmPixel` with mocked admin |
| `tests/unit/routes/app.attribution.action.test.ts` | Unit | Action handler: enable/disable intents, error paths |

### Behaviors to Test

**`getPixelStatus(admin)`:**
- Returns `{ active: true, pixelId: "gid://..." }` when pixel exists
- Returns `{ active: false, pixelId: null }` when Shopify throws (no pixel)
- Returns `{ active: false, pixelId: null }` when query returns null data

**`deactivateUtmPixel(admin)`:**
- Returns `{ success: true }` when pixel found and deleted
- Returns `{ success: true }` when no pixel exists (already inactive)
- Returns `{ success: false, error }` when delete mutation returns userErrors

**Action handler — enable intent:**
- Returns `{ success: true, pixelActive: true, message }` on activation success
- Returns `{ success: false, pixelActive: false, error, errorCode: "EXTENSION_NOT_DEPLOYED" }` when Shopify returns extension error
- Returns `{ success: false, pixelActive: false, error }` on unknown failure

**Action handler — disable intent:**
- Returns `{ success: true, pixelActive: false, message }` on deactivation success
- Returns `{ success: false, pixelActive: true, error }` on failure

### Mock Strategy
- Mock `admin.graphql()` to return controlled responses
- Mock `process.env.SHOPIFY_APP_URL`
- Do NOT test Polaris UI rendering

### TDD Exceptions
- CSS/style changes on the analytics page
- Polaris component layout in the status card
