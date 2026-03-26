# Architecture Decision Record: DCP Mobile Preview Toggle

## Context

The DCP preview panel (`PreviewPanel.tsx`) renders the bundle widget at a fixed 1440×900 desktop viewport, scaled down to fit the panel. Merchants need to see the 375px mobile view without leaving the admin modal.

## Constraints

- Must not add extra iframes (memory) — the FPB `DualAppPreviewIframe` already manages two iframes
- Must not reload iframes on viewport toggle
- The FPB footer layout toggle must continue working independently
- `DESKTOP_WIDTH`/`DESKTOP_HEIGHT` constants in `StorefrontIframePreview` must stay as defaults for code that doesn't pass `viewportWidth`

## Options Considered

### Option A: `viewportWidth` prop threaded through `AppPreviewIframe` and `DualAppPreviewIframe` ✅ Recommended
- Add `viewportWidth: number` prop to both iframe components (default `DESKTOP_WIDTH`)
- Scale factor becomes `containerWidth / viewportWidth`; iframe CSS `width` becomes `${viewportWidth}px`
- `PreviewPanel` owns `viewportMode: "desktop" | "mobile"` state and derives `viewportWidth` from it
- Toggle buttons in `PreviewPanel` use existing `TOGGLE_BTN_BASE`/`TOGGLE_BTN_ACTIVE` styles
- **Pros:** Minimal surface area; architecturally clean; zero extra iframes; genuine 375px viewport (media queries work)
- **Verdict:** ✅ Recommended

### Option B: CSS `transform: scale` on the container to visually shrink the preview
- Scale the outer wrapper div to ~26% of its size (375/1440)
- **Pros:** Zero changes to `StorefrontIframePreview`
- **Cons:** The iframe's real viewport width stays 1440px — CSS media queries in the widget fire at desktop breakpoints; this produces a fake-shrunken appearance, not a real mobile viewport
- **Verdict:** ❌ Rejected (functionally incorrect)

### Option C: Load a separate mobile-URL iframe (different query param)
- Pass `?viewport=mobile` in the preview URL; the preview page renders at 375px width server-side
- **Pros:** The iframe's HTML could be mobile-optimised
- **Cons:** Extra network request on toggle; requires changes to the preview server route; breaks the no-reload requirement
- **Verdict:** ❌ Rejected (over-engineered; breaks no-reload constraint)

## Decision: Option A

Thread `viewportWidth` as a prop. The scale computation `scale = containerWidth / viewportWidth` naturally handles both values. The `DualAppPreviewIframe` passes `viewportWidth` to both iframe style objects — the two iframes can have different sizes on toggle since they share the same container.

## Data Model

No schema changes. New prop only:

```typescript
// StorefrontIframePreview.tsx
interface AppPreviewIframeProps {
  url: string;
  viewportWidth?: number; // defaults to DESKTOP_WIDTH (1440)
}

interface DualAppPreviewIframeProps {
  urlA: string; urlB: string; activeKey: "a" | "b";
  refA: React.RefObject<HTMLIFrameElement>; refB: React.RefObject<HTMLIFrameElement>;
  viewportWidth?: number; // defaults to DESKTOP_WIDTH (1440)
}
```

```typescript
// PreviewPanel.tsx — new state
type ViewportMode = "desktop" | "mobile";
const MOBILE_WIDTH = 375;
const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
const viewportWidth = viewportMode === "mobile" ? MOBILE_WIDTH : DESKTOP_WIDTH;
```

## Files to Modify

| File | Change |
|------|--------|
| `app/components/design-control-panel/preview/StorefrontIframePreview.tsx` | Add `viewportWidth?: number` to `AppPreviewIframeProps` and `DualAppPreviewIframeProps`; use it for iframe width and scale |
| `app/components/design-control-panel/preview/PreviewPanel.tsx` | Add `viewportMode` state + `MOBILE_WIDTH` constant; derive `viewportWidth`; add viewport toggle buttons (using existing `TOGGLE_BTN_*` styles); pass `viewportWidth` to both iframe components |

## Key Implementation Detail — `DualAppPreviewIframe`

`DualAppPreviewIframe` currently hardcodes `DESKTOP_WIDTH` in both the `ResizeObserver` scale computation and the iframe `width` style. These two places must use `viewportWidth` instead:

```typescript
// Scale
setScale(width / viewportWidth);  // was: width / DESKTOP_WIDTH

// iframe style
width: `${viewportWidth}px`,       // was: DESKTOP_WIDTH
height: `${DESKTOP_HEIGHT}px`,

// container height
Math.round(DESKTOP_HEIGHT * scale) // unchanged
```

## Testing Strategy

### TDD Exceptions (no tests required)
- All changes are UI/React component changes (Polaris rendering + CSS scaling)
- CSS changes
- `viewportWidth` prop is a trivial passthrough — no branching logic to unit test

No new test files needed.
