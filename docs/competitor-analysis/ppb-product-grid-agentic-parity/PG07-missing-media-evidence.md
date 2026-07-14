# PG07 Missing Media Evidence

Date: 2026-07-13
Viewport: `1280x800`

## Reversible fixture

Both stores already contained an active product named `Message` with no media,
but its zero price excluded it from the PPB catalog. Through the authenticated
Shopify Admin UI, its sole variant was temporarily priced at `1` and added to
Step 1 / Category 1 in both bundles.

## EB-first evidence

The cache-bypassed Product Grid runtime remained `PDP_INPAGE + COGNIVE`.
EB rendered the image-less product in a `97.66px` square media frame, but the
image itself had:

```text
src="undefined"
naturalWidth=0
naturalHeight=0
```

Document horizontal overflow remained `0`. This is a live EB defect, not a
usable fallback contract.

## WPB pre-change delta

WPB intended to use `/bundle-product-placeholder.avif`, followed by a PNG on
error. Both paths resolved against the merchant storefront origin rather than
the app or extension origin. The live Vertical Slots picker proved the result:

```text
https://agent-5sfidg3m.myshopify.com/bundle-product-placeholder.avif
naturalWidth=0
```

## Source correction

The shared widget placeholder constants now use one self-contained neutral SVG
data URL. No merchant-origin request, app-proxy request, or extension asset URL
is required. The same value is used for the primary and error fallback paths.

Widget version was bumped from `5.0.163` to `5.0.164`, and all widget bundles
were regenerated.

## Live WPB proof

The cache-bypassed Product Grid runtime remained `PDP_INPAGE + COGNIVE` on
served widget `5.0.164`. The `Message` card reported:

```text
naturalWidth=400
naturalHeight=400
rendered media=108.78x108.78px
object-fit=cover
document horizontal overflow=0
```

WPB deliberately does not reproduce EB's broken `undefined` request. The
accepted contract is a stable square media fallback in the final Grid card.

At `390x844`, EB's broken image remained in a `164.5px` square frame with
`naturalWidth=0`. WPB rendered the decoded fallback in a `163.5px` square frame
with `naturalWidth=400`. Both documents retained zero horizontal overflow.

## Restoration

After the shared Horizontal Slots pass, `Message` was removed from both Step 1
categories and both variants were restored to price `0.00`. Cache-bypassed
storefront product JSON returned numeric price `0` in both stores, and neither
Horizontal Slots page retained `Message` in its bundle catalog.
