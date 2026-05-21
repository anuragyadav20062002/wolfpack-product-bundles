# Requirements: Unified Edit Configure Wizard

## Context
The admin UI revamp should use the same bundle wizard for both creation and editing. When a merchant clicks Edit on an existing product-page or full-page bundle, they should enter the revamped configure wizard instead of the legacy edit configuration UI.

## Functional Requirements
- FR-01: Dashboard Edit must navigate to the create/configure wizard route for the selected bundle.
- FR-02: Dashboard Clone success must navigate to the create/configure wizard route for the cloned bundle.
- FR-03: Create wizard completion redirects must resolve to the same configure wizard route so subsequent editing remains uniform.

## Out of Scope
- Removing legacy configure route files.
- Reworking cart-transform bundle editing.
- Adding new wizard screens or merchant-facing controls.

## Acceptance Criteria

### FR-01: Edit entry
- [ ] Given an existing FPB or PPB bundle, when the merchant clicks Edit on the dashboard, then the app navigates to `/app/bundles/create/configure/:bundleId`.

### FR-02: Clone entry
- [ ] Given cloning succeeds, when the dashboard handles the clone response, then the app navigates to `/app/bundles/create/configure/:bundleId`.

### FR-03: Completion redirects
- [ ] Given the create configure wizard finishes its final save, then its redirect target points to `/app/bundles/create/configure/:bundleId`.

## UI/UX Spec
No new visible UI. This changes route targets only.

## Data Changes
None.

## Risks
| Risk | Mitigation |
|---|---|
| Old direct configure URLs may still exist in bookmarks. | Keep legacy route files intact for now; only dashboard/edit entry points move. |
| Multiple hard-coded route strings can drift. | Add a shared route helper with unit coverage. |
