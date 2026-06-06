# Issue: Add-On / Upsell Step (Enhanced Free Gift Step)

**Issue ID:** addon-upsell-step-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-26
**Last Updated:** 2026-04-26 00:00

## Overview

Replace the existing `isFreeGift` checkbox in the Step Options card with a first-class "Add-On / Upsell Step" mode selector (Regular | Add-On). When Add-On mode is selected, expose Step Label, Step Title, Step Icon (upload), Display as Free toggle, and Unlock after completion toggle. Update the storefront widget to render add-on steps with lock state, custom icons, and FREE badges. EB competitor parity (Feature A — Gifting Step).

## Related Documentation

- `docs/addon-upsell-step/01-requirements.md`
- `docs/addon-upsell-step/02-architecture.md`
- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §5 (Feature A)

## Phases Checklist

- [ ] Phase 1 — Prisma: Add 5 new fields to `BundleStep` + migration
- [ ] Phase 2 — Tests: Unit tests for `isAddonStepLocked` widget helper
- [ ] Phase 3 — FPB configure: Redesign Step Options UI (ChoiceList + addon fields)
- [ ] Phase 4 — PPB configure: Same Step Options redesign
- [ ] Phase 5 — Widget JS: Add-on tab rendering, lock state, FREE badge
- [ ] Phase 6 — Widget build: `npm run build:widgets` + version increment
- [ ] Phase 7 — Metafield sync: Include new step fields in payload
- [ ] Phase 8 — API bundle JSON: Expose new step fields
- [ ] Phase 9 — Deploy:SIT (manual)

## Progress Log

### 2026-04-26 00:00 - Architecture Complete
- Stage 1 requirements doc written: `docs/addon-upsell-step/01-requirements.md`
- Stage 2 architecture doc written: `docs/addon-upsell-step/02-architecture.md`
- Issue file created
- Next: Phase 1 — Prisma schema additions + migration
