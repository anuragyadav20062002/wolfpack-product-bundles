/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays comprehensive bundle pricing breakdown on cart line items in checkout.
 * Shows: Retail Price, Bundle Price, Percentage Savings, Exact Savings
 *
 * Targets:
 * - purchase.checkout.cart-line-item.render-after
 * - purchase.thank-you.cart-line-item.render-after
 *
 * Reads attributes set by Cart Transform:
 * - _is_bundle_component: "true"
 * - _bundle_name: Bundle name
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
  quantity?: number;
  merchandise?: {
    title?: string;
  };
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

  // Helper to get attribute value
  const getAttr = (key: string): string | undefined => {
    return attributes.find((attr) => attr.key === key)?.value;
  };

  // Check if this is a bundle component
  const isBundleComponent = getAttr('_is_bundle_component') === 'true';

  if (!isBundleComponent) {
    // Not a bundle component, don't render anything
    return null;
  }

  // Extract pricing attributes
  const retailPriceCents = parseInt(getAttr('_retail_price_cents') ?? '0', 10);
  const bundlePriceCents = parseInt(getAttr('_bundle_price_cents') ?? '0', 10);
  const discountPercent = parseFloat(getAttr('_discount_percent') ?? '0');
  const savingsCents = parseInt(getAttr('_savings_cents') ?? '0', 10);

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const retailPrice = formatMoney(retailPriceCents);
  const bundlePrice = formatMoney(bundlePriceCents);
  const savings = formatMoney(savingsCents);
  const discountDisplay = discountPercent.toFixed(discountPercent % 1 === 0 ? 0 : 2);

  // Flex Bundles-style detailed breakdown using Shopify web components
  return (
    <s-stack direction="block" gap="extraTight">
      <s-divider />
      <s-stack direction="block" gap="none">
        {/* Retail Price */}
        <s-stack direction="inline" gap="tight" inline-alignment="space-between">
          <s-text size="small" tone="subdued">Retail Price:</s-text>
          <s-text size="small" tone="subdued" strikethrough>
            {retailPrice}
          </s-text>
        </s-stack>

        {/* Bundle Price */}
        <s-stack direction="inline" gap="tight" inline-alignment="space-between">
          <s-text size="small">Bundle Price:</s-text>
          <s-text size="small" emphasis="bold">
            {bundlePrice}
          </s-text>
        </s-stack>

        {/* Percentage Savings */}
        <s-stack direction="inline" gap="tight" inline-alignment="space-between">
          <s-text size="small" tone="subdued">Percentage Savings:</s-text>
          <s-badge tone="success">{discountDisplay}%</s-badge>
        </s-stack>

        {/* Exact Savings */}
        <s-stack direction="inline" gap="tight" inline-alignment="space-between">
          <s-text size="small" tone="subdued">Exact Savings:</s-text>
          <s-text size="small" emphasis="bold" tone="success">
            {savings}
          </s-text>
        </s-stack>
      </s-stack>
    </s-stack>
  );
};
