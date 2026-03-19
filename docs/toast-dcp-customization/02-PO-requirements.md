# Product Owner Requirements: Toast DCP Customization

## User Stories with Acceptance Criteria

### Story 1: Border Radius Control
**As a** merchant
**I want** to set the roundness of the toast notification
**So that** it matches my store's design style (pill, rounded, or square)

**Acceptance Criteria:**
- [ ] Given I'm in the Toasts settings panel, I see a "Border Radius" range slider with min 0, max 50, step 1, unit "px".
- [ ] Given default value is 8px, when I haven't set a custom value, the toast shows with 8px radius.
- [ ] When I set 25px, the toast preview updates to show noticeably rounder corners.
- [ ] When I set 50px, the toast renders as a pill shape.
- [ ] When I set 0px, the toast renders with sharp corners.

### Story 2: Border Customization
**As a** merchant
**I want** to add a visible border to my toast
**So that** it stands out against light backgrounds or creates a frame effect

**Acceptance Criteria:**
- [ ] Given I'm in Toasts settings, I see "Border Width" (range 0–8, step 1, default 0) and "Border Color" (color picker, default "#FFFFFF") controls.
- [ ] When border width is 0, no border is rendered (border: none behavior).
- [ ] When border width > 0, a border appears with the selected color.
- [ ] When I set border width 2 and color "#FFFFFF", the preview shows a white border on a dark toast.

### Story 3: Typography Controls
**As a** merchant
**I want** to control the font size and weight in the toast
**So that** it matches my store's typography system

**Acceptance Criteria:**
- [ ] Given I'm in Toasts settings, I see "Font Size" (range 10–24, step 1, default 13, unit "px") and "Font Weight" (select: 300/400/500/600/700, default 500).
- [ ] When I change font size to 16, the toast preview text grows.
- [ ] When I change font weight to 700, the toast preview text becomes bold.

### Story 4: Animation Speed
**As a** merchant
**I want** to control how fast the toast slides in and out
**So that** I can match the animation style of my store (snappy vs. smooth)

**Acceptance Criteria:**
- [ ] Given I'm in Toasts settings, I see "Animation Duration" (range 100–800, step 50, default 300, unit "ms").
- [ ] When set to 100ms, the toast slides in very quickly.
- [ ] When set to 800ms, the toast slides in slowly and luxuriously.
- [ ] The animation duration applies to both slide-in (enter) and slide-out (exit/hiding) animations.

### Story 5: Box Shadow Control
**As a** merchant
**I want** to set a custom box-shadow on the toast
**So that** I can control depth and glow effects precisely

**Acceptance Criteria:**
- [ ] Given I'm in Toasts settings, I see a "Box Shadow" text input (single-line, default "0 4px 12px rgba(0, 0, 0, 0.15)").
- [ ] When I enter a valid CSS shadow value (e.g. "0 8px 32px rgba(0,0,0,0.3)"), the toast preview updates.
- [ ] When I clear the field, the default shadow is used.
- [ ] No validation blocking is applied — power users may enter any valid CSS value.

### Story 6: Enter From Bottom
**As a** merchant
**I want** the toast to appear from the bottom of the screen
**So that** it doesn't cover content near the top of the page (e.g. fixed navigation)

**Acceptance Criteria:**
- [ ] Given I'm in Toasts settings, I see an "Enter from Bottom" toggle (default off = top entry).
- [ ] When toggled OFF (default), toast appears at top-center of viewport, sliding down from -20px.
- [ ] When toggled ON, toast appears at bottom-center of viewport, sliding up from +20px.
- [ ] The exit animation reverses appropriately: from top exits up; from bottom exits down.
- [ ] The preview panel shows the correct position (top or bottom) when the toggle changes.
- [ ] This setting works in both widget types (product-page modal and full-page widget).

### Story 7: Live Preview Accuracy
**As a** merchant
**I want** the DCP toast preview to reflect all my customizations in real time
**So that** I can see exactly how the toast will look before saving

**Acceptance Criteria:**
- [ ] The DCP toast preview renders `.bundle-toast` HTML using real widget CSS + CSS variables.
- [ ] All 8 new settings update the preview without a page reload.
- [ ] The preview shows the `bundle-toast-from-bottom` class positioning when `toastEnterFromBottom` is ON.
- [ ] Preview fidelity: the preview toast is pixel-accurate to the live storefront toast.

---

## UI/UX Specifications

### ToastsSettings Panel Layout

```
┌─────────────────────────────────────────────────┐
│ Toasts                                          │
├─────────────────────────────────────────────────┤
│ Colors                                          │
│  Background Color  [████] #000000               │
│  Text Color        [████] #FFFFFF               │
├─────────────────────────────────────────────────┤
│ Shape                                           │
│  Border Radius ──●──────── 8 px  (0–50)        │
│  Border Width  ●──────────── 0 px  (0–8)       │
│  Border Color  [████] #FFFFFF                   │
├─────────────────────────────────────────────────┤
│ Typography                                      │
│  Font Size   ──────●──── 13 px  (10–24)        │
│  Font Weight [500 ▼]                            │
├─────────────────────────────────────────────────┤
│ Animation                                       │
│  Duration  ──────●──── 300 ms  (100–800)       │
│  Enter from Bottom  [toggle: OFF]               │
├─────────────────────────────────────────────────┤
│ Shadow                                          │
│  Box Shadow [0 4px 12px rgba(0, 0, 0, 0.15)   ]│
└─────────────────────────────────────────────────┘
```

### Component Types
- Colors: `InlineColorInput` (existing DCP pattern)
- Border Radius, Border Width, Font Size, Animation Duration: `RangeSlider` with `suffix` showing unit
- Font Weight: `Select` with options 300/400/500/600/700
- Box Shadow: `TextField` (single line, monospaced)
- Enter from Bottom: `Checkbox` or `InlineStack` + `Checkbox`

### GeneralPreview — Toast sub-section
The existing toast preview renders a static `.bundle-toast` div. It must be updated to:
- Use the real `.bundle-toast` CSS class (rendered via `dangerouslySetInnerHTML` inside `PreviewScope`)
- Reflect `toastEnterFromBottom` positioning (add `.bundle-toast-from-bottom` class conditionally)
- Not animate (static display for preview purposes — the animation runs on entry, not in static preview)

---

## Data Persistence

### New fields on `DesignSettings` (direct Prisma columns, nullable with defaults):
| Field | Type | Default |
|-------|------|---------|
| `toastBorderRadius` | `Int?` | `8` |
| `toastBorderColor` | `String?` | `"#FFFFFF"` |
| `toastBorderWidth` | `Int?` | `0` |
| `toastFontSize` | `Int?` | `13` |
| `toastFontWeight` | `Int?` | `500` |
| `toastAnimationDuration` | `Int?` | `300` |
| `toastBoxShadow` | `String?` | `"0 4px 12px rgba(0, 0, 0, 0.15)"` |
| `toastEnterFromBottom` | `Boolean` | `false` |

### Storage path
New fields are saved as direct columns in `buildSettingsData` (handlers.server.ts) — NOT inside `generalSettings` JSON blob (which holds existing `toastBgColor`/`toastTextColor`).

### Backward compatibility
All 8 new columns are nullable (or Boolean with default false). Existing rows with null values fall back to CSS generator defaults, which exactly replicate current hardcoded behavior. No data migration required.

---

## Out of Scope (explicit)
- Auto-dismiss duration (setTimeout in JS remains hardcoded)
- Toast max-width control
- Undo button styling
- Per-message toast config
- Toast horizontal position (always centered)
- Animation easing function (always ease-out for entry, ease-in for exit)
