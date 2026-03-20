# SDE Implementation Plan: FPB Bundle Config Metafield Cache

## Overview
5 phases. Each phase is independently committable. TDD for server-side logic; no tests for
Liquid/widget/build-script changes.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/bundle-formatter.test.ts` | formatBundleForWidget field mapping, price conversion, GID extraction, null safety | Pending |
| `tests/unit/services/fpb-config-metafield.test.ts` | writeBundleConfigPageMetafield happy path, userErrors warning (non-fatal), null pageId skip | Pending |

## Phase 1: Shared bundle formatter
Extract `formatBundleForWidget` from the API endpoint into a shared lib. Both the API endpoint and the metafield writer will use it.

## Phase 2: Metafield definition helper
Add `ensureCustomPageBundleConfigDefinition()` to the definitions module.

## Phase 3: `writeBundleConfigPageMetafield` service helper
Add the metafield write function to `widget-full-page-bundle.server.ts`.

## Phase 4: Call write from both FPB handlers
Load full bundle in `handleValidateWidgetPlacement`; call helper in both handlers.

## Phase 5: Liquid + widget — prefer metafield over proxy
Read `bundle_config` metafield in Liquid; update widget to use `data-bundle-config` first.
