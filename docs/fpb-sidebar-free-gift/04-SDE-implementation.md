# SDE Implementation Plan: FPB Sidebar Panel Redesign + Free Gift + Default Product

## Overview
This plan implements the full free gift step + default product + sidebar redesign across:
- DB schema (Prisma migration)
- API route
- Widget JS source (`app/assets/bundle-widget-full-page.js`)
- Widget CSS (`extensions/bundle-builder/assets/bundle-widget-full-page.css`)
- Widget build output

Divided into 5 phases. Each phase is independently committable.

---

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/assets/bundle-widget-free-gift.test.ts` | Free gift unlock logic, re-lock, default product init | Pending |
| `tests/unit/routes/api.bundle.free-gift.test.ts` | API returns new step fields | Pending |

---

## Phase 1: DB Schema + API — Add new step fields

**Goal:** Persist `isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId` in DB and return via API.

### Tests (Red first)
**File:** `tests/unit/routes/api.bundle.free-gift.test.ts`

```typescript
describe('api.bundle.$bundleId.json — free gift fields', () => {
  it('includes isFreeGift=false by default in step response', async () => { ... });
  it('includes isFreeGift=true when step has isFreeGift=true', async () => { ... });
  it('includes freeGiftName in step response', async () => { ... });
  it('includes isDefault and defaultVariantId in step response', async () => { ... });
  it('handles missing new fields gracefully (null)', async () => { ... });
});
```

### Implementation (Green)

**Step 1.1: Prisma schema**
File: `prisma/schema.prisma`
Add to `BundleStep` model after `conditionValue2`:
```prisma
isFreeGift        Boolean  @default(false)
freeGiftName      String?
isDefault         Boolean  @default(false)
defaultVariantId  String?
```

**Step 1.2: Generate + run migration**
```bash
npx prisma migrate dev --name add-free-gift-default-step
```

**Step 1.3: BundleUiStep type**
File: `app/services/bundles/metafield-sync/types.ts`
Add to `BundleUiStep` interface:
```typescript
isFreeGift?: boolean;
freeGiftName?: string;
```

**Step 1.4: API route**
File: `app/routes/api/api.bundle.$bundleId[.]json.tsx`
In step mapping, add:
```typescript
isFreeGift: step.isFreeGift ?? false,
freeGiftName: step.freeGiftName ?? null,
isDefault: step.isDefault ?? false,
defaultVariantId: step.defaultVariantId ?? null,
```

**Run tests:** `npm run test:unit`

---

## Phase 2: Widget — Free Gift Unlock Logic + Default Product Init

**Goal:** Core state logic in widget. No visual changes yet.

### Tests (Red first)
**File:** `tests/unit/assets/bundle-widget-free-gift.test.ts`

```typescript
describe('BundleWidgetFullPage — free gift unlock logic', () => {
  describe('freeGiftStep getter', () => {
    it('returns null when no step has isFreeGift=true', () => { ... });
    it('returns the step when one step has isFreeGift=true', () => { ... });
  });

  describe('isFreeGiftUnlocked', () => {
    it('returns false when no freeGiftStep', () => { ... });
    it('returns false when paid steps not all complete', () => { ... });
    it('returns true when all paid steps complete', () => { ... });
    it('returns false again when a paid item is removed', () => { ... });
  });

  describe('paidSteps getter', () => {
    it('excludes free gift steps', () => { ... });
    it('excludes default steps', () => { ... });
    it('returns all regular steps', () => { ... });
  });

  describe('_initDefaultProducts', () => {
    it('pre-populates selectedProducts for isDefault steps', () => { ... });
    it('marks pre-populated products with isDefault=true', () => { ... });
    it('does nothing for steps without isDefault', () => { ... });
    it('does nothing when defaultVariantId is missing', () => { ... });
  });

  describe('canNavigateToStep', () => {
    it('returns false for free gift step when not unlocked', () => { ... });
    it('returns true for free gift step when unlocked', () => { ... });
    it('returns true for regular steps always', () => { ... });
  });
});
```

### Implementation (Green)

**File:** `app/assets/bundle-widget-full-page.js`

**Step 2.1: Add computed getters** (after existing property declarations, ~line 430)
```javascript
get freeGiftStep() {
  return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
}

get freeGiftStepIndex() {
  return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
}

get paidSteps() {
  return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
}

get isFreeGiftUnlocked() {
  if (!this.freeGiftStep) return false;
  return this.paidSteps.every((_, i) => {
    const globalIndex = (this.selectedBundle?.steps || []).findIndex(
      (s, idx) => !s.isFreeGift && !s.isDefault && idx === i
    );
    return this.isStepCompleted(globalIndex >= 0 ? globalIndex : i);
  });
}
```

**Step 2.2: `_initDefaultProducts` method** (add before `init()`)
```javascript
_initDefaultProducts() {
  (this.selectedBundle?.steps || []).forEach((step, stepIndex) => {
    if (!step.isDefault || !step.defaultVariantId) return;
    const allProducts = [
      ...(step.products || []),
      ...(step.StepProduct || [])
    ];
    const product = allProducts.find(p =>
      p.variantId === step.defaultVariantId ||
      p.id === step.defaultVariantId ||
      (p.variants || []).some(v => v.id === step.defaultVariantId)
    );
    if (product) {
      if (!this.selectedProducts[stepIndex]) this.selectedProducts[stepIndex] = {};
      this.selectedProducts[stepIndex][step.defaultVariantId] = {
        ...product,
        variantId: step.defaultVariantId,
        quantity: 1,
        isDefault: true
      };
    }
  });
}
```

**Step 2.3: Call `_initDefaultProducts` in `init()`** after bundle data loads:
```javascript
// After: bundleData = await fetchBundleData();
this._initDefaultProducts();
```

**Step 2.4: `canNavigateToStep` guard** (add before `canProceedToNextStep`):
```javascript
canNavigateToStep(targetStepIndex) {
  const targetStep = (this.selectedBundle?.steps || [])[targetStepIndex];
  if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
  return true;
}
```

**Step 2.5: Update free gift re-lock** — in product removal handler, after removing an item, if `!this.isFreeGiftUnlocked` and the free gift was selected, clear it:
```javascript
_handleItemRemoved(stepIndex) {
  // ... existing removal logic ...
  // Re-lock free gift if no longer unlocked
  if (!this.isFreeGiftUnlocked && this.freeGiftStepIndex >= 0) {
    delete this.selectedProducts[this.freeGiftStepIndex];
  }
  this.renderSidePanel(this.elements.sidePanel);
}
```

**Run tests:** `npm run test:unit`

---

## Phase 3: Widget CSS — New Component Styles

**Goal:** Add all new CSS classes. No JS changes.

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

Add at the end (after existing styles):

```css
/* ---- Free Gift Section ---- */
.side-panel-free-gift {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  margin: 8px 0;
  background: var(--bundle-free-gift-locked-bg, #f5f5f5);
  border: 1px solid var(--bundle-free-gift-locked-border, #e0e0e0);
  border-radius: 8px;
}

.side-panel-free-gift.unlocked {
  background: var(--bundle-free-gift-unlocked-bg, #e8f5e9);
  border-color: var(--bundle-free-gift-unlocked-border, #a5d6a7);
}

.side-panel-free-gift-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.side-panel-free-gift-text { font-size: 13px; line-height: 1.4; color: var(--bundle-text-secondary, #555); }
.side-panel-free-gift.unlocked .side-panel-free-gift-text { color: var(--bundle-free-gift-unlocked-text, #2e7d32); }

/* ---- Skeleton Slots ---- */
.side-panel-skeleton-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  animation: fpb-shimmer 1.5s ease-in-out infinite;
}
.side-panel-skeleton-thumb {
  width: 40px; height: 40px;
  background: #e0e0e0; border-radius: 4px; flex-shrink: 0;
}
.side-panel-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.side-panel-skeleton-line {
  height: 10px; background: #e0e0e0; border-radius: 3px;
}
.side-panel-skeleton-line.line-name { width: 80%; }
.side-panel-skeleton-line.line-price { width: 45%; }
@keyframes fpb-shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ---- Free Badge on Product Cards ---- */
.fpb-card-image-wrapper { position: relative; }
.fpb-free-badge {
  position: absolute; top: 6px; left: 6px;
  background: var(--bundle-free-badge-bg, #FFF3CD);
  color: var(--bundle-free-badge-text, #333);
  font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 4px;
  z-index: 1; pointer-events: none;
}

/* ---- Free Gift Step Heading ---- */
.fpb-step-free-heading {
  font-size: 18px; font-weight: 600;
  padding: 0 0 14px 0;
  color: var(--bundle-text-primary, #111);
}

/* ---- Free Gift Price in Sidebar ($0.00 + strikethrough) ---- */
.side-panel-product-price.free-gift-price { color: var(--bundle-success-color, #2e7d32); }
.side-panel-product-original-price {
  font-size: 11px; color: #999;
  text-decoration: line-through; margin-left: 4px;
}

/* ---- Mobile Bottom Bar ---- */
.fpb-mobile-bottom-bar {
  display: none; /* shown only on mobile via media query */
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 8px 16px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 1000;
  align-items: center;
  gap: 10px;
  height: 56px;
  box-sizing: border-box;
}
.fpb-mobile-toggle-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; color: #333; padding: 4px 8px;
  border: 1px solid #e0e0e0; border-radius: 20px;
}
.fpb-mobile-toggle-btn .fpb-caret { font-size: 10px; }
.fpb-mobile-toggle-count {
  background: #333; color: #fff;
  border-radius: 10px; padding: 1px 6px;
  font-size: 11px; font-weight: 600;
}
.fpb-mobile-total {
  flex: 1; text-align: center;
  font-size: 14px; font-weight: 600; color: #111;
}
.fpb-mobile-cta-btn {
  background: var(--bundle-btn-bg, #111);
  color: var(--bundle-btn-text, #fff);
  border: none; border-radius: 24px;
  padding: 8px 18px; font-size: 14px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.fpb-mobile-cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---- Mobile Bottom Sheet ---- */
.fpb-mobile-bottom-sheet {
  display: none;
  position: fixed; bottom: 56px; left: 0; right: 0;
  max-height: 70vh; overflow-y: auto;
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  z-index: 999;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  padding: 16px;
  box-sizing: border-box;
}
.fpb-mobile-bottom-sheet.is-open {
  transform: translateY(0);
}
.fpb-mobile-backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 998;
}
.fpb-mobile-backdrop.is-open { display: block; }

@media (max-width: 767px) {
  .full-page-side-panel { display: none !important; }
  .fpb-mobile-bottom-bar { display: flex; }
  .fpb-mobile-bottom-sheet { display: block; }
  /* Add bottom padding to main content so it doesn't hide behind the bar */
  .bundle-widget-full-page { padding-bottom: 70px; }
}
```

**After adding CSS, verify size:**
```bash
wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css
# Must be < 100000
```

---

## Phase 4: Widget JS — Sidebar + Product Card Rendering

**Goal:** Wire up all new state to the UI. Free gift section, skeleton slots, free badge, step heading.

**File:** `app/assets/bundle-widget-full-page.js`

### Step 4.1: Update `renderSidePanel()` — inject free gift section + skeleton slots

After rendering selected items list, before the total section:
```javascript
// Skeleton slots
const totalRequired = this.paidSteps.reduce((sum, s) =>
  sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
const filledCount = this.paidSteps.reduce((sum, _, i) => {
  const globalIdx = /* map paidStep index back to global step index */ ...;
  return sum + (this.isStepCompleted(globalIdx) ? 1 : 0);
}, 0);
this._renderSkeletonSlots(container, filledCount, totalRequired);

// Free gift section
this._renderFreeGiftSection(container);
```

### Step 4.2: Add `_renderFreeGiftSection` method
```javascript
_renderFreeGiftSection(container) {
  const step = this.freeGiftStep;
  if (!step) return;

  const section = document.createElement('div');
  const giftName = this._escapeHTML(step.freeGiftName || 'gift');

  if (this.isFreeGiftUnlocked) {
    section.className = 'side-panel-free-gift unlocked';
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">✅</span>
      <span class="side-panel-free-gift-text">Congrats! You're eligible for a FREE ${giftName}!</span>
    `;
  } else {
    const remaining = this._getFreeGiftRemainingCount();
    section.className = 'side-panel-free-gift';
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">🔒</span>
      <span class="side-panel-free-gift-text">Add ${remaining} more product(s) to claim a FREE ${giftName}!</span>
    `;
  }
  container.appendChild(section);
}

_getFreeGiftRemainingCount() {
  const total = this.paidSteps.reduce((sum, s) =>
    sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
  const selected = Object.values(this.selectedProducts || {})
    .filter((_, idx) => {
      const step = (this.selectedBundle?.steps || [])[idx];
      return step && !step.isFreeGift && !step.isDefault;
    })
    .reduce((sum, stepSel) =>
      sum + Object.values(stepSel || {}).reduce((s, p) => s + (p.quantity || 1), 0), 0);
  return Math.max(0, total - selected);
}
```

### Step 4.3: Add `_renderSkeletonSlots` method
```javascript
_renderSkeletonSlots(container, filledCount, totalRequired) {
  const remaining = Math.max(0, totalRequired - filledCount);
  for (let i = 0; i < remaining; i++) {
    const slot = document.createElement('div');
    slot.className = 'side-panel-skeleton-slot';
    slot.innerHTML = `
      <div class="side-panel-skeleton-thumb"></div>
      <div class="side-panel-skeleton-lines">
        <div class="side-panel-skeleton-line line-name"></div>
        <div class="side-panel-skeleton-line line-price"></div>
      </div>
    `;
    container.appendChild(slot);
  }
}
```

### Step 4.4: Suppress remove button for default products

In selected item row rendering (~line 974):
```javascript
// Only show remove button if NOT a default product
const showRemove = !item.isDefault;
row.innerHTML = `
  ...existing template...
  ${showRemove ? `<button class="side-panel-remove-btn" ...>...</button>` : ''}
`;
```

### Step 4.5: Free gift price display in sidebar

In selected item rendering, detect free gift:
```javascript
const isFreeGiftItem = this.freeGiftStep &&
  stepIndex === this.freeGiftStepIndex;

const priceHtml = isFreeGiftItem
  ? `<span class="side-panel-product-price free-gift-price">$0.00</span>
     <span class="side-panel-product-original-price">${CurrencyManager.formatMoney(item.price, ...)}</span>`
  : `<span class="side-panel-product-price">${CurrencyManager.formatMoney(item.price * item.quantity, ...)}</span>`;
```

### Step 4.6: Free badge + $0.00 on product cards in free gift step

In product card rendering, detect if `this.selectedBundle.steps[this.currentStepIndex].isFreeGift`:
```javascript
const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
if (currentStep?.isFreeGift) {
  const badge = document.createElement('div');
  badge.className = 'fpb-free-badge';
  badge.textContent = 'Free';
  imgWrapper.style.position = 'relative';
  imgWrapper.appendChild(badge);
  // Override price text
  priceEl.textContent = '$0.00';
  if (originalPriceEl) {
    originalPriceEl.textContent = CurrencyManager.formatMoney(product.price, ...);
    originalPriceEl.style.textDecoration = 'line-through';
    originalPriceEl.style.color = '#999';
    originalPriceEl.style.fontSize = '12px';
  }
}
```

### Step 4.7: Free gift step heading

In `renderFullPageLayoutWithSidebar()` or step content rendering:
```javascript
const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
if (currentStep?.isFreeGift) {
  const heading = document.createElement('div');
  heading.className = 'fpb-step-free-heading';
  heading.textContent = `Complete the look and get a ${currentStep.freeGiftName || 'gift'} free!`;
  contentSection.insertBefore(heading, productGridEl);
}
```

### Step 4.8: Lock free gift step navigation

In "Next Step" button click handler:
```javascript
// Before advancing: if target step is free gift and not unlocked, show toast
if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
  ToastManager.show(`Complete all steps to unlock the free ${this.freeGiftStep?.freeGiftName || 'gift'}!`);
  return;
}
```

In step timeline click handler (if steps are clickable):
```javascript
stepEl.addEventListener('click', () => {
  if (!this.canNavigateToStep(targetIndex)) return; // silently block
  this.currentStepIndex = targetIndex;
  this.renderFullPageLayoutWithSidebar();
});
```

---

## Phase 5: Mobile Bottom Bar

**File:** `app/assets/bundle-widget-full-page.js`

### Step 5.1: Add `_renderMobileBottomBar` method
```javascript
_renderMobileBottomBar() {
  // Remove existing if present
  document.querySelector('.fpb-mobile-bottom-bar')?.remove();
  document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
  document.querySelector('.fpb-mobile-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'fpb-mobile-backdrop';

  const sheet = document.createElement('div');
  sheet.className = 'fpb-mobile-bottom-sheet';
  // Re-render sidebar content into sheet
  this._populateMobileSheet(sheet);

  const bar = document.createElement('div');
  bar.className = 'fpb-mobile-bottom-bar';

  const selectedCount = this._getTotalSelectedCount();
  const isComplete = this.areBundleConditionsMet();
  const isLastStep = this.currentStepIndex >= (this.selectedBundle?.steps?.length || 1) - 1;

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'fpb-mobile-toggle-btn';
  toggleBtn.innerHTML = `
    <span class="fpb-caret">▲</span>
    <span class="fpb-mobile-toggle-count">${selectedCount}</span>
  `;
  toggleBtn.addEventListener('click', () => {
    const open = sheet.classList.toggle('is-open');
    backdrop.classList.toggle('is-open', open);
    toggleBtn.querySelector('.fpb-caret').textContent = open ? '▼' : '▲';
  });
  backdrop.addEventListener('click', () => {
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    toggleBtn.querySelector('.fpb-caret').textContent = '▲';
  });

  // Total
  const totalEl = document.createElement('div');
  totalEl.className = 'fpb-mobile-total';
  totalEl.textContent = CurrencyManager.formatMoney(this._getDiscountedTotal(), ...);

  // CTA
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'fpb-mobile-cta-btn';
  ctaBtn.textContent = (isLastStep && isComplete) ? 'Add To Cart' : 'Next';
  ctaBtn.disabled = isLastStep ? !isComplete : false;
  ctaBtn.addEventListener('click', () => {
    if (isLastStep && isComplete) {
      this.addBundleToCart();
    } else {
      this._advanceStep();
    }
  });

  bar.appendChild(toggleBtn);
  bar.appendChild(totalEl);
  bar.appendChild(ctaBtn);

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  document.body.appendChild(bar);
}

_populateMobileSheet(sheet) {
  // Render same content as desktop sidebar into the sheet
  sheet.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'side-panel-header';
  // ... same as renderSidePanel header ...
  sheet.appendChild(header);
  // ... append selected items, free gift section, total ...
  this.renderSidePanel(sheet); // reuse existing method
}
```

### Step 5.2: Call `_renderMobileBottomBar` on each render

In `renderFullPageLayoutWithSidebar()`, at the end:
```javascript
this._renderMobileBottomBar();
```

---

## Build & Verification Checklist
- [ ] `npx prisma migrate dev --name add-free-gift-default-step` runs without error
- [ ] `npm run test:unit` — all tests pass
- [ ] `npm run lint -- --max-warnings 9999` — zero ESLint errors
- [ ] `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css` — under 100,000 bytes
- [ ] `npm run build:widgets` — builds successfully
- [ ] Manually test on storefront: bundle with free gift step shows locked → unlocked flow
- [ ] Manually test: default product appears on load with no remove button
- [ ] Manually test: mobile bottom bar appears at < 768px, sheet expands on tap
- [ ] Existing bundles (no isFreeGift/isDefault) render without any change

## Issue File
Create: `docs/issues-prod/fpb-sidebar-free-gift-1.md`
Issue ID: `fpb-sidebar-free-gift-1`

## Commit Format
```
[fpb-sidebar-free-gift-1] feat: Add isFreeGift and isDefault fields to BundleStep schema
[fpb-sidebar-free-gift-1] feat: Return new step fields from bundle JSON API
[fpb-sidebar-free-gift-1] feat: Add free gift unlock logic and default product init to FPB widget
[fpb-sidebar-free-gift-1] style: Add free gift section, skeleton slots, free badge CSS
[fpb-sidebar-free-gift-1] feat: Render free gift section and skeleton slots in FPB sidebar
[fpb-sidebar-free-gift-1] feat: Add mobile sticky bottom bar and bottom sheet to FPB widget
[fpb-sidebar-free-gift-1] chore: Rebuild widget bundles after FPB redesign
```

## Rollback Notes
- DB: `prisma migrate reset` (dev only) or manually drop the 4 columns
- Widget: revert to previous commit of `bundle-widget-full-page.js` + rebuild
- API: revert 4-field addition from step mapping — zero impact on existing data
