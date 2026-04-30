# Issue: Dashboard Resources Card — UI Parity Pass 2

**Issue ID:** dashboard-resources-card-2
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 01:30

## Overview

Second pass on the Resources card to fully match EB's design:
- Heading font weight/size to match EB (headingLg bold)
- Wrap list + thumbnails in a single card container (EB has border+rounded card)
- Bundle Inspirations becomes a tab button (not an external link); thumbnails shown when it's selected
- Thumbnail cards: grey placeholder + footer (label left, external icon right) — link to wolfpackapps.com
- Remove gap between list and thumbnails, use border-left separator

## Phases Checklist
- [x] Phase 1: Create issue file
- [x] Phase 2: Update route.tsx — heading, activeResource state, JSX restructure
- [x] Phase 3: Update dashboard.module.css — card wrapper, thumbnail card, footer
- [x] Phase 4: Visual verification in Chrome

## Progress Log

### 2026-04-30 01:30 - Completed
- ✅ Heading: Text variant="headingLg" as="h2" fontWeight="bold" (was headingMd h3)
- ✅ Card wrapper: .resourcesCard div with border + border-radius around list+thumbnails
- ✅ Layout: removed gap, border-left separator between list and thumbnails
- ✅ Bundle Inspirations: changed from <a href> to <button> with activeResource state (useState)
- ✅ Thumbnails: .resourceThumbnailCard (border, rounded, flex-column) + .resourceThumbnailPlaceholder (grey area) + .resourceThumbnailFooter (label + external icon)
- ✅ Both thumbnail cards link to https://wolfpackapps.com/ (target="_blank")
- ✅ Verified via a11y snapshot: heading level 2, Bundle Gallery + Interactive Demo links present
- ✅ ESLint: 0 errors

### 2026-04-30 01:00 - Starting Implementation
- Files to modify: route.tsx (Resources section ~L1159), dashboard.module.css
- No new components needed — all inline
