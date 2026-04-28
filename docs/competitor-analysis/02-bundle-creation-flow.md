# Bundle Creation Flow

**Screenshots:** `03` through `11`

---

## Entry Points

Two ways to start:
1. **"Create New Bundle"** button on dashboard
2. Presumably also from a bundle list page

---

## Step 1 — How to Create (Method Selection)

Two distinct creation paths:

### Path A: AI Bundle Creation
- Large text area with placeholder: *"Describe your ideal bundle or paste a product URL to create one instantly with AI"*
- Example prompt shown: *"a skincare bundle with a cleanser, moisturizer, and SPF for daily use"*
- "Generate Bundle" CTA
- **UX:** Single natural-language prompt generates a complete bundle configuration including suggested products, layout, discount settings

### Path B: Templates
- Grid of 6+ pre-built "proven templates" with category labels
- Each card shows a template name, a category tag (e.g. "Starter", "Popular"), and a thumbnail
- Templates are categorized by use case (skincare, supplements, gifting, etc.)
- Clicking a template pre-populates the bundle editor

---

## Step 2 — Layout Picker

**4 layout options** presented as visual cards with labels:

| Layout | Placement | Description |
|--------|-----------|-------------|
| **Classic** | Landing Page (Full Page) | Traditional multi-step bundle builder on a dedicated page |
| **Horizontal** | Landing Page (Full Page) | Side-by-side step-and-cart layout |
| **Product List** | Product Page | Embedded widget on a product detail page |
| **Horizontal Slots** | Product Page | Slot-based picker on a product detail page |

Each card shows a visual preview thumbnail and a brief description.

---

## Step 3 — Product Source

Choose how the bundle gets its products:

- **Specific Products** — use the Shopify native resource picker (product search modal)
- **Entire Collection** — select a collection; all products in it are eligible

### Shopify Native Resource Picker
When selecting specific products, the app opens the **Shopify native `ResourcePicker` dialog** — a full-screen modal with search, filter, and multi-select. This is the standard Shopify embedded app resource picker (not a custom-built modal).

---

## AI Creation Flow

When using AI creation:
1. Merchant submits a prompt
2. **"Crafting your bundle..."** loading screen — displays a spinner/GIF with descriptive copy
3. **"Your Bundle is ready"** success screen — shows a summary of what was generated
4. Drops the merchant directly into the bundle editor pre-populated

---

## Key Observations

- AI path dramatically lowers the setup barrier — a merchant can go from zero to a configured bundle in under 60 seconds
- Template path provides proven starting points, reducing cognitive load
- Layout selection happens before product selection, which trains the merchant to think about placement context first
- The Shopify resource picker is used natively, avoiding the need to build a custom product search UI
