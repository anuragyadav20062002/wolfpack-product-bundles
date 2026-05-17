# Issue: EB Step Setup + Readiness Score Parity — FPB & PPB

**Issue ID:** eb-step-setup-readiness-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-17
**Last Updated:** 2026-05-17 12:00

## Overview

Full parity of the Step Setup section (FPB + PPB configure pages) and Bundle Readiness Score overlay against Easy Bundles (EB) competitor, based on a live Chrome DevTools audit.

Architecture doc: `docs/eb-step-setup-readiness-parity/02-architecture.md`

## Phases Checklist

- [ ] Phase 1-A: BundleReadinessOverlay — collapsed bar subtitle
- [ ] Phase 1-B: constants/bundle.ts — add Weight to condition type options
- [ ] Phase 1-C: FPB route — step chips chevron + s-switch toggle
- [ ] Phase 1-D: PPB route Phase 1 — header tooltip, chips chevron, rules restructure, step config
- [ ] Phase 2: PPB route Phase 2 — multi-category loader + action + UI

## Progress Log

### 2026-05-17 12:00 - Completed Phase 1 (A–D)
- ✅ BundleReadinessOverlay.tsx: collapsed bar subtitle → "Complete all steps to maximise your bundle's success." + removed unused `doneCount` variable
- ✅ app/constants/bundle.ts: added `{ label: "Weight", value: "weight" }` to STEP_CONDITION_TYPE_OPTIONS
- ✅ FPB route: step chips get `›` chevron suffix via `.stepChipChevron` span; Step Setup `s-checkbox` → `s-switch`
- ✅ FPB CSS: added `.stepChipChevron` class
- ✅ PPB route: Step Flow header gets `s-button icon="info"` + "How to setup?" link; step chips get `›` chevron; "Conditions" section restructured to EB-style "Rules Configuration" (radio group + Rule #N cards + autoNext checkbox); "Step Config" card added (image upload + Step Title field)
- ✅ PPB CSS: added `.stepChipChevron` and `.headingWithHelp` classes
- Files changed: BundleReadinessOverlay.tsx, constants/bundle.ts, FPB route.tsx, FPB configure.module.css, PPB route.tsx, PPB configure.module.css
- Next: Phase 2 — PPB multi-category system (StepCategory loader + action + UI)

## Related Documentation
- Architecture: `docs/eb-step-setup-readiness-parity/02-architecture.md`
- Audit screenshots: `docs/app-nav-map/screenshots/` (eb-full-step-setup-*, eb-dashboard-*, etc.)
