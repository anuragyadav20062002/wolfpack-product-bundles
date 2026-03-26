# Issue: DCP Controls UI Polish

**Issue ID:** dcp-controls-ui-polish-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 15:30

## Overview

Polish the DCP preview panel controls and settings panel reset button:

1. Reset to defaults button — currently a plain text link, needs red bg + white text
2. Viewport toggle — replace "Desktop"/"Mobile" text with monitor/mobile SVG icons, remove "VIEWPORT" label
3. Footer layout toggle — move to same row as viewport toggle (right side), remove "FOOTER LAYOUT" label → "Layout"

## Phases Checklist
- [x] Phase 1: Fix Reset to defaults button styling (red bg, white text)
- [x] Phase 2: Replace viewport text buttons with icon-only SVG buttons
- [x] Phase 3: Combine viewport + layout toggles into one control bar row

## Progress Log

### 2026-03-26 15:30 - Completed all phases
- ✅ Phase 1: Replaced Polaris `Button variant="plain" tone="critical"` with a custom `<button>` styled with `background: #c0392b`, white text, 6px padding, 6px border-radius. Darkens to `#a93226` on hover. Removed unused `Button` and `InlineStack` Polaris imports from `SettingsPanel.tsx`.
- ✅ Phase 2: Replaced text viewport buttons with 32×32px icon-only buttons. Desktop uses monitor SVG (`rect + path M8 21h8 + path M12 17v4`). Mobile uses phone SVG (`rect + line`). Added `title` tooltip for accessibility. Removed "VIEWPORT:" label entirely. Added `ICON_BTN_BASE` / `ICON_BTN_ACTIVE` style constants.
- ✅ Phase 3: Combined both toggles into a single control bar row (`justify-content: space-between`). Viewport icon buttons on the left; layout toggle on the right (FPB only). Renamed "Footer layout" → "Layout" (uppercase, 10px label). Shortened "Floating Footer" → "Floating" to fit.

### 2026-03-26 15:00 - Starting implementation
- Files to change: SettingsPanel.tsx, PreviewPanel.tsx
