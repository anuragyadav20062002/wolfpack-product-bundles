# Issue: Preview Bundle Gate — Incorrect App Embed Block
**Issue ID:** preview-bundle-gate-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-31
**Last Updated:** 2026-05-31

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

## Phases Checklist
- [x] Identify root cause
- [x] Fix fail-closed → fail-open in `checkAppEmbedEnabled`
- [x] Lint + commit
