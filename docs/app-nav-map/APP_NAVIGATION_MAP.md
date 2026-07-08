# Wolfpack Product Bundles — App Navigation & UI Map

> **KEEP THIS UP TO DATE.**
> Any time a new page, modal, tab, sidebar section, or user flow is added or removed,
> this document **must** be updated. See CLAUDE.md for the enforcement rule.

**Last Updated:** 2026-07-08
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
├── Settings            → /app/settings
├── Integrations        → /app/integrations
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
├── Language selector → persists one shop-wide embedded Admin UI language for all staff accounts on change
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
- Full-page bundle preview opens the bundle page when published or creates/opens the draft preview page when no page exists.
- First successful preview records the Admin `bundle_previewed` event with bundle id, type, status, and link.

#### "Create Bundle" Button
Navigates to: `/app/bundles/create` (bundle type selection entry)

---

### 2.1a Create Bundle Entry — `/app/bundles/create`

**Route file:** `app/routes/app/app.bundles.create/route.tsx`

```
Create Bundle Entry
├── Header: "Select bundle builder type" + "How do bundle builder types work?" link
├── Bundle Type cards: Product Page Builder / Full Page Builder
├── [Button] "Next" / Continue
└── Modal: Bundle name only
    ├── TextField: Bundle name (required, min 3 chars)
    └── [Button] Save → POST action → redirect to existing configure page
```

Create redirect targets:
```
Product Page: `/app/bundles/product-page-bundle/configure/:bundleId?mode=create`
Full Page: `/app/bundles/full-page-bundle/configure/:bundleId?mode=create`
First-install first-bundle tour adds: `&first_load=true`
```

Configure page storefront sync status:
- Full-page and product-page configure pages show a Storefront sync banner above the section content.
- Save persists DB changes and queues background storefront sync instead of blocking on Shopify metafield publication.
- Existing Sync Bundle actions queue the same background storefront sync event.
- Failed sync state exposes Retry storefront sync, which posts `retryStorefrontSync` and polls `getStorefrontSyncStatus` until synced or failed.

#### Modal: Delete Bundle Confirmation
Triggered by: "Delete" row action
```
Delete Confirmation Modal (centered, small)
├── "Are you sure you want to delete [bundle name]?"
└── [Button] "Delete" / [Button] "Cancel"
```

---

### 2.2 Settings — `/app/settings`

**Route file:** `app/routes/app/app.settings.tsx`

Admin Settings hub:
```
Settings
├── Card: Design
│   └── Shows Settings -> Design controls: brand colors, typography, corners, images and GIFs
├── Card: Language
│   └── Shows multilanguage mode, supported languages, shared Cart & Checkout strings, Landing Page Layout strings, and Product Page Layout strings
└── Card: Controls
    └── Shows recovered Additional Configurations facts split by Landing Page Layout and Product Page Layout
```

Primary action:
- Design card Configure opens the Settings -> Design subpage

---

### 2.2b Integrations — `/app/integrations`

**Route file:** `app/routes/app/app.integrations.tsx`

Recovered Admin Integrations hub:
```
Integrations Hub
├── Request Integration action → https://wolfpackapps.com
└── Checkout
    ├── Gokwik → View Setup
    └── Shopflo → View Setup
```

All setup actions currently open `https://wolfpackapps.com` until WPB-owned quick setup guides are published.

Setup behavior:
- `View Setup` expands an internal recovered setup summary for guide-based integrations.
- External competitor help URLs are intentionally not embedded in source code; sanitized evidence remains in `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`.

---

### 2.3 Analytics — `/app/attribution`

**Route file:** `app/routes/app/app.attribution.tsx`
**Screenshot:** `screenshots/03-analytics.png`

```
Analytics Page (revamped — issue wpb-analytics-revamp-1)
├── Header: "Analytics" (ui-title-bar) + breadcrumb to /app/dashboard
├── No-data banner (s-banner) — pixel-active vs not-enabled copy
├── Pixel toggle: Enable/disable UTM tracking pixel
├── Toolbar: Compare-period chip · [Export CSV] · [Compare] · Date range selector
│
├── ── Section 1 ── FUNNEL HERO ── (app/components/analytics/FunnelHero.tsx)
│   └── Engaged → Added-to-Cart → Checked Out → Revenue bars
│       with drop-off pills between steps (coral)
│
├── ── Section 2 ── 2-up grid ──
│   ├── Engagement Pulse (EngagementPulse.tsx)
│   │   ├── KPI: engaged sessions + delta vs prev period
│   │   ├── KPI: engaged → checkout %
│   │   └── 30-day area chart (teal)
│   └── Revenue Attribution (RevenueAttribution.tsx)
│       ├── KPI: bundle revenue + delta
│       ├── KPI: bundle AOV
│       └── 30-day area chart (gold)
│
├── ── Section 3 ── Bundle Performance Matrix (BundlePerformanceMatrix.tsx)
│   └── Sortable table: name | preset chip | engaged | orders | conv. | AOV | revenue
│       Click row → navigate to /app/bundles/full-page-bundle/configure/$bundleId
│
└── ── Section 4 ── 2-up grid ──
    ├── Live Activity Feed (LiveActivityFeed.tsx)
    │   └── Stream of last-25 BundleEngagement rows w/ relative-time
    └── Top Campaigns (TopCampaigns.tsx)
        └── Top-5 UTM campaigns w/ bar bg + revenue/orders
```

**Visual tokens:** `app/components/analytics/shared/tokens.css`
- engagement teal `#0E7C7B`, revenue gold `#B08800`, drop-off coral `#D4493E`
- 44 px hero numerics · 11 px uppercase labels · 12 px radius · warm `#F5F2EE` bg

**Server helpers:** `app/lib/analytics/engagement-helpers.ts`
- `computeBundleFunnel`, `buildEngagementTrendSeries`, `buildBundlePerformanceMatrix`
- Pure-fn, unit-tested at `tests/unit/lib/engagement-helpers.test.ts`

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
│   ├── Discount & Pricing
│   │   ├── Discount type selector: Fixed Amount Off / Percentage Off / Fixed Bundle Price / Buy X, get Y
│   │   ├── Rule cards; Buy X, get Y uses Customer buys/gets, Discount value/type, and Apply Discount to
│   │   ├── Bundle Quantity Options: Box Label/Subtext per eligible rule + Multi Language modal
│   │   ├── Progress Bar: Simple Bar / Step-Based Bar + Multi Language modal
│   │   └── Discount Messaging: per-rule Discount Text, one Success Message, Variables modal
│   │
│   ├── Sync Bundle
│   │   ├── Sync status / last synced timestamp
│   │   └── [Button] "Sync Now" → background job
│   │
│   └── Select Template        → select_template section
│       ├── Heading: "Customize your bundle"
│       ├── [Button] "Customize Colors & Language" → /app/settings
│       └── 2×2 template grid (FPB: Standard Design, Classic Design, Compact Design, Horizontal Design)
│           └── Each card: preview placeholder + label + [Select]/[Selected] button
│               Persists: wpbLayoutTemplate (always FBP_SIDE_FOOTER) + wpbPresetId (STANDARD | CLASSIC | COMPACT | HORIZONTAL)
│
├── Save Bar (App Bridge): [Discard] [Save]
│
└── Modals:
    ├── Bundle Status Modal (Draft / Active / Unlisted)
    ├── Product Picker Modal (Shopify resource picker)
    ├── Page Selector Modal (select Shopify page)
    ├── Theme Templates Modal (choose product template)
    ├── Widget Placement Validation Modal
    ├── Variables Modal (Discount Messaging variable reference)
    ├── Bundle Quantity Options Multi Language Modal (Box Label / Box Subtext)
    └── Progress Bar Multi Language Modal (Tier Text / Tier Subtext)
```

---

### 2.7 Bundle Configure — Product-Page Bundle

**Route file:** `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
**URL:** `/app/bundles/product-page-bundle/configure/:bundleId`

```
PPB Configure Page
├── Sidebar Nav (6 sections — clone hierarchy)
│   ├── [📝] Step Setup              → step_setup section
│   ├── Discount & Pricing           → discount_pricing section
│   ├── [👁] Bundle Visibility       → bundle_visibility section  [Pending badge when widget disabled]
│   ├── [✏] Bundle Settings         → bundle_settings section
│   ├── Subscriptions                → subscriptions section
│   └── [📦] Select Template        → select_template section
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
├── Discount & Pricing
│   ├── Enable toggle + discount type selector: Fixed Amount Off / Percentage Off / Fixed Bundle Price / Buy X, get Y
│   ├── Buy X, get Y rule builder (shown when selected)
│   │   └── Per-rule: Customer buys, Customer gets, Discount value/type, Apply Discount to
│   ├── Standard and Fixed Bundle Price rule builders (shown for other types)
│   ├── Bundle Quantity Options sub-section
│   │   ├── Per-rule: Box Label + Box Subtext inputs + Make this rule default action
│   │   └── Multi Language modal: Select Language, Box Label, Box Subtext
│   ├── Progress Bar sub-section
│   │   ├── Style: Simple Bar / Step-Based Bar radio
│   │   └── Multi Language modal: Select Language, Tier Text, Tier Subtext
│   └── Discount Messaging sub-section
│       ├── Per-rule Discount Text + one global Success Message
│       └── Variables modal: five supported discount template variables
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
│   ├── Pre Selected Product
│   │   ├── Enable toggle
│   │   ├── Tip banner
│   │   ├── Default products title
│   │   ├── Multi Language
│   │   └── Browse Products (Shopify resource picker)
│   ├── Enable Quantity Validation
│   │   ├── Enable toggle
│   │   ├── Maximum allowed quantity per product
│   │   ├── Pro Tip banner
│   │   ├── FPB only: Product Slots toggle
│   │   ├── FPB only: Product Slots helper text
│   │   ├── FPB only: Slot Icon [Change Icon] opens bundle-level image picker; [Reset] clears icon
│   │   ├── FPB Slot Icon scope: per-bundle Bundle Settings control only; no Design Control Panel route
│   │   ├── FPB only note: only applies when rules are quantity-based
│   │   └── Pre-order & Subscription Integration blocked while Buy X, get Y is selected
│   ├── Cart line item discount display
│   │   └── [Button] "Edit Defaults" → /app/settings
│   ├── Bundle Banners (bundleBannerDesktopUrl + bundleBannerMobileUrl)
│   ├── Custom CSS textarea (bundleLevelCss — sanitized via processCss)
│   └── Bundle Status
│
├── Subscriptions
│   ├── Bundle Subscriptions
│   ├── How to setup?
│   ├── Text: "Allow customers to purchase the bundle as a subscription"
│   ├── [Button] "Get Subscription Plans" → POST validateSellingPlanGroups
│   └── No-common-plan warning when selected products do not share a selling plan group
│
├── Select Template
│   ├── Heading: "Customize your bundle"
│   ├── [Button] "Customize Colors & Language" → /app/settings
│   └── 2×2 template grid (PPB: Product List, Product Grid, Horizontal Slots, Vertical Slots)
│       └── Each card: preview placeholder + label + [Select]/[Selected] button
│           Persists: wpbLayoutTemplate (PDP_INPAGE | PDP_MODAL) + wpbPresetId (CASCADE | COGNIVE | MODAL | SIMPLIFIED)
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

### Flow C: Design Customisation
```
/app/settings
  └── [Customize] (FPB or PDP)
      └── Max modal opens
          ├── Click Design card → Settings -> Design panel opens
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
| `/apps/product-bundles/api/cart-bundle-details` | Signed storefront route that merges EB-style cart `bundle_details` metafield entries |
| `/apps/product-bundles/api/checkout-integration-discount-code` | Signed storefront route that creates short-lived app discount codes for third-party FPB checkout integrations |
| `/apps/product-bundles/api/design-settings/:shop` | CSS vars for storefront widgets |
| `/apps/product-bundles/api/language-settings/:shop` | Settings -> Language JSON for storefront widget text and cart labels |
| `/api/billing/create` | Initiate subscription |
| `/api/billing/confirm` | Confirm subscription |
| `/api/billing/cancel` | Cancel subscription |
| `/api/install-pdp-widget` | Install PDP widget block to theme |
| `/api/install-fpb-widget` | Install FPB widget block to theme |
| `/api/activate-cart-transform` | Deploy cart transform function |
| `/api/activate-pixel` | Activate UTM web pixel |
| `/app/app-embed-status` | Authenticated Admin resource route for Preview-button app embed revalidation |
| `/apps/product-bundles/api/proxy-health` | Proxy health check |
| `/health` | Public Render HTTP health check; returns 2xx only when the app and DB are ready |
| `/api/attribution` | UTM attribution analytics data |
| `/api/web-vitals` | No-op tombstone for retired custom Admin Web Vitals beacons; returns 204 for stale POSTs |
| `/api/widget-error` | Widget runtime error logging |
| `/api/webhooks/pubsub` | Pub/Sub webhook handler |
| `/api/inngest` | Inngest background job handler |

---

## 5. Screenshots Index

| File | What it shows |
|---|---|
| `screenshots/02-dashboard.png` | Dashboard (empty state — no bundles) |
| `screenshots/03-analytics.png` | Analytics / Attribution page |
| `screenshots/04-pricing.png` | Pricing page (Free vs Grow) |
| `screenshots/05-events.png` | Updates & FAQs page |
| `screenshots/06-create-bundle-modal.png` | Create Bundle modal |
