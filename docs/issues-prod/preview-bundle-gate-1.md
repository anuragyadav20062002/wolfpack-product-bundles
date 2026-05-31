# Issue: Preview Bundle Gate — Incorrect App Embed Block
**Issue ID:** preview-bundle-gate-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-31
**Last Updated:** 2026-05-31 (modal replication complete)

## Overview

`checkAppEmbedEnabled` returns `{ enabled: false }` when `JSON.parse(fileContent)` throws on `settings_data.json`. This incorrectly triggers the "Enable the theme app extension to preview" gate modal even when the Wolfpack app embed IS active. Root cause: `settings_data.json` can exceed ~1MB (Shopify's `OnlineStoreThemeFileBodyText.content` limit), causing truncation → invalid JSON → parse throw → fail-closed return.

**Observed log:** `[APP:WARN] checkAppEmbedEnabled: failed to parse settings_data.json`

## Fix

Change the JSON parse failure to fail-open: return `{ enabled: true, themeId }` instead of `{ enabled: false, themeId }`. If we cannot parse the file, we cannot confirm the embed is disabled — the preview should proceed rather than block.

## Progress Log

### 2026-05-31 — Fix JSON parse fail-closed → fail-open

- Changed `app/services/theme/app-embed-check.server.ts` line 94: `{ enabled: false }` → `{ enabled: true }` on JSON parse error
- Updated JSDoc comment to reflect new behavior
- Updated log message to indicate fail-open behavior

### 2026-05-31 — Replicate preview gate modal copy + design (EB parity)

- Investigated EB modal by temporarily disabling embed on yash-wolfpack test store and observing configure page load
- EB modal: "Your bundle visibility is not set up yet" / "Your bundle is live but shoppers have no way to find it. Set up visibility to change that." / "Maybe Later" + "Set Up Visibility" buttons
- Updated `app/components/EnablePreviewModal.tsx`:
  - Replaced 3-step instruction layout with centered modal: eye SVG icon in 56×56 circular grey container (#f1f1f1)
  - Title: "Your bundle visibility is not set up yet"
  - Body: "Your bundle is live but shoppers have no way to find it. Set up visibility to change that."
  - Buttons: "Maybe Later" (secondary) + "Set Up Visibility" (primary)
  - Removed `if (!themeEditorUrl) return null` guard — modal now shows even without theme URL
  - "Set Up Visibility" opens themeEditorUrl only if available (guarded), then closes modal
- EB embed on yash-wolfpack re-enabled and saved after investigation ("Changes saved." toast confirmed)

### 2026-05-31 — Option B: DB cache for app embed check (EB parity)

- Confirmed EB uses `GET /api/utility/isAppEmbedEnabled` with HTTP ETag caching (5-min TTL)
- Added `appEmbedEnabled Boolean?`, `appEmbedCheckedAt DateTime?`, `appEmbedThemeId String?` to `Shop` model
- Migration `20260531154158_add_app_embed_cache_to_shop` applied to SIT DB
- Updated `fetchEmbedData` in `bundle-configure-loader.server.ts` with 5-min DB cache:
  - Cache hit → skip Shopify API entirely
  - Cache miss/stale → call `checkAppEmbedEnabled`, update cache (only when themeId non-null)
  - Network error (themeId:null) → skip cache update, don't poison cache
- Added 5 new unit tests for cache behavior; all 17 tests pass
- `buildThemeEditorUrl` extracted as standalone helper

## Phases Checklist
- [x] Identify root cause
- [x] Fix fail-closed → fail-open in `checkAppEmbedEnabled`
- [x] Option B: DB cache (schema + migration + code + tests)
- [x] Lint + commit
- [x] Replicate EB preview gate modal copy + design
- [ ] E2E verification on SIT store
