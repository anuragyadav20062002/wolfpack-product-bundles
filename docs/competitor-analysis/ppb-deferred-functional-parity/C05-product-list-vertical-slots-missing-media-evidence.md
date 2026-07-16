---
schema_version: 1
id: ppb-c05-product-list-vertical-slots-missing-media-evidence
title: C05 Product List and Vertical Slots Missing Media Evidence
type: evidence
status: active
summary: Evidence for missing-media behavior in PPB Product List and Vertical Slots templates across EB and WPB.
last_audited: 2026-07-17
owners:
  - engineering
domains:
  - competitor-analysis
systems:
  - ppb-storefront
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-product-grid-agentic-parity/PG07-missing-media-evidence.md
  - docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HS18-missing-media-evidence.md
tags:
  - ppb
  - missing-media
keywords:
  - C05
  - Message
---

# C05 Product List and Vertical Slots Missing Media Evidence

## Result

C05 is terminal **P** for Product List and Vertical Slots.

EB renders a broken missing-media image for the no-media `Message` product. WPB renders a stable neutral SVG placeholder instead. This is accepted as parity because the product remains selectable, card/slot hierarchy remains stable, and neither desktop nor mobile overflows horizontally.

## Fixture

- EB fixture: `WPB PPB Product List Parity 2026-07-11`
- WPB fixture: `PPB Modal Shared Card Test`
- Missing-media product: `Message`
- Browser process: Chrome DevTools MCP, cache storage cleared and hard reloaded before each storefront pass.

## Product List evidence

### EB Product List

- Desktop 1280x800: runtime template was `PDP_INPAGE + CASCADE`; `Message` appeared in the product catalog with a broken image URL ending in `/products/undefined`; image natural size was `0x0`; rendered card image box stayed within the row; horizontal overflow was `0`.
- Mobile 390x844 at DPR 3: same `Message` broken image behavior; no horizontal overflow.

### WPB Product List

- Desktop 1280x800: `Message` rendered with a `data:image/svg+xml` placeholder; natural image size was `400x400`; rendered card image box stayed at the product-list card size; horizontal overflow was `0`; widget version was `5.0.189`.
- Mobile 390x844 at DPR 3: same SVG placeholder behavior; no horizontal overflow.

## Vertical Slots evidence

### EB Vertical Slots

Desktop 1280x800:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "bodyAttrs": { "templateId": "SIMPLIFIED", "templateType": "PDP_MODAL", "consolidated": null },
  "hasProductSlots": true,
  "messageCount": 4,
  "imgs": [
    {
      "src": "undefined",
      "naturalWidth": 0,
      "naturalHeight": 0,
      "alt": "Message",
      "rect": { "x": 655.5, "y": 1366.703125, "width": 76.609375, "height": 28.796875 }
    }
  ],
  "overflowX": 0
}
```

Mobile 390x844 at DPR 3:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "bodyAttrs": { "templateId": "SIMPLIFIED", "templateType": "PDP_MODAL", "consolidated": null },
  "hasProductSlots": true,
  "messageCount": 4,
  "imgs": [
    {
      "src": "undefined",
      "naturalWidth": 0,
      "naturalHeight": 0,
      "alt": "Message",
      "rect": { "x": 31, "y": 1880.46875, "width": 73.078125, "height": 27 }
    }
  ],
  "overflowX": 0
}
```

### WPB Vertical Slots

- Desktop 1280x800: modal opened; `Message` rendered in the picker with a `data:image/svg+xml` placeholder; natural image size was `400x400`; rendered image box was approximately `228.75x190.97`; `Product 1` and `Product 2` slots were present; horizontal overflow was `0`; widget version was `5.0.189`.
- Mobile 390x844 at DPR 3: modal opened; `Message` rendered with the same SVG placeholder; natural image size was `400x400`; rendered image box was approximately `143x119.38`; horizontal overflow was `0`; widget version was `5.0.189`.

## Restore notes

- WPB fixture was restored to its original Vertical Slots setup after the replay.
- EB template was restored to Product Grid and confirmed on storefront after cache-clear hard reload.
- EB product price for `Message` was restored to `0.00`.
- EB category product-picker restore was UI-blocked in this pass; `Message` may still be present in EB Category 1 until removed through the EB product picker.
