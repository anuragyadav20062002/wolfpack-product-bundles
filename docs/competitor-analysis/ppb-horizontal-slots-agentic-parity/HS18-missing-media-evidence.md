# HS18 Missing Media Evidence

Date: 2026-07-13

## Fixture

Equivalent active products named `Message`, each with one image-less variant,
were temporarily priced at `1` and added to Step 1 / Category 1 through the
authenticated Shopify and bundle Admin UIs. This is the same reversible fixture
used by Product Grid PG07.

## EB-first baseline

The live runtime remained `PDP_MODAL + MODAL`. In the final Horizontal Slots
picker card, EB emitted `src="undefined"`:

- desktop: `naturalWidth=0`, broken image rendered `76.61x28.80px`;
- mobile `390x844`: `naturalWidth=0`, broken image rendered `73.08x27px`;
- document horizontal overflow: `0` at both viewports.

This is a live EB defect rather than a usable fallback contract.

## WPB correction and proof

The shared widget placeholder now uses a quote-safe, self-contained 400x400 SVG
data URL. Served widget `5.0.164` retained `PDP_MODAL + MODAL` and reported:

- desktop: `naturalWidth=400`, media `232.75x194.31px` inside the responsive card;
- mobile `390x844`: `naturalWidth=400`, media `143x119.38px`;
- document horizontal overflow: `0` at both viewports.

WPB intentionally does not reproduce EB's broken request. The image-less card
retains the same title, price, and action hierarchy while the neutral fallback
occupies the existing media frame.

## Restoration

The temporary product memberships and prices are restored after the shared
Product Grid and Horizontal Slots evidence pass.

Final cache-bypassed storefront verification returned numeric product price `0`
in both stores, removed `Message` from both bundle catalogs, retained
`PDP_MODAL + MODAL`, and reported zero document overflow.
