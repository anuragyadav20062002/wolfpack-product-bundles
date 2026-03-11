# Architecture Decision Record: DCP Phase 1 Additions

## Decision: Extend existing CSS variable pipeline — no new architecture needed

New settings follow the identical pattern as the 96 existing fields:
1. Add typed field to `DesignSettings` interface in `types.ts`
2. Add nullable field with `@default` to `DesignSettings` in `prisma/schema.prisma`
3. Add code default in `defaultSettings.ts`
4. Emit CSS variable in `css-variables-generator.ts`
5. Replace hardcoded fallback in widget CSS with `var(--bundle-*)` (no rebuild for CSS-only changes)
6. For loading overlay (inline JS style): change JS to emit `var(--bundle-*)` and rebuild widget
7. Create new settings panel component; wire into NavigationSidebar + SettingsPanel switch

## New CSS Variables (naming follows --bundle-{category}-{property})

| CSS Variable | Maps to DesignSettings field |
|---|---|
| --bundle-search-input-bg | searchInputBgColor |
| --bundle-search-input-border | searchInputBorderColor |
| --bundle-search-input-focus-border | searchInputFocusBorderColor |
| --bundle-search-input-text | searchInputTextColor |
| --bundle-search-input-placeholder | searchInputPlaceholderColor |
| --bundle-search-clear-bg | searchClearButtonBgColor |
| --bundle-search-clear-color | searchClearButtonColor |
| --bundle-skeleton-base-bg | skeletonBaseBgColor |
| --bundle-skeleton-shimmer | skeletonShimmerColor |
| --bundle-skeleton-highlight | skeletonHighlightColor |
| --bundle-card-transition-duration | productCardTransitionDuration (as Nms) |
| --bundle-card-hover-translate-y | productCardHoverTranslateY (as -Npx) |
| --bundle-tile-badge-bg | tileQuantityBadgeBgColor |
| --bundle-tile-badge-text | tileQuantityBadgeTextColor |
| --bundle-modal-close-color | modalCloseButtonColor |
| --bundle-modal-close-bg | modalCloseButtonBgColor |
| --bundle-modal-close-hover | modalCloseButtonHoverColor |
| --bundle-loading-overlay-bg | loadingOverlayBgColor |
| --bundle-loading-overlay-text | loadingOverlayTextColor |
| --bundle-button-text-transform | buttonTextTransform |
| --bundle-button-letter-spacing | buttonLetterSpacing (as Nem) |
| --bundle-progress-bar-height | progressBarHeight (as Npx) |
| --bundle-progress-bar-radius | progressBarBorderRadius (as Npx) |
| --bundle-focus-outline-color | focusOutlineColor |
| --bundle-focus-outline-width | focusOutlineWidth (as Npx) |

## Files to Modify

| File | Change |
|------|--------|
| `app/components/design-control-panel/types.ts` | Add 25 new fields |
| `app/components/design-control-panel/config/defaultSettings.ts` | Add defaults for all new fields |
| `prisma/schema.prisma` | Add 25 nullable fields with @default |
| `app/lib/css-generators/css-variables-generator.ts` | Emit 25 new CSS vars |
| `app/components/design-control-panel/NavigationSidebar.tsx` | Add new nav items |
| `app/components/design-control-panel/settings/SettingsPanel.tsx` | Add routing cases |
| `app/components/design-control-panel/settings/SearchInputSettings.tsx` | New panel |
| `app/components/design-control-panel/settings/SkeletonSettings.tsx` | New panel |
| `app/components/design-control-panel/settings/QuantityBadgeSettings.tsx` | New panel |
| `app/components/design-control-panel/settings/LoadingStateSettings.tsx` | New panel |
| `app/components/design-control-panel/settings/TypographySettings.tsx` | New panel |
| `app/components/design-control-panel/settings/AccessibilitySettings.tsx` | New panel |
| `app/components/design-control-panel/settings/ProductCardSettings.tsx` | Extend with hover/transition |
| `app/components/design-control-panel/settings/FooterDiscountProgressSettings.tsx` | Extend with progress bar shape |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Replace hardcoded values |
| `extensions/bundle-builder/assets/bundle-widget.css` | Replace hardcoded values |
| `app/assets/bundle-widget-full-page.js` | Loading overlay inline style → CSS var |
| `app/assets/bundle-widget-product-page.js` | Loading overlay inline style → CSS var (if applicable) |
| `scripts/build-widget-bundles.js` | Bump WIDGET_VERSION |

## Migration / Backward Compatibility
- Prisma: all new fields are `String? @default("...")` or `Int? @default(N)` — existing rows keep NULL, app code uses `?? default` pattern identical to current code
- No `prisma migrate` needed in production — fields are additive with defaults
- Widget CSS fallback values set to the exact hardcoded values currently used, so existing merchants see zero change until they edit a setting

## Testing Strategy
- No unit tests required: pure CSS variable generation (no branching logic) and CSS/style-only changes
- Manual test: load DCP, change each new setting, verify preview updates and widget reflects change
- Regression: existing DCP settings must still work after types/defaults/schema changes
