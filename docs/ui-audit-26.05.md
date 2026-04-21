# UI Audit — 26.05 Widget Improvements
**Date:** 2026-04-19
**Branch:** feature/26.05-UI-changes
**Auditor:** Claude Code (Chrome DevTools MCP)

---

## Scope

Three widget types audited against Easy Bundles (GBB) competitor:
1. **FPB Floating** — full-page bundle builder, no sidebar
2. **FPB Sidebar** — full-page bundle builder with sidebar cart review panel
3. **PDP** — product-page modal bundle picker

Competitor URLs analysed:
- `vicodeo.com` — GBB FPB Floating (minimal/clean style)
- `infusedenergy.shop` — GBB FPB Floating (rich, step-image nav)
- `skailama-demo.myshopify.com/easybundle/34` — GBB FPB Sidebar (white sidebar)
- `skailama-demo.myshopify.com/easybundle/39` — GBB FPB Sidebar (blue sidebar)
- `skailama-demo.myshopify.com/products/swag*` — GBB PDP (solid slot border)
- `skailama-demo.myshopify.com/products/create-your-look*` — GBB PDP (dashed slot border)

---

## Important Context: DCP is a Paid Feature

The Design Control Panel is locked behind the **Grow plan ($9.99/month)**. On the Free plan, merchants get no visual customization (only Custom CSS as an escape hatch). This means:

- All DCP settings I reference below are available to Grow+ merchants only
- The `yash-wolfpack` store was on the **Free plan** during this audit — the SIT preview and live bundles were showing **default widget styles** (or whatever was hardcoded as defaults), not DCP-customized ones
- The purple next button and pill-radius add button observed on the SIT preview were **custom DCP values saved to that specific preview bundle**, not code inconsistencies

### What DCP Already Controls (130+ settings in `defaultSettings.ts`)

The DCP is far more capable than initially assessed. Key existing controls:

| Category | Settings Already Exist |
|---|---|
| Global Colors | primary button, text, footer bg/text |
| Product Card | bg, font color/size/weight, image fit, cards-per-row, border radius (`productCardBorderRadius`), width, height, spacing, border width/color, shadow |
| Add Button | bg, text, font size/weight, **border radius** (`buttonBorderRadius`), hover bg, custom text, added/selected state colors |
| Quantity Selector | bg, text, font size, border radius |
| Variant Selector | bg, text, border radius |
| Footer / Nav Buttons | back + next button: bg, text, border color, **border radius**, visibility |
| Step Tabs | active/inactive bg + text colors, tab radius (`headerTabRadius`) |
| Promo Banner | enabled flag, bg color, title/subtitle/note colors + sizes, border radius, padding |
| Search Input | bg, border, focus border, text, placeholder |
| Slot Cards (PDP) | **border style** (`emptySlotBorderStyle`: dashed/solid), **border color** (`emptySlotBorderColor`) |
| Drawer/Sidebar | bg color (`drawerBgColor`) |
| Tier Pills | active/inactive colors, hover, border, radius, height, font |
| Widget Style | `widgetStyle`: classic vs bottom-sheet, overlay opacity, animation duration |
| Typography | button text transform, letter spacing |
| Skeleton, Toasts, Modals, Badges | all customizable |
| Custom CSS | unrestricted override (both bundle types, separate tab) |

**Conclusion: the DCP is comprehensive. My initial P2 list was largely wrong — those settings already exist.**

---

## Our Widget CSS Baseline (Defaults)

### FPB (FULL_PAGE_DEFAULTS)
| Property | Default Value |
|---|---|
| Add button bg | `#FF9000` orange |
| Add button radius | `12px` |
| Next button bg | `#111111` dark |
| Product card radius | `8px` |
| Product card bg | `#F9FAFB` |
| Step tab active bg | `#000000` |
| Promo banner | enabled, `#F3F4F6` bg |
| Drawer/sidebar bg | `#F9FAFB` |
| Slot border style | `dashed` |
| Slot border color | `#007AFF` blue |

### PDP (PRODUCT_PAGE_DEFAULTS)
| Property | Default Value |
|---|---|
| Add button bg | `#FF9000` orange |
| Add button radius | `8px` |
| Next button bg | `#000000` |
| Product card radius | `8px` |
| Widget style | `bottom-sheet` |
| Slot border style | `dashed` |
| Slot border color | `#007AFF` blue |

---

## What Our Widgets Look Like Live (v2.5.2)

### FPB Floating (`yash-wolfpack/pages/fp-6th`)
- Step tabs: numbered text pills, no connecting line, no images
- Product grid: 4-col, `280px` cards
- Data loading: Stage 1 metafield cache ✅, Stage 2 proxy CORS broken ❌

### FPB Sidebar (SIT preview — had custom DCP applied)
- The purple next button (`#7132FF`) and `50px` pill add button seen during audit were **custom DCP settings on that preview bundle**, not defaults
- Actual defaults: `#111111` next button, `12px` add button radius

### PDP (SIT preview)
- Modal: bottom-sheet style, 24px top radius
- Slot cards: dashed blue border (matches defaults)
- 3-step layout, horizontal scroll product grid

---

## Competitor CSS Baseline

### GBB FPB Floating — vicodeo.com (minimal)
- 4-col, `237px` cards
- Simple numbered pills — no custom step images
- Light blue next button

### GBB FPB Floating — infusedenergy.shop (full-featured)
- **Custom image circle per step + connecting progress line**
- **Per-step category filter sub-tabs**
- **Per-step hero banner** (desktop + mobile separate images)
- Black footer, green next button

### GBB FPB Sidebar — skailama #1 (white)
- White sidebar bg
- Custom image step circles + connecting line
- 3-col product grid

### GBB FPB Sidebar — skailama #2 (blue)
- `rgb(69,150,227)` blue sidebar — DCP-configurable ← **we have `drawerBgColor`** ✅
- Custom image step circles + connecting line
- Mandatory pre-selected item
- Full-width per-step hero banner

### GBB PDP
- Slot border: configurable between solid gray or dashed blue ← **we have `emptySlotBorderStyle` + `emptySlotBorderColor`** ✅
- Custom category icons per slot

---

## Gap Analysis (Corrected)

### 🔴 Critical — Bugs

#### 1. CORS Error on `api/storefront-products`
- `wolfpack-product-bundle-app.onrender.com/api/storefront-products` returns no `Access-Control-Allow-Origin` header
- 4x CORS failures on every FPB page load (confirmed live on `yash-wolfpack/pages/fp-6th`)
- Product images still render (loaded from Shopify CDN directly), but variant availability and pricing freshness are affected — the widget falls back to stale metafield data
- **Fix**: Add CORS headers to the `api/storefront-products` route handler ✅ Done

#### 2. `api/bundle/*.json` Returns 400 on Every Background Refresh
- `_scheduleLayoutRefresh()` (a background best-effort call that fires after Stage 1 cache load) always returns 400
- Root cause: **`SHOPIFY_API_SECRET` env var is likely missing or wrong on the Render PROD server** — HMAC verification in `verifyAppProxyRequest()` returns null → 400
- Widget silently swallows this error (`if (!response.ok) return;`) so merchants are unaffected, but the layout-refresh feature is permanently degraded
- **Fix**: Verify `SHOPIFY_API_SECRET` is set correctly on Render PROD. This is a config fix, not code.
- Stage 2 logic (`loadBundleConfig`) is correct — it only fires when Stage 1 returns nothing. Not a bug.

#### ~~3. Step Tabs Both Showing "Step 1"~~ ✅ Not a bug
- Re-audited live: `FP 6th` bundle has exactly **1 step** in its config (`stepCount: 1`)
- The two `.step-tab` elements are mobile + desktop DOM instances of the same single tab — both correctly show "Step 1"
- No fix needed

### 🟡 High — Feature Gaps vs GBB

#### 3. Step Navigation: Image Circles + Progress Line
- **GBB**: Each step tab shows a custom image circle (step icon set by merchant or auto-populated with selected product thumbnails) + a horizontal connecting line showing progress
- **Us**: Numbered text pills only — no imagery, no connecting line
- This is a structural HTML/CSS change (not just a DCP color setting): new tab layout with image element per step + a `::before` connecting line
- **Step icon image**: configured per step in the bundle admin config page (not DCP). DCP controls the connecting line color via existing `stepBarProgressFilledColor`

#### 4. Per-Step Hero Banner Image
- **GBB**: Each step has its own full-width banner image (separate desktop + mobile uploads)
- **Us**: `promoBannerEnabled` with DCP-configurable text title/subtitle — no per-step image
- The promo banner renders the same content for every step
- **New capability needed**: per-step banner image uploaded in the bundle admin config page (not DCP). Widget reads `step.bannerImageUrl` and renders it above the product grid. DCP controls banner bg color, typography, and border radius via existing `promoBanner*` settings

#### 5. Category Filter Sub-Tabs Per Step
- **GBB**: Within each step, sub-tabs filter products by Shopify collection
- **Us**: Single flat product grid with only a text search bar
- DCP has `filterBgColor`, `filterIconColor`, `filterTextColor` — styling hooks exist, but the UI and data model for per-step collection filters are not implemented
- **New capability needed**: step config stores an array of `{label, collectionId}` filters; widget renders filter tab bar and filters the product grid on click

### 🟢 Medium — Default Value Issues

#### 6. FPB Default Button Radius Differs from PDP Default
- FPB default: `buttonBorderRadius: 12`
- PDP default: `buttonBorderRadius: 8`
- Both are DCP-overridable, but merchants on Free plan see different-looking add buttons across their two widget types
- **Fix**: Align both defaults to the same value (recommend `8px` — cleaner, matches PDP)

#### 7. ~~PDP Widget Not Installed on Any Live Store~~ ✅ Already Done
- PDP app block is installed on existing bundles — live QA is possible

---

## DCP vs GBB Parity Assessment

| GBB Feature | GBB | Us |
|---|---|---|
| Sidebar bg color | ✅ DCP | ✅ `drawerBgColor` |
| Slot border style (solid/dashed) | ✅ DCP | ✅ `emptySlotBorderStyle` |
| Slot border color | ✅ DCP | ✅ `emptySlotBorderColor` |
| Add button color + radius | ✅ DCP | ✅ `buttonBgColor` + `buttonBorderRadius` |
| Step tab colors | ✅ DCP | ✅ `headerTabActiveBgColor` etc. |
| Next button color | ✅ DCP | ✅ `footerNextButtonBgColor` |
| Product card radius | ✅ DCP | ✅ `productCardBorderRadius` |
| Custom CSS | ✅ | ✅ Both bundle types |
| Step image circles + progress line | ✅ | ❌ Not built |
| Per-step hero banner image | ✅ | ❌ Text-only promo banner |
| Category filter sub-tabs | ✅ | ❌ Not built |

---

## Prioritised Action List for `feature/26.05-UI-changes`

### P0 — Bugs
1. ✅ Fixed: CORS headers added to all error paths in `api/storefront-products.tsx` (was missing on 400/404/500 responses)
2. Config fix needed: set `SHOPIFY_API_SECRET` correctly on Render PROD — causes `_scheduleLayoutRefresh` to always return 400 (silently ignored, but layout refresh is broken)

### P1 — Default value alignment (no DCP schema change)
3. Align `buttonBorderRadius` default: both FPB and PDP to `8px`

### P2 — Feature additions (highest impact gap vs GBB)
4. Step navigation: image circle per step + connecting progress line
5. Per-step hero banner image (field in bundle step config admin page)
6. Category filter sub-tabs per step (stored as `step.filters[]` in bundle config)

---

## Screenshots Index
| File | Description |
|---|---|
| `competitor-fpb-floating-vicodeo.png` | GBB FPB Floating — vicodeo, viewport |
| `competitor-fpb-floating-vicodeo-cards.png` | GBB FPB Floating — vicodeo, product cards close-up |
| `competitor-fpb-floating-infused.png` | GBB FPB Floating — infused energy, step nav with images |
| `competitor-fpb-sidebar-skailama-1.png` | GBB FPB Sidebar — skailama, white sidebar |
| `competitor-pdp-skailama-1.png` | GBB PDP — skailama, slot card layout |
| `competitor-eb-admin-firstload.png` | Easy Bundles admin — firstLoad=true welcome screen |
| `our-fpb-fp6th-viewport.png` | Our FPB Floating — yash-wolfpack fp-6th, full viewport |
| `our-fpb-sit-preview.png` | Our FPB Sidebar — SIT preview (custom DCP applied) |
| `our-pdp-sit-preview.png` | Our PDP — SIT preview |
