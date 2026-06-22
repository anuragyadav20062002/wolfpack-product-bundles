# Test Spec: Redux State Management
**Spec ID:** redux-state-management  **Created:** 2026-06-21

## Purpose
Move Admin client UI, preferences, design settings, and shared configure draft state from `AppStateService` to Redux Toolkit, and use RTK Query only for approved standalone Admin API calls.

## Test Cases
### UiSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Open and close keyed modal | `openModal("billing_cancelConfirm")`, `closeModal(...)` | Modal key flips true then false | Preserves existing modal IDs |
| 2 | Add and hide toast | `showToast({ message, isError })`, `hideToast(id)` | Toast is visible with ID, then removed | ID may be injected for deterministic tests |
| 3 | Update navigation and loading | Partial navigation, boolean loading | Existing navigation fields are preserved | Matches `AppStateService` behavior |

### PreferencesSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Merge preferences | `{ theme: "dark" }` | Other defaults remain | localStorage persistence handled by middleware/listener |
| 2 | Add recent bundle | Same ID repeatedly, more than 10 IDs | ID is deduped, newest first, max 10 | Matches current service cap |

### DesignSettingsSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Set settings by bundle type | full page/product page settings | Correct bucket updates and dirty clears | Server persistence unchanged |
| 2 | Update selected setting | selected type + key/value | Selected bucket changes and dirty is true | No-op when selected settings are absent |

### BundleConfigureSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Update form field | form baseline, field update | Form changes and dirty is true | Shared configure draft only |
| 2 | Remove step | step with related conditions/collections | Step and related keyed data are removed | Matches cleanup in old service |
| 3 | Clear draft | any draft state | Default draft state restored | Used by discard/reset flows |

### AdminApi
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | List store files | `{ cursor, query }` | GET `/app/store-files?...` | Query params omit empty values |
| 2 | Upload store file | `File/FormData` | POST `/app/upload-store-file` | Multipart body is passed through |
| 3 | Poll upload status | `fileId` | GET `/app/upload-store-file?fileId=...` | Used by FilePicker |
| 4 | Ensure product template | product handle + bundle ID | POST `/api/ensure-product-template` JSON | Standalone client mutation only |

### AdminRouteStateSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Dashboard delete modal | `openDashboardDeleteModal(bundleId)`, close | Modal opens with bundle ID, then clears | Replaces local dashboard hook state |
| 2 | Billing route feedback | initialize from loader, dismiss/show banners | Success/error banners match loader and actions | Replaces local billing hook state |
| 3 | Cart transform modal and form | open, set fields, close/reset | Modal opens, form values update, close clears | Replaces local cart-transform hook state |
| 4 | Dashboard filters and pagination | search/type/status/per-page/page actions | Filters update, filter/per-page changes reset page to 1 | Replaces dashboard route filter `useState` |

### ConfigureRouteStateSlice
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Initialize shared configure route state | bundle product, collections, rule messages | Product, collection, rule-message, navigation defaults are set | Used by FPB and PPB configure hooks |
| 2 | Configure modal flow | open products/collections/page/widget modals, close | Modal booleans and current step ID update | Replaces modal `useState` in `useBundleConfigurationState` |
| 3 | Page and product draft data | pages, selected page, product title/status/image | Values are stored and dirty is marked for product edits | Keeps persistence unchanged |
| 4 | Selected collections and rule messages | replacement and updater-style values | State updates exactly and marks dirty | Supports existing setter call sites |
| 5 | Navigation and banners | active tab/section, force nav, auto banner, dismissed IDs | Values update without affecting server state | Replaces route navigation `useState` |

## Acceptance Criteria
- [ ] All listed unit tests pass
- [ ] Existing hook return shapes remain compatible
- [ ] No production code imports `appStateService`
- [ ] RTK Query owns only approved standalone endpoints
- [ ] State architecture docs are linked from `internal docs/index.md`
