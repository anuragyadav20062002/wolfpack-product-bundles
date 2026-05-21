# Guided Tour + Readiness Score — Implementation Reference

> **Status:** Planned — implement after bundle configure page UI revamp  
> **Issue:** `guided-tour-readiness-score-1`  
> **Last Updated:** 2026-04-30

---

## 1. Overview

Two linked features, both living on the **bundle configure page** (FPB and PPB):

| Feature | Location | Trigger |
|---|---|---|
| Guided Tour | Fixed bottom-center tooltip | First visit to configure page (localStorage gate) |
| Readiness Score Widget | Fixed bottom-left arc | Always visible on configure page |

Neither lives on the dashboard. The dashboard setup overlay is removed entirely.

---

## 2. Guided Tour

### 2.1 Visual Spec

```
┌──────────────────────────────────────────────┐
│ ████████████░░░░░░░░░░  ← white progress bar  │
│ STEP 2 OF 5                                   │
│ Discount & Pricing                            │
│ Set how much customers save when they         │
│ complete the bundle.                          │
│                      [Dismiss]  [Next →]      │
└──────────────────────────────────────────────┘
```

- **Position:** `position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%)`
- **Width:** `min(420px, 90vw)`
- **Background:** `#005bd3` (Shopify blue, matches EasyBundles)
- **Text:** white
- **Progress bar:** white fill on `rgba(255,255,255,0.25)` track, animates width per step
- **Step label:** `STEP X OF 5` in small caps, `font-size: 11px; letter-spacing: 0.08em; opacity: 0.8`
- **Title:** `font-size: 18px; font-weight: 600`
- **Body:** `font-size: 14px; opacity: 0.9; line-height: 1.5`
- **Buttons:** "Dismiss" plain white text; "Next →" white pill button with dark text
- **Border-radius:** `12px`
- **Box-shadow:** `0 8px 32px rgba(0,0,0,0.18)`
- **z-index:** `600` (above readiness score widget at 500)

### 2.2 Target Section Highlight

When the tour advances to a step, the target element:
1. Scrolls into view smoothly (`behavior: 'smooth'`)
2. Gets CSS class `tourHighlight`:

```css
.tourHighlight {
  outline: 2px solid #005bd3;
  outline-offset: 4px;
  border-radius: 8px;
  animation: tourPulse 0.4s ease both;
}

@keyframes tourPulse {
  from { outline-color: transparent; }
  to   { outline-color: #005bd3; }
}
```

No backdrop/overlay — the page stays fully interactive.

### 2.3 State Persistence

- **localStorage key:** `wpb_tour_seen_{shop}_{bundleId}`
- Set to `"1"` on Dismiss or after step 5 "Got It" is clicked
- On first render: if key absent → show tour; otherwise skip
- Fresh bundle = new bundleId = fresh key → tour shows again (intentional)

### 2.4 Component API

```tsx
// app/components/bundle-configure/BundleGuidedTour.tsx

interface TourStep {
  title: string;
  body: string;
  targetSection: string; // matches data-tour-target attr
  onActivate?: () => void; // e.g. step 5 opens readiness widget
}

interface BundleGuidedTourProps {
  steps: TourStep[];
  shop: string;
  bundleId: string;
  onComplete: () => void; // called after final step
  onDismiss: () => void;  // called on "Dismiss"
}
```

Usage in configure route:
```tsx
<BundleGuidedTour
  steps={FPB_TOUR_STEPS}   // or PPB_TOUR_STEPS
  shop={shop}
  bundleId={bundle.id}
  onComplete={() => setReadinessOpen(true)}
  onDismiss={() => {}}
/>
```

### 2.5 Step Definitions File

```ts
// app/components/bundle-configure/tourSteps.ts

export const FPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Your Steps & Products",
    body: "Add the products customers can choose from, organised into steps.",
    targetSection: "fpb-step-setup",
  },
  {
    title: "Discount & Pricing",
    body: "Set how much customers save when they complete the bundle.",
    targetSection: "fpb-discount-pricing",
  },
  {
    title: "Design & Appearance",
    body: "Customise how the bundle looks on your storefront.",
    targetSection: "fpb-design-settings",
  },
  {
    title: "Bundle Placement",
    body: "Place your bundle on a product page or a dedicated full-page embed.",
    targetSection: "fpb-bundle-visibility",
  },
  {
    title: "Your Readiness Score",
    body: "Tracks everything left before your bundle is ready to sell — it lives in the bottom-left corner.",
    targetSection: "fpb-readiness-score", // no DOM target; onActivate opens the widget
    onActivate: () => { /* caller sets readinessOpen = true */ },
  },
];

export const PPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Select Your Products",
    body: "Choose the products customers will pick from in this bundle.",
    targetSection: "ppb-product-selection",
  },
  {
    title: "Discount & Pricing",
    body: "Set how much customers save when they complete the bundle.",
    targetSection: "ppb-discount-pricing",
  },
  {
    title: "Design & Appearance",
    body: "Customise how the bundle looks on the product page.",
    targetSection: "ppb-design-settings",
  },
  {
    title: "Your Readiness Score",
    body: "Tracks everything left before your bundle is ready to sell — it lives in the bottom-left corner.",
    targetSection: "ppb-readiness-score",
    onActivate: () => { /* caller sets readinessOpen = true */ },
  },
];
```

> **Note on PPB steps:** These target the *current* PPB configure page layout. When the PPB UI is revamped, only `PPB_TOUR_STEPS` needs updating — the component is unchanged.

---

## 3. data-tour-target Placement Spec

> **MANDATORY:** Add these `data-tour-target` attributes to section wrappers **during the configure page UI revamp**. Do not add them to Polaris internal elements — wrap sections in a `<div data-tour-target="...">` if needed.

### 3.1 FPB Configure Page (`app.bundles.full-page-bundle.configure.$bundleId/route.tsx`)

| Section | `data-tour-target` | Notes |
|---|---|---|
| Step setup / product selection area | `fpb-step-setup` | Top of the main config panel |
| Discount & pricing section | `fpb-discount-pricing` | The pricing card / tab |
| Design settings / appearance | `fpb-design-settings` | DCP / template picker section |
| Bundle visibility / placement | `fpb-bundle-visibility` | Status, page placement section |

Step 5 has no DOM target — `onActivate` opens the readiness widget programmatically.

### 3.2 PPB Configure Page (`app.bundles.product-page-bundle.configure.$bundleId/route.tsx`)

| Section | `data-tour-target` | Notes |
|---|---|---|
| Product selection | `ppb-product-selection` | The product picker area |
| Discount & pricing | `ppb-discount-pricing` | Pricing section |
| Design settings | `ppb-design-settings` | Appearance / DCP |
| Bundle status / placement | `ppb-bundle-status` | (Step 4 on PPB is readiness widget) |

> Update this table when PPB UI revamp is complete.

---

## 4. Readiness Score Widget

### 4.1 Collapsed State (always visible on configure page)

```
  ┌────────────────────┐
  │  ╭──────╮          │
  │  │  35  │ Readiness│ ∨
  │  ╰──────╯  Score   │
  └────────────────────┘
```

- **Position:** `position: fixed; left: 20px; bottom: 20px; z-index: 500`
- **Circle:** 44px diameter SVG arc, thin stroke (4px), animates fill
- **Score color:** gray (<40), blue (40–79), green (≥80)
- **Label:** "Readiness Score" in 11px subdued text beside or below arc
- **Chevron:** `∨` expands, `∧` collapses
- **Background:** white card, `border: 1px solid #e3e3e3; border-radius: 12px; padding: 8px 12px`

### 4.2 Expanded State (popup panel above collapsed widget)

```
  ┌─────────────────────────────┐
  │ ✓ App embed enabled    +15  │
  │ ✓ Products added       +20  │
  │ ○ Discount configured  +15 →│
  │ ○ Bundle placed        +25 →│
  │ ○ Previewed            +10  │
  │ ○ Product active       +15  │
  │─────────────────────────────│
  │ ⚠ Bundle isn't ready yet.   │
  │─────────────────────────────│
  │ ◕ 35   Readiness Score   ∧  │
  └─────────────────────────────┘
```

- Panel slides up with `transform: translateY(-8px)` + `opacity` animation
- Width: `min(360px, calc(100vw - 40px))`
- Checked items: green checkmark + label + points (muted)
- Unchecked items: circle + label + points + optional `→` action link
- Status line at bottom: red text if not ready, green if complete
- Clicking an action link navigates or opens the relevant section

### 4.3 Readiness Items + Point Values

| Item | Points | Source |
|---|---|---|
| App embed enabled | 15 | `checkAppEmbedEnabled()` in loader |
| Products added to a step | 20 | `bundleStep` has products |
| Discount configured | 15 | `bundlePricing.enabled === true` |
| Bundle placed / visible | 25 | `shopifyPageId != null` or `status === ACTIVE` |
| Bundle previewed | 10 | `localStorage: wpb_preview_{bundleId}` (client-only) |
| Parent product active | 15 | `shopifyProductStatus === 'ACTIVE'` |
| **Total** | **100** | |

### 4.4 Component API

```tsx
// app/components/bundle-configure/BundleReadinessOverlay.tsx

interface BundleReadinessItem {
  key: string;
  label: string;
  description: string;
  points: number;
  done: boolean;
  actionLabel?: string;
  actionUrl?: string;     // navigate() for internal, window.open for external
}

interface BundleReadinessOverlayProps {
  items: BundleReadinessItem[];
  bundleId: string;       // used to read/write localStorage preview flag
  open?: boolean;         // controlled from parent (tour step 5 opens it)
  onOpenChange?: (open: boolean) => void;
}
```

### 4.5 Preview Auto-Detection

In both configure pages, attach to the existing "Preview Bundle" button click handler:

```ts
const handlePreviewBundle = () => {
  localStorage.setItem(`wpb_preview_${bundle.id}`, "1");
  // ... existing preview logic
};
```

`BundleReadinessOverlay` reads this on mount via `useEffect` (client-only).

---

## 5. Loader Changes (configure pages)

Add to **both** `full-page-bundle/route.tsx` and `product-page-bundle/route.tsx` loaders:

```ts
import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";

// Inside loader:
const embedCheck = await checkAppEmbedEnabled(admin, session.shop);
const readiness = {
  appEmbedEnabled: embedCheck.enabled,
  hasProductsAdded: bundle.steps?.some(s => s.products && s.products.length > 0) ?? false,
  hasDiscount: bundle.pricing?.enabled ?? false,
  hasBundleVisibility: !!(bundle.shopifyPageId || bundle.shopifyProductId),
  parentProductActive: bundle.shopifyProductStatus === 'ACTIVE',
  // hasPreviewChecked: client-only, not in loader
};

return json({ ...existing, readiness, themeEditorUrl });
```

---

## 6. Files to Create / Modify

| File | Action | Phase |
|---|---|---|
| `app/components/bundle-configure/BundleGuidedTour.tsx` | Create | 2 |
| `app/components/bundle-configure/BundleGuidedTour.module.css` | Create | 2 |
| `app/components/bundle-configure/BundleReadinessOverlay.tsx` | Create | 2 |
| `app/components/bundle-configure/BundleReadinessOverlay.module.css` | Create | 2 |
| `app/components/bundle-configure/tourSteps.ts` | Create | 2 |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Modify — add `data-tour-target` attrs, readiness loader data, render both components | 1+2 |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Modify — same | 1+2 |
| `app/routes/app/app.dashboard/route.tsx` | Modify — remove setupScore + overlay | 0 ✅ |
| `app/routes/app/app.dashboard/dashboard.module.css` | Modify — delete overlay CSS | 0 ✅ |
| `app/components/SetupScoreCard.tsx` | Delete | 0 ✅ |

---

## 7. Implementation Sequence

```
Phase 0 (now — independent):
  ✅ Remove dashboard setup overlay
  ✅ Delete SetupScoreCard.tsx

Phase 1 (during configure page UI revamp):
  → Add data-tour-target attrs per Section 3 above
  → Agree on any changes to tour step copy / ordering
  → Update this doc if sections change

Phase 2 (after configure page UI revamp):
  → Build BundleGuidedTour + BundleReadinessOverlay
  → Wire readiness data into loaders
  → Wire Preview click → localStorage

Phase 3 (after PPB UI revamp):
  → Update PPB_TOUR_STEPS to match new sections
  → Update Section 3.2 of this doc
```
