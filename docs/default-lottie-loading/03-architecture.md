# Architecture Decision Record: Default Lottie Loading Animation

## Context
We need to replace the plain CSS spinner fallback with a Lottie JSON animation when no merchant-uploaded GIF exists. The widget build system is a **custom concatenation script** (not esbuild/rollup) that strips ES module syntax and wraps source files in an IIFE. This constrains how external libraries can be integrated.

## Constraints
- Build system is manual concatenation — no npm dependency resolution
- Current bundle sizes: full-page ~195KB, product-page ~118KB (unminified, served gzipped by Shopify CDN)
- Widget code is vanilla JS with no framework dependencies
- Must not break existing custom GIF functionality
- Must work across all Shopify-supported browsers

## Options Considered

### Option A: Vendor `lottie-web` light build into widget bundles
- Copy `lottie_light.min.js` (~150KB minified) to `app/assets/widgets/vendor/`
- Add it to the build script's concatenation order as a "vendor" block
- Embed the Lottie JSON animation data as a JS constant in a new shared module
- Call `lottie.loadAnimation()` in `showLoadingOverlay()` when no custom GIF
- **Pros:** Self-contained, instant rendering, true Lottie playback, no CDN dependency
- **Cons:** ~150KB added to each bundle (unminified); ~40KB gzipped transfer increase
- **Verdict:** ❌ Rejected — nearly doubles the product-page bundle size. The overhead is disproportionate for a loading spinner that appears briefly. Also adds maintenance burden of vendoring a library.

### Option B: Load `lottie-player` web component from CDN at runtime
- Lazy-load `@lottiefiles/lottie-player` from unpkg/cdnjs when overlay triggers
- Embed Lottie JSON data inline in widget source
- Show CSS spinner immediately, swap to `<lottie-player>` once loaded
- **Pros:** Zero bundle size impact, full Lottie compatibility
- **Cons:** External CDN dependency, CSP issues on some stores, visible flash (spinner→Lottie), requires network request during loading states (ironic for a loading indicator)
- **Verdict:** ❌ Rejected — loading a library to show a loading animation is a circular problem. The flash/swap is poor UX.

### Option C: Embed pre-rendered animated SVG with CSS animations
- Design the animation in Lottie format (stored as source-of-truth JSON file)
- Pre-convert to an inline animated SVG using CSS `@keyframes` (not SMIL for better browser compat)
- Embed the SVG markup directly in the widget's `showLoadingOverlay()` function
- **Pros:** Zero JS overhead, instant rendering, no library needed, beautiful animations possible with CSS keyframes, tiny size (1-3KB of SVG+CSS)
- **Cons:** Cannot play arbitrary Lottie files at runtime — the default animation is "baked" as SVG+CSS
- **Verdict:** ✅ **Recommended** — the default animation is fixed (not user-customizable), so runtime Lottie playback is unnecessary. We get Lottie-quality design with zero overhead.

## Decision: Option C — Embedded Animated SVG with CSS Keyframes

### Rationale
The default loading animation is a **fixed, known animation** — it doesn't need to be dynamically parsed from JSON at runtime. The Lottie JSON file serves as the **design source** (editable in LottieFiles/After Effects), and we pre-convert it to an optimized inline SVG with CSS animations for the widget. This gives us:

1. **Zero additional JS** — no library, no runtime parsing
2. **Instant rendering** — SVG+CSS renders on first paint
3. **Tiny footprint** — ~1-3KB of SVG markup + CSS keyframes
4. **Lottie-quality design** — the animation is designed in Lottie, just delivered as SVG
5. **Works with existing build system** — plain JS string, no bundler changes needed

The Lottie JSON source file is stored in the repo at `app/assets/widgets/shared/default-loading-animation.json` for future reference/editing.

### Priority Logic (unchanged from PO requirements)
```
if (merchant has custom GIF URL) → show <img> with GIF URL  (existing behavior)
else → show embedded default SVG animation
```

## Implementation Details

### New File: `app/assets/widgets/shared/default-loading-animation.js`
A shared module that exports the default animation SVG markup as a function:

```javascript
/**
 * Creates and returns the default loading animation element.
 * Designed in Lottie, pre-converted to inline SVG + CSS keyframes.
 */
function createDefaultLoadingAnimation() {
  const wrapper = document.createElement('div');
  wrapper.className = 'bundle-loading-overlay__default-animation';
  wrapper.innerHTML = `<svg ...>...</svg>`;
  return wrapper;
}
```

### Modified: `showLoadingOverlay()` in both widgets
```javascript
showLoadingOverlay(gifUrl) {
  // ... existing overlay creation code ...

  if (gifUrl) {
    // Existing: show merchant's custom GIF
    const img = document.createElement('img');
    img.className = 'bundle-loading-overlay__gif';
    img.src = gifUrl;
    overlay.appendChild(img);
  } else {
    // NEW: show default Lottie-designed SVG animation
    const animation = createDefaultLoadingAnimation();
    overlay.appendChild(animation);
  }

  // ... existing append + fade-in code ...
}
```

### Modified: Build script
Add `default-loading-animation.js` to the `SHARED_MODULES` array in `scripts/build-widget-bundles.js`.

### New CSS: Default animation styles
Add `.bundle-loading-overlay__default-animation` styles with CSS `@keyframes` to `extensions/bundle-builder/assets/bundle-widget.css`.

### Lottie Source File (reference only, not shipped)
`app/assets/widgets/shared/default-loading-animation.json` — the original Lottie JSON for design iteration. Not included in builds.

## Files to Modify

| File | Change |
|------|--------|
| `app/assets/widgets/shared/default-loading-animation.js` | **NEW** — SVG animation factory function |
| `app/assets/widgets/shared/default-loading-animation.json` | **NEW** — Lottie JSON source file (reference only) |
| `scripts/build-widget-bundles.js` | Add new module to `SHARED_MODULES` array |
| `app/assets/bundle-widget-full-page.js` | Update `showLoadingOverlay()` to use `createDefaultLoadingAnimation()` |
| `app/assets/bundle-widget-product-page.js` | Update `showLoadingOverlay()` to use `createDefaultLoadingAnimation()` |
| `extensions/bundle-builder/assets/bundle-widget.css` | Add CSS keyframes + default animation styles |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add CSS keyframes + default animation styles (if full-page uses separate CSS) |

## Animation Design

The default loading animation should be a **modern pulsing/morphing dots loader** — three circles that scale up and down in sequence. This is:
- Universally recognizable as "loading"
- Visually polished and smooth
- Simple enough to express as SVG + CSS keyframes
- Works on both light and dark overlay backgrounds (white fill)

### SVG Structure
```svg
<svg viewBox="0 0 120 40" width="120" height="40">
  <circle cx="20" cy="20" r="8" fill="white" class="dot dot-1"/>
  <circle cx="60" cy="20" r="8" fill="white" class="dot dot-2"/>
  <circle cx="100" cy="20" r="8" fill="white" class="dot dot-3"/>
</svg>
```

### CSS Keyframes
```css
@keyframes bundle-dot-pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
.bundle-loading-overlay__default-animation .dot {
  animation: bundle-dot-pulse 1.4s ease-in-out infinite;
  transform-origin: center;
}
.dot-1 { animation-delay: -0.32s; }
.dot-2 { animation-delay: -0.16s; }
.dot-3 { animation-delay: 0s; }
```

## Migration / Backward Compatibility Strategy
- **Zero migration needed** — no database or metafield changes
- Bundles with `loadingGif = null` automatically get the new animation
- Bundles with a custom `loadingGif` URL are completely unaffected
- The old CSS spinner code (`.bundle-loading-overlay__spinner`) is removed from both widgets

## Testing Approach
- Manual: Create a bundle with no custom GIF → verify Lottie-designed SVG animation appears
- Manual: Create a bundle with a custom GIF → verify custom GIF still appears
- Manual: Remove custom GIF from existing bundle → verify default animation appears
- Manual: Test on product-page and full-page bundle types
- Manual: Test all three overlay triggers (init, step transition, add-to-cart)
- Visual: Verify animation renders correctly at various viewport widths (mobile, tablet, desktop)
