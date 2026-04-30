# Issue: App Embed Schema Name Length Fix

**Issue ID:** app-embed-schema-name-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 13:56

## Overview

Shopify CLI rejects the bundle-builder app extension during `shopify app dev` because the app embed block schema names exceed Shopify's 25-character limit.

## Progress Log

### 2026-04-30 13:52 - Starting Schema Name Fix
- Error: `Invalid tag 'schema': name: must have a maximum of 25 characters`
- Affected files: `extensions/bundle-builder/blocks/bundle-full-page-embed.liquid`, `extensions/bundle-builder/blocks/bundle-product-page-embed.liquid`
- Impact analysis: App embed schema metadata only; no widget runtime code, god nodes, API routes, or data model changes.
- Graph context: embed blocks appear in Community 7; `bundle-full-page-embed.liquid Block` also appears in Community 198. No graph path found from embed schema nodes to widget runtime god nodes.
- Next: Shorten app embed schema names to 25 characters or fewer and validate.

### 2026-04-30 13:56 - Completed Schema Name Fix
- Changed full-page app embed schema name from `Wolfpack Bundles | Full Page` to `WPB Full Page Bundle` (20 characters).
- Changed product-page app embed schema name from `Wolfpack Bundles | Product Page` to `WPB Product Page Bundle` (23 characters).
- Validated both schema blocks parse as JSON and both names are within Shopify's 25-character limit.
- Attempted `npm run dev -- --no-color`; sandboxed run failed on DNS for `app.shopify.com`, so final Shopify CLI validation will be done by running the dev server locally.
- Rebuilt graph with graphify pipx environment after Liquid code changes.

## Related Documentation
- `CLAUDE.md`
- `internal docs/Architecture/Widget Architecture.md`
- `internal docs/Operations/Build Process.md`

## Phases Checklist
- [x] Phase 1 - Shorten full-page embed schema name
- [x] Phase 2 - Shorten product-page embed schema name
- [x] Phase 3 - Validate Liquid/schema syntax
