# Issue: FPB Step Image Circles, Progress Line, and Per-Step Banner Image

**Issue ID:** fpb-step-image-banner-1
**Status:** Completed
**Priority:** 🟡 High
**Created:** 2026-04-20
**Last Updated:** 2026-04-20

## Overview

Two GBB feature gaps for the FPB widget:
1. **Step image circles + progress line**: merchants can upload a custom icon per step tab; a horizontal connecting line always spans all tabs to visualise progress
2. **Per-step banner image**: merchants can upload a full-width hero image per step that renders above the product grid

Both features are admin-config (not DCP). Image uploads reuse the existing `FilePicker` component + Shopify Files API.
Architecture docs: `docs/step-image-nav/02-architecture.md`, `docs/step-banner-image/02-architecture.md`

## Progress Log

### 2026-04-20 - Completed

- Prisma: added `imageUrl String?` + `bannerImageUrl String?` to BundleStep; manual migration created
- Metafield writer: `imageUrl ?? null` + `bannerImageUrl ?? null` added to step map
- Widget JS: tab renders `<img class="tab-step-icon">` when `step.imageUrl` set, else falls back to step number; `createStepBannerImage()` injected in floating + sidebar layouts
- Widget CSS: `::after` connecting line (always-on, filled for completed steps), `.tab-step-icon`, `.step-banner-image`
- Admin UI: "Step Images" section in FPB step card with two FilePicker fields; wired to `updateStepField` + `markAsDirty`; saved in handlers.server.ts step create map
- 4 new passing tests in bundle-product-metafield.test.ts
- Widget version bumped 2.4.6 → 2.5.0 (MINOR)

## Related Documentation
- `docs/step-image-nav/02-architecture.md`
- `docs/step-banner-image/02-architecture.md`
- `docs/ui-audit-26.05.md` — P2 items #4 and #5

## Phases Checklist
- [x] Prisma schema: add `imageUrl` + `bannerImageUrl` to BundleStep
- [x] Prisma migration
- [x] Metafield writer: pass both fields through step map
- [x] Tests: metafield step map passes through both fields
- [x] Widget JS: tab icon rendering (FPB)
- [x] Widget CSS: always-on connecting line + tab icon styles + banner image styles
- [x] Widget JS: per-step banner rendering (FPB)
- [x] Admin UI: FilePicker for step icon + banner (FPB configure route)
- [x] Build widgets
- [x] Lint + commit
