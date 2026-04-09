# Issue: DCP Preview Fixes — Skeleton Height + PDP Badge Parity

**Issue ID:** dcp-preview-fixes-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 20:00

## Overview

Two fixes to the Design Control Panel:

1. **Skeleton Loading preview height mismatch** — The skeleton card preview in the DCP uses
   a hardcoded `height: 200px` instead of the `--bundle-product-card-height` CSS variable,
   so the preview doesn't match actual product card dimensions when merchants have customised
   card height.

2. **PDP DCP free gift badge parity** — After the badge customization work (dcp-badge-customization-1),
   the free gift badge controls were added to the `WidgetStyleSettings` section on PDP. They should
   instead be a dedicated top-level "Product Badges" section, mirroring the FPB DCP pattern.

## Phases Checklist

- [ ] Phase 1: Skeleton height fix (`ProductCardPreview.tsx`)
- [ ] Phase 2: PDP badge dedicated section (new `PDPBadgeSettings.tsx` + config + wiring)

## Progress Log

### 2026-04-09 20:00 - Implementation Started
- Files to modify: ProductCardPreview.tsx, WidgetStyleSettings.tsx, pdp.config.ts, types.ts, SettingsPanel.tsx
- Files to create: PDPBadgeSettings.tsx
