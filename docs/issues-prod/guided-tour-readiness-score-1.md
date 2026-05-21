# Issue: Guided Tour + Per-Bundle Readiness Score

**Issue ID:** guided-tour-readiness-score-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 00:00

## Overview

Replace the intrusive global setup overlay on the dashboard with two purpose-built features on the bundle configure page:

1. **Guided Tour** — 5-step tooltip overlay shown on first visit to the configure page (FPB + PPB), introducing each major section in sequence.
2. **Per-Bundle Readiness Score** — minimal circular arc widget fixed to the bottom-left of the configure page, expandable into a checklist panel showing what's done and what's left for *this* bundle.

Modelled on EasyBundles' UX. EasyBundles screenshots saved at `public/eb-readiness-score-popup.png`.

## Reference Docs

- `docs/guided-tour-reference.md` — full spec for guided tour: step targets, copy, data-tour-target placement, component API
- `public/eb-readiness-score-popup.png` — screenshot of EB's readiness score popup (expanded state)
- `public/current-dashboard-setup-widget.png` — screenshot of our current intrusive dashboard widget

## Phases Checklist

- [x] Phase 0 — Remove dashboard setup overlay + SetupScoreCard
- [ ] Phase 1 — Add `data-tour-target` attrs during configure page UI revamp
- [ ] Phase 2 — Build `BundleGuidedTour` component
- [ ] Phase 2 — Build `BundleReadinessOverlay` component
- [ ] Phase 2 — Wire readiness data into FPB + PPB configure loaders
- [ ] Phase 2 — Wire Preview click → localStorage in configure pages
- [ ] Phase 3 — Update `PPB_TOUR_STEPS` after PPB UI revamp

## Progress Log

### 2026-04-30 00:00 - Phase 0: Remove dashboard setup overlay

- Removed `SetupScoreCard` import and JSX from `dashboard/route.tsx`
- Removed `setupScore` DB queries from dashboard loader (3 parallel queries dropped)
- Removed `setupOverlayOpen` state, `setupSignals`, `setupPercent` derived values
- Removed overlay CSS blocks from `dashboard.module.css`
- Deleted `app/components/SetupScoreCard.tsx`
- `themeEditorUrl` + `checkAppEmbedEnabled` retained (used by app embed card)
- Next: Phase 1 — add `data-tour-target` attrs during configure page UI revamp

## Related Documentation

- `docs/guided-tour-reference.md` — tour step definitions, placement spec, component architecture
