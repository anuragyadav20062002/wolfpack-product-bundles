# Issue: Events Page

**Issue ID:** events-page-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 15:00

## Overview
Add a dedicated Events page with two accordion sections: Latest Events and FAQs & Tutorials. Migrate CartPropertyFixCard content from dashboard into the FAQ section.

## Progress Log

### 2026-03-20 15:00 - Starting implementation
- Feature pipeline complete (BR → PO → Architect)
- Files to create: AccordionItem.tsx, app.events.tsx
- Files to modify: app.tsx (nav), app.dashboard/route.tsx (remove card)
- No tests required (Polaris UI TDD exception)

### 2026-03-20 15:20 - Completed implementation
- Created AccordionItem.tsx — smooth CSS max-height transition, badge support, chevron rotation
- Created app.events.tsx — two sections (Latest Events, FAQs & Tutorials), static content
- Refactored CartPropertyFixCard.tsx — extracted CartPropertyFixContent for accordion use
- Updated app.tsx — added Events nav link
- Updated app.dashboard/route.tsx — removed CartPropertyFixCard section
- Lint: 0 errors

## Phases Checklist
- [x] Phase 1: AccordionItem component
- [x] Phase 2: Events page route
- [x] Phase 3: Nav link + remove card from dashboard
- [x] Phase 4: Lint + commit
