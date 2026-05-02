# Requirements: Create Bundle Wizard

## Context
The current "Create Bundle" flow is a small modal on the dashboard. The new design replaces it with a full-page multi-step wizard (5 steps total; only Step 01 is being implemented now with subsequent Figma screens provided later). The wizard gives merchants a structured, visually rich setup experience with bundle type previews, page layout selection, and a clear progress indicator.

## Audit / Prior Research Reference
> Spec from Figma design image provided by user. User Q&A captured in session.

## Functional Requirements
- FR-01: "Create Bundle" button navigates to a new route `/app/bundles/create` instead of opening a modal
- FR-02: Step 01 collects bundle name (required, min 3 chars), description (optional), bundle type (product_page | full_page), and page layout (footer_bottom | footer_side, only for full_page)
- FR-03: Step indicator shows 5 steps; only step 01 is active/enabled; steps 02–05 are rendered as future placeholders
- FR-04: Submitting step 01 creates the bundle (same logic as current modal) and redirects to the configure page
- FR-05: Back button returns to `/app/dashboard`
- FR-06: "How do bundle builder types work?" links to `https://wolfpackapps.com`
- FR-07: "View Demo" on page layout cards links to `https://wolfpackapps.com`
- FR-08: Page Layout section only renders when Full Page bundle type is selected
- FR-09: Old dashboard modal and related state (createModalRef, useDashboardState create-modal fields) are removed once new route is live
- FR-10: Add `data-tour-target` attributes to FPB and PPB configure page section wrappers per docs/guided-tour-reference.md §3

## Out of Scope
- Steps 02–05 implementation (awaiting Figma screens)
- Guided tour and readiness score widget components (Phase 2 per guided-tour-reference.md)
- Any changes to the bundle configure pages beyond data-tour-target attrs

## Acceptance Criteria

### FR-01
- [ ] Clicking "Create Bundle" on dashboard navigates to `/app/bundles/create` (not modal)

### FR-02
- [ ] Bundle name is required; submitting empty shows error
- [ ] Bundle name < 3 chars shows validation error
- [ ] Bundle type cards are visually selectable; selected card has highlighted border
- [ ] Page layout section only visible when Full Page is selected

### FR-03
- [ ] Step indicator renders 01–05; step 01 has filled/dark circle; 02–05 appear muted

### FR-04
- [ ] On valid submit → bundle created → redirect to configure page
- [ ] Subscription limit exceeded → error shown

### FR-09
- [ ] Dashboard no longer renders create-bundle s-modal
- [ ] useDashboardState no longer exports create-modal state

### FR-10
- [ ] FPB configure page has data-tour-target on step setup, discount/pricing, design settings, bundle visibility sections
- [ ] PPB configure page has data-tour-target on product selection, discount/pricing, design settings, bundle status sections

## UI/UX Spec
- Bundle type card images: use existing `/pdp.jpeg` and `/full.jpeg` (already in public folder)
- Cards show a larger preview image from Figma (the animated play-button overlay is preserved for Loom demo links)
- Selected state: `2px solid #005bd3` border + light blue background tint
- Step indicator numbers: filled dark circle (active), outlined/muted (future)
- "Next" button is dark (`background: #1a1a1a`) at bottom right — same style as design

## Data Changes
None — same DB fields as current modal (name, description, bundleType, fullPageLayout).

## Risks
| Risk | Mitigation |
|---|---|
| useDashboardState.ts exports used outside dashboard | grep all imports before removing fields |
| handleCreateBundle action must move to new route | Reuse handler function, adjust import path |
