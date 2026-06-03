# Requirements: Create Flow Uses Edit Configure Screen

## Context
Merchants should configure newly created bundles in the same FPB/PPB edit screens used after a bundle already exists. The old multi-step creation wizard creates UI drift, duplicated settings, and inconsistent behavior. The new create flow keeps only the bundle-type selection entry and a name modal, then opens the existing configure screen in create mode.

## Audit / Prior Research Reference
Existing references:
- `docs/create-bundle-wizard/01-requirements.md` documents the current wizard being replaced.
- `docs/first-load-min-config-tour/01-requirements.md` documents first-install guided tour gating.
- `docs/app-nav-map/APP_NAVIGATION_MAP.md` documents the current dashboard and create routes.
- Memory-backed prior work confirms the guided tour should be shop-level first-use gated.

## Functional Requirements
- FR-01: Clicking Create Bundle from the dashboard must open `/app/bundles/create`.
- FR-02: `/app/bundles/create` must ask the merchant to choose between Product Page Bundle and Full Page Bundle using the existing card-selection concept.
- FR-03: After selecting a bundle type, the merchant must click Continue before seeing the name modal.
- FR-04: The name modal must collect only bundle name. Description must be removed from the create UI and request payload.
- FR-05: Saving the modal must create the bundle and redirect to the existing configure/edit route for the selected bundle type.
- FR-06: The configure/edit screen must be shared between create and edit flows. Create mode must not render the old create-configure wizard.
- FR-07: Create mode must trigger the guided tour only when the merchant is eligible for the first-install first-bundle tour.
- FR-08: Edit mode must continue to open the same configure screen without triggering first-load tour behavior.
- FR-09: E2E testing must cover Product Page and Full Page bundle creation from Admin through redirect to configure.

## Out of Scope
- Storefront widget design changes.
- New DCP controls.
- Rebuilding EB parity for configure sections in this issue.
- Shopify extension deploy.
- Description capture during creation.

## Acceptance Criteria

### FR-01: Dashboard entry
- [ ] Given the merchant clicks Create Bundle on the dashboard, when navigation completes, then `/app/bundles/create` is shown.

### FR-02: Type selection
- [ ] Given the merchant opens `/app/bundles/create`, when no card is selected, then Continue is disabled or blocked by validation.
- [ ] Given the merchant selects Product Page Bundle, then the Product Page card is visually selected.
- [ ] Given the merchant selects Full Page Bundle, then the Full Page card is visually selected.

### FR-03 and FR-04: Name modal
- [ ] Given a type is selected, when the merchant clicks Continue, then a modal opens with a bundle name field only.
- [ ] Given the modal is open, then there is no description field.
- [ ] Given the name is blank or invalid, when Save is clicked, then client-side validation blocks creation.

### FR-05 and FR-06: Shared configure screen
- [ ] Given a Product Page bundle is named and saved, then the app redirects to `/app/bundles/product-page-bundle/configure/:bundleId?mode=create` or equivalent create-mode signal.
- [ ] Given a Full Page bundle is named and saved, then the app redirects to `/app/bundles/full-page-bundle/configure/:bundleId?mode=create` or equivalent create-mode signal.
- [ ] Given the redirect completes, then the screen shown is the existing edit/configure UI, not `/app/bundles/create/configure/:bundleId`.

### FR-07 and FR-08: Guided tour gating
- [ ] Given the shop is first-create-tour eligible, when the first bundle is created, then the configure URL includes the first-load signal and the guided tour opens if it has not been dismissed for that shop.
- [ ] Given the shop is not first-create-tour eligible, when a bundle is created, then the configure URL does not force the guided tour.
- [ ] Given an existing bundle is edited, then the guided tour is not forced by edit navigation.

### FR-09: E2E
- [ ] Product Page bundle create flow passes in Shopify Admin Chrome.
- [ ] Full Page bundle create flow passes in Shopify Admin Chrome.

## UI/UX Spec
- Keep Polaris web components for Admin UI controls where practical.
- Keep the existing visual card-selection concept from wizard step 1.
- The primary CTA is Continue on the type-selection screen.
- The modal title should make the selected bundle type clear.
- Modal fields: bundle name only.
- Modal actions: Save and Cancel.
- While saving, show loading on Save and prevent duplicate submits.
- After save, redirect directly to the selected bundle type's existing configure screen.

## Data Changes
No schema changes expected. Reuse the existing first-create guided-tour eligibility data and create bundle handler behavior.

## Risks
| Risk | Mitigation |
|---|---|
| Old create-configure route remains reachable from stale links | Update active dashboard/create redirects and nav-map; do not use it from new flow |
| Guided tour opens too often | Keep existing shop-level first-use gate and only add first-load signal on eligible create |
| Existing edit routes assume edit-only mode | Use a query param or loader-derived mode that defaults to edit without changing existing edit behavior |
