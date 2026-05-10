# Requirements: FPB Discount Progress Bar

## Context

Full-Page Bundle (FPB) widgets show discount tiers to shoppers — e.g. "add 3 items to get 10% off, add 5 to get 20% off". Currently the only feedback mechanism is a text-only `discount-progress-banner` slim stripe that says "Add 2 more items to get 10% off". There is no visual indicator of progress toward the next threshold. A visual progress bar lets shoppers instantly see how close they are to the next tier, driving higher AOV and completion rates.

The feature needs to work across both FPB subtypes: **floating** (bottom card / modal) and **sidebar** (right-side panel). An admin toggle in the Discount Display Options card enables it per bundle.

The widget already calculates `progressPercentage` (0–100) via `TemplateManager.createDiscountVariables()` and has skeleton HTML in `component-generator.js` (`modal-footer-progress-section`) that was never wired up. This feature completes the wire-up and provides a redesigned, polished bar UI.

---

## Functional Requirements

- **FR-01:** Merchant can toggle the progress bar on/off per bundle via a "Progress bar" switch in the Discount Display Options card (admin UI).
- **FR-02:** When enabled and discount pricing is active, the widget renders a visual fill bar showing progress toward the next discount threshold.
- **FR-03:** The bar updates in real-time as the shopper selects/deselects products.
- **FR-04:** When the shopper qualifies for a discount, the bar shows a "reached" success state (full bar, different color).
- **FR-05:** The bar renders correctly in BOTH the floating (footer_bottom) and sidebar (footer_side) FPB subtypes.
- **FR-06:** When the highest discount tier is already qualified, the progress bar is hidden (nothing further to unlock).
- **FR-07:** On mobile (< 768px), the floating subtype hides the progress bar inside the collapsed footer (only visible when footer is expanded).
- **FR-08:** The `showDiscountProgressBar` flag is persisted in the bundle's pricing data and survives sync.
- **FR-09:** Progress is calculated against the **next unqualified rule** (lowest tier not yet met). Multi-tier bundles always show the next goal, not a completed one.

---

## Out of Scope

- Product-page bundle widget (PPB) — this feature is FPB-only.
- DCP customisation of progress bar colors (tracked separately; default uses existing CSS vars).
- Per-step progress tracking (bar shows bundle-level discount progress, not step completion).
- Animated celebrations / confetti on tier unlock.

---

## Acceptance Criteria

### FR-01: Admin toggle
- [ ] Discount Display Options card shows a "Progress bar" `s-switch` toggle below "Discount Messaging"
- [ ] Toggle default is `false` (off) for new bundles; existing bundles default to `false`
- [ ] Saving the configure page persists the value; reloading reflects saved state

### FR-02 & FR-03: Widget renders and updates
- [ ] With toggle on + discount enabled: bar appears and `width` CSS updates on every product selection change
- [ ] With toggle off: no `.fpb-discount-progress` element exists in the DOM
- [ ] With discount disabled entirely: no bar renders regardless of toggle

### FR-04: Success state
- [ ] When `discountInfo.hasDiscount === true`, bar fills to 100% and gets `.reached` class
- [ ] When `.reached`, label shows success template text (configurable via Discount Messaging)

### FR-05: Both subtypes
- [ ] Floating subtype: bar renders inside `.footer-bar` inner area, below price row, above nav buttons
- [ ] Sidebar subtype: bar renders inside `.bundle-sidebar` side panel, below discount message text

### FR-06: Highest tier qualified
- [ ] `PricingCalculator.getNextDiscountRule()` returns `null` when highest tier is met → bar hidden

### FR-07: Mobile
- [ ] `@media (max-width: 767px)` hides bar inside collapsed floating footer

### FR-08: Persistence
- [ ] `showDiscountProgressBar` written to `pricing.display` in DB
- [ ] Metafield sync includes it in `bundle_ui_config.messaging`
- [ ] Widget reads from `this.config.showDiscountProgressBar`

### FR-09: Next-rule targeting
- [ ] Progress percentage is `(currentValue / nextRule.conditionValue) * 100`, clamped 0–100
- [ ] Label text uses the existing `discountTextTemplate` (from Discount Messaging config)

---

## UI/UX Spec

### Visual design — progress bar component

```
┌──────────────────────────────────────────────────────┐
│  Add 2 more items for 20% off                        │
│  [████████████████░░░░░░░░░░░░]  3 / 5 items         │
└──────────────────────────────────────────────────────┘
```

**Track:** 8 px tall, fully rounded pill (`border-radius: 4px`), light grey bg (`#e5e7eb`)  
**Fill:** Rounded left, smooth `transition: width 300ms ease`, color `var(--bundle-discount-progress-fill, #1d1d1f)` (dark by default)  
**Reached state fill:** `var(--bundle-discount-progress-fill-reached, #16a34a)` (green)  
**Label row:** 13px, grey, sits **above** the bar track  
**Count text:** right-aligned `3 / 5 items` or `£30 / £50` depending on condition type  
**Container padding:** 12px 16px, no external border — blends into its host element

### Floating subtype placement
Inside `.footer-bar`, between `.footer-pricing-row` (price + discount badge) and `.footer-actions-row` (nav buttons).

### Sidebar subtype placement  
Inside `.bundle-sidebar`, below `.side-panel-discount-message`, above `.side-panel-item-count`.

### States

| State | Fill % | Fill colour | Label |
|---|---|---|---|
| No selection | 0% | default dark | "Add X items/£Y for Z% off" |
| In progress | 1–99% | default dark | "Add X more items/£Y for Z% off" |
| Reached (discount unlocked) | 100% | green | Success template text |
| Hidden | — | — | `showDiscountProgressBar=false` OR discount disabled OR highest tier already met |

---

## Data Changes

### `app/types/pricing.ts` — `PricingDisplay`
```typescript
export interface PricingDisplay {
  showFooter: boolean;
  showDiscountProgressBar: boolean;  // NEW
}
```

### `app/services/bundles/metafield-sync/types.ts` — `BundleUiMessaging`
```typescript
export interface BundleUiMessaging {
  progressTemplate: string;
  successTemplate: string;
  showFooter: boolean;
  showDiscountMessaging?: boolean;
  showDiscountProgressBar?: boolean;  // NEW
}
```

### Widget config (runtime, no DB change)
`this.config.showDiscountProgressBar: boolean` — read from `bundle_ui_config.messaging.showDiscountProgressBar`

---

## Risks

| Risk | Mitigation |
|---|---|
| Bundle re-render performance: updating bar on every product click triggers `renderSidePanel` / `renderFullPageFooter` | Use targeted DOM update (update fill width + label in-place) rather than full re-render |
| CSS conflict with existing `.discount-progress-banner` (text stripe) | New element uses class `.fpb-discount-progress` — no name collision |
| `getNextDiscountRule` may be undefined on older widget bundles | Guard with `?.` — already done in existing code at line 3201 |
| Mobile: progress bar adds height to collapsed footer causing layout shift | Hidden via `@media` when footer is collapsed |
