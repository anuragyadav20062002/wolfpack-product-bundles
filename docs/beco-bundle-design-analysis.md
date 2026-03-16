# Beco BYOB Bundle Page — Design Analysis

**Source URL:** https://www.letsbeco.com/pages/BYOB_13May
**Analysed:** 2026-03-17
**Reference screenshot:** `docs/beco-bundle-reference.png`

---

## Color Palette

| Token | Hex / RGB | Usage |
|---|---|---|
| Primary Green | `#00FF00` `rgb(0,255,0)` | Active tier button bg, ATC button bg, product card border |
| Light Green | `#E6FAE2` `rgb(230,250,226)` | Product card background, rating badge background |
| Pale Green | `#F2FAEE` `rgb(242,250,238)` | Inactive tier button background |
| Callout Green | `#C2FBBE` `rgb(194,251,190)` | "Add N more product" callout bar |
| Footer Green | `#F1F9EC` `rgb(241,249,236)` | Bottom cart footer row background |
| Black | `#000000` | Borders, headings, BUY BUNDLE button bg |
| White | `#FFFFFF` | Product image container bg, bottom cart card bg |
| Text Dark | `#121212` `rgb(18,18,18)` | Price text |
| Text Gray | `rgb(100,100,100)` | Rating number, review count text |
| Star Orange | `rgb(255,162,38)` | Star icon fill |

---

## Typography

| Element | Font Size | Font Weight | Color |
|---|---|---|---|
| Tier button label | 16px | 600 | #000 |
| Product title | 15px | 500 | #000 |
| Price | 16px | 600 | #121212 |
| Rating number | 14px | 400 | `rgb(100,100,100)` |
| Review count | 14px | 400 | `rgb(100,100,100)` |
| ATC button label | 14px | 700 | #000 |
| Callout bar text | 12px | 500 | #000 |
| "1/2 Products" text | 14px | 400-600 | #000 |
| Total label | 12px | 700 | #000 |
| BUY BUNDLE label | 13px | 700 | #FFF |

---

## Page Layout

```
┌─────────────────────────────────── Full width (2560px viewport) ───────────────────────────────────┐
│  [Sticky site nav — black, sticky top, z-index: 3]                                                  │
│                                                                                                      │
│  ┌──────────────── Content centered at 1080px ─────────────────────────────────────────────────┐   │
│  │                                                                                               │   │
│  │  [Tier Selector Row]  padding: 16px 120px 0px                                               │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                                 │   │
│  │  │ Buy 2 @499  >  │  │ Buy 3 @699  >  │  │ Buy 4 @849  >  │                                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                                 │   │
│  │                                                                                               │   │
│  │  [Hero Banner — aspect-ratio 4.8/1, video autoplay loop]                                    │   │
│  │  ┌───────────────────────────────────────────────────────┐                                  │   │
│  │  │              VIDEO / IMAGE BANNER                     │                                  │   │
│  │  └───────────────────────────────────────────────────────┘                                  │   │
│  │                                                                                               │   │
│  │  [Product Grid — CSS grid, 4 columns, 258px each, gap 16px]                                 │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                                       │   │
│  │  │ Card │ │ Card │ │ Card │ │ Card │                                                       │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                                                       │   │
│  │  ┌──────┐ ┌──────┐ ...                                                                     │   │
│  │                                                                                               │   │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                      │
│  [Fixed Bottom Cart — position:fixed, bottom:48px, z-index:5, centered 800px]                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component 1: Tier Selector Buttons

### Layout
- **Container:** `display:flex`, `flex-direction:row`, `gap:8px`, `padding:16px 120px 0px`
- **Width:** 1320px (matches content block + padding)
- Three equal-width buttons side by side

### Individual Button
```css
/* Active state (selected tier) */
.tier-btn--active {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #00FF00;          /* bright lime green */
  border: 1px solid #000;
  border-radius: 8px;
  padding: 0px 0px 0px 8px;
  width: ~354px;
  height: 60px;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  cursor: pointer;
}

/* Inactive state */
.tier-btn--inactive {
  background-color: #F2FAEE;          /* pale green */
  border: 1px solid #000;
  border-radius: 8px;
  /* all other styles same */
}
```

### Button Contents
- Text: `"Buy {N} @{price}"` — e.g. `"Buy 2 @499"`
- Chevron down SVG icon to the right of text

---

## Component 2: Hero Banner

```css
.hero-banner {
  width: 100%;
  aspect-ratio: 4.8 / 1;   /* wide banner ~1080×225px at 1080 content width */
  display: block;
}

/* Contains an autoplay looped muted video */
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- Full-width banner spanning the 1080px content area
- Video autoplays, loops, no controls visible
- Beco's banner: purple sunburst background with "BYO - Build Your Own" text
- Has a decorative border (yellow-green dotted) in their implementation

---

## Component 3: Product Card

### Outer Grid
```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 258px);
  gap: 16px;
  width: 1080px;
  padding: 8px 0 0;
}
```

### Card Wrapper (li)
```css
.grid-item {
  display: flex;
  flex-direction: column;
  width: 258px;
  height: 447px;
  max-width: min(360px, 100%);
}
```

### Card Body
```css
.product-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #E6FAE2;          /* light green */
  border: 1px solid #00FF00;          /* lime green border */
  border-radius: 24px;                /* very rounded corners */
  padding: 0 0 8px 0;
  width: 258px;
  height: 445px;
  overflow: hidden;
}
```

### Image Container
```css
.product-image-wrapper {
  display: block;
  background: #FFFFFF;
  border-radius: 6px;                  /* slight rounding — sits inside card corners */
  width: 256px;
  height: 256px;                       /* square 1:1 image, fills top half of card */
  overflow: hidden;
}

img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
```

### Info Section
```css
.product-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
  margin: 0 0 8px;
}
```

### Product Title
```css
.product-title {
  font-size: 15px;
  font-weight: 500;
  color: #000;
  overflow: hidden;                    /* 2-line clamp via height constraint */
  height: 36px;                        /* ~2 lines */
}
```

### Rating Row
```css
.rating-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.rating-badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  background: #E6FAE2;
  border: 1px solid #00FF00;
  border-radius: 24px;                 /* pill shape */
  padding: 4px 10px;
  height: 31px;
}

.rating-number {
  font-size: 14px;
  color: rgb(100,100,100);
}

.star-icon {
  color: rgb(255,162,38);              /* orange star */
}

.review-count {
  font-size: 14px;
  color: rgb(100,100,100);
}
```

### Price
```css
.price-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.price {
  font-size: 16px;
  font-weight: 600;
  color: #121212;
}
```

### Add To Box Button
```css
.atc-button-wrapper {
  padding: 0 8px;
}

.atc-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background: #00FF00;                 /* lime green */
  border: 1px solid #000;
  border-radius: 50px;                 /* fully pill-shaped */
  padding: 10px;
  width: 240px;
  height: 42px;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
}
```

**Note:** When a product is added, the ATC button changes to a quantity stepper (`−  1  +`) still in the same green pill shape.

---

## Component 4: Sticky Bottom Cart Bar

The bottom cart is a **fixed panel** that sits above the viewport bottom with a slide-up expand/collapse behavior.

### Outer Container
```css
.bottom-cart {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);        /* centered horizontally */
  z-index: 5;
  width: 800px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: rgba(0,0,0,0.2) 0px 10px 24px 0px;
  overflow: hidden;
}
```

### Callout Bar (top of panel — progress message)
```css
.callout-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background: #C2FBBE;                 /* light callout green */
  padding: 4px;
  width: 100%;
  height: ~25px;
  font-size: 12px;
  font-weight: 500;
  color: #000;
}
/* Text example: "Add 1 more product to get the bundle at ₹499" */
```

### Expanded Cart Lines (slide-up drawer section)
```css
.cart-lines {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px;
  width: 100%;
  overflow: hidden;
}

/* Each line item row */
.line-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 80px;
}

.line-item-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #000;
  overflow: hidden;
  flex-shrink: 0;
}

.line-item-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.line-item-title {
  font-size: 12px;
  font-weight: 400;
  overflow: hidden;                    /* single line truncation */
  height: 14px;
}

.line-item-price-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  /* shows: "₹350  x1" */
  font-size: 14px;
}

.delete-btn {
  /* trash icon SVG button */
  flex-shrink: 0;
}
```

### Bottom Footer Row (always visible)
```css
.cart-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #F1F9EC;                 /* footer green */
  padding: 8px 16px 16px;
  height: 72px;
  width: 100%;
  gap: 12px;
}
```

#### Left Side — Stacked Product Thumbnails + Product Count Toggle
```css
/* Stacked overlapping circular thumbnails */
.thumb-stack {
  display: flex;
  flex-direction: row;
  padding-left: 12px;
  height: 48px;
}

.thumb-item {
  width: 48px;
  height: 48px;
  border-radius: 9999px;               /* circle */
  background: #FFFFFF;
  border: (implicit white border for overlap separation);
  margin-left: -12px;                  /* overlap */
  overflow: hidden;
}

/* Empty slots shown as "+" circles */
.thumb-item--empty {
  /* same circle with a + SVG icon inside */
}

/* "1/2 Products ˅" toggle button */
.products-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  /* clicking expands the cart lines above */
}
```

#### Middle — Total
```css
.total-label {
  font-size: 12px;
  font-weight: 700;
  color: #000;
}
/* displays "Total: ₹350" */
```

#### Right Side — BUY BUNDLE Button
```css
.buy-bundle-btn {
  display: block;
  background: #000;                    /* black */
  border-radius: 8px;
  padding: 12px 32px;
  width: 154px;
  height: 40px;
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  text-align: center;
}
/* label: "BUY BUNDLE" */
```

---

## Full Page DOM Structure (simplified)

```
<body>
  <header>                          <!-- sticky black navbar -->

  <div.page-wrapper>                <!-- full width -->
    <div.tier-row>                  <!-- tier selector + content below -->

      <div.tier-buttons-row>        <!-- flex row, padding 16px 120px 0 -->
        <button.tier-btn--active>   <!-- "Buy 2 @499" — lime green -->
        <button.tier-btn>           <!-- "Buy 3 @699" — pale green -->
        <button.tier-btn>           <!-- "Buy 4 @849" — pale green -->

      <div.content-panel>           <!-- shown/hidden per selected tier -->
        <div.hero-banner>           <!-- aspect-ratio 4.8/1 video -->

        <div.grid-wrapper>          <!-- padding-top: 8px -->
          <ul.product-grid>         <!-- CSS grid 4-col, gap 16px -->
            <li.grid-item>          <!-- 258×447px flex column -->
              <div.product-card>    <!-- #E6FAE2 bg, 24px radius, lime border -->
                <button.img-wrap>   <!-- 256×256 white bg, 6px radius -->
                  <img>
                <div.info>
                  <p.title>
                  <div.rating-row>
                    <div.rating-badge>  <!-- lime border pill -->
                    <p.review-count>
                  <div.price-row>
                    <p.price>
                <div.atc-wrapper>
                  <button.atc>      <!-- lime, 50px radius pill -->
            ...more cards

  <!-- FIXED OVERLAY -->
  <div.bottom-cart>                 <!-- fixed, bottom:48px, 800px wide, 16px radius, shadow -->
    <div.callout-bar>               <!-- #C2FBBE, "Add N more..." -->
    <div.cart-lines>                <!-- expands upward, white bg -->
      <ul.line-items>
        <li.line-item>              <!-- 48px circular thumb + title + price + trash -->
    <div.cart-footer>               <!-- #F1F9EC, space-between -->
      <div.thumb-stack>             <!-- overlapping circles -->
      <button.products-toggle>      <!-- "1/2 Products ˅" -->
      <div.total>                   <!-- "Total: ₹350" -->
      <button.buy-bundle>           <!-- black, 8px radius -->
```

---

## Key Design Decisions to Copy

1. **Brand color = lime green `#00FF00`** — used consistently as the primary accent: tier buttons, card borders, ATC button, rating badges.
2. **Card = very rounded (24px)** with a 1px lime border on a light-green tinted background — gives an organic, fresh feel matching the eco brand.
3. **Image area = square 1:1**, takes up ~57% of card height (256/447). White background inside the card's green bg.
4. **Rating pill = lime border + light-green bg** (same language as the card itself, reinforces brand consistency).
5. **ATC button = full-width pill (50px radius)** in lime green with bold black text + 1px black border.
6. **Bottom cart floats** at `bottom: 48px` (not flush to edge), card-like with large shadow and 16px radius — feels like a floating summary card.
7. **Callout bar** is a thin green strip at top of the cart card showing how many more items are needed — key conversion mechanic.
8. **Stacked circular thumbnails** in the cart footer to show selected products at a glance — elegant and space-efficient.
9. **BUY BUNDLE button = black** (intentional contrast against all-green palette to make the CTA pop).
10. **Tier buttons** use a left padding offset (`padding-left: 8px`) with centered content — gives a slightly asymmetric feel that is intentional.
