# SDE Implementation Plan: Image Upload in Promo Banner File Picker

**Feature ID:** promo-banner-upload
**Issue ID:** promo-banner-upload-1
**Created:** 2026-02-20

---

## Overview

Three changes: one new Remix action route, updates to `FilePicker.tsx`, and a scope
addition in `shopify.app.toml`. No DB changes, no widget rebuild needed.

---

## Phase 1: Scope Addition

**Step 1.1** — Add `write_files` to scopes in `shopify.app.toml`

---

## Phase 2: Upload Action Route

**Step 2.1** — Create `app/routes/app/app.upload-store-file.tsx`
- Parse `file` from multipart `request.formData()`
- Validate MIME type (image/*) and size (≤ 20 MB) server-side
- `stagedUploadsCreate` → get staged target
- POST binary to staged URL
- `fileCreate` with `originalSource: resourceUrl`
- Poll `node(id:)` every 2s, max 15 iterations
- Return `{ ok: true, file }` or `{ ok: false, error }`

---

## Phase 3: FilePicker Upload UX

**Step 3.1** — Update `app/components/design-control-panel/settings/FilePicker.tsx`
- Add hidden `<input type="file">` ref
- Add `uploadFetcher` (second `useFetcher`)
- Add `uploadStatus` state: "idle" | "uploading" | "timeout" | "error"
- Add `uploadError` state
- Add "Upload image" button (plain, UploadIcon) in search row
- Handle `uploadFetcher.data` effect → prepend new file, auto-select, handle error/timeout
- Render upload feedback: spinner + "Uploading…" label, error Banner, timeout message
- Disable grid + load-more + upload button while uploading

---

## Build & Verification Checklist

- [ ] TypeScript compiles without new errors (`npx tsc --noEmit`)
- [ ] ESLint: 0 errors on modified files
- [ ] No widget rebuild needed (no widget source changes)
- [ ] `shopify.app.toml` scope updated
- [ ] Manual: upload a PNG, see "Uploading…" spinner, image appears pre-selected
- [ ] Manual: upload file > 20 MB, see size error immediately (no server call)
- [ ] Manual: existing browse/select flow unchanged

## Rollback Notes

- Revert `shopify.app.toml` scope change
- Revert `FilePicker.tsx` to previous commit
- Delete `app/routes/app/app.upload-store-file.tsx`
- Run `shopify app deploy` to push reverted scopes
