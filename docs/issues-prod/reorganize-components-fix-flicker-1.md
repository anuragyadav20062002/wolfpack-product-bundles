# Issue: Reorganize Footer Components & Fix Flicker

**Issue ID:** reorganize-components-fix-flicker-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-01-25
**Last Updated:** 2026-01-25 10:30

## Overview
Three related fixes for the full-page bundle footer:
1. Move selected products strip below the discount message
2. Move total/price component between BACK and NEXT buttons
3. Sync footer buttons with DCP settings (CSS variables mismatch)
4. Fix save bar flicker when changing button border radius

## Progress Log

### 2026-01-25 10:00 - Starting Implementation
- Analyzed codebase structure:
  - Footer rendering: `app/assets/bundle-widget-full-page.js:1298-1467`
  - Footer CSS: `extensions/bundle-builder/assets/bundle-widget-full-page.css:1200-1400`
  - DCP Settings: `app/components/design-control-panel/settings/FooterButtonSettings.tsx`
  - CSS Variables API: `app/routes/api.design-settings.$shopDomain.tsx:497-504`
- Identified issues:
  - CSS uses `--bundle-full-page-footer-back-bg` but API generates `--bundle-full-page-footer-back-btn-bg`
  - Border radius not synced (CSS hardcoded to 25px)
  - RangeSlider calls `onUpdate` twice causing flicker
- Next steps: Implement all fixes

### 2026-01-25 10:30 - Completed All Fixes
- **Phase 1: Reorganized components**
  - Modified `app/assets/bundle-widget-full-page.js:1379-1467`
  - Structure now: Progress Section -> Products Strip -> Navigation (Back | Total | Next)
  - Products strip is now directly below the discount message
  - Total/price section is now between Back and Next buttons

- **Phase 2: Updated CSS layout**
  - Modified `extensions/bundle-builder/assets/bundle-widget-full-page.css:1201-1440`
  - Products strip centered below discount message
  - Nav section styled as: Back button | Total section | Next button
  - Updated responsive styles for mobile

- **Phase 3: Synced CSS variables with DCP**
  - Modified `app/routes/api.design-settings.$shopDomain.tsx:497-505`
  - Added fallback from DCP settings (`footerBackButtonBgColor`, etc.)
  - Added `--bundle-full-page-footer-back-btn-border` CSS variable
  - Border radius now uses DCP setting with fallback to 8px

- **Phase 4: Fixed save bar flicker**
  - Added `onBatchUpdate` prop to `app/components/design-control-panel/settings/types.ts`
  - Updated `useDesignControlPanelState.ts` to make `updateSettings` update state service
  - Updated `FooterButtonSettings.tsx` to use batch update for border radius
  - Updated `SettingsPanel.tsx` and `app.design-control-panel.tsx` to pass batch update

- **Phase 5: Built widget bundles**
  - Ran `npm run build:widgets`
  - full-page: 162.4 KB
  - product-page: 112.1 KB

## Files Changed
1. `app/assets/bundle-widget-full-page.js` - Reorganized footer component structure
2. `extensions/bundle-builder/assets/bundle-widget-full-page.css` - Updated CSS layout
3. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Built bundle
4. `app/routes/api.design-settings.$shopDomain.tsx` - Synced CSS variables with DCP
5. `app/components/design-control-panel/settings/types.ts` - Added batch update prop
6. `app/components/design-control-panel/settings/SettingsPanel.tsx` - Pass batch update
7. `app/components/design-control-panel/settings/FooterButtonSettings.tsx` - Use batch update
8. `app/hooks/useDesignControlPanelState.ts` - Update state service in batch update
9. `app/routes/app.design-control-panel.tsx` - Wire up batch update

## Related Documentation
- CLAUDE.md (project instructions)
- app/assets/bundle-widget-full-page.js
- extensions/bundle-builder/assets/bundle-widget-full-page.css

## Phases Checklist
- [x] Phase 1: Reorganize components
- [x] Phase 2: Sync CSS variables with DCP
- [x] Phase 3: Fix flicker issue
- [x] Phase 4: Build and test
