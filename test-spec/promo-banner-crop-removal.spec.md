# Test Spec: Promo Banner Crop Removal
**Spec ID:** promo-banner-crop-removal  **Created:** 2026-06-21

## Purpose
Ensure the pruned promo banner crop feature is removed from Admin UI, save payloads, widget runtime contracts, and persisted storefront configuration.

## Test Cases

### PromoBannerCropRemoval
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Metafield payload omits crop | Bundle fixture with stale `promoBannerBgImageCrop` | `bundle_ui_config` has no `promoBannerBgImageCrop` key | Prevents storefront cache from carrying pruned field |
| 2 | FPB runtime ignores crop | Widget source with stale crop field references | Runtime source has no crop field or crop CSS math | Keeps banner at CSS cover/center |
| 3 | FilePicker exposes no crop controls | Shared FilePicker source | No `ImageCropEditor`, `cropValue`, `onCropChange`, or `hideCropEditor` contract | Removes Admin crop affordance |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] `promoBannerBgImageCrop` is absent from production app code and Prisma schema.
- [ ] Generated widget bundles are rebuilt after raw widget source changes.
