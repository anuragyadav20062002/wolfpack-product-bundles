# Plan — FPB Summary Sidebar: Variant Name + Price Overlap Fix

**Status:** Draft for review (no code changes yet)
**Author:** Claude (under user direction)
**Date:** 2026-06-12
**Bug class:** UI / CSS (FPB storefront widget)
**Scope:** Full-Page Bundle (FPB) right-hand summary sidebar — product row card

---

## 1. Bug summary

When a customer picks a product **with a variant** on an FPB storefront, the selected product appears in the summary sidebar. In at least one template, the **variant name text** overlaps the **price text** inside that product card — making both unreadable.

User report: *"the price in the product card inside the summary sidebar shows the variant name and the price of the item overlapping each other. That needs to be identified and fixed across all FPB templates."*

---

## 2. Render path (single source for all 4 templates)

The sidebar product card is rendered by **one** JS template literal — there is no per-template render path. CSS is what differs.

- **JS render:** `app/assets/widgets/full-page/methods/side-panel-methods.js` lines 212–272 (also lines 248 for the non-slot branch)
- **Variant helper:** `getSummaryProductVariantDisplay()` in `app/assets/widgets/full-page/methods/product-card-footer-methods.js:191`
- **Mobile bottom sheet equivalent:** `app/assets/widgets/full-page/methods/mobile-summary-methods.js:211, 404`
- **Skeleton placeholder for variant line:** `app/assets/widgets/full-page/methods/validation-addons-methods.js:419, 439`

Rendered DOM:
```html
<div class="side-panel-product-row">                <!-- or .side-panel-product-slot -->
  <div class="side-panel-product-img-wrap">...</div>
  <div class="side-panel-product-info">
    <span class="side-panel-product-title">{title}</span>
    <span class="side-panel-product-variant">{variantTitle}</span>   <!-- only when variant present -->
  </div>
  <span class="side-panel-product-price">{price}<span class="side-panel-product-qty">×{qty}</span></span>
  <div class="side-panel-product-action"></div>
</div>
```

---

## 3. Base styles (shared across templates)

`app/assets/widgets/full-page-css/base/toast-sidebar-shell.css:305–388`

- `.side-panel-product-row` → flex row, `gap: 10px`, `align-items: center`
- `.side-panel-product-info` → `flex: 1; min-width: 0; flex-direction: column; gap: 2px`
- `.side-panel-product-title` → `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- `.side-panel-product-variant` → **no overflow handling**, `font-size: 11px`
- `.side-panel-product-price` → `white-space: nowrap`

At base styles, title and variant stack vertically inside info; price sits in its own flex child to the right. **No overlap at the base layer.**

---

## 4. Per-template assessment (preliminary, from static CSS read)

| Template | Layout system | Has variant→price overlap risk? | Confidence |
|---|---|---|---|
| **Horizontal** (`HORIZONTAL` preset) | CSS Grid, **explicit grid-cell placement** that puts `.side-panel-product-info` AND `.side-panel-product-price` in the **same grid cell** (`grid-column: 2; grid-row: 1`). Price is shifted down via `margin: 20px 0 0`. | **🔴 YES — confirmed bug source** | High — static analysis |
| **Standard / Default** (`DEFAULT` preset) | CSS Grid with `grid-template-columns: 75px 158.328px 62.9375px` (3 columns). Children auto-place into separate columns; info (col 2) and price (col 3) are in **different** cells. | Likely no overlap. | Medium — needs visual confirmation |
| **Compact** | No `side-panel-product-*` overrides — inherits base flex layout. | Likely no overlap. | Medium — needs visual confirmation |
| **Classic** | Uses a **different DOM** entirely (`.classic-sidebar-slot` grid of square slots, no shared product row). Variant + price not laid out in the same row by design. | Not affected by this bug; may have its own variant-display behavior to verify separately. | Medium — needs visual confirmation |
| **Mobile bottom sheet** (all templates) | Rendered by `mobile-summary-methods.js` — separate CSS in `floating-badge-sidebar-progress.css` and other base files. | **Unknown** — needs visual confirmation per CLAUDE.md "Storefront UI Audit — Desktop + Mobile" rule. | Low — not yet inspected |

### 4.1 Horizontal — root cause detail

`app/assets/widgets/full-page-css/templates/side-footer-horizontal.css:1113–1189` (inside a `@media` block):

```css
.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-row,
.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-slot {
  display: grid;
  grid-template-columns: 75px 247.547px 74.2812px;   /* img | info+price | remove */
  grid-template-rows: 75px;
  …
}

.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-info {
  grid-column: 2; grid-row: 1;                       /* placed in cell (2,1) */
  display: block;
  width: 247.547px;
  height: 75px;
  …
}

.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-title {
  display: block;
  height: 20px;
  …
}

.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-price {
  grid-column: 2; grid-row: 1;                       /* SAME CELL as .side-panel-product-info ❌ */
  align-self: start; justify-self: start;
  margin: 20px 0 0;                                  /* pushed down 20px to sit "below" the title */
  …
}
```

`.side-panel-product-title` is fixed at 20px tall, so the price's `margin-top: 20px` aligns it just below the title — **when there is no variant**. The moment a `.side-panel-product-variant` span is rendered inside `.side-panel-product-info` (between title and the rest of info's box), it occupies the area at y=20–40px where the price is positioned. **Result: variant text and price text are drawn at the same screen coordinates.**

---

## 5. Fix proposal (options to choose from)

All three options solve the HORIZONTAL bug. Picking one depends on the visual contract the merchant cares about. I'll need user direction before implementing.

### Option A — Reserve a 3rd column for price (recommended)

Make the Horizontal grid a real 3-column layout where info and price live in **different cells**.

```css
.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-row {
  grid-template-columns: 75px minmax(0, 1fr) auto auto;   /* img | info | price | remove */
  /* drop fixed pixel widths so it adapts to the actual sidebar width */
}

.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-info  { grid-column: 2; }
.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-price { grid-column: 3; margin: 0; align-self: center; }
.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .side-panel-product-remove{ grid-column: 4; }
```

**Pros:** Eliminates the overlap by design; works with or without a variant; mirrors the base flex layout's intent.
**Cons:** Visual layout diverges from the current pixel-pinned spec (sidebar widths shift). Requires QA against any EB parity screenshot reference.

### Option B — Keep current grid, push price below variant when present

Stay in the same cell, but make `.side-panel-product-info` a flex column with a known height and put the price **inside** the column flow (not in the same grid cell).

**Pros:** Smallest visual diff vs current Horizontal layout.
**Cons:** Requires moving the price span inside `.side-panel-product-info` in JS — a render-path change that affects all templates, not just Horizontal. Risk of regressing Standard/Compact.

### Option C — Reserve vertical space conditionally

Add a modifier class when a variant is rendered (`.side-panel-product-row--has-variant`) and override the price's `margin-top` to push it further down (`margin: 40px 0 0` when variant present).

**Pros:** Localized, no layout system change.
**Cons:** Magic numbers; breaks if variant name wraps to 2 lines; not robust against text length.

**My recommendation: Option A.** It removes the bug class (overlapping grid cells), not just this instance.

---

## 6. Verification before fix (visual audit)

Per CLAUDE.md "Storefront UI Audit — Desktop + Mobile" rule, before any CSS change I will:

1. Open the FPB storefront page in Chrome DevTools MCP — **desktop viewport 1280×800**.
2. For each template (Standard, Classic, Compact, Horizontal), select a product **with a variant** and screenshot the sidebar product card.
3. Repeat for **mobile viewport (iPhone 14, 390×844)** — including the mobile bottom sheet.
4. For each captured state, use `evaluate_script` + `getComputedStyle` on the rendered `.side-panel-product-row` to measure: title bottom, variant top/bottom, price top/bottom. If `variant.bottom > price.top`, overlap is confirmed.
5. Record which templates exhibit overlap and on which viewport.

This produces a small evidence table that decides the final scope (e.g., Horizontal-desktop-only vs all-templates) before I write CSS.

---

## 7. Implementation steps (after option chosen)

1. Edit the relevant **raw CSS** files under `app/assets/widgets/full-page-css/` (NOT the minified `extensions/bundle-builder/assets/bundle-widget-full-page.css`).
   - Horizontal: `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css` lines 1113–1189 block.
   - Mobile (if affected): `app/assets/widgets/full-page-css/base/floating-badge-sidebar-progress.css` and/or `base/toast-sidebar-shell.css`.
2. Optionally add `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` to `.side-panel-product-variant` in `base/toast-sidebar-shell.css` so a long variant name never wraps and never pushes layout. (One-line fix, low risk.)
3. Run `npm run minify:assets css` to regenerate `extensions/bundle-builder/assets/bundle-widget-full-page.css`. Verify the minifier exit code (the script enforces Shopify's 100 KB cap).
4. **No JS bundle rebuild needed** (CSS-only change). If Option B is chosen instead of A, JS rebuild via `npm run build:widgets` is required.
5. Per "Widget Version Rule" — increment **PATCH** of `WIDGET_VERSION` in `scripts/build-widget-bundles.js` (bug fix = PATCH bump).
6. Commit raw + minified CSS together with a `fix:` message describing the overlap class root cause.

---

## 8. Test plan

- **Desktop, all 4 templates**, product with single-variant (Default Title) → variant not shown → price renders cleanly.
- **Desktop, all 4 templates**, product with named variant (e.g. "Color: Red") → variant renders below title, price stays in its own column, no overlap.
- **Desktop, Horizontal specifically**, product with a long variant name ("Color: Reddish-Brown / Size: Large") → variant ellipses or wraps without colliding with price.
- **Mobile (iPhone 14)**, bottom sheet variant of all 4 templates → same checks.
- **Edge case:** product with quantity > 1 → qty badge (`×N`) renders next to price without overlap.
- **Edge case:** free gift (`.free-gift-price` class) → original strikethrough + free price both visible.
- Hard-reload storefront with cache bypassed (per "Storefront UI Audit" rule) between each template check.

No new unit tests — per CLAUDE.md "No UI Styling or Placement Unit Tests" rule, this is a CSS-only fix and **must not** be covered by Jest tests that grep CSS files. Visual verification via Chrome DevTools MCP is the right tool.

---

## 9. Deploy steps

This is a storefront widget CSS change → needs a Shopify app deploy (per CLAUDE.md "Widget Bundle Build Process" and "Shopify Deploy Rule"):

1. After commit, **prompt the user** to run `npm run deploy:prod` or `npm run deploy:sit` (never run `shopify app deploy` autonomously).
2. Wait 2–10 minutes for Shopify CDN cache propagation.
3. Verify `console.log(window.__BUNDLE_WIDGET_VERSION__)` matches the bumped version on storefront.
4. Re-run the visual audit on prod to confirm fix.

---

## 10. Open questions for the user

1. **Layout option** — A, B, or C from §5? (My recommendation: A.)
2. **Scope confirmation** — is the bug *also* visible on Standard, Compact, Classic, or mobile? My static analysis says HORIZONTAL desktop is the only confirmed case; visual audit in §6 will give the definitive answer. Should I run the audit now (separate session) or wait for your enhanced plan?
3. **Pixel-spec preservation** — the Horizontal grid currently uses fixed pixel widths (`247.547px`, `74.2812px`, `158.328px` etc.). Option A relaxes these to `minmax(0, 1fr)`. Is the pixel spec load-bearing (e.g., matched against an EB parity screenshot) or is responsive width OK?
4. **Variant string overflow** — should a long variant name **wrap** to a 2nd line (current behavior at base), or **ellipsize** to one line (consistent with title)? I lean toward ellipsize for visual stability.
5. **WIDGET_VERSION bump magnitude** — confirm PATCH is right; this is a bugfix, not a feature.

---

## 11. Files I expect to touch (if Option A)

- `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css` — modify the `@media` block at lines ~1113–1189
- `app/assets/widgets/full-page-css/base/toast-sidebar-shell.css` — optional: add `text-overflow` to `.side-panel-product-variant`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — regenerated by `npm run minify:assets css`
- `scripts/build-widget-bundles.js` — PATCH bump of `WIDGET_VERSION`

No JS files. No Prisma. No route changes.
