# Product Owner Requirements: Sync Bundle (Hard Reset)

## User Stories with Acceptance Criteria

---

### Story 1: Sync a full-page bundle

**As a** developer or merchant
**I want** to click "Sync Bundle" on a full-page bundle configure page
**So that** all Shopify-side data (page, metafields) is deleted and re-created from the current bundle definition

**Acceptance Criteria:**
- [ ] Given I am on the full-page bundle configure page, a "Sync Bundle" button is visible in the page header or a dedicated section
- [ ] When I click "Sync Bundle", a confirmation modal appears with a destructive warning before any action is taken
- [ ] Given the modal is open, when I click "Cancel", nothing changes and the modal closes
- [ ] Given the modal is open, when I click "Sync Bundle" (confirm), the action fires with `intent: "syncBundle"`
- [ ] Given the sync action runs, the Shopify page associated with the bundle is deleted and re-created with the same handle (`bundle-{bundleId}`) and `templateSuffix: 'full-page-bundle'`
- [ ] Given the sync action runs, all bundle-variant metafields are re-written: `component_reference`, `component_quantities`, `price_adjustment`, `bundle_ui_config`, `component_pricing`
- [ ] Given the sync action runs, component-variant metafields (`component_parents`) are re-written on every component product in the bundle
- [ ] Given the sync action runs, standard metafields are re-synced
- [ ] Given the sync succeeds, a success toast: **"Bundle synced successfully"** is shown
- [ ] Given the sync fails, an error toast with the failure reason is shown
- [ ] The "Sync Bundle" button is disabled while the sync is in progress

---

### Story 2: Sync a product-page bundle

**As a** developer or merchant
**I want** to click "Sync Bundle" on a product-page bundle configure page
**So that** all Shopify-side data (product, variants, metafields) is deleted and re-created

**Acceptance Criteria:**
- [ ] Given I am on the product-page bundle configure page, a "Sync Bundle" button is visible
- [ ] When I click "Sync Bundle", a confirmation modal appears before any destructive action
- [ ] Given the modal confirms, the Shopify product associated with the bundle (`shopifyProductId`) is archived/deleted then re-created
- [ ] Given the sync action runs, all three metafield operations are re-run
- [ ] Given the sync succeeds, a success toast: **"Bundle synced successfully"** is shown
- [ ] Given the sync fails (e.g., no `shopifyProductId` set), an informative error toast is shown
- [ ] The button is disabled while sync is in progress

---

### Story 3: DB child records are re-created during sync

**As a** developer
**I want** the DB child records (steps, pricing) to be deleted and re-inserted during sync
**So that** stale or structurally invalid DB records are cleaned up

**Acceptance Criteria:**
- [ ] Given a sync runs, all `BundleStep` and `StepProduct` records for the bundle are deleted and re-created from the current form state
- [ ] Given a sync runs, the `BundlePricing` record is deleted and re-created
- [ ] Given a sync runs, `BundleAnalytics` records are NOT deleted (historical data preserved)
- [ ] The `Bundle.id` (primary key) is unchanged after sync

---

### Story 4: Sync button disabled when form has unsaved changes

**As a** merchant
**I want** the Sync button to be disabled when there are unsaved form changes
**So that** I don't accidentally sync with stale form data that hasn't been saved

**Acceptance Criteria:**
- [ ] Given the form has unsaved changes (isDirty), the Sync button is disabled with a tooltip: "Save your changes before syncing"
- [ ] Given the form has no unsaved changes, the Sync button is enabled

---

## UI/UX Specifications

### Sync Button
- **Component:** Polaris `Button`
- **Label:** `Sync Bundle`
- **Tone:** `critical` (destructive red)
- **Icon:** `RefreshIcon` (or similar)
- **Placement:** Page header secondary actions (next to the existing action menu), OR a dedicated "Advanced" card at the bottom of the configure page
- **Disabled states:**
  - While `fetcher.state !== "idle"` (sync in progress)
  - While form `isDirty` (unsaved changes)

### Confirmation Modal
- **Component:** Polaris `Modal`
- **Title:** `Sync Bundle?`
- **Body:**
  ```
  This will delete and re-create all Shopify data for this bundle:

  • The Shopify page / product will be deleted and re-created
  • All bundle and component metafields will be rewritten
  • Bundle steps and pricing records will be reset

  Bundle analytics are preserved. This action cannot be undone.
  ```
- **Primary action:** `Sync Bundle` (destructive tone)
- **Secondary action:** `Cancel`

### Loading State
- Sync button shows loading spinner while `fetcher.state === "submitting"` with intent `"syncBundle"`
- Optionally show a Polaris `Banner` with status: "Syncing bundle to Shopify..."

### Toast Messages
| Outcome | Message | isError |
|---------|---------|---------|
| Success | `"Bundle synced successfully"` | false |
| Missing product/page | `"Bundle has no Shopify product/page — save the bundle first"` | true |
| Shopify API error | `"Sync failed: {error message}"` | true |
| Partial failure | `"Sync partially completed — check bundle configuration"` | true |

---

## Data Persistence

### What is deleted during sync
| Object | How |
|--------|-----|
| `BundleStep` records | `db.bundleStep.deleteMany({ where: { bundleId } })` |
| `StepProduct` records | Cascade from BundleStep deletion |
| `BundlePricing` record | `db.bundlePricing.deleteMany({ where: { bundleId } })` |
| Shopify Page (full-page) | `pageDelete` mutation |
| Shopify Product (product-page) | `productDelete` mutation or archive |
| All variant metafields | Re-written (Shopify `metafieldsSet` is upsert, so no explicit delete needed) |

### What is preserved
| Object | Reason |
|--------|--------|
| `Bundle` record (id, shopId, name, etc.) | Primary key and identity preserved |
| `BundleAnalytics` records | Historical data, must not be lost |
| Cart transform extension registration | Shop-wide, not per-bundle |

### What is re-created
- All `BundleStep` and `StepProduct` records from current form state
- `BundlePricing` from current form state
- Shopify Page (full-page) with same handle and template suffix
- Shopify Product (product-page) with same title and handle
- All 5 bundle variant metafields
- All component variant `component_parents` metafields
- Standard metafields

---

## Backward Compatibility Requirements
- Existing bundles that have never been synced work exactly as before
- The bundle page URL (`/pages/bundle-{id}`) remains the same after sync because the handle is deterministic
- After sync, the Shopify product/page will have a new GID — the DB is updated with the new `shopifyProductId`/`shopifyPageId`

## Out of Scope (explicit)
- Bulk sync across multiple bundles at once
- Sync scheduling or webhooks
- Displaying sync history or last-synced timestamp
- Syncing draft bundles that have no Shopify product/page yet
- Light sync mode (metafields-only) — the hard reset covers all use cases
