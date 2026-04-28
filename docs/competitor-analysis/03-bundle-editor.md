# Bundle Editor — All Panels

**Screenshots:** `12` through `22`

The bundle editor uses a **left sidebar navigation** with 8 sections. Each section opens a configuration panel in the main content area. A persistent top bar shows the bundle name and a "Select template" button.

---

## Sidebar Navigation

1. Step Setup
2. Free Gift & Add Ons
3. Messages
4. Discount & Pricing
5. Bundle Visibility
6. Bundle Settings
7. Subscriptions
8. *(Template selection — full-screen overlay)*

---

## 1. Step Setup

**Screenshots:** `13-bundle-editor-step-setup.png`, `14-bundle-editor-step-setup-bottom.png`, `15-bundle-editor-category-expanded.png`

### Step Configuration
Each "step" in the bundle is a product selection slot. Settings per step:
- **Step name** (text field)
- **Min quantity** / **Max quantity** — enforced during checkout
- **Pre-select products** (checkbox + product picker) — default products shown on load
- **Allow customers to skip this step** (checkbox)

### Categories (within a Step)
A step can have one or more **Categories** which act as product filter tabs:
- Each category has a **Name** (shown as a tab label)
- Products/Collections tab — choose which Shopify products or collections populate this category
- Multiple categories allow the customer to browse different product groups within a single step

### Rules Configuration
Conditional logic applied to each step:
- **Condition type:** Product / Variant / Tag / Collection / Price
- **Operator:** is / is not / contains / greater than / less than
- **Value:** free-text or picker
- Multiple rules can be stacked (AND logic)
- **Use case:** e.g., "only show variants where Tag = 'vegan'"

---

## 2. Free Gift & Add Ons

**Screenshot:** `16-bundle-editor-free-gift-addons.png`

- Toggle to enable Free Gift mode
- Product picker for the gift item
- Quantity setting
- Condition: e.g., "when bundle total exceeds $X"
- Add-on products: additional products the customer can optionally include (shown separately from the main bundle steps)

---

## 3. Messages

**Screenshot:** `17-bundle-editor-messages.png`

- **Bundle Title** — headline text on the bundle page
- **Bundle Subtitle/Description** — descriptive paragraph
- **Step instruction text** — shown above each step
- Dynamic variable system — variables like `{{discountConditionDiff}}`, `{{discountValue}}` are interpolated at render time
- Multi-language button visible (grayed out / paid feature for some fields)

---

## 4. Discount & Pricing

**Screenshot:** `18-bundle-editor-discount-pricing.png`

### Discount Types
- **Fixed Amount Off** — e.g., $10 off the bundle total
- **Percentage Off** — e.g., 15% off
- **Fixed Bundle Price** — the entire bundle has a fixed total price
- **Buy X Get Y** — buy X items, get Y free or at a discount

### Tiered Discount Rules
Multiple discount rules can be stacked. Each rule specifies:
- **Condition:** minimum quantity / minimum spend / specific step completed
- **Discount:** the reward applied when condition is met
- Rules are applied from lowest to highest condition threshold
- Progress bar in cart reflects the closest tier threshold the customer is approaching

### Pricing Display
- Show/hide original (retail) price
- Show/hide savings amount
- Savings format: amount only / percentage only / both

---

## 5. Bundle Visibility / Publishing

**Screenshot:** `19-bundle-editor-visibility.png`

- **Publish / Unpublish** toggle
- **Bundle page URL** — the Shopify page where the full-page bundle is embedded
- Publishing best practices checklist:
  - Verify theme app block is installed
  - Check the bundle product is assigned to a page
  - Confirm the page is visible in nav

---

## 6. Bundle Settings

**Screenshot:** `20-bundle-editor-bundle-settings.png`

Wide range of per-bundle behavioral settings:

| Setting | Description |
|---------|-------------|
| Pre-select products | Automatically add default products to the bundle on load |
| Max simultaneous product slots | Cap how many products can be in the bundle at once |
| Show product prices | Toggle price visibility on product cards |
| Show compare-at prices | Toggle original vs. sale price display |
| Allow quantity changes | Let customers change per-product quantity within the bundle |
| Cart redirect behavior | Go to checkout vs. go to cart after bundle add |
| Show discount banner | Display a promotional banner above the bundle |
| Banner text / color | Customize the banner message and background |
| Custom CSS (per-bundle) | Inject CSS scoped to this specific bundle |

---

## 7. Subscriptions

**Screenshot:** `21-bundle-editor-subscriptions.png`

- Enable subscription selling plans on the bundle
- Subscription app selector (Skio / Appstle / Bold — matches integrations hub)
- Selling plan: choose which subscription plan(s) are available
- Display label for subscription option shown to customer

---

## 8. Template / Design Picker

**Screenshot:** `22-bundle-editor-template-picker.png`

Triggered by "Select template" in the top bar — opens a **full-screen overlay dialog** (not a sidebar panel).

4 design templates:
| Template | Style |
|----------|-------|
| **Standard** | Default step-based layout |
| **Classic** | Traditional horizontal layout |
| **Compact** | Dense, space-efficient card grid |
| **Horizontal** | Side-by-side steps and summary |

Each template shows a live preview thumbnail. Selecting one immediately re-renders the bundle preview.

---

## Key Observations

- The step-based architecture allows complex multi-product bundles with conditional logic
- Category tabs within steps are a powerful UX pattern for guiding product choice
- The tiered discount system is the primary conversion tool — progress bars create psychological urgency
- Per-bundle CSS is an escape hatch for merchants who want pixel-perfect control beyond DCP
- Subscription integration is first-class, not an afterthought
