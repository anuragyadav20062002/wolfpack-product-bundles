---
title: Shopify Web Pixels
type: shopify-integration
last_audited: 2026-07-11
---

# Shopify Web Pixels

## Settings Payload Gotchas

Shopify validates every configured Web Pixel setting on `webPixelCreate`.
For `single_line_text_field` settings, a blank string can be rejected even when
the extension TOML does not define an explicit `min` validation. On
2026-07-11, `custom_utm_parameters: ""` failed activation with:

```text
[custom_utm_parameters] - can't be blank.
```

Wolfpack sends `custom_utm_parameters: "__none__"` when the merchant has not
configured custom UTM attributes. This keeps the Shopify setting nonblank while
remaining an invalid parameter name for the pixel runtime parser, so no custom
attributes are tracked until the merchant saves real parameter names.

When real custom names exist, `activateUtmPixel` sends them comma-separated,
for example:

```text
utm_influencer,partner_id
```

The runtime parser in `extensions/wolfpack-utm-pixel/src/index.ts` still owns
normalization and safety filtering for captured custom names.
