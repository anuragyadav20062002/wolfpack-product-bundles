# Issue: Dashboard — Compact Scale (EB Parity)

**Issue ID:** dashboard-compact-scale-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-06-01
**Last Updated:** 2026-06-01

## Overview
Dashboard design felt too spacious compared to EB. Reduced spacing, padding, and sizes throughout `dashboard.module.css` to compact the layout without altering structure or behaviour.

## Changes

- `dashboardLayout` gap: 24px → 16px
- `dashboardHeader` padding/gap reduced
- `topCardsGrid` gap: 24px → 16px
- `supportCardHero` padding reduced
- `supportCardBody` padding + gap reduced; grid column 96px → 80px
- Avatar size: 84px → 70px
- `appEmbedCard` padding: 20px 24px → 14px 18px; image max-height 126px → 100px
- `bundlesPanel` padding + toolbar margin reduced
- Table header padding: 12px → 8px; row cell padding: 10px → 7px
- Bundle name cells: `font-weight: 500` (slightly heavier)
- `paginationBar` padding reduced
- `resourcesLayout` min-height 282px → 220px; col 320px → 280px
- `resourcesList` padding: 36px 28px → 20px 18px; gap 8px → 4px
- `resourceItem` min-height 52px → 40px; padding + gap reduced
- `resourceItemLabel` font-size: 16px → 14px
- `resourcesThumbnails` gap/padding reduced
- `resourceThumbnailFooter` padding + font-size reduced
- Empty state sizes reduced

## Progress Log

### 2026-06-01 - Implemented
- Reduced spacing/padding/sizes across dashboard.module.css only
- No structural or behaviour changes

## Phases Checklist
- [x] Compact dashboard.module.css spacing/padding/sizes
- [x] Bundle name font-weight: 500
