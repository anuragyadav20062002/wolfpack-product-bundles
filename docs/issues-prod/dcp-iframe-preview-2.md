# Issue: DCP Storefront Iframe Preview — Sub-Plan 2: Extension Templates

**Issue ID:** dcp-iframe-preview-2
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Add `product.product-page-bundle` and `page.full-page-bundle` Shopify template JSON files to
the theme extension. Once deployed, the `?view=product-page-bundle` and `?view=full-page-bundle`
URL parameters work on ANY product or page in any merchant's store — no bundle association required.

This is the prerequisite for Sub-Plans 3 and 4, which wire the DCP loader to query for a first
product/page handle and pass the template URL as the iframe preview URL.

## Changes

### 1. `extensions/bundle-builder/shopify.extension.toml`
Add a second `[[extensions.blocks]]` entry for the PDP block with `target = "section"` so it can
be used as a standalone section in the product template JSON.

### 2. `extensions/bundle-builder/templates/product.product-page-bundle.json` (NEW)
Single-section product template that includes the bundle-product-page app block.

### 3. `extensions/bundle-builder/templates/page.full-page-bundle.json` (NEW)
Single-section page template that includes the bundle-full-page app block.

## Progress Log

### 2026-03-24 - Implemented

- ✅ Added `target = "section"` entry for PDP block in TOML (alongside existing `target = "all"`)
- ✅ Created `product.product-page-bundle.json` — product template with bundle-product-page app block
- ✅ Created `page.full-page-bundle.json` — page template with bundle-full-page app block
- Files changed:
  - `extensions/bundle-builder/shopify.extension.toml`
  - `extensions/bundle-builder/templates/product.product-page-bundle.json` (NEW)
  - `extensions/bundle-builder/templates/page.full-page-bundle.json` (NEW)
- Next: commit, then `shopify app deploy` (manual), then Sub-Plan 3 PDP URL wiring

## Phases Checklist

- [x] Add `target = "section"` to PDP block in TOML
- [x] Create `product.product-page-bundle.json` template
- [x] Create `page.full-page-bundle.json` template
- [ ] Commit
- [ ] Deploy (`shopify app deploy`) — manual step
