# Issue: Full-Page Bundle Shows "Please configure a Bundle ID" Placeholder

**Issue ID:** full-page-bundle-placeholder-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 21:45

## Overview

Storefront shows "Full-Page Bundle Widget — Please configure a Bundle ID in the block settings" instead of the bundle, even for pages created through the app.

## Root Cause

The Liquid template reads `page.metafields['$app'].bundle_id` to get the bundle ID. In Shopify, a raw metafield set via `metafieldsSet` is NOT accessible in Liquid/Storefront unless a **MetafieldDefinition** with `storefront: "PUBLIC_READ"` exists for that owner type + namespace + key combination.

The app created `$app:bundle_id` metafields on pages via `metafieldsSet`, but never created a `PAGE` `MetafieldDefinition` with `PUBLIC_READ` access. So the metafield value was always `null` in Liquid, causing the placeholder to show.

## Fix

1. `definitions.server.ts` — Added `ensurePageBundleIdMetafieldDefinition()`:
   - Creates `MetafieldDefinition` for `ownerType: PAGE`, `namespace: $app`, `key: bundle_id`, `storefront: PUBLIC_READ`
   - Idempotent — silently skips if definition already exists (`TAKEN` error code)

2. `shopify.server.ts` — Call `ensurePageBundleIdMetafieldDefinition()` in `afterAuth` hook so all shops get the definition on next login

3. `widget-full-page-bundle.server.ts` — Call it before setting the page metafield during bundle creation so the definition is guaranteed to exist

## Progress Log

### 2026-03-12 21:45 - Fixed

- ✅ `definitions.server.ts` — new function
- ✅ `shopify.server.ts` — called in afterAuth
- ✅ `widget-full-page-bundle.server.ts` — called before metafieldsSet
- ✅ Barrel exports updated through the chain

## Phases Checklist

- [x] Phase 1: Add PAGE metafield definition function
- [x] Phase 2: Wire into afterAuth + bundle creation
- [ ] Phase 3: Deploy (definition created on next app login / bundle create)
