# SDE Implementation Plan: "Add to Bundle" Button Selected-State Color

## Overview

10 files to modify, 1 file to create, 1 migration to add. All changes are CSS-variable driven — no widget JS changes.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/css-variables-generator.test.ts` | `--bundle-button-added-bg` and `--bundle-button-added-text` emit correctly | Pending |

## Phase 1: Types, Defaults, CSS Generator + Tests

### Tests (Red first):
- `tests/unit/lib/css-variables-generator.test.ts` — assert the two new CSS vars are emitted

### Implementation (Green):
1. `app/components/design-control-panel/types.ts` — add 2 fields
2. `app/components/design-control-panel/config/defaultSettings.ts` — add defaults
3. `app/lib/css-generators/css-variables-generator.ts` — emit 2 new CSS vars

## Phase 2: CSS Files

1. `extensions/bundle-builder/assets/bundle-widget.css` — replace hardcoded `#10B981`
2. `extensions/bundle-builder/assets/bundle-widget-full-page.css` — add text colour + gradient fallback

## Phase 3: Prisma

1. `prisma/schema.prisma` — add 2 nullable columns
2. `prisma/migrations/20260312200000_add_button_added_state_colors/migration.sql` — ALTER TABLE

## Phase 4: DCP UI

1. New: `app/components/design-control-panel/settings/AddedButtonStateSettings.tsx`
2. Modify: `app/components/design-control-panel/settings/ButtonSettings.tsx`
3. Modify: `app/components/design-control-panel/settings/SettingsPanel.tsx`
4. Modify: `app/components/design-control-panel/NavigationSidebar.tsx`
5. Modify: `app/components/design-control-panel/preview/ProductCardPreview.tsx`

## Build & Verification Checklist

- [ ] Tests pass: `npm run test:unit`
- [ ] No TypeScript errors
- [ ] ESLint: 0 errors
- [ ] DCP preview shows side-by-side added vs unselected button
- [ ] CSS vars visible in DevTools on storefront
- [ ] Backward compatible (existing green default preserved)
