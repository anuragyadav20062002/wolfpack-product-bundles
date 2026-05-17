# Issue: Step Setup — Messages & Free Gift/Add-Ons EB Parity (FPB + PPB)

**Issue ID:** step-messages-free-gift-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-17
**Last Updated:** 2026-05-17 12:00

## Overview

Bring the "Messages" and "Free Gift & Add Ons" sub-sections of Step Setup into 100% UI/UX parity with EB's design for both FPB and PPB configure pages.

EB reference audited via Chrome DevTools MCP on yash-wolfpack store (Bundle Box = FPB, Test PPB Bundle = PPB).

## EB Design Reference

### Free Gift & Add Ons section (FPB only — PPB sub-nav shows same sections)
1. **Add-Ons and Gifting Step** card: toggle, icon upload/Replace, Multi Language (disabled), Step Name field, Step Title field
2. **Add-Ons with Bundles** card: toggle, How to setup?, Multi Language (disabled), "Add on Section title" text field, Tier cards (Delete), Add Add Ons Tier button
3. **Footer Messaging** card: Show Variables, Multi Language (disabled), per-tier Message when rule not met + Success Message fields

### Messages section
1. **Enable Messages** toggle (header)
2. Description: "Message will show up as a product at checkout"
3. Message preview row: icon + title + Edit button (resource picker for gift message product)
4. "Enable Sender and Recipient Fields" checkbox
5. "Make Gift Message mandatory" checkbox
6. "Enable Message Limit (Characters)" checkbox + number field
7. (Email feature: not implemented in WPB backend — omitted)

## Findings

### FPB current state
- free_gift_addons: ✅ already matches EB (3-card layout)
- messages: ✅ already matches EB (icon row + checkboxes) — no changes needed

### PPB current state
- free_gift_addons: ❌ wrong activeSection ID (`"free_gift_add_ons"` vs `"free_gift_addons"`), wrong content (Polaris-style add-on steps list)
- messages: ❌ completely different content (widget label text fields + separate Gift Messages sub-section with different UI style)

## Progress Log

### 2026-05-17 10:00 - Starting implementation
- EB audit complete via Chrome DevTools MCP
- Plan: fix PPB free_gift_addons (ID + content), fix PPB messages (EB/FPB-style card), move widget labels to Bundle Settings
- Files: app/styles/routes/product-page-bundle-configure.module.css, app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx

### 2026-05-17 12:00 - Completed all phases
- ✅ Added missing CSS classes to PPB module (ebPanelHeader, ebPanelTitle, ebPanelDescription, ebMediaFieldGrid, iconColumn, iconBox, iconImg, iconPlaceholder, ebRuleCard, ebRuleHeader, ebMessagePreview, ebMessagePreviewIcon, ebMessagePreviewTitle, ebMessageNote, templateVariableGrid, templateVariableItem)
- ✅ Fixed free_gift_addons activeSection ID mismatch: `"free_gift_add_ons"` → `"free_gift_addons"`
- ✅ Replaced PPB free_gift_addons content with 3-card EB/FPB layout (Add-Ons and Gifting Step card, Add-Ons with Bundles card, Footer Messaging card)
- ✅ Replaced PPB messages content with EB/FPB-style single card (enable toggle, message preview row, sender/recipient/mandatory/char limit checkboxes)
- ✅ Moved widget labels to Bundle Settings section (preserved textOverridesLocale state usage)
- ✅ Added template variables modal (s-modal with templateVariablesModalRef, ADDON_TEMPLATE_VARIABLES constant, showPolarisModal/hidePolarisModal helpers)
- Files modified: app/styles/routes/product-page-bundle-configure.module.css, app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx, docs/issues-prod/step-messages-free-gift-parity-1.md

## Phases Checklist
- [x] Audit EB (Free Gift & Add Ons + Messages)
- [x] Add missing CSS classes to PPB module
- [x] Fix free_gift_addons activeSection ID mismatch in PPB
- [x] Replace PPB free_gift_addons content (port from FPB)
- [x] Replace PPB messages content (EB/FPB style using PPB state)
- [x] Move widget labels to Bundle Settings section
- [x] Add template variables modal to PPB
- [x] Lint + commit

## Related Documentation
- FPB route: app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx
- PPB route: app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx
- PPB CSS: app/styles/routes/product-page-bundle-configure.module.css
