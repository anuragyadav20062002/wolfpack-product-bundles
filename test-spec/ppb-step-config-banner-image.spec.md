# Test Spec: PPB Step Config Banner Image
**Spec ID:** ppb-step-config-banner-image  **Created:** 2026-07-16

## Purpose

Verify Product Page Bundle storefront layout renders the EB-aligned Step Config image from the public `stepImage` runtime key.

## Test Cases

### ProductPageLayoutShellMethods

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Public Step Config image | Step has `stepImage` URL and no `bannerImageUrl` | Banner image element is created with that URL | EB saves PPB Step Config upload as `productsData1.stepImage` |
| 2 | Legacy banner key fallback | Step has `bannerImageUrl` URL | Banner image element is created with that URL | Preserve current internal banner behavior |
| 3 | No image | Step has neither image key | No banner image element is created | Avoid empty/broken image |

## Acceptance Criteria

- [ ] Step Config custom images render from `stepImage`.
- [ ] Existing `bannerImageUrl` behavior still works.
- [ ] No banner element is emitted when no image is configured.
