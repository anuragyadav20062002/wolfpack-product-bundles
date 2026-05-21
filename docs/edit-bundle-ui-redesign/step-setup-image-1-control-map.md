# Edit Bundle Step Setup: Image 1 Control Map

**Issue ID:** edit-bundle-ui-redesign-1
**Status:** Draft for discussion
**Last Updated:** 2026-05-11 20:03

## Direction

Create Bundle and Edit Bundle will remain separate workflows. The edit workflow should
be implemented from the provided design images, not unified into the create wizard.
Where existing edit features are not shown in the design, we will explicitly choose a
placement before implementation.

Implementation constraints:

- Use Polaris web components (`s-*`) for Admin UI where components exist.
- Use App Bridge Save Bar behavior for unsaved edit state where appropriate.
- Keep the existing readiness score component in edit, and add the Easy Bundles-style
  top readiness score/status treatment in the app body.
- Keep custom CSS scoped to layout gaps that Polaris web components do not cover.
- Do not implement until the conflict decisions below are resolved.

Shopify docs referenced for implementation guardrails:

- https://shopify.dev/docs/api/polaris/using-polaris-web-components
- https://shopify.dev/docs/api/app-bridge-library/apis/save-bar

## Chrome DevTools Status

Chrome DevTools live verification recovered after Chrome restart.

Verified paths:

- Dashboard: `https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/dashboard`
- Current Dashboard Edit behavior for FPB `My Bundle` incorrectly routes to:
  `/app/bundles/create/configure/cmp0dksyu0000v0g5gd15wcjn`
- Direct embedded Admin URL for legacy FPB edit works:
  `/app/bundles/full-page-bundle/configure/cmp0dksyu0000v0g5gd15wcjn`

Screenshot captured:

- `docs/app-nav-map/screenshots/edit-step-setup-current-20260511.png`

Important navigation rule:

- Use Shopify Admin embedded URLs for verification.
- Do not use direct Cloudflare tunnel URLs; they redirect to `/auth/login`.

## Target Layout From Image 1

The Step Setup image shows:

- Header row:
  - Back arrow.
  - Page title: `Configuration`.
  - Secondary help action: `How to configure?`.
- Left column:
  - `Bundle Setup` navigation card with:
    - Step Setup active.
    - Discount & Pricing with `None` status.
    - Bundle Assets with `None` status.
    - Pricing Tiers with `Disabled` status.
  - `Bundle Status` card with status select.
  - `Step Summary` card with:
    - Selected products count.
    - Rules status.
    - Filters status.
    - Search Bar status.
    - Custom Fields count.
    - Preview action.
- Main column:
  - `Step Configuration` card:
    - Widget icon preview.
    - Upload Icon.
    - Step Name.
    - Product Page Title.
    - Multi Language.
  - `Select Product` card:
    - Browse Products tab and count.
    - Browse Collections tab and count.
    - Add Product.
    - Selected count badge.
  - `Rules` card:
    - Empty state.
    - Add Rule.
- Footer actions:
  - Back.
  - Next.

## Current Edit Controls That Directly Fit The Image

- Bundle Setup section nav.
- Bundle Status select.
- Step Summary selected product count.
- Step Summary rules count/status.
- Step Summary filters count/status.
- Step Summary search bar status.
- Preview action.
- Step icon upload.
- Step Name.
- Product Page Title.
- Multi Language.
- Product/collection tabs.
- Add Product / Add Collection.
- Selected product and collection count badges.
- Step rules and Add Rule.

## Chrome-Verified Current Defects Against Image 1

- Dashboard Edit currently opens the create configure route. This must be reverted for
  edit redesign work.
- Page title is `Configure: My Bundle`; target image title is `Configuration`.
- Title-bar actions still show outside the target layout:
  - Preview on Storefront.
  - Sync Bundle.
  - Add to Storefront.
- App Embed banner appears above the layout; target image does not show it.
- Existing create configure route renders `BundleReadinessOverlay`, but the legacy edit
  route does not have the same readiness score treatment.
- Bundle Setup nav has extra items not shown in the image:
  - Bundle Settings.
  - Widget Text.
- Bundle Setup nav does not show the image's right-side status labels:
  - Discount & Pricing: `None`.
  - Bundle Assets: `None`.
  - Pricing Tiers: `Disabled`.
- Step Summary is missing the image's `Custom Fields` row in the current legacy FPB
  edit route.
- Main content includes `Category Filters` as an inline card; target image only shows
  filter status in Step Summary.
- Main content includes `Advanced Step Options` as an inline card; target image does not
  show this section.
- Footer Back/Next actions shown in the target image are not present in the legacy edit
  route.
- Multi Language does not appear in the verified FPB edit route for this store/bundle,
  while the target image shows it.

## Current Edit Controls Missing From The Image

### Step navigation and multi-step management

Existing edit supports:

- Step chip navigation.
- Add Step.
- Remove current step.
- Clone Step.
- Delete Step.
- Drag/drop reorder in product-page edit.

Design image does not show these controls.

### Category filters editing

Existing edit currently exposes category filter editing inline in Step Setup.
The image only shows filter status in Step Summary, not filter editing.

### Advanced step options

Existing edit supports:

- Regular Step vs Add-On / Upsell Step.
- Add-on tab label.
- Add-on panel heading.
- Display add-on products as free.
- Unlock add-on step after bundle completion.
- Mandatory default product.
- Default variant GID.
- Available variant shortcuts.

The image does not show this section.

### Custom fields editing

The image shows a Custom Fields count in Step Summary, but not the editor. In the create
workflow this editor lives under Assets as a modal. Legacy edit does not show it in
Step Setup.

### Readiness score and status treatment

Existing create configure uses `BundleReadinessOverlay`. Easy Bundles also surfaces the
score at the top of the embedded app beside the page heading and keeps the status/setup
banner below that header area.

The edit redesign should keep the overlay component and add a top readiness/status
surface in the app body. Both should read from one shared readiness model so the score,
app-embed status, product status, discount status, and placement status do not drift.

## Recommended Placement Options

### 1. Step navigation and add step

Recommended: add a compact step chip row between the header and the content grid.

Why:

- The design image likely represents one selected step, but edit bundles can have many
  steps.
- The current chip pattern already works visually with the create flow.
- This keeps the `Step Configuration`, `Select Product`, and `Rules` cards unchanged.

Alternative: place step chips at the top of the `Step Configuration` card.

Tradeoff:

- Saves vertical space, but makes the card do two jobs.

### 2. Clone, delete, and reorder

Recommended: add a small icon-only action group on the active step chip or at the end of
the step chip row.

Controls:

- Duplicate icon for clone.
- Delete icon for delete.
- Drag handle or move menu for reorder.

Tradeoff:

- Keeps destructive/structural actions away from the form fields.
- Requires careful mobile behavior.

### 3. Category filters

Recommended: do not keep inline filter editing in Step Setup. Keep Step Summary as the
status surface and make the Filters row open the existing filters drawer/modal.

Why:

- The design image only shows filters in the Step Summary.
- The create workflow already places filter editing outside Step Setup.
- This avoids adding a fourth main card not shown in the design.

Alternative: add a collapsible `Filters` card below Rules.

Tradeoff:

- Easier discovery, but visibly diverges from the design.

### 4. Advanced step options

Recommended: add an `Advanced` secondary action in the Step Configuration card header,
next to `Multi Language`, opening a modal/sheet.

Controls in modal:

- Step type.
- Add-on fields.
- Mandatory default product.
- Variant selection.

Why:

- These are powerful but not primary controls for most merchants.
- Keeps the image layout intact.
- Avoids a large card that would push Rules down.

Alternative: collapsible card below Rules.

Tradeoff:

- More visible, but makes Step Setup heavier than the design.

### 5. Default variant selection

Recommended: replace the raw GID text field with a variant selector built from products
already selected in the step.

Why:

- Raw GIDs are error-prone and merchant-hostile.
- Existing code already lists available variants in the advanced section.

Fallback only if picker scope is too large:

- Keep raw GID field but add variant shortcut buttons as the primary path.

### 6. Custom fields

Recommended: keep editing outside Step Setup. The Custom Fields row in Step Summary can
remain read-only in Step Setup or link to Bundle Assets.

Why:

- Image only shows a count.
- Custom fields are bundle-level shopper inputs, not step setup controls.

### 7. Readiness score and top status background

Confirmed: keep `BundleReadinessOverlay` for the expandable checklist and add a compact
top readiness button in the app body header. The button uses a changing status background
and opens the checklist overlay when clicked.

Why:

- Matches the Easy Bundles pattern without losing the existing Wolfpack component.
- Keeps score visibility high in edit mode.
- Lets the app embed/banner area remain breadcrumb-only while real edit context lives in
  the app body.
- Avoids recalculating readiness in multiple route sections once the editor state hook
  owns the canonical state.

Alternative: replace the overlay with only the top score block.

Tradeoff:

- Simpler UI, but loses the existing expandable checklist behavior and guided completion
  affordance.

## Product Decisions Needed

| Area | Recommended choice | Needs confirmation |
|---|---|---|
| Step chip row | Add above the content grid | Yes |
| Add Step | Put in step chip row | Yes |
| Clone/Delete/Reorder | Icon actions in step chip row | Yes |
| Category filters | Open drawer/modal from Step Summary; no inline card | Yes |
| Advanced step options | Modal/sheet from Step Configuration header | Yes |
| Default variant | Merchant-facing selector from selected variants | Yes |
| Custom fields | Keep out of Step Setup; link/status only | Yes |
| Readiness score | Compact top score button opens existing overlay checklist | Confirmed |
| Product-page vs full-page Step Setup | Same layout, with only applicable statuses/actions changing | Yes |

## Implementation Notes For Later

- Replace legacy `option` tags inside Polaris controls with `s-option` where touched.
- Avoid unsupported icons; use icon names allowed by the repo Polaris rule unless
  verified against current Shopify docs.
- Preserve dirty-state SaveBar for edit. Back/Next can navigate sections, but should
  not silently discard unsaved changes.
- Any browser verification must be retried once Chrome DevTools MCP is usable again.
