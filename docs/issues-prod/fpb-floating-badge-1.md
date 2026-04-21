# Issue: FPB Floating Dismissible Promo Badge

**Issue ID:** fpb-floating-badge-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20 18:30

## Overview
Fixed-position floating badge on the FPB storefront (bottom-left, above footer bar).
Merchant-configured text (max 60 chars) and enabled/disabled toggle via DCP.
Session-dismissed: once the user clicks X, it stays hidden for the browser session.

## Related Documentation
- `docs/storefront-ui-26.05-improvements/01-requirements.md` — FR-03
- `docs/storefront-ui-26.05-improvements/02-architecture.md` — FR-03 section

## Phases Checklist
- [x] Prisma: add floatingBadgeEnabled + floatingBadgeText to Bundle + db push
- [x] Propagate through metafield-sync types + operations + bundle-formatter
- [x] bundle-widget-full-page.js: init() calls _initFloatingBadge(); renders badge + dismiss
- [x] CSS: .floating-promo-badge styles (appended to minified CSS)
- [x] Settings extraction: floatingBadgeEnabled + floatingBadgeText in handlers.server.ts
- [x] DCP configure page: toggle + text input (Bundle Assets section)
- [x] Build + minify + lint + commit

## Progress Log

### 2026-04-20 17:30 - Starting Implementation
- Reading schema, liquid block, init(), and settings pipeline before writing code

### 2026-04-20 18:30 - Completed Implementation
- ✅ Prisma schema: added `floatingBadgeEnabled Boolean @default(false)` + `floatingBadgeText String @default("")` to Bundle model; `npx prisma db push` applied
- ✅ `metafield-sync/types.ts`: added `floatingBadgeEnabled?` + `floatingBadgeText?` to BundleUiConfig
- ✅ `bundle-product.server.ts`: added both fields to bundle config mapping (falls back to defaults)
- ✅ `bundle-formatter.server.ts`: added both fields to FormattedBundle interface and mapper
- ✅ `bundle-widget-full-page.js`: added `_initFloatingBadge()` (reads from selectedBundle config, session-dismiss via sessionStorage keyed to bundle id, XSS-safe via `_escapeHtml`)
- ✅ CSS: `.floating-promo-badge` fixed bottom-left, slide-in animation, dismiss X, uses `--bundle-add-btn-color` accent — 81,976 B (under 100 KB limit)
- ✅ DCP: toggle + text field (max 60 chars + showCharacterCount) in Bundle Assets section
- ✅ handlers.server.ts: parse + save `floatingBadgeEnabled` + `floatingBadgeText` (server-side 60-char clamp)
- ✅ Build: 231.3 KB bundled JS (minified); lint: 0 errors
- Files modified: prisma/schema.prisma, metafield-sync/types.ts, bundle-product.server.ts, bundle-formatter.server.ts, bundle-widget-full-page.js, bundle-widget-full-page.css, handlers.server.ts, route.tsx
