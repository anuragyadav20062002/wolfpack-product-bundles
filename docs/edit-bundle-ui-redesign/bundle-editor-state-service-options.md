# Bundle Editor State Service Options

**Issue ID:** bundle-editor-state-service-1
**Status:** Draft for decision
**Last Updated:** 2026-05-11 20:03

## Answer

There is no current `BundleStateService` that does the full job we need.

The app has an `AppStateService`, but the bundle editor does not use it as a canonical
source of truth. Existing edit routes still initialize local hook state directly from
Remix loader data, then build save payloads inside route components.

## Existing State Pieces

### `app/services/app.state.service.ts`

Has a `bundleConfiguration` slice with:

- `form`
- `steps`
- `pricing`
- `stepConditions`
- `selectedCollections`
- `isDirty`
- setters/getters/subscriptions

Limitations:

- The bundle type is shallow and incomplete for the edit workflow.
- It does not normalize loader/API data.
- It does not own a full baseline/current snapshot.
- It does not serialize edit-save payloads.
- It is not the real source of truth for FPB/PPB configure routes.

### `app/hooks/useBundleConfigurationState.ts`

This is the main hook currently used by the FPB/PPB edit routes.

It handles:

- Initializing local form state from `loaderData.bundle`.
- Step transformation.
- Step conditions.
- Pricing hook setup.
- Bundle product state.
- Some dirty tracking.
- Some discard/reset behavior.

Limitations:

- It is route-local React state, not a service.
- It has incomplete baselines for some data, for example selected collections start with
  `{}` in the baseline even though loaded steps may have collections.
- Many important editor fields are still managed directly in the route file:
  - page slug
  - loading GIF
  - promo banner
  - tier config
  - floating badge
  - product display toggles
  - SDK mode
  - widget text overrides
- Save payloads are still assembled inside route components.

### Create Configure Route

The create configure route has separate normalization and dirty logic:

- `initSteps()`
- page-specific payload builders
- serialized baseline refs
- route-local state

This is useful but separate from the edit route state model.

## Why This Matters

The upcoming edit redesign will fail or keep leaking bugs if the UI is refactored while
state remains fragmented. The Bundle Status issue is a symptom: the control renders from
one state path, save uses another payload path, and dirty/baseline handling is scattered.

A proper editor state boundary should:

- Normalize loader data once.
- Store `current` and `baseline` bundle editor state.
- Expose field-specific actions.
- Compute dirty state from canonical snapshots.
- Serialize save payloads consistently.
- Reset/discard reliably.
- Update baselines after successful save.
- Feed all edit UI controls from one state shape.

## Shopify Implementation Guardrails

For Save Bar, Shopify documents two valid approaches:

- `data-save-bar` on a form for standard form workflows.
- `<ui-save-bar id="...">` plus `shopify.saveBar.show(id)` / `hide(id)` for custom state
  management.

Shopify explicitly cautions not to combine the two approaches for the same form.

Reference:

- https://shopify.dev/docs/api/app-home/apis/user-interface-and-interactions/save-bar-api

For Polaris web components:

- Keep using `s-*` components for admin UI where available.
- Labels are required for form accessibility.
- Use `s-stack`, `s-grid`, and `s-box` for layouts before custom CSS.

Reference:

- https://shopify.dev/docs/api/polaris/using-polaris-web-components

## Easy Bundles Reference Findings

Chrome DevTools page 2 shows Easy Bundles handles settings and widget text differently:

- Top embedded-app header shows:
  - Page heading: `Configure Bundle Flow`
  - Readiness score value and label near the heading
  - Primary preview action nearby
  - Setup/status banner below the heading area
- Left navigation includes:
  - Step Setup
  - Free Gift & Add Ons
  - Messages
  - Discount & Pricing
  - Bundle Visibility
  - Bundle Settings
  - Subscriptions
  - Select template
- `Messages` is not just generic text labels; it includes gift-message behavior:
  - Enable Messages
  - Sender/recipient fields
  - Mandatory gift message
  - Message character limit
  - Email message toggle
  - Customize Emails
- `Bundle Settings` contains:
  - Pre Selected Product
  - Quantity validation
  - Product Slots
  - Slot icon
  - Variant selector
  - Show text on plus button
  - Pre-order/subscription integration
  - Bundle Cart title/subtitle
  - Cart line item discount display
  - Bundle Banner
  - Bundle Status

Implication for our edit redesign:

- `Widget Text` does not need to be a primary Step Setup card.
- Settings and text-like controls can live under a dedicated Bundle Settings / Messages
  section, but the design image currently omits these nav items. This is a product
  decision, not a technical inevitability.
- The edit flow should keep Wolfpack's existing readiness score component, but also
  expose the score in the top app body area like Easy Bundles. This should use the same
  score/items data as the existing overlay.
- Confirmed interaction: the top readiness score is a compact header button element with
  a changing status background. Clicking it opens the existing expandable checklist
  overlay.

## Design Options

### Option A: Pure Normalizers First

Create a pure service module:

```text
app/services/bundles/bundle-editor-state.server-or-shared.ts
```

Responsibilities:

- `normalizeBundleEditorData(loaderData)`
- `createBundleEditorBaseline(state)`
- `isBundleEditorDirty(current, baseline)`
- `serializeBundleEditorSavePayload(current)`
- `applyBundleEditorSaveResult(current, result)`

React state remains local initially.

Pros:

- Lowest risk.
- Easy to unit test.
- Avoids a large singleton migration.
- Gives us a canonical state type before moving UI.

Cons:

- Does not fully remove route-local state yet.
- Components still need hook wiring later.

### Option B: `useBundleEditorState(loaderData)` Hook

Create a dedicated hook:

```text
app/hooks/useBundleEditorState.ts
```

Responsibilities:

- Holds `current` and `baseline`.
- Exposes typed actions like `setBundleStatus`, `updateStep`, `setSearchBarEnabled`.
- Computes `isDirty`.
- Handles `discard`, `markSaved`, `toFormData`.
- Internally uses pure normalizers from Option A.

Pros:

- Best fit for current Remix/React route architecture.
- Fixes prepopulation, dirty tracking, and Bundle Status consistently.
- Keeps implementation testable with pure functions plus focused hook usage.
- Avoids overusing global state for one route.

Cons:

- Still not a cross-route singleton.
- Needs careful incremental migration from `useBundleConfigurationState`.

### Option C: Full `BundleStateService`

Create a client service object:

```text
app/services/bundles/bundle-state.service.ts
```

Responsibilities:

- Owns `current`, `baseline`, `dirtyFields`.
- Subscriptions.
- All bundle editor actions.
- Save serialization and mark-saved behavior.

Pros:

- Strongest abstraction.
- Can be reused across create/edit/DCP if extended carefully.

Cons:

- Highest migration risk.
- Existing `AppStateService` already exists and is only partially adopted; adding another
  service can increase confusion.
- Harder to use safely with Remix loader/action lifecycle unless normalizers are built
  first.

## Recommendation

Use Option B, built on Option A.

Implementation sequence:

1. Add canonical `BundleEditorState` types and pure normalizers.
2. Add tests for normalization, dirty comparison, discard baseline, and save payloads.
3. Add `useBundleEditorState(loaderData)`.
4. Migrate the edit route controls to read/write through that hook.
5. Feed both the top readiness score/status treatment and `BundleReadinessOverlay` from
   the same readiness items computed from canonical state.
6. Keep App Bridge Save Bar programmatic with `<ui-save-bar id="bundle-editor-save-bar">`
   because the editor state is custom state, not a simple native form.
7. Use `shopify.saveBar.leaveConfirmation()` before section navigation if dirty.

## Route And UI Decisions From Latest Direction

Agreed direction from user:

- Create and Edit remain separate workflows.
- Add a separate edit endpoint and stop routing edit to create configure.
- The current dashboard Edit mapping to `/app/bundles/create/configure/:bundleId` must be
  reverted/replaced.
- Use the App Embed/banner area only for breadcrumb context.
- Move `Preview on Storefront`, `Sync Bundle`, and `Add to Storefront` into the app body.
- Keep the bundle readiness score component in edit, and add the Easy Bundles-style top
  readiness score/status area in the app body.
- Do not implement Back/Next footer; use App Bridge Save Bar for unsaved changes.
- Fix Bundle Status through the state-service/hook redesign.
- Correct Step Summary.
- Keep extra features present, but decide placements before implementation.

## Open Decisions Before Implementation

| Topic | Option 1 | Option 2 | Recommendation |
|---|---|---|---|
| State architecture | Pure normalizers only | Hook + normalizers | Hook + normalizers |
| Save Bar | `data-save-bar` form | Programmatic `<ui-save-bar>` | Programmatic |
| Edit endpoint | Existing FPB/PPB routes | New shared edit route | New shared edit route if URL can preserve bundle type internally |
| Messages / Widget Text | Keep as nav item | Fold into Bundle Settings | Fold into Bundle Settings if matching Easy Bundles direction |
| Free Gift / Add-ons | Inline Step Setup | Separate nav section | Separate nav section if we keep it visible |
| Category Filters | Inline Step Setup | Keep under Assets/Filters modal | Keep under Assets/Filters modal |
| Bundle Status | Left card | Bundle Settings | Left card for quick status, backed by canonical state |
| Readiness score | Floating overlay only | Compact top score button plus overlay | Compact top score button with changing background; click opens existing overlay |
