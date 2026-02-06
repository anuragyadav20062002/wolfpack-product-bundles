/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays comprehensive bundle pricing breakdown in checkout.
 * Supports both cart-line targets and block targets.
 *
 * Targets:
 * - purchase.checkout.block.render (block - placeable in editor)
 * - purchase.checkout.cart-line-item.render-after (static - per line item)
 * - purchase.thank-you.block.render (block - placeable in editor)
 * - purchase.thank-you.cart-line-item.render-after (static - per line item)
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
  useCartLines,
  useTotalAmount,
  useExtensionApi,
} from '@shopify/ui-extensions/checkout/preact';

interface LineItemAttribute {
  key: string;
  value: string;
}

interface CartLine {
  id: string;
  quantity: number;
  attributes?: LineItemAttribute[];
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

/**
 * Single Bundle Display Component
 * Used by both cart-line and block targets
 */
const BundleDisplay: FunctionComponent<{
  bundleName: string;
  componentCount: number;
  totalRetailCents: number;
  totalBundleCents: number;
  totalSavingsCents: number;
  discountPercent: number;
  components: ComponentDetail[];
  currency: string;
}> = ({
  bundleName,
  componentCount,
  totalRetailCents,
  totalBundleCents,
  totalSavingsCents,
  discountPercent,
  components,
  currency,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatMoney = (cents: number) => {
    const amount = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const hasDiscount = totalSavingsCents > 0 || discountPercent > 0;
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <s-stack direction="block" gap="tight">
      {/* Bundle Name Header */}
      <s-text size="base" emphasis="bold">{bundleName}</s-text>

      {/* Bundle Pricing Summary - only show savings when there is a discount */}
      {hasDiscount && (
        <s-stack direction="block" gap="extraTight">
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
      )}

      {/* No discount - just show bundle label */}
      {!hasDiscount && (
        <s-text size="small" tone="subdued">
          Bundle ({componentCount} items)
        </s-text>
      )}

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
};

/**
 * Parse bundle data from cart line attributes
 */
function parseBundleFromLine(line: CartLine) {
  const attributes = line.attributes ?? [];
  const getAttr = (key: string): string | undefined => {
    return attributes.find((attr) => attr.key === key)?.value;
  };

  const isBundleParent = getAttr('_is_bundle_parent') === 'true';
  if (!isBundleParent) return null;

  const bundleName = getAttr('_bundle_name') || 'Bundle';
  const componentCount = parseInt(getAttr('_bundle_component_count') ?? '0', 10);
  const totalRetailCents = parseInt(getAttr('_bundle_total_retail_cents') ?? '0', 10);
  const totalBundleCents = parseInt(getAttr('_bundle_total_price_cents') ?? '0', 10);
  const totalSavingsCents = parseInt(getAttr('_bundle_total_savings_cents') ?? '0', 10);
  const discountPercent = parseFloat(getAttr('_bundle_discount_percent') ?? '0');

  let components: ComponentDetail[] = [];
  try {
    const componentsJson = getAttr('_bundle_components');
    if (componentsJson) {
      components = JSON.parse(componentsJson);
    }
  } catch (e) {
    console.error('[BundleCheckout] Failed to parse components:', e);
  }

  return {
    bundleName,
    componentCount,
    totalRetailCents,
    totalBundleCents,
    totalSavingsCents,
    discountPercent,
    components,
  };
}

/**
 * Main Extension Component
 * Detects target type and renders appropriately
 */
export const BundlePricingExtension: FunctionComponent = () => {
  const totalAmount = useTotalAmount();
  const currency = totalAmount?.currencyCode ?? 'USD';

  // Try to get cart line target (for cart-line-item targets)
  let lineItem: CartLine | null = null;
  try {
    lineItem = useCartLineTarget() as CartLine | null;
  } catch {
    // Not a cart-line target, will use block mode
  }

  // If we have a line item, render for that specific line (cart-line target)
  if (lineItem) {
    const bundleData = parseBundleFromLine(lineItem);

    // Check for legacy component display
    const attributes = lineItem.attributes ?? [];
    const getAttr = (key: string): string | undefined => {
      return attributes.find((attr) => attr.key === key)?.value;
    };
    const isBundleComponent = getAttr('_is_bundle_component') === 'true';

    if (!bundleData && !isBundleComponent) {
      return null;
    }

    if (bundleData) {
      return (
        <s-stack direction="block" gap="tight">
          <s-divider />
          <BundleDisplay {...bundleData} currency={currency} />
        </s-stack>
      );
    }

    // Legacy component display
    if (isBundleComponent) {
      const retailPriceCents = parseInt(getAttr('_retail_price_cents') ?? '0', 10);
      const bundlePriceCents = parseInt(getAttr('_bundle_price_cents') ?? '0', 10);
      const discountPercent = parseFloat(getAttr('_discount_percent') ?? '0');
      const savingsCents = parseInt(getAttr('_savings_cents') ?? '0', 10);

      if (discountPercent <= 0 || retailPriceCents <= 0) {
        return null;
      }

      const formatMoney = (cents: number) => {
        const amount = cents / 100;
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      };

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
  }

  // Block target mode: show all bundles in the cart
  let cartLines: CartLine[] = [];
  try {
    cartLines = useCartLines() as CartLine[];
  } catch {
    return null;
  }

  if (!cartLines || cartLines.length === 0) {
    return null;
  }

  // Find all bundle parent lines
  const bundles = cartLines
    .map(line => parseBundleFromLine(line))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  if (bundles.length === 0) {
    return null;
  }

  return (
    <s-stack direction="block" gap="base">
      <s-text size="base" emphasis="bold">Bundle Savings</s-text>
      <s-divider />
      {bundles.map((bundle, index) => (
        <s-stack key={index} direction="block" gap="tight">
          <BundleDisplay {...bundle} currency={currency} />
          {index < bundles.length - 1 && <s-divider />}
        </s-stack>
      ))}
    </s-stack>
  );
};
