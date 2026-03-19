# Product Owner Requirements: PDP Bundle Auto-Template

## User Stories with Acceptance Criteria

---

### Story 1: Template auto-created on bundle save

**As a** merchant configuring a product-page bundle
**I want** the bundle widget to appear on my product's storefront page automatically when I save
**So that** I never have to touch the Shopify Theme Editor

**Acceptance Criteria:**
- [ ] Given a bundle with a linked Shopify product (`shopifyProductId` set), when the merchant clicks Save, then `templates/product.product-page-bundle.json` is written to the active theme.
- [ ] Given the template file already exists in the theme, when Save is clicked again, then the file is NOT re-written (idempotent check at the top of the flow).
- [ ] Given the template is written or already exists, when Save completes, then the linked product has `templateSuffix: 'product-page-bundle'` set via a `productUpdate` mutation.
- [ ] Given a bundle with NO linked product (`shopifyProductId` is null), when Save is clicked, then template creation is skipped entirely (no-op).
- [ ] Given the theme REST API returns an error when writing the template, when Save completes, then the bundle data is still saved successfully and a WARN log is emitted (`non-fatal`).

---

### Story 2: Template auto-applied on Sync Bundle

**As a** merchant who clicks "Sync Bundle" to hard-reset a product-page bundle
**I want** the template and templateSuffix to be re-applied on the new product
**So that** the widget continues to work after a sync without any manual step

**Acceptance Criteria:**
- [ ] Given Sync Bundle completes successfully (new product created), when the flow finishes, then `ensureProductBundleTemplate()` is called and `templateSuffix: 'product-page-bundle'` is set on the new product.
- [ ] Given the template file already exists from a prior save, when Sync Bundle runs, then the file write is skipped and only the product suffix update runs.

---

### Story 3: Template preserves existing product page layout

**As a** merchant whose product page has a custom layout (images, reviews, description)
**I want** the bundle widget to be appended to my existing product template
**So that** adding the bundle doesn't break my existing product page design

**Acceptance Criteria:**
- [ ] Given the active theme has `templates/product.json`, when the bundle template is created, then `product.product-page-bundle.json` starts from a deep-clone of `product.json` (not a blank template).
- [ ] Given the active theme does NOT have `templates/product.json`, when the template is created, then a minimal fallback template is used (main-product section + our apps section).
- [ ] The created template contains both the merchant's existing sections AND an `apps` section with the `bundle-product-page` block embedded.

---

## UI/UX Specifications

There is **no new UI** for this feature. It is fully automatic — triggered as a side-effect of the existing Save and Sync Bundle flows. The merchant sees no new controls.

The only user-visible change is:
- **Before:** Widget does not appear on product page until merchant adds block via Theme Editor.
- **After:** Widget appears on product page immediately after first Save.

---

## Template File Specification

**Template key:** `templates/product.product-page-bundle.json`

**Template suffix applied to product:** `product-page-bundle`

**Template structure:**
```json
{
  "sections": {
    // ... deep-cloned sections from templates/product.json ...
    "bundle_widget": {
      "type": "apps",
      "blocks": {
        "bundle_block": {
          "type": "shopify://apps/{apiKey}/blocks/bundle-product-page/{extensionUid}"
        }
      },
      "block_order": ["bundle_block"],
      "settings": {}
    }
  },
  "order": [ /* existing order */ "bundle_widget" ]
}
```

**Block handle used:** `bundle-product-page`
(matches `liquid_path = "blocks/bundle-product-page.liquid"` in `shopify.extension.toml`)

**Extension UID source:** Read from `extensions/bundle-builder/shopify.extension.toml` `uid` field at runtime, with `SHOPIFY_BUNDLE_BLOCK_UUID` env var as override — same resolution as `widget-theme-template.server.ts`.

---

## Data Persistence

No new DB fields are required. `shopifyProductId` already exists on the Bundle model and is the only field needed to drive the template + suffix update.

The `templateSuffix` value (`'product-page-bundle'`) is applied directly to the Shopify product via GraphQL. It is not stored in our DB.

---

## Backward Compatibility Requirements

- **Existing bundles** already configured by merchants who added the block manually: their product already renders the widget. After this change, when they next save the bundle, the template file is created in the theme and `templateSuffix: 'product-page-bundle'` is applied. The widget continues to render — the template contains the same block they added manually, so behavior is unchanged.
- **Bundles with no linked product:** flow is a no-op; no change.
- **Merchants with a custom `product.json`:** their customizations are preserved because the new template is cloned from their existing `product.json`.

---

## Out of Scope (explicit)

- Removing `templateSuffix` when a bundle product is unlinked or deleted (future).
- Showing the merchant any UI feedback about the template creation (no toast, no status indicator — it's silent automation).
- Creating per-bundle templates (one shared `product.product-page-bundle.json` serves all PDP bundles via the metafield-driven data binding already in place).
- Any change to the `bundle-product-page.liquid` block markup.
