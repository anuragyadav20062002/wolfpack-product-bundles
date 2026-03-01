# Product Owner Requirements: Default Lottie Loading Animation

## User Stories with Acceptance Criteria

### Story 1: Default Lottie animation plays when no custom GIF is configured
**As a** merchant
**I want** my bundle to show a polished loading animation by default
**So that** my customers see a professional experience without me needing to upload anything

**Acceptance Criteria:**
- [ ] Given a bundle with `loadingGif` set to `null`, when the loading overlay appears, then a Lottie animation renders inside the overlay (not the CSS spinner)
- [ ] Given a bundle with `loadingGif` set to `null`, when the overlay appears during widget initialization, step transitions, and add-to-cart, then the Lottie animation plays in all three contexts
- [ ] Given the Lottie animation is playing, when the overlay is dismissed, then the animation stops cleanly and the overlay fades out as before
- [ ] Given the widget is on a product page (product-page bundle type), the default Lottie animation plays correctly
- [ ] Given the widget is on a dedicated page (full-page bundle type), the default Lottie animation plays correctly

### Story 2: Merchant's custom GIF takes precedence over default Lottie
**As a** merchant
**I want** my custom loading GIF to override the default animation
**So that** my store's branding is preserved

**Acceptance Criteria:**
- [ ] Given a bundle with `loadingGif` set to a valid URL, when the loading overlay appears, then the merchant's GIF renders as an `<img>` element (existing behavior, unchanged)
- [ ] Given a merchant removes their custom GIF (sets `loadingGif` back to null), when the overlay next appears, then the default Lottie animation plays again
- [ ] Given a merchant has never configured a GIF, no action is required — the default Lottie plays automatically

### Story 3: Animation renders correctly across contexts
**As a** customer
**I want** to see a smooth loading animation
**So that** I know the bundle widget is working

**Acceptance Criteria:**
- [ ] The Lottie animation renders centered in the overlay, no larger than 120x120px
- [ ] The animation loops continuously while the overlay is visible
- [ ] The animation is visually appropriate (loader/spinner style, not too busy)
- [ ] The overlay background remains semi-transparent dark (rgba(0,0,0,0.45))
- [ ] The animation works correctly on mobile viewports

## UI/UX Specifications

### Loading Overlay Behavior (unchanged)
- **Trigger points:** Widget initialization, step transitions, add-to-cart
- **Background:** `rgba(0, 0, 0, 0.45)` with `border-radius: inherit`
- **Z-index:** 50
- **Fade transition:** 200ms ease in/out

### Default Lottie Animation Container
- **Max dimensions:** 120x120px (matching existing `.bundle-loading-overlay__gif`)
- **Container element:** `<div>` with class `bundle-loading-overlay__lottie`
- **Rendering:** SVG renderer (lottie-web light)
- **Playback:** Autoplay, loop, no controls visible

### Priority Logic
```
if (merchant has custom GIF URL) → show <img> with GIF URL  (existing behavior)
else → show default Lottie animation via lottie-web
```

## Data Persistence
- **No database changes required** — the `loadingGif` field remains nullable
- **No metafield changes required** — `loadingGif: null` in metafields means "use default Lottie"
- **The Lottie JSON data is embedded in the widget JS source** — not stored in DB or metafields

## Backward Compatibility Requirements
- All existing bundles with `loadingGif = null` will automatically get the new Lottie animation (improvement, not regression)
- All existing bundles with a custom `loadingGif` URL will continue showing their custom GIF (no change)
- The CSS spinner class/styles can be removed or kept as dead code — no external consumers depend on them

## Out of Scope (explicit)
- No admin UI changes (no new toggle, no "reset to default" button — removing the custom GIF via FilePicker is sufficient)
- No ability for merchants to upload custom Lottie JSON files
- No database migrations
- No new API endpoints
