# Wolfpack Product Bundles — App Navigation & UI Map

> **KEEP THIS UP TO DATE.**
> Any time a new page, modal, tab, sidebar section, or user flow is added or removed,
> this document **must** be updated. See CLAUDE.md for the enforcement rule.

**Last Updated:** 2026-05-22
**Environment mapped:** SIT (`wolfpack-product-bundles-sit`)
**Test store:** `wolfpack-store-test-1.myshopify.com`

---

## 1. Top-Level Shell

The app runs inside the Shopify Admin embedded iframe. The outer Shopify Admin shell
provides a persistent left-nav with the app's registered nav items.

### Shopify Admin Left Nav (app section)

```
Wolfpack: Product Bundles -SIT
├── [root]              → /app/dashboard          (Dashboard)
├── Design Control Panel → /app/design-control-panel
├── Analytics           → /app/attribution
├── Pricing             → /app/pricing
└── Updates & FAQs      → /app/events
```

**Screenshot:** `screenshots/02-dashboard.png`

---

## 2. Page-by-Page Map

### 2.1 Dashboard — `/app/dashboard`

**Route file:** `app/routes/app/app.dashboard/route.tsx`
**Screenshot:** `screenshots/02-dashboard.png`

```
Dashboard
├── Header: "Dashboard: Wolfpack Bundle Builder"
├── Subheader: "Access your bundles, customer support & more."
│
├── [Button] "Create Bundle"  → opens Create Bundle Modal
│
├── Section: "Your Bundles"
│   └── DataTable of bundles (empty state if none exist)
│       └── Per bundle row:
│           ├── [Button] "Bundle Settings" → /app/bundles/{type}/configure/{bundleId}
│           ├── [Button] "Clone"
│           ├── [Button] "Preview"
│           └── [Button] "Delete" → opens Delete Confirmation Modal
│
├── Section: "Bundle Setup Steps" (visible when no bundles)
│   └── 6-step numbered guide
│
├── Card: "Need Help? Speak to Parth!" (account manager)
│   └── [Button] "Chat with Parth" → opens Intercom chat
│
└── Banner: Proxy health check / upgrade prompts (conditional)
```

Dashboard preview behavior:
- Product-page bundle preview opens `/products/{shopifyProductHandle}`.
- Full-page bundle preview opens `/apps/product-bundles/wpb/{bundleId}`.

#### "Create Bundle" Button
Navigates to: `/app/bundles/create` (full-page wizard — modal removed)

---

### 2.1a Create Bundle Wizard — `/app/bundles/create`

**Route file:** `app/routes/app/app.bundles.create/route.tsx`

```
Create Bundle Wizard (Step 01 of 05)
├── Header: "Select bundle builder type" + "How do bundle builder types work?" link
├── Step indicator: 01 Bundle name & Description (active) → 02–05 (future)
├── Form
│   ├── TextField: Bundle name (required, min 3 chars)
│   ├── Textarea: Description (optional)
│   ├── Bundle Type cards: Product Page Builder / Full Page Builder
│   └── Page Layout cards (visible only when Full Page selected):
│       ├── Floating cart card (footer_bottom)
│       └── Side Panel (footer_side)
└── [Button] "Next" → POST action → redirect to configure page
```

#### Modal: Delete Bundle Confirmation
Triggered by: "Delete" row action
```
Delete Confirmation Modal (centered, small)
├── "Are you sure you want to delete [bundle name]?"
└── [Button] "Delete" / [Button] "Cancel"
```

---

### 2.2 Design Control Panel (DCP) — `/app/design-control-panel`

**Route file:** `app/routes/app/app.design-control-panel/route.tsx`
**Screenshot:** `screenshots/01-dcp-landing.png`

```
DCP Landing Page
├── Header: "Design Control Panel"
├── Subheader: "Customize the appearance of your bundles"
│
├── Card: "Landing Page Bundles"
│   └── [Button] "Customize" → opens FPB Customization Modal (max overlay)
│
├── Card: "Product Bundles"
│   └── [Button] "Customize" → opens PDP Customization Modal (max overlay)
│
└── Section: "Custom CSS"
    ├── Tab: "Product Bundles"
    ├── Tab: "Landing Page Bundles"
    ├── TextArea: CSS Rules (50,000 char limit)
    ├── Security notice (XSS patterns auto-stripped)
    ├── [Button] "Save Custom CSS"
    └── [Button] "CSS Guide" → opens CSS Guide Modal
```

#### Modal: FPB Customization (max overlay)
Triggered by: "Customize" on Landing Page Bundles card
**Screenshot:** `screenshots/07-dcp-fpb-modal.png`

```
FPB DCP Modal (3-column layout)
│
├── LEFT: NavigationSidebar
│   ├── Global Colors
│   ├── Product Card  [expandable group]
│   │   ├── Product Card
│   │   ├── Product Card Typography
│   │   ├── Button
│   │   ├── Added State
│   │   ├── Quantity & Variant Selector
│   │   ├── Search Input
│   │   ├── Skeleton Loading
│   │   └── Typography
│   ├── Bundle Footer  [expandable group]
│   │   ├── Footer
│   │   ├── Footer Price
│   │   ├── Footer Button
│   │   ├── Footer Discount Progress
│   │   └── Quantity Badge
│   ├── General  [expandable group]
│   │   ├── Header Tabs
│   │   ├── Header Text
│   │   ├── Empty State
│   │   ├── Add to Cart Button
│   │   ├── Toasts
│   │   ├── Modal Close Button
│   │   ├── Accessibility
│   │   └── Widget Style
│   ├── Bundle Header  [FPB only, expandable]
│   ├── Promo Banner  [FPB only, expandable]
│   └── Pricing Tier Pills  [FPB only, expandable]
│
├── CENTER: SettingsPanel
│   ├── "Reset to defaults" button (top right, critical/plain)
│   ├── Divider
│   └── Dynamic settings form for active section
│       (ColorPickers, RangeSliders with number input, Segmented controls, Toggles)
│
├── RIGHT: PreviewPanel
│   ├── Viewport toggle: [Desktop] [Mobile]
│   ├── Footer layout toggle: [Sidebar] [Floating Footer]  (FPB only)
│   └── Live iframe preview (scaled, postMessage CSS updates)
│
└── BOTTOM: Save Bar
    ├── "Unsaved changes" label
    ├── [Button] "Discard"
    └── [Button] "Save"
```

#### Modal: PDP Customization (max overlay)
Triggered by: "Customize" on Product Bundles card
**Screenshot:** `screenshots/08-dcp-pdp-modal.png`

```
PDP DCP Modal (3-column layout — same as FPB except:)
├── LEFT: NavigationSidebar (no Bundle Header / Promo Banner / Tier Pills)
├── RIGHT: PreviewPanel — no footer layout toggle (single iframe)
└── Same Settings Panel + Save Bar structure
```

#### Modal: CSS Guide
Triggered by: "CSS Guide" button
```
CSS Guide Modal (max overlay)
└── Help content: CSS variable reference, examples
```

---

### 2.3 Analytics — `/app/attribution`

**Route file:** `app/routes/app/app.attribution.tsx`
**Screenshot:** `screenshots/03-analytics.png`

```
Analytics Page
├── Header: "Bundle Analytics"
│
├── Date Range Selector
│   ├── Preset chips: [Last 7 days] [Last 30 days] [Last 90 days]
│   └── Custom range → Popover with DatePicker (allowRange, multiMonth)
│       └── [Button] "Apply"
│
├── UTM Attribution section
│   ├── Metric cards: Total Revenue, AOV, period-over-period comparisons
│   ├── Area chart: Revenue trend over selected period (Recharts)
│   └── Table: UTM medium breakdown
│
└── Pixel toggle: Enable/disable UTM tracking pixel
```

---

### 2.4 Pricing — `/app/pricing`

**Route file:** `app/routes/app/app.pricing.tsx`
**Screenshot:** `screenshots/04-pricing.png`

```
Pricing Page
├── Subscription quota card (current usage)
│
├── Plan cards: Free vs Grow
│   └── [Button] "Upgrade to Grow" → POST → Shopify billing redirect
│
├── Feature comparison table
│
├── Value props section
│
├── FAQ accordion
│
└── Modal: Upgrade Confirmation (before billing redirect)
```

---

### 2.5 Updates & FAQs — `/app/events`

**Route file:** `app/routes/app/app.events.tsx`
**Screenshot:** `screenshots/05-events.png`

```
Updates & FAQs Page
├── Section: "Latest Updates"
│   └── Accordion items (release notes, e.g. "Landing Page Bundles Now Load Instantly")
│
└── Section: "FAQs & Tutorials"
    └── Accordion items (how-to guides)
```

---

### 2.6 Bundle Configure — Full-Page Bundle

**Route file:** `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
**URL:** `/app/bundles/full-page-bundle/configure/:bundleId`

```
FPB Configure Page
├── Header: Bundle name + status badge
│
├── Tabs
│   ├── Bundle Settings
│   │   ├── Bundle name / description
│   │   ├── Status selector → opens Status Modal
│   │   ├── Target page selector → opens Page Selector Modal
│   │   ├── Product selector → opens Product Picker Modal
│   │   └── Theme template selector → opens Theme Templates Modal
│   │
│   ├── Steps
│   │   ├── List of configured steps
│   │   └── [Button] "Add Step" → inline step builder
│   │       └── Product/Collection picker per step → opens Product Picker
│   │
│   ├── Pricing
│   │   ├── Discount type selector (percentage / fixed amount / fixed price)
│   │   ├── Tier configuration (multi-tier pricing)
│   │   └── Preview of effective prices
│   │
│   └── Sync Bundle
│       ├── Sync status / last synced timestamp
│       └── [Button] "Sync Now" → background job
│
├── Save Bar (App Bridge): [Discard] [Save]
│
└── Modals:
    ├── Bundle Status Modal (Draft / Active / Unlisted)
    ├── Product Picker Modal (Shopify resource picker)
    ├── Page Selector Modal (select Shopify page)
    ├── Theme Templates Modal (choose product template)
    └── Widget Placement Validation Modal
```

---

### 2.7 Bundle Configure — Product-Page Bundle

**Route file:** `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
**URL:** `/app/bundles/product-page-bundle/configure/:bundleId`

```
PPB Configure Page
├── Sidebar Nav (6 sections — mirrors Easy Bundles hierarchy)
│   ├── [📝] Step Setup              → step_setup section
│   ├── Free Gift & Add Ons          → free_gift_add_ons section
│   ├── Messages                     → messages section
│   ├── Discount & Pricing           → discount_pricing section
│   ├── [👁] Bundle Visibility       → bundle_visibility section  [Pending badge when widget disabled]
│   └── [✏] Bundle Settings         → bundle_settings section
│
├── Step Setup
│   ├── Bundle product picker (Shopify resource picker)
│   ├── Accordion step cards (DnD reorder)
│   │   ├── Step name, min/max qty
│   │   ├── Products / Collections pickers
│   │   ├── Step conditions
│   │   └── isFreeGift toggle + addon fields (label, title, icon, displayFree, unlockAfterCompletion)
│   └── [+ Add Step] button
│
├── Free Gift & Add Ons
│   ├── Empty state: "No add-on steps configured" with [Go to Step Setup] CTA
│   └── Per-addon-step cards: addonLabel, addonTitle, addonDisplayFree, addonUnlockAfterCompletion
│
├── Messages
│   ├── 7 text override fields + locale selector (existing)
│   └── Gift Messages sub-section
│       ├── Toggle: giftMessagesEnabled
│       ├── Gift product picker (Shopify resource picker → giftMessageProductId)
│       ├── Sender/Recipient checkbox (giftMessageEnableSenderRecipient)
│       ├── Mandatory checkbox (giftMessageMandatory)
│       ├── Send email checkbox (giftMessageSendEmail)
│       └── Char limit switch + number field (giftMessageEnableLimit + giftMessageCharLimit)
│
├── Discount & Pricing
│   ├── Enable toggle + discount method selector
│   ├── Buy X Get Y rule builder (shown when method = BUY_X_GET_Y)
│   │   └── Per-rule: buyStepId, getStepId, getQty selectors
│   ├── Standard rule builder (shown for other methods)
│   ├── Bundle Quantity Options sub-section
│   │   ├── Toggle: qtyOptionsEnabled
│   │   ├── Per-rule: Box Label + Box Subtext inputs
│   │   └── Default rule radio selector (qtyOptionsDefaultRuleId)
│   └── Discount Progress Bar sub-section
│       ├── Toggle: progressBarEnabled
│       ├── Style: Simple Bar / Step-Based Bar radio
│       ├── Progress Text textarea
│       └── Success Text textarea
│
├── Bundle Visibility
│   ├── App Embed Status (inline AppEmbedBanner when disabled)
│   ├── Publishing Best Practices (2×2 card grid)
│   ├── Your Bundle Link (copy + preview button)
│   └── Bundle Widget sub-section
│       ├── Toggle: upsellWidgetEnabled
│       ├── Display Mode: radio (block / button)
│       ├── Display On: select (all / specific_products / specific_collections)
│       └── Auto-Select Browsed Product: toggle (autoSelectBrowsedProduct)
│
├── Bundle Settings
│   ├── Pre-selected Variant (text field)
│   ├── Product Quantity Limits (maxQtyPerProduct number field)
│   ├── Product Slots (toggle + icon URL input)
│   ├── Variant Selector toggle (variantSelectorEnabled)
│   ├── Add-to-Bundle Button text toggle (showTextOnAddButton)
│   ├── Cart Line Labels (bundleCartTitle + bundleCartSubtitle)
│   ├── Bundle Banners (bundleBannerDesktopUrl + bundleBannerMobileUrl)
│   └── Custom CSS textarea (bundleLevelCss — sanitized via processCss)
│
└── Floating Readiness Gauge (position: fixed, bottom-left)
    ├── Circular SVG progress ring (score 0–100)
    ├── Expandable checklist: Steps configured, Bundle product linked,
    │   Discount set up, Widget enabled, App embed active
    └── Click to expand/collapse
```

**Widget storefront features (as of v2.9.0):**
- Step slot cards (empty/filled/locked states) with `addonLabel` for free gift tabs
- Quantity option pills (from `displayOptions.bundleQuantityOptions`)
- Gift message UI: textarea + optional From/To fields + char counter
- Progress bar (from `displayOptions.progressBar`)
- Gift message cart line item with `_bundle_id` + `_gift_message` properties

---

### 2.8 Billing — `/app/billing`

**Route file:** `app/routes/app/app.billing.tsx`

```
Billing Page
├── Success / Error banners (conditional on ?upgraded=true or error param)
├── Subscription quota card
├── Current plan display
└── [Button] "Upgrade" / "Cancel subscription"
```

**Billing callback:** `/app/billing/callback` — confirms charge, redirects back.

---

## 3. User Flows

### Flow A: Auth
```
/ (landing)
  └── not authenticated → /auth/login → OAuth → /auth/callback → /app/dashboard
```

### Flow B: Create & Configure Bundle
```
/app/dashboard
  └── [Create Bundle] → Create Bundle Modal → POST
      └── redirect → /app/bundles/{type}/configure/{bundleId}
          ├── Fill Bundle Settings tab
          ├── Add Steps tab
          ├── Set Pricing tab
          └── [Save] → [Sync Bundle tab → Sync Now]
```

### Flow C: Design Customisation (DCP)
```
/app/design-control-panel
  └── [Customize] (FPB or PDP)
      └── Max modal opens
          ├── Click sidebar section → Settings panel updates
          ├── Change setting → Preview iframe updates via postMessage (no reload)
          ├── [Mobile] viewport toggle → iframe resets to 375px
          ├── [Floating Footer] layout toggle (FPB) → crossfade to other iframe
          └── [Save] → Save Bar submits → toast confirmation
```

### Flow D: Billing Upgrade
```
/app/pricing
  └── [Upgrade to Grow]
      └── Upgrade Confirmation Modal → confirm
          └── POST /api/billing/create → Shopify billing URL
              └── Merchant approves → /app/billing/callback?charge_id=...
                  └── confirm charge → /app/billing?upgraded=true
```

---

## 4. API Routes Reference

> These are backend-only — not navigable pages. Listed for DevTools network debugging.

| URL Pattern | Purpose |
|---|---|
| `/apps/product-bundles/api/bundle/:id.json` | Storefront bundle config (HMAC verified) |
| `/apps/product-bundles/api/bundles.json` | All active bundles for shop |
| `/api/preview/pdp` | PDP preview page (DCP iframe) |
| `/api/preview/fpb` | FPB preview page (DCP iframe) |
| `/apps/product-bundles/api/design-settings/:shop` | CSS vars for storefront widgets |
| `/api/billing/create` | Initiate subscription |
| `/api/billing/confirm` | Confirm subscription |
| `/api/billing/cancel` | Cancel subscription |
| `/api/install-pdp-widget` | Install PDP widget block to theme |
| `/api/install-fpb-widget` | Install FPB widget block to theme |
| `/api/activate-cart-transform` | Deploy cart transform function |
| `/api/activate-pixel` | Activate UTM web pixel |
| `/apps/product-bundles/api/proxy-health` | Proxy health check |
| `/api/attribution` | UTM attribution analytics data |
| `/api/widget-error` | Widget runtime error logging |
| `/api/webhooks/pubsub` | Pub/Sub webhook handler |
| `/api/inngest` | Inngest background job handler |

---

## 5. Screenshots Index

| File | What it shows |
|---|---|
| `screenshots/01-dcp-landing.png` | DCP landing page (two Customize cards + Custom CSS) |
| `screenshots/02-dashboard.png` | Dashboard (empty state — no bundles) |
| `screenshots/03-analytics.png` | Analytics / Attribution page |
| `screenshots/04-pricing.png` | Pricing page (Free vs Grow) |
| `screenshots/05-events.png` | Updates & FAQs page |
| `screenshots/06-create-bundle-modal.png` | Create Bundle modal |
| `screenshots/07-dcp-fpb-modal.png` | DCP FPB max modal (sidebar nav + settings + preview) |
| `screenshots/08-dcp-pdp-modal.png` | DCP PDP max modal |
