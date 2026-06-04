# Issue: PPB Horizontal Slots Storefront Parity
**Issue ID:** ppb-horizontal-slots-storefront-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 04:09

## Overview
Match the PPB Horizontal Slots storefront template UI to the EB reference. Horizontal Slots maps to `bundleDesignTemplate: "PDP_MODAL"` and `templateId: "MODAL"`.

## Progress Log
### 2026-06-04 03:52 - Audit Horizontal Slots storefront gap
- Read EB implementation reference: Horizontal Slots is `PDP_MODAL` + `MODAL`; Vertical Slots is `PDP_MODAL` + `SIMPLIFIED`.
- Compared `docs/select-template/eb-ppb-modal-storefront.png` and `docs/select-template/wpb-ppb-modal-storefront.png`.
- Initial screenshot evidence was not sufficient because the EB bundle was still on Vertical Slots.
- WPB captured state has the correct rough position and CTA stack, but the slot card visual is broken/misaligned and modal-slot behavior is still mixed into the product-page widget instead of its own template module.
- Next: create a modal-slot template module, preserve shared modal behavior, add MODAL-scoped CSS for EB parity, rebuild assets, and verify.

### 2026-06-04 04:09 - Switch EB bundle to Horizontal Slots and inspect storefront
- In EB admin for `WPB Complete Audit Product Page 2026-05-25`, opened Select template and confirmed Vertical Slots was selected.
- Selected Horizontal Slots, advanced the EB template flow, and confirmed EB showed `Your bundle is ready`.
- Reloaded the EB storefront product page and extracted computed styles from the live widget.
- Confirmed Horizontal Slots renders a 345px product-page widget column with a 104px by 200px dashed slot card, 80px by 80px salmon placeholder image, `Product 1` label below the image, 10px step gap, 26px category gap, black disabled Add Bundle to Cart button, and black Buy it now button.
- Next: implement WPB Horizontal Slots against this live narrow-card contract, not the stale wide-row capture.

### 2026-06-04 04:09 - Implement Horizontal Slots module and storefront CSS
- Added `modal-slot-template.js` and moved modal-slot helper methods out of the main product-page widget file.
- Installed the modal-slot module before Cascade and added it to `PRODUCT_PAGE_MODULES`.
- Added Horizontal Slots scoped CSS for `PDP_MODAL` + `MODAL` + horizontal orientation to match the live EB narrow-card storefront shape.
- Bumped `WIDGET_VERSION` to `2.9.60`, rebuilt widget JS, and minified CSS outputs.
- Verification: focused Jest contract test passed, raw JS syntax checks passed, widget build passed, CSS minify passed, ESLint completed with warnings only, and graphify rebuilt.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/select-template/gap-report.md`
- `docs/select-template/eb-ppb-modal-storefront.png`
- `docs/select-template/wpb-ppb-modal-storefront.png`

## Phases Checklist
- [x] Phase 1: Add modal-slot template module and build path.
- [x] Phase 2: Match Horizontal Slots card/CTA UI to EB.
- [x] Phase 3: Preserve Vertical Slots scoping.
- [x] Phase 4: Build/minify modified storefront assets and verify.
