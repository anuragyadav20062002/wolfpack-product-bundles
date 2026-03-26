# Issue: UI Comparison — Sidebar Layout

**Issue ID:** ui-comparison-sidebar-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 18:30

## Overview
Visual audit comparing our FPB sidebar layout against the reference store implementation. Documents all design and layout gaps (not colors) to achieve pixel-perfect parity. Our store: `radhe-radhe` page. Reference: a store using the sidebar bundle pattern.

---

## Gap Analysis

### 1. Step Progress Indicator

**Reference:**
- Horizontal stepper with **circular icon nodes** connected by a progress line.
- Each circle contains a **category-specific icon** (t-shirt, pants, hoodie, cap icons).
- Completed steps: solid filled circle with `✓` checkmark, thick connecting line.
- Active step: outlined circle with bold border.
- Inactive steps: thin outlined circles.
- Labels below each node: `Add Tee`, `Add Pants`, `Add Hoodie`, `Free Cap`.
- The stepper is compact and sits above the category banner.

**Ours:**
- Pill-shaped rectangular tabs: `1 Step 1`, `2 Step 2`.
- Completed step shows a product thumbnail + `1 selected ✓` badge.
- Active step highlighted with black fill.
- No connecting line between steps.
- No icons — just step number + label.

**Gap:**
- Reference stepper is more visual with icon nodes and a connecting progress line.
- Our step tab approach is functional but shows product thumbnails instead of category icons.
- Missing: connecting progress line between steps.
- Missing: category/step-type icons in the step node.

---

### 2. Category Banner / Step Hero Image

**Reference:**
- **Full-width banner image** between the stepper and product grid — changes per step.
- Shows the category name as large watermark text (e.g., `TSHIRTS`, `PANTS`, `HOODIES`) with a product hero image overlaid.
- Very strong visual hierarchy — immediately tells the user what step they're on.

**Ours:**
- **No banner image** — jumps directly from step tabs to search bar and product grid.
- No visual context for what category/step the user is selecting for.

**Gap:** Missing per-step category banner image. This is the most visually impactful gap in the sidebar layout. Requires:
- A merchant-configurable image upload per step in the admin.
- The widget to render a `<div class="step-banner">` between the stepper and product grid.

---

### 3. Bundle Header / Title

**Reference:**
- NO bundle title header — the page starts directly with the step stepper.

**Ours:**
- No bundle title visible either in the sidebar layout. ✓

---

### 4. Search Bar

**Reference:**
- No search bar visible in the reference store.

**Ours:**
- Search bar appears below the step tabs. Present but not in reference.

---

### 5. Product Cards

**Reference:**
- 3-column grid layout. ✓ (same as ours)
- Light gray/blue background per card.
- Large product image taking most of the card.
- Product name below image.
- Price below name.
- `+ ADD` button: small dark pill, right-aligned at bottom of card.

**Ours:**
- 3-column grid. ✓
- White card with border.
- Product image in fixed-height container.
- Product name + price.
- `ADD TO BUNDLE` button: full-width black pill at card bottom.

**Gap:**
- Reference `+ ADD` is compact and right-aligned; ours is full-width spanning the card.
- Reference card has a colored (gray/blue) background; ours is white. (Color difference — skip)
- Reference button is smaller, more subtle. Ours is more prominent (full-width) — this is arguably better UX but differs from reference.

---

### 6. Sidebar Panel — Empty / Initial State

**Reference:**
- Title: `Your Bundle` (bold) + `Clear` button (coral color, with trash icon).
- Subtitle: `Review your bundle`.
- Progress prompt: `Add 3 product(s) to get the bundle at $140.00` (centered, bold).
- Empty item slots shown as **skeleton placeholder** rows (gray shimmer placeholders for image + text).
- Locked bonus tier section: `Free Cap` label with a divider, then `Add 3 more product(s) to claim a FREE cap!` pill with 🔒 lock icon.
- Bottom: `Total $0.00` + `Next` button (black, pill shape).

**Ours:**
- Title: `Your Bundle` (bold) + `Clear all` (red text link — no icon).
- NO subtitle.
- NO progress prompt inside sidebar.
- Empty state: just `No products selected yet` centered text.
- NO skeleton placeholder slots.
- NO locked bonus tier section.
- Bottom: `Total Rs. 0.00` (orange) + `Next Step` button (lavender/purple, full-width).

**Key gaps:**
| Element | Reference | Ours |
|---------|-----------|------|
| Subtitle | `Review your bundle` | ❌ Missing |
| Progress prompt | `Add N product(s) to get bundle at $X` | ❌ Missing |
| Empty slot skeletons | ✅ Skeleton placeholders per required item | ❌ Just a text message |
| Locked bonus tier | ✅ `Free Cap` locked section | ❌ Missing |
| Clear button style | Icon + text pill | Text link only |
| CTA button | `Next` black pill | `Next Step` lavender full-width |

---

### 7. Sidebar Panel — Filled State (Items Added)

**Reference:**
- Item count shown: `2 item(s)`.
- Each item row: Large square thumbnail → product name → price → `x1` quantity display → trash icon.
- The quantity `x1` is shown as a label (not a stepper) alongside the trash icon.
- Skeleton placeholder remains for unfilled slots.
- `Free Cap` locked section updates: `Add 1 more product(s) to claim a FREE cap!` (dynamically updates).
- Bottom: `Total $80.00` + back arrow `←` + `Next` black button.

**Ours:**
- Each item row: Small square thumbnail → product name → price → `×` remove button.
- NO quantity label (`x1`) displayed.
- NO item count label (`N item(s)`).
- No skeleton for unfilled slots.
- NO locked bonus tier section.
- Bottom: `Total Rs. X.XX` (orange) + `Add to Cart` button (lavender, full-width).
- NO back navigation arrow in the sidebar footer.

**Key gaps:**
| Element | Reference | Ours |
|---------|-----------|------|
| Item count label | `N item(s)` above list | ❌ Missing |
| Quantity per item | `x1` label visible | ❌ Missing |
| Unfilled slot skeletons | ✅ Shows placeholder for remaining slots | ❌ Missing |
| Bonus/gift tier section | ✅ Locked `Free Cap` with unlock progress | ❌ Missing |
| Back navigation | `←` arrow button | ❌ Missing |
| CTA button style | Black pill `Next` | Lavender full-width `Add to Cart` |

---

### 8. Post-Step Navigation Flow

**Reference:**
- Adding a product **automatically advances** to the next step. ✓ (we do this too)
- Step icon updates to `✓` filled circle.
- Category banner updates to show new step's category.

**Ours:**
- Adding a product advances to next step tab. ✓
- Step tab shows product thumbnail + `1 selected ✓`. ✓
- No banner update (we don't have the banner). ✗

---

## Priority Summary

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | Per-step category banner image | 🔴 High | High |
| 2 | Sidebar progress prompt ("Add N more to unlock") | 🔴 High | Medium |
| 3 | Skeleton placeholder slots for unfilled items | 🟠 Medium | Medium |
| 4 | Item count label + quantity (`x1`) in sidebar items | 🟡 Low | Low |
| 5 | Locked bonus/gift tier section in sidebar | 🟠 Medium | High |
| 6 | Step stepper connecting line + category icons | 🟡 Low | Medium |
| 7 | Back navigation arrow in sidebar CTA row | 🟡 Low | Low |
| 8 | Clear button: icon + pill style (vs text link) | 🟢 Low | Low |

---

## Phases Checklist
- [x] Phase 1: Screenshot capture (reference + our store)
- [x] Phase 2: Gap analysis documentation
- [ ] Phase 3: Implement sidebar improvements
- [ ] Phase 4: Verify on test store
