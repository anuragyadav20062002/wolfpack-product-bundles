# HSS4 No-Discount State Evidence

Date: 2026-07-13

## Fixture transition

The known 2-item 5% and 3-item 10% rules were preserved in both Admin forms.
Only each bundle's master Discount & Pricing toggle was disabled and saved through
the authenticated Admin UI. EB was changed and inspected first.

EB's confirmed save payload retained the rule array while setting
`discountConfiguration.isDiscountEnabled=false`. WPB's fresh app-proxy response
likewise retained its rules while returning `pricing.enabled=false`.

## EB

At 360 x 800, the cache-bypassed Horizontal Slots replay selected two Step 1
products and one Step 2 product. EB rendered:

- original subtotal and final total `₹1977`;
- enabled final `Add Bundle to Cart • ₹1977`;
- no discount progress, success copy, strike price, or percent label;
- zero document horizontal overflow.

## WPB delta on 5.0.159

WPB's proxy correctly returned `pricing.enabled=false`, but the modal's progress
path still consumed the retained rule array through
`PricingCalculator.getNextDiscountRule()`. After selection, WPB incorrectly
rendered 5%/10% messaging despite the disabled master toggle.

## Source correction

`PricingCalculator.getNextDiscountRule()` now returns `null` whenever pricing is
disabled, matching the existing disabled guard in `calculateDiscount()`. This is
the shared calculation boundary used by product-page and full-page progress
surfaces, so retained merchant rules remain inert until the master toggle is
enabled again.

The focused pricing suite was developed red-green and now includes the disabled
pricing plus retained rules case.

## Live WPB proof on 5.0.160

The cache-bypassed replay produced:

- Step 1 footer `$1448.00`, count `2`, with no discount line;
- Step 2 footer `$1977.00`, count `3`, with no discount line;
- enabled final `Add Bundle to Cart • $1977.00`;
- no visible discount/progress nodes;
- zero document horizontal overflow.

## Restoration

All selected products were removed. Both master discount toggles were re-enabled
and saved through their Admin UIs. Fresh live proof returned EB
`isDiscountEnabled=true`, WPB proxy `pricing.enabled=true`, widget `5.0.160`, and
the initial empty two-plus-one Horizontal Slots state on both fixtures.

## Result

HSS4 is accepted. Disabled pricing now keeps saved rules dormant across totals,
progress messaging, final CTA content, and shared template consumers.
