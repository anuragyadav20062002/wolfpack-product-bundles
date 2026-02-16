// @ts-nocheck
/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays comprehensive bundle pricing breakdown on cart line items in checkout.
 * Shows bundle as SINGLE parent item with expandable component list.
 *
 * Targets (static - auto-render on each cart line):
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
 *
 * Note: Shopify web components (s-stack, s-text, etc.) have incomplete type
 * definitions in @shopify/ui-extensions. The components work correctly at
 * runtime but TypeScript doesn't recognize all valid props like 'size', 'tone',
 * 'gap', etc. Using @ts-nocheck until Shopify updates types.
 */

import type {FunctionComponent} from 'preact';
import {useState} from 'preact/hooks';
import {
  useCartLineTarget,
  useTotalAmount,
} from '@shopify/ui-extensions/checkout/preact';

interface ComponentDetail {
  title: string;
  quantity: number;
  retailPrice: number;
  bundlePrice: number;
  discountPercent: number;
  savingsAmount: number;
}

// Parse compact array format [title, qty, retailCents, bundleCents, discountPct, savingsCents]
// into ComponentDetail objects. Falls back to legacy object format for backwards compatibility.
function parseComponents(json: string): ComponentDetail[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  // Detect format: compact arrays vs legacy objects
  if (Array.isArray(parsed[0])) {
    return parsed.map((item: any[]) => ({
      title: item[0] || '',
      quantity: item[1] || 0,
      retailPrice: item[2] || 0,
      bundlePrice: item[3] || 0,
      discountPercent: item[4] || 0,
      savingsAmount: item[5] || 0,
    }));
  }

  // Legacy object format
  return parsed.map((item: any) => ({
    title: item.title || '',
    quantity: item.quantity || 0,
    retailPrice: item.retailPrice || 0,
    bundlePrice: item.bundlePrice || 0,
    discountPercent: item.discountPercent || 0,
    savingsAmount: item.savingsAmount || 0,
  }));
}

export const BundlePricingExtension: FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const lineItem = useCartLineTarget();
  const totalAmount = useTotalAmount();

  if (!lineItem) {
    return null;
  }

  const attributes = lineItem.attributes ?? [];

  const getAttr = (key: string): string | undefined => {
    return attributes.find((attr) => attr.key === key)?.value;
  };

  const isBundleParent = getAttr('_is_bundle_parent') === 'true';
  const isBundleComponent = getAttr('_is_bundle_component') === 'true';

  if (!isBundleParent && !isBundleComponent) {
    return null;
  }

  // Use || instead of ?? to catch empty string which would cause Intl.NumberFormat to throw
  const currency = totalAmount?.currencyCode || 'USD';

  const formatMoney = (cents: number) => {
    const amount = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to safely format discount percentage
  const formatPercent = (pct: unknown): string => {
    const num = Number(pct ?? 0);
    return num.toFixed(num % 1 === 0 ? 0 : 2);
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

    let components: ComponentDetail[] = [];
    try {
      const componentsJson = getAttr('_bundle_components');
      if (componentsJson) {
        components = parseComponents(componentsJson);
      }
    } catch (e) {
      // JSON parse failed — likely truncated attribute value
    }

    const hasDiscount = totalSavingsCents > 0 || discountPercent > 0;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
      <s-stack direction="block" gap="tight">
        <s-divider />

        {/* Bundle Summary Header */}
        <s-stack direction="block" gap="extraTight">
          {/* Bundle Pricing Summary - only show savings when there is a discount */}
          {hasDiscount && (
            <>
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
                  {formatPercent(discountPercent)}%
                </s-badge>
              </s-stack>

              <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                <s-text size="small" tone="subdued">Exact Savings:</s-text>
                <s-text size="small" emphasis="bold" tone="success">
                  {formatMoney(totalSavingsCents)}
                </s-text>
              </s-stack>
            </>
          )}

          {/* No discount - just show bundle label */}
          {!hasDiscount && (
            <s-text size="small" tone="subdued">
              Bundle ({componentCount} items)
            </s-text>
          )}
        </s-stack>

        {/* Expandable Component List Toggle */}
        {components.length > 0 && (
          <s-stack direction="block" gap="extraTight">
            <s-pressable onPress={toggleExpand}>
              <s-stack direction="inline" gap="tight" inline-alignment="start">
                <s-text size="small" tone="subdued">
                  {isExpanded ? `Hide ${components.length} Items ▲` : `Show ${components.length} Items ▼`}
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
                        {component.quantity}x {component.title || `Item ${index + 1}`}
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
                          {formatPercent(component.discountPercent)}%
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
              {formatPercent(discountPercent)}%
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
