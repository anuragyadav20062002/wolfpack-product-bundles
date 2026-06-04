---
title: EB Edit and Settings Gap Audit 2026-06-04
type: eb-audit
last_audited: 2026-06-04
---

# EB Edit and Settings Gap Audit 2026-06-04

## Scope

This audit covers the EB bundle edit page and Settings page after the visibility modal and create-tour contract fix. Evidence was captured live in Chrome from:

- EB Admin: `yash-wolfpack` app route `/brandConfig` and bundle edit route.
- WPB SIT Admin: `agent-5sfidg3m` configure route for a pending FPB bundle.
- Current WPB source: `app.settings.tsx`, `admin-configuration-surfaces.ts`, PPB and FPB configure routes.

## Confirmed This Slice

### Edit Visibility Modal

EB behavior: when a bundle edit page loads and Bundle Visibility is still `Pending`, EB shows a centered modal once per browser session:

- Title: `Your bundle visibility is not set up yet`
- Body: `Your bundle is live but shoppers have no way to find it. Set up visibility to change that.`
- Actions: `Maybe Later`, `Set Up Visibility`

WPB status after patch:

- The modal auto-opens only in edit mode, not create mode.
- The modal trigger follows the route's Bundle Visibility status instead of only app embed status.
- The modal is session-scoped by bundle id.
- `Set Up Visibility` routes the merchant into the Bundle Visibility section instead of opening an unrelated theme editor URL.

### Create Guided Tour

Current WPB source preserves the create-tour contract:

- Create redirect appends `first_load=true` only when `showFirstLoadTour` is true.
- PPB and FPB loaders compute `showFirstLoadTour` from `mode=create` plus `first_load=true`.
- Both configure routes render `BundleGuidedTour` with `enabled={loaderData.showFirstLoadTour === true}`.
- The new visibility modal auto-open is limited to `configureMode === "edit"`, so it does not compete with create-tour first load.

Chrome note: in the existing Chrome profile the guided tour did not visually reopen because the tour uses shop-level localStorage once-per-shop storage. Source and route tests confirm the signal path remains intact.

## EB Bundle Edit Page Findings

Observed on EB Product Page bundle edit:

- Left rail includes `Step Setup`, `Discount & Pricing`, `Bundle Visibility`, `Bundle Settings`, `Subscriptions`, and `Select template`.
- Bundle Settings includes:
  - `Pre Selected Product`
  - `Default products title`
  - `Choose default products`
  - `Enable Quantity Validation`
  - `Maximum allowed quantity per product`
  - Subscription/BXGY incompatibility alert
  - `Pre-order & Subscription Integration`
  - `Cart line item discount display`
  - `Bundle Level CSS`
  - `Bundle Status`

WPB follow-up status:

- The current route already has the Step Setup and Bundle Settings areas, but each section should be rechecked against the latest EB visible order before another UI patch.
- `Subscriptions` appears as a PPB rail item in EB. Do not mark this as a WPB gap until the current WPB rail is reverified in Chrome because the route source contains subscription-section wiring.

## EB Settings Page Findings

### Landing

EB Settings landing has exactly three cards:

- `Design` - `Modify and customize all design elements of the bundle here`
- `Language` - `Configure all text, labels, and translations for your bundle here`
- `Controls` - `Change loading screen gif, add custom CSS, modify checkout settings and more`

WPB status: this is already represented in `SETTINGS_CARDS`.

### Design

EB Design opens `Design Control Panel` with:

- Back button.
- `Preview Bundle`.
- Left nav: `Bundle Design`, `Brand Colors`, `Typography`, `Corners`, `Images & GIFs`.
- `Expert Color Controls` switch.
- Expert scopes: `General`, `Product Card`, `Bundle Cart`, `Upsell`.
- `Reset to default`.
- When Expert Color Controls is enabled and Brand Colors is selected, a right-panel warning appears: `Disable Expert Color Controls to access brand colors.`

WPB status: represented in the route and recently adjusted with arrow back and right-section warning. Needs a Chrome visual pass before closing earlier Design subtasks.

### Language

EB Language opens `Language Configurations` with:

- `Enable Multilanguage` checkbox.
- `Add preferred languages` combobox with 38 language labels.
- Selected language chip.
- `Shared Components` with `Cart & Checkout`.
- `Template Language` with a dark two-option layout menu:
  - `Landing Page Layout`
  - `Product Page Layout`
- Landing layout sections: `Product Card`, `Bundle Cart`, `Bundle`, `Popups`, `Toasts`, `Addons`, `Messages`.
- Product layout sections: `Product Card`, `Bundle Cart`, `Bundle`, `Toasts`.
- Product Page Product Card fields include:
  - `Product Add to Cart Button`
  - `Product Variant Label`
  - `Product Added label`
  - `Inline Product - Add Button Text`
- `Show Variables` opens a `Variables` modal. For Product Page Product Card it lists `{{allowedQuantity}}` with the description `The maximum quantity of a single, specific product that can be added.`

WPB status:

- The field inventory and language labels are represented in `LANGUAGE_CONFIGURATION`.
- The UI uses a native select styled as the layout button. EB uses a menu button, so the visible white chevron/dropdown affordance needs ongoing visual verification.
- `Show Variables` exists via `ControlsFormGroup`; verify every language group exposes it only where EB does.

### Controls

EB Controls opens `Additional Configurations` with a layout selector and layout-specific tabs.

Landing Page Layout - Configuration:

- `Show Compare At Price`
- `Hide Irrelevant variant images`
- `Track inventory on Add To Cart (in beta)` with `Know More`
- `Redirect Collection Page 'Quick Add' to Bundle`
- `Cart Messaging` with `Edit Language`
- `Bundle Items`
- `Original Bundle Price`
- `Discount Display`
- `Discount format`: amount + percentage, amount only, percentage only
- `Checkout Settings`: `Redirect to Checkout`, `Redirect to Cart`
- `Execute Script`
- `Font Settings` and `Custom Font`

Landing Page Layout - CSS & Scripts:

- `Custom CSS for bundle builder pages`
- `Custom CSS for bundle dummy product page`
- `Custom CSS for theme pages`
- Note: `Use ".gbbBundle-HTML" as parent class for giftbox builder CSS to avoid overwriting CSS throughout the site.`

Landing Page Layout - Integrations:

- `Enable Custom Theme Integration Script`
- `Custom Theme Integration Script`
- `Enable Cart Integration`
- Cart item selector fields and custom cart integration script
- `Enable Judge Me Integration`
- `Public token`

Landing Page Layout - Advanced:

- `Video Player Page Settings`
- Logo image
- `Background Color`
- `Upload file`
- `Update Image`

Product Page Layout - Configuration:

- `Hide Out Of Stock Products`
- `Track inventory on Add To Cart (in beta)`
- `Add bundle to cart after the last step is completed`
- `Display empty state boxes based on bundle condition`
- `Hide Step Titles in completed state`
- `Add to cart when product card is clicked`
- `Redirect Collection Page 'Quick Add' to Bundle`
- Same Cart Messaging group and discount format controls as Landing Page.
- `Redirect Settings`: `Execute Default Side Cart Update`, `Redirect to Checkout`, `Redirect to Cart`
- `Execute Script`

Product Page Layout - CSS & Scripts:

- `Custom CSS for Mix And Match Bundles`

WPB status:

- The Admin inventory is represented in `CONTROL_LAYOUTS`.
- Runtime wiring is incomplete. `buildControlsRuntimeData()` currently persists only combined `customCss` plus `bundleCartLineMessaging`. The rest of the Controls settings are saved under `settingsPage.controls` for Admin state, but they are not promoted into explicit runtime fields for storefront consumption.
- Specific high-priority runtime gaps:
  - FPB checkout redirect target and execute script.
  - PPB redirect setting and execute script.
  - PPB product-card click add-to-cart behavior.
  - PPB auto-add after last step behavior.
  - PPB empty-state boxes and hide-completed-step-title behavior.
  - FPB/PPB inventory-control toggles.
  - Landing/Product CSS buckets are flattened into one `customCss`; EB keeps their scope distinct.
  - Integration script and cart selector fields are not wired to storefront/cart-page runtime behavior.

## Recommended Follow-Up Order

1. Add tests around `buildControlsRuntimeData()` for the missing runtime fields and CSS scope separation.
2. Wire Controls runtime into DesignSettings for both `full_page` and `product_page` where EB applies them.
3. Connect the PPB/FPB storefront widgets to the promoted runtime fields.
4. Re-run Chrome Admin-to-storefront verification for each Controls group with one field changed at a time.
5. Do a final EB/WPB visual pass over Settings subpages after runtime wiring is complete.
