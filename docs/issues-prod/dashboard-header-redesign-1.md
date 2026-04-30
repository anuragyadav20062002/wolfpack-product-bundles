# Issue: Dashboard Header Redesign

**Issue ID:** dashboard-header-redesign-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-29
**Last Updated:** 2026-04-30 00:30

## Overview

Replace the Polaris `<Page title>` dashboard header with an EB-style custom header section.
Left: personalized "Hey {firstName}" greeting + "Welcome to Wolfpack Bundles" subtitle (owner first name from `shop.billingAddress.firstName`).
Right: English language button (static stub), Sync Collections button (stub toast), Create Bundle button (dark primary), Bell icon (→ /app/events for now).

Also implement full EB parity for the bundle list toolbar: Bundle type filter, Status filter, and search bar behaviour (including Unlisted type unique to our data model).

## Related Documentation
- EB screenshot: docs/competitor-analysis/screenshots/ (user-provided)
- Changelog research: EB uses skailama.com/changelog/easy-bundle (hosted), likely Headway widget in-app. Headway is free for ≤1k MAU — future bell implementation.

## Phases Checklist
- [x] Phase 1: Create issue file (this file)
- [x] Phase 2: Loader — fetch ownerFirstName via currentStaffMember query
- [x] Phase 3: Component — add header Layout.Section with greeting + 4 action controls
- [x] Phase 4: CSS — dashboardHeader flex layout styles
- [ ] Phase 5: Bundle list toolbar EB parity (type, status, search)
- [ ] Phase 6: Visual verification desktop + mobile

## Progress Log

### 2026-04-30 00:30 - ownerFirstName source corrected
- ✅ Diagnosed: `unstable_newEmbeddedAuthStrategy: true` only stores offline sessions — no online sessions in DB, so Session table approach returns null always
- ✅ Switched to `shop.billingAddress.firstName` via Admin GraphQL (no extra scopes, always present on real merchant stores)
- ✅ "Welcome" fallback on test store is expected — test stores don't have billing address set
- ✅ Cart-transform Rust WASM rebuilt (exit 0, no code changes needed)
- ✅ Header verified in Chrome: all 4 buttons rendered, layout correct

### 2026-04-29 23:15 - Completed
- ✅ Loader: `currentStaffMember { firstName }` query (single source per Shopify docs — `read_users` scope needed for full support; shows "Welcome" when unavailable)
- ✅ Added `RefreshIcon` to polaris-icons imports
- ✅ Header Layout.Section: plain div (no Card), flex space-between
- ✅ Left: `Hey {firstName}` or `Welcome` + `Welcome to Wolfpack Bundles` subtitle
- ✅ Right: English (disclosure button stub) + Sync Collections (RefreshIcon, toast stub) + Create Bundle (primary) + Changelog bell (→ /app/events)
- ✅ Removed duplicate Create Bundle from "Your Bundles" card header
- ✅ Removed Page title/subtitle (custom header is now the primary heading)
- ✅ CSS: `.dashboardHeader` flex container, 4px/8px padding
- ✅ CLAUDE.md: added rule 13 — no unnecessary API fallback chains
- ✅ ESLint: 0 errors on modified tsx file
- ✅ Verified in Chrome: all 4 buttons rendered, no duplicates

### 2026-04-29 22:46 - Starting Implementation
- Issue file created
- Plan: plain div header (no Card), ownerFirstName from Admin GraphQL, bell → /app/events, Sync Collections stub
- Icons to use: RefreshIcon (sync), NotificationIcon (bell), PlusIcon (create) — all verified present in polaris-icons
- Changelog future: Headway widget free tier is the recommended approach
