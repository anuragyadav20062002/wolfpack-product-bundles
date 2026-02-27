# Issue: DCP Preview Fidelity

**Issue ID:** dcp-preview-fidelity-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 01:00

## Overview

Replace the hand-crafted inline-style preview components in the Design Control Panel with
real widget CSS + real ComponentGenerator HTML, wired to DesignSettings via the existing
generateCSSVariables / generateFullPageVariables functions.

## Related Documentation

- `docs/dcp-preview-fidelity/00-BR.md`
- `docs/dcp-preview-fidelity/03-architecture.md`
- `docs/dcp-preview-fidelity/04-SDE-implementation.md`

## Progress Log

### 2026-02-21 01:00 - Implementation Complete
- ✅ Phase 1: `app/lib/preview-css-vars.ts` — `settingsToCSSVarRecord()` created
- ✅ Phase 2: `PreviewScope.tsx` — injects real widget CSS + CSS var record
- ✅ Phase 3: `PreviewPanel.tsx` — all sub-previews wrapped in `<PreviewScope>`
- ✅ Phase 4: `ProductCardPreview.tsx` — rebuilt with real `.product-card` HTML
  (unselected + selected states + modal structure)
- ✅ Phase 5: `StepBarPreview.tsx` — rebuilt with real `.step-timeline` and
  `.step-tabs-container > .step-tab` HTML
- ✅ Phase 6: `BundleHeaderPreview.tsx` — fixed with real `.bundle-header-tab` HTML
  and CSS var-referenced header text
- ✅ Phase 7: `GeneralPreview.tsx` — real `.empty-state-card` HTML
- ✅ Phase 8: `PromoBannerPreview.tsx` — real `.promo-banner` HTML structure
- ✅ Phase 9: `HighlightBox.tsx` — new component: overlay div instead of outline,
  eliminates clipping by `overflow:hidden` ancestors
- ✅ Phase 10: `index.ts` — exports updated; `vite.config.ts` fs.allow extended
- ✅ 0 ESLint errors, 0 TypeScript errors on new files

## Phases Checklist

- [x] Phase 1: preview-css-vars.ts utility
- [x] Phase 2: PreviewScope.tsx wrapper
- [x] Phase 3: PreviewPanel.tsx update
- [x] Phase 4: ProductCardPreview rebuild
- [x] Phase 5: StepBarPreview rebuild
- [x] Phase 6: BundleHeaderPreview fix
- [x] Phase 7: GeneralPreview fix
- [x] Phase 8: PromoBannerPreview fix
- [x] Phase 9: Highlight box fix (all previews)
- [x] Phase 10: index.ts + lint + commit
