# HS08 Cart Contract Evidence

Date: 2026-07-13

## Method

Both test-store carts were cleared through their live storefronts. The same valid three-item, 10%-discount bundle state was then added through the rendered Add Bundle to Cart action, EB first and WPB second. Direct Chrome DevTools MCP captured each `/cart/add` request and resulting cart line.

## EB

EB submitted three child variant items through multipart `/cart/add` with:

- `Box=1` on each component;
- `_easyBundle:OfferId=MIX-156854_4KX_{position}`;
- `_easyBundle:prodQty=1`.

Shopify returned one transformed parent line:

- parent product `WPB PPB Product List Parity 2026-07-11`;
- quantity `1`;
- final price `₹1779.30`;
- `_EasyBundleId=MIX-156854`;
- `_originalOfferId=MIX-156854_4KX`;
- `Items` listing the three selected products in slot order;
- `Retail Price=₹1977`;
- `You Save=₹197.70 (10%)`.

## WPB

WPB submitted the equivalent three child variant items through multipart `/cart/add` with:

- `_bundle_display_properties` containing items, retail price, box, and savings;
- sequential `Box` values `1`, `2`, and `3`;
- `_bundleName=PPB Modal Shared Card Test`;
- `_wolfpackProductBundle:OfferId=MIX-{bundleId}_{offerGroup}_{position}`;
- `_wolfpackProductBundle:prodQty=1`;
- the same signed `_wolfpack_bundle_runtime` token on all three components.

The request completed through Shopify and Cart Transform to one parent line:

- parent product `PPB Modal Shared Card Test`;
- quantity `1`;
- final price `$1779.30`;
- `_is_bundle_parent=true`;
- `_bundle_component_count=3`;
- `_bundle_components` containing all three component prices and 10% adjustments;
- total retail `197700` cents;
- total price `177930` cents;
- total savings `19770` cents;
- discount percent `10.00`;
- visible `Items`, `Retail Price`, and `You Save=$197.70 (10%)` properties.

The signed runtime payload was accepted; no invalid-token boundary occurred. The parent line's selected components preserve Step 1/Step 2 slot order.

## Result

HS08 is accepted for validation-gated add, component submission, Cart Transform collapse, parent-line price, discount, item list, offer identity, and runtime metadata. Property namespaces differ intentionally by app; their customer-visible and transform contracts are equivalent.

Both test-store carts were cleared after evidence capture and confirmed at item count `0`.
