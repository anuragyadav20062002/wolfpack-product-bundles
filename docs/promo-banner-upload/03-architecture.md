# Architecture Decision Record: Image Upload in Promo Banner File Picker

**Feature ID:** promo-banner-upload
**Created:** 2026-02-20
**Input:** docs/promo-banner-upload/00-BR.md + docs/promo-banner-upload/02-PO-requirements.md
**Status:** Architecture Complete → Handoff to SDE

---

## Context

The `FilePicker` modal (`app/components/design-control-panel/settings/FilePicker.tsx`)
currently browses Shopify Content → Files via the `app.store-files` loader. Merchants
need to be able to upload a new image from inside the same modal without leaving the DCP.

The upload pipeline requires three Shopify Admin GraphQL steps — all server-side because:
- `X-Shopify-Access-Token` must never be exposed to the browser.
- The Shopify staged upload endpoint has no CORS headers (browser requests are blocked).

---

## Constraints

- Must not break the existing browse/select flow in `FilePicker`.
- All Shopify API calls must be server-side (uses `authenticate.admin`).
- Must use the existing Remix + `useFetcher` pattern — no new libraries.
- `write_files` scope must be added to `shopify.app.toml`.
- `FilePicker` is a shared component — the upload state machine must be encapsulated
  inside it, not leaked to `PromoBannerSettings`.

---

## Options Considered

### Option A — Separate action route + second `useFetcher` in FilePicker ✅ Recommended

Create `app/routes/app/app.upload-store-file.tsx` (action only, no loader).
`FilePicker` gets a second `useFetcher` dedicated to the upload. Each `useFetcher`
instance has its own `state` and `data`, so the upload state (`uploadFetcher`) and
the files-loading state (`filesFetcher`) are completely independent.

**Pros:**
- Clean separation of concerns — loader route reads, action route writes.
- Follows the exact pattern already used by all other app routes (`authenticate.admin`
  → `admin.graphql`).
- `useFetcher.state` ("idle" | "submitting") gives precise loading feedback.
- No changes to `app.store-files.tsx` loader.

**Cons:** One additional file. (Acceptable — this is a distinct server operation.)

**Verdict:** ✅ Recommended.

---

### Option B — Extend `app.store-files.tsx` to handle POST (upload) and GET (list)

Add an `action` export to the existing `app.store-files.tsx`.

**Pros:** Fewer files.
**Cons:** Mixes read and write concerns in one route. The loader is a clean read-only
query; adding a multi-step upload action makes it hard to reason about and test.
The GET params and POST body are completely different shapes.

**Verdict:** ❌ Rejected — mixes concerns.

---

### Option C — Run upload in DCP route action (`app.design-control-panel/handlers.server.ts`)

Send the file to the existing DCP action alongside the settings save.

**Cons:** Completely wrong separation. The DCP action saves design settings; uploading
a file to Shopify Files is an independent side-effect that should not be coupled to
a settings save. The upload should complete before the merchant even clicks "Save".

**Verdict:** ❌ Rejected — wrong architectural boundary.

---

## UX Phase Decision — Single Loading Label

The PO document defines two UX states: "Uploading…" (binary transfer) and "Processing…"
(polling). With Remix's `useFetcher`, the browser only has one in-flight state
(`fetcher.state === "submitting"`) while the action is running — it cannot distinguish
between the binary transfer phase and the Shopify polling phase without a second network
round-trip.

**Decision:** Show a single label **"Uploading…"** for the entire server-side operation
(binary transfer + `fileCreate` + polling). This is technically accurate (the upload
pipeline is in progress) and avoids over-engineering a streaming or two-request approach.
The PO two-phase label is a nice-to-have, not a must-have.

---

## Decision

**Option A** — new `app.upload-store-file.tsx` action route + second `useFetcher` in
`FilePicker`.

---

## Upload Route Design

### `app/routes/app/app.upload-store-file.tsx` — action only

```
POST /app/upload-store-file
Content-Type: multipart/form-data

Fields:
  file   — the image binary (File object)
```

**Response (success):**
```json
{ "ok": true, "file": { "id": "gid://...", "url": "https://cdn.shopify.com/...", "filename": "hero.png", "alt": "", "createdAt": "2026-02-20T..." } }
```

**Response (error):**
```json
{ "ok": false, "error": "Upload failed. Please try again." }
```

Server-side steps inside the action:
1. Parse `request.formData()` → extract `file` (File object)
2. Client-side validation already done; server validates MIME type + size defensively
3. `stagedUploadsCreate` mutation → get `{ url, resourceUrl, parameters }`
4. `fetch(url, { method: "POST", body: multipartForm })` — binary upload to staged URL
5. `fileCreate` mutation with `originalSource: resourceUrl`
6. Poll `node(id:)` every 2 000 ms, up to 15 iterations (30s total)
7. If `READY`: return CDN URL + file metadata
8. If `FAILED` or timeout: return error JSON

---

## FilePicker State Machine

Current state: `{ open, files, search, selectedUrl, cursor, hasNextPage }`

New state additions:
```typescript
uploadStatus: "idle" | "uploading" | "timeout" | "error";
uploadError: string | null;
```

The `uploadFetcher` (second `useFetcher`) drives state transitions:

```
idle
  → [merchant picks file, client validates] → submit to /app/upload-store-file
  → uploadStatus = "uploading"

uploading
  → [uploadFetcher.state returns to "idle" with data.ok === true]
    → prepend file to `files`, set selectedUrl to new file URL
    → uploadStatus = "idle"
  → [uploadFetcher.state returns to "idle" with data.ok === false]
    → uploadStatus = "error", uploadError = data.error
  → [action returns timeout JSON]
    → uploadStatus = "timeout"

error | timeout → [merchant clicks Upload again] → uploadStatus = "idle", uploadError = null
```

---

## Scope Addition

`shopify.app.toml` must add `write_files` to the `scopes` string.

Current: `"...write_content,write_discounts,..."`
After: `"...write_content,write_discounts,...,write_files"`

The `read_files` scope (for `app.store-files.tsx` queries) is implied by `write_themes`
in the current scope set; the upload mutations require the explicit `write_files` scope.

Adding a new scope does **not** invalidate existing access tokens for most embedded apps —
Shopify only forces re-auth when a scope is removed. However, `shopify app deploy` must
be run to push the updated scopes to the Partners dashboard.

---

## Files to Modify

| File | Change |
|---|---|
| `app/components/design-control-panel/settings/FilePicker.tsx` | Add upload button, hidden file input, `uploadFetcher`, upload state machine |
| `shopify.app.toml` | Add `write_files` to scopes string |

## Files to Create

| File | Purpose |
|---|---|
| `app/routes/app/app.upload-store-file.tsx` | Remix action: staged upload → binary POST → fileCreate → poll → return CDN URL |

## Files NOT Changed

| File | Reason |
|---|---|
| `app/routes/app/app.store-files.tsx` | Read-only loader; unaffected |
| `app/components/design-control-panel/settings/PromoBannerSettings.tsx` | FilePicker interface unchanged; upload is internal to FilePicker |
| `app/types/state.types.ts` | No new data model fields |
| `app/lib/css-generators/css-variables-generator.ts` | No CSS changes |
| Widget files | No widget changes |

---

## Backward Compatibility Strategy

- Upload is purely additive UI — a new button and state inside `FilePicker`.
- The `onChange(url)` contract between `FilePicker` and `PromoBannerSettings` is unchanged.
- `write_files` scope addition does not break existing merchant sessions.
- All existing `promoBannerBgImage` values (selected via browse, not upload) continue
  to work identically.

---

## Testing Approach

- Unit test for `app.upload-store-file.tsx` action:
  - Happy path: mock `admin.graphql` to return staged target → mock `fetch` for binary upload → mock `fileCreate` → mock `node` poll returning READY → assert `{ ok: true, file: { url } }`
  - FAILED status: mock poll returning FAILED → assert `{ ok: false, error: "..." }`
  - Timeout: mock poll always returning PROCESSING → assert timeout response
  - Invalid MIME type: assert early error response without calling Shopify
- Manual test: open FilePicker, click "Upload image", select a PNG < 20 MB, observe "Uploading…" spinner, confirm image appears pre-selected in grid.
