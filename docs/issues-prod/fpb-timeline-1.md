# Issue: FPB Step Timeline — CSS Connecting Line + Icon States + Animation

**Issue ID:** fpb-timeline-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20 15:20

## Overview
Redesign the FPB step timeline from horizontal pill tabs to a circular icon-based
timeline with:
- User-uploadable per-step icons (with SVG defaults for regular / free-gift / default-product step types)
- Three icon states: active (primary color), inactive (grayscale), completed (checkmark overlay)
- CSS-driven connecting line between steps with 400ms left-to-right fill animation
- Removal of hardcoded `gap: 308px`
- All colors DCP-customizable

## Related Documentation
- `docs/storefront-ui-26.05-improvements/01-requirements.md` — FR-05
- `docs/storefront-ui-26.05-improvements/02-architecture.md` — FR-05 section

## Phases Checklist
- [x] Prisma migration: add `timelineIconUrl` to BundleStep
- [x] JS: redesign `createStepTimeline()` to render circular icon timeline
- [x] JS: update `updateStepTimeline()` to target new `.step-timeline` class
- [x] CSS: new `.step-timeline` / `.timeline-step` styles with connecting line + animation
- [x] CSS vars generator: add `--bundle-step-timeline-active-color`, `--bundle-step-timeline-inactive-color`
- [x] Build widgets (v2.6.0)
- [x] Commit

## Progress Log

### 2026-04-20 14:50 - Starting Implementation
- Audited existing `createStepTimeline()` — currently renders `.step-tabs-container` pill tabs
- Old `.step-timeline` / `.timeline-step` CSS exists but is dead code (not rendered by JS)
- Plan: redesign `createStepTimeline()` to output `.step-timeline` circular design
- Files to modify: `bundle-widget-full-page.js`, `bundle-widget-full-page.css`,
  `css-variables-generator.ts`, `prisma/schema.prisma`
