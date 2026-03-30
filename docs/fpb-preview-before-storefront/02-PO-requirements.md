# Product Owner Requirements: Full-Page Bundle Pre-Storefront Preview

_Derived from:_ `docs/fpb-preview-before-storefront/00-BR.md`

---

## User Stories with Acceptance Criteria

---

### Story 1: Preview Before Publishing

**As a** merchant building a full-page bundle
**I want** to click a "Preview" button before adding the bundle to my storefront
**So that** I can see exactly how my bundle looks in my real theme before any shoppers can access it

**Acceptance Criteria:**

- [ ] Given a full-page bundle with `shopifyPageHandle = null` and `shopifyPreviewPageId = null`, when the configure page loads, then a "Preview" secondary action button is visible alongside "Add to Storefront".
- [ ] Given the above state, when the merchant clicks "Preview", then a loading indicator appears on the button.
- [ ] Given the above state, when the merchant clicks "Preview", then a draft (unpublished) Shopify page is created with `templateSuffix: "full-page-bundle"` and `isPublished: false`.
- [ ] Given the above, when the draft page is created, then `bundle_id` and `bundle_config` metafields are written to the draft page (same as published flow).
- [ ] Given the above, when the draft page is created, then its `shareablePreviewUrl` is returned from Shopify and opened in a new browser tab.
- [ ] Given the above, when the draft page is created successfully, then `shopifyPreviewPageId` and `shopifyPreviewPageHandle` are saved to the bundle record in the DB.
- [ ] Given draft page creation, when the draft page is opened via `shareablePreviewUrl`, then the merchant sees the bundle rendered in their real Shopify theme (not the app).
- [ ] Given the above state, when draft page creation fails, then an error toast is shown, no DB state is written, and the bundle record is unchanged.

---

### Story 2: Re-open Preview (Draft Already Exists)

**As a** merchant who has already clicked "Preview" once
**I want** clicking "Preview" again to instantly re-open the storefront preview
**So that** I can iterate on bundle settings and check the preview without creating duplicate pages

**Acceptance Criteria:**

- [ ] Given a bundle with `shopifyPreviewPageId` set and `shopifyPageHandle = null`, when the configure page loads, then the "Preview" button is visible and not in a loading state.
- [ ] Given the above state, when the merchant clicks "Preview", then a single GraphQL query is made to retrieve the `shareablePreviewUrl` for the existing draft page (no new page is created).
- [ ] Given the above, when the preview URL is retrieved, then it is opened in a new browser tab immediately.
- [ ] Given the above, when the existing draft page has been deleted externally (e.g., via Shopify admin), then clicking "Preview" creates a new draft page and behaves as per Story 1 (graceful recovery).

---

### Story 3: Add to Storefront (with Existing Draft)

**As a** merchant who has previewed their bundle and is satisfied
**I want** clicking "Add to Storefront" to publish my existing preview page
**So that** I don't end up with two pages (one draft, one published) for the same bundle

**Acceptance Criteria:**

- [ ] Given a bundle with `shopifyPreviewPageId` set and `shopifyPageHandle = null`, when the merchant clicks "Add to Storefront", then the existing draft page is published (via `pageUpdate` with `isPublished: true`) rather than a new page being created.
- [ ] Given the above, when the page is published, then `shopifyPageHandle` and `shopifyPageId` are set on the bundle, and `shopifyPreviewPageId` / `shopifyPreviewPageHandle` are cleared.
- [ ] Given the above, when "Add to Storefront" completes, then the UI transitions to "View on Storefront" (current behaviour, unchanged).
- [ ] Given a bundle with `shopifyPreviewPageId = null` and `shopifyPageHandle = null` (no preview taken), when "Add to Storefront" is clicked, then the existing flow runs unchanged (create a new published page directly).
- [ ] Given a bundle where the draft page was deleted externally before "Add to Storefront" is clicked, then "Add to Storefront" falls back to creating a new published page and continues normally.

---

### Story 4: No Change for Already-Published Bundles

**As a** merchant whose bundle is already on the storefront
**I want** the configure page to look and behave exactly as it does today
**So that** I am not confused by new UI elements that don't apply to my bundle

**Acceptance Criteria:**

- [ ] Given a bundle with `shopifyPageHandle` set (already published), when the configure page loads, then only the "View on Storefront" button is shown as the primary action.
- [ ] Given the above state, the "Preview" button does NOT appear anywhere on the page.
- [ ] Given the above state, the "Sync Bundle" secondary action remains unchanged.
- [ ] Given an existing bundle record in the DB (no `shopifyPreviewPageId` column yet), after the Prisma migration runs, then the bundle continues to load and render correctly with `shopifyPreviewPageId = null`.

---

## UI/UX Specifications

### Button Layout — State Machine

| Bundle state | Primary Action | Secondary Actions |
|---|---|---|
| `shopifyPageHandle = null`, `shopifyPreviewPageId = null` | "Add to Storefront" | "Preview", "Sync Bundle" |
| `shopifyPageHandle = null`, `shopifyPreviewPageId` set | "Add to Storefront" | "Preview", "Sync Bundle" |
| `shopifyPageHandle` set (published) | "View on Storefront" | "Sync Bundle" |

**"Preview" button:**
- **Component:** Polaris `secondaryActions` array entry (same level as "Sync Bundle")
- **Icon:** `ViewIcon` (or `EyeIcon`) from `@shopify/polaris-icons`
- **Label:** `"Preview on Storefront"`
- **Loading state:** `loading: true` while the `createPreviewPage` fetch is in-flight
- **Disabled:** when `fetcher.state !== 'idle'`
- **Position:** First item in `secondaryActions` (before "Sync Bundle")

**"Add to Storefront" button (no change to current copy or position):**
- Remains the primary action when `shopifyPageHandle` is null
- Loading state during submission unchanged

**Toast messages:**
- Preview page creating (first click): `"Creating preview…"` (brief, auto-dismiss 2 s)
- Preview page created (first click): `"Preview page ready — opening in new tab"`
- Preview re-open (subsequent click): `"Opening preview in new tab…"` (2 s)
- Preview creation failure: `"Failed to create preview page — please try again"` (isError: true)
- Draft page not found on re-open: `"Preview page not found — creating a new one…"`

**Draft page naming convention in Shopify:**
- Page title: `"[Preview] {Bundle Name}"`
- Page handle: auto-generated by Shopify from the title (e.g., `preview-my-bundle`)
- The `[Preview]` prefix makes draft pages clearly distinguishable in the Shopify admin Pages list

---

## Data Persistence

### New Bundle Fields

| Field | Type | Purpose |
|---|---|---|
| `shopifyPreviewPageId` | `String?` | GID of draft Shopify page (`gid://shopify/Page/123`) |
| `shopifyPreviewPageHandle` | `String?` | Handle of draft page (for URL construction and cleanup) |

**Written:** When "Preview" is clicked for the first time and draft page creation succeeds.
**Cleared:** When "Add to Storefront" successfully publishes the draft (or creates a new published page).
**Format:** Same as existing `shopifyPageId` / `shopifyPageHandle` fields.

### New Route Action Intent

`intent: "createPreviewPage"` — handled in the configure route action, calls `handleCreatePreviewPage()`.

### GraphQL Queries/Mutations Added

| Operation | Purpose |
|---|---|
| `pageCreate` with `isPublished: false` | Create draft preview page |
| Query `page(id:) { shareablePreviewUrl }` | Retrieve preview URL for existing draft |
| `pageUpdate` with `isPublished: true` | Promote draft to published during "Add to Storefront" |

---

## Backward Compatibility Requirements

- All existing bundle records have `shopifyPreviewPageId = null` and `shopifyPreviewPageHandle = null` after migration — no data migration required.
- The configure route loader must not break if these fields are absent; Prisma nullables handle this automatically.
- The `handleValidateWidgetPlacement` function must check for a pre-existing draft page and promote it; if none exists, the current full creation flow runs unchanged.
- Per CLAUDE.md "No Backwards Compatibility Rule": no shims for old data. New Prisma columns with `null` defaults are the only change.

---

## Out of Scope (Explicit)

- Auto-deleting orphaned draft pages when a bundle is deleted (follow-up issue).
- "Copy preview link" clipboard button.
- Preview for product-page bundles (already handled).
- Any change to the Shopify extension files (`.liquid`, `.toml`).
- Expiry / refresh of `shareablePreviewUrl` (Shopify manages this; the URL is long-lived for draft pages).
- Preview for bundles in `draft` status with incomplete steps (allowed — merchant should be able to preview partial bundles too).
