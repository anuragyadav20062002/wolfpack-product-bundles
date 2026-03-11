# Issue: Analytics Nav + Web Pixel Fix

**Issue ID:** analytics-nav-pixel-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-11
**Last Updated:** 2026-03-11 00:00

## Overview
Two problems:
1. Attribution/Analytics dashboard not linked in Shopify Admin navigation (NavMenu missing the link)
2. Web pixel extension shows as "disconnected" in Settings → Customer Events

## Root Causes

### Nav missing
`app.tsx` NavMenu only has Dashboard, Design Control Panel, Pricing — no Analytics link.

### Pixel "disconnected"
The `webPixelCreate` mutation has been called (pixel record exists in Shopify — that is why it
appears in Customer Events). However the extension JavaScript code has never been pushed to
Shopify's CDN because `shopify app deploy` has not been run since the extension was created.
Shopify cannot run code that hasn't been deployed → status = "disconnected".

## Progress Log

### 2026-03-11 00:00 - Starting fixes
- Add "Analytics" link to NavMenu in app.tsx
- Add back button to attribution page (already has one)
- Document deploy requirement for pixel

## Phases Checklist
- [x] Add Analytics to NavMenu
- [x] Commit
- [ ] Run shopify app deploy (user action — required for pixel to connect)
