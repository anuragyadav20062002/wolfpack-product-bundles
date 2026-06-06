# Settings — Design Control Panel (DCP)

**Screenshots:** `23-settings-main.png`, `24-settings-design-brand-colors.png`, `25-settings-typography.png`, `26-settings-corners.png`, `27-settings-images-gifs.png`, `28-settings-expert-colors-general.png`

Route: `/brandConfig` → "Design" → Configure

---

## Panel Structure

The Design Control Panel has 5 tabs in its left nav:

1. Brand Colors
2. Typography
3. Corners
4. Images & GIFs
5. Expert Color Controls (toggle + 4 sub-tabs)

Plus a **"Preview Bundle"** button (top right) and **"Reset to default"** button.

---

## 1. Brand Colors

5 global color pickers (hex input + color well):

| Color | Purpose | Default |
|-------|---------|---------|
| Primary Color | Action buttons, progress bars, active elements | `#000000` |
| Button Text Color | Text on primary buttons | `#ffffff` |
| Primary Text Color | Product names, prices, labels | `#000000` |
| Secondary Color | Empty progress bars, inactive states | `#eeeeee` |
| Product Background Color | Background of product cards and cart footer | `#ffffff` |

---

## 2. Typography

3 text hierarchy levels, each with font size (px spinbutton, range 8–72) and weight toggle (Regular / Bold):

| Level | Applies To | Default Size | Default Weight |
|-------|-----------|-------------|----------------|
| Primary | Titles, prices, primary text | 16px | Bold |
| Secondary | Compare prices, discount messaging | 14px | Bold |
| Body | Variant selectors, general body text | 14px | Regular |

---

## 3. Corners

### Bundle Buttons
- **Corner Style:** Sharp / Base / Round
- **Base border radius:** 5px (spinbutton, active when Corner Style = Base)

### Product Card & Cart
- **Corner Style:** Sharp / Base
- **Base border radius:** 10px (min 2px, active when Corner Style = Base)

---

## 4. Images & GIFs

### Product Images
- **Image Fit:** Cover (default) / Contain / Fill
- Description: "Choose how product images should be displayed in cards"

### Loading Spinners
- **Bundle Loading GIF** — shown on initial bundle load; can be replaced (Remove button + upload)
- **Checkout GIF** — shown after customer completes the bundle; can be replaced

---

## 5. Expert Color Controls

Activated by a toggle checkbox: *"Change colors of individual elements of the bundle"*

4 sub-tabs, each with a "Show Color Guide" link (opens a preview image):

### General
| Property | Description | Default |
|----------|-------------|---------|
| Completed step color | Background for completed step indicators | `#000000` |
| Check Mark Color | Check mark icons on completed steps | `#FFFFFF` |
| Step Text Color | Step names / navigation labels | `#000000` |
| Product Page Title Color | Title text on bundle page | `#000000` |
| Step Progress Bar Empty Color | Incomplete portion of progress bars | `#cccccc` |
| Loading Screen Background Color | Bundle loading screen background | `transparent` |
| Condition Toast Background Color | Toast notification background | `#000000` |
| Condition Toast Text Color | Toast notification text | `#ffffff` |

**Categories sub-section:**
| Property | Default |
|----------|---------|
| Active Tab Background Color | `#000000` |
| Active Tab Text Color | `#F6f6f6` |
| Inactive Tab Background Color | `#FFFFFF` |
| Inactive Tab Text Color | `#000000` |

### Product Card
| Property | Description | Default |
|----------|-------------|---------|
| Background Color | Card background | `#ffffff` |
| Product Title Text Color | Product name | `#252525` |
| Add Product Button Color | Button background | `#000000` |
| Add Product Button Text Color | Button text | `#ffffff` |
| Empty State Border Color | Border of unfilled slots | `#000` |
| Empty State Text Color | Placeholder text in empty slots | `#3E3E3E` |

### Bundle Cart
| Property | Description | Default |
|----------|-------------|---------|
| Cart Background Color | Cart panel background | `#ffffff` |
| Cart Text Color | Content, totals, labels | `#000000` |
| Next Button Color | Next step button background | `#000000` |
| Next Button Text Color | Next step button text | `#ffffff` |
| Back Button Color | Back button background | `#6d7175` |
| Back Button Text Color | Back button text | `#000000` |
| Discount Text Color | Discount messaging | `#000000` |
| Discount Progress Bar Empty Color | Empty portion of discount bar | `#C1E7C5` |
| Discount Progress Bar Filled Color | Filled portion of discount bar | `#15A524` |

### Upsell
| Property | Description | Default |
|----------|-------------|---------|
| Upsell Button Color | Upsell button background | `#000000` |
| Upsell Button Text Color | Upsell button text | `#ffffff` |
| Upsell Widget Body Text Color | Body text on upsell widget | `#000000` |

---

## Key Observations

- The DCP is split into "easy" (5 brand colors) and "expert" (20+ element-level colors) to avoid overwhelming new merchants while still enabling power-user customization
- The "Show Color Guide" image links are a smart UX pattern — merchants can see exactly which element a color affects before changing it
- Custom loading GIFs are a differentiator for brand-conscious merchants
- The typography system (size + weight only, no font family picker here — font family is in Controls → Font Settings) keeps the DCP focused
