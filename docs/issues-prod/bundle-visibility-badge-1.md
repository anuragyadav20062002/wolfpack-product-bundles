# Issue: Bundle Visibility Badge — "Complete" → "Optimised" (EB Parity)
**Issue ID:** bundle-visibility-badge-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 17:00

## Overview
Change the Bundle Visibility sidebar badge label from "Complete" (FPB) / null (PPB) to "Optimised" to match EB exactly.

## EB Reference
From EB's translation chunks:
```json
"bundleVisibility": {
  "tooltip": "Tracks whether your bundle is discoverable by shoppers. Optimises when you copy your bundle link and place it on your store, enable the Bundle Widget, or set up the Bundle Embed.",
  "optimised": "Optimised",
  "pending": "Pending"
}
```
EB shows App Embed = Enabled BUT Bundle Visibility = Pending — confirming App Embed alone does NOT trigger "Optimised".

## WPB Condition Mapping (OR logic)
| EB condition | WPB FPB mapping | WPB PPB mapping |
|---|---|---|
| Bundle link placed on store | `bundle.shopifyPageHandle` | n/a |
| Bundle Widget enabled | `upsellWidgetEnabled` | `upsellWidgetEnabled` |
| Bundle Embed set up | n/a | `appEmbedEnabled` |

**FPB**: Optimised when `bundle.shopifyPageHandle || upsellWidgetEnabled`
**PPB**: Optimised when `appEmbedEnabled`

## Files to Change
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — line ~2803
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — line ~2266

## Progress Log
### 2026-06-01 17:00 - Polish: image, border, badge tooltip + visibility
- Swapped Featured Product Card image from productPageThumbnail.png → floatingCardThumbnail.png in FPB + PPB
- Added visible black border (1px solid #000) to placement cards in FPB + PPB CSS
- Refactored InfoIcon → VisibilityBadge in both routes: accepts isOptimised prop, same tooltip text for both states
- Removed !isActive guard — badge now visible whether section is active or not
- Added .optimisedBadge CSS class to shared + FPB + PPB modules

### 2026-06-01 15:00 - Starting implementation
- Investigated EB network responses and confirmed badge label/conditions from translation chunks
- Confirmed App Embed enabled ≠ Optimised in EB (empirical observation)
- Identified WPB condition mapping per EB tooltip semantics

## Phases Checklist
- [x] Update FPB badge: "Complete" → "Optimised", add upsellWidgetEnabled OR condition
- [x] Update PPB badge: null → "Optimised" when appEmbedEnabled
- [x] Lint modified files — zero new errors
- [x] Commit badge change
- [x] Fix placement card images: Hero-Banner.png, Navigation-Menu.png, Announcement-Bar.png in both FPB + PPB
- [x] Remove stray "→" from PPB Quick Setup Guide button text
- [x] Swap Featured Product Card image to floatingCardThumbnail.png (best available)
- [x] Add visible black border to placement cards (FPB + PPB)
- [x] Both Pending/Optimised badges show same tooltip on hover; visible when section is active
- [ ] User to provide custom placement card images to replace current ones
- [ ] App Embed Status card badge inline with title/description
- [ ] Placement card body (description + button) uniform height across all 4 cards
