# Architecture: Add-On / Upsell Step (Enhanced Free Gift Step)

**Feature name:** `addon-upsell-step`
**Stage:** 2 — Architecture
**Created:** 2026-04-26

## Fast-Track Note
BR context from: `docs/addon-upsell-step/01-requirements.md`
Competitor context from: `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §5 (Feature A)

---

## Impact Analysis

- **Communities touched:**
  - BundleStep data model (Prisma + type system)
  - FPB configure route community (god node — touches `BundleWidgetFullPage`, 125 edges)
  - PPB configure route community
  - Widget JS source community (god node — `bundle-widget-full-page.js Widget Source`, 82 edges)
  - API bundle JSON route community
  - Metafield sync service community

- **God nodes affected:**
  - `BundleWidgetFullPage` (125 edges) — configure routes touch this; Step Options section redesigned
  - `bundle-widget-full-page.js Widget Source` (82 edges) — add-on tab rendering, lock state, FREE badge
  - `AppStateService` (61 edges) — PPB configure touches this community

- **Blast radius:**
  - Prisma migration adds 5 nullable/defaulted columns to `BundleStep` — zero-downtime (additive only)
  - `isFreeGift` field remains in schema and is still written on save — cart transform unchanged
  - Widget rebuild required after widget JS changes
  - API JSON route must expose new fields — storefront picks them up after metafield sync
  - `freeGiftName` is read-only migrated in UI logic (no DB migration) — no data loss

- **Graph path confirmed (prior session):**
  `isFreeGift fields` → `PDP Step Options` → `FPB Sidebar Panel Redesign` → `FPB Widget CSS` → `FPB Widget JS Source` (5 hops — full chain)

---

## Decision

**Add 5 new direct Prisma columns to `BundleStep`, redesign the Step Options card UI, and extend the widget JS** to render add-on tabs. The `isFreeGift` boolean is preserved as the cart transform signal — saving in Add-On mode continues to write `isFreeGift = true`. The UI reads `isFreeGift` on load to determine the initial step mode, then exposes the new fields. No new Prisma relations, no data migration scripts, no backwards-compat shims — new fields default to correct values (Prisma schema defaults).

Rejected: Storing addon config in a JSON blob alongside existing fields — this violates the No Backwards Compatibility Rule and would require shim logic to extract. Direct columns are first-class, indexable, and type-safe.

---

## Data Model

```typescript
// Prisma additions to BundleStep model (prisma/schema.prisma)
// addonLabel      String?              -- Tab label (e.g. "Add-Ons", "Free Gift")
// addonTitle      String?              -- Panel heading (e.g. "Pick a free gift!")
// addonIconUrl    String?              -- URL of uploaded step tab icon
// addonDisplayFree     Boolean @default(true)   -- Show $0.00 on products in this step
// addonUnlockAfterCompletion  Boolean @default(true)  -- Lock tab until prior steps complete

// TypeScript — additions to BundleStep type in app/types/bundle.types.ts (or inline)
interface BundleStep {
  // ...existing fields...
  addonLabel: string | null;
  addonTitle: string | null;
  addonIconUrl: string | null;
  addonDisplayFree: boolean;
  addonUnlockAfterCompletion: boolean;
}

// UI-local derived state (no DB field needed)
type StepMode = 'regular' | 'addon';
// Derived on load: stepMode = step.isFreeGift ? 'addon' : 'regular'
```

---

## Files

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add 5 fields to `BundleStep`: `addonLabel String?`, `addonTitle String?`, `addonIconUrl String?`, `addonDisplayFree Boolean @default(true)`, `addonUnlockAfterCompletion Boolean @default(true)` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | Step Options section (lines 1992–2059): replace `isFreeGift` + `freeGiftName` checkboxes with Polaris `ChoiceList` mode selector + conditional addon fields panel. Loader: include new fields in step data. Action/handler: save new fields to DB. |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Same Step Options redesign as FPB configure (PPB has equivalent step config section) |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | modify | Include new addon fields in the step update handler |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` (loader / action) | modify | Loader: select new fields from Prisma. Action: pass new fields to `db.bundleStep.update()`. |
| `app/assets/bundle-widget-full-page.js` | modify | Add-on step tab rendering: use `addonLabel || step.name`; show custom icon when `addonIconUrl`; add `isAddonStepLocked(step, stepsState)` helper; lock tab UI (dim + lock icon); FREE badge on product price when `isFreeGift && addonDisplayFree` |
| `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts` | modify | Include new `BundleStep` fields in the metafield JSON payload so widget picks them up from metafield cache |
| `app/routes/api/api.bundle.$id[.json]/route.ts` (or equivalent) | modify | Include `addonLabel`, `addonTitle`, `addonIconUrl`, `addonDisplayFree`, `addonUnlockAfterCompletion` in steps array response |
| `tests/unit/services/addon-step-lock.test.ts` | create | Unit tests for `isAddonStepLocked(step, stepsState)` helper — pure function, isolated |

---

## UI Design — Step Options Card

### Mode selector (Polaris `ChoiceList`, single-select)

```tsx
<ChoiceList
  title="Step type"
  choices={[
    { label: 'Regular Step', value: 'regular' },
    { label: 'Add-On / Upsell Step', value: 'addon' },
  ]}
  selected={[stepMode]}
  onChange={([val]) => {
    setStepMode(val as StepMode);
    if (val === 'regular') {
      // Clear addon fields on mode switch
      stepsState.updateStepField(step.id, 'isFreeGift', false);
      stepsState.updateStepField(step.id, 'addonLabel', null);
      stepsState.updateStepField(step.id, 'addonTitle', null);
      stepsState.updateStepField(step.id, 'addonIconUrl', null);
    } else {
      stepsState.updateStepField(step.id, 'isFreeGift', true);
    }
  }}
/>
```

### Addon fields (shown only when `stepMode === 'addon'`)

```
Step Label (tab name)   [text input, max 40, placeholder "Add-Ons"]
Step Title (heading)    [text input, placeholder "Pick a free gift!"]
Step Icon               [FilePicker — same component as timelineIconUrl]
[✓] Display products as free ($0.00)
[✓] Unlock after bundle completion
```

### Mandatory Default Product (unchanged, always visible)

```
[ ] Pre-select a specific variant
    Default variant GID: [___________]
```

---

## Widget JS Changes

### New helper — `isAddonStepLocked(step, stepsState)`

Pure function. Returns `true` if:
- `step.addonUnlockAfterCompletion === true`, AND
- Any prior step (index < current step index) has not met its `minQuantity`

```javascript
function isAddonStepLocked(step, stepIndex, stepsState) {
  if (!step.addonUnlockAfterCompletion) return false;
  for (let i = 0; i < stepIndex; i++) {
    const priorStep = stepsState[i];
    const selected = countSelectedInStep(priorStep);
    if (selected < (priorStep.minQuantity || 1)) return true;
  }
  return false;
}
```

### Tab rendering changes (for add-on steps)

```javascript
// Tab label
const tabLabel = step.isFreeGift && step.addonLabel ? step.addonLabel : step.name;

// Tab icon
const tabIcon = step.isFreeGift && step.addonIconUrl
  ? step.addonIconUrl
  : step.timelineIconUrl || defaultStepIcon;

// Lock state
const locked = step.isFreeGift && isAddonStepLocked(step, stepIndex, allStepsState);
// locked → add CSS class `wb-step-tab--locked` (dim + lock icon overlay)

// FREE badge on product cards
const showFreeBadge = step.isFreeGift && step.addonDisplayFree;
// showFreeBadge → render price as "FREE" instead of formatted price
```

### Re-check lock state

Lock state is re-evaluated every time `stepsState` changes (quantity selection). This uses the existing reactive state update path — no new polling required.

---

## Backward Compatibility (Read Path Only)

On load, if `step.isFreeGift === true && !step.addonLabel && step.freeGiftName`:
- Pre-fill the Step Label field with `step.freeGiftName` as the displayed value
- Do NOT write this to DB until the merchant saves — then it writes to `addonLabel`

This is handled in the UI component's initial state derivation (no DB read changes):
```tsx
const initialAddonLabel = step.addonLabel ?? (step.isFreeGift && step.freeGiftName ? step.freeGiftName : '');
```

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/addon-step-lock.test.ts` | unit | not addon step → false; addonUnlockAfterCompletion=false → false; prior steps all satisfied → false; prior step under minQty → true; first step is addon → false |

**Mock:** None — `isAddonStepLocked` is a pure function
**Do not mock:** Step quantity logic, minQuantity comparison
**No tests needed:** Polaris ChoiceList rendering, FilePicker upload, widget CSS lock animation, Prisma migration

## Post-Implementation Checklist

- [ ] `npm run build:widgets` after widget JS changes
- [ ] `npm run minify:assets css` if any widget CSS added (lock state styles)
- [ ] Increment `WIDGET_VERSION` (MINOR bump — new storefront feature)
- [ ] Run `npm run deploy:sit` (manual — per Shopify Deploy Rule)
- [ ] Verify lock state in storefront: select products in step 1, confirm add-on tab unlocks
- [ ] Verify FREE badge appears on products in add-on step
- [ ] Verify `isFreeGift = true` still written to DB (cart transform parity)
