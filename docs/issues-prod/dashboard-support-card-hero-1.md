# Issue: Dashboard Support Card — Black Hero Section (EB Parity)

**Issue ID:** dashboard-support-card-hero-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 02:30

## Overview

Add a black background top section ("Unlock your store's full potential." + description) to the Dashboard support card, matching EB's layout. Existing avatar, heading, body text, and CTA button are untouched. Also refined the founder avatar — zoomed in slightly with face centered in circle.

## Progress Log

### 2026-06-01 01:30 - Implementation Started
- ⏳ Adding supportCardHero div above supportCardBody
- Will modify:
  - `app/routes/app/app.dashboard/route.tsx` (supportCard JSX, ~line 549)
  - `app/routes/app/app.dashboard/dashboard.module.css` (supportCard CSS, ~line 82)
  - `app/i18n/locales/en.json` (add heroTitle + heroDesc keys)

### 2026-06-01 02:30 - Phase 1: All Changes Completed
- ✅ Added `supportCardHero` div with dark `#1a1a1a` background above `supportCardBody`
- ✅ `supportCard` converted from CSS grid to flex-column with `overflow: hidden`
- ✅ Grid layout moved into new `supportCardBody` child div
- ✅ New CSS classes: `supportCardHero`, `supportCardHeroTitle`, `supportCardHeroDesc`, `supportCardBody`
- ✅ Responsive override updated from `.supportCard` to `.supportCardBody` (line 624)
- ✅ i18n keys added: `dashboard.support.heroTitle`, `dashboard.support.heroDesc`
- ✅ Avatar refined: `overflow: hidden` + `border-radius: 50%` on wrap, `transform: scale(1.15)` + `object-position: center 22%` on image for face-centered zoom
- ✅ Files Modified:
  - `app/routes/app/app.dashboard/route.tsx` (~line 549-590)
  - `app/routes/app/app.dashboard/dashboard.module.css` (lines 82-175, 624)
  - `app/i18n/locales/en.json` (lines 12-13)
- Result: Black hero section renders above avatar/content/CTA, matching EB parity
- Impact: Dashboard support card now has the same visual structure as EB competitor

## Related Documentation
- `docs/competitor-analysis/01-dashboard.md`

## Phases Checklist

- [x] Phase 1: Add black hero section (JSX + CSS + i18n) + avatar zoom refinement ✅ Completed

