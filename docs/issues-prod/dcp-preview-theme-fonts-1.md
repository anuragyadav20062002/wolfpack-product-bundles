# Issue: DCP Preview — Inject Storefront Theme Fonts

**Issue ID:** dcp-preview-theme-fonts-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 12:30

## Overview

The DCP preview iframes use a hardcoded system font stack instead of the merchant's
storefront theme fonts. The preview should look like the actual storefront.

## Approach

Server-side fetch of the storefront homepage in the preview route loader.
Modern Shopify OS 2.0 themes (Dawn, Craft, Sense, etc.) output:
- Font stylesheet `<link>` tags (Google Fonts, Shopify CDN, Typekit) in `<head>`
- CSS custom properties like `--font-body-family`, `--font-heading-family` in inline
  `<style>` blocks

We extract both and inject them into the preview HTML. The `pageLayoutCss` body rule
is updated to use `var(--font-body-family, <system-fallback>)`.

Gracefully falls back to system fonts if the storefront is password-protected,
unreachable, or times out (3s timeout).

## Phases Checklist

- [x] Phase 1: Add `fetchThemeFontAssets()` helper in preview route
- [x] Phase 2: Call in loader and inject into HTML `<head>`
- [x] Phase 3: Update `pageLayoutCss` font-family to use CSS var with fallback

## Progress Log

### 2026-03-27 12:00 - Starting implementation
- File: `app/routes/api/api.preview.$type.tsx`

### 2026-03-27 12:30 - Completed
- ✅ `fetchThemeFontAssets(shop)` helper: fetches storefront homepage with 3s timeout,
  extracts font stylesheet `<link>` tags (Google Fonts / Shopify CDN / Typekit) and
  CSS custom properties (`--font-*`) from inline `<style>` blocks in `<head>`;
  returns empty strings on failure (password-protected, network error, timeout)
- ✅ Loader: calls helper before building HTML; injects font `<link>` tags and
  `<style id="theme-fonts">` block before widget CSS so they're available when
  `font-family: var(--font-body-family, ...)` resolves
- ✅ `pageLayoutCss` body rule updated to:
  `var(--font-body-family, var(--font-body, var(--body-font-family, <system stack>)))`
  — covers Dawn (`--font-body-family`), other OS 2.0 themes, system fallback
- Files changed: `app/routes/api/api.preview.$type.tsx`
