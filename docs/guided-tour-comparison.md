# Guided Tour: Ours vs Competitor (EB | Easy Bundle Builder)

**Date:** 2026-05-08

---

## Our Tour (Wolfpack Product Bundles)

| Attribute | Value |
|---|---|
| **Trigger** | Per-bundle: `localStorage` key `wpb_tour_seen_${shop}_${bundleId}` — fires every time a new bundle is configured |
| **Page** | Configure wizard step (create flow only) |
| **Step count** | 4 steps |
| **Tooltip position** | Fixed: `bottom: 80px; left: 50%; transform: translateX(-50%)` — always bottom-center regardless of target |
| **Backdrop** | Full-dim `rgba(0,0,0,0.45)` overlay; target element raised above via `z-index: 595` |
| **Spotlight** | No cutout — target gets a blue `outline: 2px solid #005bd3` and is raised visually but the dim overlay partially obscures it |
| **Progress indicator** | Thin white progress bar at top of card |
| **Step label** | "STEP X OF 4" small-caps |
| **Dismiss options** | "Dismiss" ghost button at bottom of card only |
| **Final button** | "Got it" |
| **Card color** | `#005bd3` blue |
| **Body scroll** | Locked while tour visible |

### Steps
| # | Title | Body | Target |
|---|---|---|---|
| 1 | Configure Your Step | Set a name and icon for this bundle step. The step name appears in the widget navigation. | `wizard-step-config` |
| 2 | Add Products | Select the products customers can choose from in this step. Browse by product or collection. | `wizard-select-product` |
| 3 | Set Rules | Define conditions like minimum quantity to control how customers make their selection. | `wizard-rules` |
| 4 | Bundle Status | Set your bundle to Active when you're ready for customers to see it, or keep it as Draft while configuring. | `wizard-bundle-status` |

---

## Competitor Tour (EB | Easy Bundle Builder)

| Attribute | Value |
|---|---|
| **Trigger** | First-install only — shop-level flag; never repeats after first bundle |
| **Page** | Configure page after first-install flow (Welcome → Pricing → AI creator → Layout → Products → Bundle ready) |
| **Step count** | 5 steps |
| **Tooltip position** | Anchored near the highlighted element — tooltip appears below or beside target based on available space |
| **Backdrop** | SVG/clip-path spotlight cutout — target element is visually clear, rest of page is dimmed |
| **Spotlight** | True cutout: target element visible at full brightness through a shaped hole in the dim layer |
| **Progress indicator** | Progress bar at top of card |
| **Step label** | "STEP X OF 5" small-caps |
| **Dismiss options** | "Dismiss guided tour" text link at the top of the card AND "Dismiss" button at the bottom |
| **Final button** | "Got It" |
| **Card color** | Blue |
| **Body scroll** | Locked while tour visible |

### Steps
| # | Title | Body | Target area |
|---|---|---|---|
| 1 | Your Steps & Products | Add the products customers can choose from, organised into steps. | Steps & Products section |
| 2 | Selection Rules | Control how customers interact with each step — set min/max, make products required, and more. | Selection Rules section |
| 3 | Your Discounts | Create discounts or set a fixed price — applied when customers complete the bundle. | Discounts section |
| 4 | Design & Customization | Make your bundle look great — customise fonts, colours, button labels and layout. | Design section |
| 5 | Your Readiness Score | Tracks everything left before your bundle is ready to sell — it lives in the bottom-left corner. | Readiness score widget |

---

## Gap Analysis

| Gap | Our current state | Competitor | Priority | Fix |
|---|---|---|---|---|
| **Trigger condition** | Fires for every new bundle (per-bundle localStorage key) | Fires once per shop on first install | 🔴 High | Change localStorage key to `wpb_first_bundle_tour_seen_${shop}` |
| **Spotlight effect** | No cutout — dim + raised element | True SVG spotlight cutout | 🟡 Medium | SVG backdrop with mask element |
| **Tooltip anchor** | Fixed bottom-center regardless of target | Anchored near highlighted element | 🟡 Medium | Calculate element rect, position tooltip above/below |
| **Full dismiss option** | "Dismiss" at bottom only | "Dismiss guided tour" at top of card | 🟡 Medium | Add top text link before progress bar |
| **Step count** | 4 steps (configure-focused) | 5 steps (broader overview) | 🟢 Low | Our 4 steps are appropriate for wizard context |
| **Step copy** | Functional descriptions | Same quality | 🟢 Low | No change needed |

---

## Screenshots

Our tour:
- `docs/app-nav-map/screenshots/our-tour-step1.png` — Step 1: Configure Your Step
- `docs/app-nav-map/screenshots/our-tour-step2.png` — Step 2: Add Products
- `docs/app-nav-map/screenshots/our-tour-step3.png` — Step 3: Set Rules
- `docs/app-nav-map/screenshots/our-tour-step4.png` — Step 4: Bundle Status

Competitor tour:
- `docs/app-nav-map/screenshots/competitor-tour-step1.png` — Step 1: Your Steps & Products
- `docs/app-nav-map/screenshots/competitor-tour-step2.png` — Step 2: Selection Rules
- `docs/app-nav-map/screenshots/competitor-tour-step3.png` — Step 3: Your Discounts
- `docs/app-nav-map/screenshots/competitor-tour-step4.png` — Step 4: Design & Customization
- `docs/app-nav-map/screenshots/competitor-tour-step5.png` — Step 5: Your Readiness Score
