# Architecture Decision Record: FPB Auto Widget Install

## Context
When a merchant clicks "Add to storefront" on the FPB configure page, the app must
install the bundle widget into the active Shopify theme without requiring the merchant
to interact with the Theme Editor.

## Constraints
- Must use existing authenticated admin session (embedded app request)
- Must call `ensureBundlePageTemplate()` from `widget-theme-template.server.ts` — already battle-tested for PDP bundles
- Must not break the existing product-page bundle flow
- `ensureBundlePageTemplate` requires `admin` (GraphQL client) + `session` (for REST headers) + `apiKey`

## Options Considered

### Option A: Reuse existing `api.ensure-product-template` route ❌
Update the placeholder route to actually call `ensureBundlePageTemplate`.
- Cons: Route is named for product templates; adding FPB logic makes it confusing. Route is already wired up in `handlePageSelection` for `isBundleContainer` path only, not the `isPage` path.
- Verdict: ❌ Rejected — better to keep routes focused

### Option B: New `POST /api/install-fpb-widget` route ✅
Dedicated route that calls `ensureBundlePageTemplate` and returns the result.
- `handlePageSelection` calls this for the `isPage` path instead of `window.open(themeEditorUrl)`
- Clean separation of concerns
- Verdict: ✅ Recommended

### Option C: Server action on existing configure route ❌
Add a new `intent` to the configure page's `action` handler.
- Cons: The configure route action is for saving bundle config; mixing widget install intent adds coupling. The fetcher would need to stay in scope while the user is still on the page.
- Verdict: ❌ Rejected

## Decision: Option B

## Data Model
No schema changes. Stateless operation — `ensureBundlePageTemplate` writes a theme asset.

## Files to Modify / Create

| File | Change |
|---|---|
| `app/routes/api/api.install-fpb-widget.tsx` | **Create** — POST handler calling `ensureBundlePageTemplate` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Update `handlePageSelection`: replace `window.open(themeEditorUrl)` with API call + copy updates |

## API Contract

**Request:** `POST /api/install-fpb-widget`
```json
{ "pageHandle": "fpb" }
```

**Response 200:**
```json
{
  "success": true,
  "templateCreated": true,
  "templateAlreadyExists": false
}
```

**Response 200 (idempotent):**
```json
{
  "success": true,
  "templateCreated": false,
  "templateAlreadyExists": true
}
```

**Response 500:**
```json
{ "success": false, "error": "Block UUID not found — ..." }
```

## Client-Side Flow (handlePageSelection)

```
1. setIsInstallingWidget(true)  ← disable button, show spinner
2. POST /api/install-fpb-widget { pageHandle }
3a. success → toast("Widget installed!") + show storefront link
3b. failure → toast("Couldn't auto-install — opening Theme Editor") + window.open(themeEditorUrl)
4. setIsInstallingWidget(false)
```

## Migration / Backward Compatibility
- `window.open(themeEditorUrl)` call is kept as the fallback path — no regression possible
- Existing product-page bundle flow (uses `isBundleContainer` path) is untouched

## Testing Strategy

### Test Files to Create
| Test File | Category | What It Covers |
|---|---|---|
| `tests/unit/routes/api.install-fpb-widget.test.ts` | Unit | Action: success path, already-exists path, missing apiKey, template write failure |

### Behaviors to Test
- Given valid session + template doesn't exist → returns `{ success: true, templateCreated: true }`
- Given valid session + template already exists → returns `{ success: true, templateAlreadyExists: true }`
- Given `resolveBlockUuid()` returns null → returns `{ success: false, error: "Block UUID not found" }`
- Given theme write throws → returns `{ success: false, error: "..." }`

### Mock Strategy
- Mock `ensureBundlePageTemplate` (the service is already tested separately)
- Mock `requireAdminSession`

### TDD Exceptions
- UI copy changes in route.tsx (Polaris rendering)
- Loading state UI
