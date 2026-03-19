# Product Owner Requirements: FPB Auto Widget Install

## User Stories with Acceptance Criteria

### Story 1: One-click widget activation
**As a** merchant setting up a full-page bundle
**I want** clicking "Add to storefront" to install the widget automatically
**So that** I never have to interact with the Shopify Theme Editor

**Acceptance Criteria:**
- [ ] Given a merchant clicks "Add to storefront" and selects a page, when the install succeeds, then no theme editor tab is opened
- [ ] Given the install succeeds, then a toast shows "Widget installed! Your bundle page is live."
- [ ] Given the install succeeds, then a "View storefront" link to `/pages/{handle}` is shown in the toast or modal
- [ ] Given the template already exists (re-install), when the merchant clicks "Add to storefront" again, then it still shows success (idempotent)
- [ ] Given the install API call fails, then the app falls back to opening the theme editor deep link with a toast: "Couldn't auto-install — opening Theme Editor instead"

### Story 2: Clear install status in UI
**As a** merchant
**I want** to know the widget is live immediately after clicking
**So that** I feel confident setup is complete

**Acceptance Criteria:**
- [ ] Given install is in progress, then the "Add to storefront" button shows a loading spinner / disabled state
- [ ] Given install succeeds, then the modal closes and a success toast is shown for 6 seconds
- [ ] Given the page selection modal is open, then a helper text says "We'll install the widget automatically — no Theme Editor needed"

---

## UI/UX Specifications

### Button / modal copy changes
| Location | Old copy | New copy |
|---|---|---|
| Place Widget modal title | "Place Widget" | "Add to Storefront" |
| Modal subtitle | "Select a page to open the theme editor..." | "Select the bundle page — we'll install the widget automatically." |
| Toast on success | — | "Widget installed! Your bundle is live." |
| Toast on fallback | — | "Couldn't auto-install — opening Theme Editor instead." |
| Button loading state | "Place Widget" | "Installing…" (spinner) |

### Loading state
- The "Add to storefront" button in the modal should become disabled with a spinner while the API call is in flight
- Use Polaris `Spinner` or button `loading` prop

---

## Data Persistence
- No DB changes required — `ensureBundlePageTemplate` is a stateless, idempotent theme asset write
- No new fields on Bundle model

## Backward Compatibility Requirements
- Product-page bundle "Add to storefront" flow is untouched
- The existing theme editor deep link generation stays in place as the fallback path

## Out of Scope
- Auto-install on bundle save/create (trigger is still the explicit "Add to storefront" button)
- Multi-theme support (targets MAIN/active theme only)
- Product-page bundle auto-install (already done separately)
