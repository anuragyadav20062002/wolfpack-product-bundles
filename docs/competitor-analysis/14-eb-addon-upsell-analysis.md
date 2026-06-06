# EB Add-on Products / Upsell Step — Complete End-to-End Analysis

**Analysis date:** 2026-04-26 (updated with full admin crawl)
**Source:** Live crawl of EB (Easy Bundle Builder) at `prod.frontend.giftbox.giftkart.app` via embedded Shopify admin — store `wolfpack-store-test-1`
**Context:** Phase 2, item 2.3 from `13-wolfpack-gap-analysis-phases.md` — planning Wolfpack's add-on/upsell + theme extension banner implementation

---

## 0. EB's Complete Bundle Editor — Section Map

The bundle editor sidebar contains **7 main sections** under "Bundle Setup":

```
Bundle Setup
├── Step Setup           ← product steps + category rules
├── Free Gift & Add Ons  ← Feature A (gifting step) + Feature B (add-ons with bundles)
├── Messages             ← Feature A config + Gift Message system
├── Discount & Pricing   ← discount rules, quantity options, progress bar, messaging
├── Bundle Visibility    ← App Embed Status + placement guides + bundle URL
│   └── Bundle Widget    ← product page upsell button/block (sub-section)
├── Bundle Settings      ← pre-selected products, slots, variant selector, CSS, etc.
├── Subscriptions        ← subscription purchase of the whole bundle
└── Select template      ← 4 storefront layout themes
```

**Plus persistent elements:**
- Readiness Score (top right, also shown in bottom-left panel)
- Preview Bundle button
- Theme Extension Banner (conditional — shown when app embed not yet enabled)

---

## 1. Theme Extension Banner

### What it looks like

A full-width yellow/amber warning alert displayed **above the bundle product card** and **above all setup sections**:

```
⚠️  Enable the Theme app extension for Easy Bundles to place and preview the bundle.    [Enable here]
```

- Icon: warning/triangle (amber)
- Text: "Enable the Theme app extension for Easy Bundles to place and preview the bundle."
- Button: "Enable here" (right-aligned)
- Rendered as an ARIA `alert` with `live="polite"`

### When it appears

The banner appears on every bundle's Configure Bundle Flow page when the app embed block is **not yet enabled** in the merchant's active theme. It disappears once enabled.

### What "Enable here" does

Clicking "Enable here":
1. Opens Shopify's Theme Editor in a **background tab** pointed directly at the App Embeds panel with the EB embed pre-selected and enabled.
2. The Readiness Score updates in the foreground tab (35 → 50).
3. The banner disappears from the foreground tab.

**The URL pattern for the Theme Editor deep-link:**
```
https://admin.shopify.com/store/{shop}/themes/{theme_id}/editor
  ?context=apps
  &appEmbed={CLIENT_ID}%2F{EMBED_BLOCK_NAME}
```

For EB specifically:
- `CLIENT_ID`: `10b4272bede142b02924feec498b4009`
- `EMBED_BLOCK_NAME`: `app-embed`
- Full: `?context=apps&appEmbed=10b4272bede142b02924feec498b4009%2Fapp-embed`

### What the Theme Editor shows

When the link opens, Shopify's theme editor lands on the **App embeds panel** (`context=apps`), pre-filtered to "EB | Easy Bundle Builder":

```
App embeds
[Search: EB | Easy Bundle Builder]

▼ Easy Bundle                    [●] (toggle ON)
  EB | Easy Bundle Builder
  This app embed doesn't have customizable settings.
  Manage app ↗

Find apps built for themes on the Shopify App Store.
```

The toggle shows as "Disable Easy Bundle" (meaning it's already ON). The merchant can close this tab — the extension was enabled programmatically when they clicked the EB admin button.

### What it means for Wolfpack

Wolfpack's "Place Widget Now" flow is functionally equivalent — but EB's implementation integrates this as a **Readiness Score gating step**, surfaced as a persistent banner on every unconfigured bundle.

**Implementation requirements:**
1. Detect whether the Wolfpack app embed block is enabled in the merchant's active theme
2. If not → show the banner on the bundle configure pages
3. The "Enable here" button must construct the Theme Editor deep-link:
   ```
   /admin/themes/{activeThemeId}/editor?context=apps&appEmbed={WOLFPACK_CLIENT_ID}%2F{EMBED_BLOCK_NAME}
   ```
4. Open this URL via Shopify App Bridge `Redirect.Action.REMOTE` (opens in same tab) or just `window.open` for background tab behavior
5. Track the embed state via Shopify REST Admin API: `GET /admin/api/2024-01/themes/{id}/assets.json?asset[key]=config/settings_data.json` — or simpler: use `GET /admin/api/2024-01/themes.json` + check enabled state

**Wolfpack-specific integration point:**
- Check: Does the Wolfpack gamified onboarding setup checklist have "Enable theme extension" as a step? EB includes it as a Readiness Score item (15 points out of 35→50).
- The banner should be dismissible (merchant can choose to dismiss and place widget manually)

---

## 2. Readiness Score System

### Observed values
- Score at install: **35** (theme extension not enabled)
- Score after enabling theme extension: **50**
- Maximum: **100** (inferred — "Complete all steps to maximise your bundle's success")

### What the panel shows

```
35  Readiness Score
Complete all steps to maximise your bundle's success.
```

This is displayed in **two places**:
1. Top-right of the bundle editor (badge next to "Preview Bundle")
2. Bottom-left of the left panel (larger heading version)

### Scoring breakdown (inferred from what changed)

| Step | Points |
|---|---|
| Theme extension enabled | +15 (35 → 50) |
| Products added to steps | ? |
| Discount configured | ? |
| Bundle visibility set | ? |
| Template selected | ? |

### What it implies for Wolfpack

Wolfpack already has a gamified setup flow with readiness steps. The "Enable App Embed" step should be one of the tracked steps, contributing to the overall readiness/progress percentage. EB shows this as a persistent score — Wolfpack should match this with the existing setup stepper.

---

## 3. Bundle Visibility Page (Full Detail)

### App Embed Status section

```
App Embed Status                                    [Enabled ✓]
Your store is connected and ready. Your bundle can now render on your storefront
```

This is the persistent status indicator. Green "Enabled" badge when the theme extension is active.

### Publishing Best Practices section

Four placement cards with "Quick Setup Guide → 5 min setup" each:

| Placement | Description |
|---|---|
| Hero Banner | "Add a button to your homepage hero to drive shoppers directly to your bundle." |
| Navigation Menu | "Add your bundle as a nav link so shoppers can find it from anywhere on your store." |
| Announcement Banner | "Show your offer in the announcement bar so visitors see it instantly." |
| Featured Product Card | "Feature your bundle product on your homepage so shoppers find it right away." |

### Your Bundle Link

```
https://wolfpack-store-test-1.myshopify.com/apps/gbb/easybundle/1
[Copy Link]
```

Description: "Use this link to place your bundle anywhere - theme components, emails, ads, or social bios."

**URL pattern:** `https://{shop}.myshopify.com/apps/gbb/easybundle/{bundle_id}`

### Want more placement options? → Bundle Widget

"Add a bundle button to specific product pages."  
Button: "Set up Bundle Widget"

---

## 4. Bundle Widget — Product Page Upsell

A separate feature from add-ons. Configurable per-bundle under Bundle Visibility → Bundle Widget.

### Feature

**Product Page Bundle Upsell Widgets** (toggle ON/OFF)
"This will display an upsell block or button on the product pages of your choice."

Preview: shows a product page with "Buy with a Bundle & Save 20%" button below the ATC button.

### Display modes

| Mode | Description |
|---|---|
| Offer Upsell Block | Full block embedded in product page |
| Offer Upsell Button | Single button below the Add to Cart |

### Widget Settings

| Setting | Default | Notes |
|---|---|---|
| Multi Language | (button) | disabled until widget enabled |
| Button Text | "Save More With Bundle" | customisable |
| Display Widget on | All products in bundle | also: Specific products, Specific collections |
| Add browsed product to bundle | OFF | auto-selects the current product when entering the bundle |
| Embed Upsell Button | custom position | "By default, the upsell button is added below the Buy Button. You can move it to a custom spot." |

### Wolfpack Equivalent

Wolfpack's PPB (Product Page Bundle) widget already does this. The "Add browsed product to bundle" behaviour is the key differentiator — EB pre-selects the product the shopper is currently viewing when they click "Buy with Bundle".

---

## 5. Free Gift & Add Ons — Refined Feature Data

### Feature A — Add-Ons and Gifting Step

**Sidebar section:** Visible in both "Free Gift & Add Ons" and "Messages" panels.

Full field list:

| Field | Type | Default | Notes |
|---|---|---|---|
| Toggle | checkbox | ON | Enables the add-on step |
| Step Name | textbox | "Add On" | Shown as tab label in the step navigator |
| Step Title | textbox | (empty) | Shown as panel header within the step |
| Step Icon | file upload | gift icon | Custom image for the step tab |
| Multi Language | button | — | Localise Step Name + Step Title |

**Structural note:** The "Add-Ons and Gifting Step" block lives inside the "Messages" sidebar section, not exclusively under "Free Gift & Add Ons". Clicking "Messages" scrolls to show Feature A config first, then the gift message config below it. This is a UX quirk — both sections share the same scrollable panel.

---

### Feature B — Add-Ons with Bundles

**Sidebar section:** "Free Gift & Add Ons"

#### Top-level controls

| Field | Type | Default |
|---|---|---|
| Toggle | checkbox | OFF |
| Add on Section title | textbox | (empty) — storefront label above add-ons |

#### Per-Tier Configuration (Tier 1 shown)

| Field | Type | Default | Notes |
|---|---|---|---|
| Tier name | textbox | "Tier 1" | Storefront-visible label |
| Products | product picker | (empty) | Add-on products this tier offers |
| Display Variants as Individual Products | checkbox | OFF | Shows each variant as its own card |
| Discount Based on | dropdown | "Bundle Product Quantity" | Also: "Bundle Value" |
| Quantity / Amount condition | spinbutton | 1 | The threshold to unlock the discount |
| Discount on Add-ons % | spinbutton | 10 | Percentage off add-ons when condition met |
| Tier Rules | section | (empty) | "Add Tier Rule" — multiple rules per tier |

#### Per-Tier Messaging (Footer)

| Field | Type | Default |
|---|---|---|
| Show Variables button | button | — |
| Multi Language button | button | — |
| Message when rule not met | textbox | `"Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"` |
| Success Message | textbox | `"Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"` |

#### Template Variables

| Variable | Meaning |
|---|---|
| `{{addonsConditionDiff}}` | Remaining qty/value gap to unlock the add-on discount |
| `{{addonsDiscountValue}}` | The numeric discount value (e.g. `10`) |
| `{{addonsDiscountValueUnit}}` | `%` for percentage, currency symbol for fixed |

#### Tier Rules (sub-system within a tier)

"Add Tier Rule" adds additional quantity/value thresholds within the same tier, allowing stepped discounts. The exact schema for a tier rule is not fully observable without adding one, but the UI implies:
- Condition: Quantity or Value
- Operator: ≥ / ≤ / =
- Value: spinbutton
- Discount: %

#### "Add Add Ons Tier" button

Appends a new tier below the existing ones. Each tier is fully independent with its own product list, condition, discount, and messaging.

---

## 6. Gift Messages System (New — Not in Original Analysis)

Located in the "Messages" sidebar section, below the Feature A (Gifting Step) config.

### Feature: Enable Messages

Toggle: **OFF** by default.
Description: "Message will show up as a product at checkout"

**Key mechanic:** The gift message is configured as a **Shopify product** that gets added to the cart as a line item. The merchant selects which product represents the message (via the "Edit" picker showing "Message"). This means gift messages appear in the cart, order, and fulfillment as a distinct item.

### Full field list

| Field | Type | Default | Notes |
|---|---|---|---|
| Enable Messages | toggle | OFF | Master switch |
| Message product | picker | (empty) | The Shopify product that becomes the message line item |
| Enable Sender and Recipient Fields | checkbox | OFF | Shows "From" / "To" fields on storefront |
| Make Gift Message mandatory | checkbox | OFF | Customer cannot proceed without entering message |
| Enable Message Limit (Characters) | checkbox | OFF | Enables character limit on message input |
| Message Limit | spinbutton | (disabled) | Unlocked when character limit enabled |
| Send message through email | checkbox | OFF | EB sends an email to the customer with the message |
| Customize Emails button | button | — | Opens email template editor |

**Note in UI:** "Please reach out to us if you wish to change the domain from where the emails are sent."

### Wolfpack relevance

Wolfpack doesn't have a gift message system. This is a future feature to consider — the "message as product" mechanic is architecturally elegant because it reuses Shopify's existing line item system, no custom storage needed.

---

## 7. Discount & Pricing — Refined Data

### Discount Type options

| Type | Notes |
|---|---|
| Fixed Amount Off | e.g. $5 off when qty ≥ 2 |
| Percentage Off | (default) — e.g. 10% off when qty ≥ 2 |
| Fixed Bundle Price | whole bundle at a set price |
| **Buy X, get Y** | new — not in original analysis |

### Rules engine

Rules are applied "lowest to highest". Each rule:
- **Discount on:** Quantity | Amount
- **Operator:** is greater than or equal to (also: ≤, =)
- **Threshold value:** spinbutton (default: 2)
- **Discount value:** % (or $ for fixed)
- Multiple rules via "Add rule" button

**Tip shown in UI:** "Discounts are calculated based on the products in cart, make sure to add the 'Default Product' quantity or amount while configuring discounts."

### Bundle Quantity Options

A preset bundle size selector shown on the storefront. Allows merchants to define pre-configured quantities (e.g. "Box of 2 — 10% off", "Box of 4 — 20% off").

| Field | Default |
|---|---|
| Toggle | ON |
| Multi Language | — |
| Rule #1 "Make default" | pressed (active rule) |
| Box Label | "Box of 2" |
| Box Subtext | "10% off" |

Note: "Bundle Quantity Options can only be enabled when discount rules are based on quantity."

### Progress Bar

| Field | Default | Notes |
|---|---|---|
| Toggle | OFF | Enables the progress bar |
| Multi Language | disabled (when OFF) | — |
| Simple Bar | radio, selected | Basic progress bar |
| Step-Based Bar | radio | Multi-step progress indicators |

### Discount Messaging

| Field | Default |
|---|---|
| Toggle | ON |
| Enable multi-language | checkbox |
| Show Variables button | — |
| Discount Text (Rule #1) | `"Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!"` |
| Success Message (Rule #1) | `"Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart."` |

**Template variables for discount messaging:**

| Variable | Meaning |
|---|---|
| `{{discountConditionDiff}}` | Remaining qty/value to unlock the discount |
| `{{discountValue}}` | Numeric discount value |
| `{{discountValueUnit}}` | `%` or currency symbol |

---

## 8. Bundle Settings — Full Data

### Pre Selected Product

Toggle: OFF
"Choose products that should be added to bundle by default"
"These products will be added to user's box automatically on the first step."

**Tip:** "Discounts are based on all items in your cart. Don't forget to include the Pre Selected Product's quantity or amount when setting up discounts."

### Enable Quantity Validation

Toggle: OFF
| Field | Default |
|---|---|
| Maximum allowed quantity per product | 1 (spinbutton, disabled until toggle ON) |

### Product Slots

Toggle: OFF
"This feature displays empty slots on the storefront."

**Slot Icon:**
- "You can change the default icon that renders in the empty slots"
- Upload file / Change Icon / Reset buttons
- Note: "Only applicable when rules are based on quantity"

### Variant Selector

Toggle: **ON** (default)
"Enable variant selection within the product cards instead of the quick look"

### Show Text on + Button

Toggle: OFF
"Replaces the + icon with a text button and moves it below the price."

### Pre-order & Subscription Integration

Toggle: OFF
"Let customers select a unique selling plan (subscription, pre-order, etc.) for each product in the bundle."

### Bundle Cart

| Field | Default |
|---|---|
| Multi Language | button |
| Bundle Cart Title | "Your Bundle" |
| Bundle Cart Subtitle | "Review your bundle" |

**Cart line item discount display:**
- "Shows how much the customer is saving on the bundle in cart"
- "Edit Defaults" button (app-level defaults)
- Options: "Use app defaults" (default) | "Customize for this bundle"

### Bundle Banner

Desktop and mobile banner images at the top of the bundle page.

| Field | Recommended Size |
|---|---|
| Banner Image: Desktop | 1900×230 |
| Banner Image: Mobile | 1100×500 |

### Bundle Level CSS

A custom CSS input for per-bundle style overrides. (Heading visible but input not observed — likely a textarea or code editor.)

### Bundle Status

Dropdown: **Active** | Draft

---

## 9. Subscriptions

**Bundle Subscriptions** (per-bundle)
"Allow customers to purchase the bundle as a subscription"

**Requirement:** All products in the bundle must be part of the same Shopify subscription plan (selling plan group).

**Alert shown:** "To offer this bundle as a subscription, all of its products must be part of the same subscription plan in your Shopify settings. Please update your product selling plans and try again."

**Buttons:** "Learn More" | "Get Subscription Plans"

---

## 10. Select Template — Bundle Layout Themes

A modal opens with 4 storefront layout options:

| Template | Status |
|---|---|
| Standard Design | Available |
| Classic Design | **Currently selected** (default) |
| Compact Design | Available |
| Horizontal Design | Available |

**"Customize Colors & Language" button** in the modal header — opens the global DCP colour/language editor.

After selecting a template, a "Next" button advances to the next setup step.

---

## 11. Cart Transform Implications (Refined)

### Feature A (Gifting Step) — Part of Bundle MERGE

Gifting step products are part of the main bundle MERGE. They are identified by being in the "addon step" (`_step: "addon"` or similar property). The Cart Transform applies the bundle discount to them just like any other step product. Discount is determined by the bundle-level discount rule (not a separate tier discount).

### Feature B (Add-Ons with Bundles) — Separate EXPAND per tier

Add-on products from Feature B are **separate line items**. Each add-on line item carries:
```js
properties: {
  _bundle_id: "...",          // links to parent bundle
  _addon_tier_id: "tier_abc", // which tier's rule to evaluate
  _addon_bundle_type: "with_bundles" // disambiguates from gifting step
}
```

The Cart Transform:
1. Identifies add-on lines by `_addon_tier_id` presence
2. Fetches the bundle config (from metafield or DB) to get the tier's condition
3. Evaluates: are the bundle's main product lines (same `_bundle_id`, no `_addon_tier_id`) meeting the `conditionValue`?
4. If YES → applies `percentageDecrease: { value: tier.discountPercent }` via EXPAND
5. If NO → add-on stays at full price (no EXPAND operation)

**"Tier Rules" sub-system:** Each tier can have multiple rules with different quantity thresholds and discount percentages. This creates a stepped discount within a single tier (e.g. buy ≥1 → 5% off, buy ≥3 → 15% off).

---

## 12. Wolfpack Implementation Blueprint (Updated)

### 12.1 Feature Scope & Priority

| Feature | Priority | Effort | Notes |
|---|---|---|---|
| **Theme Extension Banner + enable flow** | P0 | Low | Critical for "Place Widget Now" equivalence |
| **Readiness Score (setup stepper)** | P0 | Low | Already have gamified setup — extend it |
| **Bundle Visibility page** | P1 | Low | Show App Embed Status + placement guides |
| **Add-Ons with Bundles (Feature B)** | P1 | High | Core of Phase 2.3 |
| **Gifting Step (Feature A)** | P2 | Medium | Simpler step variant |
| **Gift Messages system** | P3 | Medium | Not in Phase 2.3 — future feature |
| **Bundle Widget (product page upsell)** | P3 | Low | Already have PPB widget |
| **Buy X, Get Y discount** | P3 | Medium | Not in Phase 2.3 |
| **Bundle Quantity Options** | P2 | Medium | Preset box sizes — high conversion value |

---

### 12.2 Theme Extension Banner — Wolfpack Implementation

**Banner component:**
```tsx
// Show when: !bundleSettings.appEmbedEnabled
// Dismiss: not dismissible (re-check on every load like EB)
// OR: dismissible with a "Remind me later" button

<Banner tone="warning">
  Enable the Wolfpack theme extension to place and preview your bundle.
  <Button onClick={handleEnableEmbed}>Enable here</Button>
</Banner>
```

**`handleEnableEmbed` logic:**
```ts
async function handleEnableEmbed() {
  const activeTheme = await getActiveTheme(shop); // REST API: GET /themes.json?role=main
  const themeEditorUrl = `https://${shop}/admin/themes/${activeTheme.id}/editor`
    + `?context=apps`
    + `&appEmbed=${WOLFPACK_CLIENT_ID}%2F${EMBED_BLOCK_NAME}`;
  
  // Open in new tab (background) like EB does
  window.open(themeEditorUrl, '_blank');
  
  // Optimistically update the readiness score / banner state
  setAppEmbedEnabled(true);
}
```

**Shopify App Bridge alternative (no window.open):**
```ts
import { Redirect } from '@shopify/app-bridge/actions';
const redirect = Redirect.create(app);
redirect.dispatch(Redirect.Action.REMOTE, themeEditorUrl);
```

**Theme ID detection:**
```ts
// REST Admin API
const themes = await admin.rest.get({ path: 'themes' });
const mainTheme = themes.body.themes.find(t => t.role === 'main');
const themeId = mainTheme.id;
```

**Embed block check:**
```ts
// Check if the app embed is enabled
// The embed block key in Shopify is: appEmbed/{BLOCK_NAME}
// Readable via: GET /themes/{id}/assets.json?asset[key]=config/settings_data.json
// Or via the App Bridge API
```

**Wolfpack constants:**
- `WOLFPACK_CLIENT_ID`: your Shopify app client ID (from `.env` / `SHOPIFY_API_KEY`)
- `EMBED_BLOCK_NAME`: the name of the app embed block from your `shopify.app.toml` or `shopify.extension.toml`

---

### 12.3 Bundle Visibility Page — Wolfpack Implementation

A new "Bundle Visibility" section in the bundle editor with:

```
App Embed Status                    [Enabled ✓] or [Not Enabled ⚠]
"Your store is connected and ready. Your bundle can now render on your storefront"

Publishing Best Practices
Pick a placement and follow the quick guide to make your bundle discoverable.

┌─────────────────┐  ┌─────────────────┐
│  Hero Banner    │  │  Navigation     │
│  [Quick Guide]  │  │  Menu [Guide]   │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│  Announcement   │  │  Product Card   │
│  [Quick Guide]  │  │  [Quick Guide]  │
└─────────────────┘  └─────────────────┘

Your Bundle Link
[https://your-store.myshopify.com/apps/wolfpack/bundle/123]  [Copy]
"Use this link to place your bundle anywhere - theme components, emails, ads."
```

---

### 12.4 Add-Ons with Bundles — Data Model (Refined)

**Prisma schema additions:**

```prisma
model Bundle {
  // ... existing fields ...

  // Feature B — Add-Ons with Bundles
  addOnsEnabled      Boolean       @default(false)
  addOnSectionTitle  String?
  addOnTiers         AddOnTier[]
}

model AddOnTier {
  id               String        @id @default(cuid())
  bundleId         String
  bundle           Bundle        @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  sortOrder        Int           @default(0)
  name             String        @default("Tier 1")           // storefront-visible
  products         Json          // [{variantId, productId, title, imageUrl, price}]
  displayVariants  Boolean       @default(false)              // show variants as individual products
  discountBasedOn  String        @default("quantity")         // "quantity" | "value"
  conditionValue   Float         @default(1)                  // qty or $ threshold
  discountPercent  Float         @default(10)
  tierRules        Json          @default("[]")               // [{conditionValue, discountPercent}]
  ruleNotMetMsg    String        @default("Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons")
  successMsg       String        @default("Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons")
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}
```

**Key additions vs original:**
- `displayVariants` — show each variant as a separate product card
- `tierRules: Json` — array of sub-rules for stepped discounts within a tier
- `onDelete: Cascade` — tier is deleted when bundle is deleted

---

### 12.5 Metafield Schema (Refined)

```json
{
  "addOns": {
    "enabled": true,
    "sectionTitle": "Enhance Your Bundle",
    "tiers": [
      {
        "id": "tier_abc123",
        "name": "Tier 1",
        "discountBasedOn": "quantity",
        "conditionValue": 1,
        "discountPercent": 10,
        "displayVariants": false,
        "tierRules": [
          { "conditionValue": 3, "discountPercent": 20 }
        ],
        "products": [
          {
            "variantId": "gid://shopify/ProductVariant/123",
            "productId": "gid://shopify/Product/456",
            "title": "Add-on Product",
            "imageUrl": "https://cdn.shopify.com/...",
            "price": 1999
          }
        ],
        "messaging": {
          "ruleNotMet": "Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
          "success": "Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons"
        }
      }
    ]
  }
}
```

---

### 12.6 Widget Changes (Refined)

**Condition evaluation (client-side) — with `tierRules` support:**

```js
function evaluateAddonCondition(tier, bundleState) {
  const currentValue = tier.discountBasedOn === 'quantity'
    ? bundleState.steps.reduce((sum, s) => sum + s.selectedCount, 0)
    : bundleState.steps.reduce((sum, s) => sum + s.selectedValue, 0);
  // Find the best matching rule (highest threshold met)
  const applicableRules = [
    { conditionValue: tier.conditionValue, discountPercent: tier.discountPercent },
    ...(tier.tierRules || [])
  ].filter(r => currentValue >= r.conditionValue);

  if (applicableRules.length === 0) {
    // Find the next rule to unlock
    const nextRule = [
      { conditionValue: tier.conditionValue, discountPercent: tier.discountPercent },
      ...(tier.tierRules || [])
    ].sort((a, b) => a.conditionValue - b.conditionValue)[0];

    return {
      met: false,
      diff: Math.max(0, nextRule.conditionValue - currentValue),
      discountPercent: nextRule.discountPercent
    };
  }

  const bestRule = applicableRules.sort((a, b) => b.conditionValue - a.conditionValue)[0];
  return { met: true, diff: 0, discountPercent: bestRule.discountPercent };
}
```

**Template variable resolution:**
```js
function resolveMessage(template, { diff, discountPercent }) {
  return template
    .replace(/{{addonsConditionDiff}}/g, diff)
    .replace(/{{addonsDiscountValue}}/g, discountPercent)
    .replace(/{{addonsDiscountValueUnit}}/g, '%');
}
```

---

### 12.7 Cart/Add-to-Cart (Refined)

```js
// Main bundle items (unchanged)
{ variantId, quantity, properties: { _bundle_id, _step, _category, ... } }

// Add-on items (new)
{
  variantId,
  quantity,
  properties: {
    _bundle_id: "abc123",           // links to parent bundle
    _addon_tier_id: "tier_abc123",  // which tier's discount to evaluate
    _addon_discount: "10"           // % discount at time of add (snapshot)
  }
}
```

**Important:** Snapshot the `_addon_discount` at add-to-cart time. The Cart Transform can re-evaluate it server-side, but the snapshot helps with UI optimistic updates in the cart.

---

### 12.8 Cart Transform (Refined with tierRules)

```typescript
// Identify add-on lines
const addonLines = cart.lines.filter(l =>
  l.attribute('_addon_tier_id') !== null
);

for (const addonLine of addonLines) {
  const bundleId = addonLine.attribute('_bundle_id');
  const tierId = addonLine.attribute('_addon_tier_id');
  const bundleConfig = getBundleConfig(bundleId);
  const tier = bundleConfig.addOns.tiers.find(t => t.id === tierId);
  if (!tier) continue;

  // Evaluate bundle state
  const bundleLines = cart.lines.filter(l =>
    l.attribute('_bundle_id') === bundleId &&
    l.attribute('_addon_tier_id') === null
  );

  const currentValue = tier.discountBasedOn === 'quantity'
    ? bundleLines.reduce((sum, l) => sum + l.quantity, 0)
    : bundleLines.reduce((sum, l) => sum + (l.cost.totalAmount.amount * l.quantity), 0);

  // Find best applicable rule
  const allRules = [
    { conditionValue: tier.conditionValue, discountPercent: tier.discountPercent },
    ...(tier.tierRules ?? [])
  ];
  const applicableRules = allRules.filter(r => currentValue >= r.conditionValue);
  if (applicableRules.length === 0) continue; // no discount applies

  const bestRule = applicableRules.sort((a, b) => b.conditionValue - a.conditionValue)[0];

  result.operations.push({
    expand: {
      cartLineId: addonLine.id,
      expandedCartItems: [{
        merchandiseId: addonLine.merchandise.id,
        quantity: addonLine.quantity,
        price: { percentageDecrease: { value: bestRule.discountPercent } }
      }]
    }
  });
}
```

---

## 13. Wolfpack-Specific Differentiators (Updated)

| EB Feature | Wolfpack Opportunity |
|---|---|
| Percentage discount only on add-ons | Also support fixed amount off, free (100% off) |
| "Enable here" opens new tab | "Enable here" can inline-update and show confirmation in the same page |
| Readiness Score = opaque number | Wolfpack gamified setup already shows named steps — show "Theme Extension" as explicit step |
| 4 placement guide cards (static) | Link directly to theme editor sections for each placement (Hero Block, Nav, etc.) |
| Bundle URL is app proxy URL | Wolfpack uses page template — may need app proxy or direct page URL |
| No progress bar on add-ons | Show per-tier progress indicator on add-on section |
| No add-on analytics | Track add-on attach rate, revenue contribution in Analytics |
| Gift messages as separate product | Consider inline notes (simpler) before full product-based approach |

---

## 14. Screenshots Index

| File | Section | Description |
|---|---|---|
| `eb-free-gift-addons-panel.png` | Free Gift & Add Ons | Toggles OFF (original) |
| `eb-addons-enabled-full.png` | Free Gift & Add Ons | Both toggles ON, Tier 1 visible |
| `eb-addons-tier1-expanded.png` | Free Gift & Add Ons | Tier 1 fully expanded — all fields |
| `eb-readiness-score-50.png` | Configure Bundle Flow | Score at 50 after enabling theme extension |
| `eb-bundle-visibility-page.png` | Bundle Visibility | App Embed Status + placement guides |
| `eb-bundle-widget-upsell.png` | Bundle Widget | Product page upsell button config |
| `eb-messages-section.png` | Messages | Gifting step + gift message config |
| `eb-discount-pricing.png` | Discount & Pricing | Full discount + messaging config |
| `eb-bundle-settings.png` | Bundle Settings | All bundle-level settings |
| `eb-subscriptions.png` | Subscriptions | Subscription purchase panel |
| `eb-select-template.png` | Select Template | 4-layout template picker modal |
| `eb-template-selector-modal.png` | Select Template | Close-up of template selector |

---

## 15. Summary

**The Theme Extension Banner** is a persistent, conditional warning shown on every bundle editor page until the merchant enables the app embed. Clicking "Enable here" deep-links into Shopify's Theme Editor app embeds panel via `?context=apps&appEmbed={CLIENT_ID}%2F{EMBED_BLOCK_NAME}`, and the embed is toggled on automatically. This contributes ~15 points to the Readiness Score (35 → 50).

**Add-Ons with Bundles (Feature B)** is EB's primary add-on mechanism — an orthogonal upsell panel below the bundle cart with tiered percentage discounts conditioned on bundle quantity or value. Each tier supports sub-rules for stepped discount escalation, a dedicated product list, storefront-visible names, and per-tier messaging templates.

**The Gifting Step (Feature A)** is a named bundle step (tab) with customisable name, title, and icon. Products in this step are merged into the main bundle via MERGE Cart Transform, not separately discounted.

**For Wolfpack's Phase 2.3 implementation priority:** Theme Extension Banner first (P0, low effort, high merchant activation value), then the Bundle Visibility page with placement guides (P1), then Add-Ons with Bundles data model and widget (P1, high effort).
