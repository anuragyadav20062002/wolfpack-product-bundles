# Architecture Decision Record: Admin-Controlled Step Timeline Visibility

## Context

`showStepTimeline` must move from a purely theme-editor-controlled setting to one that can
be overridden from the Admin UI per-bundle. The override must be nullable so existing merchants
are unaffected. The widget must re-resolve the setting on every tier switch.

## Options Considered

### Option A: Nullable DB field + API propagation ✅ Recommended
Add `showStepTimeline Boolean?` to Bundle model (no default = nullable).
Widget resolves: API non-null → data-attribute fallback (same pattern as tierConfig).

### Option B: Non-nullable with @default(true) ❌ Rejected
Breaks existing merchants who set `show_step_timeline = false` in Theme Editor,
because migration gives all bundles `showStepTimeline = true` which API then returns
as explicit value, clobbering the data attribute fallback.

### Option C: Store in separate BundleConfig table ❌ Rejected
Unnecessary indirection. Bundle model already has JSON and boolean fields.

## Decision: Option A

## Data Model Change

```prisma
// In Bundle model — add after tierConfig:
showStepTimeline  Boolean?   // null = defer to theme editor; true/false = admin override
```

No `@default` — Prisma generates nullable column with no default, so existing rows get NULL
automatically. No data migration required.

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `showStepTimeline Boolean?` to Bundle model |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Add `showStepTimeline: bundle.showStepTimeline ?? null` to formattedBundle |
| `app/assets/bundle-widget-full-page.js` | (1) Add `resolveShowStepTimeline()` helper; (2) call it after `selectBundle()` in `init()` and `switchTier()` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `showStepTimeline` useState; append to formData; render checkbox + warning modal |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse `showStepTimeline` from formData; reset to null when tier count < 2 |
| `app/components/PricingTiersSection.tsx` | Add `showStepTimeline` + `onShowStepTimelineChange` props; render checkbox when tiers >= 2; add `onAddTier` callback for warning |
| `scripts/build-widget-bundles.js` | Bump WIDGET_VERSION (PATCH: 1.7.0 → 1.7.1 — no visible feature, only resolution logic) |

## Widget Resolution Logic

```javascript
// New helper (mirrors resolveTierConfig pattern):
resolveShowStepTimeline(apiValue, dataAttrValue) {
  // apiValue = selectedBundle.showStepTimeline (null | true | false)
  // dataAttrValue = this.config.showStepTimeline (boolean from data attribute)
  if (apiValue !== null && apiValue !== undefined) return apiValue;
  return dataAttrValue;  // fall back to theme editor
}

// In init(), after selectBundle():
this.config.showStepTimeline = this.resolveShowStepTimeline(
  this.selectedBundle?.showStepTimeline ?? null,
  this.config.showStepTimeline   // parsed from data-show-step-timeline attr at line 253
);

// In switchTier(), after selectBundle():
this.config.showStepTimeline = this.resolveShowStepTimeline(
  this.selectedBundle?.showStepTimeline ?? null,
  this.config.showStepTimeline  // retains the original data-attribute fallback
);
```

## Server-Side Reset Logic

```typescript
// In handleSaveBundle():
const tierConfigValidated = tierConfigParsed
  ? await validateTierConfig(tierConfigParsed, session.shop, db)
  : null;

// Reset showStepTimeline to null when < 2 tiers (no pills active)
const effectiveTierCount = Array.isArray(tierConfigValidated) ? tierConfigValidated.length : 0;
const showStepTimelineToSave = effectiveTierCount >= 2 ? parsedShowStepTimeline : null;
```

## Warning Modal Logic (React side)

```typescript
// Warning fires when:
// (a) Adding a tier that pushes count to >= 2 AND bundle has > 1 step
// (b) Adding a step AND tierConfig.length >= 2

// In PricingTiersSection — onAddTier callback:
const handleAddTier = () => {
  const newCount = tiers.length + 1;
  if (newCount >= 2 && stepsCount > 1) {
    // Fire warning — show modal
    onStepsTiersConflictWarning();
    return;  // Caller shows modal; modal's "Continue" calls addTierConfirmed()
  }
  addTierConfirmed();
};
```

## Component Props Changes

```typescript
// PricingTiersSection new props:
interface PricingTiersSectionProps {
  tiers: TierConfigEntry[];
  availableBundles: { id: string; name: string }[];
  currentBundleId: string;
  onChange: (tiers: TierConfigEntry[]) => void;
  showStepTimeline: boolean;                        // NEW
  onShowStepTimelineChange: (val: boolean) => void; // NEW
  stepsCount: number;                               // NEW — for warning trigger
  onStepsTiersConflictWarning: (onConfirm: () => void) => void; // NEW
}
```

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/assets/fpb-show-step-timeline.test.ts` | Widget unit | `resolveShowStepTimeline()` — all null/true/false combos; tier switch propagation |
| `tests/unit/routes/fpb-configure-step-timeline.test.ts` | Route unit | Handler parse + null-reset when < 2 tiers |

### Behaviors to Test

**resolveShowStepTimeline():**
1. `(null, true)` → returns `true` (data attr fallback)
2. `(null, false)` → returns `false` (data attr fallback)
3. `(true, false)` → returns `true` (API overrides data attr)
4. `(false, true)` → returns `false` (API overrides data attr)
5. `(undefined, true)` → returns `true` (treats undefined as null)

**Handler showStepTimeline reset:**
6. `tierCount=2, showStepTimeline=false` → saves `false`
7. `tierCount=1, showStepTimeline=false` → saves `null` (reset)
8. `tierCount=0, showStepTimeline=true` → saves `null` (reset)
9. `tierCount=3, showStepTimeline=true` → saves `true`
10. `tierCount=2, showStepTimeline=null` → saves `null`

### Mock Strategy
- Widget: pure function, no mocks needed
- Handler: mock Prisma db.bundle.update(), mock validateTierConfig()

### TDD Exceptions
- CSS/style changes (none here)
- Prisma migration (DDL, not unit-testable)
- Polaris Modal/Checkbox rendering
