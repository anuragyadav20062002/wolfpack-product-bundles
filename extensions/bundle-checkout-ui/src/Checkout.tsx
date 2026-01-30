/**
 * Bundle Checkout UI Extension
 *
 * Displays bundle pricing breakdown on cart line items in checkout.
 * Shows retail price, discount percentage badge, and savings.
 *
 * Targets:
 * - purchase.checkout.cart-line-item.render-after
 * - purchase.thank-you.cart-line-item.render-after
 *
 * Reads attributes set by Cart Transform:
 * - _is_bundle_component: "true"
 * - _retail_price_cents: Original price in cents
 * - _bundle_price_cents: Discounted price in cents
 * - _discount_percent: Discount percentage
 * - _savings_cents: Savings amount in cents
 */

import type {FunctionComponent} from 'preact';
import {
  useCartLineTarget,
  useTotalAmount,
} from '@shopify/ui-extensions/checkout/preact';

interface LineItemAttribute {
  key: string;
  value: string;
}

interface LineItemWithAttributes {
  attributes?: LineItemAttribute[];
}

export const BundlePricingExtension: FunctionComponent = () => {
  // Get the cart line item using the Preact hook
  const lineItem = useCartLineTarget() as LineItemWithAttributes | null;
  const totalAmount = useTotalAmount();

  if (!lineItem) {
    return null;
  }

  // Get attributes from the cart line
  const attributes: LineItemAttribute[] = lineItem.attributes ?? [];

  // Check if this is a bundle component
  const isBundleComponent = attributes.find(
    (attr) => attr.key === '_is_bundle_component' && attr.value === 'true',
  );

  if (!isBundleComponent) {
    // Not a bundle component, don't render anything
    return null;
  }

  // Extract pricing attributes
  const retailPriceCents = parseInt(
    attributes.find((attr) => attr.key === '_retail_price_cents')?.value ?? '0',
    10,
  );
  const discountPercent = parseFloat(
    attributes.find((attr) => attr.key === '_discount_percent')?.value ?? '0',
  );
  const savingsCents = parseInt(
    attributes.find((attr) => attr.key === '_savings_cents')?.value ?? '0',
    10,
  );

  // If no discount, don't show the pricing breakdown
  if (discountPercent <= 0 || retailPriceCents <= 0) {
    return null;
  }

  // Get currency from checkout cost
  const currency = totalAmount?.currencyCode ?? 'USD';

  // Format prices using the shop's currency
  const formatMoney = (cents: number) => {
    const amount = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const retailPrice = formatMoney(retailPriceCents);
  const savings = formatMoney(savingsCents);

  return (
    <s-stack direction="inline" gap="small">
      <s-text tone="neutral">Was {retailPrice}</s-text>
      <s-badge tone="critical">-{Math.round(discountPercent)}%</s-badge>
      <s-text tone="success">Save {savings}</s-text>
    </s-stack>
  );
};