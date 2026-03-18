# Architecture Decision Record: Free Gift Badge — DCP Asset Picker

## Context
Replace the plain `<TextField>` for `freeGiftBadgeUrl` in the DCP with a `FilePicker` component that browses/uploads Shopify store files. Expose the setting in the navigation sidebar. Add image badge rendering to the full-page widget.

## Constraints
- `freeGiftBadgeUrl` column already exists in `DesignSettings` — no Prisma migration needed
- `--bundle-free-gift-badge-url` CSS variable already emitted by `css-variables-generator.ts`
- Product-page widget already reads the variable and renders `<img>` — no JS change needed there
- Reuse `FilePicker.tsx`, `app.store-files`, and `app.upload-store-file` as-is — no new routes
- Widget JS changes require WIDGET_VERSION bump and `npm run build:widgets`
- CSS files must stay under 100,000 B (current: full-page 95,312 B; product-page 68,306 B)

## Options Considered

### Option A: Reuse existing FilePicker component ✅ Recommended
Move `freeGiftBadgeUrl` field out of the `{isBottomSheet && ...}` block, replace `<TextField>` with `<FilePicker hideCropEditor>`, add sidebar nav entry, add image badge to full-page widget.

**Pros:** Zero new infrastructure; consistent UX with promo banner; FilePicker already handles all edge cases (upload progress, poll-until-ready, error states, thumbnail preview, remove).
**Cons:** None.

### Option B: New standalone file picker route
Build a new `/app/dcp-file-picker` route that bypasses the existing store-files infrastructure.

**Pros:** Could theoretically be customised differently.
**Cons:** Duplicates all work already done; inconsistent UX; rejected.

## Decision: Option A

The existing `FilePicker.tsx` + `app.store-files` + `app.upload-store-file` infrastructure handles the full lifecycle. The implementation is purely UI-side changes (widget style settings component, sidebar nav) plus a small widget JS addition for the full-page bundle.

## Data Model
No changes — `DesignSettings.freeGiftBadgeUrl String? @default("")` already exists and flows through the full save/read/CSS pipeline.

```typescript
// No type changes needed — freeGiftBadgeUrl: string already in WidgetStyleSettingsType
// Save path: onUpdate("freeGiftBadgeUrl", url) → handlers.server.ts extractGeneralSettings → DB
// CSS: --bundle-free-gift-badge-url: url("${s.freeGiftBadgeUrl}") | none (already in css-variables-generator.ts)
```

## Files to Modify

| File | Change |
|------|--------|
| `app/components/design-control-panel/settings/WidgetStyleSettings.tsx` | Replace `<TextField>` with `<FilePicker hideCropEditor>`, move badge section outside `{isBottomSheet && ...}`, add Divider + heading |
| `app/components/design-control-panel/NavigationSidebar.tsx` | Add "Widget Style" nav item to the General section collapsible |
| `app/assets/bundle-widget-full-page.js` | In `isFreeGift` block (line ~1888): read `--bundle-free-gift-badge-url`, if set replace `badge.textContent = 'Free'` with `<img>` inside badge span |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add `.fpb-free-badge img` rule: `width:100%; height:100%; object-fit:contain; display:block` |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Rebuilt output (auto) |
| `scripts/build-widget-bundles.js` | Bump WIDGET_VERSION (MINOR: new storefront feature) |

## Migration / Backward Compatibility Strategy
- Merchants with `freeGiftBadgeUrl = ""` or `null`: CSS variable emits `none`; product-page widget already falls back to SVG ribbon; full-page widget will keep "Free" text (unchanged behaviour).
- Merchants who pasted a URL manually into the old TextField: URL is still valid; FilePicker shows it as a thumbnail on first open.
- No DB migration, no widget sync prompt needed.

## Testing Strategy

### Test Files to Create
| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/assets/bundle-widget-full-page-free-badge.test.ts` | Unit | New `_getFreeGiftBadgeUrl()` helper reads CSS var; badge renders `<img>` when set; badge renders text when not set |

### Behaviors to Test
- Given `--bundle-free-gift-badge-url` is set to a URL, when the free-gift badge is rendered in the full-page widget, then an `<img>` with that URL appears inside `.fpb-free-badge`
- Given `--bundle-free-gift-badge-url` is `none` or empty, when the free-gift badge is rendered, then the "Free" text label appears (no `<img>`)

### Mock Strategy
- **Mock:** `getComputedStyle(document.documentElement)` to return the CSS variable value
- **Do NOT mock:** DOM manipulation logic (test with a real DOM via jsdom)

### TDD Exceptions (no tests required)
- `WidgetStyleSettings.tsx` UI change (Polaris component rendering)
- `NavigationSidebar.tsx` nav item addition
- CSS-only changes in `bundle-widget-full-page.css`
- `WIDGET_VERSION` bump in `build-widget-bundles.js`
