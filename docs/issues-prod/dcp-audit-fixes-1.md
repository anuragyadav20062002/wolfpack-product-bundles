# Issue: DCP Audit — Navigation Labels, UX, and Config Fixes

**Issue ID:** dcp-audit-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 18:00

## Overview

Comprehensive DCP audit (FPB + PDP) surfaced 16 items. This issue tracks the targeted
fixes: nav label bugs, config copy-paste errors, styling issues, and section-aware preview gaps.

## Phases Checklist

- [x] Phase 1: Label + config fixes (B4, B1, B2, B3)
- [x] Phase 2: UI polish (U2 reset button, U8 section-aware preview extension)
- [x] Phase 3: FPB nav reordering (U1)
- [x] Phase 4: PDP BACK/NEXT casing (B6)
- [x] Phase 5: UX improvements (U3, U4, U5, U6, U7)
- [x] Phase 6: PDP mobile preview blank screen fix

## Progress Log

### 2026-03-26 16:29 - Starting implementation
- Files: NavigationSidebar.tsx, base.config.ts, fpb.config.ts, api.preview.$type.tsx
- Working through fixes in priority order: B4 → B1 → B2 → B3 → U2 → U8 → U1 → B6

### 2026-03-26 16:45 - Completed all phases
- ✅ B4: "Customise" → "Customize" in NavigationSidebar.tsx:46
- ✅ B1: First child of Product Card group renamed "Product Card" → "Card Layout" in base.config.ts
- ✅ B2: Last child "Typography" → "Button Typography" in base.config.ts
- ✅ B3: `headerText` description in fpb.config.ts fixed (was copy-paste from headerTabs)
- ✅ U2: Reset to defaults button changed from solid red #c0392b → ghost/outline neutral style in SettingsPanel.tsx
- ✅ U8: Section-aware preview extended — headerText now hides step tabs (shows tier pills) in api.preview.$type.tsx
- ✅ U1: FPB nav reordered — Bundle Header, Tier Pills, Promo Banner now come before Product Card in fpb.config.ts
- ✅ B6: PDP BACK/NEXT → Back/Next in bundle-widget-product-page.js + preview HTML; widget rebuilt
- Files changed: NavigationSidebar.tsx, base.config.ts, fpb.config.ts, SettingsPanel.tsx, api.preview.$type.tsx, bundle-widget-product-page.js, bundle-widget-product-page-bundled.js

### 2026-03-26 17:30 - Completed Phase 5: UX improvements
- ✅ U6: Product Card sub-sections consolidated — removed productCardTypography + addedButtonState as separate nav items; SettingsPanel.tsx renderSection() now renders them merged into productCard and button cases; base.config.ts trimmed from 7 to 5 children; ProductCardSettings.tsx duplicate font sliders removed; SECTION_KEYS merged
- ✅ U3: Toast box-shadow TextField replaced with Select preset (None/Subtle/Medium/Heavy/Custom) + conditional custom TextField in ToastsSettings.tsx
- ✅ U4: "Copy from Next" plain button added to Back Button heading row in FooterButtonSettings.tsx; copies Next button bg+text colors via onBatchUpdate
- ✅ U5: Global Colors description updated from vague "bundle will adapt" to clarifying note about per-section overrides in GlobalColorsSettings.tsx
- ✅ U7: Search Input 7 pickers now grouped under Input / Text / Clear Button subheadings in SearchInputSettings.tsx
- Files changed: SettingsPanel.tsx, base.config.ts, ProductCardSettings.tsx, ToastsSettings.tsx, FooterButtonSettings.tsx, GlobalColorsSettings.tsx, SearchInputSettings.tsx

### 2026-03-26 18:00 - Completed Phase 6: PDP mobile preview blank screen fix
- ✅ PDP (and FPB) mobile preview was completely blank after toggling to mobile mode
- Root cause: `setScale(0)` reset effect fired AFTER the ResizeObserver had already computed the correct scale, leaving scale permanently at 0 with no subsequent resize event to recover
- Fix: removed the redundant `setScale(0)` useEffect in StorefrontIframePreview.tsx — the ResizeObserver already handles rescaling when the container's maxWidth changes
- Files changed: StorefrontIframePreview.tsx
