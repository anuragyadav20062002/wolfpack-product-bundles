/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays comprehensive bundle pricing breakdown on cart line items in checkout.
 * Shows bundle as SINGLE parent item with expandable component list.
 *
 * Targets:
 * - purchase.checkout.cart-line-item.render-after
 * - purchase.thank-you.cart-line-item.render-after
 *
 * Reads attributes set by Cart Transform:
 * - _is_bundle_parent: "true" (bundle parent item)
 * - _bundle_name: Bundle name
 * - _bundle_component_count: Number of components
 * - _bundle_components: JSON array of component details
 * - _bundle_total_retail_cents: Total retail price in cents
 * - _bundle_total_price_cents: Total bundle price in cents
 * - _bundle_total_savings_cents: Total savings in cents
 * - _bundle_discount_percent: Overall discount percentage
 */

import type {FunctionComponent} from 'preact';
import {useState} from 'preact/hooks';
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

interface ComponentDetail {
  variantId: string;
  title: string;
  quantity: number;
  retailPrice: number;
  bundlePrice: number;
  discountPercent: number;
  savingsAmount: number;
}

export const BundlePricingExtension: FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Check if this is a bundle parent (Flex Bundles style)
  const isBundleParent = getAttr('_is_bundle_parent') === 'true';

  // Also support legacy component-level display
  const isBundleComponent = getAttr('_is_bundle_component') === 'true';

  if (!isBundleParent && !isBundleComponent) {
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

  // ================================================================
  // FLEX BUNDLES STYLE: Bundle Parent with Expandable Components
  // ================================================================
  if (isBundleParent) {
    const bundleName = getAttr('_bundle_name') || 'Bundle';
    const componentCount = parseInt(getAttr('_bundle_component_count') ?? '0', 10);
    const totalRetailCents = parseInt(getAttr('_bundle_total_retail_cents') ?? '0', 10);
    const totalBundleCents = parseInt(getAttr('_bundle_total_price_cents') ?? '0', 10);
    const totalSavingsCents = parseInt(getAttr('_bundle_total_savings_cents') ?? '0', 10);
    const discountPercent = parseFloat(getAttr('_bundle_discount_percent') ?? '0');

    // Parse component details
    let components: ComponentDetail[] = [];
    try {
      const componentsJson = getAttr('_bundle_components');
      if (componentsJson) {
        components = JSON.parse(componentsJson);
      }
    } catch (e) {
      console.error('[BundleCheckout] Failed to parse components:', e);
    }

    // If no discount/savings, don't show breakdown
    if (totalSavingsCents <= 0 && discountPercent <= 0) {
      return null;
    }

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
      <s-stack direction="block" gap="tight">
        <s-divider />

        {/* Bundle Summary Header */}
        <s-stack direction="block" gap="extraTight">
          {/* Bundle Pricing Summary */}
          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Retail Price:</s-text>
            <s-text size="small" tone="subdued" strikethrough>
              {formatMoney(totalRetailCents)}
            </s-text>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small">Bundle Price:</s-text>
            <s-text size="small" emphasis="bold">
              {formatMoney(totalBundleCents)}
            </s-text>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Percentage Savings:</s-text>
            <s-badge tone="success">
              {discountPercent.toFixed(discountPercent % 1 === 0 ? 0 : 2)}%
            </s-badge>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Exact Savings:</s-text>
            <s-text size="small" emphasis="bold" tone="success">
              {formatMoney(totalSavingsCents)}
            </s-text>
          </s-stack>
        </s-stack>

        {/* Expandable Component List Toggle */}
        {components.length > 0 && (
          <s-stack direction="block" gap="extraTight">
            <s-pressable onPress={toggleExpand}>
              <s-stack direction="inline" gap="tight" inline-alignment="start">
                <s-text size="small" tone="subdued">
                  {isExpanded ? `Hide ${componentCount} Items ▲` : `Show ${componentCount} Items ▼`}
                </s-text>
              </s-stack>
            </s-pressable>

            {/* Expanded Component Details */}
            {isExpanded && (
              <s-stack direction="block" gap="extraTight">
                {components.map((component, index) => (
                  <s-stack key={index} direction="block" gap="none">
                    <s-divider />
                    <s-stack direction="block" gap="none">
                      <s-text size="small" emphasis="bold">
                        {component.quantity}x Item {index + 1}
                      </s-text>
                      <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                        <s-text size="small" tone="subdued">Retail Price:</s-text>
                        <s-text size="small" tone="subdued">
                          {formatMoney(component.retailPrice)}
                        </s-text>
                      </s-stack>
                      <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                        <s-text size="small" tone="subdued">Bundle Price:</s-text>
                        <s-text size="small">
                          {formatMoney(component.bundlePrice)}
                        </s-text>
                      </s-stack>
                      <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                        <s-text size="small" tone="subdued">Percentage Savings:</s-text>
                        <s-text size="small" tone="success">
                          {component.discountPercent.toFixed(component.discountPercent % 1 === 0 ? 0 : 2)}%
                        </s-text>
                      </s-stack>
                      <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                        <s-text size="small" tone="subdued">Exact Savings:</s-text>
                        <s-text size="small" tone="success">
                          {formatMoney(component.savingsAmount)}
                        </s-text>
                      </s-stack>
                    </s-stack>
                  </s-stack>
                ))}
              </s-stack>
            )}
          </s-stack>
        )}
      </s-stack>
    );
  }

  // ================================================================
  // LEGACY: Individual Component Display (backwards compatibility)
  // ================================================================
  if (isBundleComponent) {
    const retailPriceCents = parseInt(getAttr('_retail_price_cents') ?? '0', 10);
    const bundlePriceCents = parseInt(getAttr('_bundle_price_cents') ?? '0', 10);
    const discountPercent = parseFloat(getAttr('_discount_percent') ?? '0');
    const savingsCents = parseInt(getAttr('_savings_cents') ?? '0', 10);

    if (discountPercent <= 0 || retailPriceCents <= 0) {
      return null;
    }

    return (
      <s-stack direction="block" gap="extraTight">
        <s-divider />
        <s-stack direction="block" gap="none">
          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Retail Price:</s-text>
            <s-text size="small" tone="subdued" strikethrough>
              {formatMoney(retailPriceCents)}
            </s-text>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small">Bundle Price:</s-text>
            <s-text size="small" emphasis="bold">
              {formatMoney(bundlePriceCents)}
            </s-text>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Percentage Savings:</s-text>
            <s-badge tone="success">
              {discountPercent.toFixed(discountPercent % 1 === 0 ? 0 : 2)}%
            </s-badge>
          </s-stack>

          <s-stack direction="inline" gap="tight" inline-alignment="space-between">
            <s-text size="small" tone="subdued">Exact Savings:</s-text>
            <s-text size="small" emphasis="bold" tone="success">
              {formatMoney(savingsCents)}
            </s-text>
          </s-stack>
        </s-stack>
      </s-stack>
    );
  }

  return null;
};
