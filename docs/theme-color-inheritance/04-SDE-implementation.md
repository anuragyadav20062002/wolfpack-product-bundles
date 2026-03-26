# SDE Implementation Plan: Theme Color Inheritance for Free Plan Bundle Widget

## Overview

Adds automatic Shopify theme color inheritance as a fallback layer for the bundle widget's 6 global color anchors. Free plan merchants (and Grow plan merchants without DCP customization) see their store's brand colors in their bundle widget instead of hardcoded defaults.

---

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/services/theme-colors.test.ts` | `syncThemeColors`: color extraction, per-key fallback, invalid hex, silent error handling | Pending |
| `tests/unit/lib/theme-color-inheritance.test.ts` | `generateCSSFromSettings`: cascade order (DCP → theme → default) | Pending |

---

## Phase 1: Prisma schema + `theme-colors.server.ts` service

### Tests (Red)

`tests/unit/services/theme-colors.test.ts`:
- Given admin returns full Dawn color set → all 6 anchors extracted correctly
- Given some color keys missing → missing anchors fall back to hardcoded defaults, others use theme
- Given a value is not valid hex (e.g. `"rgb(26,86,219)"`) → falls back to hardcoded default
- Given no active theme (empty themes list) → upsert is never called
- Given `settings_data.json` is malformed JSON → upsert is never called
- Given Admin API graphql throws → error swallowed, upsert never called
- Given two bundle types → upsert called twice (once per bundle type)
- `colors_text` populates both `globalPrimaryText` AND `globalFooterText`

### Implementation (Green)

1. Add `themeColors Json?` to `DesignSettings` in `prisma/schema.prisma`
2. Run `npx prisma generate` to regenerate client
3. Create `app/services/theme-colors.server.ts` with `syncThemeColors(admin, shopDomain)`

---

## Phase 2: CSS generator theme color cascade

### Tests (Red)

`tests/unit/lib/theme-color-inheritance.test.ts`:
- Given `settings.globalPrimaryButtonColor` is `"#FF0000"` AND `themeColors.globalPrimaryButton` is `"#1A56DB"` → output CSS contains `--bundle-global-primary-button: #FF0000` (DCP wins)
- Given `settings.globalPrimaryButtonColor` is falsy AND `themeColors.globalPrimaryButton` is `"#1A56DB"` → output CSS contains `--bundle-global-primary-button: #1A56DB` (theme wins)
- Given `settings.globalPrimaryButtonColor` is falsy AND `themeColors` is null → output CSS contains `--bundle-global-primary-button: #000000` (hardcoded default)
- All 6 anchors tested for the same cascade pattern
- Given `themeColors` not passed (existing callers) → behavior unchanged (no regression)

### Implementation (Green)

Modify `app/lib/css-generators/index.ts`:
- Add `ThemeColors` type import
- Add optional `themeColors` param to `generateCSSFromSettings`
- Replace simple `|| 'default'` anchor resolution with three-level fallback

---

## Phase 3: CSS endpoint wiring + sync trigger points

No new tests required (wiring calls covered by existing unit tests on `syncThemeColors`).

1. `app/routes/api/api.design-settings.$shopDomain.tsx` — extract `themeColors` from `designSettings` and pass to `generateCSSFromSettings`
2. `app/shopify.server.ts` — add `syncThemeColors(admin, session.shop)` call in `afterAuth` hook
3. `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — add `syncThemeColors` call at end of `handleSyncBundle`
4. `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — same

---

## Phase 4: Scope + config updates

No new tests.

1. `shopify.app.toml` — add `read_themes` to scopes
2. `shopify.app.wolfpack-product-bundles-sit.toml` — same
3. `.env.example` — update SCOPES comment

---

## Build & Verification Checklist
- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without new errors (`npx tsc --noEmit`)
- [ ] `npx prisma generate` runs cleanly after schema change
- [ ] Backward-compatible with existing `DesignSettings` rows (`themeColors: null` → no behavior change)

## Rollback Notes
- Remove `themeColors Json?` from schema, run `prisma generate`
- Remove `themeColors` param from `generateCSSFromSettings` (no change to callers since it's optional)
- Remove `syncThemeColors` call from `afterAuth` and `handleSyncBundle`
- No data cleanup needed (the JSON field silently becomes irrelevant)
