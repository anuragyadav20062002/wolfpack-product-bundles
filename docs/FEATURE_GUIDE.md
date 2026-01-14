# Feature Guide

**Last Updated:** January 14, 2026

## Table of Contents
- [Bundle Types](#bundle-types)
- [Bundle Builder](#bundle-builder)
- [Design Customization](#design-customization)
- [Pricing & Discounts](#pricing--discounts)
- [Cart Transform](#cart-transform)
- [Analytics](#analytics)
- [Subscription Billing](#subscription-billing)
- [Theme Integration](#theme-integration)

## Bundle Types

### Product-Page Bundles

**Purpose:** Embed a bundle widget directly on existing product pages.

**How It Works:**
1. Merchant selects a product
2. App creates metafield on product
3. Widget automatically injected via Theme App Extension
4. Customers see bundle options on product page

**Use Cases:**
- "Complete the look" bundles
- Accessory bundles (phone + case + charger)
- Upsell complementary products
- Product variations sold as bundles

**Customization:**
- Modal drawer from bottom
- Product cards with images
- Variant selection
- Quantity controls
- Add to cart button

### Full-Page Bundles

**Purpose:** Create dedicated standalone bundle pages.

**How It Works:**
1. Merchant creates bundle
2. App creates Shopify page
3. Widget rendered on dedicated page
4. Customers navigate to `/pages/bundle-name`

**Use Cases:**
- "Build your own box" experiences
- Multi-step bundle builders
- Subscription boxes
- Gift sets
- Custom kits

**Customization:**
- Full-width layout
- Multi-step navigation
- Category tabs
- Grid layouts (2-6 cards per row)
- Progress tracking

## Bundle Builder

### Multi-Step Bundles

Create bundles with multiple selection steps:

**Features:**
- Unlimited steps
- Custom step names and icons
- Min/max quantity per step
- Product/collection filtering per step
- Conditional step visibility

**Example:**
```
Step 1: Choose Base (min: 1, max: 1)
Step 2: Add Toppings (min: 2, max: 5)
Step 3: Select Size (min: 1, max: 1)
```

### Product Selection

**Methods:**
- Manual product selection
- Collection-based selection
- Search and filter
- Display variants as individual products

**Product Card Display:**
- Product image
- Title
- Price (strike-through + final)
- Variant selector
- Quantity selector
- Add to bundle button

### Conditional Logic

**Step Conditions:**
- Show step only if previous step total >= X
- Show step only if specific products selected
- Dynamic step unlocking

**Example:**
"Show premium toppings only if customer spent $50+"

### Bundle Preview

**Features:**
- Live preview as customers build
- Running total calculation
- Discount messaging
- Progress bar (optional)
- Step validation indicators

## Design Customization

### Design Control Panel (DCP)

Comprehensive visual customization system with 50+ settings.

#### Global Settings

**Color Scheme:**
- Primary colors
- Accent colors
- Background colors
- Text colors

**Typography:**
- Font sizes (12-48px)
- Font weights (300-900)
- Line heights
- Text alignment

#### Product Card Customization

**Layout (Full-Page Only):**
- Card width (200-400px)
- Card height (300-600px)
- Card spacing (10-60px)
- Cards per row (2-6)

**Styling:**
- Background color
- Border radius (0-24px)
- Border width (0-5px)
- Border color
- Shadow (customizable)
- Hover effects

**Image Settings:**
- Image height (100-400px)
- Image fit (cover/contain/fill)
- Image border radius
- Image background color

**Typography:**
- Title visibility
- Title font size/weight/color
- Price visibility
- Price colors (strike-through vs final)
- Price font sizes

#### Button Customization

**Add to Bundle Button:**
- Background color
- Text color
- Border radius (0-24px)
- Font size (12-24px)
- Font weight
- Custom text (e.g., "Add to Box")
- Hover colors

#### Variant Selector

**Styling:**
- Background color
- Text color
- Border radius (0-16px)
- Dropdown style

#### Quantity Selector

**Styling:**
- Background color
- Text color
- Border radius (0-16px)
- Button style (+/- buttons)

#### Product Modal (Product-Page)

**Background & Layout:**
- Modal background color
- Modal border radius
- Modal width

**Typography:**
- Title font size (16-48px)
- Title font weight
- Price font size (14-36px)

**Components:**
- Variant selector border radius
- Button styling (bg, text, radius)

#### Bundle Footer

**Display Options:**
- Show/hide footer
- Total pill styling
- Footer background
- Price display format

**Navigation:**
- Back/Next button styling
- Button text customization
- Disabled state styling

#### Progress & Messaging

**Progress Bar:**
- Show/hide progress
- Bar color
- Background color
- Height/border radius

**Discount Messaging:**
- Conditions text (e.g., "Add $10 more")
- Qualified text (e.g., "You saved $5!")
- Message colors
- Show in cart toggle

#### Advanced Customization

**Custom CSS:**
- Raw CSS injection
- CSS variable overrides
- Responsive breakpoints

**Per-Bundle-Type Settings:**
- Separate designs for product-page vs full-page
- Shop-level defaults
- Bundle-specific overrides

### Live Preview

**Features:**
- Real-time updates
- Product card preview
- Modal preview
- Visual feedback
- Responsive preview (coming soon)

## Pricing & Discounts

### Discount Methods

**1. Percentage Off**
- Apply X% discount to bundle
- Example: "Save 20% on complete bundle"

**2. Fixed Amount Off**
- Apply $X discount to bundle
- Example: "Save $10 when you bundle"

**3. Fixed Bundle Price**
- Set total bundle price
- Example: "Complete bundle for $99"

**4. Free Shipping**
- Waive shipping costs for bundle
- Applied at checkout

### Tiered Pricing Rules

Create multiple pricing tiers based on conditions:

**Condition Types:**
- Minimum quantity
- Minimum subtotal
- Specific products selected
- Step completion

**Example Rules:**
```
Rule 1: Buy 2+ items → 10% off
Rule 2: Buy 4+ items → 20% off
Rule 3: Buy 6+ items → 30% off
```

### Progress Bar Messaging

**Condition Messages:**
Show customers how close they are to discounts:
- "Add 2 more items to save 10%"
- "Spend $20 more for free shipping"

**Qualified Messages:**
Confirm when discount is earned:
- "You're saving 20%!"
- "Free shipping applied!"

**Display Options:**
- Show in bundle widget
- Show in cart
- Custom colors
- Progress bar visualization

### Cart-Level Application

**Implementation:**
- Discounts applied via Cart Transform Function
- Automatic calculation at checkout
- No discount codes needed
- Works with Shopify discounts (stackable or exclusive)

## Cart Transform

### What It Does

Shopify Function that applies bundle logic and discounts at checkout.

**Processing Steps:**
1. Read cart items and properties
2. Identify bundle items via metafield ID
3. Group items by bundle
4. Validate bundle composition
5. Calculate applicable discounts
6. Apply transformations
7. Return transformed cart

### Bundle Validation

**Checks:**
- All required steps completed
- Min/max quantities respected
- Valid product combinations
- Matching bundle configuration

**Failure Handling:**
- Remove invalid discounts
- Log errors for debugging
- Allow checkout to proceed (graceful degradation)

### Discount Calculation

**Priority Order:**
1. Check all pricing rules
2. Apply highest eligible discount
3. Calculate per-item discount distribution
4. Apply to cart lines

**Examples:**
```
Bundle Total: $100
Discount: 20% off → -$20
Per Item: $100 / 5 items = $20/item
Discount per item: $4
```

### Metafield Integration

**Bundle Data Storage:**
```json
{
  "bundleId": "cm5abc123",
  "bundleType": "product_page",
  "steps": [
    {
      "stepId": "step-1",
      "products": [
        {"id": "gid://shopify/Product/123", "quantity": 1}
      ]
    }
  ]
}
```

**Cart Properties:**
- `_bundle_id`: Bundle identifier
- `_bundle_step_id`: Step identifier
- `_bundle_product_id`: Product within bundle

## Analytics

### Bundle Performance

**Metrics:**
- Views (bundle widget loads)
- Add to cart events
- Purchase conversions
- Revenue per bundle

**Filtering:**
- By bundle
- By date range
- By bundle type
- By shop

### Event Tracking

**Tracked Events:**
1. `view` - Bundle widget loaded
2. `add_to_cart` - Bundle added to cart
3. `purchase` - Bundle purchased

**Event Metadata:**
```json
{
  "bundleId": "cm5abc123",
  "shopId": "example.myshopify.com",
  "event": "add_to_cart",
  "metadata": {
    "items": 5,
    "total": 99.99,
    "discount": 20.00
  },
  "createdAt": "2026-01-14T10:30:00Z"
}
```

### Dashboard (Coming Soon)

**Planned Features:**
- Visual charts and graphs
- Conversion funnels
- Revenue attribution
- Top-performing bundles
- Customer insights

## Subscription Billing

### Plans

**Free Plan:**
- Up to 3 bundles
- Basic features
- Community support

**Grow Plan - $9.99/month:**
- Up to 20 bundles
- All features
- Priority support

### Billing Flow

**1. Installation:**
- Shop installs app
- Free plan active by default
- No credit card required

**2. Upgrade:**
- Merchant clicks "Upgrade"
- Shopify recurring charge created
- Redirect to approval URL
- Merchant approves in Shopify admin

**3. Activation:**
- Webhook received (APP_SUBSCRIPTIONS_UPDATE)
- Subscription status updated
- Features unlocked

**4. Cancellation:**
- Merchant cancels in Shopify admin
- Webhook received
- Downgrade to free plan
- Extra bundles archived (not deleted)

### Webhook Handling

**Subscription Events:**
- `APP_SUBSCRIPTIONS_UPDATE` - Status changes
- `APP_UNINSTALLED` - App removal
- `SHOP_UPDATE` - Shop information changes

**Processing:**
- Google Cloud Pub/Sub queue
- Idempotent webhook handling
- Retry logic for failures
- Audit trail in database

## Theme Integration

### Automatic Widget Installation

**Product-Page Bundles:**
1. Select product in admin
2. Click "Install Widget"
3. App creates metafield with bundle config
4. Theme App Extension detects metafield
5. Widget automatically appears on product page

**No Code Required:**
- Zero theme modifications
- Works with all themes
- Automatic updates
- Easy removal

### Theme App Extensions

**Blocks:**
- `bundle-product-page` - Product page widget
- `bundle-full-page` - Full page widget

**Liquid Integration:**
```liquid
{% for block in section.blocks %}
  {% case block.type %}
    {% when 'apps' %}
      {% render block %}
  {% endcase %}
{% endfor %}
```

### Manual Installation (Legacy)

For themes without App Extension support:

**Steps:**
1. Create Liquid snippet
2. Add JavaScript loader
3. Include CSS
4. Insert in product template

**Files Generated:**
- `snippets/bundle-widget.liquid`
- Widget loads from CDN

### Theme Editor Integration

**Customization:**
- Drag-and-drop block placement
- Settings in theme editor
- Visual preview
- Per-product configuration

**Settings:**
- Widget position
- Spacing controls
- Mobile visibility
- Custom CSS classes

## Coming Soon

### Planned Features

**Q1 2026:**
- [ ] Analytics dashboard
- [ ] Bulk bundle operations
- [ ] Bundle templates
- [ ] CSV import/export

**Q2 2026:**
- [ ] A/B testing
- [ ] Customer segmentation
- [ ] Advanced conditional logic
- [ ] Bundle recommendations

**Q3 2026:**
- [ ] Subscription bundles
- [ ] Recurring orders
- [ ] Member-only bundles
- [ ] Gift cards integration

## Support

For implementation help, see:
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Cart Transform Function](CART_TRANSFORM_FUNCTION.md)
- [Design Control Panel](DESIGN_CONTROL_PANEL.md)
