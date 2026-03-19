# Architecture Decision Record: DCP Federation

## Context
The Design Control Panel currently uses a single React component with one `useDesignControlPanelState` hook instance, one `<Modal variant="max">`, and one `NavigationSidebar` that renders all sections regardless of bundle type. The `selectedBundleType` state in the hook defaults to `product_page` with no UI to switch it. We need to split the UI so each bundle type gets its own dedicated modal entry point, while keeping a shared Custom CSS section on the landing page.

## Constraints
- Must not break existing `DesignSettings` DB rows (no Prisma schema changes)
- Must use the existing `handleSaveSettings` server action unchanged
- Must use `PreviewScope` for pixel-accurate preview rendering
- Must work within App Bridge React modal system
- `useDesignControlPanelState` hook should remain the primary state manager

## Options Considered

### Option A: Two separate hook instances per bundle type (Recommended)
Modify `useDesignControlPanelState` to accept an `initialBundleType` parameter (optional, defaults to `BundleType.PRODUCT_PAGE`). Instantiate the hook twice in `route.tsx` — once fixed to `full_page`, once fixed to `product_page`. Each instance manages its own independent state slice.
- **Pros:** Clean state isolation per bundle type; minimal change to hook API; each modal has its own dirty tracking, discard, and save bar; backward-compatible.
- **Cons:** Two hook instances share the same `appStateService` singleton — mitigated by the fact that only one modal can be open at a time.
- **Verdict: ✅ Recommended**

### Option B: Single hook instance managing both bundle types
Refactor the hook to maintain parallel state for both bundle types internally (`fullPageSettings`, `productPageSettings`), exposing each via separate returned values.
- **Pros:** Single source of truth; easier `markAsSaved` routing.
- **Cons:** Major hook refactor; the hook already has substantial complexity; all callers of `settings: currentSettings` would need updates across many components.
- **Verdict: ❌ Rejected — too invasive**

### Option C: Sub-routes per bundle type
Create separate Remix routes `/app/design-control-panel/full-page` and `/app/design-control-panel/product-page`. Each route renders its own full-screen page.
- **Pros:** Deep-linkable; clean page boundary.
- **Cons:** Full-screen App Bridge modals provide equivalent UX; additional routing overhead; duplicates loader/action boilerplate.
- **Verdict: ❌ Rejected — unnecessary complexity**

## Decision: Option A — Two `useDesignControlPanelState` instances

## Data Model
No changes to Prisma schema or TypeScript types. The `DesignSettings` type and `LoaderSettings` interface remain unchanged.

```typescript
// Hook API change — add optional initialBundleType param
export function useDesignControlPanelState(
  loaderSettings: LoaderSettings,
  initialBundleType: BundleType = BundleType.PRODUCT_PAGE  // ← new param
)
```

## Files to Modify

| File | Change |
|------|--------|
| `app/hooks/useDesignControlPanelState.ts` | Add `initialBundleType` parameter, pass to `useState` initial value |
| `app/routes/app/app.design-control-panel/route.tsx` | Full redesign: two cards, two modals, two hook instances, per-modal save bars |
| `app/components/design-control-panel/NavigationSidebar.tsx` | Add `bundleType` prop, filter Promo Banner + Tier Pills for product_page |
| `app/components/design-control-panel/CustomCssCard.tsx` | Add dual-tab for per-bundle-type CSS; replace collapsible guide with modal button |
| `app/styles/routes/design-control-panel.module.css` | Add `.landingCards`, `.bundleCard` styles for landing page |

## Architecture: Two-Modal Layout

```
route.tsx
├── fullPageState = useDesignControlPanelState(settings, BundleType.FULL_PAGE)
├── productPageState = useDesignControlPanelState(settings, BundleType.PRODUCT_PAGE)
│
├── <Page title="Design Control Panel">
│   ├── <Layout>                         ← Two-column card grid
│   │   ├── <Layout.Section>
│   │   │   └── BundleTypeCard (full_page) → opens dcp-full-page-modal
│   │   └── <Layout.Section>
│   │       └── BundleTypeCard (product_page) → opens dcp-product-page-modal
│   └── <CustomCssCard>                  ← Shared, with tabs + CSS guide modal
│
├── <Modal id="dcp-full-page-modal" variant="max">
│   ├── <NavigationSidebar bundleType="full_page" ... />
│   ├── <PreviewPanel settings={fullPageState.settings} ... />
│   └── <SettingsPanel settings={fullPageState.settings} ... />
│
├── <Modal id="dcp-product-page-modal" variant="max">
│   ├── <NavigationSidebar bundleType="product_page" ... />
│   ├── <PreviewPanel settings={productPageState.settings} ... />
│   └── <SettingsPanel settings={productPageState.settings} ... />
│
├── <Modal id="css-guide-modal">         ← CSS reference guide (App Bridge modal)
│
├── <SaveBar id="dcp-full-page-save-bar" />
└── <SaveBar id="dcp-product-page-save-bar" />
```

## Save Flow

Both modals POST to the same action handler. Since `useActionData` returns the most recent response, a `lastSavedBundleType` ref tracks which bundle type was submitted, so the correct `markAsSaved()` is called on success.

```typescript
const lastSavedBundleType = useRef<BundleType>(BundleType.PRODUCT_PAGE);

// In save handler for full-page:
lastSavedBundleType.current = BundleType.FULL_PAGE;
submit({ bundleType: BundleType.FULL_PAGE, settings: fullPageState.getSettingsForSave() }, ...)

// In actionData useEffect:
if (actionData?.success) {
  if (lastSavedBundleType.current === BundleType.FULL_PAGE) {
    fullPageState.markAsSaved();
  } else {
    productPageState.markAsSaved();
  }
}
```

## NavigationSidebar Filtering

```typescript
interface NavigationSidebarProps {
  bundleType: BundleType;  // ← new prop
  // ... existing props
}

// Inside component — only render these sections for full_page:
const isFullPage = bundleType === BundleType.FULL_PAGE;
// ...
{isFullPage && <NavigationItem label="Promo Banner" ... />}
{isFullPage && <NavigationItem label="Pricing Tier Pills" ... />}
```

## CustomCssCard — Per-Bundle-Type Tabs

```typescript
interface CustomCssCardProps {
  // Existing (single CSS) → Replaced with per-type:
  fullPageCss: string;
  productPageCss: string;
  onFullPageCssChange: (value: string) => void;
  onProductPageCssChange: (value: string) => void;
  onSave: (bundleType: BundleType) => void;  // bundleType = active tab
  // New:
  onOpenCssGuide: () => void;
  // ... isLoading unchanged
}
```

## BundleTypeCard SVG Design

### Landing Page Bundles SVG (full_page — purple `#7132FF` accent)
Depicts: a simplified browser with a left vertical step timeline and a right product grid.
- Outer rectangle: browser chrome outline
- Left column: 3 vertical circles connected by a line (step timeline)
- Right area: 2×2 grid of small rectangles (product cards)

### Product Bundles SVG (product_page — dark neutral accent)
Depicts: a product page background with a floating modal overlay containing tabs and product cards.
- Background: faint page outline with a product image placeholder
- Overlay: a rounded rectangle (modal) with 2 tab shapes at top and a 2-column card grid inside

Both SVGs: 140px height, intrinsic width ~200px, centered in card header.

## CSS Module Additions

New classes needed in `design-control-panel.module.css`:
- `.landingCardsRow` — flex row with gap for the two bundle cards
- `.bundleCardInner` — flex column layout inside each Polaris Card
- `.bundleCardSvgWrapper` — centered SVG container, 160px height
- `.bundleCardDescription` — muted text below title

These supplement (not replace) existing modal layout classes.

## Migration / Backward Compatibility Strategy
- No DB migration required
- Loader continues to load both bundle types
- Existing `handleSaveSettings` action is unchanged
- `appStateService` global singleton: only one modal is open at a time, so the last `setDesignSettings` call wins — acceptable since both modals write their own state independently

## Testing Strategy

### TDD Exceptions (no tests required per CLAUDE.md)
All changes in this feature are UI-only (React components, CSS, Polaris layout) plus a trivial hook parameter addition. Per CLAUDE.md testing rules:
- CSS/style-only changes → no tests
- Polaris UI component rendering → not tested (too coupled to Remix/React)
- One-line config changes → no tests
- The `initialBundleType` hook param is a simple `useState` initial value change — a pure UI rendering concern

### Test Files to Create
None — this change touches only UI layout, CSS, and a trivial hook default-value change. All existing tests for `useDesignControlPanelState`, `handlers.server.ts`, and CSS generation remain valid and must continue to pass.

### Regression Checks
- Run `npm test` to verify no existing tests break
- TypeScript compile check via `npx tsc --noEmit`
- ESLint on modified files before commit
