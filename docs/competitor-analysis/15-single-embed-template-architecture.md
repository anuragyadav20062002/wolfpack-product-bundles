# EasyBundles Single-Embed / Multi-Template Architecture Analysis

**Date:** 2026-05-22  
**Issue:** `easybundles-single-embed-analysis-1`  
**Purpose:** Explain how EasyBundles can manage many bundle types and many storefront design templates through one effective app embed/SDK surface, contrast that with Wolfpack's current FPB/PPB split, and define the planning input for a future implementation session.

---

## Executive Summary

EasyBundles does not appear to solve "many bundle types" by shipping a separate Shopify app embed for each bundle category. The more scalable pattern is:

1. **One storefront bootstrap surface** loads on eligible storefront pages.
2. **Liquid reads the current page context** and app-owned/custom metafields to decide whether a bundle exists on the page.
3. **A single bundle config JSON shape** carries bundle type, placement, layout/template, step/category data, pricing, messages, and design settings.
4. **The JavaScript runtime is data-driven**: it selects the right renderer from a layout/template registry instead of selecting a separate embed.
5. **Design templates are renderer variants**, not separate Shopify extension blocks.
6. **Admin complexity lives in configuration**, not in separate storefront entry points.

Wolfpack is partially there. We already use app embeds and metafield-driven config, but we still split the storefront by page type:

- `bundle-full-page-embed.liquid` for pages
- `bundle-product-page-embed.liquid` for products
- `bundle-widget-full-page-bundled.js`
- `bundle-widget-product-page-bundled.js`
- `bundleType` branches inside the widget code
- DCP/design CSS fetched separately by `bundleType`

The next architectural move is not "copy EasyBundles exactly"; it is to convert Wolfpack from **two category-specific storefront entry points** into **one bootstrap + one normalized config + renderer registry** while preserving Shopify constraints and our existing metafield/cache strengths.

## 2026-05-22 Live Validation Result

### Deterministic Decision

The EB-style implementation is viable, but the correct target is more specific than "one embed does everything":

**Implement one global app embed plus one or more app blocks/placement handlers.**

Observed EB behavior shows:

- EB has one Theme Editor app embed entry named **Easy Bundle** under **EB | Easy Bundle Builder**.
- That single app embed is enabled globally in the App Embeds panel.
- EB still uses explicit app block placement for exact product-template insertion. The PPB "Place Widget" flow opened Theme Editor with a block selected and a Shopify toast saying `"Product Page Builder" added`.
- Therefore, EB's one app embed is the global activation/bootstrap layer. It is not the only storefront mechanism.

For Wolfpack, copying EB means:

1. One app embed toggle visible in Theme Editor.
2. Shared storefront bootstrap assets and shared config/runtime model.
3. Separate app blocks for exact in-template placement where Shopify app embeds are not enough.
4. Admin Bundle Visibility flows that guide merchants into either global activation, app block placement, or link/marketing placements.

### Live E2E Observations

#### Theme Editor App Embed

In Theme Editor `context=apps`, searching `Easy` showed:

- `Easy Bundle EB | Easy Bundle Builder`
- Toggle/control text: `Disable Easy Bundle`

This confirms the user's observation: EB presents one app embed named `Easy Bundle`.

#### PPB Configure: Bundle Visibility

The EB PPB configure page showed these sidebar items:

- `Bundle Visibility`
- child item `Bundle Widget`
- child item `Bundle Embed`

The parent `Bundle Visibility` panel contains:

- `App Embed Status`
- status text showing the store is connected and ready
- `Publishing Best Practices`
- placement guides for:
  - Hero Banner
  - Navigation Menu
  - Announcement Banner
  - Featured Product Card
- `Your Bundle Link`: `https://yash-wolfpack.myshopify.com/products/test-ppb-bundle`
- `Want more placement options?`
  - `Bundle Widget`: "Add a bundle button to specific product pages."
  - `Bundle Embed`: "Embed the full bundle builder directly on a product page."

#### PPB Configure: Bundle Widget

The PPB `Bundle Widget` child panel is not the full builder embed. It is the product-page upsell widget.

Observed controls:

- `Product Page Bundle Upsell Widgets`
- enable checkbox
- widget mode:
  - `Offer Upsell Block`
  - `Offer Upsell Button`
- `Widget Settings`
- image upload and update action for block mode
- `Widget Title`
- `Widget Description`
- `Widget Button Text`
- `Display Widget on`
  - `All products in bundle`
  - `Specific products`
  - `Specific collections`
- `Add browsed product to bundle`
- custom-location block placement CTA:
  - `Embed Upsell Block` or `Embed Upsell Button`

#### PPB Configure: Bundle Embed

The PPB `Bundle Embed` child panel is the full bundle-builder-on-product-page feature.

Observed controls:

- `Embed Bundle Builder on Product Pages`
- enable checkbox
- `Title`
- `Sub Title`
- `Display Bundle on`
  - `All products in bundle`
  - `Specific products`
  - `Specific collections`
- `Add browsed product to bundle`
- custom-location block placement CTA:
  - `Place Block`

This is a distinct feature from Bundle Widget.

#### PPB Place Widget / Theme Editor Path

Clicking `Place Widget` opened Theme Editor for the `Default product` template with:

- URL containing `block=...eb_easy_bundle_builder_app_block_mix_and_match_bundle...`
- Shopify toast: `"Product Page Builder" added`
- selected block in the product information section: `Product Page Builder`
- live preview rendering the PPB full builder on `products/test-ppb-bundle`

This is the strongest proof that EB uses one global app embed plus app blocks for exact product-template placement.

#### FPB Configure: Bundle Visibility

The EB FPB configure page showed:

- `Bundle Visibility`
- one child item: `Bundle Widget`
- no `Bundle Embed` child item

The parent `Bundle Visibility` panel contains:

- `App Embed Status`
- `Publishing Best Practices`
- placement guides
- `Your Bundle Link`: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/1`
- `Want more placement options?`
  - `Bundle Widget`: "Add a bundle button to specific product pages."

The FPB link is an app-proxy URL, not a Shopify page/product URL.

#### FPB Configure: Bundle Widget

The FPB `Bundle Widget` child panel is also a product-page upsell widget.

Observed controls:

- `Product Page Bundle Upsell Widgets`
- enable checkbox
- mode:
  - `Offer Upsell Block`
  - `Offer Upsell Button`
- `Button Text` when button mode is selected
- `Display Widget on`
  - `All products in bundle`
  - `Specific products`
  - `Specific collections`
- `Add browsed product to bundle`
- custom-location block placement CTA:
  - `Embed Upsell Button`

### Storefront Asset Evidence

#### PPB product page

Opening `https://yash-wolfpack.myshopify.com/products/test-ppb-bundle` showed the direct product-page bundle builder rendered on the product page.

Relevant loaded extension assets:

- `easy-bundle-min.js`
- `easy-bundle-product-page-min.js`
- `easy-bundle-min.css`
- `easy-bundle-product-page-min.css`

Relevant globals/classes:

- `gbbExtEmbed`
- `easybundles_ext_data`
- `easybundle_user_ext_data`
- `gbbExt`
- `gbbMix`
- `GbbMixState`
- DOM classes such as `gbbMixPageWrapper`, `gbbMixProductPageWrapperV2`, `gbbMixCascadeWrapper`

#### FPB app-proxy page

Opening `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/1` redirected to:

`/apps/gbb/easybundle/1?page=addProductsPage1&currentFlow=byob`

Relevant loaded assets:

- `easy-bundle-min.js`
- `easy-bundle-full-page-min.js`
- `easy-bundle-min.css`
- `easy-bundle-full-page-min.css`

Relevant globals/classes:

- `gbbExtEmbed`
- `easybundles_ext_data`
- `easybundle_user_ext_data`
- `gbb`
- `gbbExt`
- DOM root `#gbbBundle`
- classes such as `gbbPageBody`, `gbbMinimilisticLayout`, `gbbProductsCardLayoutV2`

### Corrected Technical Model

EB's actual model appears to be:

| Layer | Observed role |
|---|---|
| One app embed: `Easy Bundle` | Global activation/bootstrap and extension data surface |
| App block: `Product Page Builder` | Exact product-template placement for direct PPB full builder |
| Bundle Widget controls | Optional product-page upsell block/button for both PPB and FPB bundles |
| Bundle Embed controls | PPB-only direct full-builder embed on product pages |
| FPB bundle link | App-proxy full-page experience at `/apps/gbb/easybundle/{id}` |
| Runtime assets | Shared base asset plus placement-specific assets (`product-page`, `full-page`) |

### What This Means for Wolfpack

The Wolfpack implementation should not keep two app embed toggles. It should target:

- one Theme Editor app embed, e.g. `Wolfpack Bundles`
- one shared base storefront script/CSS
- one global activation/status check in Admin
- separate app blocks for:
  - product-page full builder placement
  - optional upsell button/block placement
  - any exact page/product section insertion that cannot be done reliably by body embed relocation
- a full-page bundle URL strategy:
  - app proxy route, or
  - Shopify page route, but chosen deliberately

The implementation will work if the plan mirrors this layered model. It will not match EB if we only merge the two current Wolfpack app embed Liquid files and call that done.

---

## Evidence Base

### Existing EB observations from prior crawl docs

From the EB creation flow:

- EB exposes **four layout options** during creation:
  - Classic — landing page / full page
  - Horizontal — landing page / full page
  - Product List — product page
  - Horizontal Slots — product page
- EB also offers **AI creation** and **template-based starting points** that pre-populate bundle configuration.
- Product selection uses Shopify's native resource picker.

From the EB editor analysis:

- The editor is one left-navigation shell with panels for Step Setup, Free Gift & Add Ons, Messages, Discount & Pricing, Bundle Visibility, Bundle Settings, Subscriptions, and Select Template.
- "Select template" opens a full-screen overlay with four storefront design templates.
- Template selection re-renders the preview rather than changing the Shopify embed.

From the EB SDK analysis:

- Runtime state is centralized under `window.gbbMix`.
- SDK state contains bundle config, steps, discount configuration, cart state, and settings.
- SDK functions mutate state and developers manually re-render custom UI.
- EB's SDK loads through a theme app extension and auto-detects the bundle from the current page.

The important inference: EB treats bundle type and design template as **configuration dimensions** inside one runtime, not as separate deployed embeds.

### Shopify platform facts

Official Shopify theme app extension docs confirm:

- Theme app extensions contain Liquid blocks and assets that are injected into themes.
- App embed blocks can target `head`, `compliance_head`, or `body`.
- Body app embeds are injected near the closing body tag.
- App embeds are deactivated after install until the merchant enables them, but apps can deep-link merchants to activate the embed.
- App embeds can be limited to templates through `enabled_on`.
- App embeds have global page Liquid scope and do not rely on JSON template section placement.

Sources:

- Shopify theme app extensions overview: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
- Shopify theme app extension configuration: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration

---

## Current Wolfpack Architecture

### Storefront extension entry points

Current theme extension config still declares multiple storefront blocks:

- `bundle-full-page-embed.liquid` — body app embed, enabled on `page`
- `bundle-product-page-embed.liquid` — body app embed, enabled on `product`
- `bundle-full-page.liquid` — section block, enabled on `page`
- `bundle-product-page.liquid` is referenced in TOML but is missing in the current tree, which should be cleaned up or verified before deploy.

The previous embed architecture issue describes the intended shift:

- App embeds should be activated once per store.
- FPB embed reads `page.metafields.custom.bundle_id`.
- PPB embed reads the first product variant's `$app.bundle_ui_config`.
- Merchants should not manually place a widget block per bundle.

### FPB embed behavior

`bundle-full-page-embed.liquid`:

- Runs only on `page` templates.
- Reads `page.metafields.custom.bundle_id`.
- Reads `page.metafields.custom.bundle_config`.
- Emits one `#bundle-builder-app` container with:
  - `data-bundle-type="full_page"`
  - `data-bundle-config`
  - display defaults
- Loads full-page CSS.
- Loads `bundle-widget-full-page-bundled.js`.
- Relocates the body embed into `#MainContent` because body embeds inject near the end of the body.

### PPB embed behavior

`bundle-product-page-embed.liquid`:

- Runs only on `product` templates.
- Reads `product.variants.first.metafields['$app']['bundle_ui_config']`.
- Emits one `#bundle-builder-app` container with:
  - `data-bundle-type` from config or `product_page`
  - `data-bundle-config`
  - product/container flags
- Hides native add-to-cart controls when the product is a bundle container.
- Relocates the widget after the product add-to-cart form.
- For full-page bundle container products, redirects to the bundle page.
- Loads product-page CSS.
- Loads either:
  - `wolfpack-bundles-sdk.js` if `sdkMode === true`
  - `bundle-widget-product-page-bundled.js` otherwise

### Widget and config behavior

`bundle-widget-full-page.js` already contains mixed logic:

- It parses `data-bundle-type`.
- It loads FPB data from `data-bundle-config` first, then proxy API fallback.
- It renders different layouts by `bundleType`.
- For full-page bundles it branches again on `fullPageLayout`:
  - sidebar layout
  - bottom/floating footer layout
- It still contains product-page rendering methods.

`bundle_ui_config` currently carries:

- `bundleType`
- `fullPagePageHandle`
- `steps`
- `pricing`
- `messaging`
- `promoBannerBgImage`
- `textOverrides`
- `sdkMode`
- gift message settings
- other widget options

This is already close to the EB pattern. The gap is that the runtime is not yet cleanly organized as a single bootstrap and renderer registry.

---

## How EB Is Likely Managing Many Bundle Types

This is an inference from observed EB UI/SDK behavior plus Shopify extension constraints.

### 1. One app embed as a loader, not one embed per type

The app embed likely does very little:

- Loads a global script or SDK.
- Exposes page context.
- Finds bundle-relevant metafields or product/page identity.
- Mounts a container only when a bundle is configured.

It does not need separate embeds for "Classic", "Horizontal", "Product List", "Horizontal Slots", free gift, add-ons, subscriptions, or templates. Those are all data fields.

### 2. Bundle type is a config field

EB's observed layout choices can be modeled like this:

```ts
type BundlePlacement = 'landing_page' | 'product_page';
type BundleLayout = 'classic' | 'horizontal' | 'product_list' | 'horizontal_slots';
type BundleFeature =
  | 'steps'
  | 'categories'
  | 'free_gift'
  | 'addons'
  | 'tiered_discount'
  | 'subscriptions'
  | 'gift_messages';
```

That means a storefront config can say:

```json
{
  "bundleId": "abc",
  "placement": "product_page",
  "layout": "horizontal_slots",
  "features": ["steps", "categories", "tiered_discount"],
  "steps": [],
  "pricing": {},
  "design": {},
  "messages": {}
}
```

The embed does not change. The renderer changes.

### 3. Templates are renderer variants

A design template is likely a key in config:

```json
{
  "template": "compact",
  "layout": "horizontal_slots"
}
```

The runtime can resolve it like:

```ts
const renderer = rendererRegistry[placement][layout][template];
renderer.render(config, state, mountElement);
```

Template selection in admin updates config and preview state. It does not require a new Liquid block.

### 4. Complex features are plugins or slots

Features such as free gifts, add-ons, subscriptions, and messages do not require separate embeds if they are implemented as optional renderer modules:

```ts
const enabledModules = [
  stepsModule,
  categoryTabsModule,
  discountProgressModule,
  addonModule,
  subscriptionModule,
];
```

Each module contributes:

- validation rules
- UI fragments
- cart payload properties
- pricing display metadata
- event handlers

The selected template decides where those fragments are placed.

### 5. A global SDK/state object supports both pre-built and custom UI

EB's `window.gbbMix` pattern lets the same backend/config support:

- EB pre-built templates
- custom merchant/developer UI
- debug inspection
- manual render loops

The pre-built widget is just one consumer of the same state/actions. This is why one app embed can serve many experiences.

---

## Why Wolfpack Currently Feels Split

Wolfpack's split is historically understandable:

- FPB lives on Shopify pages and needs page metafield config.
- PPB lives on product pages and needs product/variant metafield config.
- FPB had cold-start proxy issues, so page metafield cache became critical.
- PPB has product-form placement and native add-to-cart hiding concerns.

Those are **placement concerns**, not bundle-type concerns. They justify separate context adapters, but not necessarily separate widget bundles forever.

Current split dimensions:

| Dimension | Current Wolfpack | EB-like target |
|---|---|---|
| Shopify entry | FPB embed + PPB embed | One bootstrap embed or one shared bootstrap used by both template scopes |
| JS runtime | Separate FPB/PPB bundles + SDK bundle | One runtime with renderer registry, optional SDK mode |
| Layout selection | `bundleType` + `fullPageLayout` conditionals | `placement + layout + template` config |
| Design CSS | `bundleType` query param | CSS variables keyed by placement/layout/template scope |
| Admin model | FPB route and PPB route diverge | Unified bundle model with placement-specific fields |
| Preview | Per-flow preview components | Preview driven by same renderer metadata/config |

---

## Recommended Wolfpack Target Architecture

### Principle

Do not collapse everything into one unstructured mega-file. Collapse the **entry and data contract**, then split implementation internally by adapters and renderers.

### Layer 1: Storefront bootstrap

Create a shared bootstrap concept:

```txt
Theme app embed
  -> read Liquid page context
  -> resolve bundle config source
  -> emit/mount container
  -> load runtime
```

The bootstrap should understand context:

```ts
type StorefrontContext =
  | { template: 'page'; pageHandle: string; configSource: 'page_metafield' }
  | { template: 'product'; productId: string; productHandle: string; configSource: 'variant_metafield' };
```

Shopify may still require separate `enabled_on` declarations for product and page templates. That is acceptable. The key is that both Liquid files should call into the same normalized bootstrap/runtime contract instead of owning separate product logic.

### Layer 2: Normalized bundle config

Introduce a normalized config shape:

```ts
interface UnifiedBundleConfig {
  version: number;
  bundleId: string;
  bundleType: 'full_page' | 'product_page';
  placement: 'page' | 'product';
  layout: 'classic' | 'sidebar' | 'floating_footer' | 'product_list' | 'horizontal_slots';
  template: 'standard' | 'classic' | 'compact' | 'horizontal';
  runtimeMode: 'prebuilt_widget' | 'sdk';
  shopify: {
    bundleProductId?: string | null;
    bundleVariantId: string;
    fullPageHandle?: string | null;
  };
  steps: UnifiedStepConfig[];
  pricing: UnifiedPricingConfig | null;
  messages: UnifiedMessageConfig;
  design: UnifiedDesignConfig;
  features: UnifiedFeatureFlags;
}
```

Important: this should be a new planned contract, not a backwards-compat shim. The no-backwards-compatibility rule means stale bundles should be fixed by Sync Bundle, version bump, and sync prompts.

### Layer 3: Context adapters

Keep placement-specific adapters:

- `PageContextAdapter`
  - reads page metafield config
  - mounts inside main content
  - hides theme page title if needed
- `ProductContextAdapter`
  - reads variant metafield config
  - inserts after product form
  - hides product add-to-cart when product is a bundle container
  - redirects full-page container products to the page URL

These adapters should output the same `UnifiedBundleConfig`.

### Layer 4: Renderer registry

Replace large `if bundleType` / `if fullPageLayout` branches with a registry:

```ts
const rendererRegistry = {
  page: {
    classic: ClassicPageRenderer,
    sidebar: SidebarPageRenderer,
    floating_footer: FloatingFooterPageRenderer,
  },
  product: {
    product_list: ProductListRenderer,
    horizontal_slots: HorizontalSlotsRenderer,
    bottom_sheet: BottomSheetRenderer,
  },
};
```

Each renderer receives:

- normalized config
- mutable state
- actions
- CSS variable map
- feature modules

### Layer 5: Feature modules

Common features should be independent of renderer:

- step/category data
- min/max validation
- default product preselection
- discount progress
- free gift/add-on steps
- messages and locale overrides
- quantity selector behavior
- cart add/transform payload assembly

Renderers decide presentation. Feature modules decide behavior.

### Layer 6: Design template system

Templates should be data and component mappings, not separate embeds:

```ts
interface DesignTemplateDefinition {
  id: string;
  supportedPlacements: Array<'page' | 'product'>;
  supportedLayouts: string[];
  defaultDesignTokens: Record<string, string | number | boolean>;
  rendererOverrides?: Record<string, unknown>;
}
```

DCP should save:

- global brand tokens
- placement-specific tokens
- template-specific overrides
- per-bundle overrides

The storefront runtime resolves final design in this order:

1. global shop design settings
2. placement defaults
3. selected template defaults
4. per-bundle DCP settings
5. per-bundle custom CSS

No fabricated fallback marketing copy should be introduced. Missing merchant copy should render blank or neutral system text.

---

## Implementation Planning Notes for Next Session

This should go through the feature-pipeline because it is a new capability/architecture change.

### BR questions

- Is the goal one literal Shopify app embed toggle, or one shared runtime while retaining product/page-scoped embed files?
- Which new EB-style layouts are in MVP?
- Should SDK mode be a first-class runtime mode for both FPB and PPB, or PPB only?
- Should design templates be global defaults, per-bundle choices, or both?
- Should all storefront-visible template controls be DCP-customizable? This must be answered before implementation.

### Architecture decisions needed

1. **Single literal embed vs shared runtime**
   - Strict single embed may load on more pages and then no-op.
   - Two template-scoped embeds with one runtime may be more performant and still solves the maintainability issue.

2. **One bundled JS vs code-split bundles**
   - One runtime bundle simplifies deployment and config.
   - Code-split renderers reduce payload but need more loader complexity.

3. **Metafield source of truth**
   - Page metafield remains best for FPB zero-network first paint.
   - Variant `$app.bundle_ui_config` remains best for PPB.
   - Both should serialize to the same normalized config.

4. **Design CSS endpoint**
   - Current endpoint accepts `bundleType`.
   - Target should accept or infer `placement/layout/template`, while still generating scoped CSS variables.

5. **Sync/version strategy**
   - Bump `WIDGET_VERSION`.
   - Add sync prompt if the normalized config version changes.
   - Do not add legacy fallback chains.

### Suggested MVP sequence

1. **Document unified config contract**
   - Add BR, PO, ADR via feature-pipeline.
   - Define `UnifiedBundleConfig`, layout IDs, template IDs, feature flags.

2. **Extract shared runtime modules**
   - State
   - actions
   - validation
   - cart payload
   - price display
   - message resolution

3. **Create placement adapters**
   - Page adapter from `bundle-full-page-embed.liquid`.
   - Product adapter from `bundle-product-page-embed.liquid`.

4. **Create renderer registry**
   - Register existing FPB footer/sidebar renderers.
   - Register existing PPB classic renderer.
   - Do not add new layouts until the registry can render old ones.

5. **Normalize metafield writers**
   - Update `bundle-product.server.ts` and page bundle config writer to emit the same contract.
   - Add focused tests for config shape.

6. **Unify design token resolution**
   - Move from only `bundleType` to placement/layout/template-aware CSS generation.
   - Preserve per-bundle custom CSS escape hatch.

7. **Add new templates**
   - Implement one new template at a time.
   - Each template gets DCP controls, preview, storefront renderer, and Chrome verification.

---

## Risks and Constraints

### Shopify app embed placement

Body embeds inject near the end of the body. Product/page widgets that need exact placement still require DOM relocation or app blocks. A single embed can work, but exact in-flow placement remains theme-dependent.

### Payload size

If one runtime includes all renderers, it may increase storefront JS size. Code splitting or renderer lazy loading may be needed later.

### Metafield limits

`bundle_ui_config` already has a 64KB size check. More layouts/templates/features increase config pressure. The normalized contract should avoid duplicating large product arrays or verbose template data.

### No backwards compatibility shims

The project rule forbids fallback chains and migration hacks. Any normalized config rollout should rely on:

- direct schema/config changes
- widget version bump
- Sync Bundle
- sync prompt banner

### Competitor naming

Competitor references are allowed in docs only. Implementation identifiers should use neutral names such as `layoutRegistry`, `templateRegistry`, `unifiedBundleConfig`, and `placementAdapter`.

---

## Bottom Line

EasyBundles' advantage is not a magical Shopify capability. It is a cleaner separation:

- **Shopify embed:** generic loader
- **Metafields/config:** source of truth
- **Runtime state/actions:** shared engine
- **Renderer registry:** layout/template selection
- **Admin editor:** writes config, not code paths

Wolfpack already has most raw ingredients: app embeds, metafield config, SDK work, DCP, sync, and two working widget families. The implementation plan should focus on normalizing the runtime contract and introducing a renderer/template registry, not on adding more embeds for every new bundle category.
