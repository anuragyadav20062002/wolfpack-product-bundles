# Architecture Decision Record: Toast DCP Customization

## Context
Eight hardcoded CSS properties in `.bundle-toast` need to become merchant-configurable via the DCP. The implementation touches five system layers: DB schema, TypeScript types, CSS generation, storefront widget (CSS + JS), and DCP UI.

## Constraints
- Must not break existing `DesignSettings` rows (no data migration)
- Existing `toastBgColor`/`toastTextColor` in `generalSettings` JSON blob must remain unchanged
- Widget CSS changes require rebuild (`npm run build:widgets`) and deploy
- `api.design-settings.$shopDomain.tsx` has its own inline default values — must be kept in sync

## Options Considered

### Option A: Direct Prisma columns (Recommended)
Add 8 new nullable columns to the `DesignSettings` model. Save them in `buildSettingsData`. Merge them in `mergeSettings`. Generate CSS variables from them.
- **Pros:** Consistent with the newer column-per-setting pattern; queryable; type-safe; clean fallback via `?? default`.
- **Cons:** 8 more columns (schema is already large, but manageable).
- **Verdict: ✅ Recommended**

### Option B: Extend `generalSettings` JSON blob
Add 8 fields to `extractGeneralSettings` (handlers.server.ts). No schema change needed.
- **Pros:** No schema change.
- **Cons:** Worsens the existing blob tech-debt; existing toast fields already in the blob would mix with new ones; `mergeSettings` spreads blobs last which can silently override direct columns; harder to add TypeScript type safety.
- **Verdict: ❌ Rejected**

## Decision: Option A

## Data Model Changes

### Prisma Schema — `DesignSettings` model (prisma/schema.prisma)
```prisma
// Toast Notifications (extended)
toastBorderRadius     Int?    @default(8)
toastBorderColor      String? @default("#FFFFFF")
toastBorderWidth      Int?    @default(0)
toastFontSize         Int?    @default(13)
toastFontWeight       Int?    @default(500)
toastAnimationDuration Int?   @default(300)
toastBoxShadow        String? @default("0 4px 12px rgba(0, 0, 0, 0.15)")
toastEnterFromBottom  Boolean @default(false)
```

### TypeScript — `DesignSettings` interface (app/types/state.types.ts)
Add to the `GeneralSettings` sub-interface (or wherever `toastBgColor` currently sits):
```typescript
toastBorderRadius: number;
toastBorderColor: string;
toastBorderWidth: number;
toastFontSize: number;
toastFontWeight: number;
toastAnimationDuration: number;
toastBoxShadow: string;
toastEnterFromBottom: boolean;
```

### Default Settings (both PRODUCT_PAGE_DEFAULTS and FULL_PAGE_DEFAULTS)
```typescript
toastBorderRadius: 8,
toastBorderColor: "#FFFFFF",
toastBorderWidth: 0,
toastFontSize: 13,
toastFontWeight: 500,
toastAnimationDuration: 300,
toastBoxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
toastEnterFromBottom: false,
```

### CSS Variable Generator additions (css-variables-generator.ts, after line 176)
```css
--bundle-toast-border-radius: ${s.toastBorderRadius ?? 8}px;
--bundle-toast-border-color: ${s.toastBorderColor ?? '#FFFFFF'};
--bundle-toast-border-width: ${s.toastBorderWidth ?? 0}px;
--bundle-toast-font-size: ${s.toastFontSize ?? 13}px;
--bundle-toast-font-weight: ${s.toastFontWeight ?? 500};
--bundle-toast-animation-duration: ${s.toastAnimationDuration ?? 300}ms;
--bundle-toast-box-shadow: ${s.toastBoxShadow ?? '0 4px 12px rgba(0, 0, 0, 0.15)'};
--bundle-toast-enter-from-bottom: ${s.toastEnterFromBottom ? '1' : '0'};
```

## Widget CSS Changes (both bundle-widget.css and bundle-widget-full-page.css)

Replace hardcoded `.bundle-toast` properties with CSS variables:

```css
.bundle-toast {
  /* ... positioning unchanged ... */
  background-color: var(--bundle-toast-bg, #000000);
  color: var(--bundle-toast-text, #FFFFFF);
  border-radius: var(--bundle-toast-border-radius, 8px);           /* NEW */
  border: var(--bundle-toast-border-width, 0px) solid var(--bundle-toast-border-color, #FFFFFF);  /* NEW */
  box-shadow: var(--bundle-toast-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));  /* NEW */
  font-size: var(--bundle-toast-font-size, 13px);                  /* NEW */
  font-weight: var(--bundle-toast-font-weight, 500);               /* NEW */
  animation: slideDown var(--bundle-toast-animation-duration, 300ms) ease-out;  /* NEW duration */
}

.bundle-toast.hiding {
  animation: slideUp var(--bundle-toast-animation-duration, 300ms) ease-in forwards;  /* NEW duration */
}

/* NEW: Bottom-entry positioning and animations */
.bundle-toast.bundle-toast-from-bottom {
  top: auto;
  bottom: 16px;
  animation: slideFromBottom var(--bundle-toast-animation-duration, 300ms) ease-out;
}

.bundle-toast.bundle-toast-from-bottom.hiding {
  animation: slideToBottom var(--bundle-toast-animation-duration, 300ms) ease-in forwards;
}

@keyframes slideFromBottom {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes slideToBottom {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to   { opacity: 0; transform: translateX(-50%) translateY(20px); }
}
```

## Widget JS Changes (toast-manager.js)

In `ToastManager.show()` and `ToastManager.showWithUndo()`, after creating the toast element and before `document.body.appendChild(toast)`:

```javascript
// Read enter-from-bottom CSS variable
const enterFromBottom = getComputedStyle(document.documentElement)
  .getPropertyValue('--bundle-toast-enter-from-bottom')
  .trim() === '1';
if (enterFromBottom) {
  toast.classList.add('bundle-toast-from-bottom');
}
```

This keeps the JS change minimal — one read from the CSS variable system, no new function parameters.

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | 8 new columns in `DesignSettings` |
| `app/types/state.types.ts` | 8 new fields in toast section of `DesignSettings` |
| `app/components/design-control-panel/config/defaultSettings.ts` | Add 8 fields to both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS` |
| `app/components/design-control-panel/config/mergeSettings.ts` | Add 8 fields to merge logic (direct column reads) |
| `app/routes/app/app.design-control-panel/handlers.server.ts` | Add 8 fields to `buildSettingsData` |
| `app/lib/css-generators/css-variables-generator.ts` | Add 8 new `--bundle-toast-*` variables after line 176 |
| `app/routes/api/api.design-settings.$shopDomain.tsx` | Add 8 new fields to inline defaults object |
| `extensions/bundle-builder/assets/bundle-widget.css` | Replace hardcoded toast values, add from-bottom classes |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Same as above |
| `app/assets/widgets/shared/toast-manager.js` | Read CSS var, add `.bundle-toast-from-bottom` class |
| `app/components/design-control-panel/settings/ToastsSettings.tsx` | Add 8 new controls |
| `app/components/design-control-panel/preview/GeneralPreview.tsx` | Update toast preview with new props + from-bottom class |
| `scripts/build-widget-bundles.js` | Increment WIDGET_VERSION to 2.0.0 |

## Migration / Backward Compatibility
- All 8 new Prisma columns: nullable `Int?`/`String?` with defaults, or `Boolean @default(false)`.
- `prisma migrate dev` will add columns with defaults — no data transform needed.
- Existing rows get null/false for new columns → CSS generator falls back to hardcoded defaults → zero visual change for existing merchants.

## Testing Strategy

### TDD Exceptions (all changes in this feature)
- CSS changes → no tests required
- Polaris UI component changes (ToastsSettings.tsx) → not tested
- Widget storefront JS (toast-manager.js) → no unit tests (widget JS is outside Jest scope)
- Prisma schema additions → no tests (additive-only migration)
- defaultSettings.ts → data-only change, no tests

### No new test files required
All changes are CSS/UI/data-only. Existing tests for `css-variables-generator`, `mergeSettings`, and `handlers.server.ts` do not cover the toast section and will not break.

### Manual verification steps
1. Open DCP → Product Bundles modal → General → Toasts
2. Adjust border-radius slider → preview updates
3. Set border width 2 + border color white → preview shows white border
4. Toggle "Enter from Bottom" → preview toast moves to bottom
5. Set animation duration 800ms → save → visit storefront → trigger toast → verify slow animation
6. Verify `window.__BUNDLE_WIDGET_VERSION__` is `"2.0.0"` in browser console
