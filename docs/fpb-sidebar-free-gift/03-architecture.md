# Architecture Decision Record: FPB Sidebar Panel Redesign + Free Gift + Default Product

## Context
Add free gift step support, mandatory default product step support, skeleton slots, and mobile bottom bar to the full-page bundle widget. Requires DB schema extension, API update, admin UI changes, and widget JS/CSS changes.

## Constraints
- Must not break existing bundles (`isFreeGift`/`isDefault` default false)
- Widget JS must be backward-compatible (undefined fields treated as false)
- CSS must stay under 100,000 B (Shopify app block limit)
- No changes to Cart Transform (free gift pricing handled by existing discount engine)
- Widget is a vanilla JS IIFE (no framework) — no React, no imports

## Options Considered

### Option A: Store free gift config as a step-level pricing tier
- Re-use the existing pricing tier mechanism with a 100% discount step
- Pros: No DB migration
- Cons: Conflates pricing with UX intent; can't distinguish "free gift" from "100% discount step"; no `freeGiftName`
- Verdict: ❌ Rejected — too fragile

### Option B: Metafield-only storage (no DB changes)
- Store `isFreeGift`, `isDefault`, `defaultVariantId`, `freeGiftName` in a JSON metafield per bundle
- Widget reads from a separate metafield API call
- Pros: No migration
- Cons: Extra API call per page load; data not queryable; duplicates step identity between DB and metafields
- Verdict: ❌ Rejected — adds latency and complexity

### Option C: DB fields + API passthrough + widget rendering ✅
- Add `isFreeGift Boolean`, `freeGiftName String?`, `isDefault Boolean`, `defaultVariantId String?` to `BundleStep` Prisma model
- Include in existing bundle JSON API response
- Widget reads from step payload, no extra network calls
- Admin UI adds per-step toggles in the step configuration
- Verdict: ✅ Recommended — clean, explicit, no extra latency

## Decision: Option C

**Rationale:** Explicit DB flags give a clean single-source-of-truth. The bundle JSON API already returns all step data in one call; adding 4 fields to that response is zero-cost latency-wise. Widget already iterates steps — adding `if (step.isFreeGift)` branches is minimal complexity.

---

## Data Model

### Prisma Schema Change

```prisma
// In BundleStep model, add after `conditionValue2`:
isFreeGift        Boolean  @default(false)
freeGiftName      String?
isDefault         Boolean  @default(false)
defaultVariantId  String?
```

Migration: `prisma migrate dev --name add-free-gift-default-step`

### BundleUiStep Type Update (`app/services/bundles/metafield-sync/types.ts`)
Already has `isDefault` and `defaultVariantId`. Add:
```typescript
isFreeGift?: boolean;
freeGiftName?: string;
```

### API Response (`app/routes/api/api.bundle.$bundleId[.]json.tsx`)
Add to step mapping (lines ~230-246):
```typescript
isFreeGift: step.isFreeGift,
freeGiftName: step.freeGiftName ?? null,
isDefault: step.isDefault,
defaultVariantId: step.defaultVariantId ?? null,
```

---

## Widget Architecture

### State Changes (`app/assets/bundle-widget-full-page.js`)

**New computed properties on BundleWidgetFullPage:**
```javascript
// Returns the free gift step (if any)
get freeGiftStep() {
  return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
}

// Returns the index of the free gift step
get freeGiftStepIndex() {
  return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
}

// Returns all non-free-gift steps
get paidSteps() {
  return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
}

// Returns true when all paid steps are complete (free gift unlock condition)
get isFreeGiftUnlocked() {
  if (!this.freeGiftStep) return false;
  return this.paidSteps.every((step, i) => this.isStepCompleted(i));
}
```

**Default product initialization:**
```javascript
// In init() or loadBundleData(), after bundle data loads:
this._initDefaultProducts();

_initDefaultProducts() {
  (this.selectedBundle?.steps || []).forEach((step, stepIndex) => {
    if (!step.isDefault || !step.defaultVariantId) return;
    // Find the matching product/variant in step.products or step.StepProduct
    const product = this._findProductByVariantId(step, step.defaultVariantId);
    if (product) {
      this.selectedProducts[stepIndex] = {
        [step.defaultVariantId]: { ...product, quantity: 1, isDefault: true }
      };
    }
  });
}
```

### Sidebar Rendering Changes (`renderSidePanel()`)

New section to insert between selected items list and total:

```javascript
_renderFreeGiftSection(container) {
  const step = this.freeGiftStep;
  if (!step) return; // no free gift step — skip

  const section = document.createElement('div');
  section.className = `side-panel-free-gift ${this.isFreeGiftUnlocked ? 'unlocked' : ''}`;

  if (this.isFreeGiftUnlocked) {
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">✅</span>
      <span class="side-panel-free-gift-text">Congrats! You're eligible for a FREE ${this._escapeHTML(step.freeGiftName || 'gift')}!</span>
    `;
  } else {
    const remaining = this._getFreeGiftRemainingCount();
    section.innerHTML = `
      <span class="side-panel-free-gift-icon">🔒</span>
      <span class="side-panel-free-gift-text">Add ${remaining} more product(s) to claim a FREE ${this._escapeHTML(step.freeGiftName || 'gift')}!</span>
    `;
  }
  container.appendChild(section);
}
```

### Skeleton Slots (`renderSidePanel()`)

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

### Product Card — Free Badge

In `renderProductGrid()` / card rendering, when `this.currentStep.isFreeGift`:
```javascript
if (step.isFreeGift) {
  const badge = document.createElement('div');
  badge.className = 'fpb-free-badge';
  badge.textContent = 'Free';
  cardImageWrapper.appendChild(badge);
  // Override price display to $0.00 with original struck through
}
```

### Free Gift Step Heading

In `renderFullPageLayoutWithSidebar()`, before product grid:
```javascript
if (step.isFreeGift) {
  const heading = document.createElement('div');
  heading.className = 'fpb-step-free-heading';
  heading.textContent = `Complete the look and get a ${step.freeGiftName || 'gift'} free!`;
  contentSection.insertBefore(heading, productGrid);
}
```

### Navigation: Free Gift Step Lock Guard

In `canProceedToNextStep()` — must ensure user cannot navigate to free gift step until paid steps complete:
```javascript
canNavigateToStep(targetIndex) {
  const targetStep = this.selectedBundle.steps[targetIndex];
  if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
  return true;
}
```

### Mobile Bottom Bar

In `renderFullPageLayoutWithSidebar()`:
```javascript
// Existing: only render sidebar if fullPageLayout === 'footer_side'
// New: always render sidebar on desktop, always render mobile bar
// Use CSS media query to show/hide (not JS viewport check)

_renderMobileBottomBar(parent) {
  const bar = document.createElement('div');
  bar.className = 'fpb-mobile-bottom-bar';
  // toggle button, total, CTA

  const sheet = document.createElement('div');
  sheet.className = 'fpb-mobile-bottom-sheet';
  // Clone sidebar content into sheet

  document.body.appendChild(bar);
  document.body.appendChild(sheet);
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 4 fields to BundleStep model |
| `prisma/migrations/` | New migration file (auto-generated) |
| `app/services/bundles/metafield-sync/types.ts` | Add `isFreeGift`, `freeGiftName` to BundleUiStep |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Include new fields in step mapping |
| `app/assets/bundle-widget-full-page.js` | Free gift state, default products, skeleton, free badge, heading, mobile bar |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | New CSS classes for all new components |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Rebuilt output (npm run build:widgets) |
| Admin UI step config route (TBD) | Add isFreeGift/isDefault toggle inputs |

---

## Migration / Backward Compatibility Strategy

- Migration adds columns with `@default(false)` and `?` (nullable) — no data loss, no manual migration
- API passthrough adds new keys with `?? null` fallback — old widget versions ignore unknown keys
- Widget reads `step.isFreeGift ?? false` — handles absent field gracefully
- Existing bundles: all steps have `isFreeGift=false`, `isDefault=false` → no behavior change

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/assets/bundle-widget-free-gift.test.ts` | Unit | `isFreeGiftUnlocked`, `freeGiftStep`, `paidSteps` computed props; re-lock on item removal; default product init |
| `tests/unit/routes/api.bundle.free-gift.test.ts` | Unit | API route returns `isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId` fields |
| `tests/unit/lib/bundle-step-free-gift.test.ts` | Unit | DB model field validation (isFreeGift, isDefault defaults) |

### Behaviors to Test (from PO acceptance criteria)

1. `isFreeGiftUnlocked` returns false when paid steps not complete
2. `isFreeGiftUnlocked` returns true when all paid steps complete
3. `isFreeGiftUnlocked` returns false again after a paid item is removed
4. `freeGiftStep` returns null when no step has isFreeGift=true
5. `_initDefaultProducts` pre-populates selectedProducts for default steps
6. Default product has `isDefault: true` flag in selection
7. API returns all 4 new fields per step
8. Widget handles missing `isFreeGift` gracefully (treats as false)

### Mock Strategy
- Mock Prisma client for API route tests
- Mock `this.selectedBundle` and `this.selectedProducts` for widget unit tests
- Do NOT mock: free gift unlock logic, skeleton slot count calculation

### TDD Exceptions (no tests)
- CSS changes (new `.side-panel-free-gift`, `.fpb-free-badge`, `.fpb-mobile-bottom-bar` etc.)
- Widget HTML template strings (visual-only)
- Admin UI Polaris component rendering
