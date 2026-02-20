# Product Owner Requirements: Image Upload in Promo Banner File Picker

**Feature ID:** promo-banner-upload
**Created:** 2026-02-20
**Input:** docs/promo-banner-upload/00-BR.md
**Status:** PO Complete → Handoff to Architect

---

## User Stories with Acceptance Criteria

---

### Story 1: Upload a new image from inside the picker

**As a** merchant configuring a full-page bundle promo banner
**I want** to upload a new image directly from within the file picker modal
**So that** I don't have to navigate away to Shopify Admin → Content → Files first

**Acceptance Criteria:**
- [ ] Given the FilePicker modal is open, an "Upload image" button is visible in the modal footer / toolbar area alongside the search field.
- [ ] Given the button is clicked, a native file-input dialog opens, accepting `image/*` only.
- [ ] Given the merchant selects a file > 20 MB, an inline error message "File must be under 20 MB" is shown. No upload is sent to the server.
- [ ] Given the merchant selects a non-image file (e.g. `.pdf`, `.mp4`), the input's `accept` attribute prevents selection; if somehow bypassed, an inline error "Only image files are accepted" is shown.
- [ ] Given a valid image is selected, the upload begins immediately (no extra "confirm" step).

---

### Story 2: Upload progress and processing feedback

**As a** merchant
**I want** to see clear feedback while my image uploads and is processed
**So that** I don't click away thinking nothing is happening

**Acceptance Criteria:**
- [ ] Given the upload has started, the modal shows a loading spinner and the label "Uploading…".
- [ ] Given the binary upload to Shopify is complete and `fileCreate` has been called, the label changes to "Processing…".
- [ ] Given processing completes within 30s, the spinner disappears and the uploaded image appears in the file grid, pre-selected (blue border ring).
- [ ] Given processing takes longer than 30s (timeout), the spinner disappears and the message "Upload successful — image may take a moment to appear. Please close and re-open the picker." is shown.
- [ ] During any loading state, the "Upload image" button, "Load more", and the file grid thumbnails are non-interactive (disabled/dimmed) so the merchant cannot trigger a second upload simultaneously.

---

### Story 3: Upload failure handling

**As a** merchant
**I want** to see a clear error message if the upload fails
**So that** I can retry without being confused

**Acceptance Criteria:**
- [ ] Given the Remix server action returns an error (Shopify `userErrors`, non-200 from staged URL, `fileStatus === "FAILED"`), a Polaris `Banner` with `tone="critical"` appears inside the modal with the message "Upload failed. Please try again."
- [ ] Given the error banner is visible, the "Upload image" button is re-enabled so the merchant can retry.
- [ ] Given the merchant clicks "Upload image" again after an error, the error banner clears.

---

### Story 4: Uploaded image is auto-selected and usable

**As a** merchant
**I want** my just-uploaded image to be immediately available and pre-selected in the picker
**So that** I can confirm it with "Select" in one click

**Acceptance Criteria:**
- [ ] Given the upload and processing succeed, the new file is prepended to the top of the file grid.
- [ ] Given the new file is prepended, it is automatically highlighted with the blue selection border ring (same as clicking a thumbnail manually).
- [ ] Given the new file is highlighted, the "Select" primary action button becomes enabled.
- [ ] Given the merchant clicks "Select", the modal closes and the uploaded image CDN URL is set as `promoBannerBgImage`, identical to selecting a pre-existing file.

---

## UI/UX Specifications

### Upload button placement

Inside the `FilePicker` modal, in the `Modal.Section` header area — an `InlineStack` containing:
- Left: existing search `TextField` (full width, flex-grow)
- Right: `Button variant="plain"` with `UploadIcon`, label `"Upload image"`

### Loading states

| State | Label | Grid interactivity |
|---|---|---|
| Idle | — | Normal |
| Uploading (binary transfer) | `"Uploading…"` + Spinner | Disabled |
| Processing (polling) | `"Processing…"` + Spinner | Disabled |
| Timeout | Descriptive message text | Normal |
| Error | Polaris `Banner` `tone="critical"` | Normal |

### Exact labels

| Element | Label |
|---|---|
| Upload button | `Upload image` |
| Uploading label | `Uploading…` |
| Processing label | `Processing…` |
| Timeout message | `Upload successful — image may take a moment to appear in your library. Close and re-open the picker to see it.` |
| Error banner title | `Upload failed` |
| Error banner body | `Something went wrong. Please try again.` |
| File size error | `File must be under 20 MB` |

### File input constraints

```html
<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif" />
```

Hidden from view; triggered programmatically when merchant clicks "Upload image".

---

## Data Persistence

No new DB columns or schema changes. The upload action:
1. Uploads to Shopify Files (appears in merchant's Content → Files permanently).
2. Returns the CDN URL to the client.
3. The CDN URL flows into `promoBannerBgImage` via the existing `onUpdate('promoBannerBgImage', url)` call — same as selecting an existing file.

---

## Backward Compatibility Requirements

- The existing browse/select flow in `FilePicker` is unchanged.
- The upload feature is purely additive — a new button and upload state in the modal.
- Merchants who have never used the picker see no change to their saved settings.
- The `write_files` scope addition does not break existing merchants — it is a non-breaking scope addition and does not trigger forced re-authentication in Shopify's embedded app model.

---

## Out of Scope (explicit)

- Drag-and-drop file upload.
- Multiple file upload (one file at a time only).
- Upload progress percentage (byte-level streaming not feasible in standard Remix form actions).
- File management (rename, delete, organise) inside the picker.
- Upload from external URL or cloud storage.
- Applying the upload feature anywhere other than the promo banner FilePicker.
