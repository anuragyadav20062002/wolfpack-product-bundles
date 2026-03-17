# Skai Lama — Full-Page Bundle (FPB) Sidebar Panel Analysis

**Analyzed:** 2026-03-17
**Template name (Skai Lama internal):** `FBP_SIDE_FOOTER`
**Links:**
1. Bundle 34 (apparel): `https://skailama-demo.myshopify.com/apps/gbb/easybundle/34` — 3 paid steps + free gift step
2. Bundle 39 (toys): `https://skailama-demo.myshopify.com/apps/gbb/easybundle/39` — 1 paid step + free greeting card

**Screenshots:** `docs/skai-lama-analysis/` (01–18, new captures)

---

## 1. Page-Level Layout

```
┌─────────────────────────────────────────────────────────────┐
│                  [Store Nav Bar]                             │
├────────────────────────────────────────┬────────────────────┤
│  STEP TIMELINE (full width of left col)│                    │
│  ○──────●──────○──────○                │   YOUR BUNDLE      │
│  Tee   Pants Hoodie  Cap               │   sidebar panel    │
│                                        │   (sticky)         │
│  [BANNER IMAGE — current step]         │                    │
│                                        │                    │
│  ┌───────┐ ┌───────┐ ┌───────┐        │                    │
│  │       │ │       │ │       │        │                    │
│  │Product│ │Product│ │Product│        │                    │
│  └───────┘ └───────┘ └───────┘        │                    │
│                                        │                    │
│  ┌───────┐ ┌───────┐ ┌───────┐        │                    │
│  │       │ │       │ │       │        │                    │
│  └───────┘ └───────┘ └───────┘        │                    │
├────────────────────────────────────────┴────────────────────┤
│                   [Store Footer]                             │
└─────────────────────────────────────────────────────────────┘
```

- **Left column (~70%)**: Step timeline + banner + product grid
- **Right column (~30%)**: Sticky sidebar "Your Bundle" panel
- The sidebar stays in place while the user scrolls the product grid

---

## 2. Step Timeline

### Visual Structure
```
  ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
  │  [img]  │───────│  [img]  │───────│  [img]  │───────│  [img]  │
  └─────────┘       └─────────┘       └─────────┘       └─────────┘
   Add Tee           Add Pants          Add Hoodie         Free Cap
```

- Each step: square image inside a circular border (48px) + step name label below
- Connecting line: thin horizontal progress bar running between circles
- **Active step**: circle has thick black border (4px solid black), image fully opaque
- **Completed step**: green checkmark icon overlaid on circle
- **Locked step**: image desaturated or normal (no visual lock indicator in desktop)
- Timeline spans the full width of the left column
- Font: Inter sans-serif; step name: ~12px, color: `rgb(0,0,0)`

### Classes (Skai Lama internal)
- `.gbbNavigationItem` — each step
- `.gbbNavigationStepImgContainerActive` — active state (black border)
- `.gbbNavigationTitleContainer` / `.gbbNavigationTitle`
- `.gbbStepsProgressBar` — the connecting line

---

## 3. Banner Image (per-step)

- Large full-width banner image at the top of the product grid area
- Changes as the user advances through steps (each step has its own configured banner)
- Example: Step 1 shows large "TSHIRTS" graphic, Step 2 shows "PANTS" etc.
- Fixed height (appears ~120px tall on desktop)
- Configured per-step in the bundle admin

---

## 4. Product Grid

### Layout
- **Desktop**: 3 columns
- **Mobile**: 2 columns
- Cards: white background, rounded corners, subtle shadow

### Product Card — Unselected State
```
┌─────────────────────────┐
│                         │
│    [Product Image]      │  ← square image, fills card
│                         │
│  Product Name           │
│                         │
│  $60.00        [+ ADD]  │  ← price left, button right
└─────────────────────────┘
```
- ADD button: dark pill `+ ADD` (black bg, white text, rounded)
- No border / light card border

### Product Card — Selected State (quantity > 0)
```
┌─────────────────────────┐  ← highlighted border (black outline)
│                         │
│    [Product Image]      │
│                         │
│  Product Name           │
│                         │
│  $60.00     [- 1 +]     │  ← quantity stepper replaces ADD button
└─────────────────────────┘
```
- Border: solid black or dark outline on the card wrapper
- ADD button replaced by `- 1 +` stepper (dark bg, white text)

### Free Gift Step — Product Cards
```
┌─────────────────────────┐
│ [Free]                  │  ← "Free" yellow label badge top-left
│    [Product Image]      │
│                         │
│  Product Name           │
│                         │
│  $0.00         [+ ADD]  │
└─────────────────────────┘
```
- "Free" badge: yellow/cream pill label at top-left of card image
- Price shown as $0.00
- Page heading: "Complete the look and get a cap free!"

---

## 5. Right Sidebar — "Your Bundle" Panel

### Overall Dimensions / Style
- Width: ~200px (full right column width)
- Background: white (Bundle 34) / blue (`#4B7BE5` approx) (Bundle 39)
- Border: subtle border or card shadow
- `position: sticky; top: [nav height]` — stays visible while scrolling product grid
- Padding: ~12px
- Font: Inter sans-serif

### Panel Structure (top to bottom)

```
┌─────────────────────────────────────┐
│  Your Bundle          [🗑 Clear]    │  ← header row
│  Review your bundle                 │  ← subtext (link?)
├─────────────────────────────────────┤
│  Add 3 product(s) to get the        │  ← progress message
│  bundle at $140.00                  │
│  0 item(s)                          │  ← item count
├─────────────────────────────────────┤
│  [img] Product name        x1  [🗑] │  ← selected item row
│        $20.00                       │
│  [░░░░░░░░░░░░░░░░░░] skeleton      │  ← empty slot placeholder
│  [░░░░░░░░░░░░░░░░░░] skeleton      │
│  ...                                │
├─────────────────────────────────────┤
│  Free Cap                ───────    │  ← free gift section divider
│  ┌───────────────────────────────┐  │
│  │ 🔒 Add N more product(s) to  │  │  ← locked state
│  │    claim a FREE cap!          │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Total                  $80.00      │  ← total row
│  [←]            [Next →]           │  ← navigation buttons
└─────────────────────────────────────┘
```

### Header
- "Your Bundle" — bold, ~16px
- "Review your bundle" — smaller subtext (possibly a link to full review)
- "Clear" button: red trash icon + "Clear" text, top-right corner

### Progress Message
- Dynamic text: `"Add {N} product(s) to get the bundle at ${X}"`
- Updates live as user selects products

### Selected Item Row
- Small product thumbnail (~40px)
- Product name (truncated if long)
- Price
- Quantity label `x1`
- Delete icon (trash) — clicking removes item from bundle

### Empty Slot Placeholder
- Gray skeleton lines (shimmer/loading appearance)
- One placeholder per remaining required slot

### Free Gift Section
#### Locked State (requirements not met)
```
┌─────────────────────────────────────┐
│  🔒  Add N more product(s) to       │
│      claim a FREE [item]!           │
└─────────────────────────────────────┘
```
- Background: light gray box with subtle border
- Padlock icon (🔒) on the left
- Text: `"Add {N} more product(s) to claim a FREE {giftName}!"`

#### Unlocked State (requirements met, selecting from free gift step)
- The entire sidebar still shows items, but the free gift section shows a green success state
- On mobile bottom sheet: `"Congrats you are eligible for a FREE cap!"` — green background box with checkmark ✓

#### Free Gift Unlocked — Bundle Complete State
```
┌─────────────────────────────────────┐
│  [img]  Cap Blue       x1  [🗑]     │  ← free item in list, $0.00 (was $15.00)
│         $0.00 ~~$15.00~~            │
└─────────────────────────────────────┘
```
- Free gift item appears in the selected items list
- Price shown as `$0.00` with original price strikethrough

### Total Row
- "Total" label + formatted price
- Once complete: shows discount badge (e.g., "30% off") + discounted price + original strikethrough

### Navigation Buttons
#### In-Progress State
- Left: `←` back button (navigate to previous step)
- Right: `Next` button (dark/black bg, white text, rounded pill)

#### Complete State (all steps filled)
- Left: `←` back button
- Right: `Add To Cart` button — **large, prominent, dark background**, white text
- Discount badge: `30% off` green/dark pill displayed near the total price

---

## 6. Mobile Behavior

### Sidebar → Sticky Bottom Bar
On mobile, the sidebar panel completely disappears and is replaced by a **sticky bottom bar**:

```
┌─────────────────────────────────────────────────────┐
│  ^ N items  [message text]                          │  ← toggle row
├─────────────────────────────────────────────────────┤
│              Next  •  $140.00  [30% off]            │  ← CTA button (cream/yellow pill)
└─────────────────────────────────────────────────────┘
```

- `^` caret + item count: tapping expands the bottom sheet
- Message varies by state:
  - In-progress: nothing / "Congratulations 🎊 you have gotten the best offer!"
  - Complete: "Congratulations 🎊..." message
- CTA pill: cream/yellow background, rounded, `Next • $X` or `Add To Cart • $X`

### Expanded Bottom Sheet (mobile)
Tapping the `^` caret slides up the bundle panel:
```
┌─────────────────────────────────────────────────────┐
│  ^ 4 items  [Congratulations message]               │
│  Your Bundle                          [🗑 Clear]    │
│  Review your bundle                                 │
│  ────────────────────────────────────────────────  │
│  [img]  Cap Blue               x1  [🗑]            │
│         $0.00  ~~$15.00~~                          │
│  [img]  Hoodie Blue            x1  [🗑]            │
│         $120.00                                    │
│  [img]  Pants Blue             x1  [🗑]            │
│         $60.00                                     │
│  [img]  T-Shirt Blue           x1  [🗑]            │
│         $20.00                                     │
│  ─── Free Cap ──────────────────────────────────  │
│  ✅ Congrats you are eligible for a FREE cap!      │
│  ────────────────────────────────────────────────  │
│              Next  •  $140.00  [30% off]           │
└─────────────────────────────────────────────────────┘
```

- Slides up over the product grid (overlays it partially)
- Product grid still visible at top, bottom sheet takes ~50-60% of viewport
- Free gift success state: green rounded box with ✅ checkmark

---

## 7. Bundle 39 — Color Theme Variation (Blue Sidebar)

Bundle 39 uses a completely different color scheme demonstrating merchant customization:
- Sidebar background: blue (`#4B7BE5` approx)
- Product cards: colorful backgrounds per product (configured by merchant)
- ADD button: blue circular `+` button (bottom-right of card), not a pill
- Step timeline: thinner, 2-step only
- Banner: full-width colorful hero ("CREATE YOUR BOX OF JOY!") with product images on right
- Free gift section: "Add a greeting card" — same lock/unlock mechanic, different colors

This confirms the sidebar panel is **fully themeable** via merchant configuration.

---

## 8. Gap Analysis — Skai Lama FPB vs Our Current FPB

| Feature | Skai Lama | Our Widget | Gap |
|---------|-----------|------------|-----|
| Right sidebar panel | ✅ Sticky right column, always visible | ✅ We have a sidebar | ✅ Structure exists |
| Step timeline with images | ✅ Per-step images + progress line | ✅ We have step timeline | ⚠️ Image support TBD |
| Per-step banner image | ✅ Configurable per step | ❌ Not supported | MEDIUM |
| Product grid (3-col desktop) | ✅ 3-col | ✅ Configurable | ✅ |
| Product card ADD button → stepper | ✅ ADD → `- 1 +` on select | ✅ We have this | ✅ |
| Free gift step — product "Free" badge | ✅ Yellow "Free" label on card image | ❌ No badge on cards | HIGH |
| Free gift step — page heading | ✅ "Complete the look and get a [item] free!" | ❌ No custom heading per step | MEDIUM |
| Sidebar — locked free gift section | ✅ 🔒 + "Add N more to claim FREE [item]" | ❌ No free gift in sidebar | HIGH |
| Sidebar — unlocked free gift (green box) | ✅ Green success box + checkmark | ❌ Not implemented | HIGH |
| Sidebar — free gift item in list ($0.00) | ✅ Shows in selected items with $0.00 | ❌ Not implemented | HIGH |
| Sidebar — skeleton empty slots | ✅ Gray skeleton per unfilled slot | ❌ Our empty slots look different | MEDIUM |
| Sidebar — "Review your bundle" link | ✅ Small subtext link | ❌ Not present | LOW |
| Mobile sticky bottom bar | ✅ Bottom bar replaces sidebar | ⚠️ Our mobile behavior unclear | HIGH |
| Mobile "^ N items" bottom sheet toggle | ✅ Expands bundle panel | ❌ Not implemented | HIGH |
| Mobile CTA pill (cream/yellow) | ✅ Distinctive style | ❌ Our button style differs | MEDIUM |
| Discount badge on "Add To Cart" button | ✅ "30% off" pill on button area | ✅ We have discount display | ⚠️ Styling differs |
| Back/Next navigation in sidebar | ✅ ← and → in sidebar footer | ✅ We have back/next | ✅ |
| Sidebar color theming | ✅ Fully configurable (white/blue) | ⚠️ Limited DCP controls | MEDIUM |
| Auto-advance after step complete | ✅ Auto-navigates to next step | ✅ We have this | ✅ |

---

## 9. Free Gift Feature — Full Specification

### How It Works (Skai Lama)
1. Bundle configured with N paid steps + 1 (or more) free gift steps
2. Free gift step has 100% discount applied in pricing
3. **While paid steps incomplete**: Free gift section shows locked state in sidebar
4. **Once paid steps complete**: Free gift section unlocks → user can select a free product
5. The free gift step auto-activates as the next step in the timeline
6. Product cards in the free gift step show "Free" badge + $0.00 price
7. Free gift item appears in sidebar with $0.00 (original price strikethrough)
8. Free gift item can be deleted and re-selected
9. Bundle can be added to cart with or without the free gift selected (configurable)

### Edge Cases to Handle
- **Multiple free gift steps**: Each has its own lock/unlock condition
- **Free gift with quantity > 1**: "Add N more to claim N free [items]"
- **Free gift already selected, user removes a paid item**: free gift should re-lock (go back to locked state)
- **Free gift deselection**: User can remove the free gift item; sidebar should revert to "eligible" state (not locked)
- **Bundle price with free gift included**: Total should always reflect $0 for free gift items
- **Free gift that requires variant selection**: Must handle variant picker inside free gift step
- **Free gift step skipped**: User clicks "Add To Cart" without selecting free gift → warn or allow (TBD per admin config)

---

## 10. Implementation Plan for Our FPB Redesign

### Changes Required

#### A. Sidebar Panel — Free Gift Support
Files: `extensions/bundle-builder/assets/bundle-widget-full-page.css` + `app/assets/bundle-widget-full-page.js`

1. **Free gift locked section**: render locked-state box below selected items
2. **Free gift unlocked section**: green success box
3. **Free gift item in selected list**: show with $0.00 + original strikethrough
4. **Track unlock condition**: when `selectedCount >= paidStepCount` → unlock free gift

#### B. Product Cards — Free Gift Badge
Files: `app/assets/bundle-widget-full-page.js`

1. When current step is a free gift step, add `Free` label badge to all product card images
2. Show $0.00 as price (actual price strikethrough visible)

#### C. Step Page Heading
Files: `app/assets/bundle-widget-full-page.js`

1. When rendering free gift step, show step-specific heading: e.g. "Complete the look and get a [giftName] free!"
2. This heading should be configurable per step in the bundle admin

#### D. Mobile Bottom Bar
Files: `app/assets/bundle-widget-full-page.js` + `extensions/bundle-builder/assets/bundle-widget-full-page.css`

1. On mobile viewport: hide sidebar, show sticky bottom bar
2. Bottom bar: `^ N items` count + message + `Next • $X` pill CTA
3. Tapping count: expand bundle panel as overlay bottom sheet
4. Bundle panel bottom sheet: same content as sidebar, full details

#### E. Per-Step Banner Image (stretch goal)
Files: Admin UI + widget JS

1. Add banner image field to bundle step configuration in admin
2. Widget renders banner at top of step when user is on that step
3. Use existing step data payload to include `bannerImageUrl`

---

## 11. Our Current FPB Error — Root Cause & Fix

**Error:** `API request failed: 404`
**URL:** `https://test-bundle-store123.myshopify.com/apps/product-bundles/api/bundle/cmmty8kgw0000aw2x79hgwu9d.json`

**Root cause:** Shopify's edge (CloudFlare) returns 404 directly — the app proxy is NOT forwarding the request to our SIT backend. This means Shopify has no registered proxy for `/apps/product-bundles` on this test store.

**Why this happens on fresh SIT install:**
- `shopify app deploy` has not been run for the SIT config
- The app proxy extension (`[app_proxy]` in `shopify.app.wolfpack-product-bundles-sit.toml`) is configured but not pushed to Shopify Partner Dashboard
- Shopify doesn't know to route `/apps/product-bundles/*` requests to `https://wolfpack-product-bundle-app-sit.onrender.com`

**Fix required (manual):**
```bash
shopify app deploy --config shopify.app.wolfpack-product-bundles-sit.toml
```

**After deploy:** The proxy will route correctly. If the bundle ID still 404s, create a new bundle in the SIT admin and update the page template with the correct bundle ID.

**Secondary issue:** `data-app-url=""` in the rendered block HTML — the Liquid template reads this from a shop metafield (`shop.metafields.wolfpack_product_bundles.app.serverUrl`) which may not be populated on a fresh install. The `window.__BUNDLE_APP_URL__` fallback should handle this once the proxy is working.
