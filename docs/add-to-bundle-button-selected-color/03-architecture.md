# Architecture Decision Record: "Add to Bundle" Button Selected-State Color

## Context

The "Add to Bundle" button has two visual states:
- **Default**: background from `--bundle-button-bg` (DCP-controlled via `buttonBgColor`)
- **Selected/Added**: background hardcoded as `#10B981` in CSS rules

We need to make the selected-state background and text colour DCP-controllable for both widget types.

## Constraints

- Must not change existing visual output for merchants who haven't set the new fields (default = `#10B981` / `#FFFFFF`)
- Widget JS files must NOT be modified (purely CSS-variable driven)
- Must follow `--bundle-*` CSS variable naming
- Must follow existing DCP pattern: type → default → CSS var → settings UI → preview
- Full-page uses a separate CSS file (`bundle-widget-full-page.css`) and a separate rule: `.product-add-btn.added { background: linear-gradient(...) }` — the gradient vars already exist. We add a simpler solid-colour override on top, giving merchants a single control that works for both widget types.

## Options Considered

### Option A: Extend existing ButtonSettings with new colour pickers only
- Add `buttonAddedBgColor` + `buttonAddedTextColor` to types, defaults, CSS generator, and ButtonSettings panel
- No new navigation items — new pickers appended to existing "Button" panel
- **Pros:** Minimal footprint, no navigation changes
- **Cons:** The "Button" panel becomes long; no clear visual separation between default vs added states; preview doesn't distinguish the added state

**Verdict:** ❌ Rejected — poor UX, no preview context for the added state

### Option B: New "Added State" sub-section in navigation, separate preview focus
- Add `buttonAddedBgColor` + `buttonAddedTextColor` fields
- Add "Added State" as a child nav item under "Button" (`sectionKey="addedButtonState"`)
- `SettingsPanel` routes `"addedButtonState"` → new `AddedButtonStateSettings` component
- `ProductCardPreview` handles `"addedButtonState"` subsection with side-by-side card comparison
- **Pros:** Clean UX, preview isolates added state, consistent with how other sub-sections work
- **Cons:** One additional settings component file, one additional nav item

**Verdict:** ✅ Recommended — best UX, fully consistent with existing DCP patterns

### Option C: Extend full-page gradient fields for both widget types
- Re-use `fullPageAddedButtonGradientStart` as the product-page added-state colour too
- Remove gradient from full-page, replace with solid colour
- **Pros:** No new fields
- **Cons:** Breaking change for full-page gradient; field name misleading for product-page; gradient was an intentional design choice for full-page

**Verdict:** ❌ Rejected — breaking, naming is semantically wrong

## Decision: Option B

## Data Model

### New DesignSettings fields (TypeScript)

```typescript
// In app/components/design-control-panel/types.ts
buttonAddedBgColor: string;
buttonAddedTextColor: string;
```

### New Prisma columns

```prisma
// In prisma/schema.prisma, after buttonHoverBgColor
buttonAddedBgColor    String? @default("#10B981")
buttonAddedTextColor  String? @default("#FFFFFF")
```

### New CSS Variables (both widget types share same vars)

```
--bundle-button-added-bg     → from buttonAddedBgColor  (default: #10B981)
--bundle-button-added-text   → from buttonAddedTextColor (default: #FFFFFF)
```

Generated in `generateCSSVariables()` in `css-variables-generator.ts` (applies to both widget types since it's the shared CSS generator).

### CSS Rules to Update

**bundle-widget.css** (product-page):
```css
/* Before */
.modal-body .product-card .product-add-btn.added {
  background: #10B981;
  box-shadow: none;
}

/* After */
.modal-body .product-card .product-add-btn.added {
  background: var(--bundle-button-added-bg, #10B981);
  color: var(--bundle-button-added-text, #FFFFFF);
  box-shadow: none;
}
```

**bundle-widget-full-page.css** (full-page):
```css
/* Before */
.product-add-btn.added {
  background: linear-gradient(135deg, var(--bundle-full-page-added-button-gradient-start, #10B981) 0%, var(--bundle-full-page-added-button-gradient-end, #059669) 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* After — DCP colour overrides gradient when set; gradient is the fallback */
.product-add-btn.added {
  background: var(--bundle-button-added-bg, linear-gradient(135deg, var(--bundle-full-page-added-button-gradient-start, #10B981) 0%, var(--bundle-full-page-added-button-gradient-end, #059669) 100%));
  color: var(--bundle-button-added-text, #FFFFFF);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
```

## Files to Modify

| File | Change |
|------|--------|
| `app/components/design-control-panel/types.ts` | Add `buttonAddedBgColor`, `buttonAddedTextColor` |
| `app/components/design-control-panel/config/defaultSettings.ts` | Add defaults for both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS` |
| `app/lib/css-generators/css-variables-generator.ts` | Add `--bundle-button-added-bg` and `--bundle-button-added-text` in `/* BUTTON */` section |
| `app/components/design-control-panel/settings/ButtonSettings.tsx` | Add Divider + heading + two ColorPickers for added state |
| `app/components/design-control-panel/settings/SettingsPanel.tsx` | Add `case "addedButtonState"` route |
| `app/components/design-control-panel/NavigationSidebar.tsx` | Add "Added State" child nav item under "Button" |
| `app/components/design-control-panel/preview/ProductCardPreview.tsx` | Handle `activeSubSection === "addedButtonState"` |
| `extensions/bundle-builder/assets/bundle-widget.css` | Replace hardcoded `#10B981` with CSS var |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add `color` and update `background` to use CSS var with gradient fallback |
| `prisma/schema.prisma` | Add two nullable columns with defaults |
| `prisma/migrations/20260312200000_add_button_added_state_colors/migration.sql` | `ALTER TABLE` to add both columns |

## New File to Create

| File | Purpose |
|------|---------|
| `app/components/design-control-panel/settings/AddedButtonStateSettings.tsx` | Settings panel component for the added-state sub-section |

## Migration / Backward Compatibility Strategy

- Prisma columns are `String? @default(...)` — existing rows get the DB default on next read
- CSS var fallback `var(--bundle-button-added-bg, #10B981)` ensures widgets without injected CSS still render green
- No data migration or seeding needed

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|---------------|
| `tests/unit/lib/css-variables-generator.test.ts` | Unit | `generateCSSVariables` emits correct `--bundle-button-added-bg` and `--bundle-button-added-text` vars with default and custom values |

### Behaviors to Test

- `generateCSSVariables` with `buttonAddedBgColor = undefined` → emits `--bundle-button-added-bg: #10B981` (default)
- `generateCSSVariables` with `buttonAddedBgColor = "#FF0000"` → emits `--bundle-button-added-bg: #FF0000`
- `generateCSSVariables` with `buttonAddedTextColor = undefined` → emits `--bundle-button-added-text: #FFFFFF`
- `generateCSSVariables` with `buttonAddedTextColor = "#000000"` → emits `--bundle-button-added-text: #000000`

### TDD Exceptions (no tests required)

- CSS file changes (bundle-widget.css, bundle-widget-full-page.css) — visual only
- Polaris UI settings components (ButtonSettings.tsx, AddedButtonStateSettings.tsx)
- NavigationSidebar.tsx — UI-only
- ProductCardPreview.tsx — UI-only
- Prisma schema/migration — DB-only
- defaultSettings.ts / types.ts — data declarations
