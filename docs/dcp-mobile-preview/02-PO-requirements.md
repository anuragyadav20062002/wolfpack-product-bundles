# Product Owner Requirements: DCP Mobile Preview Toggle

## User Stories with Acceptance Criteria

### Story 1: Toggle between desktop and mobile preview
**As a** merchant
**I want** to switch the DCP preview between a desktop (1440px) and mobile (375px) viewport
**So that** I can check my bundle widget looks correct on phones without leaving the admin panel

**Acceptance Criteria:**
- [ ] Given the DCP customization modal is open, then a viewport toggle is visible in the preview panel header area
- [ ] Given the toggle shows "Desktop" and "Mobile" options, when the user clicks "Mobile", then the preview iframe renders as a 375px-wide viewport (CSS media queries in the widget fire as on a real mobile device)
- [ ] Given mobile mode is active, when the user clicks "Desktop", then the preview returns to 1440px-wide viewport
- [ ] Given the toggle switches viewport, then no page reload or data refetch occurs — only the iframe width changes
- [ ] Given settings are changed in the settings panel, then CSS variables are pushed to the iframe via postMessage regardless of the current viewport mode (no regression)

---

### Story 2: Toggle is present for both bundle types
**As a** merchant
**I want** the viewport toggle to be available when customising both Full-Page and Product-Page bundles
**So that** I can check mobile appearance for both bundle types

**Acceptance Criteria:**
- [ ] Given the FPB customization modal is open, then the viewport toggle is visible
- [ ] Given the PDP customization modal is open, then the viewport toggle is visible
- [ ] Given the FPB footer layout toggle (Sidebar / Floating Footer) already exists, then the new viewport toggle appears alongside it (or in a clearly separate position) without visual confusion

---

### Story 3: Active viewport mode is visually indicated
**As a** merchant
**I want** the active viewport to be clearly highlighted in the toggle
**So that** I always know which viewport I'm previewing

**Acceptance Criteria:**
- [ ] Given "Desktop" is active (the default), then the Desktop button appears in an active/pressed state
- [ ] Given "Mobile" is active, then the Mobile button appears in an active/pressed state and the Desktop button appears inactive
- [ ] The active button style must match the existing FPB footer layout toggle's active button style (visual consistency)

---

## UI/UX Specifications

### Toggle Placement
- **Location:** In the preview panel, above or overlaid on the preview iframe — same location/style as the existing FPB footer layout toggle (`<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>`)
- **For FPB:** the viewport toggle and the existing footer layout toggle both appear, stacked vertically (viewport toggle on top, footer layout toggle below) or grouped side by side if space allows
- **For PDP:** only the viewport toggle (no footer layout toggle)

### Toggle UI
- **Buttons:** Two `<button>` elements using the same `TOGGLE_BTN_BASE` / `TOGGLE_BTN_ACTIVE` inline style objects already defined in `PreviewPanel.tsx`
- **Labels:** "🖥 Desktop" and "📱 Mobile" (or plain text "Desktop" / "Mobile" — icons optional)
- **Default:** Desktop (1440px) is the default state on modal open

### Viewport Widths
| Mode | iframe width | Scale divisor |
|------|-------------|---------------|
| Desktop | 1440px | 1440 |
| Mobile | 375px | 375 |

The container height adjusts automatically because `containerHeight = viewportHeight * scale`.

### Reset on Close
- Viewport mode resets to Desktop when the modal is closed and re-opened (state lives in `PreviewPanel`, which unmounts/remounts with the modal)

---

## Data Persistence
- No persistence — viewport mode is purely local component state (`useState`)
- It is NOT saved to the DB or the URL

## Backward Compatibility Requirements
- The existing `DESKTOP_WIDTH`/`DESKTOP_HEIGHT` constants in `StorefrontIframePreview` must remain as the default when no `viewportWidth` prop is passed
- The FPB dual-iframe (`DualAppPreviewIframe`) must pass `viewportWidth` through to both inner `AppPreviewIframe` instances

## Out of Scope (explicit)
- Tablet viewport (768px)
- Responsive breakpoint overlay guides
- Persisting viewport preference per merchant
- Any storefront-side changes
