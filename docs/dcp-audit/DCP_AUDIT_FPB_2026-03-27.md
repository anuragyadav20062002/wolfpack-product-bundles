# DCP Audit — Full Page Bundle (FPB)

**Date:** 2026-03-27
**Auditor:** Claude Code (automated + live Chrome DevTools session)
**Bundle Type:** Landing Page Bundles (FPB)
**Screenshots:** `docs/app-nav-map/screenshots/audit/`

---

## Audit Method

Systematically clicked every section and subsection of the FPB DCP using Chrome DevTools MCP. Captured screenshots for every panel. Also tested desktop vs mobile viewport toggle and sidebar vs floating footer layout toggle.

---

## Sections Covered

| # | Section | Subsection | Screenshot |
|---|---------|------------|------------|
| 1 | Global Colors | — | 02 |
| 2 | Bundle Header | Tabs | 03 |
| 3 | Bundle Header | Header Text | 04 |
| 4 | Pricing Tier Pills | — | 05 |
| 5 | Promo Banner | — | 06 |
| 6 | Product Card | Card Appearance | 07 |
| 7 | Product Card | Card Button | 08 |
| 8 | Product Card | Quantity & Variant Selector | 09 |
| 9 | Product Card | Search Input | 10 |
| 10 | Product Card | Skeleton Loading | 11 |
| 11 | Product Card | Button Typography | 12 |
| 12 | Bundle Footer | Footer | 13 |
| 13 | Bundle Footer | Price | 14 |
| 14 | Bundle Footer | Button | 15 |
| 15 | Bundle Footer | Discount Text | 16 |
| 16 | Bundle Footer | Quantity Badge | 17 |
| 17 | General | Add to Cart Button | 19 |
| 18 | General | Toasts | 20 |
| 19 | General | Accessibility | 21 |
| 20 | Mobile viewport | Sidebar layout | 22 |
| 21 | Mobile viewport | Floating layout | 23 |

---

## Findings

### 🔴 HIGH — Default Color Contamination (5 sections affected)

**Issue:** The value `#7132FF` (a vivid purple) is set as the default for 5 separate settings across the DCP. These are clearly development test values that were never replaced with sensible defaults. They would look jarring in any real merchant storefront.

**Affected settings:**
1. `Product Card → Search Input` → Focus Border Color (`#7132FF`)
2. `Bundle Footer → Quantity Badge` → Badge Background Color (`#7132FF`)
3. `General → Accessibility` → Focus Outline Color (`#7132FF`)
4. `General → Add to Cart Button` → Background Color (`#7132FF`)
5. `General → Toasts` → Background Color (`#7132FF`)

**Additionally:**
- `Product Card → Card Appearance` → Background Color is `#0080ff` (bright blue) — this is the card's selected/added state color and is far too vivid as a default

**Fix:** Replace all six values with neutral defaults that work across light/dark Shopify themes:
- Focus Border: `#005BD3` (Shopify blue) or `#000000`
- Quantity Badge BG: `#111111` or tie to primary button color
- Accessibility Focus Outline: `#005BD3`
- ATC Button BG: `#111111` (matches Global Colors "Primary Button Color")
- Toasts BG: `#111111`
- Card Selected BG: `#F0F7FF` (light blue-tint, non-jarring)

---

### 🔴 HIGH — "Header Text" Section Mislabeled

**Issue:** `Bundle Header → Header Text` controls:
- **Conditions Text** color and font size (the "Add 1 more to save 20%" message below tabs)
- **Discount Text** color and font size

The label "Header Text" implies it controls the bundle title ("Summer Bundle") and subtitle ("Build your perfect summer outfit and save 20%"). Merchants will look in this section to change those, won't find controls, and won't discover that the title/subtitle are styled by Global Colors / theme fonts.

**Fix:** Rename to **"Conditions & Discount Text"** and add a brief description explaining what each sub-setting controls (similar to how Search Input has "Styles the search bar used to filter products within a bundle step").

---

### 🟡 MEDIUM — Inconsistent Slider Value Labels

**Issue:** Some sliders show their current value as a label (e.g., "16px", "32px", "8px") while most do not — just showing the slider track with no numeric readout. The inconsistency is within the same DCP.

**Sections where sliders show values:**
- Promo Banner (Border Radius "16px", Padding "32px", font sizes "28px", "16px", "14px")
- Pricing Tier Pills (Border Radius "8px", Pill Height "52px", Gap "12px")
- Discount Text (Font Size "16px")
- Toasts (Font Size "13px", animation offset "300ms")

**Sections where sliders have no value label:**
- `Bundle Header → Tabs` → Border Radius
- `Product Card → Card Button` → Size, Border Radius
- `Product Card → Quantity & Variant Selector` → Border Radius (both elements, shows "px" unit only)
- `Product Card → Card Appearance` → Hover Lift, Transition Duration
- `Product Card → Button Typography` → (slider has description but no current value)
- `General → Accessibility` → Focus Outline Width (shows "2px" — partially consistent)

**Fix:** Standardize — all sliders should show the current value + unit label to the right of the slider track. This is what Promo Banner does correctly.

---

### 🟡 MEDIUM — "Button Typography" Panel Heading Mismatch

**Issue:** The nav left-rail item is labeled **"Button Typography"** but when clicked, the right panel heading shows **"Typography"**. Minor but visually inconsistent.

**Fix:** Either update the panel heading to match the nav label ("Button Typography"), or shorten both to "Button Text" for clarity.

---

### 🟡 MEDIUM — Promo Banner Invisible in Sidebar Layout Preview

**Issue:** When "Promo Banner" section is active and the sidebar layout is selected, the banner is not visible in the preview at all. Switching to the floating footer layout shows the banner at the top of the preview.

The banner renders above the step tabs/header, but the sidebar layout preview appears to start from the header area — effectively clipping the banner off the top. Merchants editing the Promo Banner while viewing the sidebar layout preview will think the banner doesn't work.

**Fix:** Either:
1. Ensure the preview iframe scrolls to the top when Promo Banner section is selected (or auto-scrolls to show the relevant element), OR
2. Show the banner in the sidebar layout preview — investigate whether the issue is that the banner is simply scrolled out of view or genuinely not rendered in sidebar mode

---

### 🟡 MEDIUM — Skeleton Loading Cannot Be Previewed

**Issue:** The Skeleton Loading section has 3 settings (Base Background, Shimmer Color, Highlight Color) that control the shimmer animation displayed while product cards load. The preview always shows the fully-loaded state, so there's no way to see how the skeleton looks without viewing the actual live storefront.

**Fix:** Add a "Preview skeleton" toggle button in the Skeleton Loading panel that temporarily replaces product cards in the preview with skeleton cards. This would make the section useful for merchants.

---

### 🟡 MEDIUM — Mobile Tab Truncation + Invisible 3rd Tab

**Issue:** In the mobile viewport preview (both sidebar and floating layouts), the step tab labels truncate with "..." mid-word ("Choose Bo..." for "Choose Bottoms"). The third tab ("Accessories") is completely off-screen with no visual indicator (scroll hint, gradient fade, pagination dots) that more tabs exist.

A shopper on mobile would not know they can scroll horizontally to access remaining steps.

**Fix:**
1. Add an overflow scroll indicator (gradient fade on the right edge of the tab row, or chevron arrows) to signal that more tabs are hidden
2. Consider auto-scrolling to center the active tab when step changes
3. Optionally: abbreviate step names for mobile (configured per-step by merchant) or show step number only on mobile

---

### 🟡 MEDIUM — "Number of Cards Per Row" is Desktop-Only (No Label)

**Issue:** `Product Card → Card Appearance` → "Number of cards per row" (3 / 4 / 5 selector) has no indication that it only applies to the desktop layout. On mobile, the grid always shows 2 cards per row regardless of this setting. A merchant could set "5 per row" and never see the effect on mobile.

**Fix:** Add "Desktop only" label or description text below the control, similar to how Promo Banner and Search Input show context hints.

---

### 🟡 MEDIUM — "General → Add to Cart Button" vs "Product Card → Card Button" — Unclear Distinction

**Issue:** There are two "Button" sections:
1. `Product Card → Card Button` — per-product "Add to Bundle" button inside the card
2. `General → Add to Cart Button` — the final "Next Step" / checkout button in the footer

The naming "Add to Cart Button" for the final checkout step is misleading because:
- The widget uses "Add to Bundle" language throughout (not "Add to Cart")
- The actual label in the preview is "Next Step" (sidebar) or "Next" (floating)

Merchants who want to style the "Add to Bundle" product button will look in "General → Add to Cart Button" and be confused.

**Fix:** Rename `General → Add to Cart Button` to **"Checkout Button"** or **"Next / Checkout Button"** with a description: "Styles the final step button that submits the bundle to cart."

---

### 🟢 LOW — Global Colors Description is Accurate but Could Be More Actionable

**Issue:** Global Colors description: "Global color defaults used across the widget. Individual sections can override these globally." This is correct but it leaves merchants uncertain whether they should set Global Colors first and then override, or go section-by-section. No "recommended workflow" guidance.

**Suggestion:** Add brief copy: "Start here. Most widget colors inherit from these defaults — only override individual sections if you need finer control."

---

### 🟢 LOW — "Reset to defaults" Button Has No Scope Indication

**Issue:** The "Reset to defaults" button in the top-right of the DCP panel appears on every section view. It's unclear whether it resets only the current section or ALL settings globally. This could lead merchants to accidentally wipe all custom settings.

**Fix:** Add a confirmation dialog: "Reset [Section Name] to defaults? This will only affect [Section Name] settings." OR scope the button label to "Reset [section] defaults" and add a tooltip.

---

### 🟢 LOW — Bundle Footer Settings Apply Differently per Layout (No Labels)

**Issue:** Bundle Footer subsections ("Footer", "Price", "Button", "Discount Text", "Quantity Badge") control the sidebar panel (in sidebar layout) and the floating bottom strip (in floating layout). Some settings are only relevant to one layout (e.g., the sidebar panel shows full product list with prices; the floating strip shows thumbnails + total price).

There's no indication of which settings affect which layout. A merchant customizing the sidebar might unknowingly also change the floating footer appearance.

**Suggestion:** Consider adding a small layout icon/badge next to settings that are layout-specific, or show a note at the section level: "Settings apply to both sidebar panel and floating footer."

---

### 🟢 LOW — Card Appearance Background Color Unclear Semantics

**Issue:** `Product Card → Card Appearance` → "Background Color" (#0080ff default). The label "Background Color" doesn't clarify whether this is:
- The card's resting background, OR
- The card's selected/added state highlight color

In the preview, the "Added" cards have a blue highlighted border/background, which matches `#0080ff`. But resting cards appear white. So this appears to control the selected state, not the base card background — but the label says nothing about "selected state."

**Fix:** Rename to **"Selected Card Background"** or **"Card Selected Highlight Color"** with description: "Background color applied to product cards when they've been added to the bundle."

---

## What's Working Well

| Area | Quality |
|------|---------|
| Pricing Tier Pills | Comprehensive — Active/Inactive/Hover colors, Border, Size & Spacing, Typography. Good "Full-page bundles only" hint. |
| Promo Banner | Very detailed — Enable toggle, BG, Border Radius, Padding, Title/Subtitle/Note styling with font weight buttons |
| Search Input | Well-organized with sub-groups (Input, Text, Clear Button). "Full-page widget only" hint is excellent UX. |
| Skeleton Loading | Minimal and focused (3 settings). Clear description. |
| Toasts | Rich settings (BG, Text, Border Radius, Font, Animation offset, Shadow Preset). Production-grade. |
| Accessibility | Explicit focus indicator controls — rare and thoughtful for a Shopify widget editor. |
| Tier Pills display fix | Previously broken (pills never showed due to `display: ''` vs `display: 'flex'` bug — now fixed). |
| Step tabs position fix | Previously tabs appeared as left column in sidebar layout — now correctly above product grid. |
| Real-time preview | All settings update the preview instantly without page reload. |
| Dual-pane preview | Both sidebar and floating footer previews are preloaded and toggled instantly. |
| Desktop/Mobile toggle | Works correctly. Mobile preview renders at 375px with proper 2-column grid. |
| Font injection | Theme fonts from storefront homepage are injected into preview — preview now matches actual store fonts. |

---

## Recommended Fixes Priority List

| Priority | Fix |
|----------|-----|
| 🔴 P1 | Replace `#7132FF` defaults in 5 sections + `#0080ff` card BG with neutral defaults |
| 🔴 P1 | Rename "Header Text" → "Conditions & Discount Text" |
| 🟡 P2 | Standardize slider value labels across all sections |
| 🟡 P2 | Fix promo banner visibility in sidebar layout preview |
| 🟡 P2 | Rename "Add to Cart Button" (General) → "Checkout Button" |
| 🟡 P2 | Add mobile tab overflow indicator (gradient/scroll hint) |
| 🟡 P2 | Add skeleton loading preview toggle |
| 🟡 P2 | Add "Desktop only" note to "Number of cards per row" |
| 🟡 P3 | Add scope confirmation to "Reset to defaults" |
| 🟢 P3 | Rename "Card Appearance Background Color" → "Selected Card Background" |
| 🟢 P3 | Fix "Button Typography" panel heading to match nav label |
| 🟢 P3 | Add Global Colors workflow guidance copy |
| 🟢 P3 | Add layout-scope labels to Bundle Footer subsections |
