# EB Settings and Integrations Replication Evidence

**Issue:** `eb-replication-recovery-1`
**Captured:** 2026-06-01
**Store:** `yash-wolfpack.myshopify.com`
**Source:** Live Shopify Admin Chrome inspection of EB embedded app plus deployed Next.js route manifest.

## Redaction Policy

All live `hmac`, `id_token`, `session`, JWT, app session token, storefront access token, Mantle token, Crisp user hash, and similar credential values must be redacted from committed artifacts.

Do not commit raw `.network-request` artifacts from this investigation unless they have been manually redacted first.

## Scope

Primary focus:
- Settings / brand configuration.
- Integrations.
- Bundle Visibility.
- Bundle Widget.
- Bundle Embed.
- Bundle Settings.
- Subscriptions.
- Select template.

This document currently covers the first pass for Settings and Integrations.

## Deployed Route and Bundle Evidence

EB is a Next.js app served from:

```text
https://prod.frontend.giftbox.giftkart.app
```

Route map from `_buildManifest.js`:

```text
/
/_error
/analytics
/bfcm
/brandConfig
/checkoutwizupsell
/flyupsell
/help
/integrations
/kiteupsell
/lcp-page
/partners
/pricing
/successsuite
```

Settings route assets:

```text
/_next/static/css/037b611fcfe644e1.css
/_next/static/chunks/pages/brandConfig-e955e1a1e2e5ce85.js
```

Integrations route assets:

```text
/_next/static/css/2ada0b646b17cf49.css
/_next/static/chunks/pages/integrations-9640b0fbcbe3f36a.js
```

Common boot assets:

```text
/_next/static/css/708bd0109ea551ac.css
/_next/static/chunks/webpack-d17b3fc9556293c0.js
/_next/static/chunks/framework-945b357d4a851f4b.js
/_next/static/chunks/main-a40d62d9a67826bd.js
/_next/static/chunks/pages/_app-9ab39cfbc58d9cb3.js
https://cdn.shopify.com/shopifycloud/app-bridge.js
```

## Settings Landing Page

Route:

```text
/brandConfig
```

Page title:

```text
Settings
```

Landing cards:

| Card | Description | Action |
|---|---|---|
| Design | Modify and customize all design elements of the bundle here | Configure |
| Language | Configure all text, labels, and translations for your bundle here | Configure |
| Controls | Change loading screen gif, add custom CSS, modify checkout settings and more | Configure |

Initial Settings data reads observed:

```text
GET /api/utility/isAppEmbedEnabled?shopName={shop}
GET /api/saveLanguage/read?shopName={shop}
GET /api/pageCustomization/read?shopName={shop}
GET /getAllData?shopName={shop}&requestFrom=HOME_PAGE
GET /getAllData?shopName={shop}
```

`getAllData` contains sensitive fields and must be redacted before documentation. Useful non-secret schema areas observed include:

```text
userData.bundleSettings
userData.customSettings
userData.customSettings.integrations
userData.paywalls
allBundlesData
mixAndMatchBundles
shopInfoData
```

## Settings: Design Control Panel

Entry:

```text
Settings -> Design -> Configure
```

Page title:

```text
Design Control Panel
```

Top actions:

```text
Back
Preview Bundle
```

Primary section:

```text
Bundle Design
Customize your bundle in a few clicks
```

Tabs:

```text
Brand Colors
Typography
Corners
Images & GIFs
```

Expert controls:

```text
Expert Color Controls
Change colors of individual elements of the bundle
```

Expert subsections are visible as labels:

```text
General
Product Card
Bundle Cart
Upsell
```

### Brand Colors

Control inventory:

| Label | Help text | Default observed |
|---|---|---|
| Primary Color | Action buttons, progress bars, and active elements | `#000000` |
| Button Text Color | Text displayed on primary buttons and action elements | `#ffffff` |
| Primary Text Color | Product names, prices, labels, and main content text | `#000000` |
| Secondary Color | Secondary elements, empty progress bars, and inactive states | `#eeeeee` |
| Product Background Color | Background color for product cards and cart footer | `#ffffff` |

Each color uses:

```text
Hex Code textbox
ColorWell
```

There is a `Reset to default` action.

### Typography

Control inventory:

| Group | Help text | Font size | Weight controls |
|---|---|---:|---|
| Primary | Titles, prices, and primary text elements | 16px | Regular, Bold; Bold selected |
| Secondary | Compare prices, discount messaging, and secondary text | 14px | Regular, Bold; Bold selected |
| Body | Variant selectors and general body text | 14px | Regular, Bold; Regular selected |

Font size controls are numeric spinbuttons with visible `px` suffix.

### Corners

Control inventory:

| Group | Help text | Style options | Base radius |
|---|---|---|---:|
| Bundle Buttons | Corner roundness for all buttons and action elements | Sharp, Base, Round; Base selected | 5px |
| Product Card & Cart | Toggle between rounded and sharp corners | Sharp, Base; Base selected | 10px |

Radius helper text:

```text
Used when Corner Style is set to 'Base'
```

### Images & GIFs

Control inventory:

| Group | Control | Options / value |
|---|---|---|
| Product Images | Image Fit | Cover selected, Contain, Fill |
| Loading spinners | Bundle Loading GIF | `Loading_Spinner.gif`, Remove action |
| Loading spinners | Checkout GIF | `Loading_Spinner_Checkout.gif`, Remove action |

Help text:

```text
Choose how product images should be displayed in cards
This gif is displayed on the initial load of the bundle
This gif is displayed after the customer completes the bundle
```

### Unsaved Change Behavior

Toggling `Expert Color Controls` creates Shopify contextual save bar:

```text
Unsaved changes
Discard
Save
```

Clicking `Discard` opens modal:

```text
Discard all unsaved changes
If you discard changes, you'll delete any edits you made since you last saved.
Continue Editing
Discard Changes
```

Iframe pointer interactions can be flaky. Keyboard focus plus `Space` worked for toggling the checkbox.

## Integrations Hub

Route:

```text
/integrations
```

Page title:

```text
Integrations Hub
```

Subtitle:

```text
Browse supported integrations to extend your bundle capabilities.
```

Top action:

```text
Request Integration
```

Integration categories and cards:

| Category | Category description | App | Card description | Action |
|---|---|---|---|---|
| Pre-orders, Pickup & Delivery | Let customers pre-order or schedule pickup and delivery for bundled products. | Stoq | Pre-order out-of-stock items within your bundles | View Setup |
| Pre-orders, Pickup & Delivery | Let customers pre-order or schedule pickup and delivery for bundled products. | Zapiet | Schedule store pickup & delivery for bundle orders | View Setup |
| Subscriptions | Enable recurring purchases so customers can subscribe to their favorite bundles. | Skio | Add subscription selling plans to bundled products | View Setup |
| Subscriptions | Enable recurring purchases so customers can subscribe to their favorite bundles. | Appstle | Enable subscribe-and-save options on your bundles | View Setup |
| Subscriptions | Enable recurring purchases so customers can subscribe to their favorite bundles. | Bold | Set up recurring bundle subscriptions via Bold | View Setup |
| Reviews | Show social proof by displaying product ratings within your bundles. | Judge.me | Display star ratings and reviews on your bundles | View Setup |
| Page Builders | Build custom landing pages and sections to showcase your bundles. | PageFly | Create custom landing pages to showcase bundles | View Setup |
| Page Builders | Build custom landing pages and sections to showcase your bundles. | GemPages | Build high-converting pages for your bundle store | View Setup |
| Checkout | Ensure bundles work smoothly through native and third-party checkout flows. | Gokwik | Streamlined Indian checkout experience for bundles | View Setup |
| Checkout | Ensure bundles work smoothly through native and third-party checkout flows. | Shopflo | Optimized Indian checkout flow with bundle support | View Setup |

Logo assets:

```text
https://d3ks0ngva6go34.cloudfront.net/public/Stoq.avif
https://d3ks0ngva6go34.cloudfront.net/public/Zapiet.avif
https://d3ks0ngva6go34.cloudfront.net/public/Skio.avif
https://d3ks0ngva6go34.cloudfront.net/public/Appstle.avif
https://d3ks0ngva6go34.cloudfront.net/public/Bold.avif
https://d3ks0ngva6go34.cloudfront.net/public/Judgeme.avif
https://d3ks0ngva6go34.cloudfront.net/public/Pagefly.avif
https://d3ks0ngva6go34.cloudfront.net/public/Gempages.avif
https://d3ks0ngva6go34.cloudfront.net/public/Gokwik.avif
https://d3ks0ngva6go34.cloudfront.net/public/Shopflo.avif
```

Initial Integrations data reads observed:

```text
GET /api/utility/isAppEmbedEnabled?shopName={shop}
GET /getAllData?shopName={shop}&requestFrom=HOME_PAGE
```

No integration-specific write was triggered in this first pass.

## Current Replication Notes

- Settings landing should be a three-card hub before entering detailed panels.
- Design sub-flow should preserve EB tab labels, help text, default values, contextual save bar behavior, and discard modal copy.
- Integrations should initially be a categorized static hub with `View Setup` per app and `Request Integration` at the top.
- Exact setup-modal behavior for every `View Setup` button is not yet captured and remains required for 100% parity.
- Language and Controls sub-flows are not yet captured and remain required for Settings parity.

## Next Capture Pass

- Open each `View Setup` integration and record modal/link behavior.
- Capture `Request Integration` behavior.
- Capture `Language -> Configure`.
- Capture `Controls -> Configure`.
- Capture save payloads using harmless edits only after confirming a reversible change path.
- Capture Bundle Visibility, Bundle Widget, Bundle Embed, Bundle Settings, Subscriptions, and Select template from bundle edit flow.

## Settings - Language Configuration

Evidence source: live EB Settings UI in Shopify Admin plus `/_next/static/chunks/pages/brandConfig-e955e1a1e2e5ce85.js`.

### Visible UI

- Page title: `Language Configurations`.
- Back button label: `Settings`.
- `Enable Multilanguage` is enabled on the observed store.
- Helper text: `Select the language mode for your app`.
- Preferred-language selector shows `English` selected.
- Supported language options captured from the combobox: English, Arabic, Bulgarian (BG), Catalan, Chinese (CN), Chinese (TW), Croatian, Czech, Danish, Dutch, Estonian, Finnish, French, Georgian, German, Greek, Hebrew, Hungarian, Indonesian, Italian, Japanese, Korean, Latvian, Lithuanian, Norwegian Bokmal, Polish, Portuguese (BR), Portuguese (PT), Romanian, Russian, Slovak (SK), Slovenian (SI), Spanish, Swedish, Thai, Turkish, Vietnamese, Norwegian.
- Selected languages render as removable language chips; observed chip: `English`.
- Shared Components card: heading `Shared Components`, description `Customize language for components across all templates`, action `Cart & Checkout`.
- Template Language card: heading `Template Language`, description `Edit language for your landing page or product page template`.
- Template layout dropdown options include `Landing Page Layout` and `Product Page Layout`.
- Landing Page Layout section navigation includes Product Card, Bundle Cart, Bundle, Popups, Toasts, Addons, Messages.

### Language fields observed

- Product Card -> Button Configuration: `Add Product to Bundle Button`, value `Add To Box`.
- Shared Components -> Cart & Checkout fields:
  - `Bundle Contains Label`, value `Items`.
  - `Bundle Original Price Label`, value `Retail Price`.
  - `Bundle Cart Discount Display Label`, value `You Save`.

### Bundle evidence

The Settings route bundle contains these language feature key families:

- `UnifiedLanguageSettings.header.*` for multilanguage header state and language selection.
- `UnifiedLanguageSettings.tags.removeLanguage` for language chip removal.
- `UnifiedLanguageSettings.sharedCartAndCheckout.*` for Cart & Checkout fields.
- `UnifiedLanguageSettings.sidebar.*` for shared-vs-template navigation.
- `UnifiedLanguageSettings.fieldRenderer.*`, `fieldsRenderer.*`, and `variablesModal.*` for field rendering and variable insertion.
- Toast keys: `UnifiedLanguageSettings.toasts.savedSuccessfully` and `UnifiedLanguageSettings.toasts.somethingWentWrong`.

Implementation implication: language parity needs a reusable language settings model with separate shared components, template-specific sections, variable metadata, multilingual language chip management, and save/discard behavior. Do not model this as a flat copy-only text form.

## Settings - Additional Configurations / Controls

Evidence source: live EB Settings UI plus Settings route bundle.

### Route and layout

- Entry: Settings landing -> Controls -> Configure.
- Page title: `Additional Configurations`.
- Back button label: `Back`.
- Header copy: `App Configurations` / `Configure your bundle settings`.
- Top layout selector has at least two modes: `Landing Page Layout` and `Product Page Layout`.
- Primary tabs: Configuration, CSS & Scripts, Integrations, Advanced.

### Landing Page Layout - Configuration tab

- Section: `Bundle Settings`, description `Additional bundle level settings applicable to all bundles created`.
- Observed toggles:
  - Show Compare At Price: checked.
  - Hide Irrelevant variant images: unchecked.
  - Track inventory on Add To Cart (in beta): unchecked, with `Know More` action.
  - Redirect Collection Page 'Quick Add' to Bundle: checked.
- Cart Messaging group:
  - master checkbox: checked.
  - action: `Edit Language`.
  - Bundle Items: checked, help text says it shows individual bundle items.
  - Original Bundle Price: checked, help text says it shows retail price before bundle discount.
  - Discount Display: checked, help text says it shows customer savings.
  - Discount format combobox options: amount and percentage, amount only, percentage only.
- Checkout Settings:
  - Redirect to Checkout: selected.
  - Redirect to Cart: unselected.
  - Execute Script multiline textbox.
- Font Settings:
  - Custom Font textbox.
  - Note says storefront theme font is used by default.

### Product Page Layout - Configuration tab

- Section: `Bundle Settings`, same global description.
- Observed toggles:
  - Hide Out Of Stock Products: checked.
  - Track inventory on Add To Cart (in beta): unchecked.
  - Add bundle to cart after the last step is completed: unchecked.
  - Display empty state boxes based on bundle condition: checked.
  - Hide Step Titles in completed state: unchecked.
  - Add to cart when product card is clicked: checked.
  - Redirect Collection Page 'Quick Add' to Bundle: checked.
- Cart Messaging group mirrors Landing Page Layout.
- Redirect Settings:
  - Execute Default Side Cart Update: selected.
  - Redirect to Checkout: unselected.
  - Redirect to Cart: unselected.
  - Execute Script multiline textbox.

### CSS & Scripts tab

CSS subtab:

- Custom CSS for bundle builder pages.
- Custom CSS for bundle dummy product page.
- Custom CSS for theme pages, described as global impact across store pages.
- EB warns to use `.gbbBundle-HTML` as parent class to avoid global overrides.

JavaScript & Selectors subtab:

- Custom JS Bundle Script: applies only on bundle pages.
- Button Selectors:
  - Add to Cart Button Selectors.
  - Buy now button.

### Integrations tab

- Custom theme integration script:
  - Enable Custom Theme Integration Script checkbox.
  - Custom Theme Integration Script multiline textbox.
  - Copy says it applies only to theme pages, not bundle pages.
- Cart integration script:
  - Enable Cart Integration checkbox.
  - Cart Item Selectors.
  - Cart Item Remove Parent Selectors.
  - Cart Item Remove Selectors.
  - Cart Item Quantity Button Selectors.
  - Custom Cart Integration Script multiline textbox.
  - Copy states it hides quantity selector, overwrites remove button, and enforces removal of all bundle products if one bundle item is removed.
- Judge.me integration:
  - Enable Judge Me Integration checkbox.
  - Public token textbox. Treat this as sensitive operational credential material if populated; never log values.

### Advanced tab

- Section: Video Player Page Settings.
- Copy: Customize the video player page of the bundle video message.
- Default logo image uses a CloudFront `default-no-logo.jpg` asset.
- Background Color defaults to `#ffffff`.
- Upload file control plus `Update Image` action.

### Bundle evidence - hidden/keyed controls

The Settings route bundle contains additional key families not all visible in the current viewport:

- General controls: cart transformation visibility (`hideBundleIdentifier`, `hideIndividualItemDetails`, `hideBoxId`), storefront flags (`enableThirdPartyCheckout`, `enableStorefrontGqlApi`, `enableAutomaticBoxTierDowngrade`, `preventBundlePropertyModifications`, `enableExpandOperation`, `removeStandaloneParentProduct`), backend/admin flags, limits, selectors, and custom scripts.
- Product Page controls: product image positioning, bundle contents drawer, theme add-to-cart integration, custom add-to-cart, separate subtotal display, auto-display, single-step categories, purchase-options pricing, B2B catalog pricing, out-of-stock button display, image compression, horizontal slot rendering, native ATC payload validation, locale matching, metafield integration, and custom scripts.
- Full Page controls: auto-display, speed optimization, custom product image position, gift-message behavior, order-line category names, default-product removal, collection quick-add redirect, dummy out-of-stock protection, video message, image compression, translated product handles, gift-message virtual product, cart transformation/legacy discount switches, metafield integration, selectors, and custom scripts.
- Recovery controls: restore user data, page customization, language data, bundle analytics, and deleted bundles.

Implementation implication: Controls should be treated as a high-risk parity surface. It has merchant-facing controls, developer-only selectors/scripts, per-layout branching, and sensitive-token fields. Values must be redacted in logs and docs.

## Integrations - Bundle Evidence and Setup Links

Evidence source: live EB Integrations UI plus `/_next/static/chunks/pages/integrations-9640b0fbcbe3f36a.js`.

### Route behavior

- Page route: `/integrations`.
- Route CSS: `/_next/static/css/2ada0b646b17cf49.css`.
- Route bundle: `/_next/static/chunks/pages/integrations-9640b0fbcbe3f36a.js`.
- Data reads observed: app embed status, HOME_PAGE `getAllData`, and Crisp hash generation.

### Setup action behavior

- Integration cards call an intent-notification function before opening setup or chat.
- Cards with `ctaUrl` open the setup article in a new tab with `noopener,noreferrer`.
- Cards with `ctaType: chat` initiate an EB chat flow instead of opening a URL. Zapiet is confirmed as chat-based.
- Request Integration also sends an integration-intent notification based on shop name and Shopify plan; do not trigger casually during investigation because it notifies EB/team systems.
- Clean-room implementation note: when external article URLs or outbound chat notifications are not triggered from our Admin route, the UI should still distinguish setup-guide outcomes from chat-setup outcomes by consuming the recovered `ctaType`.

### Setup link map from the deployed bundle

- Stoq -> `https://easybundles-help.skailama.app/en/article/dxyj0o`.
- Zapiet -> chat action, no setup URL in bundle.
- Skio -> `https://easybundles-help.skailama.app/en/article/12nd3lb`.
- Appstle -> `https://easybundles-help.skailama.app/en/article/12nd3lb`.
- Bold -> `https://easybundles-help.skailama.app/en/article/12nd3lb`.
- Judge.me -> `https://easybundles-help.skailama.app/en/article/1tmhu74`.
- PageFly -> `https://easybundles-help.skailama.app/en/article/h9gw6d`.
- GemPages -> `https://easybundles-help.skailama.app/en/article/h9gw6d`.
- Gokwik -> `https://easybundles-help.skailama.app/en/article/15cl0fo`.
- Shopflo -> `https://easybundles-help.skailama.app/en/article/15cl0fo`.

### Stoq setup article facts captured

- Stoq integration enables pre-order options for individual products inside bundles.
- Products must be configured in Stoq pre-order plans and Stoq `Continue Selling` must be enabled for the relevant products.
- EB activation path: select bundle -> Bundle Settings -> enable `Individual Selling Plans`.
- Display behavior has two modes:
  - All Products: Stoq-plan products show pre-order options regardless of stock.
  - Only Out-of-Stock: Stoq-plan products show pre-order only when inventory is zero/out of stock.
- If multiple selling plans exist, EB shows a customer selection popup. If one plan exists, EB applies it automatically.
- Main bundle add-to-cart text does not change to pre-order; it remains the merchant's configured add-to-cart text.
- Pre-order tag text and related strings are language-configurable.

Open follow-up evidence needed before implementation:

- Read Skio/Appstle/Bold shared setup article.
- Read Judge.me setup article.
- Read PageFly/GemPages setup article.
- Read Gokwik/Shopflo setup article.
- Exercise Zapiet chat setup enough to capture displayed guidance without sending avoidable outbound messages.

## Bundle Edit Flow - Target Sections First Pass

Evidence source: live EB bundle edit flow for `WPB Research Landing Bundle 2026-05-22`, help article opened from EB quick guide, and deployed lazy chunks from the active route.

### Deployed lazy chunk ownership

The bundle edit flow is not fully contained in the Next index route bundle. The relevant lazy chunks found in the network trace are:

- `/_next/static/chunks/5293.938f3aa8950b8aca.js`: readiness/navigation labels and section identifiers for Bundle Visibility, Bundle Widget, Bundle Embed, Bundle Settings, Subscriptions, and Select template.
- `/_next/static/chunks/3414.bf774e0bebf6f323.js`: main bundle edit section behavior including bundle visibility state, upsell widget state, bundle settings, subscription gating, template selection modal, bundle design fields, and analytics/state keys.
- `/_next/static/chunks/9919.17da7d7a8523b9b9.js`: detailed Bundle Visibility card copy, Subscription component copy/configuration, Subscription multilanguage modal keys, template selection modal tabs/actions/end screens, and template identifiers.

Important code-level state/key families found:

- Bundle visibility: `bundleVisibility`, `BundleVisibilityCard.*`, `BundleVisibilityModal.*`, `BundleVisibilityClick`, `BundleVisibilitySet`.
- Bundle widget/embed: `bundleWidget`, `bundleUpsellConfig`, `bundleUpsellStatus`, `BundleUpsell`, `Embed`, `EmbedState`, `EmbedClick`, `EmbedEnabled`, `embedWidget`, `embedButton`.
- Bundle settings: `bundleSettings.*`, `bundleCartRepresentationObj`, `bundleTextConfig`, `bundleBanners`, `bundleCss`, `individualSellingPlan`.
- Subscriptions: `SubscriptionComponent.*`, `SubscriptionPlansModal`, `SubscriptionPlansListModal.*`, `SubscriptionGroup`, `SubscriptionData`, `SubscriptionMultiLangModal.*`.
- Select template: `TemplateSelectionModal.*`, `templatesList`, `bundleDesignTemplate`, `bundleDesignTemplateId`, `bundleDesignTemplateData`, `templateId`, `bundleDesignPresetId`, `templateSelection`.

### Configure Bundle Flow shell

Observed shell state:

- Page title: `Configure Bundle Flow`.
- Readiness Score: `60`.
- Top action: `Preview Bundle`.
- Bundle product section: `Sync Product`, bundle name `WPB Research Landing Bundle 2026-05-22`, `Edit Product`.
- Parent Product Status shows `Info Complete` and `Unlisted`.
- Sidebar/setup nav includes Step Setup, Discount & Pricing, Bundle Visibility, Bundle Widget, Bundle Settings, Subscriptions, Select template.
- Bundle Visibility status showed warning/complete/pending state in the readiness sidebar.

### Bundle Visibility

Observed UI:

- Section includes `App Embed Status`.
- Enabled state copy: store is connected and ready, and the bundle can render on the storefront.
- Status badges/labels: `Success`, `Enabled`.
- `Publishing Best Practices` section copy tells merchant to pick a placement and follow the guide.
- Placement cards:
  - Hero Banner: add a homepage hero button linking to the bundle.
  - Navigation Menu: add the bundle as a navigation link available across the store.
  - Announcement Banner: show the offer in the announcement bar.
  - Featured Product Card: feature the bundle product on the homepage.
- Each placement card has `Quick Setup Guide` and `5 min setup`.
- Bundle URL field is disabled/read-only and observed value pattern is `/apps/gbb/easybundle/{bundleId}`.
- `Copy Link` action is present.
- Placement options section includes Bundle Widget and Bundle Embed paths. Observed Bundle Widget CTA: `Set up Bundle Widget`.

### Bundle Visibility quick guide article

Opening the quick guide launches `https://easybundles-help.skailama.app/en/article/classic-bundle-visibility-quick-guides-93a59f/` in a new tab.

The article covers four guides:

- Hero Banner: copy bundle link, open Shopify theme editor, add/select Image Banner section, set button label/link, save.
- Navigation Menu: copy bundle link, go to Content -> Menus -> Main menu, add menu item with bundle link, save.
- Announcement Banner: copy bundle link, open theme editor, enable announcement bar, add offer copy and bundle link, save.
- Featured Product Card: add bundle product to a collection, open theme editor, select Featured Collection, choose that collection, set low max-products count, save.

Implementation implication: our Bundle Visibility parity needs both in-app placement cards and route-to-help behavior. The generated link field must be copyable and read-only, and app-embed status must be surfaced before placement cards.

### Bundle Widget / Bundle Embed

Observed after selecting `Set up Bundle Widget`:

- Section heading: `Product Page Bundle Upsell Widgets`.
- Master checkbox is present and initially off in observed state.
- Copy: displays an upsell block or button on selected product pages.
- Preview image asset: `UpsellButton.webp`.
- Radio options:
  - Offer Upsell Block.
  - Offer Upsell Button, selected in observed state.
- Status/help copy: select whether upsell block or button appears on product pages.
- Widget Settings:
  - `Multi Language` button is disabled in observed state.
  - Button Text field value: `Save More With Bundle`.
  - Display Widget on radio group: All products in bundle selected, Specific products, Specific collections.
  - `Add browsed product to bundle` checkbox.
- Embed area:
  - Heading: `Embed the Upsell Button at a custom location`.
  - Copy says default position is below the Buy Button and merchant can move it to a custom product-page spot.
  - Action: `Embed Upsell Button`.

Implementation implication: Bundle Widget and Bundle Embed are a shared upsell-widget feature with a default automatic placement plus optional custom placement flow. The widget has product/collection targeting and language support, but language is disabled unless the master/state permits it.

### Bundle Settings

Observed UI:

- Pre Selected Product:
  - Master checkbox.
  - Copy: choose products added by default.
  - Tip warns discounts are based on all cart items and preselected quantities/amounts must be included in discount setup.
  - Copy says products are automatically added to the user's box on the first step.
  - `Browse Products` action.
- Enable Quantity Validation:
  - Master checkbox.
  - Disabled numeric input `Maximum allowed quantity per product`, observed value `1`.
- Product Slots:
  - Master checkbox.
  - Copy: displays empty slots on storefront.
  - Slot Icon upload, `Change Icon`, `Reset`.
  - Note: only applicable when rules are based on quantity.
- Variant Selector:
  - Master checkbox checked.
  - Copy: enable variant selection within product cards instead of quick look.
- Show Text on + Button:
  - Master checkbox off.
  - Copy: replaces + icon with text button and moves it below price.
- Pre-order & Subscription Integration:
  - Warning: individual selling plans cannot be enabled while bundle-level subscription or BXGY discount is active.
  - Master checkbox off.
  - Copy: lets customers select a unique selling plan for each product in the bundle.
- Bundle Cart:
  - `Multi Language` action.
  - Bundle Cart Title value: `Your Bundle`.
  - Bundle Cart Subtitle value: `Review your bundle`.
  - Cart line item discount display with `Edit Defaults`.
  - Radio options: Use app defaults selected, Customize for this bundle.
- Bundle Banner:
  - Desktop upload, recommended size 1900x230.
  - Mobile upload, recommended size 1100x500.
- Bundle Level CSS heading appears below banner controls.
- Bundle Status combobox options: Active selected, Draft.

Implementation implication: Bundle Settings includes storefront rendering settings, cart text, per-bundle discount display override, media uploads, per-product selling-plan controls, and publish status. This is not just metadata.

### Subscriptions

Observed UI:

- Heading: `Bundle Subscriptions`.
- `How to setup?` action.
- Copy: allow customers to purchase the bundle as a subscription.
- Warning: subscriptions cannot be enabled on bundles with Buy X, Get Y discounts; use a different discount type to enable subscriptions.
- `Get Subscription Plans` button disabled in observed state.

Bundle evidence indicates a fuller state when enabled:

- Plan selection/list modal keys: `SubscriptionPlansModal`, `SubscriptionPlansListModal.*`, `availableSellingPlans`, `newlyAdded`, and `saveSelection`.
- Plan tiers: flat percentage off, fixed price, flat amount off, plan display name, discount pill, option description, make-plan-default.
- Configurations include recurring discounts, one-time purchase, one-time-purchase label/description, make one-time purchase default, and controls for when bundle discount applies.
- Multilanguage modal fields exist for subscription title, tier labels, plan name in dropdown, discount pill, subscription option description, one-time purchase label, and one-time purchase description.

Implementation implication: subscription parity requires discount-type gating, selling-plan fetch/select flow, per-plan presentation fields, recurring discount config, one-time purchase handling, default plan controls, and multilanguage text editing.

### Select template

Clicking Select template opens a Shopify overlay titled `Customization` with an EB iframe.

Observed modal state:

- Modal heading/copy: `Customize your bundle`, `Choose a design that suits your needs and fits your brand`.
- Action: `Customize Colors & Language`.
- Template cards:
  - Standard Design, image `landing-page-template-standard-design.avif`, action Select.
  - Classic Design, image `landing-page-template-classic-design.avif`, action Selected in observed state.
  - Compact Design, image `landing-page-template-compact-design.avif`, action Select.
  - Horizontal Design, image `landing-page-template-horizontal-design.avif`, action Select.
- Bottom action: `Next`.

Observed post-Next FPB state:

- Modal heading/copy changes to `View your bundle`, `View your bundle with your customizations`.
- Bundle-ready end screen shows `Your bundle is ready`, `Preview it now with your customizations`, and `Preview bundle`.
- Deployed lazy chunk `/_next/static/chunks/9919.17da7d7a8523b9b9.js` confirms the modal also has an app-embed branch with theme-extension enablement when the app embed is not enabled.

Bundle evidence indicates modal flow/tabs:

- Tabs: templates, colors and corners, text and images.
- Modal actions: select, selected, customize colors and language, back, next, done.
- End screens include theme-extension enablement and bundle-ready states.
- Save toasts include generic error and saved successfully.
- Data/state keys include `bundleDesignTemplate`, `bundleDesignTemplateId`, `bundleDesignTemplateData`, `templateId`, and `bundleDesignPresetId`.

Implementation implication: Select template must be implemented as a modal workflow, not an inline card list only. It has selection state, customization tabs, end-screen gating, and template identity fields.

## Integration setup help articles captured from Integrations Hub

Captured from the setup links exposed by the deployed integrations bundle. These details are implementation evidence for our Integrations page and related settings surfaces; runtime snippets and vendor globals are treated as documentation evidence only and must not be copied into source code.

### Subscriptions setup

Source: https://easybundles-help.skailama.app/en/article/classic-subscriptions-integration-subscription-plan-setup-12nd3lb/

Observed behavior requirements:
- Subscription app setup is external-first: create one subscription plan/rule that includes every product that can appear in the bundle.
- Shopify Subscriptions flow: create a plan, name it, select all bundle products, configure frequency, and save.
- Third-party subscription apps follow the same shape: create a plan/rule, include all bundle products, name it, configure recurring options, and save.
- In the bundle app after external setup: sync collections, open the bundle, enable/select Subscription, choose the synced subscription plan, and save.
- This means our Subscription section should make the external-plan prerequisite explicit and should not imply that we create subscription contracts ourselves.

### Review-widget setup

Source: https://easybundles-help.skailama.app/en/article/judgeme-reviews-easy-bundles-integration-1tmhu74/

Observed behavior requirements:
- Review-widget setup is routed through Settings > Controls > app configuration > Custom CSS for theme pages.
- The documented fix changes review badge text visibility through theme-page CSS.
- This maps to our Controls CSS & Scripts surface, not a separate API integration flow.

### Page-builder setup

Source: https://easybundles-help.skailama.app/en/article/embedding-app-scripts-product-page-bundles-on-shopify-page-builders-work-for-ecomposer-gempages-and-other-page-builders-h9gw6d/

Observed behavior requirements:
- The setup is specifically for product-page bundles embedded through third-party page builders.
- Product pages use a wrapper block and active product-page bundle script/style assets.
- Non-product pages require a product-handle configuration before loading the same product-page bundle assets.
- This maps to Bundle Embed / Product Page Layout behavior and should be presented as an embed-instructions flow rather than a one-click app install.

### Checkout and side-cart redirect setup

Source: https://easybundles-help.skailama.app/en/article/redirecting-the-customers-to-a-different-checkout-app-or-side-cart-using-the-app-functions-15cl0fo/

Observed behavior requirements:
- Checkout and side-cart apps are wired by custom post-add functions configured in the app.
- The article lists separate target behaviors for theme cart drawers, accelerated checkout apps, side-cart apps, and cart refresh/open APIs.
- Discount code propagation can require setting session/cookie state before invoking the downstream checkout app.
- This maps to Controls > Integrations / checkout redirect settings and should be represented as a custom callback/function setup surface, not just a simple toggle.

## Bundle edit flow evidence refresh — FPB Bundle Settings and target chunks

Captured from the live embedded app on the `yash-wolfpack` store. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

### Deployed bundle/edit chunk URLs observed

- `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/pages/index-77457b3bfcc98547.js`
- `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/5293.938f3aa8950b8aca.js`
- `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/3414.bf774e0bebf6f323.js`
- `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/9919.17da7d7a8523b9b9.js`

### FPB Bundle Visibility overview

Live visible structure:
- App Embed Status card: connected/success/enabled state.
- Publishing Best Practices card grid: Hero Banner, Navigation Menu, Announcement Banner, Featured Product Card.
- Each publishing card has a black Quick Setup Guide action and 5 minute setup note.
- Your Bundle Link row renders a disabled bundle URL field and Copy Link action.
- Want more placement options panel includes Bundle Widget with Set up Bundle Widget action.

### FPB Bundle Widget setup

Live visible structure after Set up Bundle Widget:
- Heading: Product Page Bundle Upsell Widgets.
- Description: This will display an upsell block or button on the product pages of your choice.
- Main enable checkbox.
- Display mode radios: Offer Upsell Block and Offer Upsell Button, with Offer Upsell Button selected in the observed bundle.
- Widget Settings section with disabled Multi Language button when multilingual setup is unavailable.
- Button Text field default: Save More With Bundle.
- Display Widget on radios: All products in bundle, Specific products, Specific collections.
- Add browsed product to bundle checkbox.
- Embed the Upsell Button at a custom location info panel and Embed Upsell Button action.

### FPB Bundle Settings live section order

Live visible structure:
- Pre Selected Product.
- Enable Quantity Validation.
- Product Slots, Slot Icon, Variant Selector, Show Text on + Button.
- Individual selling-plan alert when bundle-level subscription or BXGY discount blocks individual selling plans.
- Pre-order & Subscription Integration.
- Bundle Cart title/subtitle and cart line item discount display controls.
- Bundle Banner desktop/mobile upload fields with recommended sizes 1900x230 and 1100x500.
- Bundle Level CSS.
- Bundle Status.

Important parity note: the live EB Bundle Settings page does not show separate Show product prices, Show compare-at prices, or Allow quantity changes controls after Bundle Level CSS. Those were WPB-only controls and should not render in the FPB Bundle Settings UI.

### FPB Select template overlay

Live visible structure:
- Shopify App Bridge overlay title: Customization.
- Embedded iframe content heading: Customize your bundle.
- Description: Choose a design that suits your needs and fits your brand.
- Customize Colors & Language action.
- Template cards: Standard Design, Classic Design, Compact Design, Horizontal Design.
- Selected template card button reads Selected; unselected cards read Select.
- Next action appears in the overlay footer.

## Product Page bundle edit flow evidence refresh

Captured from live embedded EB Admin on the `yash-wolfpack` store using `WPB Research Product Page Bundle 2026-05-22`. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

### PPB Bundle Visibility overview

Live visible structure:
- Setup rail order: Step Setup, Discount & Pricing, Bundle Visibility, Bundle Settings, Subscriptions, Select template.
- Bundle Visibility expands nested items: Bundle Widget and Bundle Embed.
- App Embed Status card: connected/success/enabled state.
- Publishing Best Practices card grid: Hero Banner, Navigation Menu, Announcement Banner, Featured Product Card.
- Your Bundle Link row points to the bundle product URL.
- Want more placement options includes Bundle Widget and Bundle Embed setup panels.

### PPB Bundle Widget setup

Live visible structure:
- Heading: Product Page Bundle Upsell Widgets.
- Main enable checkbox.
- Display mode radios: Offer Upsell Block and Offer Upsell Button.
- Observed saved bundle state: Offer Upsell Block selected.
- Widget Settings: Multi language, image upload/update, Widget Title, Widget Description, Widget Button Text.
- Display Widget on radios: All products in bundle, Specific products, Specific collections.
- Add browsed product to bundle checkbox.
- Custom placement panel text changes with selected display mode: Embed the Upsell Block at a custom location / Embed Upsell Block for block mode.

### PPB Bundle Embed setup

Live visible structure:
- Heading: Embed Bundle Builder on Product Pages.
- Main enable checkbox.
- Description: Directly embed the Bundle Builder block on product pages so customers can curate bundles there.
- Fields: Multi Language, Title, Sub Title.
- Observed title value: Build Your Bundle & Save More.
- Display Bundle on radios: All products in bundle, Specific products, Specific collections.
- Add browsed product to bundle checkbox.
- Custom placement panel: Put the Bundle Builder at a custom location, Place app block on the theme, Place Block.

Implementation note: The PPB Bundle Embed title/subtitle should be treated as part of the upsell/embed configuration payload. The live evidence confirms the title default `Build Your Bundle & Save More`; the widget button text field was visible but its value was not captured in this pass, so no default value should be inferred from this evidence.

### PPB Bundle Settings

Live visible structure:
- Pre Selected Product enabled state with Default products title, Choose default products, Browse Products, and selected-count chip.
- Enable Quantity Validation with Maximum allowed quantity per product.
- Pre-order & Subscription Integration toggle and explanatory text.
- Cart line item discount display with Edit Defaults, Use app defaults, and Customize for this bundle.
- Bundle Level CSS.
- Bundle Status.
- No Bundle Cart title/subtitle fields appear on the PPB settings surface.

### PPB Subscriptions

Live visible structure:
- Heading: Bundle Subscriptions.
- How to setup? action.
- Description: Allow customers to purchase the bundle as a subscription.
- Get Subscription Plans action.
- No no-common-plan alert in the observed valid-state bundle.

### PPB Select template overlay

Live visible structure:
- Shopify App Bridge overlay title: Customization.
- Embedded iframe content heading: Customize your bundle.
- Description: Choose a design that suits your needs and fits your brand.
- Customize Colors & Language action.
- Template card order: Product List, Horizontal Slots, Product Grid, Vertical Slots.
- Product List selected in the observed bundle.
- Next action appears in the overlay footer.

## Settings landing refresh — live EB source of truth

Captured from live embedded EB Admin on the `yash-wolfpack` store at `/brandConfig`. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

Live visible structure:
- Page heading: Settings.
- Card 1 title: Design.
- Card 1 description: Modify and customize all design elements of the bundle here.
- Card 1 action: Configure.
- Card 2 title: Language.
- Card 2 description: Configure all text, labels, and translations for your bundle here.
- Card 2 action: Configure.
- Card 3 title: Controls.
- Card 3 description: Change loading screen gif, add custom CSS, modify checkout settings and more.
- Card 3 action: Configure.

Parity note: the Settings landing card copy should stay exact. Expanded recovered detail panels can exist after selecting a card, but the initial card labels/descriptions/actions must match the live landing surface.

## Integrations Hub landing refresh — live EB source of truth

Captured from live embedded EB Admin on the `yash-wolfpack` store at `/integrations`. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

Live visible structure:
- Page heading: Integrations Hub.
- Page description: Browse supported integrations to extend your bundle capabilities.
- Primary action: Request Integration.
- Integration cards render vendor logo images, not text-only logo pills.

Live category and card copy:
- Pre-orders, Pickup & Delivery: Let customers pre-order or schedule pickup and delivery for bundled products.
- Stoq: Pre-order out-of-stock items within your bundles.
- Zapiet: Schedule store pickup & delivery for bundle orders.
- Subscriptions: Enable recurring purchases so customers can subscribe to their favorite bundles.
- Skio: Add subscription selling plans to bundled products.
- Appstle: Enable subscribe-and-save options on your bundles.
- Bold: Set up recurring bundle subscriptions via Bold.
- Reviews: Show social proof by displaying product ratings within your bundles.
- Judge.me: Display star ratings and reviews on your bundles.
- Page Builders: Build custom landing pages and sections to showcase your bundles.
- PageFly: Create custom landing pages to showcase bundles.
- GemPages: Build high-converting pages for your bundle store.
- Checkout: Ensure bundles work smoothly through native and third-party checkout flows.
- Gokwik: Streamlined Indian checkout experience for bundles.
- Shopflo: Optimized Indian checkout flow with bundle support.

Parity note: every visible integration card action reads `View Setup`, including Zapiet. Zapiet may still route to chat internally, but the visible CTA label is not different.

## Settings Design configure flow refresh — live EB source of truth

Captured from live embedded EB Admin on the `yash-wolfpack` store at `/brandConfig` after clicking the Design card's `Configure` action. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

Live visible behavior:
- Clicking Design `Configure` replaces the landing cards with a dedicated Design Control Panel view.
- Design Control Panel view includes Back, page heading `Design Control Panel`, and `Preview Bundle` action.
- Section heading: Bundle Design.
- Section description: Customize your bundle in a few clicks.
- Top tabs: Brand Colors, Typography, Corners, Images & GIFs.
- Brand Colors shows Expert Color Controls, General/Product Card/Bundle Cart/Upsell sub-tabs, Reset to default, and the core color fields.

Parity note: the Settings landing should not need an extra standalone Open Design Control Panel hero action. The Design card `Configure` action itself is the route into the Design Control Panel flow.

## Settings Language configure flow refresh — live EB source of truth

Captured from live embedded EB Admin on the `yash-wolfpack` store at `/brandConfig` after clicking the Language card's `Configure` action. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

Live visible behavior:
- Clicking Language `Configure` replaces the Settings landing with a dedicated `Language Configurations` view.
- The top-left back action is labelled `Settings`.
- Page heading: Language Configurations.
- Enable Multilanguage is checked in the observed state.
- Helper text: Select the language mode for your app.
- Language selector label: Add preferred languages.
- English appears as the selected language chip/button.
- Shared Components section: Customize language for components across all templates.
- Shared Components action: Cart & Checkout.
- Template Language section: Edit language for your landing page or product page template.
- Layout selector: Landing Page Layout.
- Template sections: Product Card, Bundle Cart, Bundle, Popups, Toasts, Addons, Messages.
- Product Card content heading: Button Configuration.
- Product Card description: Product card button text and action labels.
- Field: Add Product to Bundle Button = Add To Box.

Parity note: the Language card `Configure` action should open a dedicated Language Configurations view with a Settings back action, not just expand an inline summary card below the Settings landing.

## Settings Controls configure flow refresh — live EB source of truth

Captured from live embedded EB Admin on the `yash-wolfpack` store at `/brandConfig` after clicking the Controls card's `Configure` action. Sensitive iframe/session parameters, HMACs, JWTs, hosts, and session IDs were observed only in Chrome snapshots and are intentionally omitted here.

Live visible behavior:
- Clicking Controls `Configure` replaces the Settings landing with a dedicated `Additional Configurations` view.
- The top-left back action is labelled `Back`.
- Page heading: Additional Configurations.
- Section heading: App Configurations.
- Section description: Configure your bundle settings.
- Layout selector observed: Landing Page Layout.
- Top tabs: Configuration, CSS & Scripts, Integrations, Advanced.
- Configuration tab shows Bundle Settings and Additional bundle level settings applicable to all bundles created.
- Observed controls include Show Compare At Price, Hide Irrelevant variant images, Track inventory on Add To Cart (in beta), Redirect Collection Page Quick Add to Bundle, Cart Messaging, Bundle Items, Original Bundle Price, Discount Display, Discount format, Checkout Settings, Execute Script, and Font Settings.

Parity note: the Controls card `Configure` action should open a dedicated Additional Configurations view with Back action and tabbed layout controls, not just select an inline summary panel below the Settings landing.

## 2026-06-01 - Deployed JS bundle ground-truth capture

### Public route bundle URLs captured from Chrome network
- Settings route `/brandConfig`: `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/pages/brandConfig-e955e1a1e2e5ce85.js`
- Integrations route `/integrations`: `https://prod.frontend.giftbox.giftkart.app/_next/static/chunks/pages/integrations-9640b0fbcbe3f36a.js`
- Build manifest: `https://prod.frontend.giftbox.giftkart.app/_next/static/bjacw-bBVAp15ucs_SVxO/_buildManifest.js`
- Settings manifest entry includes shared chunks `8923-e52aae092f7f7987.js`, `2305-445b482bfc9c3e31.js`, `4422-3e96a70921f0c8f6.js`, `8587-ecb4c386756f9b20.js`, `7300-e51b3d7a6ef0fb57.js`, plus page CSS `037b611fcfe644e1.css` and `pages/brandConfig-e955e1a1e2e5ce85.js`.
- Integrations manifest entry includes page CSS `2ada0b646b17cf49.css` and `pages/integrations-9640b0fbcbe3f36a.js`.
- Local scratch copies for analysis were saved under `/private/tmp/eb-bundle-recovery/`; these are not repo artifacts.

### Redaction note
- Runtime document URLs contained `hmac`, `host`, `id_token`, `session`, `shop`, and `timestamp`; those values are not persisted here.
- Backend API examples below redact `shopName` and any session-bearing query values.

### Settings bundle behavior extracted from `/brandConfig`
- The Next route registers `/brandConfig` and initially renders a `/welcomepage` state.
- Settings landing card routes are encoded through `PagecustomizationRoutes.cards.*` keys:
  - Design card routes to `/colorscustomization` and logs `Settings - Design Control Panel Clicked`.
  - Language card routes to `/unifiedLanguageSettings` and logs `Settings - Language Configuration clicked`.
  - Controls card is the third landing card and routes into the additional configuration flow.
- Additional Configurations tabs are encoded as `UnifiedAdditionalConfig.tabs.configuration`, `UnifiedAdditionalConfig.tabs.cssScripts`, `UnifiedAdditionalConfig.tabs.integrations`, and `UnifiedAdditionalConfig.tabs.advanced`.
- Default app configuration object includes loading GIF URLs, checkout/cart redirects, custom CSS/script fields, cart integration selectors, theme integration script, dummy product rendering selectors, Judge.me settings, `bundleCartLineMessaging`, and storefront GraphQL API enablement.
- Bundle cart line item messaging defaults include `showBundleContains`, `showOriginalPrice`, and `discountDisplay` with format values `amount_percentage`, `amount_only`, and `percentage_only`.
- Language defaults include shared cart/checkout labels: `Items`, `Retail Price`, and `You Save`.
- Product card language defaults include `addToBoxButtonText` with value `Add To Box`, plus Choose Options, Load More Products, Loading Checkout, and Search-related labels.
- Design Control Panel preview flow checks app embed state before opening preview; live network observed `/api/utility/isAppEmbedEnabled?shopName=[REDACTED]`.
- Live backend reads observed from Settings include `/api/saveLanguage/read?shopName=[REDACTED]`, `/api/pageCustomization/read?shopName=[REDACTED]`, `/api/utility/isAppEmbedEnabled?shopName=[REDACTED]`, and `/getAllData?shopName=[REDACTED]&requestFrom=HOME_PAGE`.

### Integrations bundle behavior extracted from `/integrations`
- The route registers `/integrations` and uses a dedicated category/card JSON payload in the deployed bundle.
- Category IDs are `pre-orders-pickup-delivery`, `subscriptions`, `reviews`, `page-builders`, and `checkout`.
- Card IDs are `stoq`, `zapiet`, `skio`, `appstle`, `bold`, `judgeme`, `pagefly`, `gempages`, `gokwik`, and `shopflo`.
- All card CTAs use translation key `*.ctaLabel`, which renders as `View Setup` in the live UI.
- URL-backed CTAs open help articles in a new tab. Help article IDs in the bundle are `dxyj0o`, `12nd3lb`, `1tmhu74`, `h9gw6d`, and `15cl0fo`.
- Zapiet is the only captured card with `ctaType: "chat"`; it does not have a help URL in the route bundle.
- Card click handler emits an `Integration Intent - {integration} - {shop} - {plan}` notification before either opening a URL or triggering chat.
- Request Integration triggers chat using the `REQUEST_INTEGRATION` message path and emits the same integration-intent notification format.

## Settings Controls refreshed live evidence - 2026-06-01

Source: live embedded Settings `/brandConfig` route and deployed Settings bundle. Runtime query parameters contained session/auth values and are intentionally omitted.

### Additional Configurations shell
- Back action label: `Back`.
- Page heading: `Additional Configurations`.
- Section kicker: `App Configurations`.
- Section description: `Configure your bundle settings`.
- Layout selector visible default: `Landing Page Layout`.
- Top tabs: `Configuration`, `CSS & Scripts`, `Integrations`, `Advanced`.

### Configuration tab
- Content heading: `Bundle Settings`.
- Content description: `Additional bundle level settings applicable to all bundles created`.
- Visible controls include `Show Compare At Price`, `Hide Irrelevant variant images`, `Track inventory on Add To Cart (in beta)`, `Redirect Collection Page 'Quick Add' to Bundle`, `Cart Messaging`, `Bundle Items`, `Original Bundle Price`, `Discount Display`, `Discount format`, `Checkout Settings`, `Execute Script`, `Font Settings`, and `Custom Font`.
- Discount format options: amount and percentage, amount only, percentage only, each shown with the live example text.
- Checkout options: `Redirect to Checkout`, `Redirect to Cart`.
- Clean-room implementation note: Landing Page Layout Configuration is represented with `Bundle Settings`, `Cart Messaging`, `Checkout Settings`, and `Font Settings` groups.

### CSS & Scripts tab
- Sub-tabs visible: `CSS`, `JavaScript & Selectors`.
- CSS fields: `Custom CSS for bundle builder pages`, `Custom CSS for bundle dummy product page`, `Custom CSS for theme pages`.
- JavaScript/selectors fields: `Custom JS Bundle Script`, `Button Selectors`, `Add to Cart Button Selectors`, `Buy now button`.
- Clean-room implementation note: these are represented as grouped sub-sections inside the recovered Controls field model, not as one flat field list.

### Integrations tab
- Content heading: `Integrate JS with custom elements from the store theme`.
- Content description: script applies only to theme pages, not bundle pages.
- Visible fields include `Enable Custom Theme Integration Script`, `Custom Theme Integration Script`, cart integration selectors, `Integrate with Judge Me`, `Enable Judge Me Integration`, and `Public token`.
- No token value was captured or copied.
- Clean-room implementation note: these fields are represented as grouped sub-sections for theme script integration, cart page integration, and Judge.me integration.

### Advanced tab
- Content heading: `Video Player Page Settings`.
- Content description: `Customize the video player page of the bundle video message`.
- Visible fields/actions include `Logo`, `Background Color`, `Upload file`, and `Update Image`.
- Clean-room implementation note: these fields are represented as one `Video Player Page Settings` group, not as generic advanced settings.

## Settings Controls Product Page Layout live evidence - 2026-06-01

Source: live embedded Settings `/brandConfig` route after selecting `Product Page Layout`. Runtime query parameters contained session/auth values and are intentionally omitted.

### Product Page Layout shell
- Layout selector value: `Product Page Layout`.
- Visible tabs: `Configuration`, `CSS & Scripts`.
- Unlike Landing Page Layout, no `Integrations` or `Advanced` tab was visible in this Product Page Layout branch.

### Product Page Layout / Configuration
- Content heading: `Bundle Settings`.
- Content description: `Additional bundle level settings applicable to all bundles created`.
- Visible controls: `Hide Out Of Stock Products`, `Track inventory on Add To Cart (in beta)`, `Add bundle to cart after the last step is completed`, `Display empty state boxes based on bundle condition`, `Hide Step Titles in completed state`, `Add to cart when product card is clicked`, and `Redirect Collection Page 'Quick Add' to Bundle`.
- Cart messaging group: `Cart Messaging`, `Edit Language`, `Bundle Items`, `Original Bundle Price`, `Discount Display`, and `Discount format`.
- Discount format options match Landing Page Layout: amount and percentage, amount only, percentage only, each shown with the live example text.
- Redirect section: `Redirect Settings`, `Customize the redirect on Add to cart`, `Execute Default Side Cart Update`, `Redirect to Checkout`, `Redirect to Cart`, and `Execute Script`.
- Clean-room implementation note: Product Page Layout Configuration is represented with `Bundle Settings`, `Cart Messaging`, and `Redirect Settings` groups.

### Product Page Layout / CSS & Scripts
- Sub-tabs visible: `CSS`, `JavaScript & Selectors`.
- CSS field: `Custom CSS for Mix And Match Bundles` with helper text `The CSS written here will be applied to all product page bundles.`
- JavaScript and selector fields: `Execute Custom Script`, `Selectors`, `Side cart selector`, `Side cart section ID`, `Cart page items selector`, `Cart page items section ID`, `Side cart open button selector`, and `Product page price selector`.
- Clean-room implementation note: these are represented as grouped sub-sections inside the recovered Controls field model, not as one flat field list.
