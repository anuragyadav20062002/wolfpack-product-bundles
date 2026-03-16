# Product Owner Requirements: Custom Brandable URL Slugs for Full-Page Bundles

## Reference
- BR: `docs/custom-bundle-url-slugs/00-BR.md`

---

## User Stories with Acceptance Criteria

---

### Story 1 — Set a custom URL slug before placing the widget

**As a** merchant configuring a full-page bundle for the first time
**I want** to type a custom URL slug before clicking "Add to Storefront"
**So that** the page is created at the URL I choose from day one

**Acceptance Criteria:**
- [ ] Given the bundle has NOT yet been placed, the configure page shows a "Page URL" text input under a "Storefront Page" card.
- [ ] Given the bundle name is "Build Your Own Kit", when the configure page loads, the input is pre-filled with `build-your-own-kit` (slugified: lowercase, spaces → hyphens, special chars stripped).
- [ ] When the merchant edits the input, the slug is normalised on blur: uppercased characters lowercased, spaces/underscores converted to hyphens, consecutive hyphens collapsed, leading/trailing hyphens removed.
- [ ] When the slug is valid (FR-06 rules), a live preview label reads `{shopDomain}/pages/{slug}` and the "Add to Storefront" button is enabled.
- [ ] When the slug is empty or invalid, the "Add to Storefront" button is disabled and an inline error is shown.
- [ ] When "Add to Storefront" is clicked with a valid slug, the Shopify page is created with that exact handle.
- [ ] When the handle is already taken by another page, the system silently appends `-2` (incrementing if needed) and shows a notice: *"The slug 'build-your-own-kit' was taken — using 'build-your-own-kit-2' instead."*

---

### Story 2 — Accept the default slug in one click

**As a** merchant who doesn't need a custom URL
**I want** the system to suggest a sensible slug based on my bundle name
**So that** I can place the widget without extra thought

**Acceptance Criteria:**
- [ ] When the configure page loads for an unplaced bundle, the slug input is pre-filled with the slugified bundle name.
- [ ] When the merchant clicks "Add to Storefront" without modifying the slug, the page is created with the pre-filled slug.
- [ ] When the bundle name changes after the merchant has manually edited the slug, the slug is NOT auto-updated (manual edits take precedence).
- [ ] When the bundle name changes and the merchant has NOT manually edited the slug (i.e., it still equals the auto-generated default from the original name), the slug updates to match the new name.

---

### Story 3 — Rename a live bundle page's URL

**As a** merchant who placed a bundle and wants to change its URL
**I want** to edit the slug and save
**So that** the Shopify page is renamed to the new handle

**Acceptance Criteria:**
- [ ] Given the bundle has been placed, the "Page URL" input shows the current `shopifyPageHandle` value and is editable.
- [ ] Given the merchant changes the slug and clicks Save (the main Save button, not "Add to Storefront"), when saved, the Shopify page handle is updated via `pageUpdate` mutation.
- [ ] After a successful handle update, `shopifyPageHandle` in the database reflects the new value.
- [ ] After a successful handle update, the "View on Storefront" button URL uses the new slug.
- [ ] When `pageUpdate` fails (e.g., handle collision), the form shows a toast error: *"Could not rename page: [reason]"* and the DB is NOT updated.
- [ ] When the slug is unchanged from the stored value, no `pageUpdate` call is made (no-op save).

---

### Story 4 — See a live URL preview

**As a** merchant typing a slug
**I want** to see the complete storefront URL update in real time
**So that** I can confirm it looks correct before saving

**Acceptance Criteria:**
- [ ] A non-editable preview label appears immediately below the input showing `https://{shopDomain}/pages/{slug}`.
- [ ] The preview updates on every keystroke (before normalisation).
- [ ] When the slug is empty, the preview shows `https://{shopDomain}/pages/`.
- [ ] The preview text is truncated with ellipsis if it exceeds the card width.

---

### Story 5 — Backward compatibility for existing bundles

**As a** merchant with bundles already placed using the old UUID-based handles
**I want** my existing bundle pages to continue working exactly as before
**So that** no live storefront links break

**Acceptance Criteria:**
- [ ] Given an existing bundle with `shopifyPageHandle = "bundle-clxyabc123"`, the configure page shows that value pre-filled in the new slug input.
- [ ] Existing pages continue to load correctly (metafield `custom.bundle_id` remains the primary bundle ID resolution source — handle is irrelevant to widget loading).
- [ ] No automatic migration or rename of existing handles occurs.
- [ ] The merchant CAN manually update the slug for an existing bundle if they wish.

---

## UI / UX Specifications

### Component: "Storefront Page" Card (new)

**Location:** In the full-page bundle configure page, immediately above the existing "Page Layout" card (which has the "Footer Bottom / Sidebar" toggle).

**Polaris components:**
- `Card` with title "Storefront Page"
- `BlockStack gap="300"` containing:
  1. Explainer text: `Text variant="bodySm" tone="subdued"` — *"Choose the URL where this bundle will appear on your store."*
  2. `TextField`:
     - `label="Page URL slug"`
     - `prefix="/{shopDomain}/pages/"` (using Polaris `prefix` prop)
     - `helpText` showing the full URL preview
     - `error` for invalid input
     - `autoComplete="off"`
  3. If bundle is placed: an `InlineStack` with the "View on Storefront" `Button` (moves from its current position into this card, next to the input)

**Slug input label:** `Page URL slug`

**Prefix display:** Show `{shopDomain}/pages/` as grey prefix text on the left of the text field (Polaris `TextField prefix` prop).

**Error messages:**
- Empty: *"URL slug cannot be empty."*
- Too long (> 255 chars): *"URL slug must be 255 characters or fewer."*
- Invalid characters: *"Only lowercase letters, numbers, and hyphens are allowed."*
- Collision (non-blocking notice, not error): *"The slug '{original}' was taken — using '{adjusted}' instead."*

**Save vs. Add to Storefront behaviour:**
- "Add to Storefront" → creates new page with slug; button becomes "View on Storefront" after.
- Main "Save" button (when bundle is placed + slug changed) → calls `pageUpdate` to rename; "View on Storefront" URL updates.
- Main "Save" button (slug unchanged) → no `pageUpdate` call.

---

## Data Persistence

| Field | Location | Type | Notes |
|-------|----------|------|-------|
| `customPageSlug` | `useBundleForm.ts` state | `string` | UI-only state; never persisted separately — maps to `shopifyPageHandle` on save |
| `shopifyPageHandle` | Prisma `Bundle` model | `String?` | Already exists; updated on every successful page create or handle rename |
| `shopifyPageId` | Prisma `Bundle` model | `String?` | Already exists; used for `pageUpdate` mutation target |

No new DB columns are required. The existing `shopifyPageHandle` field is the single source of truth for the slug.

---

## Validation Rules (client + server)

| Rule | Detail |
|------|--------|
| Allowed characters | `[a-z0-9-]` only (after normalisation) |
| Max length | 255 characters |
| No leading/trailing hyphens | Strip on blur |
| Consecutive hyphens | Collapse to single `-` on blur |
| Uniqueness | Checked server-side before `pageCreate`; auto-suffix if taken |
| Immutability of internal bundle ID | Slug is cosmetic; `custom.bundle_id` metafield value is never changed |

---

## Backward Compatibility Requirements

- All existing bundles with `bundle-{id}` handles continue to work — widget resolves bundle via metafield, not handle.
- No DB migration needed — `shopifyPageHandle` already exists; no new column.
- The `bundle-` prefix extraction fallback in `bundle-full-page.liquid` may be left as dead code; it does not need removal for this feature to work (it simply will not match new slugs, which is fine since metafield is primary).
- Form state for existing placed bundles: `shopifyPageHandle` is loaded and pre-filled into the slug input; the merchant can edit or leave as-is.

---

## Out of Scope (explicit)

- Automatic 301 redirect from old handle to new handle after rename.
- Bulk slug migration for all existing bundles.
- Slug reservation or lock after placement.
- Product-page bundles (no standalone page).
- Custom domains.
- Shopify SEO fields (meta title, meta description) — separate feature.
