# Issue: UI Comparison — Floating Footer Layout

**Issue ID:** ui-comparison-floating-footer-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 18:30

## Overview
Visual audit comparing our floating footer FPB layout against the reference store implementation. Documents all design and layout gaps (not colors) to achieve pixel-perfect parity. Our store: `1234gotdf` page. Reference: a store using the floating footer bundle pattern.

---

## Gap Analysis

### 1. Bundle Header / Title Area

**Reference:**
- NO bundle title block — the page jumps straight to tier pills then the promotional banner image.

**Ours:**
- Shows a header card: `MIX & MATCH` subtitle + bundle title (`1234gotdf`) + discount banner strip beneath.
- The header block occupies significant vertical space before product content.

**Gap:** Our header card approach is fine but it lacks visual weight. The discount banner text (`Add 2 items and get 45% off!`) sits in a plain mint-colored strip with no image, no bold typography, no visual hierarchy.

---

### 2. Tier / Deal Selector Pills

**Reference:**
- Three large, full-width rectangular pill buttons: `Buy 2 @499 ›`, `Buy 3 @699 ›`, `Buy 4 @849 ›`
- Active tier: filled green background.
- Inactive tiers: white background with border.
- Each button is a full-width third of the page (3-column equal grid).
- Arrow chevron (`›`) on each pill indicating it's selectable.

**Ours:**
- Step-based tabs: `1 Step 1 (1 selected ✓)` and `2 Step 2`.
- The concept is different (steps vs tiers) — this is a configuration difference, not just styling.
- **Layout gap:** Our tier pills (when configured) need to be large, full-width, equal-width buttons that span the full content width, not small compact tabs.

---

### 3. Promotional Banner / Hero Section

**Reference:**
- Large full-width **image** banner immediately below tier pills — shows all deal tiers visually (`BUY 2 ₹499`, `BUY 3 ₹699`, `BUY 4 ₹849`) with bold decorative typography.
- The banner is a proper `<img>` element, not a CSS background — merchant-uploaded per bundle.
- Provides massive visual impact and anchors the deal proposition.

**Ours:**
- Text-only strip: `Add 2 items and get 45% off!` — plain text on a mint background.
- No image support, no visual hierarchy, no decorative treatment.

**Gap:** We need support for a merchant-uploaded promotional banner image in the header section. The text fallback can remain but the image slot is the primary differentiator.

---

### 4. Product Cards

**Reference:**
- White card, slight shadow/border.
- Product image takes the full card height.
- Star rating badge (`4.5 ★ (5606 reviews)`) — green pill below image.
- Price below rating.
- **Selected product:** Quantity stepper `− 1 +` replaces the CTA button.
- **Unselected product:** `Add To Box` button (outlined/filled, full-width).

**Ours:**
- White card with border.
- Product image in a fixed-height image area.
- Price shown below name.
- NO star ratings (not applicable — we don't have review data).
- **Selected/unselected:** Always shows `ADD TO BUNDLE` black pill button — no quantity stepper for selected items.
- **Gap:** Once a product is added, the card button does not transform into a quantity stepper. The reference shows `-/+` controls directly on the card.

---

### 5. Floating Footer — Collapsed State

**Reference:**
| Element | Reference | Ours |
|---------|-----------|------|
| Banner strip | Green "🎉 Best Deal Unlocked! Get 2 products at ₹499" above the bar | ❌ Missing |
| Thumbnails | Two overlapping circular product thumbnails (stacked) | Single small square thumbnail |
| Products text | `2/2 Products ∨` | `1/2 Products ∨` (same concept, fine) |
| Total layout | Two-row: "Products ∨" on top, "Total: ₹499 **38% OFF** badge" below | Single row: "Total: Rs. X.XX" |
| Discount badge | Green `38% OFF` pill inline with total | ❌ Missing entirely |
| CTA button | `BUY BUNDLE` — black, large, rounded | `Add to Cart` — correct concept |
| Back button | ❌ Not present in reference | `‹` back button on far left |
| Card shape | Floating card with rounded corners, white bg, sits above a backdrop | Similar floating card ✓ |

**Key gaps in collapsed footer:**
1. **"Deal unlocked" notification banner** is completely missing — this is a high-impact conversion element.
2. **Discount badge pill** (`38% OFF`) next to total is missing — user has no feedback that they're saving.
3. **Overlapping circular thumbnails** — reference stacks the two selected product thumbs with slight overlap; ours shows a single thumb only.
4. **Two-row layout inside the bar** — reference uses 2 lines (products count + total/discount). Ours is a single compressed row.

---

### 6. Floating Footer — Expanded (Dropdown Open) State

**Reference:**
- Expanding the dropdown reveals product rows **within the footer card**, pushing the bar down.
- Each row: large rectangular thumbnail, product name, price `×1`, trash icon.
- The green banner remains visible at the top of the expanded card.
- Smooth slide-up animation.

**Ours:**
- Expanding shows product rows above the bar — same concept.
- Each row: smaller thumbnail, product name, price `×1`, trash icon.
- No banner visible when expanded.
- **Gap:** Thumbnail size could be larger; no deal banner in expanded state.

---

### 7. Add-to-Cart / "Deal Unlocked" Progression

**Reference:**
- The green "Best Deal Unlocked!" banner appears in the footer **as soon as the minimum qty is met** — it's a celebration/unlock moment.
- The banner text updates dynamically with the exact deal price.
- CTA changes from greyed to `BUY BUNDLE` on unlock.

**Ours:**
- The footer appears as soon as any product is added but has no "unlock" state change.
- No visual celebration when the bundle requirement is met.
- The `Add to Cart` button is grey/disabled until all required items are selected.

**Gap:** Add a "deal unlocked" state to the footer — a green banner (or similar) that appears when minimum quantity is met.

---

## Priority Summary

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | "Deal unlocked" banner strip in footer | 🔴 High | Medium |
| 2 | Discount % badge pill in footer total | 🔴 High | Low |
| 3 | Two-row footer bar layout (products + total/discount) | 🟠 Medium | Medium |
| 4 | Overlapping stacked circular thumbnails | 🟡 Low | Medium |
| 5 | Promotional hero banner image slot | 🟠 Medium | Medium |
| 6 | Card quantity stepper after add | 🟡 Low | High |

---

## Phases Checklist
- [x] Phase 1: Screenshot capture (reference + our store)
- [x] Phase 2: Gap analysis documentation
- [ ] Phase 3: Implement footer improvements
- [ ] Phase 4: Verify on test store
