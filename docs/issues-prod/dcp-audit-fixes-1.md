# Issue: DCP Audit — Navigation Labels, UX, and Config Fixes

**Issue ID:** dcp-audit-fixes-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 16:29

## Overview

Comprehensive DCP audit (FPB + PDP) surfaced 16 items. This issue tracks the targeted
fixes: nav label bugs, config copy-paste errors, styling issues, and section-aware preview gaps.

## Phases Checklist

- [x] Phase 1: Label + config fixes (B4, B1, B2, B3)
- [x] Phase 2: UI polish (U2 reset button, U8 section-aware preview extension)
- [x] Phase 3: FPB nav reordering (U1)
- [x] Phase 4: PDP BACK/NEXT casing (B6)

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
