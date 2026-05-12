# Requirements: Create Wizard Dirty Navigation

## Context
Merchants moving through the Create Bundle wizard should not wait for a server save when the current wizard page has not changed since the last successful save. This keeps the uniform create/edit wizard responsive while preserving the existing save behavior whenever merchant-entered data is actually dirty.

## Functional Requirements
- FR-01: Each create wizard page must detect whether its own persisted payload has changed.
- FR-02: Clicking Next on a clean page must advance without submitting that page's save action.
- FR-03: Clicking Next on a dirty page must keep the existing save action and advance only after a successful response.
- FR-04: Successful saves must reset the clean baseline for that page.

## Out of Scope
- Edit workflow routing changes.
- New merchant-facing controls or copy.
- Backend schema changes.

## Acceptance Criteria

### FR-01: Page-scoped dirty detection
- [ ] Given the create wizard loads existing bundle data, when no merchant field changes, then the current page is clean.
- [ ] Given a merchant changes a persisted field, when Next is clicked, then the current page is dirty.

### FR-02: Clean-page fast navigation
- [ ] Given the current page is clean, when Next is clicked, then no save fetcher is submitted.
- [ ] Given the current page is clean, when Next is clicked, then the wizard advances to the next step immediately.

### FR-03: Dirty-page save behavior
- [ ] Given the current page is dirty, when Next is clicked, then the existing save fetcher is submitted with the same payload as before.
- [ ] Given the save succeeds, when the fetcher response is processed, then the wizard advances.

### FR-04: Baseline reset
- [ ] Given a page save succeeds, when the merchant returns to that page without changes, then Next skips the save.

## UI/UX Spec
No new visible UI. The optimization is behavioral only.

## Data Changes
None.

## Risks
| Risk | Mitigation |
|---|---|
| Skipping a required first save could omit DB step IDs needed by later pages. | Treat configuration as dirty until all steps have DB IDs. |
| JSON key-order differences could mark clean data dirty. | Use stable payload builders and compare the exact serialized payload shape submitted to the server. |
