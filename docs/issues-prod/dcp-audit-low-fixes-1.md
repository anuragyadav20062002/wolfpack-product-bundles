# Issue: DCP Audit Low Priority Fixes

**Issue ID:** dcp-audit-low-fixes-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 03:45

## Overview

Low priority fixes identified in the DCP audit (`docs/dcp-audit/DCP_AUDIT_FPB_2026-03-27.md`).

Covers:
1. Global Colors description — add actionable workflow guidance ("Start here")
2. "Reset to defaults" confirmation — two-step confirm to prevent accidental resets
3. Bundle Footer layout note — clarify settings apply to both sidebar + floating layouts
4. "Card Background Color" → "Selected Card Background" rename with description

## Phases Checklist

- [x] Phase 1: Global Colors workflow guidance copy
- [x] Phase 2: Reset to defaults two-step confirmation
- [x] Phase 3: Bundle Footer layout-scope note
- [x] Phase 4: Card Background Color → Selected Card Background rename

## Progress Log

### 2026-03-27 03:45 - Completed all phases

- ✅ Phase 1: `GlobalColorsSettings.tsx` — updated description from "Set brand-wide defaults here. Individual sections can override these values for fine-grained control." → "Start here. Most widget colors inherit from these defaults — only go into individual sections if you need finer control."
- ✅ Phase 2: `SettingsPanel.tsx` — replaced single red "Reset to defaults" button with two-step confirmation UI: first click changes to "Reset this section to defaults?" text + "Yes, reset" + "Cancel" buttons; confirming executes reset and dismisses; Cancel reverts to initial state. Added `useState<boolean>` for `pendingReset`. Button is now outlined red (not filled) for lower visual urgency until confirmation.
- ✅ Phase 3: `FooterSettings.tsx` — added subdued note below "Footer" heading: "These settings apply to both the sidebar panel and the floating footer — switching layouts will reflect the same values."
- ✅ Phase 4: `ProductCardSettings.tsx` — renamed `ColorPicker` label "Background Color" → "Selected Card Background"; wrapped in `BlockStack` with subdued description text: "Applied to product cards when they have been added to the bundle."

### Files changed:
- `app/components/design-control-panel/settings/GlobalColorsSettings.tsx`
- `app/components/design-control-panel/settings/SettingsPanel.tsx`
- `app/components/design-control-panel/settings/FooterSettings.tsx`
- `app/components/design-control-panel/settings/ProductCardSettings.tsx`
