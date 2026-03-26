# Issue: Add Step Options (Free Gift & Default Product) to PDP Configure Page

**Issue ID:** pdp-step-options-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 18:45

## Overview

The PDP configure page is missing the "Step Options" section that FPB has. The Prisma schema
already has all four fields (`isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId`) and
both widgets support them at runtime. Only the admin UI and handler persistence are missing for PDP.

## Files to Modify

- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  — add Step Options block after the "Add Rule" button inside each step card
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  — add the four fields to the step create mapping (lines 208–214)

## Progress Log

### 2026-03-24 18:30 - Starting implementation

- ⏳ Porting Step Options block from FPB route.tsx (lines 1852–1930) to PDP route.tsx
- ⏳ Adding free gift & default product fields to PDP handler step mapping
- Insertion point in route.tsx: after `</Button>` (Add Rule) + `</BlockStack>` at line 1642,
  before `</BlockStack>` + `</Collapsible>` at line 1644

### 2026-03-24 18:45 - Completed

- ✅ Added Step Options block to PDP route.tsx after "Add Rule" button inside each step card
  — Free gift checkbox + conditional "Gift display name" TextField
  — Mandatory default product checkbox + conditional "Default variant GID" TextField + variant picker buttons
- ✅ Added `isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId` to PDP handler step mapping
  (`handlers.server.ts` after `enabled` field, lines ~208)
- ✅ Linted — 0 errors

## Phases Checklist
- [x] Phase 1: Add Step Options UI to PDP route.tsx
- [x] Phase 2: Add fields to PDP handler step mapping
- [x] Phase 3: Lint + commit
