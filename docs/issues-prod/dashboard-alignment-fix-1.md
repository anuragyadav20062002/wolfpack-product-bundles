# Issue: Dashboard Alignment Fixes

**Issue ID:** dashboard-alignment-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-01
**Last Updated:** 2026-05-01 10:00

## Overview
Fix visual alignment issues on the dashboard to match the designer's spec:
1. Remove language selector (not in design)
2. Reduce founder avatar from 92px to ~52px
3. Fix bundle table column misalignment (header uses 2fr/1fr/1fr/1fr; DataTable cells are all 25%)

## Progress Log

### 2026-05-01 10:00 - Completed alignment fixes
- ✅ Removed language selector (state, handler, JSX, CSS) — not in design
- ✅ Reduced founder avatar from 92px → 56px; adjusted supportCard grid column from 104px → 72px
- ✅ Aligned bundle table: updated header to `1fr 1fr 1fr 1fr` matching DataTable 25% cells; hidden DataTable Navigation indicator
- Files modified: route.tsx, dashboard.module.css

## Related Documentation
- Design reference: Dashboard.png (shared by user)

## Phases Checklist
- [x] Remove language selector
- [x] Fix avatar size
- [x] Fix bundle table column alignment
- [x] Verify in browser
