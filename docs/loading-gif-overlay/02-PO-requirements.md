# Product Owner Requirements: Loading GIF Overlay

## User Stories with Acceptance Criteria

### Story 1: Merchant configures a loading GIF (full-page bundle)
**As a** merchant configuring a full-page bundle
**I want** to upload a GIF in the Images & GIFs section
**So that** shoppers see my branded animation during wait states

**Acceptance Criteria:**
- [ ] Given I am on the full-page configure page, when I navigate to "Images & GIFs", then I see an existing "Promo Banner" card AND a new "Loading GIF" card below it.
- [ ] Given the Loading GIF card, when I upload a GIF, then the URL is persisted on save.
- [ ] Given I clear the GIF, when I save, then `loadingGif` is set to null in DB and metafield.

### Story 2: Merchant configures a loading GIF (product-page bundle)
**As a** merchant configuring a product-page bundle
**I want** to see an "Images & GIFs" section
**So that** I can upload a loading GIF for my inline widget

**Acceptance Criteria:**
- [ ] Given I am on the product-page configure page, when I look at the nav tabs, then I see an "Images & GIFs" tab (currently absent).
- [ ] Given the Images & GIFs section, when I upload a GIF, then the URL is persisted on save.
- [ ] The section contains only the "Loading GIF" card (no promo banner — that's full-page only).

### Story 3: Loading overlay during initial bundle load
**As a** shopper landing on a bundle page or product page with a bundle widget
**I want** to see a loading indicator while the bundle data is fetching
**So that** I know the page is working and not broken

**Acceptance Criteria:**
- [ ] Given the widget initialises, when `init()` is called, then a loading overlay appears immediately over the widget container.
- [ ] Given the overlay is showing, when bundle data has been fetched and the UI is rendered, then the overlay fades out (200 ms) and is removed from the DOM.
- [ ] Given no `loadingGif` is configured, then a CSS spinner is shown instead of a GIF.
- [ ] Given a `loadingGif` is configured (full-page: already known from dataset; product-page: from `data-bundle-ui-config`), then the GIF image is shown.

### Story 4: Loading overlay during step transitions (full-page only)
**As a** shopper using a full-page bundle
**I want** to see a loading indicator when I navigate between steps
**So that** I know the next step's products are loading

**Acceptance Criteria:**
- [ ] Given I click "Next Step" or a step tab, when `loadStepProducts()` begins, then the loading overlay appears over the widget container.
- [ ] Given `loadStepProducts()` completes, when the new step UI renders, then the overlay fades out.
- [ ] Given `loadingGif` is configured, the GIF is shown; otherwise the spinner is shown.

### Story 5: Loading overlay during Add to Cart / Add Bundle To Cart
**As a** shopper completing a bundle
**I want** to see a loading indicator and disabled button when I click "Add to Cart"
**So that** I know my cart is being updated and I don't double-click

**Acceptance Criteria:**
- [ ] Given I click the Add to Cart button, when the fetch begins, then the overlay appears AND the button is disabled.
- [ ] Given the fetch resolves (success or error), then the overlay fades out AND the button is re-enabled.
- [ ] This applies to both full-page ("Add to Cart") and product-page ("Add Bundle To Cart").

## UI/UX Specifications

### Overlay component
- **Background:** `rgba(0, 0, 0, 0.45)` semi-transparent dark backdrop
- **Position:** `position: absolute; inset: 0` within the widget container
- **Parent requirement:** Widget container must have `position: relative`
- **Z-index:** `50` (relative within container — above content, below external modals)
- **Transition:** `opacity 0.2s ease` fade in/out; CSS class `is-visible` drives state
- **GIF image:** `max-width: 120px; max-height: 120px; width: auto; height: auto; display: block`
- **Fallback spinner:** 40px circle, white border, `border-top-color: #fff`, `animation: bundle-spin 0.75s linear infinite`
- **Border radius:** `inherit` from container (so corners match widget shape)

### Loading GIF card (Images & GIFs section)
- Icon: `GiftCardIcon` or `ImageIcon`
- Heading: "Loading Animation"
- Subtext: "GIF only · max 120×120 px recommended"
- Component: `FilePicker` (no crop — GIFs are not croppable)
- Placement: Below "Promo Banner" card (full-page) or first card (product-page)

### Nav tab for product-page configure
- `{ id: "images_gifs", label: "Images & GIFs", icon: ImageIcon }`
- Does NOT have `fullPageOnly: true` flag

## Data Persistence

| Field | Model | Type | Notes |
|-------|-------|------|-------|
| `loadingGif` | `Bundle` | `String?` | Nullable GIF URL |

- Synced to `bundle_ui_config` JSON metafield as `loadingGif: string \| null`
- Returned by `/api/bundle/:bundleId.json` in bundle response root
- Widget reads from `selectedBundle.loadingGif`

## Backward Compatibility Requirements

- Existing bundles without `loadingGif` → field is `null` → widget shows CSS spinner
- No migration required for product-page bundles (previously had no image fields at all)
- Default Prisma value: `null` (optional field, no `@default` needed)

## Out of Scope (explicit)

- Promo banner on product-page configure (remains full-page only)
- Overlay colour/opacity customisation
- Video or APNG support
- Loading overlay for variant selector modals within steps
