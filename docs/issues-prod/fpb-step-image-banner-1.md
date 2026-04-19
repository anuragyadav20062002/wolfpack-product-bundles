# Issue: FPB Step Image Circles, Progress Line, and Per-Step Banner Image

**Issue ID:** fpb-step-image-banner-1
**Status:** In Progress
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

### 2026-04-20 - Starting implementation

- Scope: FPB only (not PDP). Progress line always-on regardless of icons.
- Phase 1: Prisma schema + migration (both fields in one migration)
- Phase 2: Metafield writer — pass imageUrl + bannerImageUrl through step map
- Phase 3: Widget JS — tab icon rendering + banner rendering
- Phase 4: Widget CSS — connecting line + banner image styles
- Phase 5: Admin UI — FilePicker for step icon and banner per step

## Related Documentation
- `docs/step-image-nav/02-architecture.md`
- `docs/step-banner-image/02-architecture.md`
- `docs/ui-audit-26.05.md` — P2 items #4 and #5

## Phases Checklist
- [ ] Prisma schema: add `imageUrl` + `bannerImageUrl` to BundleStep
- [ ] Prisma migration
- [ ] Metafield writer: pass both fields through step map
- [ ] Tests: metafield step map passes through both fields
- [ ] Widget JS: tab icon rendering (FPB)
- [ ] Widget CSS: always-on connecting line + tab icon styles + banner image styles
- [ ] Widget JS: per-step banner rendering (FPB)
- [ ] Admin UI: FilePicker for step icon + banner (FPB configure route)
- [ ] Build widgets
- [ ] Lint + commit
